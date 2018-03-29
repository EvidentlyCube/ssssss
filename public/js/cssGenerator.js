
windowReady(() => {
	var css = "";
	for(var x = 0; x < GAME_WIDTH; x++){
		for(var y = 0; y < 150; y++){
			if (y < GAME_HEIGHT){
				css += ".p"+x+"x"+y+"{left:"+(x * TILE_EDGE)+"px;top:"+(y*TILE_EDGE)+"px}\n";
			}
			css += ".g"+x+"x"+y+"{background-position:-"+(x * TILE_EDGE)+"px -"+(y*TILE_EDGE)+"px}\n";
		}
	}
	for (var opacity = 1; opacity < 10; opacity++){
		css += ".o"+opacity+"{opacity:0."+(opacity)+"}\n";
	}
	const $style = document.createElement('style');
	$style.innerText = css;

	document.querySelector('head').appendChild($style);
});
