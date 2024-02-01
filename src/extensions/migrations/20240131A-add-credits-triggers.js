export async function up (knex) {
	await knex.transaction(async (trx) => {
		await trx.raw(`
			CREATE TRIGGER after_gp_credits_additions_insert
			AFTER INSERT ON gp_credits_additions
			FOR EACH ROW
			BEGIN
					DECLARE found_user_id CHAR(36);
					SELECT id INTO found_user_id FROM directus_users WHERE external_identifier = NEW.githubId LIMIT 1;

					IF found_user_id IS NOT NULL THEN
							INSERT INTO gp_credits (user_id, amount)
							VALUES (found_user_id, NEW.amount)
							ON DUPLICATE KEY UPDATE
							gp_credits.amount = gp_credits.amount + NEW.amount;
					END IF;
			END;
		`);

		await trx.raw(`
			ALTER TABLE gp_credits
			ADD CONSTRAINT gp_credits_amount_positive CHECK (amount >= 0);
		`);

		await trx.raw(`
			ALTER TABLE gp_credits_additions
			ADD CONSTRAINT gp_credits_additions_amount_positive CHECK (amount >= 0);
		`);

		await trx.raw(`
			ALTER TABLE gp_credits_deductions
			ADD CONSTRAINT gp_credits_deductions_amount_positive CHECK (amount >= 0);
		`);

		await trx.raw(`
			CREATE TRIGGER after_gp_credits_update
			AFTER UPDATE ON gp_credits
			FOR EACH ROW
			BEGIN
					IF NEW.amount < OLD.amount THEN
							UPDATE gp_credits_deductions
							SET amount = amount + (OLD.amount - NEW.amount)
							WHERE user_id = NEW.user_id AND date = CURRENT_DATE;

							IF ROW_COUNT() = 0 THEN
									INSERT INTO gp_credits_deductions (user_id, amount, date)
									VALUES (NEW.user_id, OLD.amount - NEW.amount, CURRENT_DATE);
							END IF;
					END IF;
			END;
		`);
	});

	console.log('Triggers for gp_credits_additions and gp_credits created');
}

export async function down () {
	console.log('There is no down operation for that migration.');
}
