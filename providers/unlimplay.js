const BASE = "https://unlimplay.com";

async function getStreams(tmdbId, mediaType, season, episode) {
    try {
        let cleanId = String(tmdbId).trim();
        if (cleanId.includes("|")) cleanId = cleanId.split("|")[0];
        cleanId = cleanId.replace(/^tmdb:/, "").replace(/^series:/, "").replace(/^movie:/, "").split(":")[0].split("/")[0];
        if (!cleanId || cleanId === "null" || cleanId === "undefined") return [];

        const isTv = !["movie", "film"].includes(String(mediaType).toLowerCase());

        let apiPath;
        if (isTv && season && episode) {
            apiPath = `/play.php/embed/tv/${cleanId}/${season}/${episode}?api=1`;
        } else {
            apiPath = `/play.php/embed/movie/${cleanId}?api=1`;
        }

        const res = await fetch(`${BASE}${apiPath}`, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Referer": `${BASE}/`,
                "Accept": "application/json"
            }
        });
        if (!res.ok) return [];
        const json = await res.json();
        if (!json.success || !json.data || json.data.length === 0) return [];

        const streams = [];
        for (const item of json.data) {
            if (!item.embed_url) continue;
            const lang = (item.language || "").toLowerCase();
            const label = lang === "latino" ? "Latino" : lang === "espanol" ? "Español" : lang === "subtitulado" ? "Subtitulado" : item.language;
            streams.push({
                name: `UnlimPlay - ${label}`,
                url: item.embed_url,
                quality: "HD",
                language: label,
                behaviorHints: { notWebReady: true, isEmbed: true }
            });
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
