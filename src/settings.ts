import { createToast } from "./utils/toast";

const playerName = document.getElementById("save-player-name") as HTMLButtonElement;
const networkTimeout = document.getElementById('save-network-timeout') as HTMLButtonElement
const windowGeometry = document.getElementById("save-window-geometry") as HTMLButtonElement
const mpvHWDecoding = document.getElementById("save-mpv-hw-decode") as HTMLButtonElement

playerName.addEventListener('click', () => {
    const player = document.getElementById("player-name") as HTMLInputElement;
    localStorage.setItem('player', player.value);
    createToast(`Player set to "${player.value}"!`, 2000);
})

networkTimeout.addEventListener("click", () => {
    const netTimeoutValue = document.getElementById("network-timeout") as HTMLInputElement
    localStorage.setItem('network-timeout', netTimeoutValue.value)
    createToast(`Network Timeout set to ${netTimeoutValue.value} Seconds!`, 2000);
})

windowGeometry.addEventListener("click", () => {
    const winGeometryValue = document.getElementById("window-geometry") as HTMLInputElement
    localStorage.setItem("window-geometry", winGeometryValue.value)
    createToast(`Player Window Geometry set to ${winGeometryValue.value}`, 2000)
})

mpvHWDecoding.addEventListener("click", () => {
    const mpvHWDecodingValue = document.getElementById("mpv-hw-decode") as HTMLInputElement
    localStorage.setItem("hwdec", mpvHWDecodingValue.value)
    createToast(`MPV Hardware Decoding set to "${mpvHWDecodingValue.value}"!`, 2000)
})