import iptvParser from "iptv-playlist-parser";
import { parseXmltv } from '@iptv/xmltv';
import { urlRegex } from "./regex";
import * as path from '@tauri-apps/api/path';
import * as fs from "@tauri-apps/api/fs"
import { download } from "tauri-plugin-upload-api";
import { platform } from "@tauri-apps/api/os";

interface ParamsObject {
    url: string,
    name: string,
    epgUrl?: string
}

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

async function checkEPGExists(name: string) {
    return new Promise(async (resolve, reject) => {
        if (await fs.exists(`${appdata}epg/${name}.xml`) == true) {
            resolve(DlStatus.FS_EXISTS)
        } else {
            resolve(DlStatus.DOWNLOAD_NEEDED)
        }
        reject(DlStatus.UNKNOWN_ERROR)
    });
}

async function downloadEPGXML(url: string, name: string) {
    await fs.createDir(`${appdata}epg/`, {recursive: true})
    await download(url, `${appdata}epg/${name}.xml`).then(() => {
        return DlStatus.OK;
    }).catch((err) => {
        console.error(err);
        return DlStatus.DOWNLOAD_ERROR;
    });
    return DlStatus.UNKNOWN_ERROR;
}



async function deleteFailedDownload(name: string) {
    if (await platform() == "win32") {
        await fs.removeFile(`${appdata}playlists\\${name}.m3u8`);
    } else {
        await fs.removeFile(`${appdata}playlists/${name}.m3u8`);
    }
}

async function downloadPlaylist(url: string, name: string, epg: string | null, downloadProgressContainer: HTMLDivElement, downloadProgressDisplay: HTMLSpanElement) {
    if (epg == null) {
        epg = "N/A"
    }
    let totalBytesDownloaded = 0;
    downloadProgressContainer.classList.add('active');

    await download(url, `${appdata}playlists/${name}.m3u8`, (progress: number, total: number) => {
        totalBytesDownloaded += progress;
        downloadProgressDisplay.textContent = `${formatBytes(totalBytesDownloaded)} / ${formatBytes(total)}`;
    }).then(async () => {
        downloadProgressDisplay.textContent = 'Download complete!';
        downloadProgressContainer.classList.remove('active');
        updateSavedFilesList(url, name, epg!);
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

async function parseEPGXMLData(data: string) {
    return new Promise((resolve, reject) => {
        try {
            resolve(parseXmltv(data))
        } catch (error) {
            reject("Error parsing XML data!" + error);
        }
    });
}

type PlaylistData = {
    name: string,
    url: string,
    epg: string
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

async function updateSavedFilesList(url: string, name: string, epg: string) {
    let newPlaylistData: PlaylistData = {
        name: name,
        url: url,
        epg: epg,
    }
    let savedFiles = await getSavedFiles();
    savedFiles[name] = newPlaylistData;
    await fs.writeTextFile(`${appdata}cache.json`, JSON.stringify(savedFiles));
}

export { DlStatus, parse, verifyParams, downloadPlaylist, checkDownloadStatus, deleteFailedDownload, parseEPGXMLData, downloadEPGXML, checkEPGExists };
