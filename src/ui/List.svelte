<script lang="ts">
import { log } from 'console';

	import { AppleList } from "src/models/Reminders.app";
	export let model: AppleList;

	$: {
		log({color: model.properties.color});
	}
</script>

<h2><span  style="color: {model.properties.color}">{model.getName()}</span></h2>
