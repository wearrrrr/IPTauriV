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
        <div class="separator-s"></div>
        <input placeholder="Enter EPG URL (Optional)..." id="playlist-epg" class="playlist-name playlist-input"></input>
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
} else if (await platform() == "linux") {
    if (await fs.exists(`${appdata}playlists/`) == false) {
        await fs.createDir(`${appdata}playlists/`);
    }
    if (await fs.exists(`${appdata}playlists/playlists.json`) == false) {
        await fs.writeTextFile(`${appdata}playlists/playlists.json`, JSON.stringify({ "playlists": {} }));
    }
}

async function getPlaylistContent(): Promise<string> {
    return new Promise(async (resolve) => {
        if (await platform() == "win32") {
            if (await fs.exists(`${appdata}playlists\\playlists.json`)) {
                resolve(await fs.readTextFile(`${appdata}playlists\\playlists.json`))
            } else {
                resolve("")
            }
        } else if (await platform() == "linux") {
            if (await fs.exists(`${appdata}playlists/playlists.json`)) {
                resolve(await fs.readTextFile(`${appdata}playlists/playlists.json`))
            } else {
                resolve("")
            }
            
        }
        resolve("")
    })
}

async function writeToPlaylistJSON(name: string, url: string, epg: string | null) {
    let path: string;
    if (await platform() == "win32") {
        path = `${appdata}playlists\\playlists.json`;
    } else {
        path = `${appdata}playlists/playlists.json`;
    }

    try {
        const data = await readFromPlaylistJSON(path);
        let playlists;
        try {
            playlists = JSON.parse(data);
        } catch {
            playlists = {"playlists": {}}
        }
        playlists["playlists"][name] = {
            "name": name,
            "url": url,
            "epg": epg
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
    return readContent;
}

let playlistContent = await getPlaylistContent();

if (playlistContent != "") {
    let playlists = JSON.parse(await getPlaylistContent());
    for (const playlistKey in playlists) {
        const playlist = playlists[playlistKey];
        for (const key in playlist) {
            const value = playlist[key];
            let playlistItem = {
                name: value.name,
                url: value.url,
                epg: value.epg
            }
            currentPlaylist.innerHTML += `
                <div class="playlist">
                    <div id=${validatePlaylistName(playlistItem.name)} class="playlist-name">${playlistItem.name}</div>
                    <button id=${encodeURIComponent(playlistItem.url)} data-epg="${playlistItem.epg}" class="play-playlist">View</button>
                </div>
            `

        }
    }
    let availablePlaylists = document.getElementsByClassName('play-playlist')


    Array.from(availablePlaylists).forEach((viewPlaylist) => {
        viewPlaylist.addEventListener('click', () => {
            window.location.href = `/playlist/?url=${viewPlaylist.id}&name=${viewPlaylist.parentElement!.children[0].innerHTML}&epg=${(viewPlaylist as HTMLInputElement).dataset.epg}`
        })
    })
}

document.getElementById("add-playlist-btn")?.addEventListener('click', async () => {
    console.log("Adding...")
    let url: string = (<HTMLInputElement>document.getElementById("playlist-url")).value;
    let name: string = (<HTMLInputElement>document.getElementById("playlist-name")).value;
    let epg: string | null = (<HTMLInputElement>document.getElementById('playlist-epg')).value;
    if (urlRegex.test(url) == false) {
        alert("Please enter a valid URL.");
        return;
    }
    if (epg === "") {
        epg = null


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
                await writeToPlaylistJSON(name, url, epg);
            } else {
                await readFromPlaylistJSON().then(async () => {
                    await writeToPlaylistJSON(name, url, epg);
                });
            }

        }
        modal.close();
        window.location.reload();
    }

    modal.close();
    window.location.reload();
})