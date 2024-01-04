export async function up (knex) {
	await knex.schema.raw('ALTER TABLE `directus_users` RENAME COLUMN `github` TO `github_username`');
}

export async function down () {
	console.log('There is no down operation for that migration.');
}
