import { OperationContext } from '@directus/types';
import axios from 'axios';
import { DirectusUser, GithubUser } from '../types';

export const getGithubUser = async (user: DirectusUser, context: OperationContext) => {
	const response = await axios.get<GithubUser>(`https://api.github.com/user/${user.external_identifier}`, {
		timeout: 5000,
		headers: {
			Authorization: `Bearer ${context.env.GITHUB_ACCESS_TOKEN}`,
		},
	});
	const githubUser = response.data;
	return githubUser;
};
