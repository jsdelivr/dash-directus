import type { OperationContext } from '@directus/extensions';

type AdoptedProbe = {
	id: number;
	ip: string;
	onlineTimesToday: number;
	userId: string;
}

type User = {
	id: string;
	external_identifier: string;
};

export const getAdoptedProbes = async ({ services, database, getSchema }: OperationContext) => {
	const { ItemsService } = services;

	const itemsService = new ItemsService('adopted_probes', {
		schema: await getSchema({ database }),
		knex: database,
	});

	const result = await itemsService.readByQuery({}) as AdoptedProbe[];
	return result;
};

export const addCredits = async (adoptedProbes: AdoptedProbe[], { services, database, getSchema, env }: OperationContext) => {
	if (adoptedProbes.length === 0) {
		return [];
	}

	const { ItemsService } = services;

	const creditsService = new ItemsService('credits', {
		schema: await getSchema({ database }),
		knex: database,
	});

	const usersService = new ItemsService('directus_users', {
		schema: await getSchema({ database }),
		knex: database,
	});

	const users = await usersService.readMany(adoptedProbes.map(({ userId }) => userId)) as User[];
	const usersMap = new Map(users.map(user => [ user.id, user ]));

	const result = await creditsService.createMany(adoptedProbes.map(({ userId, ip }) => ({
		githubId: usersMap.get(userId)?.external_identifier,
		credits: parseInt(env.CREDITS_PER_ADOPTED_PROBE_DAY, 10),
		comment: `For adopted probe with ip ${ip}`,
	}))) as number[];

	return result;
};

export const resetOnlineTimes = async ({ services, database, getSchema }: OperationContext) => {
	const { ItemsService } = services;

	const itemsService = new ItemsService('adopted_probes', {
		schema: await getSchema({ database }),
		knex: database,
	});

	await itemsService.updateByQuery({}, { onlineTimesToday: 0 }, { emitEvents: false });
};
