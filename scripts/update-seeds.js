'use strict';
// Updates the content field in database/seed.js and database/seed-extras.js
// by fetching the current (storytelling-rewrite) content from the local DB.
// Run: node scripts/update-seeds.js

const pool = require('../config/db');
const fs   = require('fs');
const path = require('path');

// Advance past a double-quoted JS string starting at pos (after the opening ").
// Handles \" escape sequences. Returns index of the closing ".
function findDQEnd(text, pos) {
  while (pos < text.length) {
    if (text[pos] === '\\') { pos += 2; continue; }
    if (text[pos] === '"')  return pos;
    pos++;
  }
  return -1;
}

// Document order of posts in seed.js (IDs 1-18)
const SEED_JS_SLUGS = [
  'gua-kelam-perliss-underground-river-cave',
  'wang-kelian-sunday-market-the-border-market-hidden-in-the-hills',
  'tasik-melati-perliss-secret-lotus-lake',
  'lembah-bujang-malaysias-oldest-civilisation-hidden-in-kedah',
  'tanjung-rhu-beach-langkawis-best-kept-secret-shore',
  'tree-top-walk-sungai-sedim-kedahs-adventure-in-the-canopy',
  'ipoh-world-at-han-chin-pet-soo-the-secret-museum-of-tin-town',
  'gua-tempurung-peraks-subterranean-kingdom',
  'tasik-cermin-the-mirror-lake-hidden-in-limestone',
  'kuala-gandah-elephant-sanctuary-where-you-help-not-watch',
  'mossy-forest-eco-park-cameron-highlands-mystical-cloud-forest',
  'merapoh-taman-negaras-secret-back-door',
  'sri-menanti-royal-museum-a-palace-built-without-a-single-nail',
  'pedas-hot-springs-negeri-sembilans-sulphur-soak-secret',
  'jeram-toi-waterfall-negeri-sembilans-seven-tiered-secret',
  'endau-rompin-national-park-johors-ancient-wilderness',
  'muar-the-unesco-creative-city-most-malaysians-havent-visited',
  'kukup-johors-village-built-entirely-on-the-sea',
];

// Document order of posts in seed-extras.js (IDs 19-36)
const EXTRAS_SLUGS = [
  'bukit-chabang-mari-perliss-little-new-zealand-sunset-hill',
  'tasik-timah-tasoh-perliss-forgotten-reservoir-lake',
  'kampung-wai-the-kampung-where-time-forgot-to-move',
  'gunung-jerai-kedahs-cold-mountain-almost-nobody-visits',
  'pulau-songsong-kedahs-pristine-island-without-the-crowds',
  'lubuk-pedati-kedahs-free-natural-swimming-pool',
  'tt5-tin-dredge-the-last-surviving-mining-giant-in-tanjung-tualang',
  'the-leaning-tower-of-teluk-intan-malaysias-wonky-wonder',
  'gaharu-tea-valley-peraks-aromatic-wood-forest',
  'tasik-biru-bukit-ibam-pahangs-mysterious-blue-lake',
  'bentong-pahangs-pit-stop-town-worth-pulling-over-for',
  'lojing-highlands-pahangs-cool-escape-without-the-cameron-crowds',
  'centipede-temple-serembans-hilltop-shrine-264-steps-up',
  'masjid-sri-sendayan-negeri-sembilans-taj-mahal-of-malaysia',
  'gunung-datuk-the-mountain-where-hang-tuah-left-his-footprint',
  'pulau-rawa-johors-pristine-island-that-refused-to-develop',
  'tasik-biru-kangkar-pulai-jbs-secret-blue-lake',
  'jalan-tan-hiok-nee-jbs-hipster-heritage-street',
];

async function run() {
  const [rows] = await pool.query(
    "SELECT slug, content FROM posts WHERE content LIKE '%composite traveller%' ORDER BY id"
  );
  const bySlug = {};
  rows.forEach(r => { bySlug[r.slug] = r.content; });
  console.log(`Fetched ${rows.length} posts from DB`);

  // ── seed.js  (content fields are template literals: content: `...`) ──
  const seedJsPath = path.join(__dirname, '../database/seed.js');
  let text = fs.readFileSync(seedJsPath, 'utf8');
  let cursor = 0;
  let ok = 0;

  for (const slug of SEED_JS_SLUGS) {
    const newContent = bySlug[slug];
    if (!newContent) { console.warn(`[SKIP] no DB content for ${slug}`); continue; }

    const MARKER = 'content: `';
    const mIdx = text.indexOf(MARKER, cursor);
    if (mIdx === -1) { console.error(`[FAIL] marker not found for ${slug}`); break; }

    const cStart = mIdx + MARKER.length;           // position after opening backtick
    const cEnd   = text.indexOf('`', cStart);      // closing backtick (content has none)
    if (cEnd === -1) { console.error(`[FAIL] closing backtick not found for ${slug}`); break; }

    text    = text.slice(0, cStart) + newContent + text.slice(cEnd);
    cursor  = cStart + newContent.length + 1;      // advance past closing backtick
    ok++;
  }

  fs.writeFileSync(seedJsPath, text, 'utf8');
  console.log(`[OK] seed.js — ${ok}/${SEED_JS_SLUGS.length} content blocks updated`);

  // ── seed-extras.js  (content fields are DQ strings: content:"...") ──
  const extrasPath = path.join(__dirname, '../database/seed-extras.js');
  let text2 = fs.readFileSync(extrasPath, 'utf8');
  let cursor2 = 0;
  let ok2 = 0;

  for (const slug of EXTRAS_SLUGS) {
    const newContent = bySlug[slug];
    if (!newContent) { console.warn(`[SKIP] no DB content for ${slug}`); continue; }

    const MARKER2 = 'content:"';
    const mIdx2 = text2.indexOf(MARKER2, cursor2);
    if (mIdx2 === -1) { console.error(`[FAIL] marker not found for ${slug}`); break; }

    const cStart2 = mIdx2 + MARKER2.length;        // position after opening "
    const cEnd2   = findDQEnd(text2, cStart2);     // closing " (handles \" escapes)
    if (cEnd2 === -1) { console.error(`[FAIL] closing DQ not found for ${slug}`); break; }

    // Switch to template literal — new content has apostrophes but no backticks
    text2   = text2.slice(0, mIdx2) + 'content:`' + newContent + '`' + text2.slice(cEnd2 + 1);
    cursor2 = mIdx2 + 'content:`'.length + newContent.length + 1;
    ok2++;
  }

  fs.writeFileSync(extrasPath, text2, 'utf8');
  console.log(`[OK] seed-extras.js — ${ok2}/${EXTRAS_SLUGS.length} content blocks updated`);

  await pool.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
