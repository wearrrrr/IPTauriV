import * as fs from "@tauri-apps/api/fs";
import * as path from '@tauri-apps/api/path';
import { PlaylistObject } from './utils/types';
import { parse } from "./utils/parser";

const appdata = await path.appDataDir();
const app = document.getElementById('app');
const playlist_div = document.getElementById('playlists');
if (await fs.exists(`${appdata}playlists/playlists.json`) == false || await fs.readTextFile(`${appdata}playlists/playlists.json`) == "") {
    app!.innerHTML += `You don't have any playlists added! Add one below!
    <button id="add-playlist" class="add-playlist"><i class="fa-solid fa-plus"></i> Add Playlist</button>`;

    let addPlaylist = document.getElementById('add-playlist');

    if (addPlaylist === null) throw new Error("Playlist button not found.. this should never happen.")
    
    addPlaylist.addEventListener('click', () => {
      window.location.href = "/newplaylist/";
    });
} else {
    await fs.readTextFile(`${appdata}playlists/playlists.json`).then(async (data) => {
        let json = JSON.parse(data);
        let playlists = json;
        for (const key in playlists) {
            const playlist: PlaylistObject = playlists[key];

            for (const innerKey in playlist) {
                const playlistItem = playlist[innerKey];
                playlist_div!.innerHTML += `
                    <div class="playlist">
                        <div class="playlist-name">${playlistItem.name}</div>
                        <button id=${encodeURIComponent(playlistItem.url)} class="view-playlist">View</button>
                    </div>`;
            }
        }
    });
}

let availablePlaylists = Array.from(document.getElementsByClassName('view-playlist'));

availablePlaylists.forEach((viewPlaylist) => {
    viewPlaylist.addEventListener('click', () => {
        window.location.href = `/playlist/?url=${viewPlaylist.id}&name=${viewPlaylist.parentElement!.children[0].innerHTML}`
    })
})

async function parseTest() {
    console.time();
    console.log(await parse("IPTorrents"))
    console.timeEnd();
}

parseTest();

// loadUrl('https://raw.githubusercontent.com/luongz/iptv-jp/main/jp.m3u')