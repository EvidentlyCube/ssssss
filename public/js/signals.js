const Signal = function() {
    this.listeners = [];
}

Signal.prototype.add = function(callback) {
    this.remove(callback);
    this.listeners.push(callback);
    return () => this.remove(callback);
}

Signal.prototype.remove = function(callback) {
    const index = this.listeners.indexOf(callback);

    if (index !== -1) {
        this.listeners.splice(index, 1);
    }
}

Signal.prototype.emit = function() {
    const args = arguments;
    this.listeners.forEach(callback => callback(...args));
}