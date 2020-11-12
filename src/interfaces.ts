import { App } from 'obsidian';
import List from "./ui/List.svelte";

export interface PluginSettings {
}

export interface CacheData {
	// settings: ReminderSettings,
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
	name: string
	id?: string
}

export interface QueryString {
	query: string
}
//--------------------------------
export interface RemindersSettings {
	list: string
	reminders: Reminder["name"][]
	[key: string]: any
}

export interface Reminder {
	id?: string
	name: string
	completed: boolean | false
	"due date"?: string
	"remind me date"?: string
}

export interface List {
	id?: string
	name: string
	color?: string
}