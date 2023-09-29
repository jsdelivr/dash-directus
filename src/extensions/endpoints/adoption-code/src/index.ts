import type { Request as ExpressRequest } from 'express';
import axios from 'axios';
import TTLCache from '@isaacs/ttlcache';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { createError, isDirectusError } from '@directus/errors';
import { defineEndpoint } from '@directus/extensions-sdk';
import Joi from 'joi';

type Request = ExpressRequest & {
	accountability: {
		user: string;
	},
	schema: object,
};

const InvalidCodeError = createError('INVALID_PAYLOAD_ERROR', 'Code is not valid', 400);
const TooManyRequestsError = createError('TOO_MANY_REQUESTS', 'Too many requests', 429);

const rateLimiter = new RateLimiterMemory({
	points: 20,
	duration: 30 * 60,
});

const codes = new TTLCache<string, {ip: string, code: string}>({ ttl: 30 * 60 * 1000 });

const generateRandomCode = () => {
	const randomNumber = Math.floor(Math.random() * 1000000);
	const randomCode = randomNumber.toString().padStart(6, '0');
	return randomCode;
};

const sendCodeSchema = Joi.object<Request>({
	accountability: Joi.object({
		user: Joi.string().required(),
	}).required().unknown(true),
	body: Joi.object({
		ip: Joi.string().ip().required(),
	}).required(),
}).unknown(true);

export default defineEndpoint((router, { env, logger, services }) => {
	router.post('/send-code', async (req, res) => {
		try {
			const { value, error } = sendCodeSchema.validate(req);

			if (error) {
				throw new (createError('INVALID_PAYLOAD_ERROR', error.message, 400))();
			}

			const userId = value.accountability.user;
			const ip = value.body.ip as string;

			await rateLimiter.consume(userId, 1).catch(() => { throw new TooManyRequestsError(); });

			const code = generateRandomCode();
			codes.set(userId, { ip, code });

			const response = await axios.post(`${env.GP_SEND_CODE_ENDPOINT}?adminkey=${env.GP_ADMIN_KEY}`, {
				ip,
				code,
			});

			if (response.status !== 200) {
				throw new Error('Globalping response is non-200.');
			}

			res.send('Code was successfully sent to the probe.');
		} catch (error: unknown) {
			logger.error(error);

			if (isDirectusError(error)) {
				res.status(error.status).send(error.message);
			} else {
				res.status(500).send('Internal Server Error');
			}
		}
	});

	const verifyCodeSchema = Joi.object<Request>({
		accountability: Joi.object({
			user: Joi.string().required(),
		}).required().unknown(true),
		body: Joi.object({
			code: Joi.string().required(),
		}).required(),
	}).unknown(true);

	router.post('/verify-code', async (req, res) => {
		try {
			const { value, error } = verifyCodeSchema.validate(req);

			if (error) {
				throw new (createError('INVALID_PAYLOAD_ERROR', error.message, 400))();
			}

			const userId = value.accountability.user;
			const userCode = value.body.code.replaceAll(' ', '');

			await rateLimiter.consume(userId, 1).catch(() => { throw new TooManyRequestsError(); });

			const code = codes.get(userId);

			if (!code || code.code !== userCode) {
				throw new InvalidCodeError();
			}

			const itemsService = new services.ItemsService('adopted_probes', {
				schema: value.schema,
			});

			await itemsService.createOne({
				ip: code.ip,
				userId,
			});

			codes.delete(userId);
			rateLimiter.delete(userId);
			res.send('Code successfully validated. Probe was assigned to you.');
		} catch (error: unknown) {
			logger.error(error);

			if (isDirectusError(error)) {
				res.status(error.status).send(error.message);
			} else {
				res.status(500).send('Internal Server Error');
			}
		}
	});
});
