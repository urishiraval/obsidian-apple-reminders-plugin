export interface ReminderModel {
	id: string
	name: string
	completed: boolean | false
	"due date"?: string
	"remind me date"?: string
	priority?: number
	body?: string
}

export interface ListModel {
	id: string
	name: string
	color?: string
}

export interface FilterModel {
	date?: string
	priority?: "high" | "medium" | "low"
	"name matches"?: string
}

export interface AppleReminderSpec {
	list: ListModel["name"];
	reminders: ReminderModel["name"][];
	filters?: FilterModel[];
}