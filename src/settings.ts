import { createToast } from "./utils/toast";
import * as fs from "@tauri-apps/api/fs";
import * as path from "@tauri-apps/api/path";
import { getPlayerPath, setPlayerPath } from "./utils/update_player_setting";
import * as os from "@tauri-apps/api/os";
import { mpvHWDecodingTypes } from "./utils/types";

const player = document.getElementById("player-name") as HTMLInputElement;
const playerName = document.getElementById("save-player-name") as HTMLButtonElement;
const networkTimeout = document.getElementById('save-network-timeout') as HTMLButtonElement
const windowGeometry = document.getElementById("save-window-geometry") as HTMLButtonElement
const mpvHWDecoding = document.getElementById("save-mpv-hw-decode") as HTMLButtonElement
const deleteAllPlaylists = document.getElementById("delete-all-playlists") as HTMLButtonElement
const redownloadAllPlaylists = document.getElementById("redownload-all-playlists") as HTMLButtonElement

player.value = await getPlayerPath();
console.log(await getPlayerPath())

playerName.addEventListener('click', async () => {
    await setPlayerPath(player.value);
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
    // Check if the value is a valid MPV Hardware Decoding value
    if (!mpvHWDecodingTypes.includes(mpvHWDecodingValue.value)) {
        createToast("Invalid MPV Hardware Decoding value!", 2000)
        return;
    }
    localStorage.setItem("hwdec", mpvHWDecodingValue.value)
    createToast(`MPV Hardware Decoding set to "${mpvHWDecodingValue.value}"!`, 2000)
})

async function getPlaylistPath(playlistName: string) {
    if (await os.platform() == "win32") {
        return await path.appDataDir() + "playlists\\" + playlistName + ".m3u8";
    } else {
        return await path.appDataDir() + "playlists/" + playlistName + ".m3u8";
    
    }
}

async function checkPlaylistLength() {
    // Check to make sure the playlist JSON actually contains playlists, 
    // if its empty then grey out the redownload button
    if (!await fs.exists(await path.appDataDir() + "/playlists/playlists.json")) {
        redownloadAllPlaylists.setAttribute("disabled", "true");
        redownloadAllPlaylists.classList.add("button-disabled");
        return;
    }
    let playlistJSON = await fs.readTextFile(await path.appDataDir() + "/playlists/playlists.json");
    let playlists = JSON.parse(playlistJSON);
    let playlistLength = 0;
    for (let playlist in playlists["playlists"]) {
        playlist; // This is to get rid of the TS error, thanks TS!
        playlistLength++;
    }
    console.log(playlistLength)
    if (playlistLength == 0) {
        redownloadAllPlaylists.setAttribute("disabled", "true");
        redownloadAllPlaylists.classList.add("button-disabled");
    }

}

await checkPlaylistLength();

async function deleteAllM3U8Files() {
    let playlistJSON = await fs.readTextFile(await path.appDataDir() + "/playlists/playlists.json");
    let playlists = JSON.parse(playlistJSON);
    console.log(playlists["playlists"]);
    console.log(typeof playlists["playlists"]);
    for (const playlist in playlists["playlists"]) {
        if (await fs.exists(await getPlaylistPath(playlist))) {
            await fs.removeFile(await getPlaylistPath(playlist));
        }
    }
}

deleteAllPlaylists.addEventListener("click", async () => {
    if (confirm("This will delete all playlists and their files!")) {
        await deleteAllM3U8Files();
        await fs.removeFile(await path.appDataDir() + "/playlists/playlists.json");
        window.location.reload();
    }

})

redownloadAllPlaylists.addEventListener("click", async () => {
    if (confirm("This will delete all M3U8 files, you will have to redownload all playlists!")) {
        await deleteAllM3U8Files();
        window.location.reload();
    }
})