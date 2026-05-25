var TMDB_API_KEY = "439c478a771f35c05022f9feabcca01c";
var BASE = "https://entrepeliculasyseries.nz";
var UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
var CryptoJS = require("crypto-js");
var DECRYPT_KEY = "558e4d18ca7c0be131e1b406bb47ea79b6ea9444e93bf3315fc62484044c150b";

var SERVER_LABELS = {
    "voe": "VOE", "streamwish": "StreamWish", "filemoon": "Filemoon",
    "vidhide": "VidHide", "doodstream": "DoodStream", "rapidvideo": "RapidVideo"
};

function aesDecrypt(encryptedBase64) {
    try {
        var raw = CryptoJS.enc.Base64.parse(encryptedBase64);
        var iv = CryptoJS.lib.WordArray.create(raw.words.slice(0, 4), 16);
        var ciphertext = CryptoJS.lib.WordArray.create(raw.words.slice(4), raw.sigBytes - 16);
        var key = CryptoJS.enc.Hex.parse(DECRYPT_KEY);
        var decrypted = CryptoJS.AES.decrypt({ ciphertext: ciphertext }, key, { iv: iv, mode: CryptoJS.mode.CBC });
        return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (e) {
        return null;
    }
}

function getImdbId(tmdbId, mediaType) {
    return new Promise(function (resolve) {
        var type = mediaType === "movie" ? "movie" : "tv";
        var url = "https://api.themoviedb.org/3/" + type + "/" + tmdbId + "/external_ids?api_key=" + TMDB_API_KEY;
        fetch(url, { headers: { "User-Agent": UA } })
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (d) { resolve(d && d.imdb_id ? d.imdb_id : null); })
            .catch(function () { resolve(null); });
    });
}

function fetchText(url) {
    return new Promise(function (resolve) {
        fetch(url, { headers: { "User-Agent": UA } })
            .then(function (r) { return r.ok ? r.text() : null; })
            .catch(function () { resolve(null); });
    });
}

function extractDataLink(html) {
    if (!html) return [];
    var match = html.match(/let\s+dataLink\s*=\s*(\[[\s\S]*?\])\s*;/);
    if (!match) return [];
    try {
        return JSON.parse(match[1]);
    } catch(e) {
        return [];
    }
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
                fetchText(BASE + "/vidurl/" + imdbId + "/").then(function (html) {
                    if (!html) return resolve([]);
                    var dataLink = extractDataLink(html);
                    if (dataLink.length === 0) return resolve([]);

                    var results = [];
                    var count = 0;
                    for (var i = 0; i < dataLink.length && count < 10; i++) {
                        var embeds = dataLink[i].sortedEmbeds || [];
                        for (var j = 0; j < embeds.length && count < 10; j++) {
                            var name = embeds[j].servername || "";
                            var encLink = embeds[j].link || "";
                            var decrypted = aesDecrypt(encLink);
                            if (decrypted && decrypted.indexOf("http") === 0) {
                                var label = SERVER_LABELS[name] || name.charAt(0).toUpperCase() + name.slice(1);
                                var stream = {
                                    name: "EPS - " + label,
                                    url: decrypted,
                                    quality: "HD",
                                    language: "Latino",
                                    behaviorHints: { notWebReady: true, isEmbed: true }
                                };
                                if (typeof __yield_result === "function") __yield_result(JSON.stringify(stream));
                                results.push(stream);
                                count++;
                            }
                        }
                    }
                    resolve(results);
                }).catch(function () { resolve([]); });
            }).catch(function () { resolve([]); });
        } catch (e) {
            resolve([]);
        }
    });
}

module.exports = { getStreams };
