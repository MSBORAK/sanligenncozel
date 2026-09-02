// Şanlıurfa Büyükşehir Belediyesi Otobüs Hatları - Resmi Veriler
// Hat bilgileri: https://sanliurfa.bel.tr

export const BUS_ROUTES: { [key: string]: string } = {
  "0": "Göbeklitepe",
  "R2": "Büyükyol",
  "R3": "Oto Galericiler Sitesi",
  "R4": "Akşemsettin - 15 Temmuz Mahallesi",
  "11": "Mehmet Akif Ersoy",
  "12": "Çağdaş Çankaya",
  "20": "Ahmet Yesevi",
  "21": "Bağlarbaşı",
  "21A": "Açıksu",
  "22": "Süleymaniye",
  "22A": "Devteyşti",
  "23": "SSK",
  "24": "Haleplibahçe - Eyyübiye",
  "26": "Salih Özcan Bulvarı",
  "33": "Akabe Toki",
  "34": "Evren Sanayi - Gıdacılar - Mobilyacılar Sitesi",
  "36": "Otogar - Esentepe - Akabe Toki",
  "38": "Mance",
  "41A": "Yenice",
  "42": "Hayati Harrani",
  "43": "Abdurrahman Dede",
  "43A": "Eyyübiye Devlet Hastanesi",
  "44": "Onikiler Eğitim Kampüsü",
  "48": "Şıh Maksut - Şutim",
  "52": "Karşıyaka - Zeytindalı Eğitim Kampüsü",
  "55": "Zeytindalı Eğitim Kampüsü",
  "57": "Fevzi Çakmak Bulvarı",
  "61": "Otogar - Esentepe - İmamkeskin",
  "62": "Otogar - Esentepe - Eyyüpkent",
  "63": "Balıklıgöl",
  "64": "Otogar - Esentepe - Eyyübiye",
  "70": "Buluntu Hoca Bulvarı",
  "71": "Otogar - Güzelşehir",
  "71A": "Otogar - Doğukent",
  "72": "Otogar - Mehmet Hafız Bulvarı",
  "73": "Karaköprü",
  "73A": "Güllübağ",
  "74": "Otogar - Şutim - Karaköprü",
  "75": "Balıkayağı Bulvarı",
  "76": "Seyrantepe",
  "76B": "Otogar - Beyazıt Bulvarı",
  "77": "Mehmetçik",
  "78": "Zirve Konutları",
  "79": "Seyrantepe - Atakent",
  "81": "Akabe Toki - Sırrın",
  "90": "Osmanbey",
  "90E": "Eyyübiye - Osmanbey",
  "90K": "Karaköprü - Osmanbey",
  "90S": "Seyrantepe - Osmanbey",
  "95": "Organize Sanayi",
  "96": "2.Organize Sanayi",
  "97": "Yeni Mezarlık",
  "103": "Konuklu",
  "104": "Konuklu - Hastane",
  "105": "Kısas",
  "107": "Kısas - Sağlık",
  "110": "Çamlıdere - Karaali",
  "140": "Yardımcı",
  "170": "Tülmen Mahallesi",
  "180": "Akziyaret Mahallesi",
};

// Hat renkleri
const COLORS = {
  red: "#ef4444",
  orange: "#f59e0b",
  green: "#758956",
  blue: "#758956",
  purple: "#2f3d20",
  pink: "#6a5745",
  teal: "#758956",
  indigo: "#758956",
  rose: "#6a5745",
  lime: "#758956",
  amber: "#758956",
  slate: "#6a5745",
  dark: "#3b2c20",
};

export const MOCK_STOPS = [
  {
    id: "abide",
    name: "Abide Aktarma Merkezi",
    lat: 37.165461472652325,
    lng: 38.79683639017905,
    region: "Merkez",
    buses: [
      { line: "21", route: BUS_ROUTES["21"], baseTime: 2, color: COLORS.orange },
      { line: "21A", route: BUS_ROUTES["21A"], baseTime: 9, color: COLORS.orange },
      { line: "22", route: BUS_ROUTES["22"], baseTime: 4, color: COLORS.red },
      { line: "22A", route: BUS_ROUTES["22A"], baseTime: 7, color: COLORS.red },
      { line: "23", route: BUS_ROUTES["23"], baseTime: 6, color: COLORS.green },
      { line: "26", route: BUS_ROUTES["26"], baseTime: 12, color: COLORS.purple },
      { line: "33", route: BUS_ROUTES["33"], baseTime: 5, color: COLORS.blue },
      { line: "36", route: BUS_ROUTES["36"], baseTime: 10, color: COLORS.purple },
      { line: "57", route: BUS_ROUTES["57"], baseTime: 8, color: COLORS.pink },
      { line: "63", route: BUS_ROUTES["63"], baseTime: 3, color: COLORS.indigo },
      { line: "73", route: BUS_ROUTES["73"], baseTime: 7, color: COLORS.teal },
      { line: "81", route: BUS_ROUTES["81"], baseTime: 15, color: COLORS.rose },
      { line: "90", route: BUS_ROUTES["90"], baseTime: 5, color: COLORS.rose },
      { line: "95", route: BUS_ROUTES["95"], baseTime: 12, color: COLORS.slate },
      { line: "96", route: BUS_ROUTES["96"], baseTime: 18, color: COLORS.dark },
      { line: "97", route: BUS_ROUTES["97"], baseTime: 22, color: COLORS.dark },
      { line: "103", route: BUS_ROUTES["103"], baseTime: 25, color: COLORS.lime },
      { line: "104", route: BUS_ROUTES["104"], baseTime: 28, color: COLORS.lime },
      { line: "105", route: BUS_ROUTES["105"], baseTime: 30, color: COLORS.amber },
      { line: "170", route: BUS_ROUTES["170"], baseTime: 15, color: COLORS.lime },
      { line: "180", route: BUS_ROUTES["180"], baseTime: 20, color: COLORS.amber }
    ]
  },
  {
    id: "piazza",
    name: "Piazza AVM Durağı",
    lat: 37.15757073712229,
    lng: 38.78088814044136,
    region: "Merkez",
    buses: [
      { line: "33", route: BUS_ROUTES["33"], baseTime: 6, color: COLORS.blue },
      { line: "34", route: BUS_ROUTES["34"], baseTime: 10, color: COLORS.teal },
      { line: "36", route: BUS_ROUTES["36"], baseTime: 12, color: COLORS.purple },
      { line: "R2", route: BUS_ROUTES["R2"], baseTime: 15, color: COLORS.purple }
    ]
  },
  {
    id: "balikligol",
    name: "Balıklıgöl",
    lat: 37.14751474175766,
    lng: 38.78385959626061,
    region: "Balıklıgöl",
    buses: [
      { line: "24", route: BUS_ROUTES["24"], baseTime: 3, color: COLORS.green },
      { line: "48", route: BUS_ROUTES["48"], baseTime: 8, color: COLORS.orange },
      { line: "63", route: BUS_ROUTES["63"], baseTime: 5, color: COLORS.indigo },
      { line: "R2", route: BUS_ROUTES["R2"], baseTime: 6, color: COLORS.purple },
      { line: "R3", route: BUS_ROUTES["R3"], baseTime: 10, color: COLORS.red },
      { line: "R4", route: BUS_ROUTES["R4"], baseTime: 12, color: COLORS.teal }
    ]
  },
  {
    id: "otogar",
    name: "Şehirlerarası Otogar",
    lat: 37.18654239843747,
    lng: 38.80445313859036,
    region: "Karaköprü",
    buses: [
      { line: "0", route: BUS_ROUTES["0"], baseTime: 45, color: COLORS.purple },
      { line: "36", route: BUS_ROUTES["36"], baseTime: 2, color: COLORS.blue },
      { line: "38", route: BUS_ROUTES["38"], baseTime: 15, color: COLORS.indigo },
      { line: "41A", route: BUS_ROUTES["41A"], baseTime: 12, color: COLORS.rose },
      { line: "61", route: BUS_ROUTES["61"], baseTime: 8, color: COLORS.red },
      { line: "62", route: BUS_ROUTES["62"], baseTime: 5, color: COLORS.green },
      { line: "64", route: BUS_ROUTES["64"], baseTime: 6, color: COLORS.orange },
      { line: "71", route: BUS_ROUTES["71"], baseTime: 10, color: COLORS.purple },
      { line: "71A", route: BUS_ROUTES["71A"], baseTime: 12, color: COLORS.pink },
      { line: "72", route: BUS_ROUTES["72"], baseTime: 7, color: COLORS.indigo },
      { line: "74", route: BUS_ROUTES["74"], baseTime: 9, color: COLORS.teal },
      { line: "76B", route: BUS_ROUTES["76B"], baseTime: 11, color: COLORS.rose }
    ]
  },
  {
    id: "osmanbey",
    name: "Osmanbey Kampüsü (HRÜ)",
    lat: 37.172249355938945,
    lng: 38.99837596927815,
    region: "Osmanbey",
    buses: [
      { line: "52", route: BUS_ROUTES["52"], baseTime: 8, color: COLORS.pink },
      { line: "55", route: BUS_ROUTES["55"], baseTime: 5, color: COLORS.blue },
      { line: "90", route: BUS_ROUTES["90"], baseTime: 2, color: COLORS.rose },
      { line: "90E", route: BUS_ROUTES["90E"], baseTime: 15, color: COLORS.indigo },
      { line: "90K", route: BUS_ROUTES["90K"], baseTime: 12, color: COLORS.teal },
      { line: "90S", route: BUS_ROUTES["90S"], baseTime: 14, color: COLORS.orange }
    ]
  },
  {
    id: "karakopru_dis",
    name: "Karaköprü Diş Hastanesi",
    lat: 37.220590573048675,
    lng: 38.80614530790362,
    region: "Karaköprü",
    buses: [
      { line: "57", route: BUS_ROUTES["57"], baseTime: 6, color: COLORS.pink },
      { line: "70", route: BUS_ROUTES["70"], baseTime: 8, color: COLORS.orange },
      { line: "73", route: BUS_ROUTES["73"], baseTime: 3, color: COLORS.teal },
      { line: "73A", route: BUS_ROUTES["73A"], baseTime: 7, color: COLORS.green },
      { line: "74", route: BUS_ROUTES["74"], baseTime: 9, color: COLORS.teal },
      { line: "75", route: BUS_ROUTES["75"], baseTime: 5, color: COLORS.blue },
      { line: "76", route: BUS_ROUTES["76"], baseTime: 6, color: COLORS.purple },
      { line: "77", route: BUS_ROUTES["77"], baseTime: 10, color: COLORS.lime },
      { line: "78", route: BUS_ROUTES["78"], baseTime: 12, color: COLORS.indigo },
      { line: "79", route: BUS_ROUTES["79"], baseTime: 14, color: COLORS.rose },
      { line: "90K", route: BUS_ROUTES["90K"], baseTime: 10, color: COLORS.rose }
    ]
  },
  {
    id: "eyyubiye_hastane",
    name: "Eyyübiye Eğt. Arş. Hastanesi",
    lat: 37.11574622432816,
    lng: 38.82367099811131,
    region: "Eyyübiye",
    buses: [
      { line: "11", route: BUS_ROUTES["11"], baseTime: 9, color: COLORS.indigo },
      { line: "12", route: BUS_ROUTES["12"], baseTime: 11, color: COLORS.blue },
      { line: "20", route: BUS_ROUTES["20"], baseTime: 7, color: COLORS.pink },
      { line: "24", route: BUS_ROUTES["24"], baseTime: 4, color: COLORS.green },
      { line: "42", route: BUS_ROUTES["42"], baseTime: 5, color: COLORS.orange },
      { line: "43", route: BUS_ROUTES["43"], baseTime: 7, color: COLORS.blue },
      { line: "43A", route: BUS_ROUTES["43A"], baseTime: 2, color: COLORS.red },
      { line: "44", route: BUS_ROUTES["44"], baseTime: 8, color: COLORS.purple },
      { line: "64", route: BUS_ROUTES["64"], baseTime: 10, color: COLORS.pink },
      { line: "90E", route: BUS_ROUTES["90E"], baseTime: 15, color: COLORS.indigo }
    ]
  },
  {
    id: "haleplibahce",
    name: "Haleplibahçe (Müze)",
    lat: 37.15112918864037,
    lng: 38.78291002509674,
    region: "Balıklıgöl",
    buses: [
      { line: "24", route: BUS_ROUTES["24"], baseTime: 4, color: COLORS.green },
      { line: "63", route: BUS_ROUTES["63"], baseTime: 6, color: COLORS.indigo },
      { line: "R2", route: BUS_ROUTES["R2"], baseTime: 8, color: COLORS.purple }
    ]
  },
  {
    id: "sirrin",
    name: "Sırrın (Kavşak)",
    lat: 37.138707,
    lng: 38.822014,
    region: "Merkez",
    buses: [
      { line: "52", route: BUS_ROUTES["52"], baseTime: 10, color: COLORS.pink },
      { line: "81", route: BUS_ROUTES["81"], baseTime: 15, color: COLORS.rose },
      { line: "90", route: BUS_ROUTES["90"], baseTime: 5, color: COLORS.rose }
    ]
  },
  {
    id: "akabe",
    name: "Akabe TOKİ",
    lat: 37.14042586414705,
    lng: 38.747486472121466,
    region: "Eyyübiye",
    buses: [
      { line: "33", route: BUS_ROUTES["33"], baseTime: 10, color: COLORS.blue },
      { line: "36", route: BUS_ROUTES["36"], baseTime: 8, color: COLORS.purple },
      { line: "81", route: BUS_ROUTES["81"], baseTime: 20, color: COLORS.rose }
    ]
  },
  {
    id: "masuk",
    name: "Maşuk TOKİ",
    lat: 37.200337179982434,
    lng: 38.77780559626313,
    region: "Karaköprü",
    buses: [
      { line: "76", route: BUS_ROUTES["76"], baseTime: 5, color: COLORS.purple },
      { line: "76B", route: BUS_ROUTES["76B"], baseTime: 12, color: COLORS.rose },
      { line: "79", route: BUS_ROUTES["79"], baseTime: 8, color: COLORS.orange },
      { line: "90S", route: BUS_ROUTES["90S"], baseTime: 15, color: COLORS.amber }
    ]
  },
  {
    id: "topcu_meydani",
    name: "Topçu Meydanı (Rabia)",
    lat: 37.1606953762529,
    lng: 38.79074412324491,
    region: "Merkez",
    buses: [
      { line: "22", route: BUS_ROUTES["22"], baseTime: 6, color: COLORS.red },
      { line: "63", route: BUS_ROUTES["63"], baseTime: 3, color: COLORS.indigo }
    ]
  },
  {
    id: "bahcelievler",
    name: "Bahçelievler",
    lat: 37.163411,
    lng: 38.793593,
    region: "Merkez",
    buses: [
      { line: "33", route: BUS_ROUTES["33"], baseTime: 4, color: COLORS.blue },
      { line: "36", route: BUS_ROUTES["36"], baseTime: 10, color: COLORS.purple }
    ]
  },
  {
    id: "novada",
    name: "Novada Park AVM",
    lat: 37.16367938554256,
    lng: 38.794911528474444,
    region: "Merkez",
    buses: [
      { line: "21", route: BUS_ROUTES["21"], baseTime: 5, color: COLORS.orange },
      { line: "73", route: BUS_ROUTES["73"], baseTime: 8, color: COLORS.teal }
    ]
  },
  {
    id: "urfacity",
    name: "Urfa City AVM",
    lat: 37.182287655757285,
    lng: 38.80703688091813,
    region: "Merkez",
    buses: [
      { line: "63", route: BUS_ROUTES["63"], baseTime: 5, color: COLORS.indigo },
      { line: "R2", route: BUS_ROUTES["R2"], baseTime: 12, color: COLORS.purple }
    ]
  },
  {
    id: "gap_arena",
    name: "11 Nisan Stadyumu (GAP Arena)",
    lat: 37.14810077565314,
    lng: 38.80691955208026,
    region: "Karaköprü",
    buses: [
      { line: "73", route: BUS_ROUTES["73"], baseTime: 15, color: COLORS.teal },
      { line: "74", route: BUS_ROUTES["74"], baseTime: 10, color: COLORS.teal }
    ]
  },
  {
    id: "hasimiye",
    name: "Haşimiye Meydanı",
    lat: 37.14953200332456,
    lng: 38.79063104599802,
    region: "Balıklıgöl",
    buses: [
      { line: "48", route: BUS_ROUTES["48"], baseTime: 8, color: COLORS.orange },
      { line: "63", route: BUS_ROUTES["63"], baseTime: 4, color: COLORS.indigo }
    ]
  },
  {
    id: "karakopru_fuar",
    name: "Karaköprü Fuar Merkezi",
    lat: 37.22477607603475,
    lng: 38.792004594411864,
    region: "Karaköprü",
    buses: [
      { line: "72", route: BUS_ROUTES["72"], baseTime: 12, color: COLORS.indigo },
      { line: "74", route: BUS_ROUTES["74"], baseTime: 20, color: COLORS.teal }
    ]
  },
  {
    id: "bilim_merkezi",
    name: "Şanlıurfa Bilim Merkezi",
    lat: 37.1714660174962,
    lng: 38.84338159626168,
    region: "Karaköprü",
    buses: [
      { line: "76", route: BUS_ROUTES["76"], baseTime: 15, color: COLORS.purple },
      { line: "90", route: BUS_ROUTES["90"], baseTime: 10, color: COLORS.rose }
    ]
  },
  {
    id: "gobeklitepe",
    name: "Göbeklitepe Durağı",
    lat: 37.2231,
    lng: 38.9225,
    region: "Merkez",
    buses: [
      { line: "0", route: BUS_ROUTES["0"], baseTime: 2, color: COLORS.purple }
    ]
  },
  {
    id: "organize_sanayi",
    name: "Organize Sanayi Bölgesi",
    lat: 37.1850,
    lng: 38.8650,
    region: "Karaköprü",
    buses: [
      { line: "95", route: BUS_ROUTES["95"], baseTime: 5, color: COLORS.slate },
      { line: "96", route: BUS_ROUTES["96"], baseTime: 8, color: COLORS.dark }
    ]
  },
  {
    id: "zeytindali",
    name: "Zeytindalı Eğitim Kampüsü",
    lat: 37.1420,
    lng: 38.9100,
    region: "Eyyübiye",
    buses: [
      { line: "52", route: BUS_ROUTES["52"], baseTime: 3, color: COLORS.pink },
      { line: "55", route: BUS_ROUTES["55"], baseTime: 2, color: COLORS.blue }
    ]
  },
  {
    id: "seyrantepe",
    name: "Seyrantepe",
    lat: 37.2050,
    lng: 38.7850,
    region: "Karaköprü",
    buses: [
      { line: "76", route: BUS_ROUTES["76"], baseTime: 3, color: COLORS.purple },
      { line: "79", route: BUS_ROUTES["79"], baseTime: 5, color: COLORS.rose },
      { line: "90S", route: BUS_ROUTES["90S"], baseTime: 8, color: COLORS.orange }
    ]
  }
];
