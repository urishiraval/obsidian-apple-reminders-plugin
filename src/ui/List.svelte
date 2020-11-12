<script lang="ts">
	import { log } from "console";
	import { AppleList, AppleReminder } from "src/models/Reminders.app";
	import ReminderHTML from "./Reminder.svelte";

	export let model: AppleList;

	let reminders = model.getReminders();
	
	model.syncReminders().then((res) => {
		console.log(res);
		reminders = res;
	});

	const refresh = () => {
		reminders = model.getReminders();
	};

	$: rems = reminders;

	setInterval(() => {
		refresh();
	}, 1000);
</script>

<style>
	/* .apple-list-add { } */
</style>

<hr />

<h2>
	<span style="color: {model.properties.color}">{model.properties.name}</span>
</h2>

{#each rems as reminder, i}
	<ReminderHTML model={reminder} /><br />
{/each}
<br />
<button class="apple-list-add">+</button>
<hr />
