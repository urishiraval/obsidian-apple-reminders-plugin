import { Notice, Plugin } from 'obsidian';
import { ListElement } from './ui/list.element';
import { RemindersDataService } from "./data/reminders-data.service";
import { parse } from 'yaml';
import { interval, Subscription } from 'rxjs';
import { AppleRemindersPluginSettings, SampleSettingTab, DEFAULT_SETTINGS } from './ui/settings';
import { AppleReminderSpec } from './models/shared.models';



export default class AppleRemindersPlugin extends Plugin {
	settings: AppleRemindersPluginSettings;

	elementRegister: { [key: string]: { list: ListElement; sub: Subscription; spec: AppleReminderSpec } } = {};

	statusBar: HTMLElement;

	message(msg: string, disappearIn?: number) {
		if (disappearIn) {
			this.statusBar.setText(msg)
			setTimeout(() => {
				this.statusBar.setText("🍎")
			}, disappearIn);
		}
		else
			this.statusBar.setText(msg)
	}


	async onload() {
		await this.loadSettings();

		// TODO: Create Reminders view on side panel when clicking ribbon icon
		// const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
		// Called when the user clicks the icon.
		// new Notice('This is a notice!');
		// });

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		this.statusBar = this.addStatusBarItem();
		this.statusBar.setText('Loading Apple Reminders...');

		this.addSettingTab(new SampleSettingTab(this.app, this));

		RemindersDataService.setLogger((x, timeout?: number) => this.message(x, timeout))
		RemindersDataService.setSettings(this.settings);

		this.registerMarkdownCodeBlockProcessor('apple-reminders', (src, el, ctx) => {
			const spec = parse(src.trim());
			if (!spec["list"]) {
				new Notice("You cannot have an apple-reminders block without a list name!", 3000);
				el.innerHTML = `
					<pre>Please add list name to continue</pre>
				`;
				return;
			}
			let lE = new ListElement(spec);
			let fileName = ctx.sourcePath.split("\\").last()?.split("/").last()?.trim().split(".").first();
			lE.fileName = fileName;

			let x = interval(RemindersDataService.getSettings().autoRefreshTime * 10000).subscribe(() => {
				RemindersDataService.fetchData(spec, fileName).then(
					([listData, reminders, customReminders]) => {
						lE.reminders = reminders;
						lE.listMeta = listData;
						lE.customReminders = customReminders;
						// console.log({ listData, reminders, customReminders });

					}
				)
			});

			this.elementRegister[src.trim()] = {
				list: lE,
				spec: spec,
				sub: x
			}

			RemindersDataService.fetchData(spec, fileName).then(
				([listData, reminders, customReminders]) => {
					lE.reminders = reminders;
					lE.listMeta = listData;
					lE.customReminders = customReminders;
					// console.log({ listData, reminders, customReminders });

				}
			)

			el.appendChild(lE);
		})
	}

	onunload() {
		Object.keys(this.elementRegister).forEach(key => {
			this.elementRegister[key].sub.unsubscribe();
		})
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}


