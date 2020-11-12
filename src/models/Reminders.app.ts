import applescript from 'node-osascript';
import { List, Reminder } from "src/interfaces";
import { logger } from 'src/tools';


const scripts = {
    //Lists
    get_lists: () => `tell application "Reminders" to return properties of lists`,
    get_list_properties: (list: AppleList, callback: Function) => applescript.execute(`tell application "Reminders"
                                                                                            try
                                                                                                return properties of list list_name
                                                                                            on error
                                                                                                set lis to make new list
                                                                                                set name of lis to list_name
                                                                                                return properties of lis
                                                                                            end try
                                                                                        end tell
                                                                                    `, { list_name: list.properties.name }, callback),
    get_list_reminders: (list: AppleList, callback: Function) => applescript.execute(`tell list list_name in application "Reminders" to return properties of reminders whose completed is false`, { list_name: list.properties.name }, callback),

    //Reminders
    get_reminder: (reminder: AppleReminder, callback: Function) => applescript.execute(`tell application "Reminders" to return properties of reminders whose name is reminder_name`, { reminder_name: reminder.name }, callback),
    // get_all_reminders: () => `tell application "Reminders" to return properties of reminders`,
    // get_all_active_reminders: () => `tell application "Reminders" to return properties of reminders whose completed is false`,

    // add_reminder: (list: AppleList, reminder: AppleReminder) => `tell "${list.script}" of application "Reminders" to make new reminder with properties {${properties.script}}`,
    // mark_reminder_completed: (list: AppleScript, name: AppleScript) => `tell list "${list.script}" of application "Reminders" to set completed of (reminders whose name is "${name.script}") to false`,
    // remove_reminder: (list: AppleScript, name: AppleScript) => `tell list "${list.script}" of application "Reminders" to delete (every reminder whose name is "${name.script}")`,

    // alter_reminder: (list: AppleList, reminder: AppleReminder) => `tell list "${list.getName()}" of application "Reminders" to set properties of (reminders whose name is "${reminder.getName()}") to ${reminder.getProperties()}`,

    // //Bath Operations
    // batch_add_reminders: (list: AppleScript, properties: AppleScript[]) => `
    // tell "" of application "Reminders"
    // 	${properties.map(props => {
    // 	return `make new reminder with properties ${props.script}`;
    // })}
    // end tell
    // `
}


export class AppleList {
    properties: List;
    reminders = new Map<Reminder["name"], AppleReminder>();
    className = "apple-list";
    stale:boolean = true;

    constructor(properties: List) {
        this.properties = properties;
        setInterval(() => {
            this.syncReminders()
        }, 30000);
    }

    sync() {
        return new Promise<this>((resolve, reject) => {
            console.log('syncing');

            scripts.get_list_properties(this, (err: any, res: List, raw: any) => {
                logger(this, "Sync", { err, res, raw });
                var temp = { ...this.properties, ...res }
                this.properties = temp;
                resolve(this);
            })
        });

    }

    syncReminders() {
        return new Promise<AppleReminder[]>((resolve, reject) => {
            scripts.get_list_reminders(this, (err: any, res: Reminder[], raw: any) => {
                logger(this, "Reminders", {err, res, raw});
                if (err) {
                    throw err;
                }
                if(res && res.length > 0){
                    res.forEach(element => {
                        // logger(this, "Reminder", element);
                        this.addReminder(element);
                    });
                }
                
                resolve(Array.from(this.reminders, ([name, val]) => val));
            })
        });
    }

    getReminders() {
        return Array.from(this.reminders, ([name, val]) => val);
    }

    async update(properties: List) {
        return this;
    }

    addReminder(reminder: Reminder) {
        this.reminders.set(reminder.name, new AppleReminder(reminder, this));
    }

    addCustomReminder(properties: Reminder) {
        logger(this, "Adding Custom Rmeinder", properties);
        applescript.execute(`tell list list_name in application "Reminders"
                                try
                                    return properties of reminder reminder_name
                                on error
                                    set rem to make new reminder
                                    set name of rem to reminder_name
                                    return properties of rem
                                end try
                            end tell`,
            { list_name: this.properties.name, reminder_name: properties.name },
            (err: any, res: Reminder, raw: any) => {
                if(err) throw err;
                logger(this, "Made Custom Reminder", { err, res, raw })
                this.addReminder(res);
            }
        )
    }

    getReminder(name: string) {
        return this.reminders.get(name);
    }

    toString() {
        return this.properties.toString();
    }

}

export class AppleReminder {
    name: string;
    container: AppleList;
    properties: Reminder;

    constructor(properties: Reminder, parent: AppleList) {
        this.container = parent;
        this.properties = properties;
    }

    async sync() {
        logger(this, "Sync Reminder", this.properties);
        return this;
    }

    async update(properties: Reminder) {
        logger(this, "NeedsUpdate", { from: this.properties, to: properties });
        var temp = { ...this.properties, ...properties };
        this.properties = temp;
        return this;
    }

    async markDone() {
        applescript.execute(`tell list list_name in application "Reminders"
                                set rem to reminder reminder_name
                                set completed in rem to true
                            end tell`,
            { list_name: this.container.properties.name, reminder_name: this.properties.name },
            (err: any, res: any, raw: any) => {
                logger(this, "Marked Done", { err, res, raw })
            }
        )
        // return await this.update({ name: this.properties.name, completed: true });
    }

    async markNotDone() {
        applescript.execute(`tell list list_name in application "Reminders"
                                set rem to reminder reminder_name
                                set completed in rem to false
                            end tell`,
            { list_name: this.container.properties.name, reminder_name: this.properties.name },
            (err: any, res: any, raw: any) => {
                logger(this, "Marked Not Done", { err, res, raw })
            }
        )
    }

    toString() {
        return this.properties.toString();
    }
}
