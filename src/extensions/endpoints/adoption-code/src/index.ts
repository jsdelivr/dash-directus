import type { Request as ExpressRequest } from 'express';
import TTLCache from '@isaacs/ttlcache';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { createError, isDirectusError } from '@directus/errors';
import { defineEndpoint } from '@directus/extensions-sdk';
import { isIP } from 'net';

type Request = ExpressRequest & {
	accountability?: {
		user: string | null;
	},
	schema: object,
};

const ForbiddenError = createError('FORBIDDEN', 'You need to be authenticated to access this endpoint', 403);
const InvalidIpError = createError('INVALID_PAYLOAD_ERROR', 'IP is not valid', 400);
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

export default defineEndpoint((router, { env, logger, services }) => {
	router.post('/send-code', async (req, res) => {
		try {
			const userId = (req as Request)?.accountability?.user;

			if (!userId) {
				throw new ForbiddenError();
			}

			const ip = req.body?.ip;

			if (!ip || isIP(ip) === 0) {
				throw new InvalidIpError();
			}

			await rateLimiter.consume(userId, 1).catch(() => { throw new TooManyRequestsError(); });

			const code = generateRandomCode();
			codes.set(userId, { ip, code });

			await fetch(`${env.GP_SEND_CODE_ENDPOINT}?adminkey=${env.GP_ADMIN_KEY}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ ip, code }),
			});

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

	router.post('/verify-code', async (request, res) => {
		try {
			const req = request as unknown as Request;
			const userId = req?.accountability?.user;

			if (!userId) {
				throw new ForbiddenError();
			}

			const userCode = req.body?.code && req.body?.code.replaceAll(' ', '');

			if (!userCode) {
				throw new InvalidCodeError();
			}

			await rateLimiter.consume(userId, 1).catch(() => { throw new TooManyRequestsError(); });

			const code = codes.get(userId);

			if (!code || code.code !== userCode) {
				throw new InvalidCodeError();
			}

			const itemsService = new services.ItemsService('adopted_probes', {
				schema: req.schema,
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
