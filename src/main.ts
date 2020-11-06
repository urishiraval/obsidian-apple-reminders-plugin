import { addIcon, App, Plugin, PluginManifest, TFile } from "obsidian";
import { MAIN_INTERFACE_CLASS, RibbonIcon } from "./constants";

import AppleApi from "./api/AppleApi";
import { List } from "./interfaces";
import { mapReplacer, logger } from "./utils";
import { StatusBar } from "./helpers";

addIcon("reminders-app", RibbonIcon);

export default class AppleRemindersPlugin extends Plugin {
	apple = new AppleApi();
	filePath = "Reminders.app.md";
	file: TFile;
	reminders: Map<string, List>;
	ribbonIcon: HTMLElement;
	statusBar = new StatusBar(this.addStatusBarItem());

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
		this.ribbonIcon = this.addRibbonIcon("reminders-app", `Open ${this.filePath}`, () => {
			try { this.app.vault.adapter.read(this.filePath) }
			catch {
				this.app.vault.adapter.write(this.filePath, "# Reminders.app");
			}
			if (this.file == null)
				this.file = this.app.vault.getFiles().find(f => f.path === this.filePath)

			this.app.workspace.openLinkText("Reminders.app.md", this.filePath);
		})
	}

	async onload() {
		logger("Apple Reminders Plugin is Loading...");
		this.statusBar.message("Apple Reminders Loading...");

		this.apple.getLists().then(res => {

			this.reminders = res;

			this.reminders.forEach((value: List, key: string) => {

				this.statusBar.message(`Getting ${value.name}...`);

				this.apple.getActiveReminders(value.name).then(rems => {
					let lst = this.reminders.get(key)
					if (lst) {
						this.reminders.set(key, { ...lst, reminders: rems })
						this.statusBar.message(`${value.name} Successfully Retrieved. Writing to ${this.filePath}`);
						this.app.vault.adapter.write(this.filePath, "```" + MAIN_INTERFACE_CLASS + "\n" + JSON.stringify(Array.from(this.reminders.entries()), mapReplacer, 2) + "\n```");
						this.statusBar.message(`Done Updating ${value.name}.`)
					}

				})
			})
		})

	}

	onunload() {
		logger("Apple Reminders Plugin is Unloading...");
	}
}