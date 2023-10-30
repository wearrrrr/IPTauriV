import parser from "iptv-playlist-parser";
import { urlRegex } from "./regex";
import * as path from '@tauri-apps/api/path';
import * as fs from "@tauri-apps/api/fs"
import { download } from "tauri-plugin-upload-api";

interface ParamsObject {
    url: string,
    name: string
}

enum DlStatus {
    OK,
    FS_EXISTS,
    DOWNLOAD_ERROR,
    UNKNOWN_ERROR
}

const appdata = await path.appDataDir();

async function parse(playlist: string) {
    let playlistText = await fs.readTextFile(`${appdata}playlists/${playlist}.m3u8`);
    let data = parser.parse(playlistText);
    return data;
}
async function downloadPlaylist(url: string, name: string) {
    if (await fs.exists(`${appdata}playlists/${name}.m3u8`) == true) {
        console.log(`Playlist "${name}" already exists!`); 
        return DlStatus.FS_EXISTS;
    }
    let totalBytesDownloaded = 0;
    let currentTime = new Date();
    await download(url, `${appdata}playlists/${name}.m3u8`, (progress: number, total: number) => {
        totalBytesDownloaded += progress;
        console.log(progress, total)
    }).then(() => {
        let endTime = new Date();
        let timeTaken = endTime.getTime() - currentTime.getTime();
        console.log(`Downloaded ${totalBytesDownloaded} bytes in ${timeTaken}ms!`);
        return DlStatus.OK
    }).catch((err) => {
        console.error(err);
        return DlStatus.DOWNLOAD_ERROR;
    });
    return DlStatus.UNKNOWN_ERROR;
}

function verifyParams(params: ParamsObject) {
    if (!params.name) {
        throw new Error("Name parameter is undefined or null!")
    } 
    if (!params.url) {
        throw new Error("URL parameter is undefined or null!")
    }
    if (!urlRegex.test(params.url)) {
        throw new Error("URL parameter is not a valid URL!")
    }
    return "OK";
}

export { parse, verifyParams, downloadPlaylist };
