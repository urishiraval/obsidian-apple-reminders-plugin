# Apple Reminders

![Reminders Plugin used with daily notes](/docs/RemindersPlugin.gif)

A plugin to attempt to bring Apple Reminders into [Obsidian](https://obsidian.md). 

Note: This plugin can get a bit heavy but I've tried to make it as effecient as possible. Any recommendations are welcome.

(I'm not responsible for any loss of data....though this plugin never deletes any reminder, only ever alters their properties)

##### Change Log

v0.2:
- Implemented basic Filtering
- Displayed more Data
- UI Improvements

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
  - If the list does not exist, it will create it.
  - This uses the [yaml](https://yaml.org) format specification.
  - Nested (aka 'Indented') Reminders don't work. This is cause Apple doesn't expose this feature yet through apple script for some reason. (Bummer, I know.)
  
## Additional Features

#### Pull Specific Reminders

```yaml
list: List Name
reminders:
  - Reminder 1
  - Reminder 2
```

This will do 2 things:
 1. Will Create 'Reminder 1' or 'Reminder 2' if it doesn't exist
 2. If 'Reminder 1' or 'Reminder 2' does exist, it will fetch it and show it's status. 
  - (I.e. it fetches the reminders regardless of whether they are completed, effectively bypassing the default settings of a list only fetching reminders that aren't completed yet.)

#### Filters

```yaml
list: List Name
reminders:
  - Some Random (Possibly) Completed Reminder That Doesn't Matter
filters:
  - date: today - next month
  - priority: high
```

So far only the ```date``` and ```priority``` fields are filterable since those are mostly what I pay attention to. (If you'd like other fields to be implemented please create an issue)

Things to Note:
1. The ```date``` field is parsed using the [Chrono.js](https://github.com/wanasit/chrono) library and thus has all the features (and or issues) that it has. Please refer to it's documentation to see what is available.
  - However please note that the dates are compared using [Moment.js](https://momentjs.com/docs/#/query/is-same/) (specifically the isSame and isBetween (inclusive) functions) and the dates are limited to the 'day' value. This means that times are ignored.
    - So for example, if you try to pull reminders ```between 6am and 5pm``` this will just pull all the reminders on that day rather than limit it to that time period
2. The filters are 'anded' together. I.e. the filters in the example above become `date is between today and next month` **and** `priority is high`.
3. The ```date``` field has a special keyword. If you put:

```yaml
- date: daily note
```
The filter will be replaced by the Title of the Note. This has a caveat that if your Daily Note has an unusual Date Format (that can not be parsed by Chrono.js) this filter will not work and this might result in no reminders being displayed. (If you use this feature and this caveat occurs, please create an issue or comment on an existing one).

# Additional Notes

The blocks sync every minute. The sync time is fixed at the moment but a Settings View is in the works (see Objectives below).

# Objectives

To add to this list create a Feature Request in Issues and I'll be happy to add it to this list.

(In no particular order)

- [x] Fetch data from Reminders.app for use in Obsidian
  - [x] Figure out how to get data consistantly 
    - using [AppleScript](https://developer.apple.com/library/archive/documentation/AppleScript/Conceptual/AppleScriptLangGuide/introduction/ASLR_intro.html), specifically using [this library](https://www.npmjs.com/package/node-osascript) to execute it for now, until and unless a more efficient way is found
    
- [ ] Display Data in Obsidian in a way that is most usable and uses Obsidian Constructs
  - [x] Figure out how to best display Reminder data
    - Using Svelte (like how the [obsidian-todoist-plugin](https://github.com/jamiebrynes7/obsidian-todoist-plugin) is doing it. Many Thanks!)
  - [ ] Find a way to bring nested or 'indented' reminders into Obsidian (currently not supported in applescript)
  - [ ] Make the Refresh Button work better (currently only refreshes the UI but not the Model, i.e. it doesn't pull from Apple)
  - [ ] Filtering
    - [x] Customize what a List Fetches
    - [x] Filter by Date
    - [ ] ~~Filter by Time~~
      - This doesn't seem nessesary at the moment. However the status may change if enough people want the more fine grained control :)
    - [x] Filter by Priority
    - [ ] Filter by Location
  - [ ] Create Status Bar icon and messages to show when the plugin is doing whatever it's doing.
  - [ ] Create an Interface that shows all the Lists in Obsidian at once
  - [ ] Create a 'Today' List (?? Is this redundant now that Filters are implemented?) 
  
- [ ] Create a mechanism that allows for efficient editing of Reminders via Obsidian
  - [x] Create Reminders through Obsidian
  - [x] Mark Reminders as completed through Obsidian
  - [ ] Due Date and Remind Me Date editing of reminders
  - [ ] List Color editing
  - [ ] Look into bringing the List 'emblems' into Obsidian
  
- [ ] Make this plugin as configurable as possible to allow for multiple use cases
  - [ ] Create a settings tab in the Obsidian Menu
  - [ ] Make sync time configurable
  - [ ] Make UI more configurable (standardize class names and create a document for it)
  - [ ] Make sensible defaults
    
- [ ] Development Things
  - [ ] Create Documentation
  - [ ] Create Files for AppleScripts to allow for customization

# Feedback

Any bugs or features/recommendations can be made by creating an Issue on this repo

