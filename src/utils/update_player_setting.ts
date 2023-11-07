import * as fs from "@tauri-apps/api/fs";
import * as path from "@tauri-apps/api/path";

const VLC_PATH = "C:\\Program Files\\VideoLAN\\VLC\\vlc.exe";
let appdata = await path.appDataDir();

console.log(appdata)

async function setPlayerPath(playerPath: string) {
    await fs.writeTextFile(`${appdata}player.json`, JSON.stringify({ player: playerPath }));
}

async function getPlayerPath() {
    if (await fs.exists(`${appdata}player.json`)) {
        let playerPath = await fs.readTextFile(`${appdata}player.json`);
        return JSON.parse(playerPath).player;
    } else {
        return "";
    }
}

export { VLC_PATH, setPlayerPath, getPlayerPath }