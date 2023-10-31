import { dummyImages, generateAndCacheDummyImage } from "./utils/image";
import { downloadPlaylist, verifyParams, parse } from "./utils/parser";

const URLParams = new URLSearchParams(window.location.search)

let params = {
    url: URLParams.get('url')!.toString(),
    name: URLParams.get('name')!.toString()
}



console.log(params)

const playlistName = document.getElementById('playlist-name') as HTMLParagraphElement;
const channelContainer = document.getElementById('channels-container')! as HTMLDivElement;
const searchInput = document.getElementById('search-input') as HTMLInputElement;
const searchResultsFound = document.getElementById('results-found') as HTMLSpanElement;

let playlistItemsLength = 0;

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

await downloadPlaylist(params.url, params.name);

await parse(params.name).then(async (data) => {
    const batchSize = 10; // Change this to your desired batch size
    let totalItems = 0;
    let itemsLoaded = new Set<number>();
    playlistItemsLength = data.items.length;

    // Define the Intersection Observer only once
    const observerOptions: IntersectionObserverInit = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1,
    };
    const observer = new IntersectionObserver(handleIntersection, observerOptions);


    async function loadItemsInBatch() {
        for (let i = itemsLoaded.size; i < Math.min(itemsLoaded.size + batchSize, totalItems); i++) {
            await generateAndCacheDummyImage(data.items[i].name.charAt(0).toUpperCase());
            if (!itemsLoaded.has(i)) {
                const item = data.items[i];
    
                const channel = document.createElement('div');
                channel.classList.add('channel');
                channel.dataset.url = item.url;
    
                const image = document.createElement('img');
                image.classList.add('channel-logo');
                image.loading = 'lazy';

                image.addEventListener('error', () => {
                    image.src = dummyImages[item.name.charAt(0).toUpperCase()];
                    console.log("Image load fail!")
                })

                image.onload = function() {
                    if (image.naturalWidth == 1) {
                        image.src = dummyImages[item.name.charAt(0).toUpperCase()];
                    }
                };
    
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
  
