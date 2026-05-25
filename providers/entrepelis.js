var TMDB_API_KEY = "439c478a771f35c05022f9feabcca01c";
var BASE = "https://entrepeliculasyseries.nz";
var UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

function normalize(str) {
    if (!str) return "";
    var s = str.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
    try { s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); } catch(e) {}
    return s;
}

function slugify(title) {
    if (!title) return "";
    return normalize(title).replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
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

function fetchPage(url) {
    return new Promise(function (resolve) {
        fetch(url, { headers: { "User-Agent": UA } })
            .then(function (r) { return r.ok ? r.text() : null; })
            .then(function (html) { resolve(html); })
            .catch(function () { resolve(null); });
    });
}

function extractLinks(html) {
    var links = [];
    if (!html) return links;
    var regex = /<a\s+href="(\/(?:pelicula|serie|anime)\/[^"]+)"[^>]*>[\s\S]*?<h2[^>]*class="title"[^>]*>([^<]+)<\/h2>[\s\S]*?<span[^>]*class="tag"[^>]*>(\d{4})<\/span>/gi;
    var match;
    while ((match = regex.exec(html)) !== null) {
        links.push({ href: match[1], title: match[2].trim(), year: match[3] });
    }
    return links;
}

function isMatch(postTitle, targetTitle, postYear, targetYear) {
    var pTitle = normalize(postTitle.replace(/\(\d{4}\)/g, "").trim());
    var tTitle = normalize(targetTitle);
    if (!pTitle || !tTitle) return false;
    if (postYear !== targetYear && Math.abs(parseInt(postYear) - parseInt(targetYear)) > 1) return false;
    return pTitle.includes(tTitle) || tTitle.includes(pTitle);
}

function extractIframe(html) {
    if (!html) return null;
    var m = html.match(/<iframe[^>]*src="(\/vidurl\/[^"]+)"/i);
    return m ? m[1] : null;
}

function extractServers(html) {
    var servers = [];
    if (!html) return servers;
    var regex = /"servername"\s*:\s*"([^"]+)"/g;
    var match;
    while ((match = regex.exec(html)) !== null) {
        var name = match[1];
        if (name && servers.indexOf(name) === -1) servers.push(name);
    }
    return servers;
}

function tryDirectUrl(title, year, mediaType) {
    var slug = slugify(title);
    var urls = [];
    var prefixes = ["pelicula", "serie"];
    for (var p = 0; p < prefixes.length; p++) {
        urls.push(BASE + "/" + prefixes[p] + "/" + slug);
        urls.push(BASE + "/" + prefixes[p] + "/" + slug + "-" + year);
    }
    var unique = [];
    for (var i = 0; i < urls.length; i++) {
        if (unique.indexOf(urls[i]) === -1) unique.push(urls[i]);
    }
    return unique;
}

function checkDirectUrl(url) {
    return new Promise(function (resolve) {
        fetch(url, { method: "HEAD", headers: { "User-Agent": UA } })
            .then(function (r) { resolve(r.ok ? url : null); })
            .catch(function () { resolve(null); });
    });
}

var SERVER_NAMES = {
    "voe": "VOE",
    "streamwish": "StreamWish",
    "filemoon": "Filemoon",
    "vidhide": "VidHide",
    "doodstream": "DoodStream",
    "rapidvideo": "RapidVideo"
};

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

                var foundPage = null;

                var tryDirect = function (cb) {
                    var urls = tryDirectUrl(title, year, mediaType);
                    var checkNext = function (idx) {
                        if (idx >= urls.length) return cb(null);
                        checkDirectUrl(urls[idx]).then(function (validUrl) {
                            if (validUrl) return cb(validUrl);
                            checkNext(idx + 1);
                        }).catch(function () { checkNext(idx + 1); });
                    };
                    checkNext(0);
                };

                var searchNext = function (idx, cb) {
                    if (idx >= queries.length) return cb(null);
                    searchSite(queries[idx]).then(function (html) {
                        if (!html) return searchNext(idx + 1, cb);
                        var links = extractLinks(html);
                        for (var i = 0; i < links.length; i++) {
                            if (isMatch(links[i].title, title, links[i].year, year)) {
                                return cb(BASE + links[i].href);
                            }
                        }
                        searchNext(idx + 1, cb);
                    }).catch(function () { searchNext(idx + 1, cb); });
                };

                var emitStreams = function (pageUrl) {
                    if (!pageUrl) return resolve([]);
                    fetchPage(pageUrl).then(function (html) {
                        if (!html) return resolve([]);
                        var iframePath = extractIframe(html);
                        if (!iframePath) return resolve([]);
                        var embedUrl = BASE + iframePath;

                        fetchPage(embedUrl).then(function (embedHtml) {
                            var servers = extractServers(embedHtml);
                            var results = [];

                            if (servers.length > 0) {
                                for (var s = 0; s < servers.length; s++) {
                                    var displayName = SERVER_NAMES[servers[s]] || servers[s].charAt(0).toUpperCase() + servers[s].slice(1);
                                    var stream = {
                                        name: "EPS - " + displayName,
                                        url: embedUrl,
                                        quality: "HD",
                                        language: "Latino",
                                        behaviorHints: { notWebReady: true, isEmbed: true }
                                    };
                                    if (typeof __yield_result === "function") __yield_result(JSON.stringify(stream));
                                    results.push(stream);
                                }
                            }

                            if (results.length === 0) {
                                var fallback = {
                                    name: "EPS",
                                    url: pageUrl,
                                    quality: "HD",
                                    language: "Latino",
                                    behaviorHints: { notWebReady: true, isEmbed: true }
                                };
                                if (typeof __yield_result === "function") __yield_result(JSON.stringify(fallback));
                                results.push(fallback);
                            }

                            resolve(results);
                        }).catch(function () {
                            var fallback = {
                                name: "EPS",
                                url: pageUrl,
                                quality: "HD",
                                language: "Latino",
                                behaviorHints: { notWebReady: true, isEmbed: true }
                            };
                            if (typeof __yield_result === "function") __yield_result(JSON.stringify(fallback));
                            resolve([fallback]);
                        });
                    }).catch(function () { resolve([]); });
                };

                searchNext(0, function (pageUrl) {
                    if (pageUrl) return emitStreams(pageUrl);
                    tryDirect(function (pageUrl) {
                        if (pageUrl) return emitStreams(pageUrl);
                        resolve([]);
                    });
                });
            }).catch(function () { resolve([]); });
        } catch (e) {
            resolve([]);
        }
    });
}

module.exports = { getStreams };
