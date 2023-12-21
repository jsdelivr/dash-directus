import { defineHook } from '@directus/extensions-sdk';

type User = {
    provider: string;
    external_identifier: string;
    first_name?: string;
    last_name?: string;
    last_page?: string;
		github_username?: string;
}

export default defineHook(({ filter }) => {
	filter('users.create', (payload) => {
		const user = payload as User;

		if (user.provider === 'github') {
			handleGithubLogin(user);
		}
	});
});

const handleGithubLogin = (user: User) => {
	const login = user.last_name;
	user.last_name = undefined;
	user.github_username = login;

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
