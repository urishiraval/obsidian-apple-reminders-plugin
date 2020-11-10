import osascript from 'node-osascript';
import { AppleData, AppleScript, AppleResource, QueryString } from 'src/interfaces';
import { logger } from 'src/tools';

const ScriptExecutor = osascript.execute;


export default class Engine {

	supportedApplications: AppleResource[];
	supportedAobjects: AppleResource[];
	elements: AppleResource[];
	counter: number;

	constructor() {
		this.counter = 0;
		this.supportedAobjects = [
			{ name: "list" },
			{ name: "reminder" },
			{ name: "event" },
			{ name: "calendar" }
		];
		this.supportedApplications = [
			{ name: "reminders" },
			{ name: "calendar" }
		]
		this.elements = [
			{ name: "reminders", id: "Reminders" },
			{ name: "properties", id: "Properties" },
			{ name: "remind me date", id: "RemindMeDate" },
			{ name: "due date", id: "DueDate" },
			{ name: "events", id: "AllEvents" },
			{ name: "lists", id: "Lists" }
		];
	}

	async process(query: QueryString): Promise<AppleData> {
		let script = await this.compile(query);
		logger(this, "Compiled BlackApple to AppleScript", {
			query, script
		})
		return new Promise<AppleData>((resolve, reject) => {
			logger(this, "Resolving Compiled Query", { query, script })
			ScriptExecutor(script, (err: any, data: object, raw: any) => {
				if (err) reject(err);
				resolve({ data });
			})
		});
	}

	private async compile(query: QueryString) {
		return await this._bod(query.query.trim())
	}

	private async _bod(token: string) {
		let tokens = token.trim().replace("\n", "").split("-");
		let application = await this._application(tokens[0]);
		let query = await this._query(tokens[1]);
		return `
			tell ${application}
				set aggregation to {}
					${query}
				return aggregation
			end tell
		`
	}

	private async _query(token: string) {
		let tokens = token.trim().split(";");
		tokens.remove("");
		// logger(this, "Query Tokens", {tokens});
		if (tokens.length == 0) throw "Empty query not allowed!";
		else {
			let buf = ``;
			let phrase = ``;
			for (let ind = 0; ind < tokens.length; ++ind) {
				let tok = tokens[ind];
				phrase = await this._phrase(tok);
				buf += phrase;
			}

			return buf;
		}
	}

	private async _phrase(token: string) {
		let tokens = token.trim().split(":").splice(0, 2);
		tokens = [tokens[0]].concat(tokens[1].split('#'));

		logger(this, "Phrase", { tokens });

		let aobject: string = await this._aobject(tokens[0]);
		let identifiers: string = await this._identifiers(tokens[1]);
		let elements: string = await this._elements(tokens[2]);

		return `
				tell first ${aobject} ${identifiers}
					set elements to {}
					
					${elements}
					set end of aggregation to {elements:elements, identifiers:identifiers}
				end tell
				`;
	}

	private async _application(token: string) {
		const app = this.supportedApplications.find((el) => el.name.includes(token) != false);
		if (app)
			return `application "${app.name}"`;
		else
			throw `Unsupported Application: "${token}"!`;
	}

	private async _aobject(token: string) {
		// logger(this, "Aobject", { token })
		const aob = this.supportedAobjects.find((el) => el.name.includes(token) != false);
		if (aob)
			return `${aob.name}`;
		else
			throw `Unsupported Aobject: "${token}"!`;
	}

	private async _identifiers(token: string) { //TODO: make this handle ands and ors
		const tokens = token.trim().split('=');
		logger(this, "Identifiers", { tokens });
		if (tokens.length > 2) throw `Incorrect Attributes: ${token}`;
		return `whose ${tokens[0].trim()} contains "${tokens[1].trim()}"\nset identifiers to {}\ncopy {${tokens[0]}:${tokens[0]}} to identifiers\n`;
	}

	private async _elements(token: string) {
		if (!token || token.trim() == ``) return ``;
		let tokens: string[] = []
		token.trim().split(',').forEach((tok, index) => tokens[index] = tok.trim());

		let buf = ``;
		let elem: AppleResource = null;

		tokens.forEach((tok, index) => {
			elem = this.elements.find((el) => el.name.includes(tok) != false);
			++this.counter;
			if (elem)
				buf += `copy {${elem.id}:${elem.name}} to elements\n`;
			else
				throw `Unsupported element: "${tok}"!`;
		})

		return buf;
	}
}