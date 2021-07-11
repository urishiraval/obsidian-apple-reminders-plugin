import { List, Reminder } from "src/interfaces";
import { logger } from "src/tools";
import { AppleDataService } from "./AppleDataService";

const data_service = AppleDataService.getInstance();

export class AppleList {
  properties: List;
  reminders = new Map<Reminder["name"], AppleReminder>();
  className = "apple-list";
  stale: boolean = true;

  constructor(properties: List) {
    this.properties = properties;
    this.syncReminders();
    setInterval(() => {
      this.syncReminders();
    }, 60000);
  }

  sync() {
    return new Promise<this>((resolve, reject) => {
      logger(this, "syncing");

      data_service
        .fetch("sync_list", { list_name: this.properties.name }, true)
        .then((resp) => {
          logger(this, "Sync", resp);
          var temp = { ...this.properties, ...resp.res };
          this.properties = temp;
          resolve(this);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  syncReminders() {
    return new Promise<AppleReminder[]>((resolve, reject) => {
      data_service
        .fetch(
          `sync_reminders`,
          { list_name: this.properties.name, buffer_hours: 1 },
          true
        )
        .then((resp: { res: Reminder[]; raw: any }) => {
          const { res, raw } = resp;
          if (res && res.length > 0) {
            res.forEach((element) => {
              // logger(this, "Reminder", element);
              this.addReminder(element);
            });
          }
          resolve(Array.from(this.reminders, ([name, val]) => val));
        })
        .catch((err) => reject(err));
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
    } else this.reminders.set(reminder.name, new AppleReminder(reminder, this));
  }

  addCustomReminder(properties: Reminder) {
    logger(this, "Adding Custom Reminder", properties);
    data_service
      .fetch(
        `custom_reminder`,
        { list_name: this.properties.name, reminder_name: properties.name },
        false
      )
      .then((resp: { res: Reminder; raw: any }) => {
        logger(this, "Made Custom Reminder", resp);
        this.addReminder(resp.res);
      })
      .catch((err) => {
        throw err;
      });
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
    data_service
      .fetch(
        `mark_reminder_done`,
        {
          list_name: this.container.properties.name,
          reminder_name: this.properties.name,
        },
        false
      )
      .then((resp: { res: Reminder; raw: any }) => {
        logger(this, "Marked Done", resp);
        this.properties = { ...this.properties, ...resp.res };
      })
      .catch((err) => {
        throw err;
      });
    // return await this.update({ name: this.properties.name, completed: true });
  }

  async markNotDone() {
    data_service
      .fetch(
        `mark_reminder_not_done`,
        {
          list_name: this.container.properties.name,
          reminder_name: this.properties.name,
        },
        false
      )
      .then((resp: { res: Reminder; raw: any }) => {
        logger(this, "Marked Not Done", resp);
        this.properties = { ...this.properties, ...resp.res };
      })
      .catch((err) => {
        throw err;
      });
  }

  toString() {
    return this.properties.toString();
  }
}
