const STREAMIX_API = 'https://stream-vault-two-phi.vercel.app/api/v1/embed-serve';

/**
 * Obtiene las fuentes de streaming desde la API de Streamix.
 * @param {string} tmdbId - El ID de la película o serie en TMDB.
 * @param {string} mediaType - El tipo de contenido: "movie" o "tv".
 * @param {number} season - El número de temporada (para series).
 * @param {number} episode - El número de episodio (para series).
 * @returns {Promise<Array>} Una promesa que resuelve en un array de fuentes de video.
 */
async function getStreams(tmdbId, mediaType, season, episode) {
    let apiUrl;
    if (mediaType === "movie") {
        apiUrl = `${STREAMIX_API}?type=movie&id=${tmdbId}`;
    } else {
        apiUrl = `${STREAMIX_API}?type=tv&id=${tmdbId}&season=${season}&episode=${episode}`;
    }

    try {
        console.log(`[Streamix] Fetching: ${apiUrl}`);
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.success && data.data && data.data.sources) {
            console.log(`[Streamix] Found ${data.data.sources.length} sources.`);
            // Mapeamos las fuentes al formato que Nuvio entiende.
            return data.data.sources.map(s => ({
                name: `Streamix (${s.playbackType || 'auto'})`,
                url: s.url,
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                }
            }));
        } else {
            console.log(`[Streamix] No sources found.`);
            return [];
        }
    } catch (error) {
        console.error(`[Streamix] Error: ${error.message}`);
        return [];
    }
}

module.exports = { getStreams };
