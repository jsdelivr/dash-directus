import type { OperationContext } from '@directus/extensions';
import { defineOperationApi } from '@directus/extensions-sdk';
import _ from 'lodash';

export default defineOperationApi({
	id: 'adopted-probes-status-cron-handler',
	handler: (_operationData, context: OperationContext) => {
		const maxDeviation = parseFloat(context.env['ADOPTED_PROBES_CHECK_TIME_MAX_DEVIATION_MINS']);

		if (!maxDeviation) {
			throw new Error('ADOPTED_PROBES_CHECK_TIME_MAX_DEVIATION_MINS was not provided');
		}

		const timeOffset = _.random(0, maxDeviation * 60 * 1000);

		setTimeout(() => checkOnlineStatus(context), timeOffset);
	},
});

const checkOnlineStatus = (context: OperationContext) => {
};
