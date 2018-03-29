module.exports = function Log(session, type, text){
	const date = new Date();
	let log = `[${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}] `;

	if (session){
		log += `[${session.name}] `;
	}

	log += `[${type}] ${text}`;
	console.log(log);
};

function pad(value){
	if (value.toString().length < 2){
		return "0" + value;
	} else {
		return value;
	}
}