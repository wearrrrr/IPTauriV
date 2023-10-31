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
    UNKNOWN_ERROR,
    DOWNLOAD_NEEDED
}

const appdata = await path.appDataDir();

async function parse(playlist: string) {
    let playlistText = await fs.readTextFile(`${appdata}playlists/${playlist}.m3u8`);
    let data = parser.parse(playlistText);
    return data;
}

function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    // If a playlist ever gets to 1PiB, I'll be impressed and VERY concerned, good luck parsing that with this codebase lol.
    const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i] || '???'}`
}

async function checkDownloadStatus(name: string) {
    if (await fs.exists(`${appdata}playlists/${name}.m3u8`) == true) {
        return DlStatus.FS_EXISTS;
    } else {
        return DlStatus.DOWNLOAD_NEEDED;
    }
}

async function deleteFailedDownload(name: string) {
    await fs.removeFile(`${appdata}playlists/${name}.m3u8`);
}

async function downloadPlaylist(url: string, name: string, downloadProgressContainer: HTMLDivElement, downloadProgressDisplay: HTMLSpanElement) {
    let totalBytesDownloaded = 0;
    downloadProgressContainer.classList.add('active');
    await download(url, `${appdata}playlists/${name}.m3u8`, (progress: number, total: number) => {
        totalBytesDownloaded += progress;
        downloadProgressDisplay.textContent = `${formatBytes(totalBytesDownloaded)} / ${formatBytes(total)}`;
    }).then(() => {
        downloadProgressDisplay.textContent = 'Download complete!';
        downloadProgressContainer.classList.remove('active');
        return DlStatus.OK
    }).catch((err) => {
        console.error(err);
        downloadProgressContainer.classList.remove('active');
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

export { DlStatus, parse, verifyParams, downloadPlaylist, checkDownloadStatus, deleteFailedDownload };
