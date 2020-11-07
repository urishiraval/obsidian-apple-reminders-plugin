<script lang="ts">
import { QueryString } from 'src/interfaces';

	import { logger } from "src/tools";
	import AppleApi from "../engine/api";
	export let data: QueryString;
	export let root: HTMLElement;
	let _ = {};
	AppleApi.submit(data).then((res) => {
		logger(root, "Result of Query", res);
		_ = res;
	});
</script>

<h3>Query</h3>
<code>{data.query}</code>
<h3>Data</h3>
<pre>{JSON.stringify(_, null, 3)}</pre>
