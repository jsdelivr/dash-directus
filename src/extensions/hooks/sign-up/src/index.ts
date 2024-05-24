import { defineHook } from '@directus/extensions-sdk';

type User = {
    provider: string;
    external_identifier: string;
    first_name?: string;
    last_name?: string;
    last_page?: string;
		user_type: string;
		github_username?: string;
		github_organizations: string[];
}

export default defineHook(({ filter }) => {
	filter('users.create', async (payload) => {
		const user = payload as User;

		if (user.provider === 'github') {
			fulfillUsername(user);
			fulfillFirstNameAndLastName(user);
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
