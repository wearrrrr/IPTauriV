import * as shell from "@tauri-apps/api/shell";
import { createToast } from "./toast";
import * as os from "@tauri-apps/api/os";

export async function openExternalPlayer(player: string | null, url: string, name: string) {
    if (player == null) {
        player = localStorage.getItem('player');
        if (player == null) {
            player = 'vlc'; // Default to VLC since it's the most popular player.
        }
    }
    let titleFlag = '';
    let mpvPlayerFlags = [];
    let vlcPlayerFlags = [];
    let preferredFlags: string[] = [];
    if (player == 'mpv') {
        mpvPlayerFlags.push(url)
        mpvPlayerFlags.push(`--title=${name}`);
        mpvPlayerFlags.push("--force-window=immediate");
        mpvPlayerFlags.push(`--media-title=${name}`);
        mpvPlayerFlags.push(`--network-timeout=${localStorage.getItem("network-timeout") || 20}`)
        mpvPlayerFlags.push(`--geometry=${localStorage.getItem("window-geometry") || "50%x50%"}`)
        mpvPlayerFlags.push("--autofit=50%")


        preferredFlags = mpvPlayerFlags;
    } else if (player == 'vlc') {
        vlcPlayerFlags.push(url)
        vlcPlayerFlags.push(`--meta-title=${name}`);

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
            command = new shell.Command("cmd", [`/c ${player} ${url} ${titleFlag}${name}`]);
            break;
        default:
            console.error("Unknown platform!");
            break;
    }

    let child = await command.spawn();
    // check for errors
    command.stdout.on('data', (line) => {
        console.log(line)
        if (/HTTP error 404 Not Found/g.test(line) == true) {
            createToast('Error: 404 Not Found!', 4000)
            child.kill();
            
        } else if (/HTTP error 403 Forbidden/g.test(line) == true) {
            createToast('Error: 403 Forbidden!', 4000)
            child.kill();
        }
    });
    console.log("spawned!")
}