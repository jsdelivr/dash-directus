
import Bluebird from 'bluebird';
import { OperationContext } from '@directus/types';
import { getDirectusUsers, deleteUser, deleteCredits } from '../repositories/directus.js';
import { getGithubUser } from '../repositories/github.js';

export const removeBannedUsers = async (context: OperationContext) => {
	const users = await getDirectusUsers(context);
	const removedIds = await Bluebird.map(users, async (user) => {
		if (!user.external_identifier) {
			return null;
		}

		const githubUser = await getGithubUser(user.external_identifier, context);

		if (githubUser === null) {
			const id = await deleteUser(user, context);
			await deleteCredits(user, context);
			return id;
		}

		return null;
	}, { concurrency: 8 });
	return removedIds.filter((id): id is string => !!id);
};
