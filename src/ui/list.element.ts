import { LitElement, html, css, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { AppleReminderSpec, ListModel, ReminderModel } from 'src/models/shared.models';
import { ReminderElement } from './reminder.element';
import { BehaviorSubject, interval } from 'rxjs';
import * as moment from 'moment';
import { RemindersDataService } from 'src/reminders-data.service';

@customElement('apple-list-element')
export class ListElement extends LitElement {

	@property() spec: BehaviorSubject<AppleReminderSpec>;

	@state() reminders: ReminderModel[] = [];
	@state() listMeta: ListModel;

	get elements() {
		return this.reminders.map((rem) => {
			let el = new ReminderElement();
			el.model = rem;
			el.list_name = this.listMeta.name;
			return el;
		});
	}

	fetchData(spec: AppleReminderSpec) {
		Promise.all([
			RemindersDataService.getList(spec.list),
			RemindersDataService.getReminders(spec["list"], spec["filters"])
		]).then(([listMeta, reminders]) => {
			this.reminders = reminders;
			this.listMeta = listMeta;
		})
	}

	constructor(_spec: AppleReminderSpec) {
		super();
		this.spec = new BehaviorSubject(_spec);
		this.spec.subscribe(spec => {
			this.fetchData(spec);
		})

		interval(RemindersDataService.getSettings().autoRefreshTime*1000).subscribe(() => { this.fetchData(this.spec.value) });
	}

	static styles?: CSSResultGroup | undefined = css`
		.apple-list-reminders {
			margin: 0;
			padding: 0;
		}

		.apple-list-top-rule,
		.apple-list-bottom-rule {
			opacity: 0;
		}
	`;

	refresh() {
		this.fetchData(this.spec.value);
	}

	render() {
		return html`
			${(this.listMeta) ? html`
			<div class="apple-list-container">
				<hr class="apple-list-top-rule" />
				<h2>
					<span
						style="color: ${this.listMeta.color}">${this.listMeta.name}</span>
				</h2>

				<span class="apple-list-reminders">
					${this.elements}
				</span>
				<br />
				<button @click="${this.refresh}">Refresh</button>
				<hr class="apple-list-bottom-rule" />
			</div>`
				: 'loading'
			}
		`;
	}
}
