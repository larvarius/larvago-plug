const axios = require('axios');
const UA = "Mozilla/5.0";
const BASE_URL = "https://unlimplay.com";

function unpackEval(p, a, c, k, e, d) {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const unbase = (str) => {
    let r = 0;
    for (let i = 0; i < str.length; i++) {
      const pos = chars.indexOf(str[i]);
      if (pos === -1) return NaN;
      r = r * a + pos;
    }
    return r;
  };
  return p.replace(/\b([0-9a-zA-Z]+)\b/g, (m) => {
    const i = unbase(m);
    return k[i] ? k[i] : m;
  });
}

async function getStreams(tmdbId, type, season, episode) {
  let url = type === "movie" 
    ? `${BASE_URL}/play/embed/movie/${tmdbId}` 
    : `${BASE_URL}/play/embed/tv/${tmdbId}/${season}/${episode}`;

  try {
    const html = (await axios.get(url, { headers: { "User-Agent": UA } })).data;
    const match = html.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/i);
    if (match) return [{ name: "Unlimplay", title: "Unlimplay", url: match, quality: "1080p", headers: { "User-Agent": UA } }];
    return [];
  } catch (e) { return []; }
}

module.exports = { getStreams };
 }
