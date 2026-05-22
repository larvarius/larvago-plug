#!/usr/bin/env node
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const outDir = path.join(__dirname, 'providers');

// Módulos externos que Nuvio provee (no los empaquetamos)
const EXTERNAL_MODULES = ['cheerio', 'axios', 'crypto-js'];

async function buildProvider(providerName) {
  const entryPoint = path.join(srcDir, providerName, 'index.js');
  const outFile = path.join(outDir, `${providerName}.js`);

  if (!fs.existsSync(entryPoint)) {
    console.warn(`⚠️  Saltando ${providerName}: no se encontró src/${providerName}/index.js`);
    return false;
  }

  try {
    await esbuild.build({
      entryPoints: [entryPoint],
      bundle: true,
      outfile: outFile,
      format: 'cjs',
      platform: 'node',
      target: 'es2020',
      minify: false,
      external: EXTERNAL_MODULES,
      banner: { js: `/** ${providerName} - Built ${new Date().toISOString()} */` }
    });
    console.log(`✅ ${providerName}.js generado`);
    return true;
  } catch (err) {
    console.error(`❌ Error en ${providerName}:`, err.message);
    return false;
  }
}

async function main() {
  if (!fs.existsSync(srcDir)) {
    console.error('❌ Error: No existe la carpeta "src". Crea src/<provider>/index.js');
    process.exit(1);
  }

  const providers = fs.readdirSync(srcDir)
    .filter(d => fs.statSync(path.join(srcDir, d)).isDirectory());

  if (providers.length === 0) {
    console.log('No hay proveedores en src/. Crea una carpeta src/miproveedor/');
    return;
  }

  console.log(`🚀 Construyendo ${providers.length} proveedor(es)...`);
  
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const p of providers) await buildProvider(p);
}

main();
