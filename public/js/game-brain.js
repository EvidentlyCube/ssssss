const CompleteRoomNamesSave = 'completed_level_names';
const completedRooms = localStorage.getItem(CompleteRoomNamesSave) || [];

const GAME_BRAIN = (function () {
    const onData = data => {
        switch (data.type) {
            case 'name':
                GAME_BRAIN.playerName = data.name;
                if (GAME_BRAIN.playerName) {
                    SOCKET_API.sendCompletedRooms(completedRooms);
                }
                break;
            case 'friendName':
                GAME_BRAIN.friendName = data.name;
                break;
            case 'startPlaying':
                GAME_BRAIN.isPlaying = true;
                break;
            case 'alone':
                GAME_BRAIN.friendName = null;
                GAME_BRAIN.isPlaying = false;
                break;
            case 'roomCompleted':
                console.log("roomCompleted", data);
                completedRooms.push(data.roomName);
                localStorage.setItem(CompleteRoomNamesSave, completedRooms);
                break;
            case 'playerListChanged':
                if (GAME_BRAIN.friendName && !GAME_BRAIN.isPlaying) {
                    SOCKET_API.invitePlayer(GAME_BRAIN.friendName);
                    SOCKET_API.acceptInvite(GAME_BRAIN.friendName);
                }
                break;
        }
    };

    const onConnect = data => {
        document.querySelector('#connection-lost').style.display = 'none';

        if (GAME_BRAIN.playerName) {
            VIEWS.showLogin();
            SOCKET_API.setName(GAME_BRAIN.playerName);
        }
    };

    const onDisconnect = data => {
        GAME_BRAIN.isPlaying = false;
        document.querySelector('#connection-lost').style.display = 'flex';
    };

    SOCKET_API.onData.add(onData);
    SOCKET_API.onConnect.add(onConnect)
    SOCKET_API.onDisconnect.add(onDisconnect)

    return {
        playerName: null,
        friendName: null,
        isPlaying: false
    };
})();