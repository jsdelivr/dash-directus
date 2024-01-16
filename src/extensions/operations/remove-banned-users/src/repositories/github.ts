import { OperationContext } from '@directus/types';
import axios, { isAxiosError } from 'axios';
import { DirectusUser, GithubUser } from '../types';

export const getGithubUser = async (id: DirectusUser['external_identifier'], context: OperationContext) => {
	try {
		const response = await axios.get<GithubUser>(`https://api.github.com/user/${id}`, {
			timeout: 5000,
			headers: {
				Authorization: `Bearer ${context.env.GITHUB_ACCESS_TOKEN}`,
			},
		});
		return response.data;
	} catch (error) {
		if (isAxiosError(error) && error.response && error.response.status === 404) {
			return null;
		}

		throw error;
	}
};

