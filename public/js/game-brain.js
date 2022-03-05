const CompleteRoomNamesSave = 'completed_level_names';
const completedRooms = Array.isArray(localStorage.getItem(CompleteRoomNamesSave)) ? localStorage.getItem(CompleteRoomNamesSave) : [];

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
                GAME_BRAIN.friendCompletedRooms = data.completedRooms;
                break;
            case 'startPlaying':
                GAME_BRAIN.isPlaying = true;
                break;
            case 'alone':
                GAME_BRAIN.friendName = null;
                GAME_BRAIN.isPlaying = false;
                break;
            case 'roomList':
                data.rooms.sort((roomLeft, roomRight) => {
                    let authorCompare = roomLeft.author.toLocaleUpperCase().localeCompare(roomRight.author.toLocaleUpperCase());

                    return authorCompare === 0
                        ? roomLeft.name.toLocaleUpperCase().localeCompare(roomRight.name.toLocaleUpperCase())
                        : authorCompare;
                });
                GAME_BRAIN.rooms = data.rooms;
                break;
            case 'roomCompleted':
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
        SOCKET_API.getRooms();
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
        rooms: [],
        isPlaying: false,
        completedRooms: completedRooms,
        friendCompletedRooms: completedRooms,
    };
})();