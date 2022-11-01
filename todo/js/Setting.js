export default {
	template: `
		<div class="view view--setting">
			<div class="view__inner">
				<div class="setting">
					<h2>Settings</h2>
					<nav class="nav">
						<ul>
							<li>
								<button @click="$emit('change-view', 'list')">Todo</button>
							</li>
							<li>
								<button @click="$emit('change-view', 'friend')">Friends</button>
							</li>
							<li>
								<button @click="$emit('change-view', 'setting')"  class="nav__current">Settings</button>
							</li>
							<li class="nav__logout">
								<button @click="logout" class="logout">Logout</button>
							</li>
						</ul>
					</nav>
					<h3>Change username</h3>
					<form @submit.prevent="changeUsername">
						<p>
							<label for="username">Username</label>
							<input type="text" v-model="username" name="username">
						</p>
						<p class="setting__submit">
							<input type="submit" value="Change">
						</p>
					</form>
					<h3>Change password</h3>
					<form @submit.prevent="changePassword">
						<p>
							<label for="password-old">Old password</label>
							<input type="password" v-model="passwordOld" name="password-old">
						</p>
						<p>
							<label for="password-new">New password</label>
							<input type="password" v-model="passwordNew" name="password-new">
						</p>
						<p class="setting__submit">
							<input type="submit" value="Change">
						</p>
					</form>
				</div>
			</div>
		</div>
	`,
	data() {
		return {
			username: null,
			passwordOld: null,
			passwordNew: null,
			waiting: false,
		};
	},
	methods: {
		async changeUsername() {
			if (this.waiting) return;
			this.waiting = true;
			let result = await fetchPost("./api/users/change-username/", {username: this.username});
			this.$emit("message", result.result);
			if (result.changed) this.username = "";
			this.waiting = false;
		},
		async changePassword() {
			if (this.waiting) return;
			this.waiting = true;
			let result = await fetchPost(
				"./api/users/change-password/",
				{passwordOld: this.passwordOld, passwordNew: this.passwordNew},
			);
			this.$emit("message", result.result);
			if (result.changed) {
				this.passwordOld = "";
				this.passwordNew = "";
			}
			this.waiting = false;
		},
		async logout() {
			if (this.waiting) return;
			this.waiting = true;
			let result = await fetchPost("./api/users/logout/", null);
			this.$emit("change-view", "login");
			this.waiting = false;
		},
	},
	emits: ["change-view", "message"],
}

