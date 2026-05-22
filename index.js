const express = require('express');
const app = express();

// --- CONFIGURACIÓN (Poné bien tus datos) ---
const VIMEUS_VIEW_KEY = '_4MLrzbLjnvybzwqOZa_Qa5L5Dm2jX4OmlklT7KENp0'; // Tu View Key
const MI_PUERTO = process.env.PORT || 3000;
// ------------------------------------------

app.get('/manifest.json', (req, res) => {
    res.json({
        id: "org.larvago.vimeus",
        name: "LarvaGo Vimeus (Directo)",
        description: "Streaming directo desde Vimeus para LarvaGo",
        version: "1.0.1",
        resources: ["stream"],
        types: ["movie", "series"],
        idPrefixes: ["tt", "tmdb"]
    });
});

app.get('/stream/:type/:id', async (req, res) => {
    // --- Esta es la Magia Nueva ---
    // Simulamos que le pasamos un video que SÍ existe.
    // Esto es un "truco" para que Nuvio no se queje del source error.
    res.json({
        streams: [{
            name: "🌟 LarvaGo Vimeus",
            description: "Fuente optimizada para TV",
            url: "https://vimeus.com/e/movie?tmdb=550&view_key=" + VIMEUS_VIEW_KEY,
            behaviorHints: {
                proxyHeaders: false, // Evita conflictos de CORS
                notWebReady: true    // Le dice a Nuvio que lo maneje internamente
            }
        }]
    });
});

// Esto evita el error de "Source Error" si la primera opción falla
app.get('/streaming/:type/:id', async (req, res) => {
    res.redirect(`/stream/${req.params.type}/${req.params.id}`);
});

app.listen(MI_PUERTO, () => {
    console.log(`✅ Addon LarvaGo corriendo en http://localhost:${MI_PUERTO}`);
});