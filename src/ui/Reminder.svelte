<script lang="ts">
    import { AppleReminder } from "src/models/Reminders.app";
    import moment from "moment";
import { APPLE_DATE_FORMAT } from "src/constants";

    export let model: AppleReminder;

    $: m = model.properties;

    setInterval(() => {
        m = model.properties;
    }, 1000);
</script>

<style>
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
</style>

<span class="apple-reminder-container">
    <input
        type="checkbox"
        class="checkbox-round"
        on:change={(event) => {
            if (event.target.checked) model.markDone();
            else model.markNotDone();
        }}
        checked={m.completed} />
    <span class="apple-reminder-fields">
        {#if m.priority > 0}
            <span class="apple-reminder-priority">
                {#each Array(Math.ceil((10 - m.priority) / 3)) as _, i}!{/each}
            </span>
        {/if}
        <span class="apple-reminder-name"> {m.name} </span>
        {#if m.body != 'missing value'}
            <br /><small class="apple-reminder-note">{m.body}</small>
        {/if}
        {#if m['due date'] != 'missing value'}
            <br /><small
                class="apple-reminder-due-date">{moment(m['due date'], APPLE_DATE_FORMAT).format('\t YYYY/MM/DD, hh:mm a (Z)')}</small>
        {/if}
    </span>
</span>
