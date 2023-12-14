import type { OperationContext } from '@directus/extensions';
import { defineOperationApi } from '@directus/extensions-sdk';
import { assignCredits } from './actions/assign-credits';

export default defineOperationApi({
	id: 'adopted-probes-credits-cron-handler',
	handler: (_operationData, context: OperationContext) => {
		const creditIds = assignCredits(context);
		return `Created credits with ids: ${creditIds}`;
	},
});
