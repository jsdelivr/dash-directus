import { OperationContext } from '@directus/types';

type AddItemData = {
	githubLogin: string;
	github_id: string;
	monthlyAmount: number;
	lastEarningDate: string;
}

type Context = {
	services: OperationContext['services'],
	database: OperationContext['database'],
	getSchema: OperationContext['getSchema'],
};

export const addSponsor = async ({ githubLogin, github_id, monthlyAmount, lastEarningDate }: AddItemData, { services, database, getSchema }: Context) => {
	const { ItemsService } = services;

	const sponsorsService = new ItemsService('sponsors', {
		schema: await getSchema({ database }),
		knex: database,
	});

	const result = await sponsorsService.createOne({
		githubLogin,
		github_id,
		monthlyAmount,
		lastEarningDate,
	});
	return result;
};

type UpdateItemData = {
	github_id: string;
	monthlyAmount: number;
}

export const updateSponsor = async ({ github_id, monthlyAmount }: UpdateItemData, { services, database, getSchema }: Context) => {
	const { ItemsService } = services;

	const sponsorsService = new ItemsService('sponsors', {
		schema: await getSchema({ database }),
		knex: database,
	});

	const result = await sponsorsService.updateByQuery({ filter: { github_id } }, { monthlyAmount });
	return result;
};
