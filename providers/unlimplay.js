const TMDB_API_KEY = "439c478a771f35c05022f9feabcca01c";
const BASE = "https://unlimplay.com";

async function getStreams(tmdbId, mediaType, season, episode) {
    try {
        let cleanId = String(tmdbId).trim();
        if (cleanId.includes("|")) cleanId = cleanId.split("|")[0];
        cleanId = cleanId.replace(/^tmdb:/, "").replace(/^series:/, "").replace(/^movie:/, "").split(":")[0].split("/")[0];
        if (!cleanId || cleanId === "null" || cleanId === "undefined") return [];

        const isTv = !["movie", "film"].includes(String(mediaType).toLowerCase());
        let embedUrl;

        if (isTv && season && episode) {
            embedUrl = `${BASE}/play/embed/tv/${cleanId}/${season}/${episode}`;
        } else {
            embedUrl = `${BASE}/play/embed/movie/${cleanId}`;
        }

        const name = isTv ? "UnlimPlay TV" : "UnlimPlay";

        if (typeof __yield_result === "function") {
            const payload = JSON.stringify({
                name,
                url: embedUrl,
                quality: "HD",
                language: "Latino",
                behaviorHints: { notWebReady: true, isEmbed: true }
            });
            __yield_result(payload);
            if (typeof __native_sleep === "function") await __native_sleep(30);
        }

        return [{
            name,
            url: embedUrl,
            quality: "HD",
            language: "Latino",
            behaviorHints: { notWebReady: true, isEmbed: true }
        }];
    } catch (e) {
        return [];
    }
}

module.exports = { getStreams };
