
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
    content: `There are caves you visit, and caves that stay with you. Gua Kelam, tucked into the forested hills of Wang Kelian about 35 kilometres from Kangar, is firmly the second kind.

I arrived early — before the humidity had time to settle — and already the entrance was changing the air around me. Cooler, damp, carrying that faint mineral smell that limestone caves always seem to exhale. A wooden walkway stretches the full 370 metres through the cave, running above the underground river that flows through the rock. That river is the quiet heart of Gua Kelam. It moves silently below the boards, dark and clear at once, catching whatever thin light makes it down from the entrance behind you.

The cave earns its name honestly. Gua Kelam means Dark Cave in Malay, and there are stretches inside where the darkness feels genuinely complete — the only sounds your own footsteps on the planks and the drip of water somewhere deeper in the rock. I will admit it is a little unnerving, in the best possible way. Then, without much warning, the rock opens and you step out into jungle light so sudden and green that it takes a moment to adjust. That exit — from near-total darkness to open canopy in roughly twenty steps — is the detail I keep returning to.

The walk through takes fifteen to twenty minutes at a relaxed pace, and it does not need to be longer. The walkway above a real underground river, the formations above, and that blinding jungle exit make this more memorable than caves three times its size.

Outside, the Sungai Wang waterfall is worth the short detour. The forest paths are gentle and shaded, which makes Gua Kelam a proper half-day outing rather than a quick stop. Bring water — the humidity outside the cave will find you quickly once you are back in open air.

Weekday mornings are noticeably quieter. Wang Kelian is about 35 kilometres from Kangar, and the distance keeps the bigger tour groups away. Entry is affordable — a small fee at the gate. If you are driving up from Kangar, the road through paddy fields and kampungs is scenic enough that the journey feels worthwhile in itself.

What surprised me was how wild it still feels inside. Commercial caves in Malaysia tend toward floodlit grandeur and recorded commentary. Gua Kelam is neither. It is dark, unhurried, and genuine — and the wooden walkway above an actual flowing river gives the whole visit a quality that is hard to manufacture.

Go early. Leave slowly. Stop at the waterfall on the way out.

*— A composite traveller's account drawing from Tripadvisor reviews and travel blogger reports. See source link below.*`,
    state: 'perlis', category: 'nature',
    tags: 'cave, nature, hiking, perlis',
    source_url: 'https://jomexplore.io/article/17732/netizen-kongsi-5-hidden-gems-yang-anda-boleh-teroka-di-perlis',
    author_id: 1
  },
  {
    title: "Wang Kelian Sunday Market: The Border Market Hidden in the Hills",
    excerpt: "A hilltop border market where Malaysia meets Thailand — fresh produce, local snacks and sweeping mountain views, all before noon on Sundays.",
    content: `The alarm was set earlier than I would usually allow on a Sunday. Markets in Malaysia reward the early riser and punish the lazy, and Wang Kelian's weekly border market is no exception — by ten in the morning, I am told, the best of the fresh produce is gone and the traders are quietly starting to pack.

Wang Kelian sits on the hills at the Malaysia-Thailand border in the northern tip of Perlis, and every Sunday morning traders from both sides of the border set up side by side on the hillside. Fresh tropical fruits, Thai-style snacks, batik cloth, dried goods you genuinely would not find in any city supermarket — the range surprises you, and so does the price. Produce arriving direct from small farms on both sides of the border tends to be considerably more affordable than what you encounter at urban markets further south.

What strikes you first, though, is not the food. It is the setting. The market occupies a hillside, and on a clear morning the views are spectacular — rolling hills in every direction, stretching away into southern Thailand, the border visible from certain stalls. I have been to Sunday markets across the country and I cannot think of another one where the backdrop genuinely competes with the produce for your attention.

The mountain views alone are worth an early alarm. Locals say that on clear mornings the ridgeline extends well into Thailand, the hills folding away in layers of green. Even on a hazy day, the elevated position and the border setting give the market an atmosphere that most pasar minggu simply do not have.

Practical notes: the market wraps up before midday, so arriving early is genuinely important rather than just good advice. Parking can get tight when the crowds are in — if you are driving, aim for eight or nine in the morning. After the market, the Wang Kelian State Park nearby offers short jungle walks that make a natural extension to the morning if you want to stretch the trip into a proper half-day.

The drive up from Kangar takes you through paddy fields, small kampungs, and a gradual climb into the hills. It is one of those roads that is part of the experience rather than just the transport to it. Leave enough time to take it slowly.

*— A composite traveller's account drawing from Tripadvisor reviews and travel blogger reports. See source link below.*`,
    state: 'perlis', category: 'culture',
    tags: 'market, border, culture, food, perlis',
    source_url: 'https://jomexplore.io/article/17732/netizen-kongsi-5-hidden-gems-yang-anda-boleh-teroka-di-perlis',
    author_id: 1
  },
  {
    title: "Tasik Melati: Perlis's Secret Lotus Lake",
    excerpt: "A serene lotus lake near Arau town, near-empty on weekdays and stunningly beautiful during the lotus blooming season.",
    content: `Most people passing through Perlis are on their way somewhere else — catching a ferry to Langkawi, crossing into Thailand, heading north along the highway. Arau, the royal town, barely registers as a stop. Which is precisely why Tasik Melati, sitting quietly just outside town, remains one of the most genuinely unhurried places I have found in the northern states.

The lake is named after the melati flower, and during the blooming season it earns that name completely. The water surface fills with lotus blooms in pink and white — not arranged like a hotel garden, but spread naturally the way lotus does when left to its own rhythm. I arrived on a weekday morning and had the wooden walkway almost entirely to myself. The walkway is a simple plank path that extends out over the water, putting you in among the blooms with the stillness of an early morning and no ambient noise beyond distant birdsong.

The light at that hour is soft and low. Photographs practically take themselves.

The lake sits within a small public parkland, and the facilities are basic in the right way — a few benches, shaded areas, everything functional rather than designed for a particular kind of visitor. Local joggers use the path around the lake in the mornings, and there is a gentle community feel to the whole place that comes from people simply using a nice park near their homes. Nobody is performing tourism here.

Entry is completely free, which still surprises people when they find out. No ticket booth, no guide, no souvenir stall at the gate. You park, walk to the lake, and stay as long as the mood holds.

The best time to visit is early morning on a weekday. The lotus blooms are most photogenic in soft morning light, the crowds are at their lightest, and the air is cool enough to make a walk around the lake pleasant rather than an endurance exercise. Weekend afternoons bring more people and more heat; neither improves the experience much.

If you are on the road between Kangar and the Thai border, Tasik Melati is a half-hour detour that will make you glad you stopped. A free, beautiful, quiet lake that most travellers drive straight past without knowing it is there.

*— A composite traveller's account drawing from Tripadvisor reviews and travel blogger reports. See source link below.*`,
    state: 'perlis', category: 'nature',
    tags: 'lake, lotus, nature, peaceful, perlis',
    source_url: 'https://jomexplore.io/article/17732/netizen-kongsi-5-hidden-gems-yang-anda-boleh-teroka-di-perlis',
    author_id: 1
  },

  // ---- KEDAH ----
  {
    title: "Lembah Bujang: Malaysia's Oldest Civilisation Hidden in Kedah",
    excerpt: "Ancient Hindu-Buddhist ruins in Kedah that predate Angkor Wat — one of Southeast Asia's most significant archaeological sites, yet barely visited.",
    content: `Malaysia has a habit of underselling its own history, and Lembah Bujang is the most striking example of that habit I have come across. The valley near Merbok in Kedah holds the remains of one of the oldest known civilisations in Southeast Asia — Hindu-Buddhist temples, candi structures, and artefacts from a maritime trading culture that archaeological evidence places as far back as the 4th century AD. That predates Angkor Wat in Cambodia. Most Malaysians I have mentioned this to had no idea.

I came on a weekday, which meant I had long stretches of the outdoor ruins almost entirely to myself. The valley is spacious and open — you walk between candi structures through a landscape that feels both archaeological and quietly natural at once, limestone hills visible in the distance, grass growing around stone foundations that have been here for the better part of two thousand years. There is no rope barrier between you and the structures, no crowd pressing in from behind. Just the ruins, the morning heat, and the intermittent sound of birds.

The Lembah Bujang Archaeological Museum, which anchors the site, is worth spending time in before you walk the outdoor sections. It houses recovered artefacts and provides the kind of context that makes the ruins mean something rather than just look old — trading weights, ceramics from India and China, architectural fragments that tell the story of a civilisation sitting at the centre of maritime trade routes that once connected two continents. The museum offers guided tours; I would recommend using one if available.

Rated 4.5 out of 5 on Tripadvisor, and yet visitor numbers remain low enough that you will rarely feel crowded here. That gap between the quality of the experience and the number of people who know about it is one of those Malaysian tourism puzzles that seems to have more to do with marketing priorities than with anything lacking at the site itself.

Entry is free. The valley is located near Merbok, accessible by car, and the surrounding Kedah paddy country on the drive in is flat and quiet, which makes the limestone hills and ancient stone structures feel more dramatic when they appear.

Lembah Bujang does something that few historical sites manage: it changes your mental map of the region. Malaysia is easy to think of as a relatively young country — colonial-era towns, recent highways, modern cities. The valley makes clear that this land has been significant, connected, and inhabited by complex civilisations for a very long time before any of that arrived.

Entry is free. Go with patience rather than a schedule.

*— A composite traveller's account drawing from Tripadvisor reviews and travel blogger reports. See source link below.*`,
    state: 'kedah', category: 'culture',
    tags: 'history, archaeological, ruins, ancient, kedah',
    source_url: 'https://www.tripadvisor.com.my/Attractions-g298281-Activities-zft12156-Kedah.html',
    author_id: 1
  },
  {
    title: "Tanjung Rhu Beach: Langkawi's Best-Kept Secret Shore",
    excerpt: "Far from Cenang's beach clubs and crowds, Tanjung Rhu is Langkawi's most beautiful and least visited beach — white sand, clear water, perfect sunsets.",
    content: `Most visitors to Langkawi land, take a Grab to Pantai Cenang, spend three days at beach clubs and duty-free shops, and leave without knowing that the island has a second beach — quieter, more beautiful, and 45 minutes to the north — that consistently outscores Cenang in every review metric that matters.

Tanjung Rhu sits at the northern tip of Langkawi. The sand is white and clean, the water calm and clear, and the beach is flanked on both sides by towering limestone karst formations that glow orange at sunset and cast long shadows across the sand at low tide. It carries a 4.4 rating on Tripadvisor from over 1,200 reviews, and yet it remains uncrowded in a way that Cenang has not been for years. The reason is simple: it is far from where most tourists are staying, and most tourists do not look for it.

I arrived in the late afternoon, which turned out to be the right call. As the sun drops toward the limestone cliffs, the rock changes colour faster than you expect — deep orange, then briefly something closer to pink, then gone. The water catches it for a few minutes. Then it is just a beautiful beach in the early evening, which is already more than enough.

A small selection of sun loungers is available for hire, and the Spice@Rhu Terrace restaurant sits at the edge of the beach for those who want to eat with a view rather than drive back to the main tourist strip hungry.

If you are building a day around Tanjung Rhu, the Kilim Mangrove Forest makes a strong morning activity before the afternoon beach visit. The mangroves are a different mood entirely — dark, humid, tidal, enclosed — and the contrast with the open white sand of Tanjung Rhu in the afternoon makes both places feel more vivid.

Getting there without your own transport means taking a Grab, and the fare from Cenang will be higher than you might expect for an island this size. It is worth it. The 45-minute distance is the only reason Tanjung Rhu remains what it is. Do not let it be the reason you skip it.

The 1,200-plus Tripadvisor reviews make one thing clear: people who find Tanjung Rhu come back well-disposed toward it. The people who never look for it never know what they missed.

*— A composite traveller's account drawing from Tripadvisor reviews and travel blogger reports. See source link below.*`,
    state: 'kedah', category: 'nature',
    tags: 'beach, langkawi, peaceful, sunset, kedah',
    source_url: 'https://www.tripadvisor.com.my/Attraction_Review-g298283-d592476-Reviews-Tanjung_Rhu_Beach-Langkawi_Langkawi_District_Kedah.html',
    author_id: 1
  },
  {
    title: "Tree Top Walk Sungai Sedim: Kedah's Adventure in the Canopy",
    excerpt: "A canopy walkway, river tubing, jungle trekking and camping all in one location — Kedah's most underrated adventure destination, rated 4.8 out of 5.",
    content: `Kedah's outdoor reputation begins and ends, for most visitors, with Langkawi. The beach, the cable car, the duty-free. Which means that Sungai Sedim Recreation Park — rated 4.8 out of 5 on Tripadvisor and located about 40 minutes from Alor Setar in the Kulim district — receives almost none of the attention it has earned.

The centrepiece is a treetop canopy walkway that winds through the jungle high above the forest floor. The walkway puts you at genuine canopy height, with the Sedim River visible below through the trees and the upper canopy surrounding you on all sides. If you have only ever walked through Malaysian jungle at ground level, the perspective from above is disorienting in the most rewarding way — the forest looks completely different, the scale of the trees only becomes clear when you are in among their crowns rather than at their base.

The canopy walkway is only the beginning. The park also offers river tubing, white-water rafting, jungle trekking, bird watching, a flying fox, swimming, and proper camping facilities. That combination makes Sungai Sedim a full weekend destination for anyone who wants more than a day trip — you could spend two days here and not exhaust what the park offers.

Entry fees are reasonable and the park is well-maintained, which I note because it is not always guaranteed at outdoor recreation sites in Malaysia that sit below the mainstream tourism radar. Sungai Sedim has been looked after.

About 40 minutes from Alor Setar by car, it is easily added to any northern states itinerary. The visitor numbers are a fraction of what Cameron Highlands or Langkawi receives, which in practical terms means the canopy walkway will probably be uncrowded when you arrive, the river sections will not feel like a queue, and the surrounding jungle will feel genuinely wild.

The 4.8 Tripadvisor rating is worth a moment of attention. That is a high score for a nature recreation park, and it has held across enough reviews to reflect something consistent about the experience. People who come here tend to leave satisfied in a way that is not guaranteed at more famous destinations.

Go before it ends up in a tourism brochure.

*— A composite traveller's account drawing from Tripadvisor reviews and travel blogger reports. See source link below.*`,
    state: 'kedah', category: 'adventure',
    tags: 'treetop, canopy walk, jungle, adventure, kedah',
    source_url: 'https://www.tripadvisor.com.my/Attractions-g298281-Activities-zft12156-Kedah.html',
    author_id: 2
  },

  // ---- PERAK ----
  {
    title: "Ipoh World at Han Chin Pet Soo: The Secret Museum of Tin Town",
    excerpt: "A free guided museum inside a 90-year-old Hakka clan house, telling the story of Ipoh's tin mining era — rated 4.8 out of 5, but you must book in advance.",
    content: `Ipoh has more than its famous white coffee and Instagram murals, and the Han Chin Pet Soo makes the case for that more convincingly than almost anything else in the old town.

The building is a three-storey Hakka clan house on Concubine Lane, over 90 years old and preserved well enough that walking through it feels more like a visit than a museum tour. It is run as a museum by IpohWorld, a not-for-profit education organisation, with the aim of documenting the Hakka Chinese who drove Ipoh's tin mining economy through the late 1800s and early 1900s. Every artefact on display is an original antique — mining tools, opium-related paraphernalia, vintage photographs, objects that tell a specific story rather than a general one.

The guided tours are led by volunteers, and this turns out to matter considerably. The volunteer guide who led our group that morning had a way of connecting individual objects to wider history — here is the tool, here is who used it, here is what the city looked like when they did. The knowledge was deep and particular in a way that recorded audio rarely is.

Admission is free. Donations are welcomed, and if you have any conscience about the quality of what you have just experienced, they are easy to make at the exit. Rated 4.8 out of 5 on Tripadvisor from over 2,000 reviews, which places it in genuine competition with any paid attraction in Malaysia for visitor satisfaction.

Book in advance at ipohworld.org. Slots fill quickly, particularly on weekends, and this is not a place where you can arrive unannounced and expect a tour. The booking process is straightforward and the slot system exists for a reason — the museum is small and the experience depends on the guided format.

The building sits on Concubine Lane, next to Ho Yan Hor, which means you can combine both stops in a single morning without any additional travel. If you are building an Ipoh old town itinerary around the Han Chin Pet Soo, the surrounding lanes are worth exploring on foot before or after — the architecture of the old town is the best context for what the museum is telling you.

What makes the Han Chin Pet Soo unusual among Malaysian museums is the specificity of its ambition. It is not trying to tell the story of all of Malaysia or even all of Perak. It is telling the story of one community, in one place, during a particular era — and it does that with a level of care and authenticity that makes the free admission feel almost embarrassing.

Book early. Go on a weekday if you can.

*— A composite traveller's account drawing from Tripadvisor reviews and travel blogger reports. See source link below.*`,
    state: 'perak', category: 'culture',
    tags: 'museum, history, hakka, ipoh, tin mining, perak',
    source_url: 'https://www.tripadvisor.com/Attraction_Review-g298298-d7806166-Reviews-Ipoh_World_at_Han_Chin_Pet_Soo-Ipoh_Kinta_District_Perak.html',
    author_id: 2
  },
  {
    title: "Gua Tempurung: Perak's Subterranean Kingdom",
    excerpt: "One of Peninsular Malaysia's largest limestone caves with an underground river — multiple trail difficulties make it perfect for first-timers and adventure seekers alike.",
    content: `The North-South Expressway passes within sight of Gua Tempurung, and most of the vehicles on it do not stop. This is a strange state of affairs for one of the largest limestone caves in Peninsular Malaysia — 3.8 kilometres of chambers, formations, and underground river — but it appears to be the situation nonetheless.

The cave is just off the expressway near Gopeng, about 20 minutes south of Ipoh. The approach is easy to find and the entrance facilities are functional. What is remarkable is what happens once you walk in.

Gua Tempurung offers multiple trail options at different difficulty levels. Tour 1 and Tour 2 follow walkways through the earlier chambers and are suited to families and casual visitors — the chambers are vast, the ceilings high, and the formations worth the entrance fee on their own. Tour 4 and Tour 5 are a different matter: you wade through sections of the underground river, crawl through narrower passages, and emerge at the other end considerably muddier than you arrived. Those routes are for people who want to use the cave rather than simply observe it.

The underground river that flows through Gua Tempurung is the element that sets the whole visit apart. Most cave attractions in Malaysia are dry. Moving through a system with actual water at your feet and around you changes the character of the experience in ways that are difficult to convey without sounding like promotional copy. It simply feels different.

Some practical things worth knowing: arrive before 3:30pm, as the cave closes at 5pm and staff may begin turning visitors away before then. If you are attempting any of the wet routes, bring a change of clothes — you will need them. The expressway proximity means the drive from Ipoh is short enough that this can be added to a Perak itinerary without requiring a dedicated day.

Gopeng itself is a quiet town with colonial-era buildings and a modest food scene that Ipoh's more prominent reputation tends to overshadow. If you are passing through on the way to or from the cave, a short walk around is worth the time.

Gua Tempurung should be better known than it is. The scale of the chambers is impressive, the underground river is unusual, and the range of difficulty options means it works across a wide spread of visitors. The expressway traffic passing nearby does not know what it is missing.

*— A composite traveller's account drawing from Tripadvisor reviews and travel blogger reports. See source link below.*`,
    state: 'perak', category: 'nature',
    tags: 'cave, limestone, adventure, spelunking, perak',
    source_url: 'https://www.tripadvisor.com/Attraction_Review-g2213880-d2038314-Reviews-Gua_Tempurung-Gopeng_Kampar_District_Perak.html',
    author_id: 2
  },
  {
    title: "Tasik Cermin: The Mirror Lake Hidden in Limestone",
    excerpt: "A serene lake accessed through a dark limestone tunnel by rubber boat — one of Ipoh's most unique natural attractions, best visited on weekday mornings to avoid queues.",
    content: `Let me address the Tripadvisor rating directly, because it would be dishonest not to: Tasik Cermin sits at 3.6 out of 5, which by the standards of the places I tend to write about is low. The low score has a specific and well-documented cause — weekend crowds and the queues they produce — and understanding that tells you almost everything about when to visit and when not to.

On a weekday morning, the experience is something else entirely.

To reach the lake, you board a small rubber boat and pass through a short, dark tunnel cut through the limestone cliff. It takes perhaps a minute. Then the rock opens and you emerge into a hidden valley — still water surrounded by towering limestone walls, the cliff faces reflected in the lake surface with a clarity that explains the name immediately. Cermin means mirror in Malay. The stillness of the water earns it completely.

A second boat ride takes you deeper into the cave system to a second, larger lake. The light changes as you go further in — cooler, dimmer, the limestone walls closer on both sides — and then opens again into the second lake. It is genuinely unusual, the kind of experience that depends on silence and scale and the quality of the light, all of which vary directly with how many other people happen to be there.

This is why timing matters so much here. Entry and the boat rides are affordable. The adjacent area offers quad bikes, an animal petting section, and a small cafe — including, I am told, durian ice cream — for those who want to extend the visit. The whole site is near Gunung Lang Recreational Park, which allows several stops to be combined without much additional driving.

The 3.6 Tripadvisor rating reflects what Tasik Cermin is on a Saturday afternoon with multiple tour buses in the car park. It does not reflect what it is on a Tuesday morning when the boat moves through the tunnel in near-silence and the lake is still enough to hold both the limestone walls and their reflection in a single photograph.

Go on a weekday. Go after 9am when the light inside the cave system is at its best. Avoid school holiday weekends entirely.

*— A composite traveller's account drawing from Tripadvisor reviews and travel blogger reports. See source link below.*`,
    state: 'perak', category: 'nature',
    tags: 'lake, cave, boat, limestone, ipoh, perak',
    source_url: 'https://www.tripadvisor.com/Attraction_Review-g298298-d7958007-Reviews-Tasik_Cermin-Ipoh_Kinta_District_Perak.html',
    author_id: 2
  },

  // ---- PAHANG ----
  {
    title: "Kuala Gandah Elephant Sanctuary: Where You Help, Not Watch",
    excerpt: "A genuine elephant conservation sanctuary in Pahang where rescued elephants are rehabilitated — feed them, watch them bathe, and leave understanding why conservation matters.",
    content: `The word sanctuary has been used so loosely in wildlife tourism that it has almost lost meaning. Kuala Gandah earns it back.

The Kuala Gandah Elephant Sanctuary in Lanchang, Pahang is run by PERHILITAN — Malaysia's Department of Wildlife and National Parks — as a genuine rescue and rehabilitation centre for the wild elephants of Peninsular Malaysia. The animals here have been rescued from conflict situations and habitat destruction: elephants that found themselves stranded on the wrong side of a forest boundary as land was cleared around them. The long-term aim of the programme is eventual reintroduction into the wild, not permanent captivity.

Visitors can feed the elephants, watch them bathe in the river, and observe their daily care routines. Each elephant has a dedicated keeper who knows them individually, which gives the encounters a quality that zoo settings rarely produce. The ages on site range from young calves to elephants over 50 years old, and watching the interactions between the keepers and their animals over the course of a morning tells you more about the seriousness of this programme than any display board could.

Admission is free. Optional guided experiences are available for a small fee and are worth taking if you want the context rather than just the proximity to elephants. Rated 4.1 out of 5 on Tripadvisor with nearly 1,000 reviews, the sanctuary sits about 1 hour 45 minutes from Kuala Lumpur — close enough for a day trip, far enough that most casual weekend plans do not extend to it.

Public transport to Lanchang is limited. Most visitors either book through a reputable tour operator or drive themselves — renting a car is the most flexible option.

What distinguishes Kuala Gandah from the many places across Southeast Asia where tourists pay to be near elephants is the seriousness of the conservation purpose. This is not a venue that added an elephant encounter to increase footfall. It is a functioning rescue centre that allows visitors because education is part of what makes conservation viable. The difference is visible in how the animals move, how the staff speak about them, and in the fee structure — or absence of one — at the entrance.

Go on a weekday if possible. Allow more time than you think you will need.

*— A composite traveller's account drawing from Tripadvisor reviews and travel blogger reports. See source link below.*`,
    state: 'pahang', category: 'nature',
    tags: 'elephants, wildlife, sanctuary, pahang, conservation',
    source_url: 'https://www.tripadvisor.com.my/Attraction_Review-g298291-d504486-Reviews-Kuala_Gandah_Elephant_Sanctuary-Pahang.html',
    author_id: 1
  },
  {
    title: "Mossy Forest Eco Park: Cameron Highlands' Mystical Cloud Forest",
    excerpt: "At the peak of Gunung Brinchang, a mystical moss-covered cloud forest with pitcher plants, rare fauna, and 360-degree highland views — arrive before 8:30am to beat the crowds.",
    content: `Cameron Highlands gets crowded. That is not breaking news. But there is a specific hour of a specific morning at a specific point in the highlands where the crowds have not yet arrived, and if you are willing to set an early alarm, the Mossy Forest at the summit of Gunung Brinchang delivers something genuinely worth the effort.

Gunung Brinchang sits at 2,032 metres — the highest point in Cameron Highlands accessible by road. The Mossy Forest Eco Park at the summit earns its name from the thick carpet of moss that covers every surface: tree trunks, rocks, the soil between them, the underside of branches. The whole forest is green in a way that goes beyond the usual green of Malaysian jungle — damper and more layered, the kind of growth that accumulates only over a very long time in very specific conditions. The air is cool and typically misty in a way that makes the enclosing vegetation feel almost theatrical.

A wooden boardwalk in good condition runs through the forest. A viewing tower at the far end offers sweeping views over the highlands toward Ipoh on clear mornings, though the clouds can arrive quickly, and some of the atmosphere depends on the mist rather than the view. Pitcher plants grow along the boardwalk edges. Rare orchids are present for those who know what to look for. Gibbons are occasionally spotted away from the main path, though they are not a reliable sighting.

Entry is RM30 for non-Malaysian visitors. Hiring a local guide, which the park recommends, adds context about the native flora and its traditional medicinal uses that a self-guided walk does not provide.

The critical practical note: arrive before 8:30am. Land Rovers and minibuses start flooding in after 9am, and the narrow boardwalk — shared in both directions — becomes a slow-moving queue rather than a walk. On weekday mornings before the first tour groups, the forest is quiet enough to hear individual water drops falling through the moss. That specific quality of silence is what the 4.2 out of 5 Tripadvisor rating from nearly 1,000 reviews is pointing at, and it requires arriving early enough to find it.

The drive up to Gunung Brinchang from Brinchang town takes about 20 minutes on a winding road that earns its reputation. Allow time for it.

Set the alarm early. The moss will be worth it.

*— A composite traveller's account drawing from Tripadvisor reviews and travel blogger reports. See source link below.*`,
    state: 'pahang', category: 'nature',
    tags: 'forest, cameron highlands, nature, hiking, pahang',
    source_url: 'https://www.tripadvisor.com.my/Attraction_Review-g298293-d1034350-Reviews-Mossy_Forest_Eco_Park-Brinchang_Cameron_Highlands_Pahang.html',
    author_id: 1
  },
  {
    title: "Merapoh: Taman Negara's Secret Back Door",
    excerpt: "The lesser-known northern entrance to Taman Negara, where smaller groups, lower prices and more authentic jungle experiences await — rated 4.8 out of 5.",
    content: `Most people who visit Taman Negara enter through Kuala Tahan in Jerantut. The resort boats, the canopy walk, the suspension bridge — it is a well-managed experience for the volume of visitors it handles, which is part of the problem. Taman Negara is one of the world's oldest rainforests, over 130 million years old, and the Kuala Tahan experience, for all its merits, does not always feel like being inside a rainforest of that age.

Merapoh does.

The small town of Merapoh in northern Pahang sits at a lesser-used northern entrance to the national park. Merapoh Adventure, rated 4.8 out of 5 on Tripadvisor, runs tours through this entrance with group sizes small enough that the jungle stays genuinely quiet around you. The result is more wildlife sightings, a more authentic deep-jungle atmosphere, and activities that put you in contact with the forest rather than simply passing through a managed section of it.

Those activities include river rafting on Sungai Pertang, cave exploration in Gua Batu Putih — which is home to thousands of bats — jungle trekking, fishing, and overnight camping in the rainforest. The overnight option is worth giving serious consideration. Sleeping inside a 130-million-year-old rainforest is a categorically different experience from sleeping near one, and the sounds that build after dark around Merapoh have a quality that is difficult to describe without resorting to the word ancient.

Getting to Merapoh without a car is possible: the ETS train from Kuala Lumpur runs to Gua Musang, from which local transport connects onward to Merapoh. By car the route follows Road 8 through the central spine of the peninsula. Either approach takes you through the kind of Malaysia that the highway bypasses entirely — small towns, rubber estates, the interior landscape that most visitors never encounter.

Merapoh Adventure's 4.8 rating comes from visitors who mostly chose this entrance deliberately rather than defaulting to the obvious option. That self-selection tells you something about the quality of what they found. Book ahead — smaller group sizes are the point and capacity is genuinely limited.

*— A composite traveller's account drawing from Tripadvisor reviews and travel blogger reports. See source link below.*`,
    state: 'pahang', category: 'adventure',
    tags: 'jungle, taman negara, trekking, orang asli, pahang',
    source_url: 'https://www.tripadvisor.com.my/Attraction_Review-g3360742-d8642144-Reviews-Merapoh_Adventure-Merapuh_Pahang.html',
    author_id: 2
  },

  // ---- NEGERI SEMBILAN ----
  {
    title: "Sri Menanti Royal Museum: A Palace Built Without a Single Nail",
    excerpt: "A breathtaking traditional Minangkabau wooden palace built without a single nail — the royal museum of Negeri Sembilan stands as a masterpiece of indigenous craftsmanship.",
    content: `The easiest way to describe Istana Lama Sri Menanti is to describe what it is not. It is not held together by a single nail. Four storeys of traditional Minangkabau palace, built between 1902 and 1908 entirely from timber, constructed with joinery and traditional woodworking methods that required no metal fasteners anywhere in the structure. The fact that it is still standing, intact, and open to visitors is the architectural argument made more eloquently than any description can.

The palace served as the royal residence of the Yang Dipertuan Besar of Negeri Sembilan — the state's traditional ruler — and has been preserved as the Sri Menanti Royal Museum since 1992. The interior holds displays of royal regalia, traditional weapons, ceremonial costumes, and historical photographs that document Minangkabau royal life across more than a century. The objects are original rather than reproductions, and the building they occupy is original rather than restored. Both facts give the visit a quality that purpose-built heritage attractions rarely manage.

From outside, the most immediately striking feature is the roofline: curved upward at both ends in the classic Minangkabau style, soaring against the sky in a way that makes the building look simultaneously ancient and somehow dynamic. The palace grounds are well kept and quiet — the kind of setting that rewards slow walking rather than a hurried loop.

Entry is free. The museum is in the royal town of Sri Menanti in Kuala Pilah district, about 30 minutes from Seremban. Sri Menanti is a small town — the royal connection gives it a quiet dignity rather than any commercial character — and the approach from Seremban through the Negeri Sembilan interior passes through countryside that does not make it onto any travel highlight reel.

Most visitors to Negeri Sembilan pass through the state between Kuala Lumpur and the south, stopping for a meal in Seremban if they stop at all. Sri Menanti does not appear on the itinerary because nobody put it there, and nobody put it there because most people do not know it exists.

A palace built without a nail, free to enter, almost never crowded, containing original artefacts from a living royal tradition. If that does not prompt a visit, I am not sure what additional information would help.

*— A composite traveller's account drawing from Tripadvisor reviews and travel blogger reports. See source link below.*`,
    state: 'negeri_sembilan', category: 'culture',
    tags: 'palace, minangkabau, culture, history, negeri sembilan',
    source_url: 'https://siakapkeli.my/articles/12-hidden-gems-di-negeri-sembilan-melaka-yang-wajib-pergi',
    author_id: 1
  },
  {
    title: "Pedas Hot Springs: Negeri Sembilan's Sulphur Soak Secret",
    excerpt: "Natural sulphur hot springs tucked behind a quiet kampung in Rembau — far less crowded than Selangor's alternatives, and just as therapeutic.",
    content: `The hot springs in Selangor — the popular ones near the highway — fill up on weekend mornings with people who drove an hour from Kuala Lumpur specifically to be there. The car parks are full by ten. The soaking pools are communal and busy and pleasant in the way that busy shared things can be pleasant, which is to say fine but not quite what you were imagining.

Pedas Hot Springs in Rembau district is 45 minutes from Seremban and has not been discovered by the same weekend crowd. The springs sit behind a small kampung and rubber estates, bubbling up naturally and feeding into soaking pools that locals have been using for generations. The sulphur-rich water is believed to have therapeutic properties for skin conditions and muscle relaxation — whether you hold that belief or not, soaking in naturally heated water on a cool morning makes its own argument.

The facilities are simple and clean: changing rooms, and food stalls nearby selling local snacks. The setting is a sleepy village with chickens, fruit trees, and the distant sound of the springs — which is, in my experience, more than half the appeal. A hot spring that feels like it belongs to the people who live nearby rather than to the visitors who drive in on Saturday mornings is a different experience from one that has been developed for volume.

Entry is affordable. The springs are rarely crowded even on weekends, which speaks both to how little the place has been promoted and how genuinely local the visitor profile remains. Most people who come here live in the surrounding area or have heard about it through connections to Rembau.

The drive from Seremban to Pedas takes you through the Rembau district — small towns, rubber and palm estates, the quiet interior of Negeri Sembilan that most travellers pass through without stopping. The town of Rembau itself is worth a short walk if you arrive with time to spare; the preserved colonial-era buildings there are unhurried and genuinely charming rather than managed for visitors.

Pedas Hot Springs rewards the visitor looking for something real and local rather than something packaged. The 45 minutes from Seremban is exactly the right distance to keep the crowds away.

*— A composite traveller's account drawing from Tripadvisor reviews and travel blogger reports. See source link below.*`,
    state: 'negeri_sembilan', category: 'nature',
    tags: 'hot springs, nature, relaxation, negeri sembilan',
    source_url: 'https://siakapkeli.my/articles/12-hidden-gems-di-negeri-sembilan-melaka-yang-wajib-pergi',
    author_id: 1
  },
  {
    title: "Jeram Toi Waterfall: Negeri Sembilan's Seven-Tiered Secret",
    excerpt: "A seven-tiered waterfall deep in Ulu Muar jungle — the hike is challenging but rewards with pristine jungle pools completely free of crowds.",
    content: `Seven tiers. Forty-five minutes of jungle. No facilities, no signage, no crowd.

Jeram Toi Waterfall in Ulu Muar, Negeri Sembilan is exactly the kind of waterfall that exists in the gap between what travel lists call a hidden gem and what actually qualifies. The trail starts at Felda Pasir Besar and winds through secondary jungle for about 45 minutes before the first tier becomes audible — then visible — then in front of you: a wide, powerful curtain of water falling into a deep pool that is cold, clean, and on a weekday entirely yours.

The full seven tiers can be explored by those willing to scramble up the rocks between pools. Each tier has its own character: some are wide and shallow, spreading across a broad rock face; others are narrow and deep, the water channelled through a tighter passage. The swimming at multiple tiers is genuinely good — the water is cold and clear in the way that jungle rivers far from development tend to be.

There are no facilities beyond the trailhead. Bring food and water. Bring insect repellent — the surrounding jungle is dense and the insects are not shy. On a first visit, going with a local guide is a reasonable precaution; the trail is not heavily marked and the approach between tiers involves some navigation.

Do not visit after heavy rain. River levels in jungle systems like this can rise quickly, and crossings between tiers become unreliable in high water. The standard advice for Malaysian jungle waterfall hikes applies: morning start, out before afternoon storms, check the weather the day before.

What Jeram Toi offers that more accessible waterfalls cannot is the combination of the hike and the arrival — the 45 minutes through secondary jungle, the building sound of water, and the emergence at that first wide tier that earns the effort. Waterfalls that require no effort to reach tend to have company. Waterfalls at the end of a proper jungle hike tend not to.

Ulu Muar receives very little tourism traffic. Jeram Toi is as uncrowded as a waterfall this impressive has any right to be, for no reason other than that most visitors have never heard of it.

You now have no excuse.

*— A composite traveller's account drawing from Tripadvisor reviews and travel blogger reports. See source link below.*`,
    state: 'negeri_sembilan', category: 'adventure',
    tags: 'waterfall, hiking, nature, adventure, negeri sembilan',
    source_url: 'https://siakapkeli.my/articles/12-hidden-gems-di-negeri-sembilan-melaka-yang-wajib-pergi',
    author_id: 2
  },

  // ---- JOHOR ----
  {
    title: "Endau Rompin National Park: Johor's Ancient Wilderness",
    excerpt: "One of Malaysia's most pristine ancient rainforests and a serious rival to Taman Negara — without the crowds. Endau Rompin is Johor's wild, untouched heart.",
    content: `Taman Negara has the canopy walkway and the resort restaurants and the boat trips from Kuala Tahan. These are legitimate selling points. Endau Rompin, spanning the Johor-Pahang border across over 800 square kilometres of ancient lowland dipterocarp rainforest, has none of that — and its wildlife sightings are more likely, and the experience more genuine, for exactly that reason.

The park's visitor numbers are a fraction of Taman Negara's, with two related consequences: you share the jungle with fewer people, and the wildlife is less habituated to the disturbance that heavy tourism produces. Endau Rompin is home to Sumatran rhinos, elephants, tigers, tapirs, and hundreds of bird species. I am not suggesting you will encounter all of these on a single visit; I am noting that the park has them, that the low footfall means fewer disturbances to animal movement, and that the wildlife sightings visitors report consistently reflect that. The Sumatran rhino is critically endangered globally. This is one of the few places in Peninsular Malaysia where they still exist in the wild.

The marquee destinations within the park are the Upeh Guling and Buaya Sangkut waterfalls, both requiring multi-day jungle treks to reach — which is precisely why they look the way they do when you arrive. Waterfalls at the end of multi-day treks through ancient rainforest do not look like waterfalls on a day-trip trail.

The Jakun Orang Asli community at Kampung Peta serve as guides and cultural hosts, which adds a dimension to the visit that goes beyond wildlife and geography. A licensed guide is required, and it is also the practical reason the visit tends to be as good as it is. Two main entry points: Kahang on the Johor side, and Kuala Rompin on the Pahang side.

Permits are required. Planning well in advance is genuinely necessary — this is not a park where you turn up at the entrance and hope for availability. Allow several weeks to organise properly.

Endau Rompin is for the visitor who wants a real, unscripted jungle experience. It requires effort, preparation, and tolerance for the absence of infrastructure. The park will return considerably more than you put in.

*— A composite traveller's account drawing from Tripadvisor reviews and travel blogger reports. See source link below.*`,
    state: 'johor', category: 'adventure',
    tags: 'national park, jungle, waterfall, orang asli, johor',
    source_url: 'https://www.tripadvisor.com.my/Attractions-g298277-Activities-zft12156-Johor.html',
    author_id: 2
  },
  {
    title: "Muar: The UNESCO Creative City Most Malaysians Haven't Visited",
    excerpt: "A UNESCO Creative City of Crafts and Folk Art with beautifully preserved colonial shophouses, the best mee bandung in Malaysia, and almost no tourists.",
    content: `The road between Kuala Lumpur and Singapore passes close enough to Muar that the town is genuinely reachable as a stop, and most travellers pass it without stopping because they have not been given a reason to do otherwise. That is a mistake worth correcting.

Muar — also known as Bandar Maharani — sits on the Muar River in northern Johor and holds UNESCO Creative City of Crafts and Folk Art status. That designation recognises the town's deep tradition in Johor crafts, weaving, songket, and performing arts, and it reflects something genuinely preserved rather than reconstructed. The old town centre is a showcase of colonial shophouses painted in faded pastels, housing coffee shops, traditional trades, and craft workshops that have been in operation long enough that the practitioners are not performing heritage for visitors. They are simply doing what they have always done.

The waterfront esplanade along Sungai Muar is peaceful and walkable — the kind of public space that a town with a different temperament would have turned into something more commercial. Muar has left it as it is. Evenings on the waterfront are worth staying for: locals walking, families at the benches, the river moving quietly alongside.

Food deserves its own paragraph. Muar is widely considered the birthplace of mee bandung — thick noodles in a sweet-spicy prawn gravy — and the regional otak-otak: grilled spiced fish cake in banana leaf. Both dishes exist across Malaysia, and both taste better here than anywhere else. This is not a sentimental claim; it is the consensus of people who have eaten them across the country. The combination of the source, the local preparation, and the still-family-run stalls produces food that franchise versions elsewhere cannot replicate.

Stay overnight if the schedule allows. An evening on the waterfront and a morning in the old town before the heat builds is the structure that makes the visit feel complete rather than a lunch stop.

Muar does not announce itself loudly enough. That is the town's loss from a tourism perspective and your advantage if you stop.

*— A composite traveller's account drawing from Tripadvisor reviews and travel blogger reports. See source link below.*`,
    state: 'johor', category: 'culture',
    tags: 'muar, heritage, food, colonial, johor, UNESCO',
    source_url: 'https://www.tripadvisor.com.my/Attractions-g298277-Activities-zft12156-Johor.html',
    author_id: 2
  },
  {
    title: "Kukup: Johor's Village Built Entirely on the Sea",
    excerpt: "An entire fishing village built on stilts above the Strait of Malacca — fresh seafood, the Orang Seletar sea nomads, and views of Sumatra on clear days.",
    content: `Eight kilometres from Indonesia, on wooden stilts above the water in the southwest corner of Johor, Kukup is one of the largest floating fishing villages in Malaysia. The distance by road from Singapore is modest. The distance in character is something else entirely.

You arrive by small ferry from the Kukup Fishing Village Pier. Once on the boardwalk, you step out onto a network of wooden planks connecting the houses, the seafood restaurants, and the fish processing facilities above the sea. The water is beneath the boards you walk on — visible between the planks, audible from every corner of the settlement. The Orang Seletar, a sea nomadic people who have lived on these waters for centuries, are part of the community that makes Kukup what it is, alongside a Chinese fishing community with its own long history on the same water.

The seafood is the practical reason most visitors come. Prawns, crabs, and fresh fish prepared simply — cooking that prioritises the quality of the ingredient over the complexity of the preparation. Priced in a way that reflects the village's actual economy rather than a tourist markup. On clear days, Sumatra is visible on the horizon from the outer boardwalks, which frames the meal with an unusual degree of geographical context.

The best time to visit is weekday mornings. Tour groups from Singapore tend to arrive around midday, and the village changes when they do — the boardwalks narrow, the queues lengthen, and the quality of the early-morning quiet disappears. An early arrival means you have the place largely to yourself and the seafood is at its freshest.

Kukup is unusual in the best possible way: it is a working community that happens to be remarkable to visit. The stilts, the sea beneath your feet, the Orang Seletar history, the Sumatran horizon — none of it was built for visitors. It is simply what the place is, and has been for a very long time.

*— A composite traveller's account drawing from Tripadvisor reviews and travel blogger reports. See source link below.*`,
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
