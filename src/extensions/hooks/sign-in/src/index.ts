import axios from 'axios';
import _ from 'lodash';
import type { HookExtensionContext } from '@directus/extensions';
import { defineHook } from '@directus/extensions-sdk';

type GithubUserResponse = {
	login: string;
	id: number;
};

type GithubOrgsResponse = {
	login: string;
}[];

type User = {
	id: string;
	external_identifier?: string;
	github_username?: string;
	github_organizations?: string;
}

export default defineHook(({ action }, context) => {
	action('auth.login', async (payload) => {
		const userId = payload.user;
		const provider = payload.provider;
		await syncGithubData(userId, provider, context);
	});
});

const syncGithubData = async (userId: string, provider: string, context: HookExtensionContext) => {
	const { services, database, getSchema } = context;
	const { ItemsService } = services;

	if (provider !== 'github') {
		return;
	}

	const itemsService = new ItemsService('directus_users', {
		schema: await getSchema({ database }),
		knex: database,
	});

	const user = await itemsService.readOne(userId) as User | undefined;

	if (!user || !user.external_identifier || !user.github_username) {
		throw new Error('Not enough data to check GitHub data');
	}

	await Promise.all([
		syncGitHubUsername(user, context),
		syncGitHubOrganizations(user, context),
	]);
};

const syncGitHubUsername = async (user: User, context: HookExtensionContext) => {
	const githubResponse = await axios.get<GithubUserResponse>(`https://api.github.com/user/${user.external_identifier}`, {
		timeout: 5000,
		headers: {
			Authorization: `Bearer ${context.env.GITHUB_ACCESS_TOKEN}`,
		},
	});
	const githubUsername = githubResponse.data.login;

	if (user.github_username !== githubUsername) {
		await sendNotification(user, githubUsername, context);
	}
};

const syncGitHubOrganizations = async (user: User, context: HookExtensionContext) => {
	const orgsResponse = await axios.get<GithubOrgsResponse>(`https://api.github.com/user/${user.external_identifier}/orgs`, {
		timeout: 5000,
		headers: {
			Authorization: `Bearer ${context.env.GITHUB_ACCESS_TOKEN}`,
		},
	});
	const githubOrgs = orgsResponse.data.map(org => org.login);
	const userOrgs = user.github_organizations ? JSON.parse(user.github_organizations) : [];

	if (!_.isEqual(userOrgs.sort(), githubOrgs.sort())) {
		await updateOrganizations(user, githubOrgs, context);
	}
};

const sendNotification = async (user: User, githubUsername: string, context: HookExtensionContext) => {
	const { services, database, getSchema } = context;
	const { NotificationsService } = services;

	const notificationsService = new NotificationsService({
		schema: await getSchema({ database }),
		knex: database,
	});

	await notificationsService.createOne({
		recipient: user.id,
		subject: 'Github username update',
		message: `Looks like your GitHub username was updated from "${user.github_username}" to "${githubUsername}". Tags of the adopted probes are constructed as \`u-\${githubUsername}-\${tagValue}\`. If you want tags to use the new value click "Sync GitHub Data" button on the [user page](/admin/users/${user.id}).`,
	});
};

const updateOrganizations = async (user: User, githubOrgs: string[], context: HookExtensionContext) => {
	const { services, database, getSchema } = context;
	const { ItemsService } = services;

	const itemsService = new ItemsService('directus_users', {
		schema: await getSchema({ database }),
		knex: database,
	});

	await itemsService.updateOne(user.id, { github_organizations: JSON.stringify(githubOrgs) });
};
