const DIRECTUS_URL = process.env.DIRECTUS_URL;
const ADMIN_ACCESS_TOKEN = process.env.ADMIN_ACCESS_TOKEN;

async function hasAdoptedProbesCollection () {
	const URL = `${DIRECTUS_URL}/collections?access_token=${ADMIN_ACCESS_TOKEN}`;
	const response = await fetch(URL).then((response) => {
		if (!response.ok) {
			throw new Error(`Fetch request failed. Status: ${response.status}`);
		}

		return response.json();
	});
	console.log(response);
	const collections = response.data;
	return collections.some(collection => collection.collection === 'adopted_probes');
}

async function fetchAdoptedProbes () {
	const URL = `${DIRECTUS_URL}/items/adopted_probes?access_token=${ADMIN_ACCESS_TOKEN}`;
	return fetch(URL).then((response) => {
		if (!response.ok) {
			throw new Error(`Fetch request failed. Status: ${response.status}`);
		}

		return response.json();
	});
}

async function patchAdoptedProbe (id, updatedTags) {
	const URL = `${DIRECTUS_URL}/items/adopted_probes/${id}?access_token=${ADMIN_ACCESS_TOKEN}`;
	return fetch(URL, {
		method: 'PATCH',
		body: JSON.stringify({ tags: updatedTags }),
		headers: { 'Content-Type': 'application/json' },
	}).then((response) => {
		if (!response.ok) {
			throw new Error(`Patch request failed. Status: ${response.status}`);
		}

		return response.json();
	});
}

async function updateTags () {
	const { data: adoptedProbes } = await fetchAdoptedProbes();

	for (const probe of adoptedProbes) {
		if (Array.isArray(probe.tags)) {
			const updatedTags = probe.tags.map(prevValue => ({ value: prevValue, prefix: 'prefix' }));
			await patchAdoptedProbe(probe.id, updatedTags);
		}
	}
}

export async function up () {
	const hasCollection = await hasAdoptedProbesCollection();

	if (!hasCollection) {
		console.log('There is no "adopted_probes" collection. Tags migrations not required.');
		return;
	}

	await updateTags();
	console.log('Adopted probes tags updated successfully.');
}

export async function down () {
	console.log('There is no down operation for that migration.');
}
