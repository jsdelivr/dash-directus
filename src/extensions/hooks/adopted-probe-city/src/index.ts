import type { HookExtensionContext } from '@directus/extensions';
import { defineHook } from '@directus/extensions-sdk';
import axios from 'axios';

import { normalizeCityName } from './normalize-city';

type AdoptedProbe = {
	city: string;
	country: string;
	isCustomCity: boolean;
};

type Fields = Partial<AdoptedProbe>;

export default defineHook(({ filter }, { env, services, database, getSchema }) => {
	filter('adopted_probes.items.update', async (updateFields, { keys }) => {
		const fields = updateFields as Fields;

		if (fields.city === null) { // city value was cleared => resetting
			fields.isCustomCity = false;
		} else if (fields.city) {
			await updateCity(fields, keys, { env, services, database, getSchema });
			fields.isCustomCity = true;
		}
	});
});

type TierChangedActionArgs = {
	env: HookExtensionContext['env'];
	services: HookExtensionContext['services'];
	database: HookExtensionContext['database'];
	getSchema: HookExtensionContext['getSchema'];
};

const updateCity = async (fields: Fields, keys: string[], { env, services, database, getSchema }: TierChangedActionArgs) => {
	const { ItemsService } = services;

	const adoptedProbesService = new ItemsService('adopted_probes', {
		database,
		schema: await getSchema(),
	});

	const currentProbes = await adoptedProbesService.readMany(keys) as AdoptedProbe[];

	if (!currentProbes || currentProbes.length === 0) {
		throw new Error('Adopted probes not found');
	}

	const country = currentProbes[0]!.country;

	const allInSameCountry = currentProbes.every(currentProbe => currentProbe.country === country);

	if (!allInSameCountry) {
		throw new Error('Some of the adopted probes are in different countries. Update the list of items you want to edit.');
	}

	const response = await axios(`http://api.geonames.org/searchJSON?featureClass=P&style=short&isNameRequired=true&maxRows=1&username=${env.GEONAMES_USERNAME}&country=${country}&q=${fields.city}`);

	const cities = response.data.geonames;

	if (cities.length === 0) {
		throw new Error('No valid cities found. Please check "city" and "country" values. Validation algorithm can be checked here: https://www.geonames.org/advanced-search.html?featureClass=P');
	}

	fields.city = normalizeCityName(cities[0].toponymName);
};
