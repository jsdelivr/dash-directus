/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

export const seed = async (knex) => {
	const getUser = async () => {
		return knex('directus_users')
			.join('directus_roles', 'directus_users.role', 'directus_roles.id')
			.where({ 'directus_roles.name': 'User' })
			.select('directus_users.id', 'directus_users.external_identifier', 'directus_users.github_username')
			.first();
	};

	let user = await getUser();

	if (!user) {
		const userRole = await knex('directus_roles').where({ name: 'User' }).select('id').first();

		await knex('directus_users').insert([{
			id: 'b2193f5b-4a8b-4513-8e5a-1559478bebde',
			first_name: 'Dmitriy',
			last_name: 'Akulov',
			email: 'user@example.com',
			password: '$argon2id$v=19$m=65536,t=3,p=4$UAmnqQvr4aGkytr3SIr68Q$aglm45P0itFgFKfyWyKOgVLXzZvCZHQJJR3geuAZgwU', // password: user
			role: userRole.id,
			provider: 'default',
			external_identifier: '1834071',
			email_notifications: 1,
			github_organizations: JSON.stringify([ 'MaxCDN', 'appfleetcloud', 'jsdelivr', 'nice-registry', 'polyfills' ]),
			github_username: 'jimaek',
			user_type: 'member',
		}]);

		console.log('Mock user created. email: user@example.com password: user');

		user = await getUser();
	}

	await Promise.all([
		knex('jsd_purge_tokens').delete(),
	]);

	await knex('jsd_purge_tokens').insert([{
		name: 'jsd-token-1',
		value: 'W4jbiJLf7Lq96/Y8BDFa+rR1BLg+40OzRSEW861mzrk=', // token: 46YlMw6l2o0RvWmhuQECmbSps6Zi4kpz
		user_created: user.id,
		date_created: '2024-02-22 10:46:15',
	}, {
		name: 'jsd-token-2',
		value: 'bnIf3K5QY1nNVhEXPlZci8cc8d3fXA8V6tAa2NdoVCA=', // token: 8yMyVzixoKKw3uMu19cNdZRgxT9qojhK
		user_created: user.id,
		user_updated: user.id,
		date_created: '2024-02-22 10:49:06',
		date_last_used: '2024-02-21',
		date_updated: '2024-02-22 10:49:45',
		expire: '2027-02-01',
		origins: JSON.stringify([ 'https://www.jsdelivr.com', 'https://www.jsdelivr.com:10000' ]),
	}]);
};
