// El addon para Nuvio/Stremio que usa Vimeus
// Creado especialmente para LarvaGo

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Tu View Key de Vimeus (ya la puse por vos)
const VIMEUS_VIEW_KEY = '_4MLrzbLjnvybzwqOZa_Qa5L5Dm2jX4OmlklT7KENp0';

// Catálogo de ejemplo (esto se puede conectar a TMDb después)
const catalog = {
    "tt1375666": { // ID de ejemplo
        id: "tt1375666",
        name: "Inception",
        videos: [{ id: "tt1375666", title: "Inception" }]
    }
};

// Endpoint que Nuvio usa para pedir info del addon
app.get('/manifest.json', (req, res) => {
    res.json({
        id: "org.larvago.vimeus",
        name: "LarvaGo Vimeus",
        description: "Reproductor Vimeus para LarvaGo",
        version: "1.0.0",
        resources: ["stream"],
        types: ["movie", "series"],
        idPrefixes: ["tt"]
    });
});

// Endpoint que Nuvio usa para pedir el stream (el video)
app.get('/stream/:type/:id', (req, res) => {
    const { type, id } = req.params;
    
    // Construís la URL de Vimeus
    let vimeusUrl = '';
    if (type === 'movie') {
        vimeusUrl = `https://vimeus.com/e/movie?tmdb=${id}&view_key=${VIMEUS_VIEW_KEY}&title=LarvaGo&theme=minimal`;
    } else if (type === 'series') {
        // Para series, necesitamos temporada (season) y episodio (episode)
        const season = req.query.season || 1;
        const episode = req.query.episode || 1;
        vimeusUrl = `https://vimeus.com/e/serie?tmdb=${id}&view_key=${VIMEUS_VIEW_KEY}&se=${season}&ep=${episode}&title=LarvaGo&theme=minimal`;
    }

    // Le devolvés la URL a Nuvio
    res.json({
        streams: [{
            name: "LarvaGo Vimeus",
            title: `Reproducir con Vimeus`,
            url: vimeusUrl,
            behaviorHints: { proxyHeaders: false, notWebReady: true }
        }]
    });
});

// Ponés el addon a escuchar
app.listen(port, () => {
    console.log(`Addon LarvaGo corriendo en http://localhost:${port}`);
});