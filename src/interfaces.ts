import List from "./ui/List.svelte";

export interface ListItem {
	name: string
	color: string
	reminders: Map<string, ReminderItem> | null
}

export interface ReminderItem {
	id: string
	name: string
	due: string
	remind_me: string
}

export interface ListProxy {
	list: Map<string, ListItem>,
}

export interface ReminderSettings {
	centralFilePath: string
}

export interface CacheData {
	settings: ReminderSettings,
}

export interface IInjection {
	component: List;
	workspaceLeaf: Node;
}