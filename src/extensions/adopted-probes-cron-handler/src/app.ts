import { defineOperationApp } from '@directus/extensions-sdk';

export default defineOperationApp({
	id: 'adopted-probes-cron-handler',
	name: 'Adopted probes CRON handler',
	icon: 'schedule',
	description: 'CRON job to assign credits for adopted probes.',
	overview: () => [],
	options: [],
});
