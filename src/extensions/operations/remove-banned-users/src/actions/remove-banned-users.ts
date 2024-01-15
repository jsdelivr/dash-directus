
import { OperationContext } from '@directus/types';
import { getDirectusUsers } from '../repositories/directus';

export const removeBannedUsers = async (context: OperationContext) => {
	const users = await getDirectusUsers(context);
	// go to github
	// delete if not found
};
