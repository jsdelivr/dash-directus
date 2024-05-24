/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const seed = async (knex) => {
	const admin = await knex('directus_users')
		.join('directus_roles', 'directus_users.role', 'directus_roles.id')
		.where({ 'directus_roles.name': 'Administrator' })
		.select('directus_users.id')
		.first();

	if (!admin) {
		throw new Error('Not found user with a "Administrator" role. Sign up using github to create one.');
	}

	await Promise.all([
		knex('directus_presets').where({ user: admin.id }).delete(),
	]);

	await knex('directus_presets').insert([{
		user: admin.id,
		collection: 'jsd_purge_tokens',
		layout_query: { tabular: { fields: [ 'id', 'user_created', 'name', 'value', 'expire', 'origins', 'date_last_used' ] } },
		icon: 'bookmark',
	}]);
};
