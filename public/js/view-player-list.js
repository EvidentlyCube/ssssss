const VIEW_PLAYER_LIST = (function () {
    const onData = (data) => {
        switch (data.type) {
            case 'playerList':
                rebuildPlayerList(data.players);
                break;
            case 'playerListChanged':
                SOCKET_API.getPlayerList();
                break;
            case 'startPlaying':
                VIEWS.showGame();
                break;
        }

        console.log(data.type);
    }

    const onClick = e => {
        e.preventDefault();
        e.stopPropagation();

        if (!e.target) {
            return;
        }

        const row = e.target.parentElement.parentElement;
        const playerName = row.querySelector('.name').innerText;

        if (e.target.className === 'invite') {
            SOCKET_API.invitePlayer(playerName);

        } else if (e.target.className === 'uninvite') {
            SOCKET_API.uninvitePlayer(playerName);

        } else if (e.target.className === 'accept') {
            SOCKET_API.acceptInvite(playerName);
        }
    }

    const createPlayerRow = (name, invited, inviting, isBusy, completed) => {
        const $div = document.createElement('div');
        $div.innerHTML = `
            <div class="name"></div>
            <div class="completion"></div>
            <div class="actions">
                <button class="invite">Invite</button>
                <button class="uninvite">Uninvite</button>
                <button class="accept">Accept</button>
                <div class="playing">Busy playing...</div>
            </div>`;
        $div.querySelector('.name').innerText = name;
        $div.querySelector('.completion').innerText = completed + " / " + GAME_BRAIN.rooms.length;
        $div.classList.add('player-row');
        invited && $div.classList.add('invited');
        inviting && $div.classList.add('inviting');
        isBusy && $div.classList.add('busy');

        $div.addEventListener('click', onClick);

        return $div;
    }

    const rebuildPlayerList = (players) => {
        const $container = document.querySelector('#list-of-players');
        document.querySelectorAll('#list-of-players .player-row:not(.header-row)').forEach(x => x.remove());

        players.forEach(player => {
            if (player.name !== GAME_BRAIN.playerName) {
                $container.appendChild(createPlayerRow(player.name, player.invited, player.inviting, player.busy, player.completedRooms));
            }
        });


        if (AUTO_INVITE_ANYONE) {
            var player = players.find(player => player.name !== GAME_BRAIN.playerName);

            if (player && !player.invited) {
                SOCKET_API.invitePlayer(player.name);
            }
        }
        if (AUTO_ACCEPT_INVITE) {
            var player = players.find(player => player.inviting);
            if (player) {
                SOCKET_API.acceptInvite(player.name);
            }
        }
    }

    return {
        activate: () => {
            rebuildPlayerList([]);
            SOCKET_API.onData.add(onData);
            SOCKET_API.getPlayerList();
        },

        deactivate: () => {
            SOCKET_API.onData.remove(onData);
        }
    }
})();