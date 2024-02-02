export async function up (knex) {
	await knex.transaction(async (trx) => {
		await trx.raw(`ALTER TABLE jsd_purge_tokens ADD INDEX value_index (value);`);
		await trx.raw(`ALTER TABLE gp_tokens ADD INDEX value_index (value);`);
		await trx.raw(`ALTER TABLE gp_adopted_probes ADD INDEX ip_index (ip);`);
		await trx.raw(`ALTER TABLE gp_credits ADD INDEX user_id_index (user_id);`);
		await trx.raw(`ALTER TABLE gp_credits_deductions ADD INDEX user_id_and_date_index (user_id, date);`);
	});

	console.log('Indexes added');
}

export async function down () {
	console.log('There is no down operation for that migration.');
}
