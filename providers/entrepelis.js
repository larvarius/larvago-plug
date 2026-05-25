var TMDB_API_KEY = "439c478a771f35c05022f9feabcca01c";
var BASE = "https://entrepeliculasyseries.nz";
var UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

function normalize(str) {
    if (!str) return "";
    return str.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9 ]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function cleanTitle(title) {
    if (!title) return "";
    return title.replace(/\(\d{4}\)/g, "").trim();
}

function getTmdbData(tmdbId, mediaType) {
    return new Promise(function (resolve) {
        var type = mediaType === "movie" ? "movie" : "tv";
        var url = "https://api.themoviedb.org/3/" + type + "/" + tmdbId + "?api_key=" + TMDB_API_KEY + "&language=es-MX";
        fetch(url, { headers: { "User-Agent": UA } })
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (d) { resolve(d); })
            .catch(function () { resolve(null); });
    });
}

function searchSite(query) {
    return new Promise(function (resolve) {
        var url = BASE + "/search?s=" + encodeURIComponent(query);
        fetch(url, { headers: { "User-Agent": UA } })
            .then(function (r) { return r.ok ? r.text() : null; })
            .then(function (html) { resolve(html); })
            .catch(function () { resolve(null); });
    });
}

function extractLinks(html) {
    var links = [];
    if (!html) return links;
    var regex = /<a\s+href="(\/(?:pelicula|serie|anime)\/[^"]+)"[^>]*>[\s\S]*?<h4[^>]*class="title"[^>]*>([^<]+)<\/h4>[\s\S]*?<span[^>]*class="tag"[^>]*>(\d{4})<\/span>/gi;
    var match;
    while ((match = regex.exec(html)) !== null) {
        links.push({
            href: match[1],
            title: match[2].trim(),
            year: match[3]
        });
    }
    return links;
}

function isMatch(postTitle, targetTitle, postYear, targetYear) {
    var pTitle = normalize(cleanTitle(postTitle));
    var tTitle = normalize(targetTitle);
    if (!pTitle || !tTitle) return false;
    var yearMatch = postYear === targetYear || Math.abs(parseInt(postYear) - parseInt(targetYear)) <= 1;
    if (!yearMatch) return false;
    return pTitle.includes(tTitle) || tTitle.includes(pTitle);
}

function getStreams(tmdbId, mediaType, season, episode) {
    return new Promise(function (resolve) {
        try {
            var cleanId = String(tmdbId).trim();
            if (cleanId.includes("|")) cleanId = cleanId.split("|")[0];
            cleanId = cleanId.replace(/^tmdb:/, "").replace(/^series:/, "").replace(/^movie:/, "").split(":")[0].split("/")[0];
            if (!cleanId || cleanId === "null" || cleanId === "undefined") return resolve([]);

            getTmdbData(cleanId, mediaType).then(function (data) {
                if (!data) return resolve([]);

                var title = data.title || data.name || data.original_title || data.original_name;
                var year = data.release_date ? data.release_date.substring(0, 4) : (data.first_air_date ? data.first_air_date.substring(0, 4) : "");
                if (!title) return resolve([]);

                var queries = [title];
                if (data.original_title && data.original_title !== title) queries.push(data.original_title);
                var partTitle = title.split(/[:\-]/)[0].trim();
                if (partTitle !== title) queries.push(partTitle);

                var searchNext = function (idx) {
                    if (idx >= queries.length) return resolve([]);
                    searchSite(queries[idx]).then(function (html) {
                        if (!html) return searchNext(idx + 1);
                        var links = extractLinks(html);
                        for (var i = 0; i < links.length; i++) {
                            if (isMatch(links[i].title, title, links[i].year, year)) {
                                var pageUrl = BASE + links[i].href;
                                var stream = {
                                    name: "EPS - " + links[i].title,
                                    url: pageUrl,
                                    quality: "HD",
                                    language: "Latino",
                                    behaviorHints: { notWebReady: true, isEmbed: true }
                                };
                                if (typeof __yield_result === "function") {
                                    __yield_result(JSON.stringify(stream));
                                }
                                return resolve([stream]);
                            }
                        }
                        searchNext(idx + 1);
                    }).catch(function () { searchNext(idx + 1); });
                };
                searchNext(0);
            }).catch(function () { resolve([]); });
        } catch (e) {
            resolve([]);
        }
    });
}

module.exports = { getStreams };
