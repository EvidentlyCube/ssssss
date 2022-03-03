
var HTML_RENDERER = (function() {
    var x = 0;
    var y = 0;
	var $gameGrid = $('#gameGrid');
	var $transparentLayer = $('#tLayer');
	var $topLayer = $('#topLayer');
	var $oLayer = [];
	var $fLayer = [];


	for (x = 0; x < GAME_WIDTH; x++) {
		$oLayer[x] = [];
		$fLayer[x] = [];
	}

	for (y = 0; y < GAME_HEIGHT; y++) {
		for (x = 0; x < GAME_WIDTH; x++) {
			var $oItem = $("<div class='cell'><div class='f'></div></div>");
			var $fItem = $oItem.find('.f');

			$gameGrid.append($oItem);
			$oLayer[x][y] = $oItem;
			$fLayer[x][y] = $fItem;
		}
	}

    return {
		clearTopLayer: function() {
			$topLayer.empty();
		},

		clearTransparentLayer: function() {
			$transparentLayer.empty();
		},

		clearFLayer: function() {
			$gameGrid.find('.f').attr('class', 'f');
		},

		clearGhosts: function() {
			$gameGrid.find('.item.ghost').remove();
		},

		oLayerDraw: function(x, y, spriteX, spriteY) {
			if (typeof spriteX === "undefined") {
				spriteY = y.y;
				spriteX = y.x;
				y = x.y;
				x = x.x
			}

			$oLayer[x][y][0].className = "cell g" + spriteX + "x" + spriteY;
		},

		fLayerDraw: function(x, y, spriteX, spriteY) {
			if (typeof spriteX === "undefined") {
				spriteY = y.y;
				spriteX = y.x;
				y = x.y;
				x = x.x
			}

			$fLayer[x][y][0].className = "f g" + spriteX + "x" + spriteY;
		},

		topLayerDraw: function(x, y, spriteX, spriteY, opacity, classes, opts) {
			if (typeof spriteX === "undefined") {
				classes = y.classes || [];
				opacity = y.opacity || 1;
				spriteY = y.y;
				spriteX = y.x;
				y = x.y;
				x = x.x
			}

			opts = opts || {};

			var style = "";
			if (opts.precise) {
				style = "left: " + x + "px;"
					+ "top: " + y + "px;";
			} else {
				classes.push("p" + x + "x" + y);
			}
			classes.push("g" + spriteX + "x" + spriteY);

			if (opacity != 1) {
				classes.push("o" + (opacity * 10).toFixed(0));
			}

			$topLayer.append('<div'
				+ ' class="item ' + classes.join(" ") + '"'
				+ (style ? ' style="'+style+'"' : '')
				+ '></div>');
		},

		transparentLayerDraw: function(x, y, spriteX, spriteY, opacity, classes) {
			if (typeof spriteX === "undefined") {
				classes = y.classes || [];
				opacity = y.opacity || 1;
				spriteY = y.y;
				spriteX = y.x;
				y = x.y;
				x = x.x
			}

			classes.push("p" + x + "x" + y);
			classes.push("g" + spriteX + "x" + spriteY);

			if (opacity != 1) {
				classes.push("o" + (opacity * 10).toFixed(0));
			}

			$transparentLayer.append('<div class="item ' + classes.join(" ") + '"></div>');
		}
    }
})();