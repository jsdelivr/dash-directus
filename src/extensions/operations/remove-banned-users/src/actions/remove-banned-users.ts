
import Bluebird from 'bluebird';
import { OperationContext } from '@directus/types';
import { deleteUser, getDirectusUsers } from '../repositories/directus';
import { getGithubUser } from '../repositories/github';

export const removeBannedUsers = async (context: OperationContext) => {
	const users = await getDirectusUsers(context);
	await Bluebird.map(users, async (user) => {
		const githubUser = await getGithubUser(user, context);

		if (githubUser === null) {
			await deleteUser(user.external_identifier, context);
		}
	}, { concurrency: 8 });
};
