export default {
	template: `
		<div class="view view--create">
			<div class="view__inner">
				<div class="create">
					<h2>Create</h2>
					<nav class="nav">
						<ul>
							<li>
								<button @click="$emit('change-view', 'login')">Login</button>
							</li>
							<li>
								<button @click="$emit('change-view', 'create')" class="nav__current">Create</button>
							</li>
						</ul>
					</nav>
					<form @submit.prevent="create">
						<p>
							<label for="username">Username</label>
							<input type="text" v-model="username" name="username">
						</p>
						<p>
							<label for="password">Password</label>
							<input type="password" v-model="password" name="password">
						</p>
						<p class="create__submit">
							<input type="submit" value="Create">
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
		async create() {
			if (this.waiting) return;
			this.waiting = true;
			let result = await fetchPost(
				"./api/users/create/",
				{username: this.username, password: this.password},
			);
			if (result.login) this.$emit("change-view", "list");
			else this.$emit("message", result.result);
			this.waiting = false;
		},
	},
	emits: ["change-view", "message"],
}

