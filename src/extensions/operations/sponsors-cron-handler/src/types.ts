export type DirectusSponsor = {
	id: number;
	github_login: string;
	github_id: string;
	monthlyAmount: number;
	lastEarningDate: string;
}

export type GithubSponsor = {
	githubLogin: string;
	githubId: string;
	isActive: boolean;
	monthlyAmount: number;
	isOneTimePayment: boolean;
}
