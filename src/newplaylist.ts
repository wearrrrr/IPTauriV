import tingle from 'tingle.js';
import * as fs from "@tauri-apps/api/fs";
import * as path from '@tauri-apps/api/path';
import { urlRegex, validatePlaylistName } from './utils/regex';
import { platform } from '@tauri-apps/api/os';

let newPlaylist = document.getElementById('new-playlist');
let currentPlaylist = document.getElementById("current-playlist-container")!;
const appdata = await path.appDataDir();

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

if (await platform() == "win32") {
    if (await fs.exists(`${appdata}playlists\\`) == false) {
        await fs.createDir(`${appdata}playlists\\`);
    }
    if (await fs.exists(`${appdata}playlists\\playlists.json`) == false) {
        await fs.writeTextFile(`${appdata}playlists\\playlists.json`, JSON.stringify({ "playlists": {} }));
    }
}
let playlistsContent: string;
if (await platform() == "win32") {
    playlistsContent = await fs.readTextFile(`${appdata}playlists\\playlists.json`)
} else {
    playlistsContent = await fs.readTextFile(`${appdata}playlists/playlists.json`)
}

async function writeToPlaylistJSON(name: string, url: string) {
    let path: string;
    if (await platform() == "win32") {
        path = `${appdata}playlists\\playlists.json`;
    } else {
        path = `${appdata}playlists/playlists.json`;
    }

    try {
        const data = await readFromPlaylistJSON(path);
        const playlists = JSON.parse(data);
        if (!playlists.playlists) {
            playlists.playlists = {};
        }
        playlists.playlists[name] = {
            "name": name,
            "url": url
        };
        await fs.writeTextFile(path, JSON.stringify(playlists));
    } catch (error) {
        console.error("Error writing to the playlist JSON:", error);
    }
}


async function readFromPlaylistJSON(path: string = `${appdata}playlists/playlists.json`) {
    let readContent: string;
    if (await platform() == "win32") {
        readContent = await fs.readTextFile(path)
    } else {
        readContent = await fs.readTextFile(path)
    }
    return playlistsContent;
}



if (playlistsContent != "") {
    let playlists = JSON.parse(playlistsContent);
    for (const playlistKey in playlists) {
        const playlist = playlists[playlistKey];
        for (const key in playlist) {
            const value = playlist[key];
            let playlistItem = {
                name: value.name,
                url: value.url
            }

            console.log(playlistItem.name)
            currentPlaylist.innerHTML += `
                <div class="playlist">
                    <div id=${validatePlaylistName(playlistItem.name)} class="playlist-name">${playlistItem.name}</div>
                    <button id=${encodeURIComponent(playlistItem.url)} class="play-playlist">View</button>
                </div>
            `

        }
      }
}

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
        if (await fs.exists(`${appdata}playlists/`) == false) {
            await fs.createDir(`${appdata}playlists/`);
            await fs.writeTextFile(`${appdata}playlists/playlists.json`, JSON.stringify({"playlists": {"name": name, "url": url}}));
            return;
        } else {
            if (await fs.exists(`${appdata}playlists/playlists.json`) == false) {
                let json = '"playlists": { "name": "' + name + '", "url": "' + url + '" }';
                await writeToPlaylistJSON(name, url);
            } else {
                await readFromPlaylistJSON().then(async (data) => {
                    await writeToPlaylistJSON(name, url);
                });
            }

        }
        modal.close();
    }

    modal.close();
})