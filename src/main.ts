import { Plugin } from 'obsidian';
import { ListElement } from './ui/list.element';
import { RemindersDataService } from "./reminders-data.service";
import { parse } from 'yaml';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { AppleReminderSpec } from './models/shared.models';
import { AppleRemindersPluginSettings, SampleSettingTab, DEFAULT_SETTINGS } from './settings';
import { threadId } from 'worker_threads';



export default class AppleRemindersPlugin extends Plugin {
	settings: AppleRemindersPluginSettings;

	blocks: BehaviorSubject<AppleReminderSpec>[] = [];
	subs: Subscription[] = [];

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

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.

		RemindersDataService.setLogger((x, timeout?: number) => this.message(x, timeout))
		RemindersDataService.setSettings(this.settings);

		this.registerMarkdownCodeBlockProcessor('apple-reminders', (src, el, ctx) => {
			const spec = parse(src);
			let lE = new ListElement(spec);

			RemindersDataService.fetchData(spec).then(([listData, reminders]) => {
				lE.listMeta =  listData;
				lE.reminders = reminders;
			})

			let x = interval(RemindersDataService.getSettings().autoRefreshTime * 1000).subscribe(() => { RemindersDataService.fetchData(spec).then(
				([listData, reminders]) => {
					lE.reminders = reminders;
					lE.listMeta = listData;
				}
			) });

			this.subs.push(x);
			el.appendChild(lE);
		})
	}

	onunload() {
		this.subs.forEach(s => s.unsubscribe());

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}


