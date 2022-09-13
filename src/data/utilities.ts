import { FilterModel, ReminderModel } from "src/models/shared.models";
import * as chrono from 'chrono-node';
import { moment } from "obsidian";
import { APPLE_DATE_FORMAT } from "src/data/constants";

export function predicate(reminder: ReminderModel, filters: FilterModel[] | undefined, filename: string | null) {
	var match = true;

	if (filters == null) return true;

	filters.forEach((filter) => {
		if (filter != null) {
			if (filter.date != null) {
				if (reminder["due date"] == "missing value") {
					match &&= false;
				} else {
					var date =
						filter.date == "daily note"
							? filename
							: filter.date;

					if (date) {
						var range = chrono.parse(date)[0];

						var start = moment(range.start.date());
						if (range.end != null) {
							var end = moment(range.end.date());
							match &&= moment(
								reminder["due date"],
								APPLE_DATE_FORMAT
							).isBetween(start, end, "day", "[]");
						}
						else {
							match &&= moment(reminder["due date"], APPLE_DATE_FORMAT).isSame(start, "day");
						}
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
						priority = 5;
						break;
					case "low":
						priority = 9;
						break;
					default:
						priority = 0;
				}
				match &&= reminder.priority == priority;
			}
		}
	});
	return match;
}