<script lang="ts">
	import { AppleList } from "src/models/Reminders.app";
	import ReminderHTML from "./Reminder.svelte";

	export let model: AppleList;

	$: rems = Array.from(model.reminders, ([name, val]) => val);

	function refresh() {
		// console.log("Refreshig list");
		rems = Array.from(model.reminders, ([name, val]) => val);
	}

	setInterval(refresh, 1000);
</script>

<style>
	/* .apple-list-add { } */
</style>

<div class="apple-list-container">
	<hr />
	<h2> <span style="color: {model.properties.color}">{model.properties.name}</span> </h2>

	{#each rems as reminder, i}
		<ReminderHTML model={reminder} /><br />
	{/each}
	<br />
	<!-- <button class="apple-list-add">+</button> -->
	<button on:click={refresh}>Refresh</button>
	<hr class="apple-list-bottom-rule"/>
</div>
