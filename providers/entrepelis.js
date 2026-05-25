var TMDB_API_KEY = "439c478a771f35c05022f9feabcca01c";
var BASE = "https://entrepeliculasyseries.nz";
var UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

function getImdbId(tmdbId, mediaType) {
    return new Promise(function (resolve) {
        var type = mediaType === "movie" ? "movie" : "tv";
        var url = "https://api.themoviedb.org/3/" + type + "/" + tmdbId + "/external_ids?api_key=" + TMDB_API_KEY;
        fetch(url, { headers: { "User-Agent": UA } })
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (d) { resolve(d && d.imdb_id ? d.imdb_id : null); })
            .catch(function () { resolve([]); });
    });
}

function getStreams(tmdbId, mediaType, season, episode) {
    return new Promise(function (resolve) {
        try {
            var cleanId = String(tmdbId).trim();
            if (cleanId.includes("|")) cleanId = cleanId.split("|")[0];
            cleanId = cleanId.replace(/^tmdb:/, "").replace(/^series:/, "").replace(/^movie:/, "").split(":")[0].split("/")[0];
            if (!cleanId || cleanId === "null" || cleanId === "undefined") return resolve([]);

            getImdbId(cleanId, mediaType).then(function (imdbId) {
                if (!imdbId) return resolve([]);

                var url = BASE + "/vidurl/" + imdbId + "/";
                var stream = {
                    name: "EPS",
                    url: url,
                    quality: "HD",
                    language: "Latino",
                    behaviorHints: { notWebReady: true, isEmbed: true }
                };
                if (typeof __yield_result === "function") __yield_result(JSON.stringify(stream));
                resolve([stream]);
            }).catch(function () { resolve([]); });
        } catch (e) {
            resolve([]);
        }
    });
}

module.exports = { getStreams };
