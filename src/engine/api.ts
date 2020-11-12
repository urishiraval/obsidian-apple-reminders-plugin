import { logger } from "../tools";
import { List, Reminder } from "../interfaces";
import { AppleList, AppleReminder } from 'src/models/Reminders.app';

class AppleApi {
    private static instance: AppleApi;

    private view: Object;
    private static lists = new Map<string, AppleList>();

    private constructor() { }

    public static get Instance() {
        return this.instance || (this.instance = new this());
    }

    // submit(query: QueryString): Promise<AppleData> {
    //     logger(this, "Processing Query", query);
    //     // return this.engine.process(query);
    //     return new Promise<AppleData>((resolve, reject) => {
    //         resolve({ data: { message: "disabled" } })
    //     });
    // }

    processReminders(list: List, reminders: Reminder[]) {
        return new Promise<{list:AppleList, rems:AppleReminder[]}>(async (resolve, reject) => {
            let lst = AppleApi.lists.get(list.name);

            if (!lst) {
                //Create new list
                lst = await (new AppleList(list)).sync();
                AppleApi.lists.set(list.name, lst);
                console.log(`Create ${list.name}`);
            }
    
            await lst.update(list);
    
            let rems = reminders.map(async reminder => {
                let rem = lst.getReminder(reminder.name)
                if (!rem) {
                    //create new rem
                    rem = await ((new AppleReminder(reminder, lst)).sync());
                    lst.addReminder(rem);
                    console.log(`create ${rem.name}`);
                }
                else rem = await rem.update(reminder);
                return rem;
            });
    
            Promise.all(rems).then((res) => {
                resolve({ list: lst, rems:res });
            })
        })

    }
}

export default AppleApi.Instance;

