/**
 * Keşfet (MOCK_MAGAZINES) ve Gezi Rotaları (MOCK_WEEKEND_PLANS) statik/sabit
 * içerik olduğu ve bir veritabanından çekilmediği için, bu içeriklerin çok
 * dilli karşılıkları burada elle tutulur. Türkçe orijinal mockData.ts'te kalır;
 * burada sadece diğer 5 dilin çevirileri var. Çeviri yoksa Türkçe'ye düşülür.
 */

type HeritageTranslation = { title: string; description: string };
type RouteTranslation = {
  title: string;
  description: string;
  activities: string[];
  duration: string;
  tips: string;
};

export const HERITAGE_TRANSLATIONS: Record<string, Record<string, HeritageTranslation>> = {
  en: {
    m1: {
      title: 'Göbeklitepe',
      description:
        'Göbeklitepe is one of the oldest known temple sites in human history, located northeast of Şanlıurfa. ' +
        'Its massive T-shaped pillars, dating back to the 10th millennium BC and carved with animal and symbolic reliefs, ' +
        'offer unique insight into the belief world of the Neolithic era. Now on the UNESCO World Heritage list, Göbeklitepe is often called "the zero point of history."',
    },
    m2: {
      title: 'Balıklıgöl',
      description:
        'Balıklıgöl is a sacred site in the center of Şanlıurfa, said to be where the Prophet Abraham was thrown into the fire. ' +
        'According to legend, the fire turned into water and the wood into fish, which is why the carp in the pool are considered sacred and never fished. ' +
        'Surrounded by historic mosques, madrasas and bazaars, Balıklıgöl is one of the city\'s landmarks in both spiritual atmosphere and architecture.',
    },
    m3: {
      title: 'Urfa Castle',
      description:
        'Standing on the hill in the city center, Urfa Castle is a historic structure bearing traces of many eras and overlooking the whole city.',
    },
    m4: {
      title: 'Harran Ruins',
      description:
        'With its beehive houses and ancient past, Harran is one of the region\'s most important cultural heritage sites.',
    },
    m5: {
      title: 'Harran Grand Mosque',
      description:
        'Considered one of Anatolia\'s oldest mosques, the Harran Grand Mosque is an important part of the ancient city of Harran.',
    },
    m6: {
      title: 'Soğmatar Ancient City',
      description:
        'An ancient settlement near the City of Şuayb, notable for its rock reliefs and remains of a moon-cult sanctuary.',
    },
    m7: {
      title: 'Bazda Caves',
      description:
        'A historic site with striking rock formations, once used as ancient stone quarries.',
    },
    m8: {
      title: 'Rumkale',
      description:
        'A historic castle on the banks of the Euphrates, mostly reached by boat tours from Halfeti.',
    },
    m9: {
      title: 'Birecik Bald Ibis Breeding Station',
      description:
        'A conservation center where the critically endangered northern bald ibis can be observed.',
    },
    m10: {
      title: 'Şanlıurfa Archaeology Museum',
      description:
        'One of Turkey\'s richest archaeology museums, home to finds from Göbeklitepe and the wider "Stone Hills" excavations.',
    },
    m11: {
      title: 'Haleplibahçe Mosaic Museum',
      description:
        'Home to important Roman-era artifacts, most notably the Amazon Queens mosaic.',
    },
    m12: {
      title: 'Gümrük Han',
      description:
        'A historic caravanserai, ideal for relaxing with its atmosphere and traditional coffee.',
    },
    m13: {
      title: 'Historic Urfa Bazaars',
      description:
        'A lively historic shopping district with coppersmiths, isot pepper stalls and local produce markets.',
    },
    m14: {
      title: 'Karaali Park',
      description:
        'With its green spaces and walking trails, Karaali Park is a breathing space right next to the city center.',
    },
    m15: {
      title: 'Euphrates Riverside',
      description:
        'Watching the sunset on the banks of the Euphrates is one of the most enjoyable ways to be close to nature in Şanlıurfa.',
    },
    m16: {
      title: 'Halfeti Hidden Paradise',
      description:
        'A peaceful getaway around Halfeti, known for its striking natural scenery.',
    },
  },
  de: {
    m1: {
      title: 'Göbeklitepe',
      description:
        'Göbeklitepe ist eine der ältesten bekannten Tempelanlagen der Menschheitsgeschichte und liegt nordöstlich von Şanlıurfa. ' +
        'Die riesigen, aus dem 10. Jahrtausend v. Chr. stammenden T-förmigen Pfeiler mit Tier- und Symbolreliefs geben einzigartige Einblicke in die Glaubenswelt der Jungsteinzeit. ' +
        'Heute steht Göbeklitepe auf der UNESCO-Weltkulturerbeliste und wird oft als "Nullpunkt der Geschichte" bezeichnet.',
    },
    m2: {
      title: 'Balıklıgöl',
      description:
        'Balıklıgöl ist eine heilige Stätte im Zentrum von Şanlıurfa, an der der Überlieferung nach der Prophet Abraham ins Feuer geworfen wurde. ' +
        'Der Legende nach verwandelte sich das Feuer in Wasser und das Holz in Fische – deshalb gelten die Karpfen im Teich als heilig und werden nie gefangen. ' +
        'Umgeben von historischen Moscheen, Medresen und Basaren ist Balıklıgöl sowohl durch seine spirituelle Atmosphäre als auch seine Architektur ein Wahrzeichen der Stadt.',
    },
    m3: {
      title: 'Urfa-Burg',
      description:
        'Die auf dem Hügel im Stadtzentrum gelegene Urfa-Burg ist ein historisches Bauwerk mit Spuren verschiedener Epochen und Blick über die ganze Stadt.',
    },
    m4: {
      title: 'Ruinen von Harran',
      description:
        'Mit seinen kegelförmigen Lehmhäusern und seiner antiken Vergangenheit ist Harran eines der wichtigsten kulturellen Erbstätten der Region.',
    },
    m5: {
      title: 'Große Moschee von Harran',
      description:
        'Die als eine der ältesten Moscheen Anatoliens geltende Große Moschee von Harran ist ein wichtiger Teil der antiken Stadt Harran.',
    },
    m6: {
      title: 'Antike Stadt Soğmatar',
      description:
        'Eine antike Siedlung nahe der Stadt Şuayb, bekannt für Felsreliefs und Überreste eines Mondkults.',
    },
    m7: {
      title: 'Bazda-Höhlen',
      description:
        'Ein historisches Gelände mit beeindruckenden Felsformationen, einst als antike Steinbrüche genutzt.',
    },
    m8: {
      title: 'Rumkale',
      description:
        'Eine historische Burg am Ufer des Euphrat, meist per Bootstour von Halfeti aus zu erreichen.',
    },
    m9: {
      title: 'Waldrapp-Zuchtstation Birecik',
      description:
        'Ein Schutzzentrum, in dem der vom Aussterben bedrohte Waldrapp beobachtet werden kann.',
    },
    m10: {
      title: 'Archäologisches Museum Şanlıurfa',
      description:
        'Eines der reichhaltigsten archäologischen Museen der Türkei mit Funden aus Göbeklitepe und den "Taş Tepeler"-Ausgrabungen.',
    },
    m11: {
      title: 'Mosaikmuseum Haleplibahçe',
      description:
        'Beherbergt bedeutende Werke aus der Römerzeit, allen voran das Mosaik der Amazonenköniginnen.',
    },
    m12: {
      title: 'Gümrük Han',
      description:
        'Eine historische Karawanserei, ideal zum Entspannen bei traditionellem Kaffee in besonderer Atmosphäre.',
    },
    m13: {
      title: 'Historische Basare von Urfa',
      description:
        'Ein lebendiges historisches Einkaufsviertel mit Kupferschmieden, Isot-Paprika- und Regionalproduktmärkten.',
    },
    m14: {
      title: 'Karaali-Park',
      description:
        'Mit seinen Grünflächen und Spazierwegen ist der Karaali-Park ein Ort zum Durchatmen, ganz nah am Stadtzentrum.',
    },
    m15: {
      title: 'Euphrat-Ufer',
      description:
        'Den Sonnenuntergang am Ufer des Euphrat zu beobachten, ist eine der schönsten Arten, in Şanlıurfa die Natur zu genießen.',
    },
    m16: {
      title: 'Verstecktes Paradies Halfeti',
      description:
        'Ein ruhiger Ausflugsort rund um Halfeti, bekannt für seine beeindruckende Naturlandschaft.',
    },
  },
  es: {
    m1: {
      title: 'Göbeklitepe',
      description:
        'Göbeklitepe es uno de los templos conocidos más antiguos de la historia de la humanidad, ubicado al noreste de Şanlıurfa. ' +
        'Sus enormes pilares en forma de T, que datan del décimo milenio a. C. y están tallados con relieves de animales y símbolos, ' +
        'ofrecen una visión única del mundo de creencias del Neolítico. Hoy forma parte de la lista del Patrimonio Mundial de la UNESCO y se le llama "el punto cero de la historia".',
    },
    m2: {
      title: 'Balıklıgöl',
      description:
        'Balıklıgöl es un lugar sagrado en el centro de Şanlıurfa, donde según la tradición el profeta Abraham fue arrojado al fuego. ' +
        'Según la leyenda, el fuego se convirtió en agua y la leña en peces, por lo que las carpas del estanque se consideran sagradas y nunca se pescan. ' +
        'Rodeado de mezquitas, madrasas y bazares históricos, Balıklıgöl es uno de los símbolos de la ciudad tanto por su atmósfera espiritual como por su arquitectura.',
    },
    m3: {
      title: 'Castillo de Urfa',
      description:
        'Situado en la colina del centro de la ciudad, el Castillo de Urfa es una estructura histórica con huellas de distintas épocas que domina el paisaje urbano.',
    },
    m4: {
      title: 'Ruinas de Harran',
      description:
        'Con sus casas de cúpula cónica y su pasado antiguo, Harran es uno de los patrimonios culturales más importantes de la región.',
    },
    m5: {
      title: 'Gran Mezquita de Harran',
      description:
        'Considerada una de las mezquitas más antiguas de Anatolia, la Gran Mezquita de Harran es una parte importante de la antigua ciudad de Harran.',
    },
    m6: {
      title: 'Ciudad Antigua de Soğmatar',
      description:
        'Un asentamiento antiguo cerca de la Ciudad de Shuayb, destacado por sus relieves rupestres y restos de un culto lunar.',
    },
    m7: {
      title: 'Cuevas de Bazda',
      description:
        'Un sitio histórico con impresionantes formaciones rocosas, utilizado antiguamente como canteras de piedra.',
    },
    m8: {
      title: 'Rumkale',
      description:
        'Un castillo histórico a orillas del Éufrates, al que se llega mayormente en tours en barco desde Halfeti.',
    },
    m9: {
      title: 'Estación de Cría de Ibis Eremita de Birecik',
      description:
        'Un centro de conservación donde se puede observar al ibis eremita, una especie en peligro crítico de extinción.',
    },
    m10: {
      title: 'Museo Arqueológico de Şanlıurfa',
      description:
        'Uno de los museos arqueológicos más ricos de Turquía, con hallazgos de Göbeklitepe y las excavaciones de "Taş Tepeler".',
    },
    m11: {
      title: 'Museo de Mosaicos de Haleplibahçe',
      description:
        'Alberga importantes obras de la época romana, destacando el mosaico de las Reinas Amazonas.',
    },
    m12: {
      title: 'Gümrük Han',
      description:
        'Un caravasar histórico, ideal para descansar con su atmósfera y café tradicional.',
    },
    m13: {
      title: 'Bazares Históricos de Urfa',
      description:
        'Un animado barrio comercial histórico con caldereros, puestos de pimienta isot y productos locales.',
    },
    m14: {
      title: 'Parque Karaali',
      description:
        'Con sus zonas verdes y senderos, el Parque Karaali es un respiro muy cerca del centro de la ciudad.',
    },
    m15: {
      title: 'Ribera del Éufrates',
      description:
        'Ver la puesta de sol a orillas del Éufrates es una de las formas más agradables de disfrutar de la naturaleza en Şanlıurfa.',
    },
    m16: {
      title: 'Paraíso Escondido de Halfeti',
      description:
        'Un tranquilo destino cerca de Halfeti, conocido por sus impresionantes paisajes naturales.',
    },
  },
  fr: {
    m1: {
      title: 'Göbeklitepe',
      description:
        "Göbeklitepe est l'un des plus anciens sites de temples connus de l'histoire humaine, situé au nord-est de Şanlıurfa. " +
        "Ses immenses piliers en forme de T, datant du 10e millénaire av. J.-C. et ornés de reliefs d'animaux et de symboles, " +
        "offrent un aperçu unique du monde des croyances néolithiques. Aujourd'hui classé au patrimoine mondial de l'UNESCO, Göbeklitepe est souvent appelé « le point zéro de l'histoire ».",
    },
    m2: {
      title: 'Balıklıgöl',
      description:
        "Balıklıgöl est un lieu sacré au centre de Şanlıurfa, réputé être l'endroit où le prophète Abraham fut jeté dans le feu. " +
        "Selon la légende, le feu se transforma en eau et le bois en poissons ; c'est pourquoi les carpes du bassin sont considérées comme sacrées et jamais pêchées. " +
        "Entouré de mosquées, médersas et bazars historiques, Balıklıgöl est l'un des symboles de la ville, tant par son atmosphère spirituelle que par son architecture.",
    },
    m3: {
      title: 'Château d\'Urfa',
      description:
        "Situé sur la colline du centre-ville, le château d'Urfa est un édifice historique portant les traces de plusieurs époques et dominant la ville.",
    },
    m4: {
      title: 'Site antique de Harran',
      description:
        "Avec ses maisons en forme de ruche et son passé antique, Harran est l'un des patrimoines culturels les plus importants de la région.",
    },
    m5: {
      title: 'Grande Mosquée de Harran',
      description:
        "Considérée comme l'une des plus anciennes mosquées d'Anatolie, la Grande Mosquée de Harran fait partie intégrante de la cité antique de Harran.",
    },
    m6: {
      title: 'Cité antique de Soğmatar',
      description:
        "Une ancienne colonie près de la Cité de Chuayb, connue pour ses reliefs rupestres et les vestiges d'un culte lunaire.",
    },
    m7: {
      title: 'Grottes de Bazda',
      description:
        "Un site historique aux formations rocheuses impressionnantes, utilisé autrefois comme carrières de pierre antiques.",
    },
    m8: {
      title: 'Rumkale',
      description:
        "Un château historique sur les rives de l'Euphrate, principalement accessible par des tours en bateau depuis Halfeti.",
    },
    m9: {
      title: 'Station d\'élevage d\'ibis chauve de Birecik',
      description:
        "Un centre de conservation où l'on peut observer l'ibis chauve, une espèce gravement menacée.",
    },
    m10: {
      title: 'Musée archéologique de Şanlıurfa',
      description:
        "L'un des musées archéologiques les plus riches de Turquie, abritant des découvertes de Göbeklitepe et des fouilles des « Collines de Pierre ».",
    },
    m11: {
      title: 'Musée des mosaïques de Haleplibahçe',
      description:
        "Abrite d'importantes œuvres de l'époque romaine, notamment la mosaïque des reines amazones.",
    },
    m12: {
      title: 'Gümrük Han',
      description:
        "Un caravansérail historique, idéal pour se détendre grâce à son atmosphère et son café traditionnel.",
    },
    m13: {
      title: 'Bazars historiques d\'Urfa',
      description:
        "Un quartier commerçant historique animé avec chaudronniers, étals de piment isot et produits locaux.",
    },
    m14: {
      title: 'Parc Karaali',
      description:
        "Avec ses espaces verts et ses sentiers de promenade, le parc Karaali est une bouffée d'air tout près du centre-ville.",
    },
    m15: {
      title: "Rives de l'Euphrate",
      description:
        "Regarder le coucher de soleil sur les rives de l'Euphrate est l'une des façons les plus agréables de profiter de la nature à Şanlıurfa.",
    },
    m16: {
      title: 'Paradis caché de Halfeti',
      description:
        "Une escapade paisible autour de Halfeti, connue pour ses paysages naturels saisissants.",
    },
  },
  ar: {
    m1: {
      title: 'غوبكلي تبه',
      description:
        'غوبكلي تبه هو أحد أقدم المواقع المعبدية المعروفة في تاريخ البشرية، ويقع شمال شرق شانلي أورفا. ' +
        'تقدم أعمدته الضخمة على شكل حرف T، التي يعود تاريخها إلى الألفية العاشرة قبل الميلاد والمنقوشة بنقوش حيوانية ورمزية، ' +
        'لمحة فريدة عن عالم المعتقدات في العصر الحجري الحديث. يُدرج اليوم على قائمة التراث العالمي لليونسكو، ويُعرف بـ"نقطة الصفر في التاريخ".',
    },
    m2: {
      title: 'بالكلي غول',
      description:
        'بالكلي غول موقع مقدس في وسط شانلي أورفا، يُقال إنه المكان الذي أُلقي فيه النبي إبراهيم في النار. ' +
        'وفقًا للأسطورة، تحولت النار إلى ماء والحطب إلى أسماك، لذا تُعتبر أسماك الشبوط في البركة مقدسة ولا يُصطاد منها. ' +
        'محاطة بالمساجد والمدارس والأسواق التاريخية، تُعد بالكلي غول من رموز المدينة روحيًا ومعماريًا.',
    },
    m3: {
      title: 'قلعة أورفا',
      description:
        'تقع قلعة أورفا على تلة في وسط المدينة، وهي بناء تاريخي يحمل آثار عصور مختلفة ويطل على المدينة بأكملها.',
    },
    m4: {
      title: 'آثار حران',
      description:
        'ببيوتها ذات القباب المخروطية وماضيها القديم، تُعد حران واحدة من أهم المواقع الثقافية في المنطقة.',
    },
    m5: {
      title: 'جامع حران الكبير',
      description:
        'يُعتبر جامع حران الكبير من أقدم مساجد الأناضول، وهو جزء مهم من مدينة حران القديمة.',
    },
    m6: {
      title: 'مدينة سوغماتار القديمة',
      description:
        'مستوطنة قديمة قرب مدينة شعيب، تشتهر بنقوشها الصخرية وآثار عبادة القمر.',
    },
    m7: {
      title: 'كهوف بازدا',
      description:
        'موقع تاريخي ذو تكوينات صخرية مذهلة، استُخدم سابقًا كمحاجر حجرية قديمة.',
    },
    m8: {
      title: 'روم قلعة',
      description:
        'قلعة تاريخية على ضفاف نهر الفرات، يُصل إليها غالبًا برحلات القوارب من حلفتي.',
    },
    m9: {
      title: 'محطة تربية طائر الأبو منجل الأصلع في بيرجيك',
      description:
        'مركز حماية يمكن فيه مشاهدة طائر الأبو منجل الأصلع المهدد بالانقراض.',
    },
    m10: {
      title: 'متحف شانلي أورفا للآثار',
      description:
        'أحد أغنى متاحف الآثار في تركيا، ويضم مكتشفات من غوبكلي تبه وحفريات "التلال الحجرية".',
    },
    m11: {
      title: 'متحف حلبلي بهتشة للفسيفساء',
      description:
        'يضم قطعًا مهمة من العصر الروماني، وأبرزها فسيفساء ملكات الأمازون.',
    },
    m12: {
      title: 'خان الجمرك',
      description:
        'خان تاريخي، مثالي للاسترخاء بأجوائه المميزة وقهوته التقليدية.',
    },
    m13: {
      title: 'أسواق أورفا التاريخية',
      description:
        'منطقة تسوق تاريخية نابضة بالحياة تضم الصاغة النحاسية وبسطات الفلفل الإيسوت والمنتجات المحلية.',
    },
    m14: {
      title: 'حديقة كره علي',
      description:
        'بمساحاتها الخضراء ومساراتها للمشي، تُعد حديقة كره علي متنفسًا قريبًا جدًا من وسط المدينة.',
    },
    m15: {
      title: 'ضفاف نهر الفرات',
      description:
        'مشاهدة غروب الشمس على ضفاف الفرات من أمتع طرق الاستمتاع بالطبيعة في شانلي أورفا.',
    },
    m16: {
      title: 'جنة حلفتي الخفية',
      description:
        'وجهة هادئة حول حلفتي، تشتهر بمناظرها الطبيعية الخلابة.',
    },
  },
};

export const CULTURAL_ROUTE_TRANSLATIONS: Record<string, Record<string, RouteTranslation>> = {
  en: {
    '1': {
      title: 'Göbeklitepe + Balıklıgöl Tour',
      description: 'A classic Urfa route combining UNESCO World Heritage Göbeklitepe with the Balıklıgöl area',
      activities: ['Göbeklitepe visitor site', 'Lunch break', 'Balıklıgöl and surrounding historic sites', 'Walk through the bazaar area'],
      duration: 'Full Day',
      tips: 'Starting early in the morning is recommended to avoid crowded hours.',
    },
    '2': {
      title: 'Museum Tour + Café Break',
      description: 'A half-day cultural plan focused on the museums of Şanlıurfa and the city center',
      activities: ['Şanlıurfa Archaeology Museum', 'Haleplibahçe Mosaic Museum', 'Short walk around the museums', 'Break in the city center'],
      duration: 'Half Day',
      tips: 'It helps to check the museums\' current visiting hours before you go.',
    },
    '3': {
      title: 'Harran Culture Route',
      description: 'A full-day plan focused on discovering Harran\'s historic texture and traditional architecture',
      activities: ['Travel to Harran', 'Beehive houses and the ruins site', 'Around the Grand Mosque remains', 'Lunch', 'Free time in the district center'],
      duration: 'Full Day',
      tips: 'In summer temperatures can be high, so bring water and a hat.',
    },
    '4': {
      title: 'City Center Discovery Tour',
      description: 'A route bringing together the historic sites you can walk to in the center',
      activities: ['Balıklıgöl and surroundings', 'Historic bazaars (Coppersmiths, Sipahi Bazaar)', 'Viewpoints around Urfa Castle', 'Local food break', 'Evening culture program'],
      duration: 'Half Day',
      tips: 'Comfortable walking shoes make the city-center route much more pleasant.',
    },
    '5': {
      title: 'Evening Culture Tour',
      description: 'Things to do in the city center in the evening',
      activities: ['Evening walk at Balıklıgöl', 'Short visit to nearby open venues', 'Traditional Urfa cuisine', 'Sıra Gecesi / local music program'],
      duration: 'Evening',
      tips: 'Program and venue availability can change by day, so it\'s best to check in advance.',
    },
    '6': {
      title: 'Halfeti Boat Tour',
      description: 'On the banks of the Euphrates, Halfeti is one of the region\'s most special routes with its sunken old settlement, boat tours and unique scenery.',
      activities: ['Halfeti boat tour (submerged mosque and Rumkale view)', 'Walk among the old stone houses', 'Photo stops', 'Lunch', 'Return to the center'],
      duration: 'Full Day',
      tips: 'It\'s recommended to confirm boat tour and transport times before you go.',
    },
    '7': {
      title: 'Karahantepe Route',
      description: 'A Neolithic settlement and excavation site from the same cultural sphere as Göbeklitepe, dating back roughly 12,000 years. One of the key sites of the "Stone Hills" project.',
      activities: ['Visit the Karahantepe excavation site', 'Monumental stone structures and figures', 'Lunch break'],
      duration: 'Half Day',
      tips: 'Since the site is like an open-air museum, early morning visits are best in summer.',
    },
    '8': {
      title: 'City of Şuayb + Soğmatar',
      description: 'A historic area set within the natural scenery of Tektek Mountains National Park, notable for its rock-cut structures and ancient settlement remains. Usually visited together with the Soğmatar Ancient City and Senem Cave.',
      activities: ['Rock-cut structures of the City of Şuayb', 'Soğmatar Ancient City', 'Senem Cave', 'Scenic break at Tektek Mountains'],
      duration: 'Full Day',
      tips: 'Reaching this area without your own vehicle is difficult, so a car is recommended.',
    },
    '9': {
      title: 'Kızılkoyun Necropolis',
      description: 'One of Şanlıurfa\'s most striking archaeological sites, made up of Roman-era rock tombs at the edge of the city center.',
      activities: ['Visit the Kızılkoyun rock tombs', 'Short walk around Balıklıgöl'],
      duration: 'Half Day',
      tips: 'Being close to the city center, this can easily be combined with other central tours.',
    },
  },
  de: {
    '1': {
      title: 'Göbeklitepe + Balıklıgöl Tour',
      description: 'Eine klassische Urfa-Route, die das UNESCO-Welterbe Göbeklitepe mit dem Balıklıgöl-Gebiet verbindet',
      activities: ['Besucherbereich Göbeklitepe', 'Mittagspause', 'Balıklıgöl und historische Umgebung', 'Spaziergang durch das Basarviertel'],
      duration: 'Ganzer Tag',
      tips: 'Ein früher Start am Morgen wird empfohlen, um überfüllte Zeiten zu vermeiden.',
    },
    '2': {
      title: 'Museumstour + Café-Pause',
      description: 'Ein halbtägiger Kulturplan mit Fokus auf die Museen von Şanlıurfa und das Stadtzentrum',
      activities: ['Archäologisches Museum Şanlıurfa', 'Mosaikmuseum Haleplibahçe', 'Kurzer Spaziergang um die Museen', 'Pause im Stadtzentrum'],
      duration: 'Halber Tag',
      tips: 'Es lohnt sich, vorab die aktuellen Öffnungszeiten der Museen zu prüfen.',
    },
    '3': {
      title: 'Harran Kulturroute',
      description: 'Ein ganztägiger Plan zur Entdeckung der historischen Struktur und traditionellen Architektur von Harran',
      activities: ['Anreise nach Harran', 'Bienenkorbhäuser und Ausgrabungsstätte', 'Umgebung der Überreste der Großen Moschee', 'Mittagessen', 'Freizeit im Ortszentrum'],
      duration: 'Ganzer Tag',
      tips: 'Im Sommer können die Temperaturen hoch sein, Wasser und Kopfbedeckung werden empfohlen.',
    },
    '4': {
      title: 'Stadtzentrum-Entdeckungstour',
      description: 'Eine Route, die die zu Fuß erreichbaren historischen Punkte im Zentrum verbindet',
      activities: ['Balıklıgöl und Umgebung', 'Historische Basare (Kupferschmiede, Sipahi-Basar)', 'Aussichtspunkte rund um die Urfa-Burg', 'Pause mit lokalen Köstlichkeiten', 'Abendliches Kulturprogramm'],
      duration: 'Halber Tag',
      tips: 'Bequeme Wanderschuhe machen die Zentrumsroute deutlich angenehmer.',
    },
    '5': {
      title: 'Abendliche Kulturtour',
      description: 'Was man abends im Stadtzentrum unternehmen kann',
      activities: ['Abendspaziergang am Balıklıgöl', 'Kurzer Besuch geöffneter Lokale in der Umgebung', 'Traditionelle Urfa-Küche', 'Sıra-Gecesi- / lokales Musikprogramm'],
      duration: 'Abend',
      tips: 'Programm und Verfügbarkeit der Lokale können sich je nach Tag ändern, vorheriges Nachfragen wird empfohlen.',
    },
    '6': {
      title: 'Halfeti Bootstour',
      description: 'Am Ufer des Euphrat gelegen, ist Halfeti mit seiner versunkenen alten Siedlung, Bootstouren und einzigartigen Landschaft eine der besonderen Routen der Region.',
      activities: ['Halfeti-Bootstour (versunkene Moschee und Blick auf Rumkale)', 'Spaziergang zwischen den alten Steinhäusern', 'Fotopausen', 'Mittagessen', 'Rückkehr ins Zentrum'],
      duration: 'Ganzer Tag',
      tips: 'Es wird empfohlen, Bootstour- und Transportzeiten vorab zu bestätigen.',
    },
    '7': {
      title: 'Karahantepe Route',
      description: 'Eine neolithische Siedlungs- und Ausgrabungsstätte aus demselben Kulturkreis wie Göbeklitepe, etwa 12.000 Jahre alt. Eines der wichtigsten Zentren des "Taş Tepeler"-Projekts.',
      activities: ['Besuch der Ausgrabungsstätte Karahantepe', 'Monumentale Steinstrukturen und Figuren', 'Mittagspause'],
      duration: 'Halber Tag',
      tips: 'Da das Gelände einem Freilichtmuseum gleicht, sind im Sommer frühe Morgenstunden ideal.',
    },
    '8': {
      title: 'Stadt Şuayb + Soğmatar',
      description: 'Ein historisches Gebiet in der Naturlandschaft des Tektek-Gebirgs-Nationalparks, bekannt für Felsbauten und Überreste antiker Siedlungen. Wird meist zusammen mit der antiken Stadt Soğmatar und der Senem-Höhle besichtigt.',
      activities: ['Felsbauten der Stadt Şuayb', 'Antike Stadt Soğmatar', 'Senem-Höhle', 'Aussichtspause im Tektek-Gebirge'],
      duration: 'Ganzer Tag',
      tips: 'Ohne eigenes Fahrzeug ist die Anreise schwierig, ein Auto wird empfohlen.',
    },
    '9': {
      title: 'Nekropole Kızılkoyun',
      description: 'Eines der bemerkenswertesten archäologischen Erbstücke Şanlıurfas, bestehend aus römerzeitlichen Felsgräbern am Rand des Stadtzentrums.',
      activities: ['Besuch der Felsgräber von Kızılkoyun', 'Kurzer Spaziergang rund um Balıklıgöl'],
      duration: 'Halber Tag',
      tips: 'Da es nahe am Stadtzentrum liegt, lässt es sich leicht mit anderen zentralen Touren kombinieren.',
    },
  },
  es: {
    '1': {
      title: 'Tour Göbeklitepe + Balıklıgöl',
      description: 'Una ruta clásica de Urfa que combina el Patrimonio Mundial de la UNESCO Göbeklitepe con la zona de Balıklıgöl',
      activities: ['Zona de visitantes de Göbeklitepe', 'Pausa para almorzar', 'Balıklıgöl y sus alrededores históricos', 'Paseo por la zona del bazar'],
      duration: 'Día Completo',
      tips: 'Se recomienda empezar temprano por la mañana para evitar las horas concurridas.',
    },
    '2': {
      title: 'Tour de Museos + Pausa en Café',
      description: 'Un plan cultural de medio día centrado en los museos de Şanlıurfa y el centro de la ciudad',
      activities: ['Museo Arqueológico de Şanlıurfa', 'Museo de Mosaicos de Haleplibahçe', 'Paseo corto alrededor de los museos', 'Pausa en el centro de la ciudad'],
      duration: 'Medio Día',
      tips: 'Conviene comprobar antes los horarios de visita actuales de los museos.',
    },
    '3': {
      title: 'Ruta Cultural de Harran',
      description: 'Un plan de día completo centrado en descubrir el tejido histórico y la arquitectura tradicional de Harran',
      activities: ['Viaje a Harran', 'Casas de cúpula y yacimiento arqueológico', 'Alrededores de los restos de la Gran Mezquita', 'Almuerzo', 'Tiempo libre en el centro del distrito'],
      duration: 'Día Completo',
      tips: 'En verano las temperaturas pueden ser altas, se recomienda llevar agua y sombrero.',
    },
    '4': {
      title: 'Tour de Descubrimiento del Centro',
      description: 'Una ruta que reúne los puntos históricos accesibles a pie en el centro',
      activities: ['Balıklıgöl y alrededores', 'Bazares históricos (Caldereros, Bazar Sipahi)', 'Miradores alrededor del Castillo de Urfa', 'Pausa gastronómica local', 'Programa cultural nocturno'],
      duration: 'Medio Día',
      tips: 'Un calzado cómodo hace la ruta del centro mucho más agradable.',
    },
    '5': {
      title: 'Recorrido Cultural Nocturno',
      description: 'Cosas que hacer en el centro de la ciudad por la noche',
      activities: ['Paseo nocturno en Balıklıgöl', 'Visita corta a locales abiertos cercanos', 'Cocina tradicional de Urfa', 'Programa de música local / Sıra Gecesi'],
      duration: 'Noche',
      tips: 'El programa y la disponibilidad de los locales pueden variar según el día, conviene consultar con antelación.',
    },
    '6': {
      title: 'Tour en Barco por Halfeti',
      description: 'A orillas del Éufrates, Halfeti es una de las rutas más especiales de la región con su antiguo asentamiento sumergido, tours en barco y paisaje único.',
      activities: ['Tour en barco por Halfeti (mezquita sumergida y vista de Rumkale)', 'Paseo entre las antiguas casas de piedra', 'Paradas para fotos', 'Almuerzo', 'Regreso al centro'],
      duration: 'Día Completo',
      tips: 'Se recomienda confirmar antes los horarios del tour en barco y del transporte.',
    },
    '7': {
      title: 'Ruta de Karahantepe',
      description: 'Un asentamiento neolítico y yacimiento arqueológico del mismo entorno cultural que Göbeklitepe, con una antigüedad aproximada de 12.000 años. Uno de los centros clave del proyecto "Colinas de Piedra".',
      activities: ['Visita al yacimiento de Karahantepe', 'Estructuras y figuras monumentales de piedra', 'Pausa para almorzar'],
      duration: 'Medio Día',
      tips: 'Como el yacimiento funciona como un museo al aire libre, en verano es mejor visitarlo temprano por la mañana.',
    },
    '8': {
      title: 'Ciudad de Shuayb + Soğmatar',
      description: 'Una zona histórica dentro del paisaje natural del Parque Nacional de las Montañas Tektek, destacada por sus estructuras talladas en roca y restos de asentamientos antiguos. Se visita normalmente junto con la Ciudad Antigua de Soğmatar y la Cueva de Senem.',
      activities: ['Estructuras talladas en roca de la Ciudad de Shuayb', 'Ciudad Antigua de Soğmatar', 'Cueva de Senem', 'Pausa panorámica en las Montañas Tektek'],
      duration: 'Día Completo',
      tips: 'Llegar a esta zona sin vehículo propio es difícil, se recomienda ir en coche.',
    },
    '9': {
      title: 'Necrópolis de Kızılkoyun',
      description: 'Uno de los patrimonios arqueológicos más llamativos de Şanlıurfa, formado por tumbas rupestres de la época romana en el borde del centro de la ciudad.',
      activities: ['Visita a las tumbas rupestres de Kızılkoyun', 'Paseo corto alrededor de Balıklıgöl'],
      duration: 'Medio Día',
      tips: 'Al estar cerca del centro de la ciudad, se puede combinar fácilmente con otros tours centrales.',
    },
  },
  fr: {
    '1': {
      title: 'Tour Göbeklitepe + Balıklıgöl',
      description: "Un itinéraire classique d'Urfa combinant le site du patrimoine mondial de l'UNESCO Göbeklitepe et la zone de Balıklıgöl",
      activities: ['Site de visite de Göbeklitepe', 'Pause déjeuner', 'Balıklıgöl et ses environs historiques', 'Promenade dans le quartier du bazar'],
      duration: 'Journée Complète',
      tips: "Il est conseillé de commencer tôt le matin pour éviter les heures d'affluence.",
    },
    '2': {
      title: 'Tour des Musées + Pause Café',
      description: "Un programme culturel d'une demi-journée centré sur les musées de Şanlıurfa et le centre-ville",
      activities: ['Musée archéologique de Şanlıurfa', 'Musée des mosaïques de Haleplibahçe', 'Courte promenade autour des musées', 'Pause au centre-ville'],
      duration: 'Demi-Journée',
      tips: "Il est utile de vérifier au préalable les horaires de visite actuels des musées.",
    },
    '3': {
      title: 'Route Culturelle de Harran',
      description: "Un programme d'une journée complète axé sur la découverte du tissu historique et de l'architecture traditionnelle de Harran",
      activities: ['Trajet vers Harran', 'Maisons en forme de ruche et site archéologique', 'Autour des vestiges de la Grande Mosquée', 'Déjeuner', 'Temps libre dans le centre du district'],
      duration: 'Journée Complète',
      tips: "En été les températures peuvent être élevées, pensez à emporter de l'eau et un chapeau.",
    },
    '4': {
      title: 'Tour de Découverte du Centre-Ville',
      description: "Un itinéraire réunissant les sites historiques accessibles à pied dans le centre",
      activities: ['Balıklıgöl et ses environs', 'Bazars historiques (Chaudronniers, Bazar Sipahi)', "Points de vue autour du château d'Urfa", 'Pause gastronomie locale', 'Programme culturel en soirée'],
      duration: 'Demi-Journée',
      tips: "Des chaussures de marche confortables rendent l'itinéraire du centre bien plus agréable.",
    },
    '5': {
      title: 'Balade Culturelle du Soir',
      description: 'Que faire dans le centre-ville en soirée',
      activities: ['Promenade du soir à Balıklıgöl', 'Courte visite des lieux ouverts à proximité', 'Cuisine traditionnelle d\'Urfa', 'Programme de musique locale / Sıra Gecesi'],
      duration: 'Soirée',
      tips: "Le programme et la disponibilité des lieux peuvent varier selon les jours, mieux vaut se renseigner à l'avance.",
    },
    '6': {
      title: 'Tour en Bateau à Halfeti',
      description: "Sur les rives de l'Euphrate, Halfeti est l'un des itinéraires les plus spéciaux de la région avec son ancien village englouti, ses tours en bateau et son paysage unique.",
      activities: ['Tour en bateau à Halfeti (mosquée engloutie et vue sur Rumkale)', 'Promenade parmi les vieilles maisons de pierre', 'Arrêts photo', 'Déjeuner', 'Retour au centre'],
      duration: 'Journée Complète',
      tips: "Il est recommandé de confirmer les horaires du tour en bateau et du transport avant de partir.",
    },
    '7': {
      title: 'Route de Karahantepe',
      description: "Un site de peuplement néolithique et de fouilles appartenant à la même sphère culturelle que Göbeklitepe, datant d'environ 12 000 ans. L'un des principaux centres du projet « Collines de Pierre ».",
      activities: ['Visite du site de fouilles de Karahantepe', 'Structures et figures monumentales en pierre', 'Pause déjeuner'],
      duration: 'Demi-Journée',
      tips: "Le site étant comme un musée à ciel ouvert, mieux vaut le visiter tôt le matin en été.",
    },
    '8': {
      title: 'Cité de Chuayb + Soğmatar',
      description: "Une zone historique nichée dans le paysage naturel du parc national des montagnes Tektek, remarquable pour ses structures taillées dans la roche et ses vestiges d'habitat antique. Généralement visitée avec la cité antique de Soğmatar et la grotte de Senem.",
      activities: ['Structures rupestres de la Cité de Chuayb', 'Cité antique de Soğmatar', 'Grotte de Senem', 'Pause panoramique dans les montagnes Tektek'],
      duration: 'Journée Complète',
      tips: "Il est difficile d'accéder à cette zone sans véhicule personnel, une voiture est recommandée.",
    },
    '9': {
      title: 'Nécropole de Kızılkoyun',
      description: "L'un des patrimoines archéologiques les plus remarquables de Şanlıurfa, composé de tombes rupestres de l'époque romaine à l'entrée du centre-ville.",
      activities: ['Visite des tombes rupestres de Kızılkoyun', 'Courte promenade autour de Balıklıgöl'],
      duration: 'Demi-Journée',
      tips: "Étant proche du centre-ville, il peut facilement être combiné avec d'autres visites centrales.",
    },
  },
  ar: {
    '1': {
      title: 'جولة غوبكلي تبه + بالكلي غول',
      description: 'مسار كلاسيكي في أورفا يجمع بين موقع التراث العالمي لليونسكو غوبكلي تبه ومنطقة بالكلي غول',
      activities: ['موقع زيارة غوبكلي تبه', 'استراحة غداء', 'بالكلي غول والمواقع التاريخية المحيطة', 'المشي في منطقة السوق'],
      duration: 'يوم كامل',
      tips: 'يُنصح بالبدء مبكرًا صباحًا لتجنب أوقات الازدحام.',
    },
    '2': {
      title: 'جولة متاحف + استراحة مقهى',
      description: 'خطة ثقافية نصف يومية تركز على متاحف شانلي أورفا ووسط المدينة',
      activities: ['متحف شانلي أورفا للآثار', 'متحف حلبلي بهتشة للفسيفساء', 'نزهة قصيرة حول المتاحف', 'استراحة في وسط المدينة'],
      duration: 'نصف يوم',
      tips: 'يُفضّل التحقق من مواعيد زيارة المتاحف الحالية قبل الذهاب.',
    },
    '3': {
      title: 'مسار حران الثقافي',
      description: 'خطة ليوم كامل تركز على اكتشاف النسيج التاريخي والعمارة التقليدية لحران',
      activities: ['التوجه إلى حران', 'البيوت القبابية وموقع الآثار', 'محيط بقايا الجامع الكبير', 'الغداء', 'وقت حر في مركز المنطقة'],
      duration: 'يوم كامل',
      tips: 'قد ترتفع درجات الحرارة صيفًا، يُنصح بإحضار الماء وقبعة.',
    },
    '4': {
      title: 'جولة اكتشاف وسط المدينة',
      description: 'مسار يجمع النقاط التاريخية التي يمكن الوصول إليها سيرًا في الوسط',
      activities: ['بالكلي غول ومحيطها', 'الأسواق التاريخية (سوق النحاسين، سوق سيباهي)', 'نقاط إطلالة حول قلعة أورفا', 'استراحة نكهات محلية', 'برنامج ثقافي مسائي'],
      duration: 'نصف يوم',
      tips: 'ارتداء حذاء مشي مريح يجعل جولة الوسط أكثر راحة.',
    },
    '5': {
      title: 'جولة ثقافية مسائية',
      description: 'أنشطة يمكن القيام بها في وسط المدينة مساءً',
      activities: ['نزهة مسائية عند بالكلي غول', 'زيارة قصيرة للأماكن المفتوحة القريبة', 'المأكولات التقليدية لأورفا', 'برنامج موسيقى محلية / ليلة سرا'],
      duration: 'مساء',
      tips: 'قد يختلف البرنامج وتوفر الأماكن حسب اليوم، يُفضّل السؤال مسبقًا.',
    },
    '6': {
      title: 'جولة قوارب حلفتي',
      description: 'على ضفاف نهر الفرات، تُعد حلفتي أحد أخص مسارات المنطقة بمستوطنتها القديمة الغارقة وجولات القوارب ومناظرها الفريدة.',
      activities: ['جولة قوارب حلفتي (المسجد الغارق وإطلالة روم قلعة)', 'المشي بين البيوت الحجرية القديمة', 'محطات تصوير', 'الغداء', 'العودة إلى المركز'],
      duration: 'يوم كامل',
      tips: 'يُنصح بتأكيد مواعيد جولة القوارب والنقل قبل الذهاب.',
    },
    '7': {
      title: 'مسار كاراهان تبه',
      description: 'موقع استيطاني وحفري من العصر الحجري الحديث ينتمي لنفس المحيط الثقافي لغوبكلي تبه، يعود تاريخه إلى نحو 12 ألف عام. أحد أهم مراكز مشروع "التلال الحجرية".',
      activities: ['زيارة موقع حفريات كاراهان تبه', 'الهياكل والتماثيل الحجرية الضخمة', 'استراحة غداء'],
      duration: 'نصف يوم',
      tips: 'بما أن الموقع أشبه بمتحف مفتوح، يُفضّل زيارته صباحًا باكرًا في الصيف.',
    },
    '8': {
      title: 'مدينة شعيب + سوغماتار',
      description: 'منطقة تاريخية ضمن المناظر الطبيعية لمتنزه جبال تك تك الوطني، تشتهر بمبانيها المنحوتة في الصخر وبقايا مستوطنة قديمة. تُزار عادة مع مدينة سوغماتار القديمة وكهف سنم.',
      activities: ['المباني المنحوتة في صخر مدينة شعيب', 'مدينة سوغماتار القديمة', 'كهف سنم', 'استراحة إطلالة في جبال تك تك'],
      duration: 'يوم كامل',
      tips: 'يصعب الوصول إلى هذه المنطقة دون سيارة خاصة، يُنصح بالذهاب بالسيارة.',
    },
    '9': {
      title: 'مقبرة قيزيلقويون',
      description: 'أحد أبرز المواقع الأثرية في شانلي أورفا، ويتكون من مقابر صخرية من العصر الروماني عند مدخل وسط المدينة.',
      activities: ['زيارة مقابر قيزيلقويون الصخرية', 'نزهة قصيرة حول بالكلي غول'],
      duration: 'نصف يوم',
      tips: 'لقربها من وسط المدينة، يمكن دمجها بسهولة مع جولات مركزية أخرى.',
    },
  },
};

/**
 * HomeScreen'in "lunch box" önizleme kartlarındaki özel (curated) açıklamalar
 * — sadece m1-m4 için, MOCK_MAGAZINES'in genel açıklamasının yerine geçer.
 */
export const CURATED_LANDMARK_TRANSLATIONS: Record<string, Record<string, { year: string; desc: string; tag: string }>> = {
  en: {
    m1: { year: '~12,000 YEARS AGO', desc: "The world's known oldest temple complex. A discovery that rewrote human history.", tag: 'UNESCO World Heritage' },
    m2: { year: 'PROPHET ABRAHAM', desc: "The pool where the sacred fish live. A center of belief for thousands of years, right in the heart of Şanlıurfa.", tag: 'Sacred Site' },
    m4: { year: '3000 BC', desc: "One of the world's still-inhabited oldest settlements. Distinctive architecture with beehive houses.", tag: 'Historic Town' },
    m3: { year: '3rd CENTURY BC', desc: "The historic castle overlooking the city. A panoramic view of Balıklıgöl from its columns.", tag: 'Historic Structure' },
  },
  de: {
    m1: { year: 'VOR ~12.000 JAHREN', desc: 'Der weltweit bekannte älteste Tempelkomplex. Eine Entdeckung, die die Menschheitsgeschichte neu schrieb.', tag: 'UNESCO-Welterbe' },
    m2: { year: 'PROPHET ABRAHAM', desc: 'Der See, in dem die heiligen Fische leben. Seit Jahrtausenden ein Glaubenszentrum im Herzen von Şanlıurfa.', tag: 'Heilige Stätte' },
    m4: { year: '3000 V. CHR.', desc: 'Eine der ältesten noch bewohnten Siedlungen der Welt. Eigenständige Architektur mit Bienenkorbhäusern.', tag: 'Historische Stadt' },
    m3: { year: '3. JH. V. CHR.', desc: 'Die historische Burg, die die Stadt überragt. Panoramablick auf Balıklıgöl von ihren Säulen aus.', tag: 'Historisches Bauwerk' },
  },
  es: {
    m1: { year: 'HACE ~12.000 AÑOS', desc: 'El complejo de templos más antiguo conocido del mundo. Un descubrimiento que reescribió la historia de la humanidad.', tag: 'Patrimonio Mundial UNESCO' },
    m2: { year: 'PROFETA ABRAHAM', desc: 'El estanque donde viven los peces sagrados. Un centro de fe desde hace miles de años, en el corazón de Şanlıurfa.', tag: 'Lugar Sagrado' },
    m4: { year: '3000 A.C.', desc: 'Uno de los asentamientos habitados más antiguos del mundo. Arquitectura distintiva con casas de cúpula.', tag: 'Ciudad Histórica' },
    m3: { year: 'SIGLO III A.C.', desc: 'El castillo histórico que domina la ciudad. Vista panorámica de Balıklıgöl desde sus columnas.', tag: 'Estructura Histórica' },
  },
  fr: {
    m1: { year: 'IL Y A ~12 000 ANS', desc: "Le plus ancien complexe de temples connu au monde. Une découverte qui a réécrit l'histoire de l'humanité.", tag: "Patrimoine mondial de l'UNESCO" },
    m2: { year: 'PROPHÈTE ABRAHAM', desc: "Le bassin où vivent les poissons sacrés. Un centre de croyance depuis des millénaires, au cœur de Şanlıurfa.", tag: 'Site Sacré' },
    m4: { year: '3000 AV. J.-C.', desc: "L'une des plus anciennes colonies encore habitées au monde. Architecture distinctive aux maisons en forme de ruche.", tag: 'Ville Historique' },
    m3: { year: 'IIIe SIÈCLE AV. J.-C.', desc: "Le château historique qui domine la ville. Vue panoramique sur Balıklıgöl depuis ses colonnes.", tag: 'Édifice Historique' },
  },
  ar: {
    m1: { year: 'قبل نحو 12,000 عام', desc: 'أقدم مجمع معابد معروف في العالم. اكتشاف أعاد كتابة تاريخ البشرية.', tag: 'تراث عالمي لليونسكو' },
    m2: { year: 'النبي إبراهيم', desc: 'البركة التي تعيش فيها الأسماك المقدسة. مركز إيماني منذ آلاف السنين في قلب شانلي أورفا.', tag: 'موقع مقدس' },
    m4: { year: '3000 ق.م', desc: 'واحدة من أقدم المستوطنات المأهولة في العالم. عمارة مميزة ببيوت قبابية.', tag: 'مدينة تاريخية' },
    m3: { year: 'القرن الثالث ق.م', desc: 'القلعة التاريخية المطلة على المدينة. إطلالة بانورامية على بالكلي غول من أعمدتها.', tag: 'مبنى تاريخي' },
  },
};

export function localizeHeritageItem<T extends { id: string; title: string; description?: string }>(
  item: T,
  lang: string
): T {
  if (lang === 'tr') return item;
  const t = HERITAGE_TRANSLATIONS[lang]?.[item.id];
  if (!t) return item;
  return { ...item, title: t.title, description: t.description };
}

export function localizeWeekendPlan<
  T extends { id: string; title: string; description: string; activities: string[]; duration: string; tips?: string }
>(plan: T, lang: string): T {
  if (lang === 'tr') return plan;
  const t = CULTURAL_ROUTE_TRANSLATIONS[lang]?.[plan.id];
  if (!t) return plan;
  return {
    ...plan,
    title: t.title,
    description: t.description,
    activities: t.activities,
    duration: t.duration,
    tips: t.tips,
  };
}
