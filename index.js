const express = require('express');
const StreamixProvider = require('./providers/streamix');

const app = express();
const port = process.env.PORT || 3000;
const streamixProvider = new StreamixProvider();

app.get('/manifest.json', (req, res) => {
    res.json({
        id: "org.larvago.streamix",
        name: "LarvaGo Streamix",
        description: "Addon que usa Streamix para Nuvio",
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
    
    const streams = await streamixProvider.getStreams(id, type, season, episode);
    res.json({ streams });
});

app.listen(port, () => {
    console.log(`Addon LarvaGo Streamix corriendo en puerto ${port}`);
});
