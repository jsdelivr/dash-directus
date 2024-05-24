export async function up (knex) {
	await knex.raw(`ALTER TABLE jsd_purge_tokens ADD INDEX value_index (value);`);

	console.log('Indexes added');
}

export async function down () {
	console.log('There is no down operation for that migration.');
}
