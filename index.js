const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const VIMEUS_VIEW_KEY = '_4MLrzbLjnvybzwqOZa_Qa5L5Dm2jX4OmlklT7KENp0';

app.get('/manifest.json', (req, res) => {
    res.json({
        id: "org.larvago.vimeus",
        name: "LarvaGo Vimeus",
        version: "1.0.3",
        resources: ["stream"],
        types: ["movie", "series"],
        idPrefixes: ["tt", "tmdb"]
    });
});

app.get('/stream/:type/:id', async (req, res) => {
    const { type, id } = req.params;
    
    // Construir la URL de la API interna de Vimeus
    const apiUrl = `https://vimeus.com/api/stream?tmdb=${id}&view_key=${VIMEUS_VIEW_KEY}`;
    
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        // Extraer la URL directa del video
        const directUrl = data.stream?.url || data.url;
        
        res.json({
            streams: [{
                name: "Vimeus Directo",
                url: directUrl,  // Esto tiene que ser .mp4 o .m3u8
                behaviorHints: { 
                    notWebReady: false  // false = es un video directo
                }
            }]
        });
    } catch (error) {
        res.json({ streams: [] });
    }
});

app.listen(port, () => {
    console.log(`Addon corriendo en puerto ${port}`);
});