import { Plugin } from "obsidian";
import runApplescript from "run-applescript";

var scripts = {
  "get_lists": () => ``,
  "add_reminder": () => ``,
  "get_active_reminders": () => ``,
  "remove_reminder": () => ``,
  "alter_reminder": () => ``
}

class RemindersInterface {
  ScriptExecutor = runApplescript;

}

export default class AppleRemindersPlugin extends Plugin {
  apple = new RemindersInterface();
  onInit() { }

  async onload() {
    console.log("Apple Reminders Plugin is Loading...");
  }

  onunload() {
    console.log("Apple Reminders Plugin is Unloading...");
  }
}