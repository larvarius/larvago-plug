const express = require('express');
const VimeusProvider = require('./providers/vimeus');

const app = express();
const port = process.env.PORT || 3000;
const vimeusProvider = new VimeusProvider();

app.get('/manifest.json', (req, res) => {
    res.json({
        id: "org.larvago.vimeus",
        name: "LarvaGo Vimeus",
        description: "Addon Vimeus para Nuvio",
        version: "1.0.0",
        resources: ["stream"],
        types: ["movie", "series"],
        idPrefixes: ["tt", "tmdb"]
    });
});

app.get('/stream/:type/:id', async (req, res) => {
    const { type, id } = req.params;
    const season = parseInt(req.query.season) || 1;
    const episode = parseInt(req.query.episode) || 1;
    
    const streams = await vimeusProvider.getStreams(id, type, season, episode);
    res.json({ streams });
});

app.listen(port, () => {
    console.log(`Addon LarvaGo corriendo en puerto ${port}`);
});
