import { addIcon, App, Plugin, PluginManifest, TFile } from "obsidian";
import yaml from 'js-yaml';

import { DELIMITER, MAIN_INTERFACE_CLASS, REMINDERS_CLASS, RibbonIcon, TASK_LIST_CLASS, TASK_LIST_ITEM_CLASS } from "./constants";
import { List, Reminder, IInjection, QueryString, RemindersSettings, PluginSettings } from "./interfaces";
import { logger } from "./tools";
import { Cache, StatusBar } from "./helpers";
import ListHTML from "./ui/List.svelte";
import ReminderHTML from "./ui/Reminder.svelte";
import api from "./engine/api";

const factory = (className: string, args: {}) => {
    return (className == 'apple-reminder') ? new ReminderHTML(args) : new ListHTML(args);
}

addIcon("reminders-app", RibbonIcon);

export default class AppleRemindersPlugin extends Plugin {
	file: TFile;
	ribbonIcon: HTMLElement;
	statusBar: StatusBar;
	settings: PluginSettings;
	cache: Cache;
	private observer: MutationObserver;
	private injections: IInjection[];

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
		this.ribbonIcon = this.addRibbonIcon("reminders-app", "Apple Reminders.app", () => {
			// if (this.cache.isReady()) {
			// 	let centralFilePath = this.cache.data.settings.centralFilePath;
			// 	this.app.workspace.openLinkText(centralFilePath, centralFilePath);

			// }
		});
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

		this.refreshMainInterface();


	}

	refreshMainInterface() {
		// this.cache.load().then(cashe => {
		// 	// this.statusBar.message("Cache loaded.")
		// 	// this.statusBar.message("Apple Reminders Loading...");
		// 	this.app.vault.adapter.write(cashe.settings.centralFilePath, `\`\`\`${MAIN_INTERFACE_CLASS}\nreminders-list:name=Errands;\n\`\`\``)
		// })
	}

	injectQueries() {
		var settingsElement: HTMLElement, liElements: NodeListOf<HTMLElement>, settings: RemindersSettings;

		document.querySelectorAll<HTMLElement>(`ul[class*="${TASK_LIST_CLASS}"]`).forEach(ul => {
			if (ul.parentElement.previousElementSibling) {
				settingsElement = ul.parentElement.previousElementSibling.querySelector<HTMLPreElement>(`pre[class*="${REMINDERS_CLASS}"]`);
				if (settingsElement) { //
					settings = yaml.load(settingsElement.innerText);
					if (!settings.list) throw ("No List Specified!");

					liElements = ul.querySelectorAll<HTMLElement>(`li[class*="${TASK_LIST_ITEM_CLASS}"]`);

					var reminders: Reminder[] = [];

					liElements.forEach(node => {
						//
						var tasks = (node.innerText.includes("\n")) ? node.innerText.slice(0, node.innerText.indexOf("\n")).trim() : node.innerText.trim();
						var t: Reminder = { name: tasks, completed: false, nodes: [node] };
						reminders.push(t);

					});


					api.processReminders({ name: settings.list, nodes: [settingsElement] }, reminders).then(res => {
						logger(this, "List", res);
						// res.list.render(this.injections);
						// logger(this, "Reminders", res);
						// res.rems.forEach(async r => {
						// 	await r.render(this.injections);
						// })

						logger(this, "Rendering", res.rems);
						for (var i = 0; i < res.rems.length; ++i) {
							var node = liElements[i];
							if(!node) break;

							node.addClass(node.className);

							var root = node.parentElement;
							try {
								root.removeChild(node);
							}
							catch {
								logger(node, "render issue");
								return;
							}

							const workspaceLeaf = root.parentElement.closest(".workspace-leaf");
							try {
								workspaceLeaf.classList.add(`contains-${node.className}`);
							}
							catch {
								logger(node, "render issue");
								return;
							}


							var ui = factory(node.className, {
								target: root,
								props: {
									model: node
								}
							})

							const injection = {
								component: ui,
								workspaceLeaf: workspaceLeaf,
							};

							this.injections.push(injection);
						}


					})
				}
			}
		})

		//---------------------------------------------------

		// let settingsElement: HTMLPreElement;
		// let tasks: NodeListOf<HTMLElement>;
		// let rems: AppleReminder[] = [];
		// document.querySelectorAll<HTMLElement>(`ul[class*="${TASK_LIST_CLASS}"]`).forEach(ul => {
		// 	if (ul.parentElement.previousElementSibling) {
		// 		settingsElement = ul.parentElement.previousElementSibling.querySelector<HTMLPreElement>(`pre[class*="${REMINDERS_CLASS}"]`);
		// 		if (settingsElement) {
		// 			let settings: RemindersSettings = yaml.load(settingsElement.innerText);
		// 			if (!settings.list) throw ("No List Specified for Reminders!");
		// 			//---------------------------------------------------
		// 			tasks = ul.querySelectorAll(`li[class*="${TASK_LIST_ITEM_CLASS}"]`);
		// 			tasks.forEach(node => {
		// 				let temp = (node.innerText.includes("\n")) ? node.innerText.slice(0, node.innerText.indexOf("\n")).trim() : node.innerText.trim();
		// 				let y = new Map<string, AppleReminder>();
		// 				temp.split(DELIMITER).forEach(setting => {
		// 					let s = new Map<string, any>(Object.entries(yaml.load(setting)));
		// 					s.forEach((value: any, key: string) => {
		// 						y.set(key, s.get(key));
		// 					});
		// 				});
		// 				rems.push(y);
		// 			});
		// 			api.processReminders(settings.list, rems)
		// 		}
		// 	}
		// });

		//---------------------------------------------------

		// logger(this, "Reminders", { raw_reminders });

		// let reminders:string[] = []

		// for(let i = 0; i < tasks.length; ++i) {
		// const node = tasks[i];
		// reminders.push((node.innerText.includes("\n"))? node.innerText.slice(0, node.innerText.indexOf("\n")).trim(): node.innerText.trim());
		// logger(this, "List Elements", {text: (node.innerText.includes("\n"))? node.innerText.slice(0, node.innerText.indexOf("\n")).trim(): node.innerText.trim()});
		// }

		// api.processReminders(reminders)

		// const main_interface = document.querySelectorAll<HTMLPreElement>(
		// 	'pre[class*="' + MAIN_INTERFACE_CLASS + '"]'
		// );

		// for (var i = 0; i < main_interface.length; i++) {
		// 	const node = main_interface[i];

		// 	logger(
		// 		this,
		// 		"Found Main Reminders.app block.",
		// 		{ context: node }
		// 	);

		// 	const root = node.parentElement;
		// 	const query:QueryString = {query: node.innerText};

		// 	root.removeChild(node);
		// 	let queryNode = new List({
		// 		target: root,
		// 		props: {
		// 			root,
		// 			data: query
		// 		}
		// 	});

		// 	const workspaceLeaf = root.closest(".workspace-leaf");
		// 	workspaceLeaf.classList.add("contains-reminder-list");

		// 	const injection = {
		// 		component: queryNode,
		// 		workspaceLeaf: workspaceLeaf,
		// 	};

		// 	logger(
		// 		this,
		// 		"Injected into Main Reminders.app Block.",
		// 		{ context: injection }
		// 	);

		// 	this.injections.push(injection);
		// }
	}


	onunload() {
		logger(this, "Apple Reminders Plugin is Unloading...");
		this.observer.disconnect();
		this.observer = null;

		this.injections.forEach((injection) => injection.component.$destroy());
		this.injections = [];
	}
}