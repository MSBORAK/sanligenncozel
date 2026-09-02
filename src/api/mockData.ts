import { User, Story, Bus, DiscountPartner, ChatMessage, Event, Magazine, Bulletin, Reward, PointsHistory, NotificationItem } from '@/types';
import { Coffee, Utensils, Film, Book, Pill, Library, Route, Shirt } from 'lucide-react-native';

export const MOCK_USER: User = {
  name: 'Mert',
  avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
  isVerified: false,
  dob: '2004',
  status: 'Öğrenci',
  cardNumber: '639921',
};

export const MOCK_STORIES: Story[] = [
  { id: '1', user: { name: 'Ali', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704e' } },
  { id: '2', user: { name: 'Ayşe', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704f' } },
  { id: '3', user: { name: 'Fatma', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704a' } },
  { id: '4', user: { name: 'Mehmet', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704b' } },
  { id: '5', user: { name: 'Zeynep', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704c' } },
];

export const MOCK_BUSES: Bus[] = [
    { id: '1', lineNumber: '90', destination: 'OSMANBEY KAMPÜS', arrivalTime: 3, lineColor: '#758956', stops: ['Abide', 'Valilik', 'Karaköprü', 'Osmanbey'] },
    { id: '2', lineNumber: '63', destination: 'KARAKÖPRÜ', arrivalTime: 5, lineColor: '#22c55e', stops: ['Toplama Merkezi', 'Müze', 'Piazza', 'Diyarbakır Yolu'] },
    { id: '3', lineNumber: '74', destination: 'ESENTEPE', arrivalTime: 8, lineColor: '#f97316', stops: ['Çevik Kuvvet', 'Belediye', 'Adliye', 'Esentepe'] },
    { id: '4', lineNumber: '24', destination: 'SIRA GECESİ', arrivalTime: 12, lineColor: '#3b82f6', stops: ['Haleplibahçe', 'Balıklıgöl', 'Haşimiye', 'Belediye Konuk Evi'] },
];

export const MOCK_PARTNERS: DiscountPartner[] = [
    {
      id: '1',
      name: 'Mırra Kahve Evi',
      offer: '%20 İndirim',
      description: 'Tüm kahve çeşitlerinde geçerli %20 indirim fırsatı!',
      url: 'https://mirrakahveevi.com',
      bgColor: '#ffedd5',
      iconColor: '#f97316',
      icon: Coffee,
      category: 'Kafe',
    },
    { 
      id: '2', 
      name: 'Meşhur Ciğerci', 
      offer: 'Ayran İkramı', 
      description: 'Porsiyon ciğer siparişine', 
      icon: Utensils, 
      url: '#', 
      bgColor: '#fee2e2', 
      iconColor: '#ef4444',
      category: 'Yiyecek',
    },
    { 
      id: '3', 
      name: 'Piazza AVM Sinema', 
      offer: 'Genç Bileti', 
      description: 'Hafta içi seanslarda', 
      icon: Film, 
      url: '#', 
      bgColor: '#e0e7ff', 
      iconColor: '#4f46e5',
      category: 'Sinema',
    },
    {
      id: '4',
      name: 'Urfa Moda',
      offer: '%15 İndirim',
      description: 'Tüm giyim ürünlerinde',
      icon: Shirt,
      url: '#',
      bgColor: '#f3e8ff',
      iconColor: '#a855f7',
      category: 'Giyim',
    },
    {
      id: '5',
      name: 'Starbucks',
      offer: 'İkinci Kahve Bedava',
      description: 'Her iki kahvede bir',
      icon: Coffee,
      url: '#',
      bgColor: '#ffedd5',
      iconColor: '#f97316',
      category: 'Kafe',
    },
    {
      id: '6',
      name: 'Cinema City',
      offer: 'Öğrenci İndirimi',
      description: 'Hafta sonu seanslarında',
      icon: Film,
      url: '#',
      bgColor: '#e0e7ff',
      iconColor: '#4f46e5',
      category: 'Sinema',
    },
];

export const MOCK_MESSAGES: ChatMessage[] = [
    { id: '1', sender: 'bot', text: 'Merhaba! Ben ŞanlıAsistan. Sana nasıl yardımcı olabilirim?', timestamp: '10:00' },
    { id: '2', sender: 'user', text: 'Otobüs saatlerini öğrenebilir miyim?', timestamp: '10:01' },
];

export const MOCK_EVENTS: Event[] = [
  { id: '1', title: 'Sıra Gecesi', date: '15 Aralık', location: 'Balıklıgöl', category: 'Gezi', image: 'https://images.unsplash.com/photo-1593839238634-2b744a8677f5?q=80&w=2574&auto=format&fit=crop' },
  { id: '2', title: 'Yaz Konseri', date: '20 Aralık', location: 'Arkeoloji Müzesi', category: 'Konser', image: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?q=80&w=2670&auto=format&fit=crop' },
  { id: '3', title: 'Maraton', date: '25 Aralık', location: 'GAP Vadisi', category: 'Spor', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2670&auto=format&fit=crop' },
];

export const MOCK_MAGAZINES: Magazine[] = [
    {
      id: 'm1',
      title: 'Göbeklitepe',
      image: require('@/assets/images/gobeklitepe.jpg'),
      category: 'historic',
      description:
        'Göbeklitepe, insanlık tarihinin bilinen en eski tapınak alanlarından biridir ve Şanlıurfa\'nın kuzeydoğusunda yer alır. ' +
        'MÖ 10. binyıla tarihlenen T biçimli devasa dikilitaşları, üzerlerindeki hayvan ve sembol kabartmalarıyla neolitik dönemin ' +
        'inanç dünyasına dair benzersiz ipuçları sunar. Bugün UNESCO Dünya Mirası listesinde yer alan Göbeklitepe, "tarihin sıfır noktası" olarak anılır.'
    },
    {
      id: 'm2',
      title: 'Balıklıgöl',
      image: require('@/assets/images/balikligol.jpg'),
      category: 'faith',
      description:
        'Balıklıgöl, Şanlıurfa şehir merkezinde yer alan ve Hz. İbrahim\'in ateşe atıldığı yer olarak rivayet edilen kutsal bir mekândır. ' +
        'Efsaneye göre ateş suya, odunlar ise balığa dönüşür; bu yüzden göldeki sazan balıkları kutsal kabul edilir ve avlanmaz. ' +
        'Çevresindeki tarihi camiler, medreseler ve çarşılarla birlikte Balıklıgöl, hem manevi atmosferi hem de mimarisiyle kentin simgelerindendir.'
    },
    {
      id: 'm3',
      title: 'Urfa Kalesi',
      image: require('@/assets/images/urfakalesi.jpg'),
      category: 'historic',
      description:
        'Şehrin merkezindeki tepe üzerinde yer alan Urfa Kalesi, farklı dönemlerden izler taşıyan ve şehir manzarasına hâkim tarihi bir yapıdır.',
    },
    {
      id: 'm4',
      title: 'Harran Ören Yeri',
      image: require('@/assets/images/harran.jpg'),
      category: 'historic',
      description:
        'Konik kubbeli evleri ve antik geçmişiyle Harran, bölgenin en önemli kültürel miraslarından biridir.',
    },
    {
      id: 'm5',
      title: 'Harran Ulu Camii',
      image: require('@/assets/images/harran_ulu_cami.jpg'),
      category: 'faith',
      description:
        'Anadolu\'nun en eski camilerinden biri kabul edilen Harran Ulu Camii, Harran antik kentinin önemli bir parçasıdır.',
    },
    {
      id: 'm6',
      title: 'Soğmatar Antik Kenti',
      image: require('@/assets/images/sogmatar.jpg'),
      category: 'historic',
      description:
        'Kaya kabartmaları ve ay kültü kalıntılarıyla dikkat çeken, Şuayb Şehri yakınındaki antik yerleşim.',
    },
    {
      id: 'm7',
      title: 'Bazda Mağaraları',
      image: require('@/assets/images/bazda_magaralari.jpg'),
      category: 'historic',
      description:
        'Antik taş ocakları olarak kullanılan, etkileyici kaya oluşumlarına sahip tarihi bir alan.',
    },
    {
      id: 'm8',
      title: 'Rumkale',
      image: require('@/assets/images/rumkale.jpg'),
      category: 'historic',
      description:
        'Fırat kıyısında, çoğunlukla Halfeti tekne turlarıyla görülebilen tarihi bir kale.',
    },
    {
      id: 'm9',
      title: 'Birecik Kelaynak Üretme İstasyonu',
      image: require('@/assets/images/kelaynak.jpg'),
      category: 'nature',
      description:
        'Nesli tehlike altındaki kelaynak kuşlarının gözlemlenebildiği bir koruma merkezi.',
    },
    {
      id: 'm10',
      title: 'Şanlıurfa Arkeoloji Müzesi',
      image: require('@/assets/images/arkeoloji_muzesi.jpg'),
      category: 'museum',
      description:
        'Göbeklitepe ve Taş Tepeler buluntularını barındıran, Türkiye\'nin en zengin arkeoloji müzelerinden biri.',
    },
    {
      id: 'm11',
      title: 'Haleplibahçe Mozaik Müzesi',
      image: require('@/assets/images/mozaik_muzesi.jpg'),
      category: 'museum',
      description:
        'Amazon Kraliçeleri mozaiği başta olmak üzere önemli Roma dönemi eserlerine ev sahipliği yapan müze.',
    },
    {
      id: 'm12',
      title: 'Gümrük Hanı',
      image: require('@/assets/images/gumruk_hani.jpg'),
      category: 'bazaar',
      description:
        'Tarihi atmosferi ve geleneksel kahveleriyle dinlenmek için ideal, tarihi bir han.',
    },
    {
      id: 'm13',
      title: 'Tarihi Urfa Çarşıları',
      image: require('@/assets/images/urfa_carsi.jpg'),
      category: 'bazaar',
      description:
        'Bakırcılar, isot ve yöresel ürün çarşılarıyla canlı bir alışveriş deneyimi sunan tarihi çarşı bölgesi.',
    },
    {
      id: 'm14',
      title: 'Karaali Parkı',
      image: require('@/assets/images/karaali_parki.jpg'),
      category: 'nature',
      description:
        'Karaali Parkı, yeşil alanları ve yürüyüş yolları ile şehir merkezine çok yakın bir nefes alma noktasıdır.',
    },
    {
      id: 'm15',
      title: 'Fırat Nehri Kıyısı',
      image: require('@/assets/images/firat_kiyisi.jpg'),
      category: 'nature',
      description:
        'Fırat Nehri kıyısında gün batımını izlemek, Şanlıurfa\'da doğayla baş başa kalmanın en keyifli yollarından biridir.',
    },
    {
      id: 'm16',
      title: 'Halfeti Saklı Cennet',
      image: require('@/assets/images/halfeti_sakli_cennet.png'),
      category: 'nature',
      description:
        'Halfeti çevresinde doğal manzaralarıyla öne çıkan sakin bir gezi noktası.',
    },
];

export const MOCK_BULLETINS: Bulletin[] = [
    { id: '1', title: 'Aralık Ayı E-Dergi', url: '#' },
    { id: '2', title: 'Gençlik Festivali Broşürü', url: '#' },
];

export const MOCK_REWARDS: Reward[] = [
    { id: '1', name: 'Bedava Kahve', points: 500, icon: 'coffee' },
    { id: '2', name: 'Otobüs Bileti', points: 200, icon: 'bus' },
    { id: '3', name: 'Sinema Bileti', points: 1000, icon: 'film' },
];

export const MOCK_POINTS_HISTORY: PointsHistory[] = [
    { id: '1', description: 'Otobüs Kullanımı', points: 50, date: '10 Aralık' },
    { id: '2', description: 'Bedava Kahve', points: -500, date: '9 Aralık' },
    { id: '3', description: 'Anket Doldurma', points: 100, date: '8 Aralık' },
];

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'Yeni İndirim: Mırra Kahve Evi',
    message: 'Tüm kahve çeşitlerinde bugün %20 indirim seni bekliyor.',
    type: 'discount',
    createdAt: 'Bugün, 10:15',
    isRead: false,
  },
  {
    id: '2',
    title: 'Bu Akşam Sıra Gecesi',
    message: 'Balıklıgöl\'deki sıra gecesi etkinliği saat 20:00\'de başlıyor. Katılmayı unutma!',
    type: 'event',
    createdAt: 'Dün, 18:00',
    isRead: false,
  },
  {
    id: '3',
    title: 'Genç Bileti Fırsatı',
    message: 'Piazza AVM sinemasında hafta içi seanslarında genç bileti kampanyası devam ediyor.',
    type: 'discount',
    createdAt: '2 gün önce',
    isRead: true,
  },
];

// Eczane verileri
export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
  distance: number; // km cinsinden
  isOnDuty: boolean; // nöbetçi mi?
  coordinates: { lat: number; lon: number };
}

export const MOCK_PHARMACIES: Pharmacy[] = [
  {
    id: '1',
    name: 'Merkez Eczanesi',
    address: 'Atatürk Bulvarı No: 45, Karaköprü',
    phone: '0414 123 45 67',
    distance: 0.8,
    isOnDuty: true,
    coordinates: { lat: 37.1674, lon: 38.7955 },
  },
  {
    id: '2',
    name: 'Şifa Eczanesi',
    address: 'Vali Fuat Caddesi No: 12, Merkez',
    phone: '0414 234 56 78',
    distance: 1.2,
    isOnDuty: true,
    coordinates: { lat: 37.1580, lon: 38.7920 },
  },
  {
    id: '3',
    name: 'Sağlık Eczanesi',
    address: 'Osmanbey Mahallesi, Üniversite Caddesi No: 8',
    phone: '0414 345 67 89',
    distance: 2.5,
    isOnDuty: false,
    coordinates: { lat: 37.1800, lon: 38.8000 },
  },
  {
    id: '4',
    name: 'Hilal Eczanesi',
    address: 'Balıklıgöl Caddesi No: 25',
    phone: '0414 456 78 90',
    distance: 0.5,
    isOnDuty: true,
    coordinates: { lat: 37.1650, lon: 38.7900 },
  },
  {
    id: '5',
    name: 'Yıldız Eczanesi',
    address: 'Piazza AVM Yanı, Diyarbakır Yolu',
    phone: '0414 567 89 01',
    distance: 3.1,
    isOnDuty: false,
    coordinates: { lat: 37.1900, lon: 38.8100 },
  },
];

// Kütüphane verileri
export interface Library {
  id: string;
  name: string;
  address: string;
  phone: string;
  distance: number; // km cinsinden
  workingHours: string;
  coordinates: { lat: number; lon: number };
}

export const MOCK_LIBRARIES: Library[] = [
  {
    id: '1',
    name: 'Şanlıurfa İl Halk Kütüphanesi',
    address: 'Atatürk Bulvarı No: 120, Merkez',
    phone: '0414 123 45 67',
    distance: 1.0,
    workingHours: '08:00 - 18:00',
    coordinates: { lat: 37.1680, lon: 38.7930 },
  },
  {
    id: '2',
    name: 'Harran Üniversitesi Kütüphanesi',
    address: 'Osmanbey Kampüsü, Üniversite Caddesi',
    phone: '0414 234 56 78',
    distance: 2.8,
    workingHours: '08:00 - 20:00',
    coordinates: { lat: 37.1820, lon: 38.8020 },
  },
  {
    id: '3',
    name: 'Çocuk Kütüphanesi',
    address: 'Karaali Parkı Yanı, Şehitlik Mahallesi',
    phone: '0414 345 67 89',
    distance: 1.5,
    workingHours: '09:00 - 17:00',
    coordinates: { lat: 37.1700, lon: 38.7970 },
  },
  {
    id: '4',
    name: 'Karaköprü Şube Kütüphanesi',
    address: 'Karaköprü Belediye Binası Yanı',
    phone: '0414 456 78 90',
    distance: 0.9,
    workingHours: '08:00 - 17:00',
    coordinates: { lat: 37.1600, lon: 38.7910 },
  },
];

// Hafta Sonu Planları verileri
export interface WeekendPlan {
  id: string;
  title: string;
  description: string;
  activities: string[]; // Aktivite listesi
  duration: string; // tahmini süre
  category: 'tam-gün' | 'yarım-gün' | 'akşam';
  coordinates: { lat: number; lon: number }; // rotanın ana konumu
  waypoints: { name: string; lat: number; lon: number }[]; // mesafe hesabı için duraklar
  image?: any; // URL string veya yerel require kaynağı
  tips?: string; // İpuçları
}

export const MOCK_WEEKEND_PLANS: WeekendPlan[] = [
  {
    id: '1',
    title: 'Göbeklitepe + Balıklıgöl Turu',
    description: 'UNESCO Dünya Mirası Göbeklitepe ile Balıklıgöl çevresini birleştiren klasik Urfa rotası',
    activities: [
      'Göbeklitepe ziyaret alanı',
      'Öğle yemeği molası',
      'Balıklıgöl ve çevresindeki tarihi alanlar',
      'Çarşı bölgesinde yürüyüş'
    ],
    duration: 'Tam Gün',
    category: 'tam-gün',
    coordinates: { lat: 37.2236, lon: 38.9226 }, // Göbeklitepe
    waypoints: [
      { name: 'Göbeklitepe', lat: 37.2236, lon: 38.9226 },
      { name: 'Öğle molası', lat: 37.201, lon: 38.88 },
      { name: 'Balıklıgöl', lat: 37.1486, lon: 38.7969 },
      { name: 'Çarşı', lat: 37.1498, lon: 38.7915 },
    ],
    image: require('@/assets/images/gobeklitepe.jpg'),
    tips: 'Yoğun saatlerden kaçınmak için sabah erken başlamanız önerilir.',
  },
  {
    id: '2',
    title: 'Müze Gezisi + Kafe Molası',
    description: 'Şanlıurfa müzeleri ve şehir merkezi odaklı yarım günlük kültür planı',
    activities: [
      'Şanlıurfa Arkeoloji Müzesi',
      'Haleplibahçe Mozaik Müzesi',
      'Müze çevresinde kısa yürüyüş',
      'Şehir merkezinde mola'
    ],
    duration: 'Yarım Gün',
    category: 'yarım-gün',
    coordinates: { lat: 37.1595, lon: 38.7989 }, // Arkeoloji Müzesi
    waypoints: [
      { name: 'Arkeoloji Müzesi', lat: 37.1595, lon: 38.7989 },
      { name: 'Mozaik Müzesi', lat: 37.1591, lon: 38.7997 },
      { name: 'Müze çevresi', lat: 37.16, lon: 38.8008 },
      { name: 'Şehir merkezi', lat: 37.151, lon: 38.7935 },
    ],
    image: require('@/assets/images/arkeoloji_muzesi.jpg'),
    tips: 'Müzelerin güncel ziyaret saatlerini gitmeden önce kontrol etmeniz faydalı olur.',
  },
  {
    id: '3',
    title: 'Harran Kültür Rotası',
    description: 'Harran\'ın tarihi dokusunu ve geleneksel mimarisini keşfetmeye odaklanan tam günlük plan',
    activities: [
      'Harran\'a ulaşım',
      'Kümbet evler ve ören alanı',
      'Ulu Cami kalıntıları çevresi',
      'Öğle yemeği',
      'İlçe merkezinde serbest zaman'
    ],
    duration: 'Tam Gün',
    category: 'tam-gün',
    coordinates: { lat: 36.8625, lon: 39.0315 }, // Harran
    waypoints: [
      { name: 'Harran giriş', lat: 36.8608, lon: 39.0304 },
      { name: 'Kümbet evler', lat: 36.8616, lon: 39.0322 },
      { name: 'Ulu Cami', lat: 36.8631, lon: 39.0341 },
      { name: 'Öğle molası', lat: 36.866, lon: 39.0289 },
      { name: 'İlçe merkezi', lat: 36.862, lon: 39.031 },
    ],
    image: require('@/assets/images/harran.jpg'),
    tips: 'Yaz aylarında sıcaklık yüksek olabildiği için su ve şapka bulundurmanız önerilir.',
  },
  {
    id: '4',
    title: 'Şehir Merkezi Keşif Turu',
    description: 'Merkezde yürüyerek gezilebilen tarihi noktaları bir araya getiren rota',
    activities: [
      'Balıklıgöl ve çevresi',
      'Tarihi çarşılar (Bakırcılar, Sipahi Pazarı)',
      'Urfa Kalesi çevresinde seyir noktaları',
      'Yerel lezzet molası',
      'Akşam kültür programı'
    ],
    duration: 'Yarım Gün',
    category: 'yarım-gün',
    coordinates: { lat: 37.1486, lon: 38.7969 }, // Balıklıgöl çevresi
    waypoints: [
      { name: 'Balıklıgöl', lat: 37.1486, lon: 38.7969 },
      { name: 'Tarihi çarşılar', lat: 37.1502, lon: 38.7927 },
      { name: 'Urfa Kalesi', lat: 37.152, lon: 38.7938 },
      { name: 'Lezzet molası', lat: 37.1513, lon: 38.7908 },
      { name: 'Akşam programı', lat: 37.1489, lon: 38.7956 },
    ],
    image: require('@/assets/images/urfa_carsi.jpg'),
    tips: 'Merkez rotası için rahat yürüyüş ayakkabısı tercih etmeniz konfor sağlar.',
  },
  {
    id: '5',
    title: 'Akşam Kültür Gezisi',
    description: 'Şehir merkezinde akşam saatlerinde yapılacaklar',
    activities: [
      'Balıklıgöl\'de akşam yürüyüşü',
      'Çevrede açık olan mekanlarda kısa gezi',
      'Geleneksel Urfa yemekleri',
      'Sıra gecesi/yerel müzik programı'
    ],
    duration: 'Akşam',
    category: 'akşam',
    coordinates: { lat: 37.1486, lon: 38.7969 }, // Balıklıgöl çevresi
    waypoints: [
      { name: 'Balıklıgöl yürüyüşü', lat: 37.1486, lon: 38.7969 },
      { name: 'Mekanlar bölgesi', lat: 37.1495, lon: 38.7946 },
      { name: 'Yemek noktası', lat: 37.151, lon: 38.7912 },
      { name: 'Sıra gecesi', lat: 37.15, lon: 38.7899 },
    ],
    image: require('@/assets/images/gumruk_hani.jpg'),
    tips: 'Program ve mekan müsaitliği günlere göre değişebildiği için önceden kontrol etmeniz önerilir.',
  },
  {
    id: '6',
    title: 'Halfeti Tekne Turu',
    description: 'Fırat Nehri kıyısında yer alan Halfeti, sular altında kalan eski yerleşimi, tekne turları ve eşsiz manzarasıyla bölgenin en özel gezi rotalarından biridir.',
    activities: [
      'Halfeti tekne turu (batık cami ve Rumkale manzarası)',
      'Eski taş evler arasında yürüyüş',
      'Fotoğraf molaları',
      'Öğle yemeği',
      'Merkeze dönüş'
    ],
    duration: 'Tam Gün',
    category: 'tam-gün',
    coordinates: { lat: 37.2448, lon: 37.8698 }, // Halfeti
    waypoints: [
      { name: 'Halfeti merkez', lat: 37.2448, lon: 37.8698 },
      { name: 'Tekne turu', lat: 37.2456, lon: 37.8724 },
      { name: 'Fotoğraf noktası', lat: 37.2469, lon: 37.8751 },
      { name: 'Öğle molası', lat: 37.2437, lon: 37.8681 },
      { name: 'Dönüş noktası', lat: 37.2448, lon: 37.8698 },
    ],
    image: require('@/assets/images/halfeti_sakli_cennet.png'),
    tips: 'Tekne turu ve ulaşım saatlerini gitmeden önce doğrulamanız önerilir.',
  },
  {
    id: '7',
    title: 'Karahantepe Rotası',
    description: "Göbeklitepe ile aynı kültürel çevreye ait, yaklaşık 12 bin yıl öncesine tarihlenen Neolitik yerleşim ve arkeolojik kazı alanı. \"Taş Tepeler\" projesinin en önemli merkezlerinden biri.",
    activities: [
      'Karahantepe kazı alanı ziyareti',
      'Anıtsal taş yapılar ve heykeller',
      'Öğle molası'
    ],
    duration: 'Yarım Gün',
    category: 'yarım-gün',
    coordinates: { lat: 37.1457, lon: 39.3585 }, // Karahantepe
    waypoints: [
      { name: 'Karahantepe alanı', lat: 37.1457, lon: 39.3585 },
      { name: 'Anıtsal taşlar', lat: 37.1462, lon: 39.3601 },
      { name: 'Mola noktası', lat: 37.1439, lon: 39.3558 },
    ],
    image: require('@/assets/images/karahantepe.png'),
    tips: 'Alan açık hava müzesi niteliğinde olduğu için yaz aylarında sabah erken saatler tercih edilmelidir.',
  },
  {
    id: '8',
    title: 'Şuayb Şehri + Soğmatar',
    description: 'Tek Tek Dağları Milli Parkı\'nın doğal manzarası içinde yer alan, kaya oyma yapıları ve antik yerleşim kalıntılarıyla öne çıkan tarihi bir alan. Soğmatar Antik Kenti ve Senem Mağarası ile birlikte gezilir.',
    activities: [
      'Şuayb Şehri kaya oyma yapıları',
      'Soğmatar Antik Kenti',
      'Senem Mağarası',
      'Tek Tek Dağları manzara molası'
    ],
    duration: 'Tam Gün',
    category: 'tam-gün',
    coordinates: { lat: 37.3081, lon: 39.0931 }, // Soğmatar/Şuayb Şehri bölgesi
    waypoints: [
      { name: 'Şuayb Şehri', lat: 37.3081, lon: 39.0931 },
      { name: 'Soğmatar', lat: 37.3138, lon: 39.1098 },
      { name: 'Senem Mağarası', lat: 37.3187, lon: 39.1163 },
      { name: 'Manzara molası', lat: 37.3047, lon: 39.0864 },
    ],
    image: require('@/assets/images/sogmatar.jpg'),
    tips: 'Bölgeye özel araç olmadan ulaşım zor olduğundan araçlı gitmeniz önerilir.',
  },
  {
    id: '9',
    title: 'Kızılkoyun Nekropolü',
    description: "Şehir merkezi girişinde, Roma dönemine ait kaya mezarlarından oluşan Şanlıurfa'nın en dikkat çekici arkeolojik miraslarından biri.",
    activities: [
      'Kızılkoyun kaya mezarları gezisi',
      'Balıklıgöl çevresinde kısa yürüyüş'
    ],
    duration: 'Yarım Gün',
    category: 'yarım-gün',
    coordinates: { lat: 37.1504, lon: 38.7953 }, // Kızılkoyun Nekropolü
    waypoints: [
      { name: 'Kızılkoyun Nekropolü', lat: 37.1504, lon: 38.7953 },
      { name: 'Balıklıgöl', lat: 37.1486, lon: 38.7969 },
    ],
    image: require('@/assets/images/kizilkoyun_nekropolu.png'),
    tips: 'Şehir merkezine yakın olduğu için diğer merkez gezileriyle birlikte planlanabilir.',
  },
];
