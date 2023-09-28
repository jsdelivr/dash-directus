import TTLCache from '@isaacs/ttlcache';
import { createError } from '@directus/errors';
import { defineEndpoint } from '@directus/extensions-sdk';

const ForbiddenError = createError('FORBIDDEN', 'You need to be authenticated to access this endpoint', 403);
const InvalidIpError = createError('INVALID_PAYLOAD_ERROR', 'IP is not valid', 400);
const InvalidCodeError = createError('INVALID_PAYLOAD_ERROR', 'Code is not valid', 400);

type Request = {
	accountability?: {
		user: string | null;
	}
};

const codes = new TTLCache<string, {ip: string, code: string}>({ ttl: 30 * 60 * 1000 });

const generateRandomCode = () => {
	const randomNumber = Math.floor(Math.random() * 1000000);
	const randomCode = randomNumber.toString().padStart(6, '0');
	return randomCode;
};

export default defineEndpoint((router) => { // need to secure from brootforce here
	router.post('/send-code', async (req, res) => {
		const userId = (req as Request)?.accountability?.user;

		if (!userId) {
			throw new ForbiddenError();
		}

		const ip = req.body?.ip;

		if (!ip) { // validate that string is ip here
			throw new InvalidIpError();
		}

		const code = generateRandomCode();

		try {
			codes.set(userId, { ip, code });

			await fetch('https://webhook.site/bee85cd1-e49a-429a-a145-2c9d03e1ae2c', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ ip, code }),
			});

			res.send('Code was successfully sent to the probe.');
		} catch (error: unknown) {
			res.status(500);
			res.send(error instanceof Error ? error.message : 'Internal Server Error');
		}
	});

	router.post('/verify-code', (req, res) => { // need to secure from brootforce here
		const userId = (req as Request)?.accountability?.user;

		if (!userId) {
			throw new ForbiddenError();
		}

		const userCode = req.body?.code && req.body?.code.replaceAll(' ', '');

		if (!userCode) {
			throw new InvalidCodeError();
		}

		try {
			const code = codes.get(userId);

			if (!code || code.code !== userCode) {
				throw new InvalidCodeError(); // fix different error formats here
			}

			// assign probe to user here

			codes.delete(userId);
			res.send('Code successfully validated. Probe was assigned to you.');
		} catch (error: unknown) {
			res.status(500);
			res.send(error instanceof Error ? error.message : 'Internal Server Error');
		}
	});
});
