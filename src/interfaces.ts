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