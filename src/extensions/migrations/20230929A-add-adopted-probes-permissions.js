const DIRECTUS_URL = process.env.DIRECTUS_URL;
const ADMIN_ACCESS_TOKEN = process.env.ADMIN_ACCESS_TOKEN;
const USER_ROLE_NAME = 'User';

async function getUserRoleId () {
	const URL = `${DIRECTUS_URL}/roles?filter[name][_eq]=${USER_ROLE_NAME}&access_token=${ADMIN_ACCESS_TOKEN}`;
	const response = await fetch(URL).then((response) => {
		if (!response.ok) {
			throw new Error(`Fetch request failed. Status: ${response.status}`);
		}

		return response.json();
	});
	return response.data[0].id;
}

async function createPermissions (roleId) {
	const URL = `${DIRECTUS_URL}/permissions?access_token=${ADMIN_ACCESS_TOKEN}`;
	const response = await fetch(URL, {
		method: 'POST',
		body: JSON.stringify([
			{
				collection: 'adopted_probes',
				action: 'read',
				role: roleId,
				permissions: {
					_and: [
						{
							userId: {
								_eq: '$CURRENT_USER',
							},
						},
					],
				},
				fields: [
					'id',
					'date_updated',
					'ip',
					'name',
					'tags',
					'lastSyncDate',
					'date_created',
					'status',
					'version',
					'country',
					'city',
					'latitude',
					'longitude',
					'asn',
					'network',
				],
			},
			{
				collection: 'adopted_probes',
				action: 'update',
				role: roleId,
				permissions: {
					_and: [
						{
							userId: {
								_eq: '$CURRENT_USER',
							},
						},
					],
				},
				fields: [
					'name',
					'tags',
					'city',
				],
			},
			{
				collection: 'adopted_probes',
				action: 'delete',
				role: roleId,
				permissions: {
					_and: [
						{
							userId: {
								_eq: '$CURRENT_USER',
							},
						},
					],
				},
			},
		]),
		headers: {
			'Content-Type': 'application/json',
		},
	}).then((response) => {
		if (!response.ok) {
			throw new Error(`Fetch request failed. Status: ${response.status}`);
		}

		return response.json();
	});
	return response.data;
}

export async function up () {
	const roleId = await getUserRoleId();
	await createPermissions(roleId);
	console.log('Adopted probes permissions added');
}

export async function down () {
	console.log('There is no down operation for that migration.');
}
