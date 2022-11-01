export default {
	template: `
		<div class="view view--login">
			<div class="view__inner">
				<div class="login">
					<h2>Login</h2>
					<nav class="nav">
						<ul>
							<li>
								<button @click="$emit('change-view', 'login')" class="nav__current">Login</button>
							</li>
							<li>
								<button @click="$emit('change-view', 'create')">Create</button>
							</li>
						</ul>
					</nav>
					<form @submit.prevent="login">
						<p>
							<label for="username">Username</label>
							<input type="text" v-model="username" name="username">
						</p>
						<p>
							<label for="password">Password</label>
							<input type="password" v-model="password" name="password">
						</p>
						<p class="login__submit">
							<input type="submit" value="Login">
						</p>
					</form>
				</div>
			</div>
		</div>
	`,
	data() {
		return {
			username: null,
			password: null,
			waiting: false,
		};
	},
	methods: {
		async login() {
			if (this.waiting) return;
			this.waiting = true;
			let result = await fetchPost(
				"./api/users/login/",
				{username: this.username, password: this.password},
			);
			if (result.login) this.$emit("change-view", "list");
			else this.$emit("message", result.result);
			this.waiting = false;
		},
	},
	emits: ["change-view", "message"],
}

