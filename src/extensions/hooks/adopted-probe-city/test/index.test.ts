/* eslint-disable @typescript-eslint/no-explicit-any */
import nock from 'nock';
import { expect } from 'chai';
import * as sinon from 'sinon';
import hook, { CountryNotDefinedError, DifferentCountriesError, InvalidCityError, ProbesNotFoundError } from '../src/index.js';

const callbacks = {};
const hooks = {
	filter: (name, cb) => {
		callbacks[name] = cb;
	},
} as any;
const updateMany = sinon.stub();
const readMany = sinon.stub();
const context = {
	env: {
		GEONAMES_USERNAME: 'username',
	},
	database: {},
	getSchema: () => Promise.resolve({}),
	services: {
		ItemsService: sinon.stub().callsFake(() => {
			return { updateMany, readMany };
		}),
	},
} as any;

describe('adopted-probe-city hook', () => {
	before(() => {
		nock.disableNetConnect();
	});

	beforeEach(() => {
		sinon.resetHistory();
	});

	after(() => {
		nock.cleanAll();
	});

	it('should update city, lat and long of the adopted probe', async () => {
		readMany.resolves([{
			city: 'Paris',
			latitude: '48.85341',
			longitude: '2.3488',
			country: 'FR',
			isCustomCity: false,
		}]);

		nock('http://api.geonames.org').get('/searchJSON?featureClass=P&style=medium&isNameRequired=true&maxRows=1&username=username&country=FR&q=marsel')
			.reply(200, {
				totalResultsCount: 5,
				geonames: [
					{
						lng: '5.38107',
						geonameId: 2995469,
						countryCode: 'FR',
						name: 'Marseille',
						toponymName: 'Marseille',
						lat: '43.29695',
						fcl: 'P',
						fcode: 'PPLA',
					},
				],
			});

		hook(hooks, context);
		const updateFields = { city: 'marsel' };
		await callbacks['adopted_probes.items.update'](updateFields, { keys: [ '1' ] });

		expect(readMany.callCount).to.equal(1);
		expect(readMany.args[0]).to.deep.equal([ [ '1' ] ]);
		expect(nock.isDone()).to.equal(true);
		expect(updateMany.callCount).to.equal(1);

		expect(updateMany.args[0]).to.deep.equal([
			[ '1' ],
			{ latitude: '43.29695', longitude: '5.38107', isCustomCity: true, state: null },
		]);

		expect(updateFields.city).to.equal('Marseille');
	});

	it('should reset city, lat and long of the adopted probe', async () => {
		readMany.resolves([{
			city: 'Paris',
			latitude: '48.85341',
			longitude: '2.3488',
			country: 'FR',
			isCustomCity: false,
		}]);

		hook(hooks, context);
		const updateFields = { city: null };
		await callbacks['adopted_probes.items.update'](updateFields, { keys: [ '1' ] });

		expect(updateMany.callCount).to.equal(1);

		expect(updateMany.args[0]).to.deep.equal([
			[ '1' ],
			{ latitude: null, longitude: null, isCustomCity: false, state: null },
		]);

		expect(updateFields.city).to.equal(null);
	});

	it('should send valid error if probes not found', async () => {
		readMany.resolves([]);

		hook(hooks, context);
		const updateFields = { city: 'marsel' };
		const err = await callbacks['adopted_probes.items.update'](updateFields, { keys: [ '1' ] }).catch(err => err);

		expect(err).to.deep.equal(new ProbesNotFoundError());
		expect(updateMany.callCount).to.equal(0);
	});

	it('should send valid error if country is not defined', async () => {
		readMany.resolves([{
			city: 'Paris',
			latitude: '48.85341',
			longitude: '2.3488',
			country: null,
			isCustomCity: false,
		}]);

		hook(hooks, context);
		const updateFields = { city: 'marsel' };
		const err = await callbacks['adopted_probes.items.update'](updateFields, { keys: [ '1' ] }).catch(err => err);

		expect(err).to.deep.equal(new CountryNotDefinedError());
		expect(updateMany.callCount).to.equal(0);
	});

	it('should send valid error if target probes are in different countries', async () => {
		readMany.resolves([{
			city: 'Paris',
			latitude: '48.85341',
			longitude: '2.3488',
			country: 'FR',
			isCustomCity: false,
		}, {
			city: 'London',
			latitude: '51.50853',
			longitude: '-0.12574',
			country: 'GB',
			isCustomCity: false,
		}]);

		hook(hooks, context);
		const updateFields = { city: 'marsel' };
		const err = await callbacks['adopted_probes.items.update'](updateFields, { keys: [ '1' ] }).catch(err => err);

		expect(err).to.deep.equal(new DifferentCountriesError());
		expect(updateMany.callCount).to.equal(0);
	});

	it('should send valid error if provided city is not valid', async () => {
		readMany.resolves([{
			city: 'Paris',
			latitude: '48.85341',
			longitude: '2.3488',
			country: 'FR',
			isCustomCity: false,
		}]);

		nock('http://api.geonames.org').get('/searchJSON?featureClass=P&style=medium&isNameRequired=true&maxRows=1&username=username&country=FR&q=invalidcity')
			.reply(200, {
				totalResultsCount: 0,
				geonames: [],
			});

		hook(hooks, context);
		const updateFields = { city: 'invalidcity' };
		const err = await callbacks['adopted_probes.items.update'](updateFields, { keys: [ '1' ] }).catch(err => err);

		expect(nock.isDone()).to.equal(true);
		expect(err).to.deep.equal(new InvalidCityError());
		expect(updateMany.callCount).to.equal(0);
	});
});
