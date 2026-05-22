/**
 * Test script for the Streamix provider
 * Usage: 
 *   node test-streamix.js movie 550          -> Fight Club
 *   node test-streamix.js tv 1399 1 1        -> Game of Thrones S01E01
 */
const { getStreams } = require('./src/streamix');

const [, , mediaTypeArg, tmdbIdArg, seasonArg, episodeArg] = process.argv;

const mediaType = mediaTypeArg || 'movie';
const tmdbId = tmdbIdArg || '550'; // 550 es Fight Club
const season = seasonArg || '1';
const episode = episodeArg || '1';

console.log('\n=== Streamix Provider Test ===');
console.log(`Type: ${mediaType} | TMDB: ${tmdbId} | S${season}E${episode}\n`);

getStreams(tmdbId, mediaType, season, episode)
  .then(streams => {
    if (!streams || streams.length === 0) {
      console.log('❌ No streams returned.');
      process.exit(1);
    }
    console.log(`\n✅ ${streams.length} stream(s) found:\n`);
    streams.forEach((s, i) => {
      console.log(`  [${i + 1}] ${s.name}`);
      console.log(`      URL: ${s.url.substring(0, 90)}...`);
      console.log();
    });
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
