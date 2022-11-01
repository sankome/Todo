export default {
	template: `
		<div class="view view--list">
			<div class="view__inner">
				<div class="friend">
					<h2>Friends</h2>
					<nav class="nav">
						<ul>
							<li>
								<button @click="$emit('change-view', 'list')">Todo</button>
							</li>
							<li>
								<button @click="$emit('change-view', 'friend')" class="nav__current">Friends</button>
							</li>
							<li>
								<button @click="$emit('change-view', 'setting')">Settings</button>
							</li>
							<li class="nav__logout">
								<button @click="logout" class="logout">Logout</button>
							</li>
						</ul>
					</nav>
					<form @submit.prevent="request" class="friend__add-form">
						<p>
							<input type="text" v-model="requestee" class="friend__add-friend">
							<input type="submit" value="+" class="friend__add-button">
						</p>
					</form>
					<ul class="friend__list">
						<TransitionGroup name="list">
							<li v-for="request in requests" :key="'key' + request.id" class="friend__request">
								<div class="friend__inner">
									From: {{request.username}}
									<button @click="accept(request.fromid)" class="friend__accept">+</button>
									<button @click="decline(request.fromid)" class="friend__decline">x</button>
								</div>
							</li>
							<li v-for="requesting in requestings" :key="'key' + requesting.id" class="friend__requesting">
								<div class="friend__inner">
									To: {{requesting.username}}
									<button @click="cancel(requesting.toid)" class="friend__cancel">x</button>
								</div>
							</li>
							<li v-for="friend in friends" :key="'key' + friend.id" class="friend__friend">
								<div class="friend__inner">
									{{friend.username}}
									<button @click="remove(friend.id)" class="friend__remove">x</button>
								</div>
							</li>
						</TransitionGroup>
					</ul>
				</div>
			</div>
		</div>
	`,
	data() {
		return {
			waiting: false,
			friends: [],
			requestee: "",
			requests: [],
			requestings: [],
		};
	},
	methods: {
		async update() {
			if (this.waiting) return;
			this.waiting = true;
			let result = await fetchGet("./api/users/friends/", null);
			if (result.friends) this.friends = result.friends;
			
			let requests = await fetchGet("./api/users/requests/", null);
			if (requests.requests) this.requests = requests.requests;
			
			let requestings = await fetchGet("./api/users/requestings/", null);
			if (requestings.requestings) this.requestings = requestings.requestings;
			
			this.waiting = false;
		},
		async request() {
			if (this.waiting) return;
			this.waiting = true;
			let result = await fetchPost("./api/users/request/", {to: this.requestee});
			if (result.requested) this.requestee = "";
			this.$emit("message", result.result);
			this.waiting = false;
			this.update();
		},
		async accept(friendId) {
			if (this.waiting) return;
			this.waiting = true;
			let result = await fetchPost("./api/users/accept/", {from: friendId});
			this.$emit("message", result.result);
			this.waiting = false;
			this.update();
		},
		async decline(friendId) {
			if (this.waiting) return;
			this.waiting = true;
			let result = await fetchPost("./api/users/decline/", {from: friendId});
			this.$emit("message", result.result);
			this.waiting = false;
			this.update();
		},
		async cancel(friendId) {
			if (this.waiting) return;
			this.waiting = true;
			let result = await fetchPost("./api/users/cancel/", {to: friendId});
			this.$emit("message", result.result);
			this.waiting = false;
			this.update();
		},
		async remove(friendId) {
			if (this.waiting) return;
			this.waiting = true;
			let result = await fetchDelete("./api/users/remove/", {friend: friendId});
			this.$emit("message", result.result);
			this.waiting = false;
			this.update();
		},
		async logout() {
			if (this.waiting) return;
			this.waiting = true;
			let result = await fetchPost("./api/users/logout/", null);
			this.$emit("change-view", "login");
			this.waiting = false;
		},
	},
	mounted() {
		this.update();
	},
	emits: ["change-view", "message"],
}

