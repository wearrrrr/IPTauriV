import iptvParser from "iptv-playlist-parser";
import { urlRegex } from "./regex";
import * as path from '@tauri-apps/api/path';
import * as fs from "@tauri-apps/api/fs"
import { download } from "tauri-plugin-upload-api";
import { platform } from "@tauri-apps/api/os";
import { ParamsObject } from "../playlist";
import { Base64 } from "./base64";

enum DlStatus {
    OK,
    FS_EXISTS,
    DOWNLOAD_ERROR,
    UNKNOWN_ERROR,
    DOWNLOAD_NEEDED,
    URL_MISMATCH
}

const appdata = await path.appDataDir();

async function parse(playlist: string) {
    let playlistText = await fs.readTextFile(`${appdata}playlists/${playlist}.m3u8`);
    let data = iptvParser.parse(playlistText);
    console.log(data)
    return data;
}

function formatBytes(bytes: number, decimals: number = 2) {
    if (bytes == 0) return '0 Bytes'

    const kb = 1024
    const decimalCount = decimals < 0 ? 0 : decimals
    // If a playlist ever gets to 1TiB, I'll be impressed and VERY concerned, good luck parsing that with this codebase lol.
    const sizes = ['Bytes', 'KiB', 'MiB', 'GiB']

    const idx = Math.floor(Math.log(bytes) / Math.log(kb))

    return `${parseFloat((bytes / Math.pow(kb, idx)).toFixed(decimalCount))} ${sizes[idx] || '???'}`
}

async function checkDownloadStatus(name: string, url: string) {
    let status = DlStatus.UNKNOWN_ERROR;
    await getSavedFiles().then(async (savedFiles) => {
        if (JSON.stringify(savedFiles) == '{}') {
            return
        }
        if (savedFiles[name] !== undefined && savedFiles[name].name == name) {
            if (savedFiles[name].url !== url) {
                console.log("URLs don't match, deleting old file and downloading new one!");
                await deleteFailedDownload(name);
                status = DlStatus.URL_MISMATCH;
            }
        }
    });

    let path: string;
    if (await platform() == "win32") {
        path = `${appdata}playlists\\${name}.m3u8`;
    } else {
        path = `${appdata}playlists/${name}.m3u8`;
    }

    if (await fs.exists(path) == true) {
        status = DlStatus.FS_EXISTS;
    } else {
        status = DlStatus.DOWNLOAD_NEEDED;
    }

    return status;
}



async function deleteFailedDownload(name: string) {
    if (await platform() == "win32") {
        await fs.removeFile(`${appdata}playlists\\${name}.m3u8`);
    } else {
        await fs.removeFile(`${appdata}playlists/${name}.m3u8`);
    }
}

async function downloadPlaylist(params: ParamsObject, downloadProgressContainer: HTMLDivElement, downloadProgressDisplay: HTMLSpanElement) {
    let totalBytesDownloaded = 0;
    // I need to do this because we mutate the URL to include the username and password if they exist, which throws off caching.
    let playlistURL = params.url;
    downloadProgressContainer.classList.add('active');
    if (params.username && params.password) {
        if (params.username != "" && params.username != "") {
            params.url = params.url.replace('://', `://${params.username}:${Base64.decode(params.password)}@`);
        }
    }


    await download(params.url, `${appdata}playlists/${params.name}.m3u8`, (progress: number, total: number) => {
        totalBytesDownloaded += progress;
        downloadProgressDisplay.textContent = `${formatBytes(totalBytesDownloaded)} / ${formatBytes(total)}`;
    }).then(async () => {
        downloadProgressDisplay.textContent = 'Download complete!';
        downloadProgressContainer.classList.remove('active');
        console.log(params)
        updateSavedFilesList(playlistURL, params.name);
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

type PlaylistData = {
    name: string,
    url: string,
}

type SavedFiles = {
    [name: string]: PlaylistData
}

async function getSavedFiles(): Promise<SavedFiles> {
    if (!await fs.exists(`${appdata}cache.json`)) {
        await fs.writeTextFile(`${appdata}cache.json`, "{}");
        return {};
    } else {
        let savedFiles = await fs.readTextFile(`${appdata}cache.json`);
        return JSON.parse(savedFiles);
    }
}

async function updateSavedFilesList(url: string, name: string) {
    let newPlaylistData: PlaylistData = {
        name: name,
        url: url,
    }
    let savedFiles = await getSavedFiles();
    savedFiles[name] = newPlaylistData;
    await fs.writeTextFile(`${appdata}cache.json`, JSON.stringify(savedFiles));
}

export { DlStatus, parse, verifyParams, downloadPlaylist, checkDownloadStatus, deleteFailedDownload };
