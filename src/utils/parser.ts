import parser from "iptv-playlist-parser"; 

async function parse(url: string) {
    let fetchData = await fetch(url);
    let data = parser.parse(await fetchData.text());
    return data;
}

let funcs = {
    parse
}

export default funcs;
