import { addIcon, App, Plugin, PluginManifest, TFile } from "obsidian";

import { MAIN_INTERFACE_CLASS, RibbonIcon } from "./constants";
import AppleApi from "./api/AppleApi";
import { ListItem, ReminderSettings, IInjection } from "./interfaces";
import { mapReplacer, logger } from "./utils";
import { Cache, StatusBar } from "./helpers";
import List from "./ui/List.svelte";

addIcon("reminders-app", RibbonIcon);

export default class AppleRemindersPlugin extends Plugin {
	apple = new AppleApi();
	file: TFile;
	reminders: Map<string, ListItem>;
	ribbonIcon: HTMLElement;
	statusBar: StatusBar;
	settings: ReminderSettings;
	cache: Cache;
	private observer: MutationObserver;
	private injections: IInjection[];

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
		this.statusBar = new StatusBar(this.addStatusBarItem());
		this.statusBar.message("Loading Settings...")
		this.cache = new Cache(this);
		this.injections = [];
	}

	async onload() {
		logger("Apple Reminders Plugin is Loading...");
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

					logger({
						msg: "Removing mounted Svelte component",
						context: {
							root: workspaceLeaf,
							component: component,
						},
					});

					this.injections.splice(removedIndex, 1);
					component.$destroy();
				});
			});
		});

		const workspaceRoot = document.getElementsByClassName("workspace")[0];
		this.observer.observe(workspaceRoot, { childList: true, subtree: true });




	}

	refreshMainInterface() {
		this.cache.load().then(cashe => {

			this.statusBar.message("Cache loaded.")
			this.statusBar.message("Apple Reminders Loading...");

			this.apple.getLists().then(res => {

				this.reminders = res;

				this.reminders.forEach((value: ListItem, key: string) => {

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

	injectQueries() {
		const main_interface = document.querySelectorAll<HTMLPreElement>(
			'pre[class*="' + MAIN_INTERFACE_CLASS + '"]'
		);

		for (var i = 0; i < main_interface.length; i++) {
			const node = main_interface[i];

			logger({
				msg: "Found Main Reminders.app block.",
				context: node,
			});

			const root = node.parentElement;
			// const data = (node.innerText == "")? {}:JSON.parse(node.innerText);

			root.removeChild(node);
			let queryNode = new List({
				target: root,
				props: {
					data: {}
				}
			});

			const workspaceLeaf = root.closest(".workspace-leaf");
			workspaceLeaf.classList.add("contains-reminder-list");

			const injection = {
				component: queryNode,
				workspaceLeaf: workspaceLeaf,
			};

			logger({
				msg: "Injected into Main Reminders.app Block.",
				context: injection,
			});

			this.injections.push(injection);
		}
	}


	onunload() {
		logger("Apple Reminders Plugin is Unloading...");
		this.observer.disconnect();
		this.observer = null;

		this.injections.forEach((injection) => injection.component.$destroy());
		this.injections = [];
	}
}