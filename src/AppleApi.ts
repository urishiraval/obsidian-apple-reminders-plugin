import runApplescript from "run-applescript";
import { List, Reminder } from "./interfaces";


const DELIMITER = "|";
const scripts = {
    "get_lists": () => `
                      tell application "Reminders"
                        set _ids to id of lists
                        set names to name of lists
                        set colrs to color of lists
	                      return {_ids, "${DELIMITER}", names, "${DELIMITER}", colrs}
                      end tell
                    `,
    "add_reminder": () => `
					  `,
    "get_active_reminders": (list: string) => `
							tell application "Reminders"
								set l to list "${list}"
	
								set reminder_names to (name of reminders in l whose completed is false)
								set _ids to id of reminders in l whose completed is false
								set reminder_dues to {}
								set reminder_remind_mes to {}
								
								
								set tmp to (due date of reminders in l whose completed is false)
								set dues to {}
								repeat with d in tmp
									set end of dues to my findAndReplace(",", "", d as string)
								end repeat
								set end of reminder_dues to dues
								
								set tmp to (remind me date of reminders in l whose completed is false)
								set rmmes to {}
								repeat with d in tmp
									set end of rmmes to my findAndReplace(",", "", d as string)
								end repeat
								set end of reminder_remind_mes to rmmes
								
								set rems to {_ids, "|", reminder_names, "|", reminder_dues, "|", reminder_remind_mes}
								return rems
							end tell



							on findAndReplace(tofind, toreplace, TheString)
								set ditd to text item delimiters
								set text item delimiters to tofind
								set textItems to text items of TheString
								set text item delimiters to toreplace
								set res to textItems as text
								set text item delimiters to ditd
								return res
							end findAndReplace
						`,
    "get_all_active_reminders": () => `
  					tell application "Reminders"
  						set reminder_names to {}
  						set reminder_dues to {}
  						set reminder_remind_mes to {}
  						set containers to {}
  						repeat with l in lists
	  						set end of containers to {name of l}
	  						set nms to (name of reminders in l whose completed is false)
	  						set end of nms to "#"
	  						set end of reminder_names to nms
	  
	  						set tmp to (due date of reminders in l whose completed is false)
	  						set dues to {}
	  						repeat with d in tmp
		  						set end of dues to my findAndReplace(",", "", d as string)
	  						end repeat
	  						set end of dues to "#"
	  						set end of reminder_dues to dues
	  
	  						set tmp to (remind me date of reminders in l whose completed is false)
	  						set rmmes to {}
	  						repeat with d in tmp
		  						set end of rmmes to my findAndReplace(",", "", d as string)
	  						end repeat
	  						set end of rmmes to "#"
	  						set end of reminder_remind_mes to rmmes
  						end repeat
  						set rems to {containers, "|", reminder_names, "|", reminder_dues, "|", reminder_remind_mes}
  						return rems
					end tell

					on findAndReplace(tofind, toreplace, TheString)
  						set ditd to text item delimiters
  						set text item delimiters to tofind
  						set textItems to text items of TheString
  						set text item delimiters to toreplace
  						set res to textItems as text
  						set text item delimiters to ditd
  						return res
					end findAndReplace
                    `,
    "remove_reminder": () => ``,
    "alter_reminder": () => ``
}


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