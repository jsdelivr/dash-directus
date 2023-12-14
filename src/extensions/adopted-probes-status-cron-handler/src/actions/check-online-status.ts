import type { OperationContext } from '@directus/extensions';
import { getAdoptedProbes, increaseOnlineTimes } from '../repositories/directus';
import { getConnectedProbes } from '../repositories/globalping';

export const checkOnlineStatus = async (context: OperationContext) => {
	const adoptedProbes = await getAdoptedProbes(context);
	const connectedProbes = await getConnectedProbes(context);

	const activeIpsSet = new Set(connectedProbes.filter(({ status }) => status === 'ready').map(({ ipAddress }) => ipAddress));
	const activeAdoptedProbes = adoptedProbes.filter(({ ip }) => activeIpsSet.has(ip));

	await increaseOnlineTimes(activeAdoptedProbes, context);
};
