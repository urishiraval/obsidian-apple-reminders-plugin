import { executor } from './apple-integration';
import { AppleReminderSpec, FilterModel, ListModel, ReminderModel } from '../models/shared.models';
import { AppleRemindersPluginSettings, DEFAULT_SETTINGS } from '../ui/settings';
import { match } from 'assert';
import { predicate } from './utilities';



export const RemindersDataService = (function () {
    let logger = console.log;
    let settings: AppleRemindersPluginSettings = DEFAULT_SETTINGS;

    const getAllLists = async () => {
        logger("Getting all lists");
        return await executor(`tell application "Reminders" to return properties of lists`);
    };

    const getList = async (list_name: ListModel["name"]): Promise<ListModel> => {
        logger("Looking for " + list_name)
        let ret = <ListModel>await executor(
            `tell application "Reminders"
                        try
                            return properties of list list_name
                        on error
                            set lis to make new list
                            set name of lis to list_name
                            return properties of lis
                        end try
                    end tell`,
            { list_name }
        );

        logger("Done", 3000)
        return ret;
    };
    const getReminders = async (list_name: ListModel["name"], filters: FilterModel[] | undefined): Promise<ReminderModel[]> => {
        logger("Getting reminders in " + list_name)
        let x = await executor(
            `tell list list_name in application "Reminders"
                        set buffer to ((current date) - hours * 1)
                        return properties of reminders whose completion date comes after buffer or completed is false	
                    end tell`,
            { list_name }
        );
        logger("Done", 3000)

        if (!Array.isArray(x)) return [];
        if(filters) {
            x = x.filter((value) => predicate(value, filters, null))
        }
        return <ReminderModel[]>x;
    };
    const getOrCreateReminder = async (list_name: ListModel["name"], reminder_name: ReminderModel["name"]): Promise<ReminderModel> => {
        logger("Looking for " + reminder_name + " in " + list_name + " before attempting to create")
        let ret = <ReminderModel> await executor(`tell list list_name in application "Reminders"
                                    try
                                        return properties of reminder reminder_name
                                    on error
                                        set rem to make new reminder
                                        set name of rem to reminder_name
                                        return properties of rem
                                    end try
                                end tell`,
            { list_name, reminder_name });
        return ret;
    };
    const refreshReminder = (reminderId: ReminderModel["id"]) => { };
    const toggleReminderDoneStatus = async (list_name: ListModel["name"], reminder_name: ReminderModel["name"]): Promise<ReminderModel> => {

        logger("Toggling Reminder: " + reminder_name + " in list " + list_name)
        let ret = <ReminderModel>await executor(`tell list list_name in application "Reminders"
                                    set rem to reminder reminder_name
                                    set completed in rem to not completed in rem
                                    return properties of rem
                                end tell`,
            { list_name, reminder_name });
        logger("Done", 3000);
        return ret;
    };

    return {
        getAllLists,
        getList,
        getReminders,
        getOrCreateReminder,
        refreshReminder,
        toggleReminderDoneStatus,

        setLogger: (func: (arg: any, clearAfter: number | undefined) => void) => {
            logger = (x, clearAfter) => {
                func(x, clearAfter);
                // console.log({ x, clearAfter })
            };
        },

        setSettings: (_settings: AppleRemindersPluginSettings) => {
            settings = _settings;
        },

        fetchData: (spec: AppleReminderSpec, fileName: string | null = null) => {
            let customReminders = spec.reminders? spec.reminders: [];
            // console.log({customReminders});
            
            return Promise.all([
                getList(spec.list),
                getReminders(spec["list"], spec["filters"]),
                Promise.all(customReminders.map(rem => getOrCreateReminder(spec.list, rem)))
            ])
        },

        getSettings: () => settings
    }
})();