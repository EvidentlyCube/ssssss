
var CANVAS_RENDERER = (function() {
	var CANVAS_WIDTH = TILE_EDGE * GAME_WIDTH;
	var CANVAS_HEIGHT = TILE_EDGE * GAME_HEIGHT;

	var oLayer = createCanvasLayer().context;
	var fLayer = createCanvasLayer().context;
	var transparentLayer = createCanvasLayer().context;
	var topLayer = createCanvasLayer().context;
	var ghostLayer = createCanvasLayer().context;
	var mainCanvas;
	var mainLayer;

	domReady(() => {
		mainCanvas = document.querySelector('#canvas-renderer');
		mainCanvas.width = CANVAS_WIDTH;
		mainCanvas.height = CANVAS_HEIGHT;

		mainLayer = mainCanvas.getContext('2d');
	});

	queueGameComponent('canvas:general_tiles');
	queueGameComponent('canvas:wall_tiles');

	var generalTiles = new Image();
	var wallTiles = new Image();
	generalTiles.onload = () => readyGameComponent('canvas:general_tiles');
	wallTiles.onload = () => readyGameComponent('canvas:wall_tiles');

	generalTiles.src = "GeneralTiles_128.png";
	wallTiles.src = "FoundationTiles_128.png";

	function createCanvasLayer() {
		var canvas = document.createElement('canvas');
		canvas.width = CANVAS_WIDTH;
		canvas.height = CANVAS_HEIGHT;

		// canvas.style.width = "400px";
		// canvas.style.height = "400px";
		// canvas.style.position = "relative";
		// canvas.style.top = "100vh";
// document.querySelector('body').appendChild(canvas);

		return {
			canvas,
			context: canvas.getContext('2d')
		};
	}

    return {
		refreshMainLayer: function() {
			mainLayer.drawImage(oLayer.canvas, 0, 0);
			mainLayer.drawImage(fLayer.canvas, 0, 0);
			mainLayer.drawImage(transparentLayer.canvas, 0, 0);
			mainLayer.drawImage(topLayer.canvas, 0, 0);
			mainLayer.drawImage(ghostLayer.canvas, 0, 0);
		},
		clearTopLayer: function() {
			topLayer.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
		},

		clearTransparentLayer: function() {
			transparentLayer.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
		},

		clearFLayer: function() {
			fLayer.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
		},

		clearGhosts: function() {
			ghostLayer.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
		},

		oLayerDraw: function(x, y, spriteX, spriteY) {
			if (typeof spriteX === "undefined") {
				spriteY = y.y;
				spriteX = y.x;
				y = x.y;
				x = x.x
			}

			oLayer.drawImage(
				wallTiles,
				spriteX * TILE_EDGE,
				spriteY * TILE_EDGE,
				TILE_EDGE,
				TILE_EDGE,
				x * TILE_EDGE,
				y * TILE_EDGE,
				TILE_EDGE,
				TILE_EDGE
			);
		},

		fLayerDraw: function(x, y, spriteX, spriteY) {
			if (typeof spriteX === "undefined") {
				spriteY = y.y;
				spriteX = y.x;
				y = x.y;
				x = x.x
			}

			fLayer.drawImage(
				wallTiles,
				spriteX * TILE_EDGE,
				spriteY * TILE_EDGE,
				TILE_EDGE,
				TILE_EDGE,
				x * TILE_EDGE,
				y * TILE_EDGE,
				TILE_EDGE,
				TILE_EDGE
			);
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

			let target = classes.indexOf('ghost') !== -1
				? ghostLayer
				: topLayer;

			target.globalAlpha = opacity;
			target.drawImage(
				generalTiles,
				spriteX * TILE_EDGE,
				spriteY * TILE_EDGE,
				TILE_EDGE,
				TILE_EDGE,
				opts.precise ? x : x * TILE_EDGE,
				opts.precise ? y : y * TILE_EDGE,
				TILE_EDGE,
				TILE_EDGE
			);
			target.globalAlpha = 1;
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

			transparentLayer.globalAlpha = opacity;
			transparentLayer.drawImage(
				wallTiles,
				spriteX * TILE_EDGE,
				spriteY * TILE_EDGE,
				TILE_EDGE,
				TILE_EDGE,
				x * TILE_EDGE,
				y * TILE_EDGE,
				TILE_EDGE,
				TILE_EDGE
			);
			transparentLayer.globalAlpha = 1;
		}
    }
})();