import type { HookExtensionContext } from '@directus/extensions';
import { defineHook } from '@directus/extensions-sdk';
import axios from 'axios';

import { normalizeCityName } from './normalize-city';

type AdoptedProbe = {
	city: string | null;
	latitude: string | null;
	longitude: string | null;
	country: string | null;
	isCustomCity: boolean;
};

type Fields = Partial<AdoptedProbe>;

type GeonamesResponse = {
	totalResultsCount: number;
	geonames: {
		lng: string;
		geonameId: number;
		countryCode: string;
		name: string;
		toponymName: string;
		lat: string;
		fcl: string;
		fcode: string;
}[];
}

export default defineHook(({ filter }, context) => {
	filter('adopted_probes.items.update', async (updateFields, { keys }) => {
		const fields = updateFields as Fields;

		if (fields.city === null) { // city value was cleared => resetting
			await resetCity(fields, keys, context);
		} else if (fields.city) {
			await updateCity(fields, keys, context);
		}
	});
});

const resetCity = async (fields: Fields, keys: string[], { services, database, getSchema }: HookExtensionContext) => {
	const { ItemsService } = services;

	const adoptedProbesService = new ItemsService('adopted_probes', {
		database,
		schema: await getSchema(),
	});

	await adoptedProbesService.updateMany(keys, { // These fields are updated separately by BE, because user operation doesn't have permissions to edit them.
		latitude: null,
		longitude: null,
		isCustomCity: false,
	});

	fields.city = null;
};

const updateCity = async (fields: Fields, keys: string[], { env, services, database, getSchema }: HookExtensionContext) => {
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

	if (!country) {
		throw new Error('Country is not defined. Wait for the probe data to be synced with globalping.');
	}

	const allInSameCountry = currentProbes.every(currentProbe => currentProbe.country === country);

	if (!allInSameCountry) {
		throw new Error('Some of the adopted probes are in different countries. Update the list of items you want to edit.');
	}

	const response = await axios<GeonamesResponse>(`http://api.geonames.org/searchJSON?featureClass=P&style=short&isNameRequired=true&maxRows=1&username=${env.GEONAMES_USERNAME}&country=${country}&q=${fields.city}`);

	const cities = response.data.geonames;

	if (cities.length === 0) {
		throw new Error('No valid cities found. Please check "city" and "country" values. Validation algorithm can be checked here: https://www.geonames.org/advanced-search.html?featureClass=P');
	}

	const city = cities[0]!;

	await adoptedProbesService.updateMany(keys, { // These fields are updated separately by BE, because user operation doesn't have permissions to edit them.
		latitude: city.lat,
		longitude: city.lng,
		isCustomCity: true,
	});

	fields.city = normalizeCityName(city.toponymName);
};
