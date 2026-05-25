var TMDB_API_KEY = "439c478a771f35c05022f9feabcca01c";
var BASE = "https://entrepeliculasyseries.nz";
var UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
var HEADERS = { "User-Agent": UA, "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", "Accept-Language": "es-MX,es;q=0.9", "Referer": BASE + "/" };
var CryptoJS = require("crypto-js");

function fetchText(url) {
    return new Promise(function (resolve) {
        var h = {};
        for (var k in HEADERS) h[k] = HEADERS[k];
        fetch(url, { headers: h, skipSizeCheck: true }).then(function (r) { return r.ok ? r.text() : null; }).catch(function () { resolve(null); });
    });
}

function extractDataLink(html) {
    if (!html) return [];
    var start = html.indexOf("let dataLink = ");
    if (start === -1) return [];
    start = html.indexOf("[", start);
    if (start === -1) return [];
    var depth = 1, i = start + 1;
    while (i < html.length && depth > 0) {
        if (html[i] === "[") depth++;
        else if (html[i] === "]") depth--;
        i++;
    }
    if (depth !== 0) return [];
    try { return JSON.parse(html.substring(start, i)); } catch(e) { return []; }
}

function extractPowConstants(html) {
    var challenge = "", salt = "", difficulty = 3;
    var cm = html.match(/const\s+POW_CHALLENGE\s*=\s*'([^']+)'/);
    if (cm) challenge = cm[1];
    var dm = html.match(/const\s+POW_DIFFICULTY\s*=\s*(\d+)/);
    if (dm) difficulty = parseInt(dm[1]);
    var sm = html.match(/const\s+POW_SALT\s*=\s*'([^']+)'/);
    if (sm) salt = sm[1];
    return { challenge: challenge, difficulty: difficulty, salt: salt };
}

var POW_MAX_ITERATIONS = 50000;
var DECRYPT_KEY_FALLBACK = "558e4d18ca7c0be131e1b406bb47ea79b6ea9444e93bf3315fc62484044c150b";
function solvePow(challenge, difficulty, salt) {
    var prefix = "";
    for (var z = 0; z < difficulty; z++) prefix += "0";
    var nonce = 0;
    while (nonce < POW_MAX_ITERATIONS) {
        var hash = CryptoJS.SHA256(challenge + nonce).toString(CryptoJS.enc.Hex);
        if (hash.indexOf(prefix) === 0) {
            var keyHash = CryptoJS.SHA256(challenge + nonce + salt).toString(CryptoJS.enc.Hex);
            return keyHash;
        }
        nonce++;
    }
    return DECRYPT_KEY_FALLBACK;
}

function aesDecrypt(enc, keyHex) {
    try {
        var raw = CryptoJS.enc.Base64.parse(enc);
        var iv = CryptoJS.lib.WordArray.create(raw.words.slice(0, 4), 16);
        var ct = CryptoJS.lib.WordArray.create(raw.words.slice(4), raw.sigBytes - 16);
        var key = CryptoJS.enc.Hex.parse(keyHex);
        var d = CryptoJS.AES.decrypt({ ciphertext: ct }, key, { iv: iv, mode: CryptoJS.mode.CBC });
        return d.toString(CryptoJS.enc.Utf8);
    } catch(e) { return null; }
}

function unpack(code) {
    try {
        var m = code.match(/eval\(function\(p,a,c,k,e,[rd]\)\{.*?\}\s*\('([\s\S]*?)',\s*(\d+),\s*(\d+),\s*'([\s\S]*?)'\.split\('\|'\)/);
        if (!m) return code;
        var p = m[1], a = parseInt(m[2]), c = parseInt(m[3]), kData = m[4].split("|");
        return p.replace(/\b\w+\b/g, function (e) { var idx = parseInt(e, 36), word = kData[idx] || kData[parseInt(e, a)]; return word || e; });
    } catch(e) { return code; }
}

function extractOrigin(url) {
    var m = url.match(/^(https?:\/\/[^\/]+)/);
    return m ? m[1] : "";
}

function resolveVoe(url) {
    return new Promise(function (resolve) {
        fetchText(url).then(function (html) {
            if (!html) return resolve(null);
            if (html.indexOf("permanentToken") !== -1) {
                var rm = html.match(/window\.location\.href\s*=\s*'([^']+)'/i);
                if (rm) {
                    fetchText(rm[1]).then(function (h2) { if (h2) processVoe(h2, rm[1], resolve); else resolve(null); }).catch(function () { resolve(null); });
                    return;
                }
            }
            processVoe(html, url, resolve);
        }).catch(function () { resolve(null); });
    });
}
function processVoe(html, url, resolve) {
    var jm = html.match(/<script type="application\/json">([\s\S]*?)<\/script>/);
    if (jm) {
        try {
            var parsed = JSON.parse(jm[1].trim());
            var encText = Array.isArray(parsed) ? parsed[0] : parsed;
            if (typeof encText !== "string") return resolve(null);
            var decoded = encText.replace(/[a-zA-Z]/g, function (c) { var cd = c.charCodeAt(0), l = cd <= 90 ? 90 : 122, s = cd + 13; return String.fromCharCode(l >= s ? s : s - 26); });
            var noise = ["@$", "^^", "~@", "%?", "*~", "!!", "#&"];
            for (var n = 0; n < noise.length; n++) decoded = decoded.split(noise[n]).join("");
            function b64d(s) { var cs = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", o = "", bs, b, idx = 0; s = String(s).replace(/=+$/, ""); for (var bc = 0; b = s.charAt(idx++); ~b && (bs = bc % 4 ? bs * 64 + b : b, bc++ % 4) ? o += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) b = cs.indexOf(b); return o; }
            var b1 = b64d(decoded); if (!b1) return resolve(null);
            var shifted = ""; for (var j = 0; j < b1.length; j++) shifted += String.fromCharCode(b1.charCodeAt(j) - 3);
            var b2 = b64d(shifted.split("").reverse().join("")); if (!b2) return resolve(null);
            var data = JSON.parse(b2);
            if (data && data.source) return resolve({ url: data.source, quality: "1080p", headers: { "User-Agent": UA, "Referer": url } });
        } catch(e) {}
    }
    var m3 = html.match(/["'](https?:\/\/[^"']+?\.m3u8[^"']*?)["']/i);
    if (m3) return resolve({ url: m3[1], quality: "Auto", headers: { "User-Agent": UA, "Referer": url } });
    resolve(null);
}

var SW_DOMAINS = ["vibuxer.com", "awish.pro", "dwish.pro", "streamwish.to", "embedwish.com", "strish.com", "wishembed.pro"];
function resolveStreamwish(url) {
    return new Promise(function (resolve) {
        var success = false, html = "", finalOrigin = "";
        if (url.indexOf("hglink.to") === -1) {
            fetchText(url).then(function (h) { if (h) { html = h; finalOrigin = extractOrigin(url); if (html.indexOf(".m3u8") !== -1 || html.indexOf("eval(function") !== -1) success = true; } tryMirrors(); }).catch(function () { tryMirrors(); });
        } else { tryMirrors(); }
        function tryMirrors() { if (success) return process(); var idx = 0; (function next() { if (idx >= SW_DOMAINS.length) return process(); fetchText(url.replace(/[^/]+\.(?:com|to|pro|net|org)/, SW_DOMAINS[idx])).then(function (h) { if (h && (h.indexOf(".m3u8") !== -1 || h.indexOf("eval(function") !== -1)) { html = h; finalOrigin = "https://" + SW_DOMAINS[idx]; success = true; } idx++; next(); }).catch(function () { idx++; next(); }); })(); }
        function process() {
            if (!html) return resolve(null);
            var dm = html.match(/https?:\/\/[^"'\s\\]+\.m3u8[^"'\s\\]*/i);
            if (dm) return resolve({ url: dm[0], quality: "Auto", headers: { "User-Agent": UA, "Referer": finalOrigin + "/" } });
            var ev = html.match(/eval\(function\(p,a,c,k,e,[rd]\)[\s\S]*?\.split\('\|'\)[^\)]*\)\)/);
            var cs = html;
            if (ev) try { cs += "\n" + unpack(ev[0]); } catch(e) {}
            var fm = cs.match(/(?:file|source|src|hls)\s*[:=]\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
            if (fm) { var u = fm[1]; if (u.indexOf("/") === 0) u = finalOrigin + u; return resolve({ url: u, quality: "Auto", headers: { "User-Agent": UA, "Referer": finalOrigin + "/" } }); }
            var m3 = cs.match(/https?:\/\/[^"'\s\\]+\.m3u8[^"'\s\\]*/i);
            if (m3) return resolve({ url: m3[0], quality: "Auto", headers: { "User-Agent": UA, "Referer": finalOrigin + "/" } });
            resolve(null);
        }
    });
}

function resolveVidhide(url) {
    return new Promise(function (resolve) {
        fetchText(url).then(function (html) {
            if (!html) return resolve(null);
            if (html.indexOf("window.location.href") !== -1 && html.length < 1000) {
                var rm = html.match(/window\.location\.href\s*=\s*['"]([^'"]+)['"]/i);
                if (rm) { fetchText(rm[1]).then(function (h2) { if (h2) processVh(h2, rm[1], resolve); else resolve(null); }).catch(function () { resolve(null); }); return; }
            }
            processVh(html, url, resolve);
        }).catch(function () { resolve(null); });
    });
}
function processVh(html, url, resolve) {
    var origin = extractOrigin(url);
    var evs = html.match(/eval\(function\(p,a,c,k,e,[rd]\)[\s\S]*?\.split\('\|'\)[^\)]*\)\)/g);
    var cs = html;
    if (evs) { for (var i = 0; i < evs.length; i++) { try { cs += "\n" + unpack(evs[i]); } catch(e) {} } }
    var pats = [/"hls2"\s*[:=]\s*"([^"]+)"/i, /"hls4"\s*[:=]\s*"([^"]+)"/i, /"file"\s*[:=]\s*"([^"]+\.m3u8[^"]*)"/i, /"src"\s*[:=]\s*"([^"]+\.m3u8[^"]*)"/i];
    var link = null;
    for (var p = 0; p < pats.length; p++) { var m = cs.match(pats[p]); if (m && m[1]) { link = m[1]; break; } }
    if (!link) { var m3s = cs.match(/https?:\/\/[^"'\s\\]+\.m3u8[^"'\s\\]*/g); if (m3s) link = m3s[0]; }
    if (!link) return resolve(null);
    resolve({ url: link.indexOf("http") === 0 ? link : origin + link, quality: "1080p", headers: { "User-Agent": UA, "Referer": origin + "/" } });
}

function resolveFilemoon(url) {
    return new Promise(function (resolve) {
        fetchText(url).then(function (html) {
            if (!html) return resolve(null);
            var dm = html.match(/(?:file|source|src|hls|url)\s*[:=]\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
            if (dm) return resolve({ url: dm[1], quality: "Auto", headers: { "User-Agent": UA, "Referer": url } });
            var evs = html.match(/eval\(function\(p,a,c,k,e,[rd]\)[\s\S]*?\.split\('\|'\)[^\)]*\)\)/g);
            var cs = html;
            if (evs) { for (var i = 0; i < evs.length; i++) { try { cs += "\n" + unpack(evs[i]); } catch(e) {} } }
            var fm = cs.match(/(?:file|source|src|hls|url)\s*[:=]\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
            if (fm) return resolve({ url: fm[1], quality: "Auto", headers: { "User-Agent": UA, "Referer": url } });
            resolve(null);
        }).catch(function () { resolve(null); });
    });
}

var FILEMOON_DOMAINS = ["filemoon.sx", "filemoon.to", "filemoon.eu", "bysedikamoum.com", "smybutn.com", "gstorege.com"];
function isFilemoon(url) {
    var u = url.toLowerCase();
    if (u.indexOf("filemoon") !== -1) return true;
    for (var i = 0; i < FILEMOON_DOMAINS.length; i++) { if (u.indexOf(FILEMOON_DOMAINS[i]) !== -1) return true; }
    return false;
}
function resolveServer(url) {
    var u = url.toLowerCase();
    if (u.indexOf("voe") !== -1) return resolveVoe(url);
    if (u.indexOf("streamwish") !== -1 || u.indexOf("hlswish") !== -1 || u.indexOf("hglink") !== -1 || u.indexOf("flaswish") !== -1) return resolveStreamwish(url);
    if (isFilemoon(u)) return resolveFilemoon(url);
    if (u.indexOf("vidhide") !== -1 || u.indexOf("minochinos") !== -1 || u.indexOf("do7go") !== -1) return resolveVidhide(url);
    return new Promise(function (r) { r(null); });
}

function getImdbId(tmdbId, mediaType) {
    return new Promise(function (resolve) {
        var type = mediaType === "movie" ? "movie" : "tv";
        fetch("https://api.themoviedb.org/3/" + type + "/" + tmdbId + "/external_ids?api_key=" + TMDB_API_KEY, { headers: { "User-Agent": UA } }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { resolve(d && d.imdb_id ? d.imdb_id : null); }).catch(function () { resolve(null); });
    });
}

var SERVER_LABELS = { "voe": "VOE", "streamwish": "StreamWish", "filemoon": "Filemoon", "vidhide": "VidHide", "rapidvideo": "RapidVideo" };

function getStreams(tmdbId, mediaType, season, episode) {
    return new Promise(function (resolve) {
        try {
            var cleanId = String(tmdbId).replace(/^tmdb:|^series:|^movie:/, "").split(":")[0].split("/")[0];
            if (!cleanId || cleanId === "null" || cleanId === "undefined") return resolve([]);

            getImdbId(cleanId, mediaType).then(function (imdbId) {
                if (!imdbId) return resolve([]);

                var vidUrl;
                if (mediaType === "movie") {
                    vidUrl = BASE + "/vidurl/" + imdbId + "/";
                } else {
                    var s = season || 1;
                    var e = episode || 1;
                    vidUrl = BASE + "/vidurl/" + imdbId + "-" + s + "x" + (e < 10 ? "0" + e : e) + "/";
                }

                fetchText(vidUrl).then(function (html) {
                    if (!html) return resolve([]);

                    var pow = extractPowConstants(html);
                    if (!pow.challenge || !pow.salt) return resolve([]);

                    var aesKey = solvePow(pow.challenge, pow.difficulty, pow.salt);

                    var dataLink = extractDataLink(html);
                    if (dataLink.length === 0) return resolve([]);

                    var fileEntry = dataLink[0];
                    var embeds = fileEntry.sortedEmbeds || [];
                    var decryptedEmbeds = [];

                    for (var j = 0; j < embeds.length && decryptedEmbeds.length < 10; j++) {
                        var decrypted = aesDecrypt(embeds[j].link, aesKey);
                        if (decrypted && decrypted.indexOf("http") === 0) {
                            decryptedEmbeds.push({ name: embeds[j].servername, url: decrypted });
                        }
                    }

                    if (decryptedEmbeds.length === 0) return resolve([]);

                    var results = [], pending = decryptedEmbeds.length;
                    for (var idx = 0; idx < decryptedEmbeds.length; idx++) {
                        (function (embed) {
                            resolveServer(embed.url).then(function (resolved) {
                                if (resolved && resolved.url) {
                                    var label = SERVER_LABELS[embed.name] || embed.name.charAt(0).toUpperCase() + embed.name.slice(1);
                                    var stream = { name: label, url: resolved.url, quality: resolved.quality || "HD", language: "Latino" };
                                    if (resolved.headers) stream.headers = resolved.headers;
                                    if (typeof __yield_result === "function") __yield_result(JSON.stringify(stream));
                                    results.push(stream);
                                }
                                pending--;
                                if (pending === 0) resolve(results);
                            }).catch(function () { pending--; if (pending === 0) resolve(results); });
                        })(decryptedEmbeds[idx]);
                    }
                }).catch(function () { resolve([]); });
            }).catch(function () { resolve([]); });
        } catch (e) { resolve([]); }
    });
}

module.exports = { getStreams };
