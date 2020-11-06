import { Plugin, TFile } from "obsidian";
import fs from "fs"

import AppleApi from "./AppleApi";
import { List, Reminder, ListProxy } from "./interfaces";

const MAIN_INTERFACE_CLASS = "reminders-app";
const LIST_CLASS = "reminders-app-list";

export default class AppleRemindersPlugin extends Plugin {
	apple = new AppleApi();
	filePath = "Reminders.app.md";
	file: TFile;

	// reminders: ListProxy;
	reminders: Map<string, List>;




	ribbonIcon = this.addRibbonIcon("", "Reminders.app", () => {
		try { this.app.vault.adapter.read(this.filePath) }
		catch {
			this.app.vault.adapter.write(this.filePath, "# Reminders.app");
		}
		if (this.file == null)
			this.file = this.app.vault.getFiles().find(f => f.path === this.filePath)

		this.app.workspace.openLinkText("Reminders.app.md", this.filePath);
	})

	statusBar = this.addStatusBarItem();


	async onload() {
		console.log("Apple Reminders Plugin is Loading...");
		this.statusBar.setText("Apple Reminders Loading...");

		this.apple.getLists().then(res => {

			this.reminders = res;

			this.reminders.forEach((value: List, key: string) => {

				console.log(`Getting ${value.name}...`);
				this.statusBar.setText(`Getting: ${value.name}`);
				this.addStatusBarItem();

				this.apple.getActiveReminders(value.name).then(rems => {
					let lst = this.reminders.get(key)
					if (lst) {
						this.reminders.set(key, { ...lst, reminders: rems })
						console.log(this.reminders);

						// lst.reminders = rems

						console.log(`${value.name} Successfully Retrieved. Writing to ${this.filePath}`);
						this.statusBar.setText(`${value.name} Successfully Retrieved. Writing to ${this.filePath}`);

						this.statusBar.setText("Updateing Reminders.app...");
						console.log("Updating Reminders.app");

						this.app.vault.adapter.write(this.filePath, "```"+MAIN_INTERFACE_CLASS+"\n" + JSON.stringify(Array.from(this.reminders.entries()), mapReplacer, 2) + "\n```");

						// const nodes = document.querySelectorAll<HTMLPreElement>('pre[class*="'+LIST_CLASS+'"]');
						
					}

				})
			})
		})

	}



	onunload() {
		console.log("Apple Reminders Plugin is Unloading...");
	}
}

function mapReplacer(key: any, value: any) {
	if (value instanceof Map) {
		return Array.from(value.entries())
		// of course you can separate cases to turn Maps into objects
	}
	return value
}