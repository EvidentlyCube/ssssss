const VIEW_LOGIN = (function () {
    const onData = (data) => {
        switch (data.type) {
            case ('invalidName'):
                $getError().innerHTML = `Error: ${data.log}`;
                break;
            case 'name':
                VIEWS.showPlayers();
                break;
        }
    }

    const onSubmit = e => {
        e.stopPropagation();
        e.preventDefault();

        SOCKET_API.setName($getNameInput().value);
    };

    const $getForm = () => document.querySelector('#view-login');
    const $getNameInput = () => document.querySelector('#view-login input');
    const $getButton = () => document.querySelector('#view-login button');
    const $getError = () => document.querySelector('#view-login .error');

    return {
        activate: () => {
            SOCKET_API.onData.add(onData);

            $getNameInput().disabled = false;
            $getButton().disabled = false;
            $getError().innerHTML = '';
            $getForm().addEventListener('submit', onSubmit);

            if (AUTO_NAME) {
                $getNameInput().value = AUTO_NAME;
                onSubmit(new Event('submit'));
            }
        },

        deactivate: () => {
            SOCKET_API.onData.remove(onData);
            $getForm().removeEventListener('submit', onSubmit);
        }
    }
})();