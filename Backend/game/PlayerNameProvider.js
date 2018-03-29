var roles = [
	"Adder Fodder",
	"Eye Gazer",
	"Roach Griller",
	"Queen Surrogate",
	"Egg Hatcher",
	"Goblin Driver",
	"Serpent Stopper"
];

var roleUses = {};

roles.forEach(role => roleUses[role] = 0);

module.exports = function(){
	var role = roles[Math.floor(Math.random() * roles.length)];
	roleUses[role]++;

	return roleUses[role] + getOrdering(roleUses[role]) + " " + role;
};

function getOrdering(value){
	var mod10 = value % 10;
	var mod100 = value % 10;
	if (mod10 == 1 && (mod100 < 10 || mod100 >20)){
		return "st";
	}
	if (mod10 == 2 && (mod100 < 10 || mod100 >20)){
		return "nd";
	}
	if (mod10 == 3 && (mod100 < 10 || mod100 >20)){
		return "rd";
	}

	return "th";
}