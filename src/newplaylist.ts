import tingle from 'tingle.js';
import * as fs from "@tauri-apps/api/fs";
import * as path from '@tauri-apps/api/path';
import { urlRegex } from './utils/regex';

let newPlaylist = document.getElementById('new-playlist');

const modal = new tingle.modal({
    footer: true,
    stickyFooter: false,
    closeMethods: ['button', 'escape'],
    closeLabel: "Close",
});

modal.setContent(`
    <div class="add-new-playlist-container">
        <h2>Add new Playlist</h2>
        <p>Enter the URL and name of the playlist you want to add.</p>
    </div>
    <div class="playlist-url-container">
        <input placeholder="Enter URL here..." id="playlist-url" class="playlist-url playlist-input" type="text"></input>
        <div class="separator-s"></div>
        <input placeholder="Enter name here..." id="playlist-name" class="playlist-name playlist-input" type="text"></input>
        <div class="separator"></div>
        <button id="add-playlist-btn" class="tingle-btn tingle-btn--primary add-playlist-btn">Add</button>
    </div>
`);

newPlaylist!.addEventListener('click', () => {
    modal.open();
});

document.getElementById("add-playlist-btn")?.addEventListener('click', async () => {
    let url = (<HTMLInputElement>document.getElementById("playlist-url")).value;
    let name = (<HTMLInputElement>document.getElementById("playlist-name")).value;
    if (urlRegex.test(url) == false) {
        alert("Please enter a valid URL.");
        return;
    }
    if (name === "") {
        alert("Please enter a valid playlist name.");
        return;
    } else {
        const appdata = await path.appDataDir();
        if (await fs.exists(`${appdata}playlists/`) == false) {
            await fs.createDir(`${appdata}playlists/`);
            await fs.writeTextFile(`${appdata}playlists/playlists.json`, JSON.stringify({"playlists": {"name": name, "url": url}}));
            return;
        } else {
            if (await fs.exists(`${appdata}playlists/playlists.json`) == false) {
                modal.close();
                return await fs.writeTextFile(`${appdata}playlists/playlists.json`, JSON.stringify({"playlists": {"name": name, "url": url}}));
            }
            await fs.readTextFile(`${appdata}playlists/playlists.json`).then(async (data) => {
                let json = JSON.parse(data);
                json["playlists"].push({"name": name, "url": url});
                await fs.writeTextFile(`${appdata}playlists/playlists.json`, JSON.stringify(json));
            });
        }
        modal.close();
    }
    modal.close();
})