import { AppleScript } from "src/interfaces";

export const reminders = {
	//Lists
	get_lists: () => `tell application "Reminders" to return properties of lists`,
	get_list: (list: AppleScript) => `tell application "Reminders" to return properties of reminders in "${list.script}" whose completed is false`,

	//Reminders
	get_reminder: (name: AppleScript) => `tell application "Reminders" to return properties of reminders whose name is ${name.script}`,
	get_all_reminders: () => `tell application "Reminders" to return properties of reminders`,
	get_all_active_reminders: () => `tell application "Reminders" to return properties of reminders whose completed is false`,

	add_reminder: (list: AppleScript, properties: AppleScript) => `tell "${list.script}" of application "Reminders" to make new reminder with properties {${properties.script}}`,
	mark_reminder_completed: (list: AppleScript, name: AppleScript) => `tell list "${list.script}" of application "Reminders" to set completed of (reminders whose name is "${name.script}") to false`,
	remove_reminder: (list: AppleScript, name: AppleScript) => `tell list "${list.script}" of application "Reminders" to delete (every reminder whose name is "${name.script}")`,
	alter_reminder: (list: AppleScript, name: AppleScript, properties: AppleScript) => `tell list "${list.script}" of application "Reminders" to set properties of (reminders whose name is "${name.script}") to ${properties.script}`,

	//Bath Operations
	batch_add_reminders: (list: AppleScript, properties: AppleScript[]) => `
	tell "" of application "Reminders"
		${properties.map(props => {
		return `make new reminder with properties ${props.script}`;
	})}
	end tell
	`
}