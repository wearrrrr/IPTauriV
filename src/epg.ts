import { appDataDir } from "@tauri-apps/api/path";
import { DlStatus, deleteFailedDownload, downloadEPGXML, parseEPGXMLData } from "./utils/parser";
import { fs, path } from "@tauri-apps/api";
import { Channel, ChannelGroup, Root } from "./utils/types";
import { Xmltv, XmltvChannel } from "@iptv/xmltv";

const URLParams = new URLSearchParams(window.location.search)
let params = {
    url: URLParams.get('url')!.toString(),
    name: URLParams.get('name')!.toString(),
    epgURL: URLParams.get('epg')
}
const appdata = await path.appDataDir();
const epgGroup = document.getElementById("epg-table") as HTMLDivElement;


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

async function loadEPG() {
    if (params.epgURL !== null) {
        return checkEPGExists(params.name).then(async (result) => {
            if (result == DlStatus.DOWNLOAD_NEEDED) {
                await downloadEPGXML(params.epgURL as string, params.name).then(async (result) => {
                    if (result == DlStatus.DOWNLOAD_ERROR) {
                        alert("Failed to download EPG file!")
                        await deleteFailedDownload(params.name);
                        window.location.reload();
                    }
                })
            }
            console.time("EPG Parse")
            return fs.readTextFile(`${await appDataDir()}epg/${params.name}.xml`).then(async (data) => {
                let dataJSON: Xmltv = (await parseEPGXMLData(data) as Xmltv);
                console.timeEnd("EPG Parse")
                return dataJSON;
            })
        })
    } else {
        console.log("No EPG Found!")
        return null;
    }
}

// function displayEPG(xmltv: Xmltv): void {
//     console.time("EPG Display")
//     const epgGroup = document.getElementById('epg-group');

//     if (epgGroup && xmltv.channels && xmltv.programmes) {
//         xmltv.channels.forEach((channel: XmltvChannel) => {
//             const channelElement = document.createElement('div');
//             channelElement.classList.add('epg-channel');

//             const channelIdElement = document.createElement('p');
//             channelIdElement.textContent = `Channel ID: ${channel.id}`;
//             channelElement.appendChild(channelIdElement);

//             const displayNameElement = document.createElement('p');
//             displayNameElement.textContent = 'Display Name: ';
//             channel.displayName.forEach((name) => {
//                 const nameElement = document.createElement('span');
//                 nameElement.textContent = `${name._value}`;
//                 displayNameElement.appendChild(nameElement);
//             });
//             channelElement.appendChild(displayNameElement);

//             if (channel.icon) {
//                 const iconElement = document.createElement('p');
//                 iconElement.textContent = `Icon: ${channel.icon[0].src}`;
//                 channelElement.appendChild(iconElement);
//             }

//             if (channel.url) {
//                 const urlElement = document.createElement('p');
//                 urlElement.textContent = `URL: ${channel.url[0]._value}`;
//                 channelElement.appendChild(urlElement);
//             }

//             const programsForChannel = xmltv.programmes!.filter((program) => program.channel === channel.id);

//             programsForChannel.forEach((program) => {
//                 const programElement = document.createElement('div');
//                 programElement.classList.add('epg-program');

//                 const titleElement = document.createElement('p');
//                 titleElement.textContent = 'Title:';
//                 program.title.forEach((title) => {
//                     const titleTextElement = document.createElement('span');
//                     titleTextElement.textContent = `${title.lang}: ${title._value}`;
//                     titleElement.appendChild(titleTextElement);
//                 });
//                 programElement.appendChild(titleElement);

//                 if (program.desc) {
//                     const descriptionElement = document.createElement('p');
//                     descriptionElement.textContent = 'Description:';
//                     program.desc.forEach((description) => {
//                         const descriptionTextElement = document.createElement('span');
//                         descriptionTextElement.textContent = `${description.lang}: ${description._value}`;
//                         descriptionElement.appendChild(descriptionTextElement);
//                     });
//                     programElement.appendChild(descriptionElement);
//                 }

//                 const timeElement = document.createElement('p');
//                 timeElement.textContent = `Time: ${program.start} - ${program.stop}`;
//                 programElement.appendChild(timeElement);

//                 channelElement.appendChild(programElement);
//             });

//             channelElement.appendChild(document.createElement('hr'));
//             epgGroup.appendChild(channelElement);
//         });
//         console.timeEnd("EPG Display")
//     } else {
//         console.error("Target element 'epg-group' not found or no channels/programs found in the EPG data.");
//     }
// }

function createHalfHourTimeIncrements() {
    // Create half hour increments for the next 48 hours based on the current time rounded down to the nearest half hour
    const now = new Date();
    const nowRoundedDown = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() - (now.getMinutes() % 30));
    const timeIncrements = [];
    for (let i = 0; i < 48; i++) {
        const timeIncrement = new Date(nowRoundedDown.getTime() + (i * 30 * 60 * 1000));
        timeIncrements.push(timeIncrement);
    }
    // Create the time increment elements
    const epgTimeIncrements = document.getElementById('epg-time-increments');
    if (epgTimeIncrements) {
        timeIncrements.forEach((timeIncrement) => {
            const timeIncrementElement = document.createElement('div');
            timeIncrementElement.classList.add('epg-time-increment');
            timeIncrementElement.textContent = timeIncrement.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            epgTimeIncrements.appendChild(timeIncrementElement);
        });
    } else {
        console.error("Target element 'epg-time-increments' not found.");
    }
}
createHalfHourTimeIncrements();

const timeIndicator = document.getElementById('time-indicator');
// Update the time indicator every 10 seconds
setInterval(() => {
    const now = new Date();
    const nowRoundedDown = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() - (now.getMinutes() % 30));
    const timeIncrements = document.getElementsByClassName('epg-time-increment');
    if (timeIncrements) {
        const timeIncrementIndex = Math.floor((now.getTime() - nowRoundedDown.getTime()) / (30 * 60 * 1000));
        const timeIncrementElement = timeIncrements[timeIncrementIndex] as HTMLElement;
        if (timeIncrementElement) {
            timeIndicator!.style.top = `${timeIncrementElement.offsetTop}px`;
        }
    }
}, 10000);

function displayEPG(xmltv: Xmltv, batchSize: number = 10): void {
    console.time("EPG Display");
    const epgGroup = document.getElementById('epg-group');

    if (epgGroup && xmltv.channels && xmltv.programmes) {
        const totalChannels = xmltv.channels.length;
        let channelsPlaced = 0;
        let channelIndex = 0;

        const processBatch = () => {
            
            for (let i = 0; i < batchSize && channelIndex < totalChannels; i++) {
                if (channelsPlaced == 100) return; 
                const channel = xmltv.channels![channelIndex];
                const channelElement = document.createElement('div');
                channelElement.classList.add('epg-channel');

                const displayNameElement = document.createElement('p');
                channel.displayName.forEach((name) => {
                    const nameElement = document.createElement('span'); 
                    nameElement.textContent = `${name._value}`;
                    displayNameElement.appendChild(nameElement);
                });
                channelElement.appendChild(displayNameElement);

                if (channel.icon) {
                    const iconElement = document.createElement('p');
                    iconElement.textContent = `Icon: ${channel.icon[0].src}`;
                    channelElement.appendChild(iconElement);
                }

                if (channel.url) {
                    const urlElement = document.createElement('p');
                    urlElement.textContent = `URL: ${channel.url[0]._value}`;
                    channelElement.appendChild(urlElement);
                }

                const programsForChannel = xmltv.programmes!.filter((program) => program.channel === channel.id);
                programsForChannel.forEach((program) => {
                    const programElement = document.createElement('div');
                    programElement.classList.add('epg-program');

                    const titleElement = document.createElement('p');
                    program.title.forEach((title) => {
                        const titleTextElement = document.createElement('span');
                        titleTextElement.textContent = `${title._value}`.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");
                        titleElement.appendChild(titleTextElement);
                    });
                    programElement.appendChild(titleElement);

                    // Calculate the width of the program based on its duration
                    const programDuration = (new Date(program.stop!)).getTime() - (new Date(program.start)).getTime();
                    const pixelsPerMinute = 7; // Adjust as needed
                    const programWidth = (programDuration / (82 * 1000)) * pixelsPerMinute;
                    programElement.style.maxWidth = `${programWidth}px`;
                    programElement.style.minWidth = `${programWidth}px`;

                    // Check if the program time is in the past, skip if so
                    const programTime = new Date(program.start);
                    const now = new Date();
                    if (programTime < now) {
                        return;
                    }

                    channelElement.appendChild(programElement);
                });

                channelElement.appendChild(document.createElement('hr'));
                epgGroup.appendChild(channelElement);
                channelIndex++;
                channelsPlaced++;
            }

            if (channelIndex < totalChannels) {
                // Schedule the next batch processing
                requestAnimationFrame(processBatch);
            } else {
                // All channels processed
                console.timeEnd("EPG Display");
            }
        };

        // Start the batch processing
        processBatch();
    } else {
        console.error("Target element 'epg-group' not found or no channels/programs found in the EPG data.");
    }
}

loadEPG().then((data: Xmltv | null) => {
    console.log(data)
    displayEPG(data as Xmltv);
});
