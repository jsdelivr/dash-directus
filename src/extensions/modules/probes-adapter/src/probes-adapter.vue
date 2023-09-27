<template>
  <private-view title="Adopt your probes">
    <template #title-outer:prepend>
      <v-button class="header-icon" rounded icon exact disabled>
        <v-icon name="router" />
      </v-button>
    </template>

    <div class="content">
			<p class="description">
				This page allows to adopt your own probes. You need follow these steps (Note: multiple probes should be adopted one by one):<br/>
				1. Enter the IP address of your probe;<br/>
				2. Go to the probe logs and find a 6 digit verification code;<br/>
				3. Enter the code to the verification input.
			</p>

			<form @submit.prevent="sendCode">
				<label for="ip" class="label">Enter the IP address:</label>
				<v-input
					type="text"
					id="ip"
					v-model="ip"
					class="input"
					required
				/>
				<v-button type="submit">Send code to probe</v-button>
				<v-notice class="notice" v-if="sendCodeResponse">{{ sendCodeResponse }}</v-notice>
			</form>

			<form @submit.prevent="verifyCode">
				<label for="code" class="label">Enter the verification code:</label>
				<v-input
					type="text"
					id="code"
					v-model="code"
					class="input"
					required
				/>
				<v-button type="submit">Verify the code</v-button>
				<v-notice class="notice" v-if="verifyCodeResponse">{{ verifyCodeResponse }}</v-notice>
			</form>

    </div>
  </private-view>
</template>

<script>
export default {
	data() {
		return {
			ip: '',
			code: '',
			sendCodeResponse: '',
			verifyCodeResponse: '',
		};
	},
	methods: {
		async sendCode() {
			try {
				const response = await fetch('/adoption-code/send-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
					body: JSON.stringify({ ip: this.ip }),
				});

				if (!response.ok) {
					throw new Error('Network response code is not ok');
				}

				const text = await response.text();
				this.sendCodeResponse = text;
			} catch (error) {
				console.error('Error:', error);
				this.sendCodeResponse = 'An error occurred while submitting the form.';
			}
		},
		async verifyCode() {
			try {
				const response = await fetch('/adoption-code/verify-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
					body: JSON.stringify({ code: this.code }),
				});

				if (!response.ok) {
					throw new Error('Network response code is not ok');
				}

				const text = await response.text();
				this.verifyCodeResponse = text;
			} catch (error) {
				console.error('Error:', error);
				this.verifyCodeResponse = 'An error occurred while submitting the form.';
			}
		},
	},
};
</script>

<style lang="scss" scoped>
.content {
  padding: var(--content-padding);
  padding-bottom: var(--content-padding-bottom);
}

.description {
	color: #172940;
	font-size: 16px;
	margin-bottom: 16px;
}

form {
	margin-bottom: 24px;
}

.notice {
	margin-top: 8px;
}

.header-icon {
  --v-button-background-color-disabled: var(--primary-10);
  --v-button-color-disabled: var(--primary);
  --v-button-background-color-hover-disabled: var(--primary-25);
  --v-button-color-hover-disabled: var(--primary);
}

.label {
	font-weight: 600;
	color: #172940;
	font-size: 16px;
	margin-bottom: 8px;
}

.input {
	margin-bottom: 8px;
}
</style>
