import { stat } from 'fs';

import { logger } from "./utils";

export class StatusBar {
    statusBar:HTMLElement;
    loaders = new Map<string, boolean>();

    constructor(statusBar:HTMLElement) {
        this.statusBar = statusBar;
    }

    message(msg:string, disapearIn?:number) {
        logger(msg);
        if(disapearIn) {
            this.statusBar.setText(msg)
            setTimeout(() => {
                this.statusBar.setText("Ready.")
            }, disapearIn);
        }
        else
            this.statusBar.setText(msg)
    }

    loading(node:string, isLoading:boolean) {
        this.loaders.set(node, isLoading);
    }
}