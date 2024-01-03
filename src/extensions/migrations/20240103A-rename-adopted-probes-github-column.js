export async function up (knex) {
	return knex.schema.table('adopted_probes', (table) => {
		table.renameColumn('github', 'github_username');
	});
}

export async function down () {
	console.log('There is no down operation for that migration.');
}
