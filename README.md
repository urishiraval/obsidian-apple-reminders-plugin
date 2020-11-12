# Apple Reminders

![Reminders Plugin used with daily notes](/docs/RemindersPlugin.gif)

A plugin to attempt to bring Apple Reminders into [Obsidian](https://obsidian.md). 

Note: This plugin can get a bit heavy but I've tried to make it as effecient as possible. Any recommendations are welcome.

(I'm not responsible for any loss of data....though this plugin never deletes any reminder, only ever alters their properties)

# Requirements

This plugin uses apple script to sync so it will only work on an Apple Device.

# Installation Instructions

### Manual

1. Download and unzip the release folder `obsidian-apple-reminders-plugin.zip`
2. Copy the `obsidian-apple-reminders-plugin` folder into the `.obsidian/plugins` folder
3. Start Obsidian
4. Enable `Apple Reminders` in `Third-Party Plugins`

### Obsidian Built-In Plugin Manager

> Comming Soon...

# How To Use

Create a code block like so:

```markdown
'''reminders
list: List Name
'''
```

This will fetch all uncompleted reminders in the list `List Name`.

Note:
  - Is the list does not exist, it will create it.
  - This uses the [yaml](https://yaml.org) format specification.
  
## Additional Features

```markdown
'''reminders
list: List Name
reminders:
  - Reminder 1
  - Reminder 2
'''
```

This will do 2 things:
 1. Will Create 'Reminder 1' or 'Reminder 2' if it doesn't exist
 2. Will Fetch 'Reminder 1' and 'Reminder 2' even if it's already completed

# Additional Notes

The blocks sync every minute. The sync time is fixed at the moment but a Settings View is in the works (see Objectives below).

# Objectives

- [x] Fetch data from Reminders.app for use in Obsidian
  - [x] Figure out how to get data consistantly 
    - using [AppleScript](https://developer.apple.com/library/archive/documentation/AppleScript/Conceptual/AppleScriptLangGuide/introduction/ASLR_intro.html), specifically using [this library](https://www.npmjs.com/package/node-osascript) to execute it for now, until and unless a more efficient way is found
- [ ] Display Data in Obsidian in a way that is most usable and uses Obsidian Constructs
  - [x] Figure out how to best display Reminder data
    - Using Svelte (like how the [obsidian-todoist-plugin](https://github.com/jamiebrynes7/obsidian-todoist-plugin) is doing it. Many Thanks!)
- [ ] Create a mechanism that allows for efficient editing of Reminders via Obsidian
  - [x] Create Reminders through Obsidian
  - [x] Mark Reminders as completed through Obsidian
  - [ ] Due Date and Remind Me Date editing of reminders

# Feedback

Any bugs or features/recommendations can be made by creating an Issue on this repo
