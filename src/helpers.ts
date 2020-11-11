import { Plugin } from "obsidian";

import { CacheData } from "./interfaces";
import { logger } from "./tools";

export class StatusBar {
    statusBar: HTMLElement;
    loaders = new Map<string, boolean>();

    constructor(statusBar: HTMLElement) {
        this.statusBar = statusBar;
    }

    message(msg: string, disapearIn?: number) {
        logger(this, msg);
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
    private ready: boolean;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
        this.ready = false;
    }

    isReady() {
        return ready;
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
                    this.ready = true;
                    resolve(this.data);
                    this.save();
                }
                else {
                    this.data = data;
                    this.ready = true;
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