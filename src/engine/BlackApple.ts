import osascript from 'node-osascript';
import { AppleData, AppleScript, AppleResource, QueryString } from 'src/interfaces';
import { logger } from 'src/tools';

const ScriptExecutor = osascript.execute;


const scripts = {
	//Lists
	get_lists: () => `tell application "Reminders" to return properties of lists`,
	get_list: (list: AppleScript) => `tell application "Reminders" to return properties of reminders in "${list.script}" whose completed is false`,

	//Reminders
	get_reminder: (name: AppleScript) => `tell application "Reminders" to return properties of reminders whose name is ${name.script}`,
	get_all_reminders: () => `tell application "Reminders" to return properties of reminders`,
	get_all_active_reminders: () => `tell application "Reminders" to return properties of reminders whose completed is false`,

	add_reminder: (list: AppleScript, properties: AppleScript) => `tell "${list.script}" of application "Reminders" to make new reminder with properties {${properties.script}}`,
	mark_reminder_completed: (list: AppleScript, name: AppleScript) => `tell list "${list.script}" of application "Reminders" to set completed of (reminders whose name is "${name.script}") to false`,
	remove_reminder: (list: AppleScript, name: AppleScript) => `tell list "${list.script}" of application "Reminders" to delete (every reminder whose name is "${name.script}")`,
	alter_reminder: (list: AppleScript, name: AppleScript, properties: AppleScript) => `tell list "${list.script}" of application "Reminders" to set properties of (reminders whose name is "${name.script}") to ${properties.script}`,

	//Bath Operations
	batch_add_reminders: (list: AppleScript, properties: AppleScript[]) => `
	tell "" of application "Reminders"
		${properties.map(props => {
		return `make new reminder with properties ${props.script}`;
	})}
	end tell
	`
}

export default class Engine {

	supportedApplications: AppleResource[];
	supportedAobjects: AppleResource[];
	keywords: AppleResource[];

	constructor() {
		this.supportedAobjects = [
			{ name: "list" },
			{ name: "reminder" }
		];
		this.supportedApplications = [
			{ name: "reminders" }
		]
		this.keywords = [
			{name: "reminders"},
			{name: "lists"}
		];
	}

	async process(query: QueryString): Promise<AppleData> {
		let script = await this.compile(query);
		// logger(this, "Compiled BlackApple to AppleScript", {
		// 	query, script
		// })
		return new Promise<AppleData>((resolve, reject) => {
			ScriptExecutor(script, (err:any, data:object, raw:any) => {
				if (err) reject(err);
				resolve({data});
			})
		});
	}

	private async compile(query: QueryString) {
		return await this.bod(query.query.trim())
	}

	private async bod(token: string) {
		logger(this, "Tokens before clean", {token});
		let tokens = token.trim().replace("\n", "").split("-");
		logger(this, "Tokens after clean", {tokens});
		let application = await this.application(tokens[0]);
		let query = await this.query(tokens[1]);
		return `
			tell ${application}
				set aggregation to {}
					${query}
				return aggregation
			end tell
		`
	}

	private async query(token: string) {
		let tokens = token.trim().split(";");
		tokens.remove("");
		logger(this, "Query Tokens", {tokens});
		if (tokens.length == 0) throw "Empty query not allowed!";
		else {
			let buf = ``;
			let phrase = ``;
			for (let ind = 0; ind < tokens.length; ++ind) {
				let tok = tokens[ind];
				phrase = await this.phrase(tok);
				buf += phrase;
			}

			return buf;
		}
	}

	private async phrase(token: string) {
		if(!token) logger(this, "Undefined Token", {token});
		let tokens = token.trim().split(":").splice(0, 2);
		let third = token.trim().split("#");
		logger(this, "Phrase Trimmed token", {
			tokens
		})
		let aoobject = await this.aobject(tokens[0]);
		let identifier = await this.identifier(tokens[1].split("#")[0]); //FIXME: Make this more gracefull
		let args:string = '';

		if(third.length > 1)
			args = await this.args(third[third.length-1]);
		
		return `
				tell ${aoobject} ${identifier}
					set args to properties
					${args}
					set end of aggregation to args
				end tell
				`;
	}

	private async application(token: string) {
		const app = this.supportedApplications.find((el) => el.name.includes(token) != false);
		if (app)
			return `application "${app.name}"`;
		else
			throw `Unsupported Application: "${token}"!`;
	}

	private async aobject(token: string) {
		logger(this, "Aobject", { token })
		const aob = this.supportedAobjects.concat(this.keywords).find((el) => el.name.includes(token) != false);
		if (aob)
			return `${aob.name}`;
		else
			throw `Unsupported Aobject: "${token}"!`;
	}

	private async identifier(token: string) {
		return `"${token}"`;
	}

	private async args(token: string) {
		let tokens = token.trim().split(",");
		logger(this, "ARGS", {tokens})
		return '';
	}
}