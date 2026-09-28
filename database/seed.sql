-- =============================================================================
-- Shree Laxminarayan Mandir — starter content (OPTIONAL)
-- =============================================================================
-- Run AFTER schema_v2.sql, in Supabase → SQL Editor.
--
-- This is the sample content that used to be hard-coded in the frontend
-- components, moved into the database so the site isn't empty on day one.
-- Everything here is editable/deletable later from the admin dashboard.
--
-- ⚠ Review before going live:
--   • Event dates are PLACEHOLDERS spread over the coming months — replace
--     them with the temple's real programme dates.
--   • Prices/durations are the ones from the old mock-up.
--   • Books and bhajans have no PDF/audio yet; the site shows them as
--     "coming soon" until pdf_url / audio_url are filled in.
--
-- Idempotent: each row is inserted only if a row with the same English
-- title/name doesn't exist yet, so re-running never duplicates.
-- (Festival/Ekadashi/Purnima calendar entries are seeded in Phase 3.)
-- =============================================================================

-- ---------- poojas -----------------------------------------------------------
insert into public.poojas (name_en, name_ne, description_en, description_ne, duration_minutes, price, is_popular, sort_order)
select v.* from (values
  ('Sahasranama Archana', 'सहस्रनाम अर्चना',
   '1000 names of Lord Vishnu offered with flowers each morning.',
   'हरेक बिहान फूलसहित भगवान विष्णुका हजार नाम अर्पण।', 45, 500, true, 1),
  ('Abhishekam', 'अभिषेकम्',
   'Sacred bathing of the deity with milk, honey, curd, and sandalwood.',
   'दूध, मह, दही र चन्दनले भगवानको पवित्र स्नान।', 60, 1100, false, 2),
  ('Sudarshana Homam', 'सुदर्शन होमम्',
   'Fire ritual for protection and removal of all obstacles.',
   'रक्षा र सबै विघ्न निवारणका लागि गरिने होम।', 120, 3100, false, 3),
  ('Sri Sooktam Puja', 'श्री सूक्तम् पूजा',
   'Vedic hymns to Goddess Lakshmi for prosperity and harmony.',
   'समृद्धि र सद्भावका लागि देवी लक्ष्मीको वैदिक स्तुति।', 75, 1500, false, 4),
  ('Nakshatra Shanti', 'नक्षत्र शान्ति',
   'Birth star puja for peace, health, and prosperity.',
   'शान्ति, स्वास्थ्य र समृद्धिका लागि जन्म नक्षत्र पूजा।', 90, 2100, true, 5),
  ('Satyanarayan Puja', 'सत्यनारायण पूजा',
   'Auspicious puja for family wellbeing and fulfillment of vows.',
   'परिवारको कल्याण र भाकल पूरा गर्न गरिने शुभ पूजा।', 120, 2500, true, 6),
  ('Lakshmi Puja', 'लक्ष्मी पूजा',
   'Dedicated worship of Goddess Lakshmi for abundance and fortune.',
   'धन र सौभाग्यका लागि देवी लक्ष्मीको विशेष आराधना।', 60, 1800, false, 7),
  ('Vishnu Sahasranama', 'विष्णु सहस्रनाम',
   'Recitation of 1000 names of Lord Vishnu for peace and liberation.',
   'शान्ति र मुक्तिका लागि भगवान विष्णुका हजार नामको पाठ।', 60, 800, false, 8),
  ('Thiruvanandal Seva', 'तिरुवानन्दल सेवा',
   'Special seva unique to the Sri Vaishnava Totadri tradition.',
   'श्री वैष्णव तोताद्री परम्पराको विशिष्ट सेवा।', 45, 1200, false, 9)
) as v(name_en, name_ne, description_en, description_ne, duration_minutes, price, is_popular, sort_order)
where not exists (select 1 from public.poojas p where p.name_en = v.name_en);

-- ---------- archanas ---------------------------------------------------------
insert into public.archanas (name_en, name_ne, deity_en, deity_ne, price, sort_order)
select v.* from (values
  ('Ashtottara Archana',  'अष्टोत्तर अर्चना', 'Laxminarayan', 'लक्ष्मीनारायण', 100, 1),
  ('Sahasranama Archana', 'सहस्रनाम अर्चना',  'Vishnu',       'विष्णु',         300, 2),
  ('Pushpanjali',         'पुष्पाञ्जलि',       'Lakshmi',      'लक्ष्मी',         51, 3),
  ('Tulasi Archana',      'तुलसी अर्चना',      'Laxminarayan', 'लक्ष्मीनारायण',  51, 4)
) as v(name_en, name_ne, deity_en, deity_ne, price, sort_order)
where not exists (select 1 from public.archanas a where a.name_en = v.name_en);

-- ---------- events (dates are placeholders — see note above) -----------------
insert into public.events (title_en, title_ne, description_en, description_ne, event_date, category, is_featured)
select v.title_en, v.title_ne, v.description_en, v.description_ne, current_date + v.days_ahead, v.category, v.is_featured
from (values
  ('Purnima Celebrations', 'पूर्णिमा उत्सव',
   'Full moon evening prayers, lamp-lighting ceremony, and prasad for all devotees.',
   'पूर्णिमाको साँझ प्रार्थना, दीप प्रज्वलन र सबै भक्तजनलाई प्रसाद।', 10, 'purnima', true),
  ('Ekadashi Observance', 'एकादशी व्रत',
   'Fortnightly fasting day with Vishnu puja, stotra recitation, and community gathering.',
   'विष्णु पूजा, स्तोत्र पाठ र सामूहिक भेलासहित पाक्षिक व्रत।', 18, 'ekadashi', false),
  ('Sudarshana Homam', 'सुदर्शन होमम्',
   'Fire ritual to Lord Sudarshana for protection and removal of all obstacles.',
   'रक्षा र सबै विघ्न निवारणका लागि भगवान सुदर्शनको होम।', 25, 'special_pooja', false),
  ('Navaratri Sevas', 'नवरात्री सेवाहरू',
   'Nine nights of special sevas. Cultural programmes each evening.',
   'नौ रातसम्म विशेष सेवा। हरेक साँझ सांस्कृतिक कार्यक्रम।', 32, 'special_pooja', false),
  ('Karthigai Deepam', 'कार्तिगई दीपम्',
   'Festival of lights — thousands of lamps lit in the temple compound at twilight.',
   'दीपोत्सव — साँझपख मन्दिर परिसरमा हजारौं दीप प्रज्वलन।', 55, 'festival', true),
  ('Vaikunta Ekadashi', 'वैकुण्ठ एकादशी',
   'Most sacred Ekadashi. Special abhishekam and night-long prayers. Gates of Vaikunta believed to open.',
   'सबैभन्दा पवित्र एकादशी। विशेष अभिषेक र रातभरि प्रार्थना। वैकुण्ठ द्वार खुल्ने विश्वास।', 80, 'ekadashi', true),
  ('Brahmotsavam', 'ब्रह्मोत्सवम्',
   'Nine-day annual festival with daily processions, special sevas, and prasad distribution.',
   'दैनिक शोभायात्रा, विशेष सेवा र प्रसाद वितरणसहित नौ दिने वार्षिक महोत्सव।', 110, 'festival', true),
  ('Panguni Uttiram', 'पांगुनी उत्तिरम्',
   'Divine marriage of Vishnu and Lakshmi. Grand procession and flower decorations.',
   'विष्णु र लक्ष्मीको दिव्य विवाह। भव्य शोभायात्रा र पुष्प सजावट।', 160, 'festival', false),
  ('Janmashtami', 'जन्माष्टमी',
   'Birth of Lord Krishna — midnight prayers, bhajans, and abhishekam.',
   'भगवान कृष्णको जन्मोत्सव — मध्यरात्रि प्रार्थना, भजन र अभिषेक।', 320, 'festival', false)
) as v(title_en, title_ne, description_en, description_ne, days_ahead, category, is_featured)
where not exists (select 1 from public.events e where e.title_en = v.title_en);

-- ---------- books -------------------------------------------------------------
insert into public.books (title_en, title_ne, author_en, author_ne, category, language, sort_order)
select v.* from (values
  ('Vishnu Sahasranama',             'विष्णु सहस्रनाम',         'Vyasa Maharshi',     'व्यास महर्षि',        'scripture',  'sa', 1),
  ('Sri Ranganatha Stotram',         'श्री रंगनाथ स्तोत्रम्',   'Adi Shankaracharya', 'आदि शंकराचार्य',      'stotra',     'sa', 2),
  ('Laxminarayan Mahatmya',          'लक्ष्मीनारायण माहात्म्य', 'Temple Publication', 'मन्दिर प्रकाशन',      'scripture',  'ne', 3),
  ('Tiruppavai',                     'तिरुप्पावई',               'Andal',              'आण्डाल',              'stotra',     'sa', 4),
  ('Introduction to Sri Vaishnavism','श्री वैष्णवधर्म परिचय',   'Temple Publication', 'मन्दिर प्रकाशन',      'philosophy', 'en', 5),
  ('Lakshmi Ashtakam',               'लक्ष्मी अष्टकम्',          'Traditional',        'परम्परागत',           'stotra',     'sa', 6),
  ('Narayana Suktam',                'नारायण सूक्तम्',            'Yajurveda',          'यजुर्वेद',             'scripture',  'sa', 7),
  ('Garuda Puranam (excerpts)',      'गरुड पुराण (अंश)',          'Vyasa',              'व्यास',                'scripture',  'ne', 8),
  ('Ramanuja Darshan',               'रामानुज दर्शन',             'Sri Ramanuja',       'श्री रामानुज',         'philosophy', 'en', 9),
  ('Andal Biography',                'आण्डाल जीवनी',             'Temple Publication', 'मन्दिर प्रकाशन',      'biography',  'en', 10),
  ('Totadri Nambi Charitra',         'तोताद्री नम्बि चरित्र',    'Temple Publication', 'मन्दिर प्रकाशन',      'biography',  'ne', 11),
  ('Divya Prabandham (selections)',  'दिव्य प्रबन्धम् (चयन)',    'Alvars',             'आळ्वारहरू',           'scripture',  'sa', 12)
) as v(title_en, title_ne, author_en, author_ne, category, language, sort_order)
where not exists (select 1 from public.books b where b.title_en = v.title_en);

-- ---------- bhajans -----------------------------------------------------------
insert into public.bhajans (title_en, title_ne, artist_en, artist_ne, duration_seconds, category, sort_order)
select v.* from (values
  ('Vishnu Sahasranamam',        'विष्णु सहस्रनामम्',          'M.S. Subbulakshmi', 'एम.एस. सुब्बुलक्ष्मी', 3150, 'vedic',        1),
  ('Balaji Suprabhatam',         'बालाजी सुप्रभातम्',          'Traditional',       'परम्परागत',            735, 'suprabhatam',  2),
  ('Lakshmi Ashtakam',           'लक्ष्मी अष्टकम्',            'Temple Choir',      'मन्दिर गायक मण्डली',   522, 'stotra',       3),
  ('Sri Rama Ashtottaram',       'श्री राम अष्टोत्तरम्',       'Traditional',       'परम्परागत',            620, 'stotra',       4),
  ('Govinda Namalu',             'गोविन्द नामलु',              'Annamacharya',      'अन्नमाचार्य',           415, 'bhajan',       5),
  ('Tiruppavai — Verses 1–10',   'तिरुप्पावई — श्लोक १–१०',    'Andal',             'आण्डाल',              1110, 'ashtapadi',    6),
  ('Narayana Kavacham',          'नारायण कवचम्',               'Vedic Recitation',  'वैदिक पाठ',             940, 'vedic',        7),
  ('Mangalashtak — Laxminarayan','मंगलाष्टक — लक्ष्मीनारायण', 'Temple Tradition',  'मन्दिर परम्परा',        445, 'mangalashtak', 8),
  ('Sri Suktam',                 'श्री सूक्तम्',               'Vedic Choir',       'वैदिक गायक मण्डली',    550, 'vedic',        9),
  ('Hanuman Chalisa',            'हनुमान चालीसा',              'Traditional',       'परम्परागत',            480, 'bhajan',      10)
) as v(title_en, title_ne, artist_en, artist_ne, duration_seconds, category, sort_order)
where not exists (select 1 from public.bhajans b where b.title_en = v.title_en);

-- ---------- temple_info ------------------------------------------------------
-- Also used as grounding facts for the Phase 7 AI assistant.
insert into public.temple_info (key, category, value_en, value_ne, sort_order)
values
  ('timings.morning',   'timings', 'Morning darshan: 5:00 AM – 12:00 PM', 'बिहानको दर्शन: बिहान ५:०० – दिउँसो १२:०० बजे', 1),
  ('timings.afternoon', 'timings', 'Temple closed for afternoon break: 12:00 PM – 4:00 PM', 'दिउँसो विश्राम: १२:०० – ४:०० बजे मन्दिर बन्द', 2),
  ('timings.evening',   'timings', 'Evening darshan: 4:00 PM – 8:00 PM', 'साँझको दर्शन: साँझ ४:०० – रात ८:०० बजे', 3),
  ('timings.days',      'timings', 'Open 365 days a year.', 'वर्षभरि ३६५ दिन खुला।', 4),
  ('contact.address',   'contact', 'Shree Laxminarayan Mandir, Hetauda, Makwanpur District, Bagmati Province, Nepal', 'श्री लक्ष्मीनारायण मन्दिर, हेटौंडा, मकवानपुर जिल्ला, बागमती प्रदेश, नेपाल', 1),
  ('contact.phone',     'contact', '+977-XXXXXXXXX (during temple hours)', '+977-XXXXXXXXX (मन्दिर खुला रहने समयमा)', 2),
  ('contact.email',     'contact', 'info@laxminarayanmandir.org', 'info@laxminarayanmandir.org', 3),
  ('about.tradition',   'history', 'The temple follows the Sri Vaishnava Totadri sampradaya. All poojas are conducted according to the Pancharatra Agama shastra.', 'मन्दिरले श्री वैष्णव तोताद्री सम्प्रदायको अनुसरण गर्छ। सबै पूजा पञ्चरात्र आगम शास्त्रअनुसार सम्पन्न गरिन्छन्।', 1),
  ('booking.policy',    'rituals', 'Please book poojas at least 24 hours in advance. Payment is made at the temple on the day; no advance payment is required.', 'कृपया पूजा कम्तीमा २४ घण्टा अगाडि बुक गर्नुहोस्। भुक्तानी पूजाकै दिन मन्दिरमा गरिन्छ; अग्रिम भुक्तानी आवश्यक छैन।', 1),
  ('booking.bring',     'rituals', 'Bring flowers (lotus or marigold preferred), fruits for naivedyam, and wear clean traditional attire. Footwear is not allowed inside.', 'फूल (कमल वा सयपत्री उत्तम), नैवेद्यका लागि फलफूल ल्याउनुहोस् र सफा परम्परागत पोशाक लगाउनुहोस्। भित्र जुत्ता-चप्पल लैजान पाइँदैन।', 2)
on conflict (key) do nothing;
