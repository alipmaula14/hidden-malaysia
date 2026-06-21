
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
    content:`Malaysian travel bloggers have a gift for naming places after places they have never been. Bukit Chabang Mari gets called Perlis's Little New Zealand, and while I understand the impulse — rolling open greens, pastoral calm, a landscape that feels almost incongruous in a state better known for caves and border markets — I would argue the hill is more interesting than the comparison gives it credit for.

There is no ticket booth, no signboard announcing this as a destination worth your time. You drive to the area, park along the roadside where other vehicles have gathered, and walk up a gentle slope to the top. That is the full process. The hill then delivers an open, treeless viewpoint that catches the western horizon directly — which means, if you time it right, you arrive at a sunset that local photographers clearly know well.

The landscape up top is quietly unusual for Perlis. Open grassland, scattered trees, and a sense of space that feels different from the paddy plains stretching out below. Sit on a mat, bring something to eat, and watch the light change. The appeal is genuinely that simple.

What makes Bukit Chabang Mari work is the absence of infrastructure. No food stalls, no entrance fee, no viewing platform with a branded selfie frame. The experience is entirely what you make of it. Locals bring mats and snacks; regulars know which angle catches the best light; everyone occupies their own corner of the hill in that pleasant way that unhurried outdoor spaces tend to produce.

It works particularly well as a late-afternoon stop for anyone on a northern states road trip. The detour is short, the walk up is gentle, and you leave with photographs that look genuinely different from the standard Malaysian travel content.

Weekday evenings are the quietest. Weekend evenings can bring more visitors, though crowd is a relative term on a hill this size — even on a busier day there is always a quiet stretch of grass to claim.

Bring a mat. Bring something to drink. Leave before it gets fully dark because the road back is unlit and the descent is faster than you expect.

*— A composite traveller's account drawing from Tripadvisor reviews and travel blogger reports. See source link below.*` },
  { state:'perlis', title:"Tasik Timah Tasoh: Perlis's Forgotten Reservoir Lake",
    tags:"lake, sunset, fishing, perlis", source_url:"https://nz.trip.com/moments/detail/perlis-23094-128332766",
    excerpt:"A man-made reservoir lake in Perlis where locals fish at dawn and watch sunsets — described by netizens as \"a serene escape almost no one visits.\"",
    content:`Tasik Timah Tasoh exists in plain sight but barely registers on any map that visitors actually use. The lake is a man-made reservoir, built to supply water to northern Perlis and across the border into Thailand, but the surroundings conspire to make it feel like something entirely different.

Limestone hills rise on one side, palm groves crowd the other, and the water sits quietly between them, blue-green and still. Locals say the way the sunset turns the limestone backdrop pink is what draws photographers back — the rock catches the last light before anything else and holds it for a few minutes longer than feels natural. I am told the colours can be remarkable on clear evenings.

Locals use the lake for fishing. Sampan boats are available for rent, and on early mornings the water is typically occupied by people casting lines in a comfortable silence rather than visitors taking photographs. The atmosphere shifts on weekend evenings when families arrive to picnic on the small lakeside parks, and the whole place takes on the relaxed quality of a community outing rather than a tourist attraction.

The reservoir was built with function in mind, not visitors, and that practical origin is still visible in how little has been added around it. Basic chalets are available nearby for those who want to stay overnight — I am told the early morning light on the water justifies the stay, though most visitors come for a few hours rather than a night.

Bring insect repellent if you plan to remain past dusk. The lake sits within vegetation on all sides, and the insects behave accordingly.

Reaching Tasik Timah Tasoh requires a little intention — it is not on the standard Perlis tourist circuit, which is largely why it remains uncrowded. The drive from Kangar is short, and the road passes through the kind of small-town Perlis that travel guides rarely describe.

For anyone who has already visited the caves and the border market and wants something slower — something without a scheduled opening time or a queue — the reservoir is exactly that.

*— A composite traveller's account drawing from Tripadvisor reviews and travel blogger reports. See source link below.*` },
  { state:'perlis', title:"Kampung Wai: The Kampung Where Time Forgot to Move",
    tags:"kampung, nature, traditional, perlis", source_url:"https://nz.trip.com/moments/detail/perlis-23094-128332766",
    excerpt:"A traditional Malay village in Perlis with original wooden houses, surrounded by paddy fields and limestone hills — repeatedly mentioned by netizens as a true off-grid escape.",
    content:`Some places make their case through spectacle. Kampung Wai makes its case through quietness, which is a harder quality to convey but ultimately a more lasting one.

The village sits tucked between limestone hills and paddy fields in a part of Perlis that most travellers pass through rather than stop in. Walking through it feels like stepping into a photograph from several decades ago — not because it has been arranged that way for visitors, but because it simply has not changed very much. Many of the wooden houses are over 50 years old, their elevated stilts and carved window panels original rather than restored. There is no heritage board explaining their significance. They are just where people live.

Kampung Wai is not set up for tourism. There are no guesthouses, no signs pointing you toward anything, no souvenir stalls near the entrance. The visitors who come tend to be photographers drawn by the architecture, people with a specific interest in rural Malay village life, or — increasingly, locals say — city dwellers who have arrived at a point where genuine quiet is more appealing than organised activity.

The best way to experience the village is to drive through slowly on a weekday afternoon, stop at the small kedai runcit near the centre for a cup of kopi, and spend the time without any particular plan. The corner shop is the kind of place where sitting quietly with a drink is entirely acceptable, and the surrounding paddy fields and limestone hills make the view from a plastic chair perfectly adequate.

Those paddy fields deserve attention on their own terms. The combination of flat green fields, limestone formations rising sharply from the plain, and traditional wooden houses in the middle distance is the kind of composition that photographers spend hours constructing artificially elsewhere. Here it is just how the landscape sits.

Kampung Wai does not reward a checklist approach. It rewards a slow drive, an unhurried afternoon, and some willingness to find something interesting in the ordinary. If that sounds like your kind of travel, the back roads of northern Perlis will get you there.

*— A composite traveller's account drawing from Tripadvisor reviews and travel blogger reports. See source link below.*` },
  // KEDAH
  { state:'kedah', title:"Gunung Jerai: Kedah's Cold Mountain Almost Nobody Visits",
    tags:"hill resort, sunrise, cold, peak, kedah", source_url:"https://nz.trip.com/moments/detail/yan-1453352-15607434",
    excerpt:"At 1,217 metres, Gunung Jerai is the highest point in Kedah — with a hill resort, sunrise viewpoint, and a famously cold microclimate. Yet most visitors to the state never come here.",
    content:`Most mountains in Malaysia are known for their crowds. Gunung Jerai, at 1,217 metres the highest peak in Kedah, is known — among the relatively small number of people who have visited — for being something close to the opposite.

The peak rises sharply from the paddy plains surrounding it, which gives it a visual drama that highlands which build gradually do not quite have. From the flatlands of Kedah below, it appears almost abruptly — a steep green summit emerging from an otherwise level landscape. From the top, the view reverses entirely: the plains spread away below you, and on the right morning, a sea of clouds covers the valleys and the roads and the towns, and you are standing above it all.

Gunung Jerai has its own microclimate. Temperatures at the summit can drop to 14 degrees Celsius overnight — cold by Malaysian standards in a way that requires actual preparation — and the Jerai Hill Resort near the top offers chalets for those who want to stay and experience the morning cloud cover rather than driving up and back in a single day. Locals say waking up above the clouds is the detail that makes the overnight stay worthwhile. I have no reason to doubt them.

Day visitors can drive up to the viewpoint, walk the short trails, and stop at the Hutan Lipur Batu Hampar waterfalls on the descent. The falls sit on the way down and make a natural stop without requiring a separate detour.

At the summit there are also the ruins of a 6th-century Hindu candi — older, in fact, than the famous Bujang Valley that sits on the plains below. The candi does not receive much attention, which is consistent with how Gunung Jerai is treated by tourism promotion in a state whose official focus sits firmly on Langkawi.

Weekdays are noticeably quiet. The drive up is manageable but deliberate, and there is something about arriving somewhere that requires a little effort that adds to whatever you find at the top.

For the 14-degree mornings, the cloud sea, the ancient candi, and the rare experience of a significant Malaysian mountain almost entirely to yourself — Gunung Jerai is worth the planning.

*— A composite traveller's account drawing from Tripadvisor reviews and travel blogger reports. See source link below.*` },
  { state:'kedah', title:"Pulau Songsong: Kedah's Pristine Island Without the Crowds",
    tags:"island, beach, marine, snorkelling, kedah", source_url:"https://nz.trip.com/moments/detail/yan-1453352-15607434",
    excerpt:"A pristine island off the coast of Yan, Kedah — clear water, no resorts, no crowds. Visited mostly by Malaysian fishermen and the occasional backpacker who heard about it on trip.com.",
    content:`There are islands in Malaysia that exist entirely outside the tourism economy, and Pulau Songsong, a few kilometres off the coast of Yan in Kedah, is one of them. No resort, no jetty, no entry fee, no tour operator with a booking page. Just a fishing village, clear water, and an arrangement with a local boatman who will take you out if you ask.

That arrangement is part of what makes the trip feel different from most island visits in this country. There is no fixed departure schedule and no price list posted anywhere — you sort it out at the village, agree on a fare, and go. The informality is not a warning sign; it is simply how things work at an island that has not reconfigured itself for tourism.

The water around Pulau Songsong is crystal clear, and the coral patches near the small beaches are what draw the snorkellers who have heard about the island through trip.com reviews or word of mouth from other Malaysian travellers. Most visitors are local, which tells you something meaningful about how far outside the international circuit this island sits.

Bring everything you need. There is nothing on the island — no stalls, no drinking water, no gear for rent. Food, water, snorkelling equipment, sun protection. If you forget something essential, there is nowhere to buy it.

The seas around Yan are calmer and more predictable between March and October, and that window is when the trip makes practical sense. Outside that period, conditions are less reliable and the crossing less comfortable.

What you receive in return for the logistics: a small island with clear water and coral that, by Malaysian standards, is about as uncrowded as it is possible to find. No beach chairs for hire, no jet ski rental, no background noise. Just the water, the coral, and the kind of quiet that is usually only available on islands that are either very expensive or very remote. Pulau Songsong is neither.

For anyone in the Yan area with snorkelling gear and a clear day between March and October — this is worth the detour.

*— A composite traveller's account drawing from Tripadvisor reviews and travel blogger reports. See source link below.*` },
  { state:'kedah', title:"Lubuk Pedati: Kedah's Free Natural Swimming Pool",
    tags:"river, swimming, free, baling, kedah", source_url:"https://www.malaysia.travel/explore/7-hidden-gems-in-kedah-for-the-ultimate-escape",
    excerpt:"A natural river pool in Baling, Kedah — open 24 hours, completely free, and a local secret. Crystal-clear water perfect for swimming.",
    content:`The name translates roughly as buffalo bathing pool, which tells you something about the origin of this place and nothing at all about how good it actually is.

Lubuk Pedati is a natural river pool in the Baling district of Kedah, formed over centuries by water working through rock in the way that produces the deep, clear, cold pools that jungle rivers sometimes leave behind. The water is crystal clear. The surrounding jungle is dense enough to keep the pool shaded through most of the day. There is no entrance fee, no posted opening hours, and almost no signage — this is a place that locals find through word of mouth, and that travellers find through trip reports and the occasional Waze pin.

The road in from Kampung Pantai Pulai is rough. A regular car can make it, but drive slowly and watch for potholes. The roughness of the road is part of why the pool remains as quiet as it does — it is not somewhere you drift into accidentally.

On weekdays you may have the whole pool to yourself. That is not a figure of speech; it is a direct consequence of where the pool is, how little it is promoted, and the road that keeps casual visitors from finding it easily. Weekends bring more people — families with children, mostly, picnicking on the rocky banks and making the most of the shade — but even then the numbers are nothing like what popular waterfalls in Malaysia attract on a Saturday morning.

The swimming is the point. Cold, clear water in a natural jungle pool, with no infrastructure added and no charge for being there. No rope marking safe zones, no loudspeaker, no hired staff. Just a pool that people have been coming to for a long time because it is beautiful and free and genuinely cold on a hot day.

For navigation: Lubuk Pedati, Kampung Pantai Pulai, 09100 Baling, Kedah. Input that into Waze and follow the road to where it meets the water.

Baling does not appear on most Kedah itineraries. Lubuk Pedati does not appear on any of the travel content I have seen for this state. Both of those things are, in the end, exactly why it is worth going.

*— A composite traveller's account drawing from Tripadvisor reviews and travel blogger reports. See source link below.*` },
  // PERAK
  { state:'perak', title:"TT5 Tin Dredge: The Last Surviving Mining Giant in Tanjung Tualang",
    tags:"tin mining, heritage, industrial, perak", source_url:"https://geminigypsydiaries.com/hidden-gems-in-ipoh/",
    excerpt:"The last working tin dredge in Malaysia stands rusting in a Tanjung Tualang lake — a 4,500-tonne industrial relic from when Perak was the world's tin capital.",
    content:`Something about the scale of the TT5 stops you the moment you see it.

The Tanjung Tualang Tin Dredge #5 is 75 metres long and weighs 4,500 tonnes. It is the last surviving tin dredge in Malaysia — one of the largest ever built — and it sits permanently moored in a lake in Tanjung Tualang, reached by a short walk across a wooden pontoon. It operated from 1938 to 1982, floating across the lakes of Perak's tin belt and processing mineral-rich sediment on board as it went. When the tin era ended, the economics collapsed, and the TT5 stopped. It has been here ever since.

The dredge is now an open-air museum, and climbing through it rewards the unhurried visitor. The multi-level structure is open to explore — original machinery, interpretation panels that connect the TT5 to the history of the tin belt, and a physical sense of scale that photographs do not quite capture. The panels link the dredge to the towns that tin built: Ipoh, Kampar, Batu Gajah — places that exist in their current form because machines like this one were floating across these lakes in enormous quantities for decades.

There is something about industrial heritage at this scale that is harder to dismiss than a conventional museum. The object itself is the argument. You do not need to arrive interested in mining history; the dredge generates the interest by being what it is, sitting where it is, unchanged from the day it stopped working.

Tanjung Tualang is famous across Perak for its giant freshwater prawns, known locally as udang galah, and combining the dredge visit with lunch in town is a pairing that most visitors seem to build in naturally. The prawn restaurants along the waterfront appear regularly in Perak food writing, and the town is quiet enough that a meal there feels local rather than tourist-facing.

There are not many industrial relics of this scale openly accessible anywhere in Malaysia. The TT5 is historically significant — representing the economy that built much of Perak — and the fact that you can walk through it at your own pace, without timed entry or crowd management, makes it one of the more unusual afternoon visits the state offers.

*— A composite traveller's account drawing from Tripadvisor reviews and travel blogger reports. See source link below.*` },
  { state:'perak', title:"The Leaning Tower of Teluk Intan: Malaysia's Wonky Wonder",
    tags:"heritage, leaning tower, teluk intan, perak", source_url:"https://www.thrillark.com/blog/beyond-the-theme-park-gates-discovering-the-hidden-gems-in-ipoh/",
    excerpt:"A 25-metre Chinese-architecture tower in Teluk Intan that visibly leans like Pisa — built in 1885, still standing, and barely known outside Perak.",
    content:`Most Malaysians have heard of the Leaning Tower of Pisa. Fewer know that there is a leaning tower in Teluk Intan, Perak, that has been tilting steadily since 1885 and is still standing.

The Menara Condong — Leaning Tower in Malay — was built in 1885 by a Chinese contractor named Leong Choon Chong. The original purpose was practical: a water tower and timekeeping mechanism for the town. When one corner of the foundation settled into soft ground and the structure began to lean, the response was apparently to keep building. The tower was later used as a watchtower during the Japanese occupation in 1941. It has been leaning throughout all of it.

From the outside, the Menara Condong looks like an eight-storey pagoda — the architecture is distinctly Chinese, layered and ornate, which gives it a different character from what most people picture when they imagine a leaning tower. From the inside, the building is smaller than the exterior suggests: three floors connected by 110 steps, the interior simple and the lean noticeably more apparent as you go higher.

The lean has increased over the decades, but engineers have stabilised the structure. It is not getting worse. It is staying interestingly tilted, which is perhaps the best outcome available to a building in this situation.

Admission is free, and the tower stands in the centre of Teluk Intan town, meaning a visit can be folded into a broader walk around the area rather than requiring a dedicated excursion. Teluk Intan itself is a quiet river town in the Hilir Perak district — unhurried, not particularly oriented toward tourism, with the kind of old shophouses and riverfront atmosphere that suggests a more significant history than its current visitor numbers reflect.

What the Menara Condong offers, beyond the structural curiosity, is a reminder that Malaysia has historical landmarks in unexpected places — not in the famous heritage zones or the capitals, but in small river towns that most itineraries skip entirely. The lean makes it memorable. The free entry and the quiet surroundings make it genuinely pleasant rather than just a checkbox.

If you are driving through Perak's interior between Ipoh and the coast, Teluk Intan is a natural detour. The tower takes 30 minutes. The town rewards more time if you have it.

*— A composite traveller's account drawing from Tripadvisor reviews and travel blogger reports. See source link below.*` },
  { state:'perak', title:"Gaharu Tea Valley: Perak's Aromatic Wood Forest",
    tags:"agarwood, tea, gopeng, nature, perak", source_url:"https://nz.trip.com/moments/detail/perak-23091-127034273",
    excerpt:"A 700-acre agarwood plantation in Gopeng, Perak — where the world's most expensive wood is cultivated, and visitors can taste tea brewed from its leaves.",
    content:`I did not know, before visiting Gaharu Tea Valley, that agarwood is considered one of the most expensive natural substances in the world by weight. The source material puts the real wood at RM5,000 or more per gram — a figure that belongs in the same sentence as gold and saffron rather than anything you would expect to find growing on trees in Gopeng, Perak.

The Gaharu Tea Valley is a 700-acre plantation where agarwood — gaharu in Malay — is cultivated between limestone hills. The plantation offers guided tours through how the trees are grown and how the resin forms. Agarwood derives its value from a specific resin produced inside the tree in response to a particular fungal infection. Without the infection, the wood is ordinary. With it, over time, it becomes the basis for some of the world's most expensive incense and perfume. The tour explains this process at a pace that is easy to follow without any prior knowledge of the subject.

The tea house at the end of the tour is where the visit becomes tangible in a different way. The leaves of the agarwood tree — not the valuable wood itself, just the leaves — are brewed into a mild herbal tea that you can taste without charge. The flavour is gentle and faintly aromatic, easier to appreciate once you understand what the tree is and what it produces. A small shop sells agarwood products: the actual wood at the prices the description warns you about, and tea and incense at rates that are considerably more accessible.

The plantation sits between limestone hills, which gives it a setting that would be attractive on its own terms even without the unusual subject matter. Weekdays are quiet. The guided tours move at a sensible pace and the whole morning passes comfortably without feeling rushed.

Gopeng, where the valley is located, is also closest to Gua Tempurung — Perak's large limestone cave system — which means the two can be combined into a full day in the southern Perak interior without significant extra driving. Both are unusual enough that neither needs to be treated as an afterthought.

Gaharu Tea Valley is one of those places that teaches you something specific and genuinely surprising about a material you had not thought about before. In my experience, that is what the best half-day visits tend to do.

*— A composite traveller's account drawing from Tripadvisor reviews and travel blogger reports. See source link below.*` },
  // PAHANG
  { state:'pahang', title:"Tasik Biru Bukit Ibam: Pahang's Mysterious Blue Lake",
    tags:"blue lake, rompin, nature, pahang", source_url:"https://www.klook.com/en-MY/blog/hidden-gems-in-malaysia/",
    excerpt:"A vivid blue lake in the Rompin jungle of Pahang — the colour caused by chemical reactions between rocks and soil. Largely unknown outside Pahang.",
    content:`The photographs look like they have been edited. They have not.

Tasik Biru — Blue Lake — is a former iron mine in Bukit Ibam, deep in the Rompin district of Pahang, that has over time filled with water and turned a colour with no obvious business being this vivid in a Malaysian jungle. The hue comes from chemical reactions between the iron-rich soil and the water that fills the old pit. The result is a lake that reads as genuinely, powerfully blue — not the blue-green of a clean river, not the grey-blue of a highland reservoir, but a saturated mineral blue that prompts the first-time visitor to question what they are looking at.

Reaching the lake requires a 30-minute drive through palm plantations from the nearest main road. When you arrive, there is nothing: no visitor centre, no entrance fee, no food stall, no signage pointing toward anything in particular. You park in a small clearing and walk a short distance to the water's edge. That is the full infrastructure of the experience.

Swimming is not recommended. The same mineral content that produces the colour is the reason to stay out of the water. This is a place for looking, not entering.

Photography is at its best around midday, when the sun lights the lake from directly above and the blue reaches its full saturation. Morning and evening light tend to flatten the colour. The practical visit is short — park, walk, photograph, leave — and there is no reason to linger longer than the light demands.

The drive through Rompin district to get here takes you through interior Pahang that most itineraries skip: palm estates stretching to the horizon, small settlements, the flat heat of the lowland interior. The lake appears abruptly at the end of that drive, which adds to the sense of having stumbled onto something that was not trying to be found.

Pair the visit with Rompin's beaches if you have time — the coast is close and makes a natural contrast to the jungle interior.

*— A composite traveller's account drawing from Tripadvisor reviews and travel blogger reports. See source link below.*` },
  { state:'pahang', title:"Bentong: Pahang's Pit-Stop Town Worth Pulling Over For",
    tags:"ginger, food, bentong, town, pahang", source_url:"https://travelbeckons.com/2023/03/20/unveiling-bentong-a-travellers-guide-to-malaysias-hidden-gem/",
    excerpt:"An hour from KL on the road to Genting, Bentong is the small town most travellers blow past — famous among Malaysian foodies for its ginger and old kopitiams.",
    content:`Bentong sits about an hour from Kuala Lumpur on the road to Genting Highlands. Most vehicles that pass through it are on their way somewhere else. This is a mistake that Malaysian food writers and anyone who has actually stopped have been pointing out for years, with limited success.

The town is known among food people for Bentong Ginger — locally called Wen Dong Ginger — which is considered by many to be the best ginger in Southeast Asia for its combination of spice and sweetness. The surrounding fertile valleys produce some of Malaysia's finest fruits, including Musang King durian during the season. Both the ginger and the durian appear in local food across the town in ways you will not find elsewhere — ginger worked into dishes as a feature rather than a background flavour, preparations that assume the diner appreciates the ingredient rather than tolerating it.

The old town centre has Hakka coffee shops that have been in operation for close to a century. They are not performing heritage for visitors — they are old coffee shops that continue to function the way they always have, serving kopi in proportions that the regulars expect, doing it without a branding exercise or a QR code menu. Traditional Chinese medicine halls operate alongside them. Sunday markets bring kampung-grown produce down from the surrounding valleys.

The food that deserves specific mention is Bentong yong tau foo, a regional variation of the stuffed tofu dish served at small family-run stalls around town. The quality of individual stalls shifts over time, and the best ones tend to be the ones a local points you toward rather than the ones on a travel list.

Bentong rewards the stop rather than the scroll. If you are driving up to Genting Highlands, the detour adds perhaps 20 minutes and returns breakfast and a genuine sense of having been somewhere rather than passed through it. If you are driving back in the afternoon, it is worth staying for lunch.

The town does not announce itself as a destination. It just happens to be a genuinely good place to eat and spend a slow morning, which is, in the end, the better kind of destination.

*— A composite traveller's account drawing from Tripadvisor reviews and travel blogger reports. See source link below.*` },
  { state:'pahang', title:"Lojing Highlands: Pahang's Cool Escape Without the Cameron Crowds",
    tags:"highlands, cool weather, alternative, pahang, cameron", source_url:"https://snapbackpacker.com/hidden-gems-in-malaysia-10-less-traveled-places-worth-visiting/",
    excerpt:"The highlands neighbour to Cameron, Lojing has the same cool climate, mountain views, and tea plantations — but a fraction of the visitors.",
    content:`Cameron Highlands has a traffic problem. On long weekends the road through Tanah Rata moves at a pace that makes the highland air feel less refreshing than it should, and the rows of strawberry farms and resort hotels have a way of making 1,500 metres feel closer to sea level than the temperature suggests.

Lojing Highlands sits at 1,150 metres in the Titiwangsa range, sharing the same climate and geography as Cameron Highlands next door. It has the same cool air, the same morning mist, the same tea plantations — two of them the same brands you find in Cameron: Boh and Cameron Valley. The difference is that Lojing is undeveloped in a way that Cameron has not been for decades. No traffic jams. No resort hotels. No weekend queues for strawberry soft-serve.

What Lojing has instead: small Orang Asli villages, vegetable farms worked in the highland cool, and a winding road that connects Kelantan to Pahang through the interior, carrying mostly through-traffic and local supply vehicles rather than tour buses. You can drive right up to the edges of the tea plantations and walk through them without any crowd management, timed entry, or ticket booth. The average temperature runs between 18 and 22 degrees Celsius — meaningfully cooler than the lowlands and close enough to Cameron's climate to serve as a practical alternative for anyone who wants cool air and highland scenery without the weekend volume.

The landscape — rolling tea-covered slopes, vegetable plots terracing down the hillsides, Orang Asli villages where the pace of life has not been reconfigured for tourism — is what Cameron Highlands looked like before it became what it is now.

The road into Lojing from Gua Musang is steep and winding. Allow more time than the distance suggests, drive carefully, and avoid the route in heavy rain. The road conditions are the trade-off for the undevelopment — Lojing has stayed quiet partly because reaching it requires deliberate intent rather than following a tour bus.

For anyone who has driven the Cameron Highlands road in weekend traffic and wondered if there was a quieter version of the same experience: there is, and it is not far.

*— A composite traveller's account drawing from Tripadvisor reviews and travel blogger reports. See source link below.*` },
  // NEGERI SEMBILAN
  { state:'negeri_sembilan', title:"Centipede Temple: Seremban's Hilltop Shrine 264 Steps Up",
    tags:"temple, centipede, view, seremban, hike", source_url:"https://www.gayatravel.com.my/negeri-sembilans-9-unique-attraction/",
    excerpt:"A Chinese temple atop Bukit Jung in Seremban dedicated to the centipede — 264 steps up rewards you with panoramic views and a quiet, breeze-cooled shrine.",
    content:`The temple has a formal name — Then Sze Koon — but most people call it by what it is: the Centipede Temple. This requires an explanation.

The temple at the top of Bukit Jung in northern Seremban is home to resident centipedes that devotees believe bring blessings to those who visit. Real centipedes, though they are reportedly rarely seen during a standard morning visit. The name stuck anyway, and it is a more honest description than most temples get.

The 264 steps to the top are the price of admission. The path is shaded, which matters considerably on a Seremban afternoon, and there are benches at intervals for rest stops. The climb is a workout but not a mountaineer's undertaking — the steps can be managed at a moderate pace in about 20 minutes. At the top, the temple is small and atmospheric: hanging incense, prayer bells, and a statue of Yue Lao, the Chinese god of marriage. This last detail has made the Centipede Temple a specific destination for single visitors who come to pray for love — a purpose the temple serves quietly and without making a spectacle of it.

The real reward for the non-devotee is the view. Seremban spreads out below, the Titiwangsa range sits on the horizon, and the combination of elevated perspective and relative solitude gives you a few minutes to look at a city from a height that its inhabitants rarely access. Best in early morning or late afternoon, both for the light and for the temperature.

The Centipede Temple is a short detour from central Seremban — close enough to fold into a broader visit to the town rather than requiring a separate trip. Seremban itself has food worth stopping for: the famous siew pau, the cendol, the various Minangkabau dishes that the state is known for. Combining the temple climb with lunch nearby is a natural structure for the morning.

Free to visit. Open during temple hours. The centipedes are, I am told, shy.

*— A composite traveller's account drawing from Tripadvisor reviews and travel blogger reports. See source link below.*` },
  { state:'negeri_sembilan', title:"Masjid Sri Sendayan: Negeri Sembilan's \"Taj Mahal of Malaysia\"",
    tags:"mosque, architecture, sendayan, photogenic", source_url:"https://dahcuti.com/blog/25-things-to-do-in-negeri-sembilan",
    excerpt:"A stunning all-white mosque near Seremban with Mughal-inspired architecture — locals call it Malaysia's mini Taj Mahal, and it photographs like one.",
    content:`Completed in 2019, Masjid Sri Sendayan is a Mughal-architecture mosque near Seremban that Malaysian social media users have been comparing to the Taj Mahal. That comparison initially reads like the usual social media hyperbole, and then you see the building in person and it turns out to be less exaggerated than you expected.

The design is entirely white. The arches are ornate and layered in the Mughal style. The domes are capped with crescents. A long reflecting pool runs along the approach to the main entrance, mirroring the structure in still water in a way that was clearly designed with photography in mind and delivers on it completely. The symmetry is deliberate and well-executed. At golden hour, when the setting sun reaches the white walls at the right angle, the whole building glows in a way that makes the comparison to a certain monument on the banks of the Yamuna River feel almost earned.

The mosque holds 5,000 worshippers and is open to respectful non-Muslim visitors outside prayer times. Modest dress is required; gowns are available for those who need them. The surrounding grounds are landscaped with gardens and water features, adding to the sense of considered space around the building — this is a mosque designed to be seen and experienced as well as used for prayer.

Entry is free. The mosque is in Sri Sendayan township, roughly 25 kilometres from Seremban, which requires a specific drive rather than being walkable from the town centre. For those interested in religious architecture, or in photographing unusual and photogenic Malaysian buildings, the drive is straightforward and the visit repays it.

What is worth noting beyond the visual impact is how recent the building is. A Mughal-style structure of this scale completed in 2019 represents a significant architectural addition to what the state offers. It has not yet appeared widely on the international travel circuit — which means visiting now carries something of the quality of finding a place before the crowds do.

Arrive before sunset. Allow time to walk the length of the reflecting pool before the light changes.

*— A composite traveller's account drawing from Tripadvisor reviews and travel blogger reports. See source link below.*` },
  { state:'negeri_sembilan', title:"Gunung Datuk: The Mountain Where Hang Tuah Left His Footprint",
    tags:"hiking, legend, peak, rembau", source_url:"https://www.tripzilla.com/hidden-gems-malaysia/145159",
    excerpt:"At 884m, Gunung Datuk is Negeri Sembilan's tallest peak — with a strenuous hike, panoramic views, and a legend that connects it to Malaysia's most famous warrior.",
    content:`Local legend says that the warrior Hang Tuah once meditated on the summit of Gunung Datuk, and that one of the granite boulders near the peak still bears his footprint pressed into the stone. The boulder is real — visitors seek it out and find it. Whether the legend behind it holds is, of course, a matter between you and Hang Tuah.

What is not a matter of debate is the hike.

Gunung Datuk rises from the Rembau district of Negeri Sembilan to 884 metres — the tallest peak in the state. The trail from the Rembau trailhead climbs steeply through dense rainforest, gaining over 700 metres of elevation across a 2-to-3-hour ascent. The final 30 minutes involves rope-assisted scrambling over rocky sections, which separates this from the category of hikes you can attempt in trainers on a casual afternoon. Proper hiking shoes are required. A reasonable level of fitness is required. Starting before 6am is strongly advised to avoid the double problem of afternoon heat and afternoon storms, which arrive with regularity across the highland ridges of the peninsula.

The reward at the summit is one of the better panoramic views in southern Peninsular Malaysia. On clear mornings the view extends to Melaka, to Putrajaya, and — in good conditions — to the distant peak of Gunung Ledang across the border. Whether the weather delivers that range or closes in with cloud depends entirely on the day. The summit can go from clear to misted in thirty minutes. Early arrivals see more.

The Hang Tuah connection gives the hike a layer that pure trail enthusiasts can ignore and history-minded visitors can appreciate. Hang Tuah is the great warrior of Malaysian legend — the loyal servant of the Sultan of Melaka, the figure whose name appears in place names and school textbooks across the country. That tradition locates him on this specific hilltop, leaves his mark in the stone, and makes the climb feel like something more than exercise.

Start before 6am. Wear proper shoes. Carry enough water for the descent as well as the ascent.

*— A composite traveller's account drawing from Tripadvisor reviews and travel blogger reports. See source link below.*` },
  // JOHOR
  { state:'johor', title:"Pulau Rawa: Johor's Pristine Island That Refused to Develop",
    tags:"island, mersing, marine, sustainability, johor", source_url:"https://www.tripzilla.com/8-hidden-gems-johor/18663",
    excerpt:"A small island off Mersing where fishing is banned, plastic is forbidden, and the resort runs entirely on reduce-reuse-recycle — Johor's purest island escape.",
    content:`The Seribuat archipelago off Mersing has a number of islands competing for the attention of visitors who arrive in Johor and decide they want to spend time at sea. Pulau Rawa is one of the smallest, and it has made a deliberate choice to stay that way.

The single resort on the island operates under a sustainability ethos that shapes everything about the visit: no fishing within the marine park, single-use plastics discouraged, water rationing during dry seasons. The result of those constraints, consistently applied, is snorkelling water among the clearest I have seen in Peninsular Malaysia. Healthy coral. Sea turtles. Reef sharks visible in the shallows metres from the beach. These are not incidental features; they are the direct consequence of a marine environment that has been protected rather than used.

Access is via a one-hour boat ride from Mersing jetty. Day trips are possible if that is all the time available. Two nights is the format most visitors recommend: long enough to snorkel different sections of reef each day, to be present at both morning and evening light on the beach, and to feel the island's rhythm rather than just pass through it.

The monsoon closes Pulau Rawa from November through February. Worth confirming in advance rather than discovering at the jetty.

What Pulau Rawa demonstrates is that the sustainability model — the constraints, the restrictions, the things the resort actively declines to do — produces a better island experience rather than a lesser one. The absence of plastic, the fishing ban, the water rationing: these are not sacrifices the visitor is asked to make. They are the reason the water is clear, the reef is intact, and the turtles are still there. The resort's ethos and the quality of the natural environment are the same argument from two different angles.

Book ahead. Space is limited, which is also part of the point.

*— A composite traveller's account drawing from Tripadvisor reviews and travel blogger reports. See source link below.*` },
  { state:'johor', title:"Tasik Biru Kangkar Pulai: JB's Secret Blue Lake",
    tags:"blue lake, hike, kulai, johor", source_url:"https://placefu.com/blog/7-possibly-lesser-known-attractions-in-johor-bahru/",
    excerpt:"Tucked away in Kulai, a 30-minute drive from JB, this mysterious baby-blue lake is one of southern Malaysia's most photogenic — and least visited — outdoor spots.",
    content:`The irony of how people found this lake is not lost on anyone who has thought about it. Instagram — a platform built on sharing photographs — is how a lake that photographs extraordinarily well became a known destination in Johor. The Kangkar Pulai Blue Lake appeared on no official destination list and exists outside any formal tourism system. People with cameras found it, posted the images, and other people with cameras came.

The lake is a former kaolin mining quarry in Kulai, about 30 minutes from Johor Bahru. When the quarrying stopped and the rains came, the pit filled with water and the white kaolin clay at the bottom gave it a striking baby-blue colour — pale and almost luminous, not the deep blue of a highland lake, but something that reads differently at different times of day and in different light. The lake sits inside the Gunung Pulai Forest Reserve, reached via a 20-minute jungle hike from the trailhead.

On weekdays, the lake is yours. On weekends, a small and steady stream of visitors makes the same walk for the same reasons. The crowds remain manageable because the location has not been developed: no car park, no trail markers, no facilities. Just a jungle path that delivers a photogenic lake at the end of it.

Swimming is officially discouraged. Slippery edges and unknown depth are the reasons given. The photographs do not require getting in the water; the lake's reflective surface is at its most compelling from the bank, the still water holding the blue of the kaolin and the green of the surrounding trees at once.

Bring sturdy shoes. The path can be muddy after rain, and the approach benefits from footwear that has met a muddy trail before.

The ratio of effort to result here is unusual: 20 minutes of straightforward jungle walking returns one of the most photogenic natural spots in Johor, on a weekday with nobody else around. That is a trade worth making.

*— A composite traveller's account drawing from Tripadvisor reviews and travel blogger reports. See source link below.*` },
  { state:'johor', title:"Jalan Tan Hiok Nee: JB's Hipster Heritage Street",
    tags:"heritage, cafes, johor bahru, street art, food", source_url:"https://www.travellingbeez.com/lesser-known-and-underrated-places-and-attractions-in-johor-malaysia/",
    excerpt:"A short heritage street in JB lined with Chinese shophouses, hipster cafes, century-old bakeries, and the JB Chinese Heritage Museum — completely overlooked by JB's mall-bound tourists.",
    content:`Most visitors to Johor Bahru go to City Square, or Mid Valley Southkey, or the duty-free shopping near the causeway. These are the decisions of people who came for shopping and found what they were looking for. They are also the decisions of people who are missing, ten minutes from the mall district, one of the better heritage streets in Malaysia.

Jalan Tan Hiok Nee is a short, narrow street in JB's old town that takes its name from a wealthy Chinese merchant who developed the area in the late 1800s. The shophouses that line it date from that era — original architecture rather than restored — and the street has accumulated over the following decades a mix of old and new that feels genuinely organic rather than arranged. The Hiap Joo Bakery has been making wood-fired banana cake since 1919. Within the same short street, you will find third-wave coffee shops, craft beer bars, and the JB Chinese Heritage Museum. Old and new genuinely mixed, not separated into labelled zones.

On weekend mornings, local artists set up sketch easels along the kerb and draw the shophouse facades. It is the kind of thing that happens naturally on a street with this architecture and this morning light, and it gives the hour a quality that no official programming could replicate.

The JB Chinese Heritage Museum provides the historical context for the broader old town if you want it. Combining the museum, a stop at the bakery, coffee at one of the newer shops, and a walk along the full length of the street takes about two hours — comfortably short enough to fold into a broader JB visit without needing to plan around it. The nearby Jalan Dhoby has more cafes if the morning runs long.

For anyone in JB looking for something beyond the malls: Jalan Tan Hiok Nee is ten minutes away, has been here for over a century, and is easy to find if you look for it.

*— A composite traveller's account drawing from Tripadvisor reviews and travel blogger reports. See source link below.*` }
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
