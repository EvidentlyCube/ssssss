const Constants = require('./Constants');

module.exports = {
	shuffleArray: function (array) {
		let currentIndex = array.length, temporaryValue, randomIndex;

		// While there remain elements to shuffle...
		while (0 !== currentIndex) {

			// Pick a remaining element...
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;

			// And swap it with the current element.
			temporaryValue = array[currentIndex];
			array[currentIndex] = array[randomIndex];
			array[randomIndex] = temporaryValue;
		}

		return array;
	},

	dirX: function (dir) {
		return (dir % 3) - 1;
	},

	dirY: function (dir) {
		return Math.floor(dir / 3) - 1;
	},

	dirFromXY: function(deltaX, deltaY){
		return ((deltaY + 1) * 3) + (deltaX + 1);
	},

	nextCw: function(o){
		switch(o){
			case Constants.Moves.NW: return Constants.Moves.N;
			case Constants.Moves.N: return Constants.Moves.NE;
			case Constants.Moves.NE: return Constants.Moves.E;
			case Constants.Moves.E: return Constants.Moves.SE;
			case Constants.Moves.SE: return Constants.Moves.S;
			case Constants.Moves.S: return Constants.Moves.SW;
			case Constants.Moves.SW: return Constants.Moves.W;
			case Constants.Moves.W: return Constants.Moves.NW;
			default: return o;
		}
	},

	nextCcw: function(o){
		switch(o){
			case Constants.Moves.NW: return Constants.Moves.W;
			case Constants.Moves.N: return Constants.Moves.NW;
			case Constants.Moves.NE: return Constants.Moves.N;
			case Constants.Moves.E: return Constants.Moves.NE;
			case Constants.Moves.SE: return Constants.Moves.E;
			case Constants.Moves.S: return Constants.Moves.SE;
			case Constants.Moves.SW: return Constants.Moves.S;
			case Constants.Moves.W: return Constants.Moves.SW;
			default: return o;
		}
	},

	isMove: function(move){
		return (
			move >= Constants.Moves.NW && move <= Constants.Moves.CCW
		) || move == Constants.Moves.Swap
			|| move == Constants.Moves.Restart
			|| move == Constants.Moves.NextLevel
			|| move == Constants.Moves.UndoQueuedMove
			|| move == Constants.Moves.UndoPlayedMove
		|| move == Constants.Moves.DebugComplete;
	},

	isDebugMove: function(move){
		return move == Constants.Moves.DebugComplete
	},

	isArrow: function (tile) {
		return tile >= Constants.TileTypes.ArrowNW && tile <= Constants.TileTypes.ArrowSE;
	},

	doesArrowBlock: function (tile, moveDirection) {
		switch (tile) {
			case Constants.TileTypes.ArrowN:
				return (moveDirection == Constants.Moves.S || moveDirection == Constants.Moves.SW || moveDirection == Constants.Moves.SE);
			case Constants.TileTypes.ArrowS:
				return (moveDirection == Constants.Moves.N || moveDirection == Constants.Moves.NW || moveDirection == Constants.Moves.NE);
			case Constants.TileTypes.ArrowW:
				return (moveDirection == Constants.Moves.E || moveDirection == Constants.Moves.SE || moveDirection == Constants.Moves.NE);
			case Constants.TileTypes.ArrowE:
				return (moveDirection == Constants.Moves.W || moveDirection == Constants.Moves.SW || moveDirection == Constants.Moves.NW);
			case Constants.TileTypes.ArrowNW:
				return (moveDirection == Constants.Moves.S || moveDirection == Constants.Moves.E || moveDirection == Constants.Moves.SE);
			case Constants.TileTypes.ArrowSW:
				return (moveDirection == Constants.Moves.N || moveDirection == Constants.Moves.E || moveDirection == Constants.Moves.NE);
			case Constants.TileTypes.ArrowNE:
				return (moveDirection == Constants.Moves.S || moveDirection == Constants.Moves.W || moveDirection == Constants.Moves.SW);
			case Constants.TileTypes.ArrowSE:
				return (moveDirection == Constants.Moves.N || moveDirection == Constants.Moves.W || moveDirection == Constants.Moves.NW);
			default:
				return false;
		}
	}
};