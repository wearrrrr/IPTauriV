import { createToast } from "./utils/toast";

const playerName = document.getElementById("save-player-name") as HTMLButtonElement;

playerName.addEventListener('click', () => {
    const player = document.getElementById('player-name') as HTMLInputElement;
    localStorage.setItem('player', player.value);
    createToast(`Player set to "${player.value}"!`, 2000);
})