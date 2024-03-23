import { openExternalPlayer, preflightRequest } from "./utils/external_player";
import { dummyImages, generateAndCacheDummyImage } from "./utils/image";
import { downloadPlaylist, verifyParams, parse, checkDownloadStatus, DlStatus, deleteFailedDownload } from "./utils/parser";
import { getClient } from "@tauri-apps/api/http";
import { createToast } from "./utils/toast";
import { appDataDir } from "@tauri-apps/api/path";
import { readTextFile, writeTextFile } from "@tauri-apps/api/fs";
import { fs } from "@tauri-apps/api";
import { Base64 } from "./utils/base64";

const URLParams = new URLSearchParams(window.location.search)
const httpClient = await getClient();
httpClient;

export type ParamsObject = {
    url: string,
    name: string,
    username: string | null,
    password: string | null,
}


let params: ParamsObject = {
    url: URLParams.get('url')!.toString(),
    name: URLParams.get('name')!.toString(),
    username: URLParams.get('username')?.toString() || null,
    password: URLParams.get('password')?.toString() || null,
}

const playlistName = document.getElementById('playlist-name') as HTMLParagraphElement;
const channelContainer = document.getElementById('channels-container')! as HTMLDivElement;
const searchInput = document.getElementById('search-input') as HTMLInputElement;
const searchResultsFound = document.getElementById('results-found') as HTMLSpanElement;
const playlistDownloadContainer = document.getElementById('playlist-dl-container') as HTMLDivElement;
const playlistDownloadProgress = document.getElementById('playlist-download-progress') as HTMLDivElement;

let playlistItemsLength = 0;
let registedFilters = new Set<string>();

function debounce(func: Function, delay: number) {
    let timer: NodeJS.Timeout;
    return function(this: any, ...args: any[]) {
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(this, args), delay);
    };
  }
  
  searchInput.addEventListener('keydown', debounce(() => {
    let resultsFound = 0;
    Array.from(channelContainer.children).forEach((channel) => {
      const title = channel.querySelector('.channel-title') as HTMLDivElement;
      if (title.textContent?.toLowerCase().includes(searchInput.value.toLowerCase())) {
        channel.classList.remove('hidden');
        resultsFound++;
      } else {
        channel.classList.add('hidden');
      }
      if (playlistItemsLength == resultsFound) {
        searchResultsFound.textContent = '';
      } else {
        searchResultsFound.textContent = `${resultsFound} results found`;
      }
    });
  }, 150));

if (playlistName == undefined) {
    throw new Error("Playlist name not found.. this should never happen.")
}

try {
    verifyParams(params);
} catch (err) {
    throw new Error("Parameter verification failed! " + err)
}
playlistName.textContent = params.name;
if (await checkDownloadStatus(params.name, params.url) != DlStatus.FS_EXISTS) {
    await downloadPlaylist(params, playlistDownloadContainer, playlistDownloadProgress).then(async (result) => {
        if (result == DlStatus.DOWNLOAD_ERROR) {
            await deleteFailedDownload(params.name);
            window.location.reload();
        }
        if (result == DlStatus.URL_MISMATCH) {
            window.location.reload();
        }
    });
}
await parse(params.name).then(async (data) => {
    document.getElementById('loading-container')!.style.opacity = "0";
    const batchSize = 10;
    let totalItems = 0;
    let itemsLoaded = new Set<number>();
    playlistItemsLength = data.items.length;
    registerAllFilter();

    // Define the Intersection Observer only once
    const observerOptions: IntersectionObserverInit = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1,
    };
    const observer = new IntersectionObserver(handleIntersection, observerOptions);


    async function loadItemsInBatch() {
        for (let i = itemsLoaded.size; i < Math.min(itemsLoaded.size + batchSize, totalItems); i++) {
            if (!itemsLoaded.has(i)) {
                const item = data.items[i];
                if (item.name == "") {
                    item.name = item.url.slice(item.url.lastIndexOf("/") + 1).replace(".m3u8", "");
                }
                await generateAndCacheDummyImage(item.name.charAt(0).toUpperCase());
                let itemURL = item.url;
                if (params.username && params.password) {
                    itemURL = itemURL.replace('://', `://${params.username}:${Base64.decode(params.password)}@`)
                }

                const channel = document.createElement('div');
                channel.classList.add('channel');
                channel.dataset.url = itemURL;
                channel.dataset.group = item.group.title;
                channel.onclick = async () => {
                    if (await fs.exists(`${await appDataDir()}player.json`) == false) {
                        await writeTextFile(`${await appDataDir()}player.json`, JSON.stringify({player: "vlc"}));
                    }
                    let playerJSON = await readTextFile(`${await appDataDir()}player.json`);
                    let player = JSON.parse(playerJSON).player;
                    createToast(`Opening ${item.name} in ${player || 'VLC'}...`, 4000);
                    if (!await preflightRequest(itemURL)) {
                        createToast(`Failed to open ${item.name} in ${player || 'VLC'}!`, 4000);
                        return;
                    }
                    await openExternalPlayer(player, itemURL, item.name)
                }
                if (item.group.title !== '') {
                    checkAndRegisterNewFilter(item.group.title)
                }
    
                const image = document.createElement('img');
                image.classList.add('channel-logo');
                image.loading = 'lazy';

                image.onload = function() {
                    if (image.naturalWidth == 1) {
                        image.src = item.tvg.logo || dummyImages[item.name.charAt(0).toUpperCase()];
                    }
                };

                if (item.tvg.logo) {
                    item.tvg.logo = item.tvg.logo.replace(/^(http|https)\/\//, '$1://');
                }
                console.log(dummyImages[item.name.charAt(0).toUpperCase()])
                image.src = item.tvg.logo || dummyImages[item.name.charAt(0).toUpperCase()];
    
                const titleElement = document.createElement('p');
                titleElement.classList.add('channel-title');
                titleElement.textContent = item.name;
                channel.appendChild(image);
                channel.appendChild(titleElement);
                channelContainer.appendChild(channel);
    
                // Observe the newly added element
                observer.observe(channel);
    
                // Mark the item as loaded
                itemsLoaded.add(i);
            }
        }
    }

    function handleIntersection(entries: IntersectionObserverEntry[], observer: IntersectionObserver) {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const item = entry.target as HTMLDivElement;
                const logo = item.dataset.logo;
                if (logo) {
                    item.querySelector('.channel-logo')?.setAttribute('src', logo);
                }
                observer.unobserve(item);

                if (itemsLoaded.size < totalItems) {
                    loadItemsInBatch();
                }
            }
        });
    }

    totalItems = data.items.length;
    loadItemsInBatch();
});



function registerAllFilter() {
    if (!registedFilters.has("All")) {
        let allFilter = document.createElement('button');
        allFilter.classList.add('filter');
        allFilter.id = `filter-all`;
        allFilter.textContent = "All";
        allFilter.addEventListener('click', () => {
            let resultsFound = 0;
            Array.from(channelContainer.children).forEach((channel) => {
                if (channel instanceof HTMLDivElement) {
                    if (searchInput.value !== '' && channel.querySelector('.channel-title')?.textContent?.toLowerCase().includes(searchInput.value.toLowerCase())) {
                        channel.classList.remove('hidden');
                        resultsFound++;
                        return;
                    } else {
                        if (searchInput.value == '') {
                            channel.classList.remove('hidden');
                            resultsFound++;
                        }
                    }
                    
                    
                } else {
                    channel.classList.add('hidden');
                }
            });
            searchResultsFound.textContent = `${resultsFound} results found`;
        })
        document.getElementById('playlist-search-filters')?.appendChild(allFilter);
        registedFilters.add("All");
    }
}

function checkAndRegisterNewFilter(groupName: string) {
    if (!registedFilters.has(groupName)) {
        let newFilter = document.createElement('button');
        newFilter.classList.add('filter');
        newFilter.id = `filter-${groupName}`;
        newFilter.textContent = groupName;
        newFilter.addEventListener('click', () => {
            let resultsFound = 0;
            Array.from(channelContainer.children).forEach((channel) => {
                if (channel instanceof HTMLDivElement) {
                    if (channel.dataset.group?.includes(groupName)) {
                        if (searchInput.value !== '' && channel.querySelector('.channel-title')?.textContent?.toLowerCase().includes(searchInput.value.toLowerCase())) {
                            channel.classList.remove('hidden');
                            resultsFound++;
                            return;
                        } else {
                            if (searchInput.value == '') {
                                channel.classList.remove('hidden');
                                resultsFound++;
                            }
                        }
                        
                        
                    } else {
                        channel.classList.add('hidden');
                    }
                }
            });
            searchResultsFound.textContent = `${resultsFound} results found`;
        })
        document.getElementById('playlist-search-filters')?.appendChild(newFilter);
        registedFilters.add(groupName);
    }
}