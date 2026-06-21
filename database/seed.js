
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const bcrypt = require('bcryptjs');
const mysql  = require('mysql2/promise');

// ============================================================
// bcryptjs pattern — hash and compare passwords
//
//   HASHING (when creating a user):
//     const hash = await bcrypt.hash('plainTextPassword', 10);
//     // Store `hash` in the database — never the plain password
//
//   COMPARING (when logging in):
//     const match = await bcrypt.compare('plainTextPassword', storedHash);
//     // match === true means the password is correct
// ============================================================

// Converts a post title into a URL-safe slug
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/'/g, '')              // remove apostrophes
    .replace(/[^a-z0-9\s-]/g, ' ') // replace special chars with space
    .replace(/\s+/g, '-')           // spaces to hyphens
    .replace(/-+/g, '-')            // collapse double hyphens
    .replace(/^-|-$/g, '');         // trim leading/trailing hyphens
}

// ============================================================
// All 18 posts — 3 per state
// ============================================================
const posts = [
  // ---- PERLIS ----
  {
    title: "Gua Kelam: Perlis's Underground River Cave",
    excerpt: "A 370-metre limestone cave with an underground river walkway that emerges into lush jungle — one of Perlis's best-kept secrets.",
    content: `Deep in the heart of Perlis lies Gua Kelam, a limestone cave stretching 370 metres with a remarkable underground river flowing through it. Unlike commercial caves, Gua Kelam feels genuinely wild — a wooden walkway runs the length of the cave above the river, leading you from darkness into sudden jungle light. The cave earned its name meaning "Dark Cave" from the pitch-black interior, though it is well enough lit for exploration. Outside, the Sungai Wang waterfall and surrounding forest make this a full half-day adventure. Entry is minimal and crowds are rare, especially on weekday mornings. The cave is located in Wang Kelian, about 35km from Kangar town. Best visited early morning for cooler temperatures and better lighting.`,
    state: 'perlis', category: 'nature',
    tags: 'cave, nature, hiking, perlis',
    source_url: 'https://jomexplore.io/article/17732/netizen-kongsi-5-hidden-gems-yang-anda-boleh-teroka-di-perlis',
    author_id: 1
  },
  {
    title: "Wang Kelian Sunday Market: The Border Market Hidden in the Hills",
    excerpt: "A hilltop border market where Malaysia meets Thailand — fresh produce, local snacks and sweeping mountain views, all before noon on Sundays.",
    content: `Perched on the hills at the Malaysia-Thailand border, Wang Kelian Sunday Market is one of the most uniquely positioned markets in the country. Every Sunday morning, traders from both sides of the border set up stalls selling fresh tropical fruits, Thai snacks, batik cloth, and dried goods you won't find in any city supermarket. The mountain views from the market area are genuinely spectacular, with rolling hills stretching into southern Thailand. The market wraps up by midday, so arrive early. Parking can be tight on busy Sundays. The surrounding Wang Kelian State Park offers short jungle walks for those who want to extend the trip. A truly local experience that most tourists never discover.`,
    state: 'perlis', category: 'culture',
    tags: 'market, border, culture, food, perlis',
    source_url: 'https://jomexplore.io/article/17732/netizen-kongsi-5-hidden-gems-yang-anda-boleh-teroka-di-perlis',
    author_id: 1
  },
  {
    title: "Tasik Melati: Perlis's Secret Lotus Lake",
    excerpt: "A serene lotus lake near Arau town, near-empty on weekdays and stunningly beautiful during the lotus blooming season.",
    content: `Tasik Melati sits quietly near Arau, Perlis's royal town, largely unknown to visitors who pass through on their way to Langkawi ferries or Thai border crossings. The lake is named after the melati flower and is covered in lotus blooms during peak season, turning the water surface into a carpet of pink and white. A small wooden walkway extends over the lake for photography. Early mornings offer the best light and the least visitors — on weekdays you may have the entire lake to yourself. The surrounding parkland has basic facilities and is popular with local joggers. A completely free, completely unhurried gem of a visit.`,
    state: 'perlis', category: 'nature',
    tags: 'lake, lotus, nature, peaceful, perlis',
    source_url: 'https://jomexplore.io/article/17732/netizen-kongsi-5-hidden-gems-yang-anda-boleh-teroka-di-perlis',
    author_id: 1
  },

  // ---- KEDAH ----
  {
    title: "Lembah Bujang: Malaysia's Oldest Civilisation Hidden in Kedah",
    excerpt: "Ancient Hindu-Buddhist ruins in Kedah that predate Angkor Wat — one of Southeast Asia's most significant archaeological sites, yet barely visited.",
    content: `Lembah Bujang, or Bujang Valley, holds one of the oldest civilisations in Southeast Asia, with archaeological evidence dating back to the 4th century AD — predating the famous Angkor Wat in Cambodia. Located near Merbok in Kedah, the valley contains the remains of ancient Hindu-Buddhist temples, candi structures, and artefacts that tell the story of a thriving maritime trading civilisation that once connected this region to India and China. The Lembah Bujang Archaeological Museum on site houses recovered artefacts and offers context for the outdoor ruins scattered across the valley. Rated 4.5 out of 5 on Tripadvisor, yet visitor numbers remain surprisingly low. A humbling reminder that Malaysia's history stretches far deeper than most textbooks suggest. Entry is free. Best explored with a guide or audio guide from the museum.`,
    state: 'kedah', category: 'culture',
    tags: 'history, archaeological, ruins, ancient, kedah',
    source_url: 'https://www.tripadvisor.com.my/Attractions-g298281-Activities-zft12156-Kedah.html',
    author_id: 1
  },
  {
    title: "Tanjung Rhu Beach: Langkawi's Best-Kept Secret Shore",
    excerpt: "Far from Cenang's beach clubs and crowds, Tanjung Rhu is Langkawi's most beautiful and least visited beach — white sand, clear water, perfect sunsets.",
    content: `While most Langkawi visitors crowd Pantai Cenang, those in the know head 45 minutes north to Tanjung Rhu. This secluded white-sand beach stretches along the northern tip of Langkawi, flanked by towering limestone karst formations and calm, clear water. Rated 4.4 out of 5 on Tripadvisor with over 1,200 reviews, the beach somehow remains uncrowded due to its distance from the main tourist strip. The beach is best at sunset when the limestone cliffs glow orange and the water turns gold. A small selection of sun loungers and a beachfront restaurant (Spice@Rhu Terrace) are available. The nearby Kilim Mangrove Forest makes a good morning activity before spending the afternoon at Tanjung Rhu. Take a Grab — it's far but worth every minute.`,
    state: 'kedah', category: 'nature',
    tags: 'beach, langkawi, peaceful, sunset, kedah',
    source_url: 'https://www.tripadvisor.com.my/Attraction_Review-g298283-d592476-Reviews-Tanjung_Rhu_Beach-Langkawi_Langkawi_District_Kedah.html',
    author_id: 1
  },
  {
    title: "Tree Top Walk Sungai Sedim: Kedah's Adventure in the Canopy",
    excerpt: "A canopy walkway, river tubing, jungle trekking and camping all in one location — Kedah's most underrated adventure destination, rated 4.8 out of 5.",
    content: `Sungai Sedim Recreation Park in Kulim, Kedah offers one of the most complete outdoor experiences in the north of Peninsular Malaysia. The centrepiece is a treetop canopy walkway that winds through the jungle high above the forest floor, offering views of the Sedim River below. Beyond the walkway, the park offers river tubing, white-water rafting, jungle trekking, bird watching, flying fox, swimming, and camping — making it a full weekend destination rather than just a day trip. Rated 4.8 out of 5 on Tripadvisor, it sees only a fraction of the visitors that Cameron Highlands or Langkawi receives. Entry fees are reasonable and the park is well-maintained. Located about 40 minutes from Alor Setar and easily reached by car.`,
    state: 'kedah', category: 'adventure',
    tags: 'treetop, canopy walk, jungle, adventure, kedah',
    source_url: 'https://www.tripadvisor.com.my/Attractions-g298281-Activities-zft12156-Kedah.html',
    author_id: 2
  },

  // ---- PERAK ----
  {
    title: "Ipoh World at Han Chin Pet Soo: The Secret Museum of Tin Town",
    excerpt: "A free guided museum inside a 90-year-old Hakka clan house, telling the story of Ipoh's tin mining era — rated 4.8 out of 5, but you must book in advance.",
    content: `Tucked inside Concubine Lane in Ipoh's old town, the Han Chin Pet Soo is a beautifully preserved three-storey Hakka clan house that has been transformed into one of Malaysia's most intimate and well-curated museums. Run by IpohWorld, a not-for-profit education organisation, the museum tells the story of the Hakka Chinese who built Ipoh's tin mining empire in the late 1800s and early 1900s. Guided tours are conducted by knowledgeable volunteers like Mr. Leong, who brings the history alive with anecdotes and humour. Every artefact on display is an original antique — from mining tools to opium paraphernalia to vintage photographs. Admission is free, though donations are warmly welcomed. Rated an exceptional 4.8 out of 5 on Tripadvisor from over 2,000 reviews. Book online at ipohworld.org — slots fill up fast, especially on weekends. Located next to Ho Yan Hor, making it easy to combine both visits in one trip.`,
    state: 'perak', category: 'culture',
    tags: 'museum, history, hakka, ipoh, tin mining, perak',
    source_url: 'https://www.tripadvisor.com/Attraction_Review-g298298-d7806166-Reviews-Ipoh_World_at_Han_Chin_Pet_Soo-Ipoh_Kinta_District_Perak.html',
    author_id: 2
  },
  {
    title: "Gua Tempurung: Perak's Subterranean Kingdom",
    excerpt: "One of Peninsular Malaysia's largest limestone caves with an underground river — multiple trail difficulties make it perfect for first-timers and adventure seekers alike.",
    content: `Gua Tempurung in Gopeng, Perak is one of the largest and most impressive limestone caves in Peninsular Malaysia. At over 3.8 kilometres long, the cave contains a series of vast chambers with towering ceilings, dramatic rock formations, stalactites, and an underground river that flows through its heart. Multiple trail options ranging from easy walkways (Tour 1 and 2) to full adventure routes that involve wading through rivers and crawling through narrow passages (Tour 4 and 5) make this suitable for families and hardcore spelunkers alike. Rated 4.2 out of 5 on Tripadvisor. Arrive before 3:30pm — the cave closes at 5pm and staff may lock up early. Bring a change of clothes if attempting the wet routes. Located just off the North-South Expressway near Gopeng, about 20 minutes south of Ipoh.`,
    state: 'perak', category: 'nature',
    tags: 'cave, limestone, adventure, spelunking, perak',
    source_url: 'https://www.tripadvisor.com/Attraction_Review-g2213880-d2038314-Reviews-Gua_Tempurung-Gopeng_Kampar_District_Perak.html',
    author_id: 2
  },
  {
    title: "Tasik Cermin: The Mirror Lake Hidden in Limestone",
    excerpt: "A serene lake accessed through a dark limestone tunnel by rubber boat — one of Ipoh's most unique natural attractions, best visited on weekday mornings to avoid queues.",
    content: `Tasik Cermin, or Mirror Lake, earns its name from the glassy stillness of the water that reflects the surrounding limestone cliffs. To reach the lake, visitors board a small rubber boat and pass through a short, dark tunnel carved through the limestone cliff — emerging suddenly into a hidden valley of calm water and towering walls. A second boat ride takes you deeper into the cave system to a second, larger lake. The experience is genuinely magical on a quiet morning. Rated 3.6 out of 5 on Tripadvisor due to weekend crowds and queues — but visit midweek after 9am and you'll find it near-empty and spectacular. Entry and boat rides are affordable. Located in Ipoh near Gunung Lang Recreational Park. The adjacent area also offers quad bike rides, animal petting, and a small cafe with durian ice cream.`,
    state: 'perak', category: 'nature',
    tags: 'lake, cave, boat, limestone, ipoh, perak',
    source_url: 'https://www.tripadvisor.com/Attraction_Review-g298298-d7958007-Reviews-Tasik_Cermin-Ipoh_Kinta_District_Perak.html',
    author_id: 2
  },

  // ---- PAHANG ----
  {
    title: "Kuala Gandah Elephant Sanctuary: Where You Help, Not Watch",
    excerpt: "A genuine elephant conservation sanctuary in Pahang where rescued elephants are rehabilitated — feed them, watch them bathe, and leave understanding why conservation matters.",
    content: `Located in Lanchang, Pahang, the Kuala Gandah Elephant Sanctuary is run by the Department of Wildlife and National Parks (PERHILITAN) as a genuine rescue and rehabilitation centre for Peninsular Malaysia's wild elephants. Unlike zoo encounters, the elephants here have been rescued from habitat destruction and conflict situations, and the programme focuses on eventual reintroduction into the wild. Visitors can feed the elephants, watch them bathe in the river, and observe their daily care routines. Each elephant has a dedicated keeper who knows them individually — ages range from young calves to elephants over 50 years old. Admission is free, with optional guided experiences for a small fee. Rated 4.1 out of 5 on Tripadvisor with nearly 1,000 reviews. Located about 1 hour 45 minutes from Kuala Lumpur. Book through reputable tour operators or rent a car — public transport is limited.`,
    state: 'pahang', category: 'nature',
    tags: 'elephants, wildlife, sanctuary, pahang, conservation',
    source_url: 'https://www.tripadvisor.com.my/Attraction_Review-g298291-d504486-Reviews-Kuala_Gandah_Elephant_Sanctuary-Pahang.html',
    author_id: 1
  },
  {
    title: "Mossy Forest Eco Park: Cameron Highlands' Mystical Cloud Forest",
    excerpt: "At the peak of Gunung Brinchang, a mystical moss-covered cloud forest with pitcher plants, rare fauna, and 360-degree highland views — arrive before 8:30am to beat the crowds.",
    content: `The Mossy Forest Eco Park sits at the summit of Gunung Brinchang at 2,032 metres above sea level — the highest point accessible by road in Cameron Highlands. The forest earned its name from the thick carpet of moss that covers every surface: tree trunks, rocks, and soil alike, creating an otherworldly, almost fairy-tale atmosphere. The cool, misty air is home to pitcher plants, rare orchids, and gibbons that are occasionally spotted away from the main boardwalk. A wooden boardwalk and observation tower offer sweeping views over the highlands towards Ipoh on clear mornings. Rated 4.2 out of 5 on Tripadvisor with nearly 1,000 reviews. Arrive before 8:30am to have the forest largely to yourself — Land Rovers and minibuses begin flooding in after 9am. Entry fee applies (RM30 for non-Malaysians). Consider hiring a local guide for deeper insights into the native flora and its medicinal uses.`,
    state: 'pahang', category: 'nature',
    tags: 'forest, cameron highlands, nature, hiking, pahang',
    source_url: 'https://www.tripadvisor.com.my/Attraction_Review-g298293-d1034350-Reviews-Mossy_Forest_Eco_Park-Brinchang_Cameron_Highlands_Pahang.html',
    author_id: 1
  },
  {
    title: "Merapoh: Taman Negara's Secret Back Door",
    excerpt: "The lesser-known northern entrance to Taman Negara, where smaller groups, lower prices and more authentic jungle experiences await — rated 4.8 out of 5.",
    content: `While most visitors enter Taman Negara through the popular Kuala Tahan gateway in Jerantut, the small town of Merapoh in northern Pahang offers a completely different — and far superior — jungle experience. Merapoh Adventure, rated 4.8 out of 5 on Tripadvisor, operates tours through this less-used northern entrance with smaller group sizes, more wildlife sightings, and a more authentic deep-jungle atmosphere. Activities include river rafting on the Sungai Pertang, cave exploration in Gua Batu Putih (home to thousands of bats), jungle trekking, fishing, and overnight camping in the rainforest. The surrounding Taman Negara national park is one of the world's oldest rainforests at over 130 million years old. Merapoh is reachable by train from Kuala Lumpur (ETS to Gua Musang, then local transport) or by car via Route 8.`,
    state: 'pahang', category: 'adventure',
    tags: 'jungle, taman negara, trekking, orang asli, pahang',
    source_url: 'https://www.tripadvisor.com.my/Attraction_Review-g3360742-d8642144-Reviews-Merapoh_Adventure-Merapuh_Pahang.html',
    author_id: 2
  },

  // ---- NEGERI SEMBILAN ----
  {
    title: "Sri Menanti Royal Museum: A Palace Built Without a Single Nail",
    excerpt: "A breathtaking traditional Minangkabau wooden palace built without a single nail — the royal museum of Negeri Sembilan stands as a masterpiece of indigenous craftsmanship.",
    content: `The Sri Menanti Royal Museum in Kuala Pilah district stands as one of Malaysia's most remarkable architectural achievements. Built between 1902 and 1908, this four-storey traditional Minangkabau palace was constructed entirely from timber — without a single nail used in the entire structure. The palace, known as Istana Lama Sri Menanti, served as the royal residence of the Yang Dipertuan Besar of Negeri Sembilan and has been preserved as a museum since 1992. Inside, displays of royal regalia, traditional weapons, ceremonial costumes, and historical photographs paint a vivid picture of Minangkabau royal life. The distinctive curved roofline of the palace, soaring upward at both ends, is iconic Minangkabau architecture at its finest. Entry is free. The museum is set in beautiful grounds in the royal town of Sri Menanti, about 30 minutes from Seremban. Most visitors to Negeri Sembilan never make it here — their loss.`,
    state: 'negeri_sembilan', category: 'culture',
    tags: 'palace, minangkabau, culture, history, negeri sembilan',
    source_url: 'https://siakapkeli.my/articles/12-hidden-gems-di-negeri-sembilan-melaka-yang-wajib-pergi',
    author_id: 1
  },
  {
    title: "Pedas Hot Springs: Negeri Sembilan's Sulphur Soak Secret",
    excerpt: "Natural sulphur hot springs tucked behind a quiet kampung in Rembau — far less crowded than Selangor's alternatives, and just as therapeutic.",
    content: `While Selangor's hot springs draw weekend crowds, Pedas Hot Springs in Rembau district, Negeri Sembilan remains a quiet, local secret. Surrounded by a small kampung and rubber estates, the springs bubble up naturally and feed into soaking pools that locals have used for generations. The sulphur-rich water is believed to have therapeutic properties for skin conditions and muscle relaxation. Facilities are simple but clean, with changing rooms and food stalls nearby selling local snacks. The setting itself — a sleepy village with chickens, fruit trees and the distant sound of the springs — is half the appeal. Entry is affordable and the springs are rarely crowded, even on weekends. Located in Pedas, Rembau, about 45 minutes from Seremban town.`,
    state: 'negeri_sembilan', category: 'nature',
    tags: 'hot springs, nature, relaxation, negeri sembilan',
    source_url: 'https://siakapkeli.my/articles/12-hidden-gems-di-negeri-sembilan-melaka-yang-wajib-pergi',
    author_id: 1
  },
  {
    title: "Jeram Toi Waterfall: Negeri Sembilan's Seven-Tiered Secret",
    excerpt: "A seven-tiered waterfall deep in Ulu Muar jungle — the hike is challenging but rewards with pristine jungle pools completely free of crowds.",
    content: `Jeram Toi in Ulu Muar, Negeri Sembilan is a seven-tiered waterfall that requires a proper jungle hike to reach, which is exactly why it remains uncrowded. The trail begins at Felda Pasir Besar and winds through secondary jungle for about 45 minutes before reaching the first tier — a wide, powerful curtain of water falling into a deep pool. The full seven tiers can be explored by those willing to scramble up the rocks between pools. Each tier has its own character: some are wide and shallow, others narrow and deep. The water is clean and cold, perfect for swimming. No facilities exist beyond the trailhead, so bring everything you need including food, water, and insect repellent. Best visited with a local guide on your first trip. Avoid after heavy rain as river levels rise quickly. A genuinely wild and rewarding experience.`,
    state: 'negeri_sembilan', category: 'adventure',
    tags: 'waterfall, hiking, nature, adventure, negeri sembilan',
    source_url: 'https://siakapkeli.my/articles/12-hidden-gems-di-negeri-sembilan-melaka-yang-wajib-pergi',
    author_id: 2
  },

  // ---- JOHOR ----
  {
    title: "Endau Rompin National Park: Johor's Ancient Wilderness",
    excerpt: "One of Malaysia's most pristine ancient rainforests and a serious rival to Taman Negara — without the crowds. Endau Rompin is Johor's wild, untouched heart.",
    content: `Endau Rompin National Park spans the border of Johor and Pahang and covers over 800 square kilometres of ancient lowland dipterocarp rainforest — some of the oldest and most biodiverse in the world. Unlike the more commercialised Taman Negara, Endau Rompin sees a fraction of the visitors, making wildlife sightings more likely and the experience more authentic. The park is home to Sumatran rhinos (critically endangered), elephants, tigers, tapirs, and hundreds of bird species. Key attractions include the stunning Upeh Guling and Buaya Sangkut waterfalls, both requiring multi-day jungle treks to reach. The Jakun Orang Asli community at Kampung Peta serve as guides and cultural hosts. Access is through two main entry points: Kahang (Johor side) or Kuala Rompin (Pahang side). Permits required — plan well in advance and book a licensed guide. Best for those who want a real, unscripted jungle experience.`,
    state: 'johor', category: 'adventure',
    tags: 'national park, jungle, waterfall, orang asli, johor',
    source_url: 'https://www.tripadvisor.com.my/Attractions-g298277-Activities-zft12156-Johor.html',
    author_id: 2
  },
  {
    title: "Muar: The UNESCO Creative City Most Malaysians Haven't Visited",
    excerpt: "A UNESCO Creative City of Crafts and Folk Art with beautifully preserved colonial shophouses, the best mee bandung in Malaysia, and almost no tourists.",
    content: `Muar, also known as Bandar Maharani, sits quietly on the Muar River in northern Johor, largely bypassed by tourists rushing between Kuala Lumpur and Singapore. This is a mistake. Muar holds UNESCO Creative City of Crafts and Folk Art status — recognition of its rich tradition in Johor crafts, weaving, songket, and performing arts. The town centre is a showcase of well-preserved colonial shophouses, painted in faded pastels, housing coffee shops, traditional trades and craft workshops. The waterfront esplanade along Sungai Muar is peaceful and walkable. Food is the other major draw — Muar is widely considered the birthplace of mee bandung (thick noodles in a sweet-spicy prawn gravy) and otak-otak (grilled spiced fish cake in banana leaf), both of which taste better here than anywhere else. Stay overnight if you can — evenings on the waterfront are especially atmospheric.`,
    state: 'johor', category: 'culture',
    tags: 'muar, heritage, food, colonial, johor, UNESCO',
    source_url: 'https://www.tripadvisor.com.my/Attractions-g298277-Activities-zft12156-Johor.html',
    author_id: 2
  },
  {
    title: "Kukup: Johor's Village Built Entirely on the Sea",
    excerpt: "An entire fishing village built on stilts above the Strait of Malacca — fresh seafood, the Orang Seletar sea nomads, and views of Sumatra on clear days.",
    content: `Kukup is one of the largest floating fishing villages in Malaysia, built entirely on wooden stilts above the water in the southwest corner of Johor, just 8 kilometres from Indonesia across the Strait of Malacca. The village is home to the Orang Seletar, a sea nomadic people who have lived on these waters for centuries, as well as a significant Chinese fishing community. Visitors arrive by small ferry from the Kukup Fishing Village Pier, stepping out onto a network of wooden boardwalks connecting the houses, seafood restaurants, and fish processing facilities above the sea. The seafood here — prawns, crabs, and fresh fish cooked in simple, flavourful preparations — is exceptional and reasonably priced. On clear days, Sumatra is visible on the horizon. The village is best visited on weekday mornings before tour groups from Singapore arrive around midday.`,
    state: 'johor', category: 'culture',
    tags: 'fishing village, seafood, orang seletar, johor, coastal',
    source_url: 'https://www.tripadvisor.com.my/Attractions-g298277-Activities-zft12156-Johor.html',
    author_id: 2
  }
];

// ============================================================
// Sample comments — 6 spread across different posts
// ============================================================
const sampleComments = [
  { postIndex: 0,  name: 'Sarah Lim',   email: 'sarah@example.com',       content: 'Visited Gua Kelam last month — completely magical! The walkway over the river is unlike anything I have seen in Malaysia. Go early and bring a torch just in case!' },
  { postIndex: 1,  name: 'Ahmad Razif', email: 'ahmad@example.com',       content: 'The Wang Kelian market is so underrated. The views alone are worth the drive up. Make sure to try the Thai-style mango sticky rice — better than anything you will find in KL.' },
  { postIndex: 3,  name: 'Priya Nair',  email: 'priya@example.com',       content: 'Lembah Bujang deserves so much more attention. I had the place almost entirely to myself on a Tuesday morning. The museum guide was incredibly knowledgeable and passionate.' },
  { postIndex: 6,  name: 'Tan Wei Jie', email: 'weijie@example.com',      content: 'Booked the Han Chin Pet Soo two weeks in advance and it was absolutely worth it. Mr. Leong is a legend — his stories about the Hakka miners had everyone in the group riveted.' },
  { postIndex: 12, name: 'Nurul Huda',  email: 'nurul@example.com',       content: 'The Sri Menanti palace is breathtaking. I cannot believe a building this beautiful was constructed without a single nail. The grounds are so peaceful — we stayed for two hours.' },
  { postIndex: 16, name: 'Jason Ng',    email: 'jason@example.com',       content: 'Muar completely exceeded my expectations. The mee bandung at a little shop behind the old town mosque was the best I have ever had. Staying overnight was a great call.' }
];

// ============================================================
// Seed function
// ============================================================
async function seed() {
  let conn;
  try {
    conn = await mysql.createConnection({
      host:     process.env.DB_HOST || 'localhost',
      user:     process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'hidden_malaysia'
    });

    console.log('Connected to database. Starting seed...\n');

    // ---- Clear existing data (order matters due to foreign keys) ----
    await conn.execute('SET FOREIGN_KEY_CHECKS = 0');
    await conn.execute('TRUNCATE TABLE subscribers');
    await conn.execute('TRUNCATE TABLE comments');
    await conn.execute('TRUNCATE TABLE posts');
    await conn.execute('TRUNCATE TABLE users');
    await conn.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Existing data cleared.');

    // ---- Users ----
    console.log('\nSeeding users...');
    const SALT_ROUNDS = 10;

    // bcryptjs.hash(plainPassword, saltRounds) — always await this
    const adminHash   = await bcrypt.hash('Admin@123',   SALT_ROUNDS);
    const visitorHash = await bcrypt.hash('Visitor@123', SALT_ROUNDS);

    await conn.execute(
      'INSERT INTO users (id, username, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [1, 'admin',     'admin@hiddenmalaysia.com',  adminHash,   'admin']
    );
    await conn.execute(
      'INSERT INTO users (id, username, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [2, 'editor',    'editor@hiddenmalaysia.com', adminHash,   'admin']
    );
    await conn.execute(
      'INSERT INTO users (id, username, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [3, 'traveller', 'traveller@example.com',     visitorHash, 'visitor']
    );
    console.log('  3 users created.');

    // ---- Posts ----
    console.log('\nSeeding 18 posts...');
    const insertedPostIds = [];

    for (const post of posts) {
      const slug = slugify(post.title);
      const [result] = await conn.execute(
        `INSERT INTO posts
           (title, slug, excerpt, content, state, category, tags, source_url, author_id, published)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [post.title, slug, post.excerpt, post.content,
         post.state, post.category, post.tags, post.source_url, post.author_id]
      );
      insertedPostIds.push(result.insertId);
      console.log(`  [${post.state}] ${post.title}`);
    }

    // ---- Comments ----
    console.log('\nSeeding 6 comments...');
    for (const c of sampleComments) {
      const postId = insertedPostIds[c.postIndex];
      if (!postId) {
        console.warn(`  Warning: no post at index ${c.postIndex}, skipping comment.`);
        continue;
      }
      await conn.execute(
        'INSERT INTO comments (post_id, name, email, content) VALUES (?, ?, ?, ?)',
        [postId, c.name, c.email, c.content]
      );
      console.log(`  Comment by ${c.name} on post #${postId}`);
    }

    // ---- Subscribers ----
    console.log('\nSeeding subscribers...');
    const emails = [
      'traveller@example.com',
      'sarahlim@gmail.com',
      'explore.malaysia@yahoo.com'
    ];
    for (const email of emails) {
      await conn.execute('INSERT INTO subscribers (email) VALUES (?)', [email]);
      console.log(`  ${email}`);
    }

    // ---- Done ----
    console.log('\n============================================================');
    console.log('Database seeded successfully!');
    console.log('============================================================');
    console.log(`  Users:       3`);
    console.log(`  Posts:       ${posts.length}`);
    console.log(`  Comments:    ${sampleComments.length}`);
    console.log(`  Subscribers: ${emails.length}`);
    console.log('\nAdmin login credentials:');
    console.log('  Username : admin');
    console.log('  Password : Admin@123');
    console.log('============================================================\n');

  } catch (err) {
    console.error('\nSeeding failed:', err.message);
    console.error('Make sure:\n  1. MySQL is running\n  2. You ran schema.sql first\n  3. Your .env DB_* settings are correct');
  } finally {
    if (conn) await conn.end();
    process.exit(0);
  }
}

seed();
