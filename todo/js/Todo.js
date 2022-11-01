const createApp = Vue.createApp;
import Login from "./Login.js";
import Create from "./Create.js";
import List from "./List.js";
import Friend from "./Friend.js";
import Setting from "./Setting.js";

const app = createApp({
	template: `
		<Transition name="view" @before-enter="beforeEnter" @after-leave="afterLeave">
			<Login v-if="view == 'login'" @change-view="changeView" @message="showMessage"/>
			<Create v-else-if="view == 'create'" @change-view="changeView" @message="showMessage"/>
			<List v-else-if="view == 'list'" @change-view="changeView" @message="showMessage"/>
			<Friend v-else-if="view == 'friend'" @change-view="changeView" @message="showMessage"/>
			<Setting v-else-if="view == 'setting'" @change-view="changeView" @message="showMessage"/>
			<div v-else></div>
		</Transition>
		<Transition name="message">
			<div v-if="messageVisible" class="message">
				<div class="message__inner">
					<p>{{message}}</p>
					<p><button @click="hideMessage" ref="messagebutton">Close</button></p>
				</div>
			</div>
		</Transition>
	`,
	data() {
		return {
			transitioning: false,
			waiting: false,
			view: null,
			messageVisible: false,
			message: "message",
			prevFocus: null,
		};
	},
	methods: {
		changeView(view) {
			if (this.transitioning) return;
			this.view = view;
			window.history.pushState({}, null, "?v=" + String(this.view));
		},
		showMessage(message) {
			this.message = message.charAt(0).toUpperCase() + message.slice(1);
			this.messageVisible = true;
			this.$nextTick(() => {
				this.prevFocus = document.activeElement;
				this.$refs.messagebutton.focus();
			});
		},
		hideMessage() {
			this.messageVisible = false;
			this.$nextTick(() => {
				this.prevFocus.focus();
			});
		},
		beforeEnter() {
			this.transitioning = true;
		},
		afterLeave() {
			this.transitioning = false;
		},
	},
	components: {
		Login,
		Create,
		List,
		Friend,
		Setting,
	},
	async mounted() {
		this.waiting = true;
		window.addEventListener("popstate", async (event) => {
			let view = getParams().get("v");
			let result = await fetchGet("./api/users/status/", null);
			if ((view == "login" || view == "create") && result.login) {
				this.changeView("list");
			} else if ((view == "list" || view == "friend") && !result.login) {
				this.changeView("login");
			} else if (view) {
				this.changeView(view);
			} else {
				if (result.login) this.changeView("list");
				else this.changeView("login");
			}
		});
		let result = await fetchGet("./api/users/status/", null);
		if (result.login) this.changeView("list");
		else this.changeView("login");
		this.waiting = false;
	},
});

app.mount("#todo");