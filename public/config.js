const SSSSSS_CONFIG = {
    version: "1.3.3",
    date: '2024-12-07',
    title: "SSSSSS %type% v%version% (%date%)",
    type: "Web",
    socketUrl: typeof window !== 'undefined' ? window.location : ''
};

if (typeof module !== 'undefined') {
    module.exports = SSSSSS_CONFIG;
}