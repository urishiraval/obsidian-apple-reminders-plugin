import applescript from 'node-osascript';
import { List, Reminder } from "src/interfaces";
import { logger } from 'src/tools';


const scripts = {
    //Lists
    get_lists: () => `tell application "Reminders" to return properties of lists`,
    get_list_reminders: (list: AppleList, callback: Function) => applescript.execute(`
            tell list list_name in application "Reminders"
            	set buffer to ((current date) - minutes * 5)
            	return properties of reminders whose completion date comes after buffer or completed is false	
            end tell
    `, { list_name: list.properties.name }, callback),

    //Reminders
    get_reminder: (reminder: AppleReminder, callback: Function) => applescript.execute(`tell application "Reminders" to return properties of reminders whose name is reminder_name`, { reminder_name: reminder.name }, callback)
}

const executor = (script: string, variables: {}, callback: Function) => {
    let childProcess = applescript.execute(script, variables, (err: any, res: any, raw: any) => {
        if(err) throw err;
        callback(res, raw);
    });

    setTimeout(() => {
        childProcess.stdin.pause();
        childProcess.kill();
    }, 30000)
}


export class AppleList {
    properties: List;
    reminders = new Map<Reminder["name"], AppleReminder>();
    className = "apple-list";
    stale: boolean = true;

    constructor(properties: List) {
        this.properties = properties;
        this.syncReminders();
        setInterval(() => {
            this.syncReminders()
        }, 60000);
    }

    sync() {
        return new Promise<this>((resolve, reject) => {
            console.log('syncing');

            executor(
                `tell application "Reminders"
                    try
                        return properties of list list_name
                    on error
                        set lis to make new list
                        set name of lis to list_name
                        return properties of lis
                    end try
                end tell`,
                { list_name: this.properties.name },
                (res: List, raw: any) => {
                    logger(this, "Sync", { res, raw });
                    var temp = { ...this.properties, ...res }
                    this.properties = temp;
                    resolve(this);
                });
        });

    }

    syncReminders() {
        return new Promise<AppleReminder[]>((resolve, reject) => {
            executor(
                `tell list list_name in application "Reminders"
            	    set buffer to ((current date) - hours * 1)
            	    return properties of reminders whose completion date comes after buffer or completed is false	
                end tell`,
                { list_name: this.properties.name },
                (res: Reminder[], raw: any) => {
                    if (res && res.length > 0) {
                        res.forEach(element => {
                            // logger(this, "Reminder", element);
                            this.addReminder(element);
                        });
                    }
                    resolve(Array.from(this.reminders, ([name, val]) => val));
                });
        });
    }

    getReminders() {
        return Array.from(this.reminders, ([name, val]) => val);
    }

    async update(properties: List) {
        return this;
    }

    addReminder(reminder: Reminder) {
        let rem = this.reminders.get(reminder.name);
        if (rem) {
            rem.properties = reminder;
        }
        else
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
                if (err) throw err;
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
                                return properties of rem
                            end tell`,
            { list_name: this.container.properties.name, reminder_name: this.properties.name },
            (err: any, res: Reminder, raw: any) => {
                logger(this, "Marked Done", { err, res, raw })
                this.properties = { ...this.properties, ...res }
            }
        )
        // return await this.update({ name: this.properties.name, completed: true });
    }

    async markNotDone() {
        applescript.execute(`tell list list_name in application "Reminders"
                                set rem to reminder reminder_name
                                set completed in rem to false
                                return properties of rem
                            end tell`,
            { list_name: this.container.properties.name, reminder_name: this.properties.name },
            (err: any, res: Reminder, raw: any) => {
                logger(this, "Marked Not Done", { err, res, raw })
                this.properties = { ...this.properties, ...res }
            }
        )
    }

    toString() {
        return this.properties.toString();
    }
}
