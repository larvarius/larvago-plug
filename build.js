const fs = require('fs');
const path = require('path');

const srcDir = 'src';
const providersDir = 'providers';

if (!fs.existsSync(providersDir)) {
  fs.mkdirSync(providersDir);
}

function processFile(filePath, relativePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Eliminar comentarios de línea y bloque
  content = content.replace(/\/\/.*$/gm, '');
  content = content.replace(/\/\*[\s\S]*?\*\//g, '');

  // Envolver el contenido para que sea un módulo
  const moduleName = relativePath.replace(/\.js$/, '').replace(/\//g, '_');
  const wrapper = `
    (function() {
      const module = { exports: {} };
      const exports = module.exports;
      
      ${content}
      
      return module.exports;
    })();
  `;

  const outputPath = path.join(providersDir, `${moduleName}.js`);
  fs.writeFileSync(outputPath, wrapper);
  console.log(`Generado: ${outputPath}`);
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.js')) {
      const relativePath = path.relative(srcDir, filePath);
      if (!relativePath.includes('index.js') || !fs.existsSync(path.join(filePath, 'index.js'))) {
         processFile(filePath, relativePath);
      }
    }
  });
}

if (fs.existsSync(srcDir)) {
  walkDir(srcDir);
  console.log('Build completado con éxito.');
} else {
  console.error('La carpeta src no existe.');
}
