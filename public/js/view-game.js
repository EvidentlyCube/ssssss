const VIEW_GAME = (function () {
    const GAME_EDGE = 2560;

    let gameLogic = null;

    const onData = (data) => {
        gameLogic.onData(data);

        switch (data.type) {
            case 'alone':
                VIEWS.showPlayers();
                break;Ą
        }
    }

    const onResize = () => {
        const minSize = Math.min(window.innerWidth, window.innerHeight);
        const margin = (GAME_EDGE - minSize)/2;
        document.querySelector('#gameGrid').style.transform = `scale(${(minSize / GAME_EDGE)})`;
        document.querySelector('#gameGrid').style.margin = `-${margin}px`;
    }

    return {
        activate: () => {
            SOCKET_API.onData.add(onData);
            gameLogic = getGameLogic(SOCKET_API.emit);
            gameLogic.onConnect();
            onResize();
            window.addEventListener('resize', onResize);
        },

        deactivate: () => {
            gameLogic.onDisconnect();

            SOCKET_API.onData.remove(onData);
            window.removeEventListener('resize', onResize);
        }
    }
})();