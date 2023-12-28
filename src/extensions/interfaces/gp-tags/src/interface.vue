<script setup lang="ts">
import { ref, watch } from 'vue';
import { useApi } from '@directus/extensions-sdk';

const api = useApi();

const props = withDefaults(
	defineProps<{
		value: {value: string, prefix: string}[] | null;
		primaryKey: string;
		type: string;
		disabled?: boolean;
		font?: 'sans-serif' | 'serif' | 'monospace';
	}>(),
	{
		font: 'sans-serif',
	},
);

const emit = defineEmits([ 'input' ]);

const id = ref<string>('');

const prefixes = ref<string[]>([]);
const updatePrefix = (index: number, newPrefix: string) => {
	const updatedArray = [ ...tags.value ];
	updatedArray[index] = { ...tags.value[index], prefix: newPrefix };
	emit('input', updatedArray);
};

const tags = ref<{value: string, prefix: string}[]>(props.value ?? []);
watch(
	() => props.value,
	(newVal) => {
		tags.value = newVal ?? [];
	},
);

const updateTag = (index: number, newTag: string) => {
	const updatedArray = [ ...tags.value ];
	updatedArray[index] = { ...tags.value[index], value: newTag };
	emit('input', updatedArray);
};
const addTag = () => {
	const updatedArray = [ ...tags.value, { value: '', prefix: '' }];
	emit('input', updatedArray);
};
const deleteTag = (index: number) => {
	const updatedArray = tags.value.filter((_, i) => i !== index);
	emit('input', updatedArray);
};

async function fetchUserData () {
	try {
		const response = await api.get(`/users/me`, {
			params: {
				fields: [ 'id', 'github_username', 'github_organizations' ],
			},
		});

		const username = response.data.data.github_username;
		const organizations = response.data.data.github_organizations ? JSON.parse(response.data.data.github_organizations) : [];
		prefixes.value = [ username, ...organizations ];
		id.value = response.data.data.id;
	} catch (err: any) {
		console.error(err);
		alert(err.message || err.toString());
	}
}

fetchUserData();

const isFetching = ref(false);

async function syncGithubData () {
	try {
		isFetching.value = true;
		const response = await api.post('/sync-github-data', {
			userId: props.primaryKey,
		});
		prefixes.value = response.data.github_organizations;
	} catch (err: any) {
		console.error(err);
		alert(err.message || err.toString());
	}

	isFetching.value = false;
}
</script>

<template>
	<div class="row" v-for="(item, index) in tags" :key="index">
		<p class="text">u-</p>
		<div class="dropdown">
			<v-select
				:model-value="item.prefix"
				:items="prefixes.map(value => ({text: value, value}))"
				:disabled="disabled"
				:placeholder="'Select prefix'"
				@update:model-value="(newPrefix) => updatePrefix(index, newPrefix)"
			/>
		</div>
		<p class="text">-</p>
		<div class="input">
			<v-input
				:model-value="item.value"
				@update:model-value="(newTag) => updateTag(index, newTag)"
				:disabled="disabled"
				:type="'text'"
				:class="font"
			/>
		</div>
		<button class="close-button" @click="() => deleteTag(index)">
			<v-icon name="close" />
		</button>
	</div>
	<v-button class="add-tag-button" secondary @click="addTag">Add Tag</v-button>
	<v-button secondary @click="syncGithubData" :loading="isFetching">Sync GitHub Data</v-button>
</template>

<style lang="scss" scoped>
.row {
	margin-top: 15px;
	display: flex;
	flex-direction: row;
	justify-content: space-around;
}

.text {
	line-height: 60px;
	font-size: large;
	text-align: center;
	min-width: 30px;
}

.dropdown {
	flex-grow: 1;
}

.input {
	flex-grow: 1;
}

.close-button {
	margin-left: 5px;
	width: 30px;
}

.add-tag-button {
	margin-right: 15px;
}

.v-input {
	&.monospace {
		--v-input-font-family: var(--theme--font-family-monospace);
	}

	&.serif {
		--v-input-font-family: var(--theme--font-family-serif);
	}

	&.sans-serif {
		--v-input-font-family: var(--theme--font-family-sans-serif);
	}
}

.v-button {
	margin-top: 15px;
}
</style>
