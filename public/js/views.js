
const VIEWS = (function () {
    let currentView = null;

    const setView = (name, viewObject) => {
        currentView && currentView.deactivate();

        LOG.debug(`Setting view to ${name}`);
        const $wrapper = document.querySelector('#wrapper');
        $wrapper.classList.remove('show-view-load');
        $wrapper.classList.remove('show-view-login');
        $wrapper.classList.remove('show-view-players');
        $wrapper.classList.remove('show-view-game');
        $wrapper.classList.add(`show-view-${name}`);

        currentView = viewObject;
        viewObject.activate();
    };

    return {
        showLogin: () => setView('login', VIEW_LOGIN),
        showPlayers: () => setView('players', VIEW_PLAYER_LIST),
        showGame: () => setView('game', VIEW_GAME),
    }
})();