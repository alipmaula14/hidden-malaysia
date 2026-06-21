
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

function slugify(text) {
  return text.toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ---- 18 hidden-gem posts (content exactly as provided) ----
const gems = [
  // PERLIS
  { state:'perlis', title:"Bukit Chabang Mari: Perlis's \"Little New Zealand\" Sunset Hill",
    tags:"sunset, viewpoint, hill, perlis", source_url:"https://www.businesstoday.com.my/2026/04/24/perlis-uncovered-places-and-experiences-worth-slowing-down-for/",
    excerpt:"Nicknamed Perlis's \"Little New Zealand\" by Malaysian netizens — a quiet hilltop sunset spot with rolling open greens and zero crowds.",
    content:"Bukit Chabang Mari has slowly built a cult following among Malaysian travel bloggers who call it \"Little New Zealand in Perlis.\" The hill's open, almost pastoral landscape feels nothing like the rest of the state — rolling grassland, scattered trees, and a viewpoint that catches sunset directly across the western horizon. It works perfectly as a quick stop for those passing through Perlis or as a low-key outing for anyone looking for an open green space without crowds or complexity. No entry fee, no booking, no guides — just turn up before sunset. Locals park along the roadside and walk up the gentle slope. Bring a mat and snacks; there are no facilities at the top. Best on weekday evenings when it's near-empty." },
  { state:'perlis', title:"Tasik Timah Tasoh: Perlis's Forgotten Reservoir Lake",
    tags:"lake, sunset, fishing, perlis", source_url:"https://nz.trip.com/moments/detail/perlis-23094-128332766",
    excerpt:"A man-made reservoir lake in Perlis where locals fish at dawn and watch sunsets — described by netizens as \"a serene escape almost no one visits.\"",
    content:"Tasik Timah Tasoh is one of those places that exists in plain sight but barely registers on any travel guide. The lake is actually a man-made reservoir created to supply water to northern Perlis and Thailand, but the surroundings — limestone hills on one side, palm groves on the other — make it feel like a natural lake. Locals come here to fish from rented sampan boats, and weekend evenings see families picnicking on the small lakeside parks. Photographers know it for the way the sunset turns the limestone backdrop pink. There are basic chalets nearby for overnight stays, but most visitors come for a few hours. Bring insect repellent if you stay past dusk." },
  { state:'perlis', title:"Kampung Wai: The Kampung Where Time Forgot to Move",
    tags:"kampung, nature, traditional, perlis", source_url:"https://nz.trip.com/moments/detail/perlis-23094-128332766",
    excerpt:"A traditional Malay village in Perlis with original wooden houses, surrounded by paddy fields and limestone hills — repeatedly mentioned by netizens as a true off-grid escape.",
    content:"Kampung Wai sits tucked between limestone hills and endless paddy fields, and walking through it feels like stepping into a 1960s photograph. Many of the wooden houses are over 50 years old, with original carved panels and elevated stilts. Locals are welcoming but the village isn't set up for tourism — there are no guesthouses, no signs, no souvenir shops. Visitors who go are usually photographers, anthropology students, or weary city dwellers looking for absolute quiet. The best way to experience it is to drive through slowly on a weekday afternoon, stop at the small kedai runcit (corner shop) for a kopi, and chat with the elder uncle who runs it. He knows everything about the village." },
  // KEDAH
  { state:'kedah', title:"Gunung Jerai: Kedah's Cold Mountain Almost Nobody Visits",
    tags:"hill resort, sunrise, cold, peak, kedah", source_url:"https://nz.trip.com/moments/detail/yan-1453352-15607434",
    excerpt:"At 1,217 metres, Gunung Jerai is the highest point in Kedah — with a hill resort, sunrise viewpoint, and a famously cold microclimate. Yet most visitors to the state never come here.",
    content:"Gunung Jerai is one of northern Malaysia's best-kept secrets. The peak rises sharply from the surrounding paddy plains of Kedah, creating its own microclimate where temperatures can drop to 14°C overnight. The Jerai Hill Resort offers chalets near the summit, and visitors who stay overnight wake up to a sea of clouds covering the valleys below. Day trippers can drive up to the viewpoint, hike the short trails, and visit the Hutan Lipur Batu Hampar waterfalls on the way down. The summit also features the ruins of a 6th-century Hindu candi — even older than Bujang Valley below. Despite all this, Gunung Jerai remains surprisingly empty on weekdays, partly because Kedah's tourism focus is entirely on Langkawi." },
  { state:'kedah', title:"Pulau Songsong: Kedah's Pristine Island Without the Crowds",
    tags:"island, beach, marine, snorkelling, kedah", source_url:"https://nz.trip.com/moments/detail/yan-1453352-15607434",
    excerpt:"A pristine island off the coast of Yan, Kedah — clear water, no resorts, no crowds. Visited mostly by Malaysian fishermen and the occasional backpacker who heard about it on trip.com.",
    content:"Pulau Songsong is the kind of island that exists outside the tourism economy. There are no resorts, no jetty, no entry fee — just a fishing village where you negotiate with a local boatman to take you out for the day. The island sits a few kilometres off Yan, Kedah, with crystal-clear water around its small beaches and coral patches that snorkelers love. Most visitors are local Malaysians who heard about it through trip.com or Instagram. Bring everything you need — food, water, snorkelling gear — there's nothing on the island. Best visited March to October when the seas are calm." },
  { state:'kedah', title:"Lubuk Pedati: Kedah's Free Natural Swimming Pool",
    tags:"river, swimming, free, baling, kedah", source_url:"https://www.malaysia.travel/explore/7-hidden-gems-in-kedah-for-the-ultimate-escape",
    excerpt:"A natural river pool in Baling, Kedah — open 24 hours, completely free, and a local secret. Crystal-clear water perfect for swimming.",
    content:"Tucked into the Baling district of Kedah, Lubuk Pedati is exactly what its Malay name suggests: a \"buffalo bathing pool\" carved into a river by centuries of flowing water. The pool is deep, the water cold and crystal clear, and the surrounding jungle is dense enough to keep the spot shaded. There's no entrance fee, no opening hours, and almost no signage — locals find it through word of mouth. Weekends see families picnicking on the rocky banks. Weekdays you might have the whole pool to yourself. The road in is rough; a regular car can make it but watch for potholes. Address: Lubuk Pedati, Kampung Pantai Pulai, 09100 Baling, Kedah." },
  // PERAK
  { state:'perak', title:"TT5 Tin Dredge: The Last Surviving Mining Giant in Tanjung Tualang",
    tags:"tin mining, heritage, industrial, perak", source_url:"https://geminigypsydiaries.com/hidden-gems-in-ipoh/",
    excerpt:"The last working tin dredge in Malaysia stands rusting in a Tanjung Tualang lake — a 4,500-tonne industrial relic from when Perak was the world's tin capital.",
    content:"At 4,500 tonnes and 75 metres long, the Tanjung Tualang Tin Dredge #5 (TT5) is one of the largest tin dredges ever built — and the last surviving one in Malaysia. From 1938 to 1982, it floated across the lakes of Perak's tin belt, sucking up mineral-rich sediment and processing it on board. Today it sits permanently moored as an open-air museum, accessible by a short walk across a wooden pontoon. Visitors can climb through the multi-level structure, see the original machinery, and read panels explaining the tin mining era that built towns like Ipoh, Kampar, and Batu Gajah. Combine the visit with lunch in Tanjung Tualang itself — famous across Perak for its giant freshwater prawns (udang galah)." },
  { state:'perak', title:"The Leaning Tower of Teluk Intan: Malaysia's Wonky Wonder",
    tags:"heritage, leaning tower, teluk intan, perak", source_url:"https://www.thrillark.com/blog/beyond-the-theme-park-gates-discovering-the-hidden-gems-in-ipoh/",
    excerpt:"A 25-metre Chinese-architecture tower in Teluk Intan that visibly leans like Pisa — built in 1885, still standing, and barely known outside Perak.",
    content:"Built in 1885 by Chinese contractor Leong Choon Chong, the Menara Condong (Leaning Tower) of Teluk Intan stands 25 metres tall and tilts noticeably to one side — the result of soft ground beneath one corner of the foundation. Originally built as a water tower and timekeeping mechanism, it later served as a watchtower during the Japanese occupation in 1941. From outside it looks like an 8-storey pagoda, but the interior is actually only 3 floors connected by 110 steps. The lean has actually increased over the decades but engineers have stabilised the structure. Most Malaysians know Pisa's leaning tower, but few have heard of their own. Free to visit, located in the centre of Teluk Intan town." },
  { state:'perak', title:"Gaharu Tea Valley: Perak's Aromatic Wood Forest",
    tags:"agarwood, tea, gopeng, nature, perak", source_url:"https://nz.trip.com/moments/detail/perak-23091-127034273",
    excerpt:"A 700-acre agarwood plantation in Gopeng, Perak — where the world's most expensive wood is cultivated, and visitors can taste tea brewed from its leaves.",
    content:"Agarwood (gaharu) is one of the world's most expensive substances by weight — used for incense, perfume, and traditional medicine. The Gaharu Tea Valley in Gopeng is a 700-acre plantation where you can see how this rare, resin-producing wood is cultivated. The valley sits between limestone hills and offers guided tours through the plantation, demonstrations of how agarwood resin is extracted, and a tea house where the leaves (not the wood itself) are brewed into a mild herbal tea you can taste for free. There's also a small shop selling agarwood products — be warned, the real wood is RM5,000+ per gram, but tea and incense are affordable. Quiet on weekdays, lightly busy on weekends." },
  // PAHANG
  { state:'pahang', title:"Tasik Biru Bukit Ibam: Pahang's Mysterious Blue Lake",
    tags:"blue lake, rompin, nature, pahang", source_url:"https://www.klook.com/en-MY/blog/hidden-gems-in-malaysia/",
    excerpt:"A vivid blue lake in the Rompin jungle of Pahang — the colour caused by chemical reactions between rocks and soil. Largely unknown outside Pahang.",
    content:"Tasik Biru, meaning \"Blue Lake,\" is a former iron mine in Bukit Ibam, Pahang that has filled with water and turned an almost surreal blue colour. The hue comes from chemical reactions between iron-rich soil and the water — similar to mineral lakes in Iceland. The lake sits deep in the Rompin district, requiring a 30-minute drive through palm plantations from the nearest main road. There are no facilities, no entrance fee, and no formal visitor area — just a clearing where you can park, and a short walk to the water's edge. Swimming is NOT recommended due to high mineral content, but photography is spectacular at midday when the sun lights up the lake from above. Best paired with a visit to nearby Rompin's beaches." },
  { state:'pahang', title:"Bentong: Pahang's Pit-Stop Town Worth Pulling Over For",
    tags:"ginger, food, bentong, town, pahang", source_url:"https://travelbeckons.com/2023/03/20/unveiling-bentong-a-travellers-guide-to-malaysias-hidden-gem/",
    excerpt:"An hour from KL on the road to Genting, Bentong is the small town most travellers blow past — famous among Malaysian foodies for its ginger and old kopitiams.",
    content:"Bentong is the kind of town where Malaysians stop, eat, and continue without realising they've been to one of Pahang's most distinctive places. The town is famous for \"Wen Dong Ginger\" (Bentong Ginger), considered the best ginger in Southeast Asia for its spice and sweetness. Beyond ginger, the surrounding fertile valleys produce some of Malaysia's finest fruits — especially Musang King durian. The old town centre features Hakka coffee shops dating back nearly a century, traditional Chinese medicine halls, and Sunday markets selling kampung-grown produce. Stop here for breakfast on the way up to Genting Highlands, and stay for lunch — Bentong yong tau foo is a regional speciality served at small family-run stalls." },
  { state:'pahang', title:"Lojing Highlands: Pahang's Cool Escape Without the Cameron Crowds",
    tags:"highlands, cool weather, alternative, pahang, cameron", source_url:"https://snapbackpacker.com/hidden-gems-in-malaysia-10-less-traveled-places-worth-visiting/",
    excerpt:"The highlands neighbour to Cameron, Lojing has the same cool climate, mountain views, and tea plantations — but a fraction of the visitors.",
    content:"Sitting at 1,150m elevation in the Titiwangsa range, Lojing Highlands shares the same climate, geography, and even tea plantations as Cameron Highlands next door. The difference: Lojing remains gloriously undeveloped. There are no traffic jams, no Tesco, no resort hotels — just small Orang Asli villages, vegetable farms, and a winding road that connects Kelantan to Pahang. Lojing's tea plantations are owned by Boh and Cameron Valley, but you can drive right up to the edges and walk through them without crowds. The cooler temperature (averaging 18-22°C) makes it a perfect day trip alternative to Cameron Highlands. The road in from Gua Musang is steep and winding — drive carefully and avoid in heavy rain." },
  // NEGERI SEMBILAN
  { state:'negeri_sembilan', title:"Centipede Temple: Seremban's Hilltop Shrine 264 Steps Up",
    tags:"temple, centipede, view, seremban, hike", source_url:"https://www.gayatravel.com.my/negeri-sembilans-9-unique-attraction/",
    excerpt:"A Chinese temple atop Bukit Jung in Seremban dedicated to the centipede — 264 steps up rewards you with panoramic views and a quiet, breeze-cooled shrine.",
    content:"Then Sze Koon, locally known as the Centipede Temple, sits at the top of Bukit Jung in northern Seremban. The unusual name comes from the temple's resident centipedes which devotees believe bring blessings — yes, real centipedes, though they're rarely seen. The climb up the 264 steps is a workout, but the path is shaded and there are benches for rest stops along the way. At the top, the temple is small but atmospheric, with hanging incense, prayer bells, and a statue of Yue Lao, the Chinese god of marriage — single visitors often come specifically to pray for love. The real reward is the view: Seremban town spreads out below, with the Titiwangsa range on the horizon. Best visited early morning or late afternoon." },
  { state:'negeri_sembilan', title:"Masjid Sri Sendayan: Negeri Sembilan's \"Taj Mahal of Malaysia\"",
    tags:"mosque, architecture, sendayan, photogenic", source_url:"https://dahcuti.com/blog/25-things-to-do-in-negeri-sembilan",
    excerpt:"A stunning all-white mosque near Seremban with Mughal-inspired architecture — locals call it Malaysia's mini Taj Mahal, and it photographs like one.",
    content:"Completed in 2019, Masjid Sri Sendayan was designed in the Mughal architectural style — all-white marble, ornate arches, domes capped with crescents, and a long reflecting pool that mirrors the structure. It's been nicknamed the \"Taj Mahal of Malaysia\" by Malaysian social media users, and the comparison is fair: the symmetry, the white-on-blue colour palette, and the photographic potential are all there. Capacity is 5,000 worshippers, and the mosque is open to respectful non-Muslim visitors outside prayer times. The grounds are beautifully landscaped with green gardens and water features. Free to visit; modest dress is required (gowns are provided). Best photographed at golden hour when the light catches the white walls." },
  { state:'negeri_sembilan', title:"Gunung Datuk: The Mountain Where Hang Tuah Left His Footprint",
    tags:"hiking, legend, peak, rembau", source_url:"https://www.tripzilla.com/hidden-gems-malaysia/145159",
    excerpt:"At 884m, Gunung Datuk is Negeri Sembilan's tallest peak — with a strenuous hike, panoramic views, and a legend that connects it to Malaysia's most famous warrior.",
    content:"Local legend has it that the warrior Hang Tuah once meditated atop Gunung Datuk, and that one of the granite boulders near the peak still bears his footprint impressed into the stone. Whether you believe the story or not, the boulder is real — and the hike up to see it is a proper challenge. The trail starts from Rembau and climbs steeply for 2-3 hours through dense rainforest, gaining 700+ metres of elevation. The reward at the top is one of the best 360-degree views in southern Peninsular Malaysia — you can see Melaka, Putrajaya, and on clear days even the distant peak of Gunung Ledang. Start early (6am) to avoid afternoon heat and storms. Wear proper shoes. The last 30 minutes involves rope-assisted scrambles." },
  // JOHOR
  { state:'johor', title:"Pulau Rawa: Johor's Pristine Island That Refused to Develop",
    tags:"island, mersing, marine, sustainability, johor", source_url:"https://www.tripzilla.com/8-hidden-gems-johor/18663",
    excerpt:"A small island off Mersing where fishing is banned, plastic is forbidden, and the resort runs entirely on reduce-reuse-recycle — Johor's purest island escape.",
    content:"Pulau Rawa is one of the smallest islands in the Seribuat archipelago off Mersing, Johor — and one of the most strictly protected. The single resort on the island (Rawa Island Resort) operates under a strong sustainability ethos: no fishing within the marine park, single-use plastics discouraged, and water rationing during dry seasons. The result is some of the clearest snorkelling water in Peninsular Malaysia, with healthy coral, sea turtles, and reef sharks visible just metres from the beach. Access is via a 1-hour boat ride from Mersing jetty. Day trips are possible but a 2-night stay lets you snorkel different reefs each day. Closed during monsoon season (November-February)." },
  { state:'johor', title:"Tasik Biru Kangkar Pulai: JB's Secret Blue Lake",
    tags:"blue lake, hike, kulai, johor", source_url:"https://placefu.com/blog/7-possibly-lesser-known-attractions-in-johor-bahru/",
    excerpt:"Tucked away in Kulai, a 30-minute drive from JB, this mysterious baby-blue lake is one of southern Malaysia's most photogenic — and least visited — outdoor spots.",
    content:"The Kangkar Pulai Blue Lake is a former kaolin mining quarry that has flooded with rainwater, picking up a striking baby-blue hue from the white kaolin clay at the bottom. The lake sits inside the Gunung Pulai Forest Reserve, accessible via a 20-minute jungle hike from the trailhead. Locals discovered it through Instagram, and on weekends a small but steady stream of hikers visits for the photo. Weekdays the lake is yours alone. Swimming is officially discouraged due to slippery edges and unknown depth, but the still water makes for one of the most photogenic spots in Johor. Bring sturdy shoes for the hike — the path can be muddy after rain." },
  { state:'johor', title:"Jalan Tan Hiok Nee: JB's Hipster Heritage Street",
    tags:"heritage, cafes, johor bahru, street art, food", source_url:"https://www.travellingbeez.com/lesser-known-and-underrated-places-and-attractions-in-johor-malaysia/",
    excerpt:"A short heritage street in JB lined with Chinese shophouses, hipster cafes, century-old bakeries, and the JB Chinese Heritage Museum — completely overlooked by JB's mall-bound tourists.",
    content:"Most visitors to Johor Bahru go straight to City Square, Mid Valley Southkey, or the duty-free shopping near the causeway. They miss Jalan Tan Hiok Nee — a short, narrow street in JB's old town that has quietly become one of Malaysia's best heritage districts. The shophouses date to the late 1800s, when wealthy Chinese merchant Tan Hiok Nee developed the area. Today, the street balances old and new: the family-run Hiap Joo Bakery has been making wood-fired banana cake since 1919, while next door you'll find third-wave coffee shops, craft beer bars, and the JB Chinese Heritage Museum. Walk the street on weekend mornings when local artists set up sketch easels along the kerb. Combine with a visit to nearby Jalan Dhoby for more cafes." }
];

// Hidden-gem posts use a representative seeded placeholder cover
const gemCover = (slug) => `https://picsum.photos/seed/${slug}/1200/700`;

// ---- Accommodation generation helpers ----
const ACCOM_IMG = {
  hotel:    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80',
  resort:   'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80',
  homestay: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80',
  chalet:   'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80',
  budget:   'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80',
  hostel:   'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80'
};
// Nearest town + a plausible town hotel per state
const TOWN = {
  perlis:          { town: 'Kangar',       hotel: 'Hotel Putra Brasmana' },
  kedah:           { town: 'Alor Setar',   hotel: 'The Jerai Hotel' },
  perak:           { town: 'Ipoh',         hotel: 'M Boutique Hotel Ipoh' },
  pahang:          { town: 'Kuantan',      hotel: 'The Zenith Hotel Kuantan' },
  negeri_sembilan: { town: 'Seremban',     hotel: 'Klana Resort Seremban' },
  johor:           { town: 'Johor Bahru',  hotel: 'Amari Johor Bahru' }
};
// Keyword overrides so "town hotel" stays geographically sensible
const TOWN_OVERRIDE = [
  { kw: /cameron|lojing|mossy|brinchang/i, town: 'Cameron Highlands', hotel: 'Strawberry Park Resort' },
  { kw: /bentong/i,                        town: 'Bentong',           hotel: 'Bentong Eco Wellness Resort' },
  { kw: /langkawi|tanjung rhu/i,           town: 'Langkawi',          hotel: 'The Datai Langkawi' },
  { kw: /muar/i,                           town: 'Muar',              hotel: 'Classic Hotel Muar' },
  { kw: /mersing|rawa|tioman|endau/i,      town: 'Mersing',           hotel: 'Timotel Hotel Mersing' },
  { kw: /teluk intan|tanjung tualang/i,    town: 'Teluk Intan',       hotel: 'Hotel Anson Teluk Intan' },
  { kw: /gopeng|gua tempurung/i,           town: 'Gopeng',            hotel: 'Adeline Rest House Gopeng' },
  { kw: /kukup|pontian/i,                  town: 'Pontian',           hotel: 'Kukup Golf Resort' },
  { kw: /merapoh|gua musang/i,             town: 'Gua Musang',        hotel: 'Dragon Inn Gua Musang' }
];
const NEAR_TYPES = ['chalet', 'homestay', 'resort', 'budget'];
// Agoda structured search format: city scope + hotel name + 2 adults
const agoda = (name) => `https://www.agoda.com/search?city=Malaysia&q=${encodeURIComponent(name)}&adults=2`;
const round1 = (n) => Math.round(n * 10) / 10;

function accommodationsFor(post, idx) {
  const placeShort = post.title.split(/[:—-]/)[0].trim();
  const t = TOWN[post.state];
  const ov = TOWN_OVERRIDE.find(o => o.kw.test(post.title));
  const townName = ov ? ov.town : t.town;
  const townHotel = ov ? ov.hotel : t.hotel;

  // Deterministic-ish variety based on the post index
  const nearType = NEAR_TYPES[idx % NEAR_TYPES.length];
  const nearDist = round1(0.4 + (idx % 5) * 1.1);          // 0.4 – 4.8 km
  const nearRating = round1(3.9 + (idx % 4) * 0.15);        // 3.9 – 4.35
  const townDist = round1(12 + (idx % 6) * 4);             // 12 – 32 km
  const townRating = round1(4.0 + (idx % 3) * 0.15);       // 4.0 – 4.3

  const nearName = `${placeShort} ${nearType === 'budget' ? 'Rest House' : nearType[0].toUpperCase() + nearType.slice(1)}`;

  return [
    {
      name: nearName,
      type: nearType, distance_km: nearDist, price_range: nearType === 'resort' ? '$$$' : '$$',
      description: `Stay close to ${placeShort} — a ${nearType} popular with travellers who want to start early and avoid the drive.`,
      booking_url: agoda(nearName), image_url: ACCOM_IMG[nearType], rating: nearRating
    },
    {
      name: townHotel,
      type: 'hotel', distance_km: townDist, price_range: '$$$',
      description: `Comfortable hotel in ${townName}, an easy drive from ${placeShort} with full amenities and dining.`,
      booking_url: agoda(townHotel), image_url: ACCOM_IMG.hotel, rating: townRating
    }
  ];
}

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost', user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '', database: process.env.DB_NAME || 'hidden_malaysia'
  });
  console.log('Connected. Seeding Shot 8 extras...\n');

  // 1) Clean re-run: remove previous hidden-gem posts (+ their cascade) and all accommodations
  await conn.execute("DELETE FROM posts WHERE category = 'hidden-gem'");
  await conn.execute('DELETE FROM accommodations');
  console.log('Cleared old hidden-gem posts and accommodations.');

  // 2) Insert the 18 hidden-gem posts
  console.log('\nInserting 18 hidden-gem posts...');
  for (const g of gems) {
    const slug = slugify(g.title);
    await conn.execute(
      `INSERT INTO posts (title, slug, excerpt, content, state, category, cover_image, image_credit, tags, source_url, author_id, published)
       VALUES (?, ?, ?, ?, ?, 'hidden-gem', ?, ?, ?, ?, 1, 1)`,
      [g.title, slug, g.excerpt, g.content, g.state, gemCover(slug),
       'Photo via Unsplash / placeholder (representative)', g.tags, g.source_url]
    );
    console.log(`  [${g.state}] ${g.title}`);
  }

  // 3) Seed 2 accommodations for every post (main 18 + hidden 18 = 36)
  console.log('\nSeeding accommodations for all posts...');
  const [allPosts] = await conn.execute('SELECT id, title, state FROM posts ORDER BY id');
  let n = 0;
  for (let i = 0; i < allPosts.length; i++) {
    const p = allPosts[i];
    for (const a of accommodationsFor(p, i)) {
      await conn.execute(
        `INSERT INTO accommodations (post_id, name, type, distance_km, price_range, description, booking_url, image_url, rating)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.id, a.name, a.type, a.distance_km, a.price_range, a.description, a.booking_url, a.image_url, a.rating]
      );
      n++;
    }
  }
  console.log(`  ${n} accommodations across ${allPosts.length} posts.`);

  console.log('\n============================================================');
  console.log('Shot 8 extras seeded successfully!');
  console.log(`  Hidden-gem posts: ${gems.length}`);
  console.log(`  Accommodations:   ${n}`);
  console.log('============================================================');
  await conn.end();
  process.exit(0);
})();
