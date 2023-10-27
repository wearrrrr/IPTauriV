let urlRegex = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/

function validatePlaylistName(playlistName: string) {
    // The whole purpose of this function is to check if the playlist name can be safely made into a valid HTML ID. 
    return playlistName.match(/^[A-Za-z][A-Za-z0-9\-_:.]*$/) ? playlistName : playlistName.replace(/[^A-Za-z0-9\-_:.]/g, '_');
}


export { urlRegex, validatePlaylistName }