import * as shell from "@tauri-apps/api/shell";
import { createToast } from "./toast";
import * as os from "@tauri-apps/api/os";
import { VLC_PATH } from "./update_player_setting";

export async function openExternalPlayer(player: string | null, url: string, name: string) {
    if (player == null) {
        player = localStorage.getItem('player');
        if (player == null) {
            player = 'vlc'; // Default to VLC since it's the most popular player.
        }
    }
    let mpvPlayerFlags = [];
    let vlcPlayerFlags = [];
    let preferredFlags: string[] = [];
    if (player == 'mpv') {
        mpvPlayerFlags.push(url)
        mpvPlayerFlags.push(`--title=${name}`);
        mpvPlayerFlags.push("--force-window=immediate");
        mpvPlayerFlags.push(`--force-media-title=${name}`);
        mpvPlayerFlags.push(`--hwdec=${localStorage.getItem("hwdec") || "no"}`)
        let networkTimeout = localStorage.getItem("network-timeout");
        try {
            let intNetworkTimeout = parseInt(networkTimeout!);
            if (intNetworkTimeout >= 0) {
                mpvPlayerFlags.push(`--network-timeout=${networkTimeout}`)
            }
        } catch {
            mpvPlayerFlags.push(`--network-timeout=${20}`)
        }
        
        mpvPlayerFlags.push(`--geometry=${localStorage.getItem("window-geometry") || "50%x50%"}`)
        mpvPlayerFlags.push("--autofit=50%")

        preferredFlags = mpvPlayerFlags;
    } else if (player == 'vlc') {
        vlcPlayerFlags.push(`${url}`);
        preferredFlags = vlcPlayerFlags;
    }
    // Get platform name
    let platform = await os.platform();
    let command!: shell.Command;
    switch (platform) {
        case "linux":
            command = new shell.Command(player, preferredFlags);
            break;
        case "darwin":
            console.error("macOS is not supported yet!");
            break;
        case "win32":
            command = new shell.Command("vlc.exe", [`${preferredFlags.join(" ")}`]);
            break;
        default:
            console.error("Unknown platform!");
            break;
    }
    console.log(command)
    let child = await command.spawn();

    console.log(`Opening ${url} with ${player}!`)

    // check for errors
    command.stdout.on('data', (line) => {
        if (/HTTP error 404 Not Found/g.test(line) == true) {
            createToast('Failed to load Playlist! Error 404.', 4000)
            child.kill();
            
        } else if (/HTTP error 403 Forbidden/g.test(line) == true) {
            createToast('Error: 403 Forbidden!', 4000)
            child.kill();
        }
    });

    command.stderr.on('data', (line) => {
        console.log(line)
    });

    command.addListener('close', (signal) => {
        if (signal.code == 1) {
            createToast(`Fatal Error occured when launching ${player}!`, 4000)
        }
    })
    console.log("spawned!")
}