class StreamixProvider {
  constructor() {
    this.name = 'Streamix';
    this.apiUrl = 'https://stream-vault-two-phi.vercel.app/api/v1/embed-serve';
  }

  async getStreams(id, type, season, episode) {
    let url;
    if (type === 'movie') {
      url = `${this.apiUrl}?type=movie&id=${id}`;
    } else {
      url = `${this.apiUrl}?type=tv&id=${id}&season=${season}&episode=${episode}`;
    }
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success && data.data.sources) {
        // Convertir las fuentes de Streamix al formato que Nuvio espera
        return data.data.sources.map(source => ({
          name: `Streamix (${source.playbackType || 'auto'})`,
          url: source.url,
          behaviorHints: {
            notWebReady: false  // Es un video directo, no una página web
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching from Streamix:', error);
    }
    
    return [];
  }
}

module.exports = StreamixProvider;
