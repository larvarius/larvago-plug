const UnlimplayProvider = {
  name: 'Unlimplay',
  domain: 'unlimplay.com',
  priority: 100,
  
  test: function(url) {
    return /unlimplay\.com/.test(url) || /unlimplay\.net/.test(url);
  },
  
  resolve: async function(url) {
    try {
      console.log('Resolviendo Unlimplay:', url);
      
      // Aquí iría la lógica para extraer el video
      // Por ahora retornamos null
      return null;
    } catch (error) {
      console.error('Error en Unlimplay:', error);
      return null;
    }
  }
};

module.exports = UnlimplayProvider;
