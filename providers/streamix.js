const BASE = "https://stream-vault-two-phi.vercel.app";

async function getStreams(tmdbId, mediaType, season, episode) {
    try {
        let cleanId = String(tmdbId).trim();
        if (cleanId.includes("|")) cleanId = cleanId.split("|")[0];
        cleanId = cleanId.replace(/^tmdb:/, "").replace(/^series:/, "").replace(/^movie:/, "").split(":")[0].split("/")[0];
        if (!cleanId || cleanId === "null" || cleanId === "undefined") return [];

        const isTv = !["movie", "film"].includes(String(mediaType).toLowerCase());
        const params = new URLSearchParams({ type: isTv ? "tv" : "movie", id: cleanId });
        if (isTv && season) params.set("season", season);
        if (isTv && episode) params.set("episode", episode);

        const res = await fetch(`${BASE}/api/v1/embed-serve?${params}`, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", "Referer": `${BASE}/` }
        });
        if (!res.ok) return [];
        const json = await res.json();
        if (!json.success || !json.data || !json.data.sources) return [];

        const seen = new Set();
        const streams = [];
        for (const src of json.data.sources) {
            if (!src.url || seen.has(src.url)) continue;
            seen.add(src.url);

            if (src.playbackType === "iframe") {
                streams.push({
                    name: `Streamix - ${src.name || "Embed"}`,
                    url: src.url,
                    quality: src.quality || "HD",
                    language: src.lang || "Latino",
                    behaviorHints: { notWebReady: true, isEmbed: true }
                });
            }
        }

        if (typeof __yield_result === "function") {
            for (const s of streams) {
                __yield_result(JSON.stringify(s));
                if (typeof __native_sleep === "function") await __native_sleep(30);
            }
        }

        return streams;
    } catch (e) {
        return [];
    }
}

module.exports = { getStreams };
