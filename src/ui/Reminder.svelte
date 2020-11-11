<script lang="ts">
    import { AppleResource } from "src/models/Reminders.app";
    export let model: AppleResource;
</script>

<li><input type="checkbox">{model.getName()}</li>
