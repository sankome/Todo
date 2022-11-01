export default {
	template: `
		<button class="checkbox" :class="{'checkbox--checked': check}" @click="onClick">
			{{label}}
		</button>
	`,
	data() {
		return {
			check: this.checked,
		};
	},
	methods: {
		onClick() {
			if (this.waiting) return;
			this.check = !this.check;
			this.$emit("toggle", this.check);
		},
	},
	props: {
		label: String,
		checked: Boolean,
		waiting: Boolean,
	},
	emits: ["toggle"],
}

