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

//--------------------------------
export interface Filter {
	date?: string
	priority?: "high"|"medium"|"low"
	"name matches"?: string
}

export interface RemindersSettings {
	list: string
	reminders: Reminder["name"][]
	filters: Filter[]
	[key: string]: any
}

export interface Reminder {
	id?: string
	name: string
	completed: boolean | false
	"due date"?: string
	"remind me date"?: string
	priority?: number
	body?: string
}

export interface List {
	id?: string
	name: string
	color?: string
}