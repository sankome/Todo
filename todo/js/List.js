import Checkbox from "./Checkbox.js";

export default {
	template: `
		<div class="view view--list">
			<div class="view__inner">
				<div class="todo">
					<h2>Todo</h2>
					<nav class="nav">
						<ul>
							<li>
								<button @click="$emit('change-view', 'list')" class="nav__current">Todo</button>
							</li>
							<li>
								<button @click="$emit('change-view', 'friend')">Friends</button>
							</li>
							<li>
								<button @click="$emit('change-view', 'setting')">Settings</button>
							</li>
							<li class="nav__logout">
								<button @click="logout" class="logout">Logout</button>
							</li>
						</ul>
					</nav>
					<form @submit.prevent="add" class="todo__add-form">
						<p>
							<input type="date" v-model="dateString" class="todo__add-date">
						</p>
						<p class="todo__add-p">
							<input type="text" v-model="content" class="todo__add-content">
							<input type="submit" value="+" class="todo__add-button">
						</p>
					</form>
					<p>
						<Checkbox label="Show friends' todos" checked :waiting="waiting? true: false" @toggle="toggleFriend"/>
					</p>
					<ul class="todo__list">
						<TransitionGroup name="list">
							<li v-for="todo in todos" :key="todo.id" class="todo__todo" :class="{'todo__todo--done': todo.status == 1, 'todo__todo--friend': todo.friend}">								
								<div class="todo__inner">
									<div class="todo__info">
										{{dateToString(todo.date)}}
										{{todo.username? (" | " + todo.username): null}}
									</div>
									{{todo.content? todo.content: "-"}}
									<button v-if="todo.status == 0 && !todo.friend" @click="done(todo.id)" class="todo__done">v</button>
									<button v-if="!todo.friend" @click="del(todo.id)" class="todo__delete">x</button>
								</div>
							</li>
						</TransitionGroup>
					</ul>
					<p v-if="more" class="todo__more">
						<button @click="showMore">Show more</button>
					</p>
				</div>
			</div>
		</div>
	`,
	data() {
		return {
			todos: [],
			waiting: false,
			content: "",
			date: new Date(),
			rows: 10,
			more: true,
			hideFriend: false,
		};
	},
	computed: {
		dateString: {
			get() {
				let year = String(this.date.getFullYear());
				let month = String(this.date.getMonth() + 1).padStart(2, "0");
				let day = String(this.date.getDate()).padStart(2, "0");
				return [year, month ,day].join("-");
			},
			set(date) {
				this.date = new Date(date);
			},
		},
	},
	methods: {
		async add() {
			if (this.waiting) return;
			this.waiting = true;
			let result = await fetchPost("./api/todos/add/", {content: this.content, date: this.date});
			if (result.added) this.content = "";
			this.waiting = false;
			this.update();
		},
		async update() {
			if (this.waiting) return;
			this.waiting = true;
			let result = await fetchGet("./api/todos/list/", {rows: this.rows, hideFriend: this.hideFriend});
			this.todos = result.todos;
			this.more = result.more;
			this.waiting = false;
		},
		dateToString(date) {
			let d = new Date(date);
			let year = String(d.getFullYear()).substring(2, 4);
			let month = String(d.getMonth() + 1).padStart(2, "0");
			let day = String(d.getDate()).padStart(2, "0");
			return [year, month ,day].join("/");
		},
		showMore() {
			this.rows += 10;
			this.update();
		},
		toggleFriend(check) {
			this.hideFriend = !check;
			this.update();
		},
		async done(todoId) {
			if (this.waiting) return;
			this.waiting = true;
			let result = await fetchPost("./api/todos/done/", {todoId: todoId});
			this.waiting = false;
			this.update();
		},
		async del(todoId) {
			if (this.waiting) return;
			this.waiting = true;
			let result = await fetchDelete("./api/todos/del/", {todoId: todoId});
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
	components: {
		Checkbox,
	},
}

