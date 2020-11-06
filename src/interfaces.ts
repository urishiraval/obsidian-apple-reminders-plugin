export interface List {
	name: string
	color: string
	reminders: Map<string, Reminder> | null
}

export interface Reminder {
	id: string
	name: string
	due: string
	remind_me: string
}

export interface ListProxy {
    list: Map<string, List>,
}