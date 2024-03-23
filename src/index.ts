import tingle from 'tingle.js';
import * as fs from "@tauri-apps/api/fs";
import * as path from '@tauri-apps/api/path';
import { urlRegex, validatePlaylistName } from './utils/regex';
import { platform } from '@tauri-apps/api/os';
import { NullElementError } from './utils/Error';
import { Base64 } from "./utils/base64";

let newPlaylist = document.getElementById('new-playlist');
let currentPlaylist = document.getElementById("current-playlist-container")!;
const appdata = await path.appDataDir();

const modal = new tingle.modal({
    footer: true,
    stickyFooter: false,
    closeMethods: ['button', 'escape'],
});

const editModal = new tingle.modal({
    footer: true,
    stickyFooter: false,
    closeMethods: ['button', 'escape'],
})

modal.setContent(`
    <div class="add-new-playlist-container">
        <h2>Add new Playlist</h2>
        <p>Enter the URL and name of the playlist you want to add.</p>
    </div>
    <div class="playlist-url-container">
        <input placeholder="Playlist URL" id="playlist-url" class="playlist-url playlist-input" type="text"></input>
        <div class="separator-s"></div>
<<<<<<< HEAD
        <input placeholder="Playlist Name" id="playlist-name" class="playlist-name playlist-input" type="text"></input>
        <div class="separator-s"></div>
        <input placeholder="Username (Optional)" id="playlist-username" class="playlist-user playlist-input"></input>
        <div class="separator-s"></div>
        <div class="pw-container">
            <img src="/src/assets/eye_fill.svg" id="pw-eye"></img>
            <input placeholder="Password (Optional)" id="playlist-password" type="password" class="playlist-pass playlist-input"></input>
        </div>
=======
        <input placeholder="Enter name here..." id="playlist-name" class="playlist-name playlist-input" type="text"></input>
>>>>>>> refs/remotes/origin/main
        <div class="separator"></div>
        <button id="add-playlist-btn" class="tingle-btn tingle-btn--primary add-playlist-btn">Add</button>
    </div>
`);

if (newPlaylist) {
    newPlaylist.addEventListener('click', () => {
        modal.open();
    });
} else throw new NullElementError("new-playlist", { fatal: true });


switch (await platform()) {
    case "win32":
        if (await fs.exists(`${appdata}playlists\\`) == false) {
            await fs.createDir(`${appdata}playlists\\`);
        }
        if (await fs.exists(`${appdata}playlists\\playlists.json`) == false) {
            await fs.writeTextFile(`${appdata}playlists\\playlists.json`, JSON.stringify({ "playlists": {} }));
        }
        break;
    default:
        // Assume *NIX platform, this includes Linux and OSX.
        if (await fs.exists(`${appdata}playlists/`) == false) {
            await fs.createDir(`${appdata}playlists/`);
        }
        if (await fs.exists(`${appdata}playlists/playlists.json`) == false) {
            await fs.writeTextFile(`${appdata}playlists/playlists.json`, JSON.stringify({ "playlists": {} }));
        }
        break;
}

async function getPlaylistContent(): Promise<string | null> {
    return new Promise(async (resolve) => {
        if (await platform() == "win32") {
            if (await fs.exists(`${appdata}playlists\\playlists.json`)) {
                resolve(await fs.readTextFile(`${appdata}playlists\\playlists.json`))
            } else {
                resolve(null)
            }
        } else if (await platform() == "linux") {
            if (await fs.exists(`${appdata}playlists/playlists.json`)) {
                resolve(await fs.readTextFile(`${appdata}playlists/playlists.json`))
            } else {
                resolve(null)
            }
        }
        resolve(null)
    })
}

async function writeToPlaylistJSON(name: string, url: string, username: string = "", password: string = "") {
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
            "username": username,
            "password": Base64.encode(password)
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
    let playlistContent = await getPlaylistContent();
    let playlists = playlistContent == null ? {"playlists": {}} : JSON.parse(playlistContent);
    let playlistsArray = [];
    for (const playlistKey in playlists) {
        const playlist = playlists[playlistKey];
        for (const key in playlist) {
            playlistsArray.push(playlist[key])
        }
        playlistsArray.sort( function( a, b ) {
            a = a.name.toLowerCase();
            b = b.name.toLowerCase();
        
            return a < b ? -1 : a > b ? 1 : 0;
        });
        for (const key in playlistsArray) {
            const value = playlistsArray[key]
            let playlistItem = {
                name: value.name,
                url: value.url,
                username: value.username,
                password: value.password,
            }
            currentPlaylist.innerHTML += `
                <div class="playlist">
                    <div class="edit-playlist" data-playlist=${playlistItem.name}><img src="/src/assets/edit.svg"></div>
                    <div id=${validatePlaylistName(playlistItem.name)} class="playlist-name">${playlistItem.name}</div>
                    <button id=${encodeURIComponent(playlistItem.url)} class="play-playlist" data-username="${playlistItem.username}" data-password="${playlistItem.password}">View</button>
                </div>
            `
        }
    }
    let availablePlaylists = document.getElementsByClassName('play-playlist')
    let editPlaylist = document.getElementsByClassName('edit-playlist')


    Array.from(availablePlaylists).forEach((viewPlaylist) => {
        viewPlaylist.addEventListener('click', () => {
            let viewPlaylistEle = viewPlaylist as HTMLButtonElement;
            window.location.href = `/playlist/?url=${viewPlaylist.id}&name=${viewPlaylist.parentElement!.children[1].innerHTML}&username=${viewPlaylistEle.dataset.username}&password=${viewPlaylistEle.dataset.password}`;
        })
    })

    Array.from(editPlaylist).forEach((editPlaylist) => {
        // Cast to HTMLDivElement to access the dataset
        editPlaylist.addEventListener('click', () => {
            let playlistName = editPlaylist.parentElement!.children[1].innerHTML;
            let viewButton = editPlaylist.parentElement!.children[2] as HTMLButtonElement;
            openEditModal(playlistName, viewButton.id, viewButton.dataset.username, viewButton.dataset.password);
        })
    })
}

function eyeEditEventListener(eyeEdit: HTMLImageElement) {
    eyeEdit.src = eyeEdit.src.includes("eye_fill.svg") ? "/src/assets/eye_slash_fill.svg" : "/src/assets/eye_fill.svg";
    let pwInput = document.getElementById("playlist-password-edit") as HTMLInputElement;
    if (pwInput.type === "password") {
        pwInput.type = "text";
    } else {
        pwInput.type = "password";
    }
}

function openEditModal(playlistName: string, playlistURL: string = "", username: string = "", password: string = "") {
    editModal.setContent(`
    <div class="edit-playlist-container">
        <h2>Edit Playlist ${playlistName}</h2>
    </div>
    <div class="playlist-url-container">
        <input placeholder="Enter URL here..." id="edit-playlist-url" class="playlist-url playlist-input" value=${decodeURIComponent(playlistURL)} type="text"></input>
        <div class="separator-s"></div>
        <input placeholder="Enter name here..." id="edit-playlist-name" class="playlist-name playlist-input" value=${playlistName} type="text"></input>
        <div class="separator-s"></div>
        <input placeholder="Username (Optional)" id="playlist-username-edit" class="playlist-user playlist-input" value=${username}></input>
        <div class="separator-s"></div>
        <div class="pw-container">
            <img src="/src/assets/eye_fill.svg" id="pw-eye-edit"></img>
            <input placeholder="Password (Optional)" id="playlist-password-edit" type="password" class="playlist-pass playlist-input" value=${Base64.decode(password)}></input>
        </div>
        <div class="separator"></div>
        <button id="edit-playlist-btn" class="tingle-btn tingle-btn--primary add-playlist-btn">Edit</button>
        <div class="separator-s"></div>
        <button id="delete-playlist-btn" class="tingle-btn tingle-btn--danger add-playlist-btn">Delete Playlist</button>
    </div>
    `)



    const boundPwEyeEdit = eyeEditEventListener.bind(null, document.getElementById("pw-eye-edit") as HTMLImageElement);
    document.getElementById("pw-eye-edit")?.addEventListener('click', boundPwEyeEdit);

    document.getElementById('edit-playlist-btn')!.addEventListener('click', async () => {
        let url: string = (<HTMLInputElement>document.getElementById("edit-playlist-url")).value;
        let name: string = (<HTMLInputElement>document.getElementById("edit-playlist-name")).value;
        let username = (<HTMLInputElement>document.getElementById("playlist-username-edit")).value;
        let password = (<HTMLInputElement>document.getElementById("playlist-password-edit")).value;
        if (urlRegex.test(url) == false) {
            alert("Please enter a valid URL.");
            return;
        }
        if (name == "") {
            alert("Please enter a valid playlist name.");
            return;   
        } else {
            // Overwrite playlist item we are editing with new data
            let playlistContent = await getPlaylistContent();
            let playlists = playlistContent == null ? {"playlists": {}} : JSON.parse(playlistContent);
            delete playlists["playlists"][playlistName];
            playlists["playlists"][name] = {
                "name": name,
                "url": url,
                "username": username,
                "password": Base64.encode(password)
            };
            console.log(playlists["playlists"][name]);
            await fs.writeTextFile(`${appdata}playlists/playlists.json`, JSON.stringify(playlists));

            window.location.reload();
        }
    })

    document.getElementById('delete-playlist-btn')!.addEventListener('click', async () => {
        let playlistContent = await getPlaylistContent();
        let playlists = playlistContent == null ? {"playlists": {}} : JSON.parse(playlistContent);
        delete playlists["playlists"][playlistName];
        await fs.writeTextFile(`${appdata}playlists/playlists.json`, JSON.stringify(playlists));
        window.location.reload();
    })

    editModal.open();
}

let pwEye = document.getElementById("pw-eye") as HTMLImageElement;
pwEye?.addEventListener('click', () => {
    pwEye.src = pwEye.src.includes("eye_fill.svg") ? "/src/assets/eye_slash_fill.svg" : "/src/assets/eye_fill.svg";
    let pwInput = document.getElementById("playlist-password") as HTMLInputElement;
    if (pwInput.type === "password") {
        pwInput.type = "text";
    } else {
        pwInput.type = "password";
    }
});

document.getElementById("add-playlist-btn")?.addEventListener('click', async () => {
    console.log("Adding...")
    let url: string = (<HTMLInputElement>document.getElementById("playlist-url")).value;
    let name: string = (<HTMLInputElement>document.getElementById("playlist-name")).value;
    let username = (<HTMLInputElement>document.getElementById("playlist-username")).value;
    let password = (<HTMLInputElement>document.getElementById("playlist-password")).value;
    if (urlRegex.test(url) == false) {
        alert("Please enter a valid URL.");
        return;
    }
    if (name === "") {
        alert("Please enter a valid playlist name.");
        return;
    } else {
        // If the playlist JSON file does not exist, create it.
        if (await fs.exists(`${appdata}playlists/`) == false) {
            await fs.createDir(`${appdata}playlists/`);
            await fs.writeTextFile(`${appdata}playlists/playlists.json`, JSON.stringify({"playlists": {"name": name, "url": url, "username": username, "password": Base64.encode(password)}}));
            return;
        } else {
            if (await fs.exists(`${appdata}playlists/playlists.json`) == false) {
                await writeToPlaylistJSON(name, url, username, password);
            } else {
                await readFromPlaylistJSON().then(async () => {
                    await writeToPlaylistJSON(name, url, username, password);
                });
            }

        }
        modal.close();
        window.location.reload();
    }

    modal.close();
    window.location.reload();
})