<script lang="ts">
    import { AppleReminder } from "src/models/Reminders.app";

    export let model: AppleReminder;

    $: m = model.properties;
    
    setInterval(() => {m = model.properties}, 1000)

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
    }

    .checkbox-round:checked {
        background-color: gray;
    }

    .apple-reminder-name {
        padding-left: 1rem;
    }
</style>

<input
    type="checkbox"
    class="checkbox-round"
    on:change={(event) => {
        if (event.target.checked) model.markDone();
        else model.markNotDone();
    }} 
    checked={m.completed}
    />
<span class="apple-reminder-name">{m.name}</span>
