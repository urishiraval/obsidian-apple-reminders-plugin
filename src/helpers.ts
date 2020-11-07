import { Plugin } from "obsidian";

import { CacheData } from "./interfaces";
import { logger } from "./utils";

export class StatusBar {
    statusBar: HTMLElement;
    loaders = new Map<string, boolean>();

    constructor(statusBar: HTMLElement) {
        this.statusBar = statusBar;
    }

    message(msg: string, disapearIn?: number) {
        logger(msg);
        if (disapearIn) {
            this.statusBar.setText(msg)
            setTimeout(() => {
                this.statusBar.setText("Ready.")
            }, disapearIn);
        }
        else
            this.statusBar.setText(msg)
    }

    loading(node: string, isLoading: boolean) {
        this.loaders.set(node, isLoading);
    }
}

export class Cache {
    plugin: Plugin;
    data: CacheData;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
    }

    load() {
        return new Promise<CacheData>((resolve, reject) => {
            this.plugin.loadData().then(data => {
                if(null == data) {
                    this.data = {
                        settings: {
                            centralFilePath: "Reminders.app.md"
                        },
                    };
                    resolve(this.data);
                    this.save();
                }
                else {
                    this.data = data;
                    resolve(data)
                };
            })

        })
    }

    update(key: string, value: any) { }

    save() {
        return this.plugin.saveData(this.data);
    }
}

export class Translator {
    jsonToMarkdown(json:Object) {
        
    }
}