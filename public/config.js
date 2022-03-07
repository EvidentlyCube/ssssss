const SSSSSS_CONFIG = {
    version: "1.2.0",
    date: 'TBD',
    title: "SSSSSS %type% v%version% (%date%)",
    type: "Web",
    socketUrl: typeof window !== 'undefined' ? window.location : ''
};

if (typeof module !== 'undefined') {
    module.exports = SSSSSS_CONFIG;
}