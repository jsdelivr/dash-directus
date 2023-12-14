import type { OperationContext } from '@directus/extensions';
import { getAdoptedProbes, addCredits, resetOnlineTimes } from '../repositories/directus';

export const assignCredits = async (context: OperationContext) => {
	const adoptedProbes = await getAdoptedProbes(context);

	const onlineAdoptedProbes = adoptedProbes.filter(({ onlineTimesToday }) => onlineTimesToday >= 10);

	const creditIds = await addCredits(onlineAdoptedProbes, context);
	await resetOnlineTimes(context);

	return creditIds;
};
