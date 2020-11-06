import runApplescript from "run-applescript";

import scripts from "./applescripts";
import { List, Reminder } from "../interfaces";
import { DELIMITER } from "../constants";


export default class AppleApi {
    ScriptExecutor = runApplescript;

    getLists() {
        return new Promise<Map<string, List>>((resolve, reject) => {
            this.ScriptExecutor(scripts["get_lists"]()).then(res => {
                let raw_list: Array<string>;
                raw_list = res.split(",");
                raw_list.forEach((value, index) => {
                    raw_list[index] = value.trim();
                })

                let list = new Map<string, List>();
                let seperator = raw_list.findIndex(value => DELIMITER == value)
                for (let i = 0; i < seperator; ++i) {
                    list.set(raw_list[i], { name: raw_list[i + seperator + 1], color: raw_list[i + seperator * 2 + 2], reminders: null });
                }

                resolve(list)

            }).catch((err) => reject(err))
        })
    }

    getActiveReminders(list: string) {
        return new Promise<Map<string, Reminder>>((resolve, reject) => {
            this.ScriptExecutor(scripts["get_active_reminders"](list)).then(res => {
                let raw_list: Array<string>;
                raw_list = res.split(",")
                raw_list.forEach((value, index) => {
                    raw_list[index] = value.trim();
                })

                let list = new Map<string, Reminder>();
                let seperator = raw_list.findIndex(value => DELIMITER == value)
                for (let i = 0; i < seperator; ++i) {
                    list.set(raw_list[i], { id: raw_list[i], name: raw_list[i + seperator + 1], due: raw_list[i + seperator * 2 + 2], remind_me: raw_list[i + seperator * 3 + 3] });
                }

                resolve(list)

            }).catch((err) => reject(err))
        })
    }

}