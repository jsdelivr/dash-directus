import type { OperationContext } from '@directus/extensions';

export type AdoptedProbe = {
	id: number;
	ip: string;
	onlineTimesToday: number;
}

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
	const { ItemsService } = services;

	const creditsService = new ItemsService('credits', {
		schema: await getSchema({ database }),
		knex: database,
	});

	const result = await creditsService.createMany(adoptedProbes.map(adoptedProbe => ({
		githubId: 'id',
		credits: parseInt(env.CREDITS_PER_ADOPTED_PROBE_DAY, 10),
		comment: `For adopted probe with ip ${adoptedProbe.ip}`,
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
