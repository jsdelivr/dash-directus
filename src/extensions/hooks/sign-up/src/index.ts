import { defineHook } from '@directus/extensions-sdk';
import { HookExtensionContext } from '@directus/types';
import axios from 'axios';

type User = {
    provider: string;
    external_identifier: string;
    first_name?: string;
    last_name?: string;
    last_page?: string;
		github_username?: string;
		github_organizations: string[];
}

type GithubOrganizationsResponse = {
	login: string;
}[];

export default defineHook(({ filter }, context) => {
	filter('users.create', async (payload) => {
		const user = payload as User;

		if (user.provider === 'github') {
			fulfillUsername(user);
			fulfillFirstNameAndLastName(user);
			await fulfillOrganizations(user, context);
		}
	});
});

const fulfillUsername = (user: User) => {
	const login = user.last_name;
	user.last_name = undefined;
	user.github_username = login;
};

const fulfillFirstNameAndLastName = (user: User) => {
	const login = user.github_username;
	const name = user.first_name;

	if (!name) {
		user.first_name = login;
		return;
	}

	const names = name.split(' ');

	if (names.length > 1) {
		user.first_name = names[0];
		user.last_name = names.slice(1).join(' ');
	}
};

const fulfillOrganizations = async (user: User, context: HookExtensionContext) => {
	const response = await axios.get<GithubOrganizationsResponse>(`https://api.github.com/users/${user.github_username}/orgs`, {
		timeout: 5000,
		headers: {
			Authorization: `Bearer ${context.env.GITHUB_ACCESS_TOKEN}`,
		},
	});
	const organizations = response.data.map(organization => organization.login);
	user.github_organizations = organizations;
};
