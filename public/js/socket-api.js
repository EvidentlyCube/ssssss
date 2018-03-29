const SOCKET_API = (function () {
    const API = {
        socket: null,
        onConnect: new Signal(),
        onDisconnect: new Signal(),
        onData: new Signal(),
        onError: new Signal(),
        connect: async () => {
            LOG.debug('Attempting to connect to socket');

            if (API.socket !== null) {
                throw new Error("Already connected to socket");
            }

            return new Promise(resolve => {
                API.socket = io({ query: `version=${GAME_VERSION}` });

                API.socket.on('connect', () => {
                    LOG.info('Connected to socket');

                    API.onConnect.emit();
                    resolve();
                });

                API.socket.on('disconnect', () => {
                    LOG.info('Disconnected from socket');

                    API.onDisconnect.emit();
                });

                API.socket.on('data', function (data) {
                    LOG.debug("Socket data", data);
                    if (data.version != GAME_VERSION) {
                        API.socket.close();
                        API.onError.emit("Your version of the game is too old, please refresh page.");
                        return;
                    }

                    API.onData.emit(data);
                });
            })
        },

        setName: (name) => {
            API.emit('setName', { name });
        },

        invitePlayer: (name) => {
            API.emit('invite-send', { name });
        },

        sendCompletedRooms: (completedRoomNames) => {
            API.emit('set-completed-rooms', { completedRoomNames });
        },

        uninvitePlayer: (name) => {
            API.emit('invite-revoke', { name });
        },

        acceptInvite: (inviterName) => {
            API.emit('invite-accept', { inviterName });
        },

        getPlayerList: () => {
            API.emit('getPlayerList', {});
        },

        emit: (type, data) => {
            LOG.debug(`Emitting '${type}'`, data);

            data.version = GAME_VERSION;
            API.socket.emit(type, data);
            API.socket.emit("keepalive", data);
        }

    };

    return API;
})();