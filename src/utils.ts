import { debug } from 'console'

export function mapReplacer(key: any, value: any) {
	if (value instanceof Map) {
		return Array.from(value.entries())
	}
	return value
}

export function logger(msg:any) {
    console.log(msg);
}