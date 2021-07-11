export const sync_list = `
tell application "Reminders"
	try
		return properties of list list_name
	on error
		set lis to make new list
		set name of lis to list_name
		return properties of lis
	end try
end tell
`

export const sync_reminders = `
tell list list_name in application "Reminders"
	set buffer to ((current date) - hours * buffer_hours)
	return properties of reminders whose completion date comes after buffer or completed is false	
end tell
`

export const custom_reminder = `
tell list list_name in application "Reminders"
	try
		return properties of reminder reminder_name
	on error
		set rem to make new reminder
		set name of rem to reminder_name
		return properties of rem
	end try
end tell
`

export const mark_reminder_done = `
tell list list_name in application "Reminders"
	set rem to reminder reminder_name
	set completed in rem to true
	return properties of rem
end tell
`

export const mark_reminder_not_done = `
tell list list_name in application "Reminders"
	set rem to reminder reminder_name
	set completed in rem to false
	return properties of rem
end tell
`
