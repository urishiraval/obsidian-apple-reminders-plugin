import { PluginSettingTab, App, Setting } from "obsidian";
import AppleRemindersPlugin from "./main";

export interface AppleRemindersPluginSettings {
	autoRefreshTime: number;
}

export const DEFAULT_SETTINGS: AppleRemindersPluginSettings = {
	autoRefreshTime: 60
}

export class SampleSettingTab extends PluginSettingTab {
	plugin: AppleRemindersPlugin;

	constructor(app: App, plugin: AppleRemindersPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Apple Reminders Plugin' });

		new Setting(containerEl)
			.setName('Auto Refresh Time (seconds)')
			.setDesc('Please input time in seconds. This controls the interval between which the plugin automatically refreshes with Apple Reminders. (Restart Obsidian for changes to take affect)')
			.setTooltip("300 seconds = 5 minutes")
			.addSlider(text => text
				.setLimits(60, 600, 10)
				.setValue(this.plugin.settings.autoRefreshTime)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.autoRefreshTime = value;
					await this.plugin.saveSettings();
				}));
	}
}