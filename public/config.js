const SSSSSS_CONFIG = {
    version: "1.3.0",
    date: '2022-03-11',
    title: "SSSSSS %type% v%version% (%date%)",
    type: "Web",
    socketUrl: typeof window !== 'undefined' ? window.location : ''
};

if (typeof module !== 'undefined') {
    module.exports = SSSSSS_CONFIG;
}