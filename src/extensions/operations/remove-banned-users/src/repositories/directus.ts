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

export const deleteUser = async (githubId: DirectusUser['external_identifier'], { services, database, getSchema }: OperationContext) => {
	const { ItemsService } = services;

	const creditsService = new ItemsService('credits', {
		schema: await getSchema({ database }),
		knex: database,
	});

	const result = await creditsService.deleteByQuery({ filter: { githubId } });
	return result;
};
