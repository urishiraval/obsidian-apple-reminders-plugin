import { LitElement, html, css, CSSResultGroup } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { AppleReminderSpec, ListModel, ReminderModel } from 'src/models/shared.models';
import { ReminderElement } from './reminder.element';

@customElement('apple-list-element')
export class ListElement extends LitElement {

	@property() spec: AppleReminderSpec;

	@property() reminders: ReminderModel[] = [];
	@property() listMeta: ListModel;

	get elements() {
		return this.reminders.map((rem) => {
			let el = new ReminderElement();
			el.model = rem;
			el.list_name = this.listMeta.name;
			return el;
		});
	}

	fetchData(spec: AppleReminderSpec) {

	}

	constructor(_spec: AppleReminderSpec) {
		super();
		this.spec = _spec;
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
		// this.fetchData(this.spec.value);
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
