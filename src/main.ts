import { Plugin } from "obsidian";
import runApplescript from "run-applescript";

const DELIMITER = "|"
const scripts = {
  "get_lists": () => `tell application "Reminders"
                        set _ids to id of lists
                        set names to name of lists
                        set colrs to color of lists
	                      return {_ids, "${DELIMITER}", names, "${DELIMITER}", colrs}
                      end tell`,
  "add_reminder": () => ``,
  "get_active_reminders": () => ``,
  "remove_reminder": () => ``,
  "alter_reminder": () => ``
}

class RemindersInterface {
  ScriptExecutor = runApplescript;

  getLists() {
    return new Promise((resolve, reject) => {
      this.ScriptExecutor(scripts["get_lists"]()).then((res => {
        let raw_list = res.split(",")
        raw_list.forEach((value, index) => {
          raw_list[index] = value.trim();
        })

        let list = [];
        let seperator = raw_list.findIndex(value => DELIMITER == value)
        for (let i = 0; i < seperator; ++i) {
          list.push({ [raw_list[i]]: { name: raw_list[i + seperator + 1], color: raw_list[i + seperator * 2 + 2] } })
        }

        resolve(list)

      })).catch((err) => reject(err))
    })
  }

}

export default class AppleRemindersPlugin extends Plugin {
  apple = new RemindersInterface();
  onInit() { }

  async onload() {
    console.log("Apple Reminders Plugin is Loading...");
    this.apple.getLists().then((res) => {
      console.log(res);
    })
  }

  onunload() {
    console.log("Apple Reminders Plugin is Unloading...");
  }
}