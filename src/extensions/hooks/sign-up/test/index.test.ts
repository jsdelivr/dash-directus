/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect } from 'chai';
import hook from '../src/index.js';

describe('Sign-up hook', () => {
	const callbacks = {
		filter: {},
	};
	const hooks = {
		filter: (name, cb) => {
			callbacks.filter[name] = cb;
		},
	} as any;

	it('filter should fulfill first_name, last_name, github_username', async () => {
		hook(hooks, context);

		const payload = {
			provider: 'github',
			external_identifier: 1834071,
			first_name: 'Dmitriy Akulov',
			last_name: 'jimaek',
			github_username: null,
			github_organizations: null,
		};

		await callbacks.filter['users.create'](payload);

		expect(payload).to.deep.equal({
			provider: 'github',
			external_identifier: 1834071,
			first_name: 'Dmitriy',
			last_name: 'Akulov',
			github_username: 'jimaek',
			github_organizations: null,
		});
	});

	it('filter should use gh login as first_name if name is not provided', async () => {
		hook(hooks, context);

		const payload = {
			provider: 'github',
			external_identifier: 1834071,
			first_name: null,
			last_name: 'jimaek',
			github_username: null,
			github_organizations: null,
		};

		await callbacks.filter['users.create'](payload);

		expect(payload).to.deep.equal({
			provider: 'github',
			external_identifier: 1834071,
			first_name: 'jimaek',
			last_name: undefined,
			github_username: 'jimaek',
			github_organizations: null,
		});
	});
});
