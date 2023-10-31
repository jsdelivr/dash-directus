import { defineHook } from '@directus/extensions-sdk';

type User = {
    provider: string;
    external_identifier: string;
    first_name?: string;
    last_name?: string;
    last_page?: string;
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

	if (!login) {
		const id = user.external_identifier;
		user.last_name = id;
	}
};
