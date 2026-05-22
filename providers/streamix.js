// providers/streamix.js
const STREAMIX_API = 'https://stream-vault-two-phi.vercel.app/api/v1/embed-serve';

async function getStreams(tmdbId, mediaType, season, episode) {
    let apiUrl;
    if (mediaType === "movie") {
        apiUrl = `${STREAMIX_API}?type=movie&id=${tmdbId}`;
    } else {
        apiUrl = `${STREAMIX_API}?type=tv&id=${tmdbId}&season=${season}&episode=${episode}`;
    }
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (data.success && data.data.sources) {
        return data.data.sources.map(s => ({
            name: "Streamix",
            url: s.url,
            headers: { "User-Agent": "Mozilla/5.0" }
        }));
    }
    return [];
}

module.exports = { getStreams };module.exports = StreamixProvider;
