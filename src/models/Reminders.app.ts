import applescript from 'node-osascript';
import { IInjection, List, Reminder } from "src/interfaces";
import ReminderHTML from "../ui/Reminder.svelte";
import ListHTML from "../ui/List.svelte";
import { logger } from 'src/tools';

const factory = (className: string, args: {}) => {
    return (className == 'apple-reminder') ? new ReminderHTML(args) : new ListHTML(args);
}

const scripts = {
    //Lists
    get_lists: () => `tell application "Reminders" to return properties of lists`,
    get_list: (list: AppleList, callback: Function) => applescript.execute(`tell application "Reminders" to return properties of list list_name`, { list_name: list.getName() }, callback),

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

export class AppleResource {
    properties: List | Reminder;
    className: string;
    ui: HTMLLIElement;

    constructor(properties: List | Reminder, className: string) {
        this.properties = properties;
        this.className = className;

    }

    getName() {
        return this.properties.name;
    }
    getProperties() {
        return this.properties;
    }

    async render(injectionHandle: IInjection[]) {

        logger(this, "Rendering", this.properties.nodes);
        for (var i = 0; i < this.properties.nodes.length; ++i) {
            var node = this.properties.nodes[i];

            node.addClass(this.className);

            var root = node.parentElement;
            try {
                root.removeChild(node);
            }
            catch {
                logger(this, "render issue");
                return;
            }

            const workspaceLeaf = root.parentElement.closest(".workspace-leaf");
            try {
                workspaceLeaf.classList.add(`contains-${this.className}`);
            }
            catch {
                logger(this, "render issue");
                return;
            }


            var ui = factory(this.className, {
                target: root,
                props: {
                    model: this
                }
            })

            const injection = {
                component: ui,
                workspaceLeaf: workspaceLeaf,
            };

            injectionHandle.push(injection);
            this.properties.nodes.remove(node);
        }

        this.properties.nodes = [];
    }
}

export class AppleList extends AppleResource {
    properties: List;
    reminders = new Map<Reminder["name"], AppleReminder>();
    ui: ListHTML;

    constructor(properties: List) {
        super(properties, 'apple-list');
    }

    sync() {
        return new Promise<this>((resolve, reject) => {
            console.log('syncing');

            scripts.get_list(this, (err:any, res: List, raw:any) => {
                logger(this, "Sync", {err, res, raw});
                this.properties.nodes.forEach(node => {
                    node.addClass(this.className);
                })

                this.properties.color = res.color;
                this.properties.id = res.id;
                    
                resolve(this);
            })
        });

    }

    async update(properties: List) {
        // this.ui = null; //Invalidate element
        var nodes = [this.properties.nodes, properties.nodes];
        this.properties.nodes, properties.nodes = [], [];
        if(JSON.stringify(this.properties) != JSON.stringify(properties)) {
            logger(this, "NeedsUpdate", {from:this.properties, to:properties});

        }
        this.properties.nodes, properties.nodes = nodes[0], nodes[1];
        this.properties = properties;
        return this;
    }

    addReminder(reminder: AppleReminder) {
        this.reminders.set(reminder.getName(), reminder);
    }

    getReminder(name: string) {
        return this.reminders.get(name);
    }

    toString() {
        return this.properties.toString();
    }

}

export class AppleReminder extends AppleResource {
    name: string;
    container: AppleList;
    properties: Reminder;
    ui: ReminderHTML;

    constructor(properties: Reminder, parent: AppleList) {
        super(properties, 'apple-reminder');
        this.container = parent;
    }

    async sync() {
        logger(this, "nodes", this.properties.nodes);
        return this;
    }

    async update(properties: Reminder) {
        var nodes = [this.properties.nodes, properties.nodes];
        this.properties.nodes, properties.nodes = [], [];
        if(JSON.stringify(this.properties) != JSON.stringify(properties)) {
            logger(this, "NeedsUpdate", {from:this.properties, to:properties});
        }
        this.properties.nodes, properties.nodes = nodes[0], nodes[1];
        this.properties = properties;
        return this;
    }

    async markDone() {
        logger(this, "Done");
        this.properties.completed = true;
        return await this.sync();
    }

    async markNotDone() {
        this.properties.completed = false;
        return await this.sync();
    }

    toString() {
        return this.properties.toString();
    }
}
