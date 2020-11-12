import { addIcon, App, Plugin, PluginManifest, TFile } from "obsidian";
import yaml from 'js-yaml';

import { REMINDERS_CLASS, RibbonIcon } from "./constants";
import { IInjection, RemindersSettings, PluginSettings } from "./interfaces";
import { logger } from "./tools";
import { Cache, StatusBar } from "./helpers";
import ListHTML from "./ui/List.svelte";
import { AppleList } from './models/Reminders.app';
// import { MainInterface } from './models/MainInterface';


addIcon("reminders-app", RibbonIcon);

export default class AppleRemindersPlugin extends Plugin {
	file: TFile;
	ribbonIcon: HTMLElement;
	statusBar: StatusBar;
	settings: PluginSettings;
	cache: Cache;
	private observer: MutationObserver;
	private injections: IInjection[];
	// private view: MainInterface;

	lists = new Map<string, AppleList>();

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
		this.statusBar = new StatusBar(this.addStatusBarItem());
		this.statusBar.message("Loading Settings...")
		this.cache = new Cache(this);
		this.injections = [];
	}

	async onload() {
		logger(this, "Apple Reminders Plugin is Loading...");
		this.registerInterval(
			window.setInterval(this.injectQueries.bind(this), 1000)
		);

		// We need to manually call destroy on the injected Svelte components when they are removed.
		this.observer = new MutationObserver((mutations, observer) => {
			if (this.injections.length == 0) {
				return;
			}

			mutations.forEach((mutation) => {
				mutation.removedNodes.forEach((removed) => {
					const removedIndex = this.injections.findIndex(
						(ele) => ele.workspaceLeaf == removed
					);

					if (removedIndex == -1) {
						return;
					}

					const { workspaceLeaf, component } = this.injections[removedIndex];

					logger(
						this,
						"Removing mounted Svelte component",
						{
							root: workspaceLeaf,
							component: component,
						}
					);

					this.injections.splice(removedIndex, 1);
					component.$destroy();
				});
			});
		});

		const workspaceRoot = document.getElementsByClassName("workspace")[0];
		this.observer.observe(workspaceRoot, { childList: true, subtree: true });
	}

	async injectQueries() {
		var settings: RemindersSettings;


		let settingsElements = document.querySelectorAll<HTMLPreElement>(`pre[class*="${REMINDERS_CLASS}"]`);
		for (let i = 0; i < settingsElements.length; ++i) {
			let node = settingsElements[i];

			settings = yaml.load(node.innerText);

			logger(this, "Settings", settings);

			if (!settings.list) throw ("No List Specified!");

			let lst = this.lists.get(settings.list);
			if (!lst) {
				lst = await (new AppleList({ name: settings.list })).sync();
				logger(this, "Created New List", lst);
				this.lists.set(settings.list, lst);
				// this.view.addList(lst);
			}

			if (settings.reminders) {
				settings.reminders.forEach(elem => {
					logger(this, "Custom Reminders", { name: elem, completed: false });
					lst.addCustomReminder({ name: elem, completed: false });
				});
			}

			logger(
				this,
				"Found Main Reminders.app block.",
				{ context: node }
			);

			const root = node.parentElement;
			if (root) {
				root.removeChild(node);

				let queryNode = new ListHTML({
					target: root,
					props: {
						model: lst
					}
				});

				const workspaceLeaf = root.closest(".workspace-leaf");
				workspaceLeaf.classList.add("contains-reminder-list");

				const injection = {
					component: queryNode,
					workspaceLeaf: workspaceLeaf,
				};

				logger(
					this,
					"Injected into Main Reminders.app Block.",
					{ context: injection }
				);

				this.injections.push(injection);
			}
			else {
				logger(this, "UNDEFINED", node);
			}
		}
	}


	onunload() {
		logger(this, "Apple Reminders Plugin is Unloading...");
		this.observer.disconnect();
		this.observer = null;

		this.injections.forEach((injection) => injection.component.$destroy());
		this.injections = [];

		this.app.workspace.getLeavesOfType("apple-reminders-interface").forEach((leaf) => leaf.detach());
	}
}