// Epochs and water bodies for tools/geo/build.mjs.
//
// Global sea level follows Lambeck et al. 2014, "Sea level and global ice
// volumes from the Last Glacial Maximum to the Holocene" (PNAS 111:15296).
// Values are rounded and local effects (isostasy, deltas, tectonics) are
// ignored, so coastlines are an approximation at 1/6 degree.
//
// Megachad: the giant lake of the "Green Sahara" (African Humid Period).
// Its highest shoreline sits at about 329 m (Drake & Bristow 2006); today's
// Lake Chad is at about 280 m. Intermediate levels are rough guesses.

export const OUT_DIR = 'apps/playground/public/geo'

/** Seeds are [lat, lon]. Without `level` the epoch's sea level applies. */
export const SEAS = [
  { id: 'pacific', seed: [0, -150] },
  { id: 'atlantic', seed: [0, -30] },
  { id: 'indian', seed: [-30, 80] },
  { id: 'arctic', seed: [85, 0] },
  { id: 'southern', seed: [-60, 0] },
  // Straits narrower than the grid would cut these off from the ocean.
  { id: 'mediterranean', seed: [35, 18] },
  { id: 'red', seed: [20, 38.5] },
  { id: 'marmara', seed: [40.8, 28] },
  // Simplification: the Black Sea follows the global level (it was a lower
  // lake before ~5600 BCE); the Baltic and the Caspian keep today's levels.
  { id: 'black', seed: [43.3, 34] },
  { id: 'baltic', seed: [57.5, 19.5], level: 0 },
  { id: 'caspian', seed: [42, 51], level: -28 },
]

/** Lakes whose level changes by epoch (altitude in metres). */
export const LAKES = [
  { id: 'chad', seed: [13, 14.5] },
]

export const EPOCHS = [
  { id: 'bce10000', year: -10000, seaLevel: -55, lakes: { chad: 300 } },
  { id: 'bce8000', year: -8000, seaLevel: -35, lakes: { chad: 320 } },
  { id: 'bce6000', year: -6000, seaLevel: -15, lakes: { chad: 329 } },
  { id: 'bce4000', year: -4000, seaLevel: -3, lakes: { chad: 310 } },
  { id: 'bce2000', year: -2000, seaLevel: -1, lakes: { chad: 285 } },
]

/**
 * Russian names for states whose Wikipedia article is about a topic (a
 * people, a history) rather than the state itself. Keys are Cliopatria names.
 */
export const RUSSIAN_NAMES = {
  'Sumerian City-States': 'Шумерские города-государства',
  'Greek City-States': 'Греческие полисы',
  'Hittites': 'Хеттское царство',
  'Hunnic Empire': 'Держава гуннов',
  'Merovingian Empire': 'Франкское государство Меровингов',
  'Eastern Roman Empire': 'Восточная Римская империя',
  'Habsburg Monarchy': 'Габсбургская монархия',
  'Early Dynastic Period of Egypt': 'Раннее царство',
  'Spring and Autumn States': 'Царства периода Чуньцю',
  'Warring States China': 'Сражающиеся царства',
  'Phoenician Colonies': 'Финикийские колонии',
  'Assyrian Egypt': 'Ассирийский Египет',
  'Kingdom of Bithynia': 'Вифиния',
  'Kingdom of Lysimachus': 'Царство Лисимаха',
  'Western Chu': 'Западное Чу',
  'Eighteen Kingdoms': 'Восемнадцать царств',
  'Gojoseon': 'Кочосон',
  'Indo-Scythians': 'Индо-скифы',
  'Himyarite Kingdom': 'Химьяр',
  'Thracian Kingdom': 'Фракийское царство',
  'Kingdom of Sardinia': 'Сардинское королевство',
  'Muhammad Ali dynasty': 'Египет при династии Мухаммада Али',
  // Found by checking every name in 2026: the Wikipedia link gave an English
  // name only, a topic article ("List of…", "Conquest of…", a person), or
  // another place (Georgia, the US state).
  'Lower Egypt': 'Нижний Египет',
  'Upper Egypt': 'Верхний Египет',
  'Akkadian Empire': 'Аккадская держава',
  'Median Kingdom': 'Мидийское царство',
  'Teng': 'Тэн',
  'Zhu': 'Чжу',
  'Han': 'Хань',
  'Janapada of Cedī': 'Чеди',
  'Janapada of Gandhāra': 'Гандхара',
  'Janapada of Kāśī': 'Каши',
  'Janapada of Kamboja': 'Камбоджа',
  'Thebans': 'Фиванцы',
  'Ptolemaic Kingdom': 'Царство Птолемеев',
  'Athenian Coalition': 'Афинская коалиция',
  'Seleucid Empire': 'Держава Селевкидов',
  'Early Pandyas': 'Ранние Пандья',
  'Early Cholas': 'Ранние Чола',
  'Greek Colonies': 'Греческие колонии',
  'Mayan City-States': 'Города-государства майя',
  'Later Mayan City-States': 'Поздние города-государства майя',
  'Zhai': 'Чжай',
  'Dai': 'Дай',
  'Jibei': 'Цзибэй',
  'Jiujiang': 'Цзюцзян',
  'Henan': 'Хэнань',
  'Hán': 'Хань',
  'Linjiang': 'Линьцзян',
  'Chang-shan': 'Чаншань',
  'Sai': 'Сай',
  'Liaodong': 'Ляодун',
  'Jiaodong': 'Цзяодун',
  'Yong': 'Юн',
  'Yin': 'Инь',
  'Kingdom of Numidia': 'Нумидия',
  'Mahameghavahana Dynasty': 'Махамегхавахана',
  'Dongye': 'Тонъе',
  'Southern Xiongnu': 'Южные хунну',
  'Funan': 'Фунань',
  'Norse': 'Скандинавы',
  'Eastern Kushans': 'Восточные кушаны',
  'Western Kushans': 'Западные кушаны',
  'Former Zhao': 'Ранняя Чжао',
  'Yaudheya Republic': 'Яудхеи',
  'Kalabhra Dynasty': 'Калабхры',
  'Angles': 'Англы',
  'Brythonic Kingdoms': 'Бриттские королевства',
  'Anglo-Saxon England': 'Англосаксонская Англия',
  'Maitraka Dynasty': 'Майтраки',
  'Kingdom of Thuringia': 'Тюрингское королевство',
  'Scandinavian minor kingdoms': 'Скандинавские королевства',
  'Asuka Japan': 'Япония периода Асука',
  'Nara Japan': 'Япония периода Нара',
  'Heian Japan': 'Япония периода Хэйан',
  'Warring States Japan': 'Япония периода Сэнгоку',
  'Kingdom of Morgannwg': 'Морганнуг',
  'Maukhari Dynasty': 'Маукхари',
  'Turk Shahis': 'Тюркские шахи',
  'Later Western Liang': 'Западная Лян',
  'Georgia': 'Грузия',
  'Duchy of Tuscia': 'Тусция',
  'Eastern Göktürks': 'Восточно-тюркский каганат',
  'Western Göktürks': 'Западно-тюркский каганат',
  'Breton Kingdoms': 'Бретонские королевства',
  'Karkota Dynasty': 'Каркота',
  'Gauda Kingdom': 'Гауда',
  'Gao Kaidao': 'Гао Кайдао',
  'Lavo Kingdom': 'Лаво',
  'Khadga Dynasty': 'Кхадга',
  'Turks': 'Тюрки',
  'Galuh Kingdom': 'Галух',
  'Cyprus Condominium': 'Кипрский кондоминиум',
  'Water Chenla': 'Водяная Ченла',
  'Land Chenla': 'Сухопутная Ченла',
  'Carolingian Empire': 'Империя Каролингов',
  'Oghuz Turks': 'Огузы',
  'Fihrids': 'Фихриды',
  'Viking settlements': 'Поселения викингов',
  'Qarlugs': 'Карлуки',
  'Khmer Empire': 'Кхмерская империя',
  'Kingdom of Sobrarbe': 'Собрарбе',
  'Middle Franks': 'Срединное королевство',
  'Puebloans - Chaco Regional System': 'Пуэбло (Чако)',
  'Puebloans - Aztec Regional System': 'Пуэбло (Ацтек)',
  'Sind-Habbari Dynasty': 'Хаббариды',
  'Giudicato of Logudoro': 'Логудоро',
  'County of Barcelona': 'Барселонское графство',
  'Chandra Dynasty': 'Чандра',
  'Five Dynasties and Ten Kingdoms': 'Пять династий и десять царств',
  'Southern Chu': 'Чу',
  'Southern Wu': 'У',
  'Former Jin': 'Цзинь',
  'Jingnan': 'Цзиннань',
  'Later Han': 'Поздняя Хань',
  'Northern Han': 'Северная Хань',
  'Wuyue': 'Уюэ',
  'Upper Burgundy and Italy': 'Верхняя Бургундия и Италия',
  'Abbasid Caliphate/Buyid Dynasty': 'Аббасидский халифат и Буиды',
  'Chaulukya Dynasty': 'Чаулукья',
  'Utpala Dynasty': 'Утпала',
  'Paramara Dynasty': 'Парамара',
  'Chauhan Dynasty': 'Чаухан',
  'Lohara Dynasty': 'Лохара',
  'Northern Song': 'Северная Сун',
  'Southern Song': 'Южная Сун',
  'Western Xia': 'Западная Ся',
  'Great Jin': 'Цзинь',
  'Kahuripan': 'Кахурипан',
  'Kingdom of Janggala': 'Джанггала',
  'Eastern Ganga Kingdom': 'Восточные Ганги',
  'Taifa of Ceuta': 'Тайфа Сеута',
  'Kingdom of Polonnaruwa': 'Полоннарува',
  'Gahadavala Dynasty': 'Гахадавала',
  'Angevins': 'Анжуйская династия',
  'Taifa of Tejada': 'Тайфа Техада',
  'Yadava Dynasty': 'Ядавы',
  'Sosso Empire': 'Сосо',
  'Namayan': 'Намаян',
  'County of Poitou': 'Графство Пуату',
  'Kingdom of Dambadeniya': 'Дамбадения',
  'Kampili Kingdom': 'Кампили',
  'Taifas of Iberia': 'Тайфы',
  'Denmark-England': 'Англо-датское королевство',
  'Norman Italy': 'Нормандская Италия',
  'Norman England': 'Нормандская Англия',
  'Norse Greenland': 'Норвежская Гренландия',
  'Duchies of Poland': 'Польские княжества',
  'Duchy of Łęczyca': 'Ленчицкое княжество',
  'Principality of Rostov-Suzdal': 'Ростово-Суздальское княжество',
  "Rus'": 'Русь',
  'Duchy of Bohemia': 'Чешское княжество',
  'County of Artois': 'Графство Артуа',
  'Margraviate of Brandenburg': 'Маркграфство Бранденбург',
  'Electorate of Brandenburg': 'Курфюршество Бранденбург',
  'Holy Roman Empire Minor States': 'Мелкие государства Священной Римской империи',
  'Ceylon': 'Цейлон',
  'Despotate of Epirus': 'Эпирский деспотат',
  'Kingdom of Mann': 'Королевство Мэн и Островов',
  'Duchy of Wrocław': 'Вроцлавское княжество',
  'Phayao Kingdom': 'Пхаяо',
  'Earldom of Ulster': 'Графство Ольстер',
  'Earldom of Desmond': 'Графство Десмонд',
  'Free County of Burgundy': 'Франш-Конте',
  'Commune of the Zealots': 'Коммуна зилотов',
  'Muzaffarids': 'Музаффариды',
  'Serbian Empire': 'Сербское царство',
  'Sultanate of Brunei': 'Брунейский султанат',
  'Electorate of Saxony': 'Курфюршество Саксония',
  'Tibet': 'Тибет',
  'Polish-Lithuania Kingdom': 'Польско-литовская уния',
  'Mongol Khanate': 'Монгольское ханство',
  'Kapisa': 'Каписа',
  'Rajahnate of Cebu': 'Раджанат Себу',
  'Portuguese Empire': 'Португальская империя',
  'First Toungoo Empire': 'Первая империя Таунгу',
  'Portuguese Africa': 'Португальская Африка',
  'Sultanate of Gowa': 'Гова',
  'Sultanate of Bone': 'Боне',
  'Maynila': 'Майнила',
  'Sultanate of Banjar': 'Банджар',
  'Sultanate of Perak': 'Перак',
  'Sultanate of Palembang': 'Палембанг',
  'Itza Mayans': 'Ица',
  'Sultanate of Harar': 'Харарский эмират',
  'Small Horde': 'Малая Орда',
  'Jesuit Reducciones': 'Иезуитские редукции',
  'Sultanate of Sukadana': 'Сукадана',
  'Sultanate of Sambas': 'Самбас',
  'Sultanate of Mempawah': 'Мемпава',
  'Sultanate of Bima': 'Бима',
  'Qasimids': 'Касимиды',
  'Dutch Cape Colony': 'Голландская Капская колония',
  'Sultanate of Jambi': 'Джамби',
  'Cambodia': 'Камбоджа',
  'Pro-Swedish Poland': 'Польша Станислава Лещинского',
  'British Colonial Empire': 'Британская колониальная империя',
  'Sultanate of Terengganu': 'Тренгану',
  'Kingdom of Bulungan': 'Булунган',
  'Sultanate of Selangor': 'Селангор',
  'Surakarta Sunanate': 'Суракарта',
  'Zand Dynasty': 'Зенды',
  'Khanates of the Caucasus': 'Кавказские ханства',
  'French Louisiana': 'Французская Луизиана',
  'Napoleonic Batavia Republic': 'Капская колония (Батавская республика)',
  'Italian Republic': 'Итальянская республика',
  'First French Empire': 'Первая французская империя',
  'Second French Empire': 'Вторая французская империя',
  'Free City of Bremen': 'Вольный город Бремен',
  'New Granada': 'Новая Гранада',
  'Mexicans': 'Мексиканские повстанцы',
  'Guayaquil Junta': 'Свободная провинция Гуаякиль',
  'Omani Slave Coast': 'Оманские владения в Восточной Африке',
  'Cundinamarca': 'Кундинамарка',
  'Imamate of Yemen': 'Йеменский имамат',
  'Bourbon Kingdom of France': 'Королевство Франция',
  'Principality of Schwarzburg-Sonderhausen': 'Шварцбург-Зондерсгаузен',
  'Zululand': 'Королевство зулусов',
  'Burma': 'Бирма',
  'Riau-Lingga Sultanate': 'Риау-Лингга',
  'Poles': 'Польские повстанцы',
  'Sultanate of Sambaliung': 'Самбалиунг',
  'Durrani Dynasty': 'Дуррани',
  'French Africa': 'Французская Африка',
  'Italian Nationalists': 'Итальянские повстанцы',
  'Hungarian Nationalists': 'Венгерские повстанцы',
  'Pahang Sultanate': 'Паханг',
  'Mosquito Kingdom': 'Королевство москито',
  'Panthay Rebellion': 'Пантайский султанат',
  'Mexican Monarchists': 'Мексиканские монархисты',
  'German Africa': 'Германская Африка',
  'British Africa': 'Британская Африка',
  'Italian Africa': 'Итальянская Африка',
  'Cuban Nationalists': 'Кубинские повстанцы',
  'Maderistas': 'Мадеристы',
  'Republic of Uryankhay': 'Урянхайский край',
  'Russian Republic': 'Российская республика',
  'Polish Armed Forces': 'Польские войска',
  'North Yemen': 'Северный Йемен',
  "Ukrainian People's Republic": 'Украинская Народная Республика',
  'Second Polish Republic': 'Вторая Речь Посполитая',
  'Republics of the Soviet Union': 'Советские республики',
  'Anti-Kuomintang Coalition': 'Антигоминьдановская коалиция',
  'Éire': 'Ирландия',
  'Second Republic of Austria': 'Австрия',
  'Second Syrian Republic': 'Сирия',
  'Qatar Protectorate': 'Катар (британский протекторат)',
  'Libyan Arab Republic': 'Ливийская Арабская Республика',
  'Mujahideen': 'Моджахеды',
  'Chechen Republic': 'Чеченская Республика Ичкерия',
  'Serbs': 'Сербские повстанцы',
  'Bahrani Dynasty': 'Эль-Хаса и Бахрейн',
  // Cliopatria's name for Transnistria, South Ossetia and two patches of
  // Gagauzia; DE_JURE gives that land to Moldova and Georgia, so it isn't drawn.
  'Russian-occupied territories': 'Территории, оккупированные Россией',
}

/**
 * Capitals ([lon, lat]) for states made of several parts whose Wikipedia link
 * gives none on Wikidata (an island, a dynasty, a period). The part with the
 * capital is the state's core: it keeps the label and is never dropped as
 * overseas land. Keys are English display names.
 */
const LONDON = [-0.13, 51.51]
const COPENHAGEN = [12.57, 55.68]
const VIENNA = [16.37, 48.21]
const PARIS = [2.35, 48.86]
export const CAPITALS = {
  'Kingdom of Great Britain': [LONDON],
  'Denmark-Norway': [COPENHAGEN],
  'Norway-Denmark': [COPENHAGEN],
  'Kingdom of Denmark': [COPENHAGEN],
  'House of Oldenburg': [COPENHAGEN],
  'House of Habsburg': [VIENNA],
  'Habsburg Monarchy': [VIENNA],
  'House of Jagiellon': [[19.94, 50.06]],
  'Polish-Lithuanian Commonwealth': [[19.94, 50.06], [21.01, 52.23]],
  'Iberian Union': [[-3.7, 40.42]],
  'Grand Principality of Moscow': [[37.62, 55.75]],
  'Qajar Dynasty': [[51.39, 35.69]],
  'French Directory': [PARIS],
  'French Consulate': [PARIS],
  // Beijing, then Nanjing; Taipei after 1949.
  'Republic of China': [[116.4, 39.9], [118.8, 32.06], [121.56, 25.04]],
  'Kuomintang': [[118.8, 32.06]],
  'Communist Party of China': [[109.49, 36.59]],
  'Muhammad Ali dynasty': [[31.24, 30.04]],
  'Emirate of Diriyah': [[46.57, 24.73]],
  'Nguyễn dynasty': [[107.59, 16.46]],
  'Merina Kingdom': [[47.52, -18.91]],
  'Seleucid Empire': [[36.16, 36.2], [44.52, 33.1]],
  'Western Jin': [[112.45, 34.62]],
  'Spanish Nationalists': [[-3.7, 42.34]],
}

/**
 * Borders under international law where Cliopatria draws who held the land:
 * annexations and breakaway states that the UN declared invalid or that no UN
 * member recognises go to the state the land belongs to. For the years given,
 * the land is cut from every other record and joined to the owner's (`create`
 * makes a record when the owner has none, e.g. a territory with no state yet;
 * `wiki` is then its English Wikipedia title for the state card).
 *
 * The land is made of Natural Earth's disputed areas (`ne`: BRK_NAME in
 * ne_10m_admin_0_disputed_areas) and of parts of Cliopatria's own records
 * (`record` in `year`; with `at`, only the part holding that point; with
 * `within` [west, south, east, north], only the parts inside that box).
 *
 * Left as Cliopatria draws them, since no treaty or UN decision settles them
 * (or the line itself rests on one): Kashmir along the Line of Control (Simla
 * Agreement, 1972), Kosovo, Taiwan, the southern Kuril Islands.
 */
const EGYPT = ['Kingdom of Egypt', 'Republic of Egypt', 'United Arab Republic', 'Arab Republic of Egypt']
export const DE_JURE = [
  {
    owner: ['Ukraine'], from: 2014, to: 2024,
    areas: [{ ne: 'Crimea' }, { ne: 'Donetsk People\'s Republic' }, { ne: 'Luhansk People\'s Republic' }],
    basis: 'UN GA resolutions 68/262 (2014) and ES-11/4 (2022)',
  },
  {
    // Cliopatria's "Russian-occupied territories" also takes in two patches of
    // Gagauzia, an autonomy within Moldova.
    owner: ['Republic of Moldova'], from: 1992, to: 2024,
    areas: [{ ne: 'Transnistria' }, { record: 'Russian-occupied territories', year: 2000, within: [26, 45, 31, 49] }],
    basis: 'UN GA resolution 72/282 (2018)',
  },
  {
    owner: ['Georgia'], from: 1992, to: 2024,
    areas: [{ ne: 'Abkhazia' }, { ne: 'South Ossetia' }, { record: 'Russian-occupied territories', year: 2000, within: [40, 41, 47, 44] }],
    basis: 'UN SC resolution 876 (1993); UN GA resolution 62/249 (2008)',
  },
  {
    // Soviet Azerbaijan: Cliopatria's Azerbaijan of 1993 and its separate
    // drawing of Nagorno-Karabakh inside Armenia's record.
    owner: ['Republic of Azerbaijan'], from: 1992, to: 2024,
    areas: [{ record: 'Republic of Azerbaijan', year: 1993 }, { record: 'Republic of Armenia', year: 1993, at: [46.75, 39.82] }, { ne: 'Artsakh' }],
    basis: 'UN SC resolutions 822, 853, 874 and 884 (1993)',
  },
  {
    owner: ['Republic of Cyprus'], from: 1974, to: 2024,
    areas: [{ ne: 'N. Cyprus' }, { ne: 'Cyprus U.N. Buffer Zone' }, { record: 'Turkish Republic of Northern Cyprus', year: 1990 }],
    basis: 'UN SC resolutions 353 (1974), 541 (1983) and 550 (1984)',
  },
  {
    owner: ['Republic of Egypt', 'United Arab Republic', 'Arab Republic of Egypt'], from: 1956, to: 1957,
    areas: [{ record: 'United Arab Republic', year: 1966 }],
    basis: 'UN GA resolution 997 (1956)',
  },
  {
    owner: ['United Arab Republic', 'Arab Republic of Egypt'], from: 1967, to: 1982,
    areas: [{ record: 'United Arab Republic', year: 1966 }],
    basis: 'UN SC resolution 242 (1967); Egypt–Israel peace treaty (1979)',
  },
  {
    // Under Egyptian administration from the 1949 armistice.
    owner: EGYPT, from: 1949, to: 1966,
    areas: [{ ne: 'Gaza' }],
    basis: 'Egypt–Israel armistice agreement (1949)',
  },
  {
    owner: ['Palestinian territories'], ru: 'Палестинские территории', wiki: 'Palestinian territories', create: true, from: 1967, to: 2024,
    areas: [{ ne: 'West Bank' }, { ne: 'Gaza' }, { ne: 'East Jerusalem' }],
    basis: 'UN SC resolutions 242 (1967), 478 (1980) and 2334 (2016)',
  },
  {
    owner: ["Ba'athist Syria", 'Syria'], from: 1967, to: 2024,
    areas: [{ ne: 'Golan Heights' }],
    basis: 'UN SC resolutions 242 (1967) and 497 (1981)',
  },
  {
    owner: ['Western Sahara'], ru: 'Западная Сахара', wiki: 'Western Sahara', create: true, from: 1976, to: 2024,
    areas: [{ ne: 'W. Sahara' }],
    basis: 'UN list of Non-Self-Governing Territories; UN GA resolution 34/37 (1979)',
  },
  {
    owner: ['South West Africa'], ru: 'Юго-Западная Африка', wiki: 'South West Africa', create: true, from: 1966, to: 1989,
    areas: [{ record: 'Namibia', year: 1990 }],
    basis: 'UN GA resolution 2145 (1966); UN SC resolution 276 (1970); ICJ advisory opinion (1971)',
  },
  {
    owner: ['East Timor'], create: true, from: 1976, to: 2005,
    areas: [{ record: 'East Timor', year: 2010 }],
    basis: 'UN SC resolutions 384 (1975) and 389 (1976); independent from 2002',
  },
  {
    owner: ['State of Kuwait'], create: true, from: 1990, to: 1990,
    areas: [{ record: 'State of Kuwait', year: 1989 }],
    basis: 'UN SC resolution 662 (1990)',
  },
]

/**
 * Wikipedia titles for the state card where Cliopatria's link lands on a
 * disambiguation page. Keys are English display names.
 */
export const WIKIPEDIA = {
  'Georgia': { en: 'Georgia (country)', ru: 'Грузия' },
  "Rus'": { en: "Rus' people", ru: 'Русь' },
  // Renamed in CORRECTIONS, so Cliopatria's link was for another state.
  'Eastern Jin': { en: 'Eastern Jin', ru: 'Восточная Цзинь' },
  'Despotate of the Morea': { en: 'Despotate of the Morea', ru: 'Морейский деспотат' },
}

/**
 * States whose modern borders are disputed. resolveClaims leaves their
 * records as Cliopatria draws them, even where two of them claim one land.
 */
export const DISPUTED = [
  'Russian Federation',
  'Ukraine',
  'Russian-occupied territories',
  'Georgia',
  'Republic of Moldova',
  'Republic of Armenia',
  'Republic of Azerbaijan',
  'State of Israel',
  'Palestinians',
  'Republic of India',
  'Islamic Republic of Pakistan',
  "People's Republic of China",
  'Republic of China',
  'Morocco',
  'Republic of Serbia',
  'Kosovo',
  'Republic of Cyprus',
  'Turkish Republic of Northern Cyprus',
]

/**
 * Fixes for Cliopatria records, by the Cliopatria name. Each applies to its
 * years only (a longer record is cut there) and, with `at` [lon, lat], only to
 * a record whose land holds that point. A fix either renames (`en`, `ru`),
 * drops the parts of the land that hold the `dropAt` points, or removes the
 * record (`remove`). Each one was checked against Wikipedia; see
 * tools/geo/polity-check.md.
 */
export const CORRECTIONS = [
  // Wrong state for the years: the later state gets its own name.
  { name: 'Denmark-Norway', from: 1815, to: 2100, en: 'Kingdom of Denmark', ru: 'Дания' },
  { name: 'First Hellenic Republic', from: 1833, to: 1924, en: 'Kingdom of Greece', ru: 'Королевство Греция' },
  { name: 'First Hellenic Republic', from: 1925, to: 1945, en: 'Greece', ru: 'Греция' },
  { name: 'Later Zhou', from: -800, to: -200, en: 'Eastern Zhou', ru: 'Восточная Чжоу' },
  { name: 'Great Yuan', from: -200, to: 100, en: 'Dayuan', ru: 'Давань' },
  // The Ngô ruled until 965; Đinh Bộ Lĩnh founded Đại Cồ Việt in 968.
  { name: 'Ngô Dynasty', from: 966, to: 1410, en: 'Đại Việt', ru: 'Дайвьет' },
  { name: 'Caliphate of Córdoba', from: 1032, to: 1100, en: 'Taifa of Córdoba', ru: 'Кордовская тайфа' },
  { name: 'Kingdom of Castile', from: 900, to: 1064, en: 'County of Castile', ru: 'Графство Кастилия' },
  { name: 'Serbian Empire', from: 1372, to: 1500, en: 'Serbian Despotate', ru: 'Сербская деспотия' },
  { name: 'County of Savoy', from: 1417, to: 1600, en: 'Duchy of Savoy', ru: 'Савойское герцогство' },
  { name: 'Republic of Florence', from: 1570, to: 1800, en: 'Grand Duchy of Tuscany', ru: 'Великое герцогство Тосканское' },
  { name: 'Astrakhan Khanate', from: 1600, to: 1800, en: 'Kalmyk Khanate', ru: 'Калмыцкое ханство' },
  // The Saadi line ended in 1659; the Alaouites ruled Morocco from 1666.
  { name: 'Saadi Sultanate', from: 1660, to: 1800, en: 'Sultanate of Morocco', ru: 'Марокканский султанат' },
  { name: 'First Toungoo Empire', from: 1600, to: 1800, en: 'Toungoo dynasty', ru: 'Империя Таунгу' },
  { name: 'Khmer Empire', from: 1432, to: 1900, en: 'Kingdom of Cambodia', ru: 'Камбоджа' },
  { name: 'Inca Empire', from: 1534, to: 1600, en: 'Neo-Inca State', ru: 'Государство Вилькабамба' },
  { name: 'Swedish Empire', from: 1722, to: 1900, en: 'Kingdom of Sweden', ru: 'Швеция' },
  { name: 'Empire of Haiti', from: 1840, to: 1920, en: 'Haiti', ru: 'Гаити' },
  { name: 'Natalia Republic', from: 1844, to: 1910, en: 'Colony of Natal', ru: 'Колония Наталь' },
  { name: "People's Republic of Zanzibar", from: 1850, to: 1963, en: 'Sultanate of Zanzibar', ru: 'Занзибарский султанат' },
  { name: 'Argentine Confederation', from: 1862, to: 1950, en: 'Argentine Republic', ru: 'Аргентина' },
  { name: 'United Principalities of Moldavia and Wallachia', from: 1882, to: 1947, en: 'Kingdom of Romania', ru: 'Королевство Румыния' },
  { name: 'Kingdom of Lithuania', from: 1918, to: 1940, en: 'Republic of Lithuania', ru: 'Литовская Республика' },
  { name: 'Principality of Bulgaria', from: 1909, to: 1946, en: 'Kingdom of Bulgaria', ru: 'Царство Болгария' },
  { name: 'Estado Novo', from: 1975, to: 2100, en: 'Portugal', ru: 'Португалия' },
  { name: 'Mali Federation', from: 1961, to: 2100, en: 'Mali', ru: 'Мали' },
  // The First Federal Republic ended in 1835; from 1846 it is federal Mexico again.
  { name: 'Federated Republic of Mexico', from: 1846, to: 1867, en: 'Mexico', ru: 'Мексика' },
  // "Serbs" is the uprising of 1804–1813, then the principality (1815) and the kingdom (1882).
  { name: 'Serbs', from: 1815, to: 1881, en: 'Principality of Serbia', ru: 'Княжество Сербия' },
  { name: 'Serbs', from: 1882, to: 1918, en: 'Kingdom of Serbia', ru: 'Королевство Сербия' },
  // The Union of South Africa became a republic in 1961.
  { name: 'South Africa', from: 1910, to: 1960, en: 'Union of South Africa', ru: 'Южно-Африканский Союз' },
  // From 1805 the Italian Republic was Napoleon's Kingdom of Italy.
  { name: 'Italian Republic', from: 1805, to: 1814, en: 'Kingdom of Italy (Napoleonic)', ru: 'Королевство Италия' },
  // The international zone was set up by the 1923 Tangier Convention.
  { name: 'Tangier International Zone', from: 1900, to: 1924, en: 'Tangier', ru: 'Танжер' },
  // Wrong name altogether; the place and years show which state it is.
  { name: 'Hashemite Arab Federation', from: 1400, to: 1500, en: 'Arab Iraq', ru: 'Ирак Арабский' },
  { name: "Arab Socialist Ba'ath Party", from: 1963, to: 1972, en: "Ba'athist Syria", ru: 'Сирия' },
  { name: 'Barghawata Conference', from: 700, to: 1100, en: 'Barghawata', ru: 'Баргвата' },
  { name: 'Livonian Conference', from: 1400, to: 1600, en: 'Livonian Confederation', ru: 'Ливонская конфедерация' },
  { name: 'Kingdom of Pajana', from: 1500, to: 1600, en: 'Sultanate of Pajang', ru: 'Паджанг' },
  { name: 'Danish Magnates', from: 1300, to: 1400, en: 'Danish Estonia', ru: 'Датская Эстляндия' },
  { name: 'Principality of Polotsky', from: 900, to: 1400, en: 'Principality of Polotsk', ru: 'Полоцкое княжество' },
  { name: 'Principality of Regensberg', from: 1800, to: 1820, en: 'Principality of Regensburg', ru: 'Княжество Регенсбург' },
  { name: 'Sultan of Yogyakarta', from: 1700, to: 2000, en: 'Sultanate of Yogyakarta', ru: 'Джокьякарта' },
  // No UN member recognised Ichkeria: under international law Chechnya stayed in Russia.
  { name: 'Chechen Republic', from: 1990, to: 2010, en: 'Russian Federation', ru: 'Россия' },
  // Alexander's empire, drawn before Ptolemy (king from 305 BC) under his kingdom's name.
  { name: 'Ptolemaic Kingdom', from: -331, to: -324, en: 'Macedonian Empire', ru: 'Древняя Македония' },
  // The Jin court fled south in 317: Eastern Jin, not Western.
  { name: 'Western Jin', from: 317, to: 425, en: 'Eastern Jin', ru: 'Восточная Цзинь' },
  // Constantinople fell in 1453; the Morea held out until 1460, Trebizond is its own record.
  { name: 'Byzantine Empire', from: 1454, to: 1460, dropAt: [[28.6, 41.2], [41.25, 41.05]], en: 'Despotate of the Morea', ru: 'Морейский деспотат' },
  { name: 'Byzantine Empire', from: 1461, to: 1474, remove: true },
  // Names swapped for 1895–1897: Iran's land under "Dutch East Indies" and the
  // other way round; the Netherlands' umbrella took Iran along.
  { name: 'Dutch East Indies', from: 1895, to: 1897, en: 'Qajar Dynasty', ru: 'Каджары' },
  { name: 'Qajar Dynasty', from: 1895, to: 1897, dropAt: [[51, 34.5]], en: 'Dutch East Indies', ru: 'Голландская Ост-Индия' },
  { name: '(Netherlands)', from: 1895, to: 1897, dropAt: [[53, 32]] },
  // A copy of the whole Neo-Assyrian Empire (Egypt included) under another name.
  { name: 'Assyrian Egypt', from: -700, to: -600, remove: true },
  // Land kept after it was lost: Cabinda went to Angola in 1975, Hainan to the
  // People's Republic in 1950.
  { name: 'Estado Novo', from: 1976, to: 2100, dropAt: [[12.3, -5.1]] },
  { name: 'Republic of China', from: 1951, to: 2100, dropAt: [[109.8, 19.2]] },
  // Right state, but its Wikipedia link (and so the Russian name) points elsewhere.
  { name: 'Southern Liang', from: 397, to: 414, en: 'Southern Liang', ru: 'Южная Лян' },
  { name: 'Great Mongol State', from: 1911, to: 1924, en: 'Great Mongol State', ru: 'Богдо-ханская Монголия' },
]
