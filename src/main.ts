import { addIcon, App, Plugin, PluginManifest, TFile } from "obsidian";
import { MAIN_INTERFACE_CLASS, RibbonIcon } from "./constants";

import AppleApi from "./api/AppleApi";
import { List, ReminderSettings } from "./interfaces";
import { mapReplacer, logger } from "./utils";
import { Cache, StatusBar } from "./helpers";

addIcon("reminders-app", RibbonIcon);

export default class AppleRemindersPlugin extends Plugin {
	apple = new AppleApi();
	file: TFile;
	reminders: Map<string, List>;
	ribbonIcon: HTMLElement;
	statusBar: StatusBar;
	settings: ReminderSettings;
	cache: Cache;

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
		this.statusBar = new StatusBar(this.addStatusBarItem());
		this.statusBar.message("Loading Settings...")
		this.cache = new Cache(this);
	}

	async onload() {
		logger("Apple Reminders Plugin is Loading...");
		this.cache.load().then(cashe => {
			this.statusBar.message("Cache loaded.")
			this.statusBar.message("Apple Reminders Loading...");

			this.apple.getLists().then(res => {

				this.reminders = res;

				this.reminders.forEach((value: List, key: string) => {

					this.statusBar.message(`Getting ${value.name}...`);

					this.apple.getActiveReminders(value.name).then(rems => {
						let lst = this.reminders.get(key)
						if (lst) {
							this.reminders.set(key, { ...lst, reminders: rems })
							this.statusBar.message(`${value.name} Successfully Retrieved. Writing to ${cashe.settings.centralFilePath}`);
							this.app.vault.adapter.write(cashe.settings.centralFilePath, "```" + MAIN_INTERFACE_CLASS + "\n" + JSON.stringify(Array.from(this.reminders.entries()), mapReplacer, 2) + "\n```");
							this.statusBar.message(`Done Updating ${value.name}.`)
						}

					})
				})
			})
		})


	}

	onunload() {
		logger("Apple Reminders Plugin is Unloading...");
	}
}