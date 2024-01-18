import Joi, { type CustomHelpers } from 'joi';
import { createError } from '@directus/errors';
import { Token } from '../index.js';

const validateOrigin = (value: string, helpers: CustomHelpers) => {
	try {
		new URL(value);
		return value;
	} catch (err) {
		return helpers.message({ custom: `Invalid URL: ${value}` });
	}
};

const tokenSchema = Joi.object({
	origins: Joi.array().items(Joi.string().custom(validateOrigin)),
}).unknown(true);

export const validateToken = (token: Partial<Token>) => {
	const { error } = tokenSchema.validate(token);

	if (error) {
		throw new (createError('INVALID_PAYLOAD_ERROR', error.message, 400))();
	}
};
