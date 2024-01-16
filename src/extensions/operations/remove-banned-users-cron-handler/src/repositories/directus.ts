import { OperationContext } from '@directus/types';
import { DirectusUser } from '../types';

export const getDirectusUsers = async ({ services, database, getSchema }: OperationContext): Promise<DirectusUser[]> => {
	const { ItemsService } = services;

	const usersService = new ItemsService('directus_users', {
		schema: await getSchema({ database }),
		knex: database,
	});

	const result = await usersService.readByQuery({}) as DirectusUser[];
	return result;
};

export const deleteUser = async (user: DirectusUser, { services, database, getSchema }: OperationContext) => {
	const { UsersService } = services;

	const usersService = new UsersService({
		schema: await getSchema({ database }),
		knex: database,
	});

	const result = await usersService.deleteOne(user.id) as string[];
	return result[0];
};

export const deleteCredits = async (user: DirectusUser, { services, database, getSchema }: OperationContext) => {
	const { ItemsService } = services;

	const usersService = new ItemsService('credits', {
		schema: await getSchema({ database }),
		knex: database,
	});

	const result = await usersService.deleteByQuery({ filter: { githubId: user.external_identifier } }) as string[];
	return result;
};
