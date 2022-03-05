const WINDOW_ROOM_LIST = (function () {
    const onData = (data) => {
        if (data.type === 'roomList') {
            setTimeout(() => rebuildRoomList(), 100);
        }
    }

    const onClick = e => {
        e.preventDefault();
        e.stopPropagation();

        if (!e.target) {
            return;
        }

        const row = e.target.parentElement.parentElement;
        const roomName = row.querySelector('.name').innerText;

        const event = new Event('go-to-room');
        event.roomName = roomName;
        document.dispatchEvent(event);
        WINDOW_ROOM_LIST.hide();
    }

    const rebuildRoomList = () => {
        document.querySelectorAll('#list-of-rooms .room-row').forEach(x => x.remove());

        const $container = document.querySelector('#list-of-rooms');
        GAME_BRAIN.completedRooms.push('Royal Dance')
        GAME_BRAIN.completedRooms.push('Crossroads')
        GAME_BRAIN.friendCompletedRooms.push('Crossroads')
        GAME_BRAIN.friendCompletedRooms.push('Bridge Assault')

        GAME_BRAIN.rooms.forEach(room => {
            const $div = document.createElement('div');
            $div.innerHTML = `
                <div class="room-row">
                    <div class="name"></div>
                    <div class="author"></div>
                    <div class="status"></div>
                    <div class="actions">
                        <button class="play">Play</button>
                    </div>
                </div>`;

            const youCompleted = GAME_BRAIN.completedRooms.indexOf(room.name) !== -1;
            const friendCompleted = GAME_BRAIN.friendCompletedRooms.indexOf(room.name) !== -1;
            const color = youCompleted && friendCompleted ? '#FFF' :
                youCompleted ? '#8F8' :
                friendCompleted ? '#F88' : ''

            $div.querySelector('.name').innerText = room.name;
            $div.querySelector('.author').innerText = room.author;
            $div.querySelector('.status').innerText = (
                youCompleted && friendCompleted ? "Both" :
                youCompleted ? "You" :
                friendCompleted ? "Friend" :
                ""
            );
            $div.querySelector('.status').style.color = color;
            $div.addEventListener('click', onClick);

            $container.appendChild($div);
        });
    }

    return {
        show: () => {
            rebuildRoomList();
            $('#room-list').css('display', 'flex');
            SOCKET_API.onData.add(onData);
        },

        hide: () => {
            $('#room-list').css('display', 'none');
            SOCKET_API.onData.remove(onData);
        }
    }
})();