const axios = require('axios');
const cheerio = require('cheerio');

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const BASE_URL = "https://unlimplay.com";

// Función para desencriptar código obfuscado (común en estos sitios)
function unpackEval(packed, radix, symtab) {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const unbase = (str) => {
    let result = 0;
    for (let i = 0; i < str.length; i++) {
      const pos = chars.indexOf(str[i]);
      if (pos === -1) return NaN;
      result = result * radix + pos;
    }
    return result;
  };
  return packed.replace(/\b([0-9a-zA-Z]+)\b/g, (match) => {
    const idx = unbase(match);
    if (isNaN(idx) || idx >= symtab.length) return match;
    return symtab[idx] && symtab[idx] !== "" ? symtab[idx] : match;
  });
}

async function getStreams(tmdbId, mediaType, season, episode) {
  console.log(`[Unlimplay] Pidiendo: ${mediaType} ID: ${tmdbId} S${season || 0}E${episode || 0}`);
  
  let embedUrl;
  if (mediaType === "movie") {
    embedUrl = `${BASE_URL}/play/embed/movie/${tmdbId}`;
  } else {
    if (!season || !episode) return [];
    embedUrl = `${BASE_URL}/play/embed/tv/${tmdbId}/${season}/${episode}`;
  }

  try {
    const { data: html } = await axios.get(embedUrl, {
      headers: { "User-Agent": UA, "Referer": BASE_URL + "/" }
    });

    const streams = [];

    // 1. Buscar m3u8 directo
    const m3u8Direct = html.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/i);
    if (m3u8Direct) {
      streams.push({ name: "Unlimplay", title: "Unlimplay [Direct]", url: m3u8Direct, quality: "1080p", headers: { "User-Agent": UA, "Referer": BASE_URL + "/" } });
      return streams;
    }

    // 2. Buscar en código obfuscado
    const evalMatch = html.match(/eval\(function\(p,a,c,k,e,[rd]\)[\s\S]*?\.split\('\|'\)[^\)]*\)\)/);
    if (evalMatch) {
      const unpacked = unpackEval(evalMatch, 36, evalMatch.split("|"));
      const m3u8Packed = unpacked.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/i);
      if (m3u8Packed) {
        streams.push({ name: "Unlimplay", title: "Unlimplay [Unpacked]", url: m3u8Packed, quality: "1080p", headers: { "User-Agent": UA, "Referer": BASE_URL + "/" } });
        return streams;
      }
      const fileMatch = unpacked.match(/["']file["']\s*:\s*["']([^"']+\.m3u8[^"']*)["']/i);
      if (fileMatch) {
        streams.push({ name: "Unlimplay", title: "Unlimplay [File]", url: fileMatch, quality: "1080p", headers: { "User-Agent": UA, "Referer": BASE_URL + "/" } });
        return streams;
      }
    }

    console.log("[Unlimplay] No se encontró stream.");
    return streams;
  } catch (err) {
    console.error(`[Unlimplay] Error: ${err.message}`);
    return [];
  }
}

module.exports = { getStreams };    if (!season || !episode) {
      console.error("[Unlimplay] Falta temporada o episodio");
      return [];
    }
    embedUrl = `${BASE_URL}/play/embed/tv/${tmdbId}/${season}/${episode}`;
  }

  try {
    // Usamos axios para obtener el HTML, simulando un navegador
    const { data: html } = await axios.get(embedUrl, {
      headers: {
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Referer": `${BASE_URL}/`
      }
    });

    const $ = cheerio.load(html);
    const streams = [];

    // --- Estrategia 1: Buscar m3u8 directo en el HTML ---
    const m3u8Direct = html.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/i);
    if (m3u8Direct) {
      streams.push({
        name: "Unlimplay",
        title: "Unlimplay [Directo]",
        url: m3u8Direct,
        quality: "1080p",
        headers: { "User-Agent": UA, "Referer": `${BASE_URL}/` }
      });
      console.log(`[Unlimplay] ✅ URL directa encontrada`);
      return streams;
    }

    // --- Estrategia 2: Buscar en código obfuscado (eval/packed) ---
    const evalMatch = html.match(/eval\(function\(p,a,c,k,e,[rd]\)[\s\S]*?\.split\('\|'\)[^\)]*\)\)/);
    if (evalMatch) {
      const unpacked = unpackEval(evalMatch, 36, evalMatch.split("|"));
      
      // Buscar m3u8 en el código desencriptado
      const m3u8Packed = unpacked.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/i);
      if (m3u8Packed) {
        streams.push({
          name: "Unlimplay",
          title: "Unlimplay [Desencriptado]",
          url: m3u8Packed,
          quality: "1080p",
          headers: { "User-Agent": UA, "Referer": `${BASE_URL}/` }
        });
        console.log(`[Unlimplay] ✅ URL desencriptada encontrada`);
        return streams;
      }

      // Buscar variable 'file' o 'source'
      const fileMatch = unpacked.match(/["']file["']\s*:\s*["']([^"']+\.m3u8[^"']*)["']/i) || 
                        unpacked.match(/["']source["']\s*:\s*["']([^"']+\.m3u8[^"']*)["']/i);
      if (fileMatch) {
        streams.push({
          name: "Unlimplay",
          title: "Unlimplay [Source]",
          url: fileMatch,
          quality: "1080p",
          headers: { "User-Agent": UA, "Referer": `${BASE_URL}/` }
        });
        console.log(`[Unlimplay] ✅ Variable file encontrada`);
        return streams;
      }
    }

    // --- Estrategia 3: Buscar en JSON incrustado ---
    const jsonMatch = html.match(/<script[^>]*type=["']text\/json["'] [^>]*>([\s\S]*?)<\/script>/i);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch);
        const url = data.url || data.file || data.source || data.link;
        if (url && url.includes('.m3u8')) {
          streams.push({
            name: "Unlimplay",
            title: "Unlimplay [JSON]",
            url: url,
            quality: "1080p",
            headers: { "User-Agent": UA, "Referer": `${BASE_URL}/` }
          });
          console.log(`[Unlimplay] ✅ URL en JSON encontrada`);
          return streams;
        }
      } catch (e) {
        // No es JSON válido
      }
    }

    console.log("[Unlimplay] ❌ No se encontró URL de video.");
    return streams;

  } catch (err) {
    console.error(`[Unlimplay] Error: ${err.message}`);
    return [];
  }
}

// Exportamos la función principal
module.exports = { getStreams };
