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

//The reason we need this is to ensure that only valid applescript is passed through to the Executor
export interface AppleScript {
	script: string
}

export interface AppleData {
	data: object
}

export interface AppleResource {
	name:string
	id?:string
}

export interface QueryString {
	query:string
}