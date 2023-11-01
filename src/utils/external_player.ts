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
    if (player == 'mpv') {
        titleFlag = '--title=';
    } else if (player == 'vlc') {
        titleFlag = '--meta-title=';
    }
    // Get platform name
    let platform = await os.platform();
    let command!: shell.Command;
    switch (platform) {
        case "linux":
            command = new shell.Command(player, [url, `${titleFlag}${name}`]);
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

    // check for errors
    command.stdout.on('data', (line) => {
        /HTTP error 404 Not Found/g.test(line) && createToast('Error: 404 Not Found!', 4000);
    });

    await command.spawn();
    console.log("spawned!")
}