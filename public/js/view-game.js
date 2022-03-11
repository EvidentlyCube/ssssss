const VIEW_GAME = (function () {
    const GAME_EDGE = 2560;
    const LOG_WIDTH = 405;

    let gameLogic = null;

    const onData = (data) => {
        gameLogic.onData(data);

        switch (data.type) {
            case 'alone':
                VIEWS.showPlayers();
                break;
        }
    }

    const onResize = () => {
        const minSize = Math.min(window.innerWidth - LOG_WIDTH, window.innerHeight);
        const margin = (GAME_EDGE - minSize)/2;
        document.querySelector('#gameGrid').style.transform = `scale(${(minSize / GAME_EDGE)})`;
        document.querySelector('#gameGrid').style.margin = `-${margin}px`;
    }

    const showWindowRoomList = () => {
        WINDOW_ROOM_LIST.show();
    }

    return {
        activate: () => {
            SOCKET_API.onData.add(onData);
            gameLogic = getGameLogic(SOCKET_API.emit);
            gameLogic.onConnect();
            onResize();
            window.addEventListener('resize', onResize);
            $('#change-room').on('click', showWindowRoomList);
        },

        deactivate: () => {
            gameLogic.onDisconnect();

            SOCKET_API.onData.remove(onData);
            window.removeEventListener('resize', onResize);
            $('#change-room').off('click', showWindowRoomList);
        }
    }
})();