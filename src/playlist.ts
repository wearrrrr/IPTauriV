import { createDummyImage } from "./utils/image";
import { downloadPlaylist, verifyParams, parse } from "./utils/parser";

const URLParams = new URLSearchParams(window.location.search)

let params = {
    url: URLParams.get('url')!.toString(),
    name: URLParams.get('name')!.toString()
}



console.log(params)

const playlistName = document.getElementById('playlist-name');

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
    const virtualList = document.getElementById('virtual-list');

    function renderAllItems() {
        virtualList!.innerHTML = '';

        for (const item of data.items) {
            item.name = item.name.trim();
            item.name = item.name.charAt(0).toUpperCase() + item.name.slice(1);
            let channel = document.createElement('div');
            let channelTitle = document.createElement('div');
            let channelLogo = document.createElement('img');
            channel.id = item.name;
            channel.classList.add('channel');
            channel.dataset.url = item.url;
            channelTitle.textContent = item.name;
            channelTitle.classList.add('channel-title');

            if (!item.tvg.logo || item.tvg.logo === '' || item.tvg.logo === null) {
                channelLogo.src = createDummyImage(item.name.charAt(0).toUpperCase());
            } else {
                channelLogo.src = item.tvg.logo;
            }
            channelLogo.classList.add('channel-logo');

            virtualList!.appendChild(channel);
            channel.appendChild(channelLogo);
            channel.appendChild(channelTitle);
        }
    }

    // Initial render of all items
    renderAllItems();
});
