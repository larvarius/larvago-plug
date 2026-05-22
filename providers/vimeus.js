class VimeusProvider {
  constructor() {
    this.name = 'Vimeus';
    this.viewKey = '_4MLrzbLjnvybzwqOZa_Qa5L5Dm2jX4OmlklT7KENp0';
  }

  async getStreams(id, type, season, episode) {
    let url;
    if (type === 'movie') {
      url = `https://vimeus.com/e/movie?tmdb=${id}&view_key=${this.viewKey}&title=LarvaGo&theme=minimal`;
    } else {
      url = `https://vimeus.com/e/serie?tmdb=${id}&view_key=${this.viewKey}&se=${season}&ep=${episode}&title=LarvaGo&theme=minimal`;
    }
    
    return [{
      name: 'Vimeus',
      url: url,
      behaviorHints: { notWebReady: true }
    }];
  }
}

module.exports = VimeusProvider;
