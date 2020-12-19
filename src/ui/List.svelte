<script lang="ts">
	import { Filter } from "src/interfaces";

	import { AppleList, AppleReminder } from "src/models/Reminders.app";
	import ReminderHTML from "./Reminder.svelte";
	import moment from "moment";
	import * as chrono from "chrono-node";
	import { APPLE_DATE_FORMAT, DAILY_NOTE_FORMAT } from "src/constants";
	import { logger } from "src/tools";

	export let model: AppleList;
	export let filters: Filter[];
	export let filename: string;

	$: rems = Array.from(model.reminders, ([name, val]) => val);

	function refresh() {
		// console.log("Refreshig list");
		rems = Array.from(model.reminders, ([name, val]) => val);
	}

	function match(reminder: AppleReminder) {
		var match = true;

		if (filters == null) return true;

		filters.forEach((filter) => {
			logger(this, "FILTER", { filter, reminder });
			if (filter != null) {
				if (filter.date != null) {
					if (reminder.properties["due date"] == "missing value") {
						match &&= false;
					} else {
						var date =
							filter.date == "daily note"
								? filename
								: filter.date;

						var range = chrono.parse(date)[0];
						logger(this, "DATE FILTER", {
							date,
							range,
							"reminder date": reminder.properties["due date"],
						});

						var start = moment(range.start.date());
						if (range.end != null) {
							var end = moment(range.end.date());
							logger(this, "END DATE", end);
							match &&= moment(
								reminder.properties["due date"],
								APPLE_DATE_FORMAT
							).isBetween(start, end, "day", "[]");
						}
						else {
							match &&= moment(reminder.properties["due date"], APPLE_DATE_FORMAT).isSame(start, "day");
						}
					}
				}

				if (filter.priority != null) {
					var priority = 0;
					switch (filter.priority) {
						case "high":
							priority = 1;
							break;
						case "medium":
							priority = 6;
							break;
						case "low":
							priority = 9;
							break;
						default:
							priority = 0;
					}
					match &&= reminder.properties.priority == priority;
				}
			}
		});
		return match;
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

	.apple-list-top-rule,
	.apple-list-bottom-rule {
		opacity: 0;
	}
</style>

<div class="apple-list-container">
	<hr class="apple-list-top-rule" />
	<h2>
		<span
			style="color: {model.properties.color}">{model.properties.name}</span>
	</h2>

	<span class="apple-list-reminders">
		{#each rems as reminder, i}
			{#if match(reminder)}
				<ReminderHTML model={reminder} /><br class="apple-list-break" />
				<hr class="apple-list-reminder-break-line" />
			{/if}
		{/each}
	</span>
	<br />
	<!-- <button class="apple-list-add">+</button> -->
	<button on:click={refresh}>Refresh</button>
	<hr class="apple-list-bottom-rule" />
</div>
