module.exports = {
	"port": process.env.SSSSSS_PORT ?? 3000,
	"debug": envToBool(process.env.SSSSSS_DEBUG, false),
	"redirectToHttps": envToBool(process.env.SSSSSS_HTTPS_REDIRECT, true)
}

function envToBool(value, defaultResult) {
	if (value === null || value === undefined) {
		return defaultResult;
	}
	switch (typeof value) {
		case 'boolean': return value;
		case 'number': return value !== 0;
		case 'string':
			value = value.toLowerCase();
			return value === '1' || value === 'yes' || value === 'true' || value === 'on';
		default:
			return false;
	}
}