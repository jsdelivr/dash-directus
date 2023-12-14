import { defineOperationApp } from '@directus/extensions-sdk';

export default defineOperationApp({
	id: 'adopted-probes-status-cron-handler',
	name: 'Adopted probes status CRON handler',
	icon: 'schedule',
	description: 'CRON job to assign credits for adopted probes.',
	overview: () => [],
	options: [],
});
