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
	.apple-list-reminders {
		margin: 0;
		padding: 0;
	}

	.apple-list-break {
		margin: 0;
	}

	.apple-list-reminder-break-line {
		margin-left: 2em;
		margin-top: 0.5em;
		margin-bottom: 0.5em;
		padding: 0;
    	height: 0.5px;
		opacity: 0.2;
	}

	.apple-list-top-rule, .apple-list-bottom-rule {
		opacity: 0;
	}
</style>

<div class="apple-list-container">
	<hr class="apple-list-top-rule"/>
	<h2>
		<span
			style="color: {model.properties.color}">{model.properties.name}</span>
	</h2>

	<span class="apple-list-reminders">
		{#each rems as reminder, i}
			<ReminderHTML model={reminder} /><br class="apple-list-break"/>
			<hr class="apple-list-reminder-break-line">
		{/each}
	</span>
	<br>
	<!-- <button class="apple-list-add">+</button> -->
	<button on:click={refresh}>Refresh</button>
	<hr class="apple-list-bottom-rule" />
</div>
