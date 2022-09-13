import { LitElement, html, css, CSSResultGroup } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import * as moment from 'moment';
import { APPLE_DATE_FORMAT } from 'src/contants';
import { ReminderModel } from 'src/models/shared.models';
import { RemindersDataService } from 'src/reminders-data.service';

@customElement('apple-reminder-element')
export class ReminderElement extends LitElement {

	@property() list_name: string;
	@property() model: ReminderModel;

	static styles?: CSSResultGroup | undefined = css`
		.checkbox-round {
			width: 1.3em;
			height: 1.3em;
			background-color: rgba(255, 255, 255, 0);
			border-radius: 50%;
			vertical-align: middle;
			border: 1px solid rgb(170, 168, 168);
			-webkit-appearance: none;
			outline: none;
			cursor: pointer;
			opacity: 0.3;
		}

		.checkbox-round:checked {
			background-color: gray;
		}

		.apple-reminder-name {
			padding-left: 1rem;
		}

		.apple-reminder-due-date {
			opacity: 0.3;
			padding-left: 4em;
		}
		.apple-reminder-container {
			padding: 0;
			margin: 0;
		}
		.apple-reminder-priority {
			color: red;
		}
		.apple-reminder-note {
			opacity: 0.3;
			padding-left: 4em;
		}
		.apple-list-break {
			margin: 0;
		}

		.apple-list-reminder-break-line {
			margin-left: 2em;
			margin-top: 0.5em;
			margin-bottom: 0.5em;
			padding: 0;
			height: 0.5px;
			opacity: 0.2;
		}
	`;

	onCheckboxChange(event: any) {
		RemindersDataService.toggleReminderDoneStatus(this.list_name, this.model.name).then(rem => {
			this.model = rem;
		});
	}

	render() {
		return html`
			<span class="apple-reminder-container">
				<input
					type="checkbox"
					class="checkbox-round"
					@change=${this.onCheckboxChange}
					?checked=${this.model.completed} />
				<span class="apple-reminder-fields">
					${(this.model.priority && this.model.priority > 0) ?
				html`
							<span class="apple-reminder-priority">
								${Array(Math.ceil((10 - this.model.priority) / 3)).reduce((prev, curr) => prev + "!", "")}
							</span>
						`: ""
			}
					<span class="apple-reminder-name"> ${this.model.name} </span>
					${(this.model.body && this.model.body != 'missing value') ?
				html`<br /><small class="apple-reminder-note">${this.model.body}</small>`
				: ""
			}
					${(this.model['due date'] && this.model['due date'] != 'missing value') ?
				html`<br /><small class="apple-reminder-due-date">${moment(this.model['due date'], APPLE_DATE_FORMAT).format('\t YYYY/MM/DD, hh:mm a (Z)')}</small>`
				: ""
			}
				</span>
			</span>
									<br class="apple-list-break"/>
									<hr class="apple-list-reminder-break-line" />
		`;
	}


}
