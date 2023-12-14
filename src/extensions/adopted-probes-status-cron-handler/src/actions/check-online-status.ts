import type { OperationContext } from '@directus/extensions';
import { getAdoptedProbes, increaseOnlineTimes } from '../repositories/directus';
import { getConnectedProbes } from '../repositories/globalping';

export const checkOnlineStatus = async (context: OperationContext) => {
	const adoptedProbes = await getAdoptedProbes(context);
	const connectedProbes = await getConnectedProbes(context);

	const onlineIpsSet = new Set(connectedProbes.filter(({ status }) => status === 'ready').map(({ ipAddress }) => ipAddress));
	const onlineAdoptedProbes = adoptedProbes.filter(({ ip }) => onlineIpsSet.has(ip));

	await increaseOnlineTimes(onlineAdoptedProbes, context);
};
