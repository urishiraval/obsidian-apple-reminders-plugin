export function mapReplacer(key: any, value: any) {
	if (value instanceof Map) {
		return Array.from(value.entries())
	}
	return value
}

export function logger(source:Object, msg:any, data?:any) {
	if(data)
		console.log({
			source,
			msg,
			data
		})
	else
    	console.log({source, msg});
}