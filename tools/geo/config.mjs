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
  'Muhammad Ali Dynasty': 'Египет при династии Мухаммада Али',
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
  // New or renamed in Cliopatria v0.2.2.
  'Jiaodong Kingdom': 'Цзяодун',
  'Kingdom of Henan': 'Хэнань',
  'Changshan': 'Чаншань',
  'Kannauj-Varman Dynasty': 'Варманы Канауджа',
  'County of Auvergne': 'Графство Овернь',
  'Ceylon kingdoms': 'Царства Цейлона',
  'Usfurids': 'Усфуриды',
  'Dauphiné': 'Дофине',
  'Kingdom of Syrmia': 'Сремское королевство',
  'Jarwanid Dynasty': 'Джарваниды',
  'Kingdom of Sweden': 'Швеция',
  'Kingdom of Pajang': 'Паджанг',
  'Sharifian Empire': 'Марокканский султанат',
  'Nakhon Chiang Mai': 'Чиангмай',
  'Bahrain': 'Бахрейн',
  'French Colony of Guiana': 'Французская Гвиана',
  'Pahang Kingdom': 'Паханг',
  // A regime's name for its country.
  'Estado Novo': 'Португалия',
  // Today's states by their everyday names, not their constitutions'.
  'French Fifth Republic': 'Франция',
  'Third Hellenic Republic': 'Греция',
  // Two states with one Russian name at once.
  'Wey': 'Вэй (衛)',
  'Eastern Moghulistan': 'Восточный Моголистан',
  'Western Moghulistan': 'Западный Моголистан',
  'Eastern Kara-Khanids': 'Восточно-Караханидское ханство',
  'Western Karakhanid Khanate': 'Западно-Караханидское ханство',
  'Principality of Pinsk': 'Пинское княжество',
  'Principality of Turov': 'Туровское княжество',
  'Beylik of Sinop': 'Синопский бейлик',
  'Magna Frisia': 'Великая Фризия',
  'Capetian House of Anjou': 'Анжуйская династия',
  'Halych-Volhynia occupation': 'Галич под властью Венгрии',
  'Kastamonu': 'Кастамону',
  // A name that reads as a party, a coalition or people rather than a state.
  'Athenian Coalition': 'Делосский союз',
  'Trưng sisters': 'Государство сестёр Чынг',
  'Greek junta': 'Греция (хунта)',
  // Wrong article behind the Russian name.
  'Kingdom of Spain': 'Испания',
  'Kingdoms of the Lombards': 'Итальянское королевство',
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
  'Kingdom of Denmark': [COPENHAGEN],
  'House of Oldenburg': [COPENHAGEN],
  'House of Habsburg': [VIENNA],
  'Habsburg Monarchy': [VIENNA],
  'House of Jagiellon': [[19.94, 50.06]],
  'Poland–Lithuania': [[19.94, 50.06]],
  'Habsburg lands': [VIENNA],
  'Kingdom of Prussia': [[13.4, 52.52]],
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
  'Chinese Soviet Republic': [[116.03, 25.89]],
  'Chinese Communist base areas': [[109.49, 36.59]],
  'Muhammad Ali Dynasty': [[31.24, 30.04]],
  'Emirate of Diriyah': [[46.57, 24.73]],
  'Nguyễn Dynasty': [[107.59, 16.46]],
  'Merina Kingdom': [[47.52, -18.91]],
  'Seleucid Empire': [[36.16, 36.2], [44.52, 33.1]],
  'Western Jin': [[112.45, 34.62]],
  'Spanish Nationalists': [[-3.7, 42.34]],
}

/**
 * Borders under international law where Cliopatria draws who held the land:
 * annexations and breakaway states that the UN declared invalid or that no UN
 * member recognises, and occupations in war, go to the state the land belongs
 * to. For the years given, the land is cut from every other record (with
 * `held`, only from those named) and joined to the owner's (`create` makes a
 * record when the owner has none, e.g. a territory with no state yet; `wiki`
 * is then its English Wikipedia title for the state card).
 *
 * What another state held of that land stays on the map, hatched over the
 * owner: `occupied` names the holder ("occupied by", or `by`/`byRu` for one
 * name over several holders, e.g. the Allied powers in Germany), `controlled`
 * names an unrecognised authority ("under the control of"). Without either,
 * the land just goes back (an ally's troops, a lost record).
 *
 * The land is made of Natural Earth's disputed areas (`ne`: BRK_NAME in
 * ne_10m_admin_0_disputed_areas), of parts of Cliopatria's own records
 * (`record` in `year`; with `at`, only the part holding that point; with
 * `within` [west, south, east, north], only the parts inside that box) and of
 * outlines given here (`polygon`); `clip` [west, south, east, north] cuts any
 * of them to a box.
 *
 * Left as Cliopatria draws them, since no treaty or UN decision settles them
 * (or the line itself rests on one): Kashmir along the Line of Control (Simla
 * Agreement, 1972), Kosovo, Taiwan, the southern Kuril Islands.
 */
const EGYPT = ['Kingdom of Egypt', 'Republic of Egypt', 'United Arab Republic', 'Arab Republic of Egypt']
/** Berlin's two halves, 1949–1990, approximately; Cliopatria has the French sector only. */
const WEST_BERLIN = [
  [13.12, 52.4], [13.17, 52.39], [13.27, 52.4], [13.37, 52.39], [13.42, 52.37], [13.49, 52.4], [13.45, 52.47],
  [13.41, 52.51], [13.39, 52.52], [13.37, 52.54], [13.38, 52.57], [13.36, 52.62], [13.28, 52.66], [13.21, 52.63],
  [13.14, 52.59], [13.12, 52.53], [13.11, 52.46], [13.12, 52.4],
]
const EAST_BERLIN = [
  [13.37, 52.54], [13.39, 52.52], [13.41, 52.51], [13.45, 52.47], [13.49, 52.4], [13.58, 52.39], [13.7, 52.39],
  [13.76, 52.43], [13.7, 52.5], [13.64, 52.54], [13.55, 52.59], [13.5, 52.63], [13.43, 52.66], [13.38, 52.63],
  [13.36, 52.62], [13.38, 52.57], [13.37, 52.54],
]
export const DE_JURE = [
  // ---- Today's occupied and breakaway lands. The hatching covers the whole
  // disputed area, since Cliopatria draws it unevenly (Crimea as Russia's,
  // Donetsk as Ukraine's, Abkhazia as nobody's).
  {
    owner: ['Ukraine'], from: 2014, to: 2024,
    areas: [{ ne: 'Crimea' }, { ne: 'Donetsk People\'s Republic' }, { ne: 'Luhansk People\'s Republic' }],
    occupied: true, hatch: 'all', by: 'Russian Federation',
    basis: 'UN GA resolutions 68/262 (2014) and ES-11/4 (2022)',
  },
  {
    // Cliopatria's "Russian-occupied territories" also takes in two patches of
    // Gagauzia, an autonomy within Moldova: they go back without hatching.
    owner: ['Republic of Moldova'], from: 1992, to: 2024,
    areas: [{ record: 'Russian-occupied territories', year: 2000, within: [26, 45, 31, 49] }],
    basis: 'UN GA resolution 72/282 (2018)',
  },
  {
    owner: ['Republic of Moldova'], from: 1992, to: 2024,
    areas: [{ ne: 'Transnistria' }],
    controlled: true, hatch: 'all', by: 'Pridnestrovian Moldavian Republic', byRu: 'Приднестровье',
    basis: 'UN GA resolution 72/282 (2018)',
  },
  {
    owner: ['Georgia'], from: 1992, to: 2024,
    areas: [{ record: 'Russian-occupied territories', year: 2000, within: [40, 41, 47, 44] }],
    basis: 'UN SC resolution 876 (1993); UN GA resolution 62/249 (2008)',
  },
  {
    owner: ['Georgia'], from: 1992, to: 2007,
    areas: [{ ne: 'Abkhazia' }],
    controlled: true, hatch: 'all', by: 'Republic of Abkhazia', byRu: 'Республика Абхазия',
    basis: 'UN SC resolution 876 (1993)',
  },
  {
    owner: ['Georgia'], from: 1992, to: 2007,
    areas: [{ ne: 'South Ossetia' }],
    controlled: true, hatch: 'all', by: 'Republic of South Ossetia', byRu: 'Южная Осетия',
    basis: 'Sochi Agreement (1992)',
  },
  {
    owner: ['Georgia'], from: 2008, to: 2024,
    areas: [{ ne: 'Abkhazia' }, { ne: 'South Ossetia' }],
    occupied: true, hatch: 'all', by: 'Russian Federation',
    basis: 'UN GA resolution 62/249 (2008); European Parliament resolution (2011)',
  },
  {
    // Soviet Azerbaijan: Cliopatria's Azerbaijan of 1993 and its separate
    // drawing of Nagorno-Karabakh inside Armenia's record.
    owner: ['Republic of Azerbaijan'], from: 1992, to: 2024,
    areas: [{ record: 'Republic of Azerbaijan', year: 1993 }, { record: 'Republic of Armenia', year: 1993, at: [46.75, 39.82] }, { ne: 'Artsakh' }],
    basis: 'UN SC resolutions 822, 853, 874 and 884 (1993)',
  },
  {
    owner: ['Republic of Azerbaijan'], from: 1992, to: 2023,
    areas: [{ ne: 'Artsakh' }],
    controlled: true, hatch: 'all', by: 'Republic of Artsakh', byRu: 'Нагорно-Карабахская Республика',
    basis: 'UN SC resolutions 822, 853, 874 and 884 (1993)',
  },
  {
    owner: ['Republic of Cyprus'], from: 1974, to: 2024,
    areas: [{ ne: 'N. Cyprus' }, { ne: 'Cyprus U.N. Buffer Zone' }, { record: 'Turkish Republic of Northern Cyprus', year: 1990 }],
    basis: 'UN SC resolutions 353 (1974), 541 (1983) and 550 (1984)',
  },
  {
    owner: ['Republic of Cyprus'], from: 1974, to: 2024,
    areas: [{ ne: 'N. Cyprus' }],
    occupied: true, hatch: 'all', by: 'Republic of Turkey',
    basis: 'UN SC resolutions 353 (1974), 541 (1983) and 550 (1984)',
  },
  {
    owner: ['Republic of Egypt', 'United Arab Republic', 'Arab Republic of Egypt'], from: 1956, to: 1957,
    areas: [{ record: 'United Arab Republic', year: 1966 }], held: ['State of Israel'], occupied: true,
    basis: 'UN GA resolution 997 (1956)',
  },
  {
    owner: ['United Arab Republic', 'Arab Republic of Egypt'], from: 1967, to: 1982,
    areas: [{ record: 'United Arab Republic', year: 1966 }], held: ['State of Israel'], occupied: true,
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
    areas: [{ ne: 'West Bank' }, { ne: 'Gaza' }, { ne: 'East Jerusalem' }], held: ['State of Israel'], occupied: true,
    basis: 'UN SC resolutions 242 (1967), 478 (1980) and 2334 (2016)',
  },
  {
    owner: ['Syrian Arab Republic'], from: 1967, to: 2024,
    areas: [{ ne: 'Golan Heights' }], held: ['State of Israel'], occupied: true,
    basis: 'UN SC resolutions 242 (1967) and 497 (1981)',
  },
  {
    owner: ['Western Sahara'], ru: 'Западная Сахара', wiki: 'Western Sahara', create: true, from: 1976, to: 2024,
    areas: [{ ne: 'W. Sahara' }],
    basis: 'UN list of Non-Self-Governing Territories; UN GA resolution 34/37 (1979)',
  },
  {
    owner: ['Western Sahara'], ru: 'Западная Сахара', from: 1976, to: 2024,
    areas: [{ ne: 'W. Sahara', note: 'Admin. by Morocco; Claimed by Western Sahara' }],
    occupied: true, hatch: 'all', by: 'Morocco',
    basis: 'UN GA resolution 34/37 (1979)',
  },
  {
    owner: ['South West Africa'], ru: 'Юго-Западная Африка', wiki: 'South West Africa', create: true, from: 1966, to: 1989,
    areas: [{ record: 'Namibia', year: 1990 }], held: ['South Africa'], occupied: true,
    basis: 'UN GA resolution 2145 (1966); UN SC resolution 276 (1970); ICJ advisory opinion (1971)',
  },
  {
    owner: ['East Timor'], create: true, from: 1976, to: 2005,
    areas: [{ record: 'East Timor', year: 2010 }], held: ['Republic of Indonesia'], occupied: true,
    basis: 'UN SC resolutions 384 (1975) and 389 (1976); independent from 2002',
  },
  {
    owner: ['State of Kuwait'], create: true, from: 1990, to: 1990,
    areas: [{ record: 'State of Kuwait', year: 1989 }], held: ['Iraqi Republic'], occupied: true,
    basis: 'UN SC resolution 662 (1990)',
  },

  // ---- Before the world wars.
  {
    // Britain occupied Egypt in 1882; it stayed a khedivate under Ottoman
    // suzerainty until the British protectorate of 1914, then a sultanate.
    owner: ['Khedivate of Egypt'], create: true, from: 1883, to: 1914,
    areas: [{ record: 'Khedivate of Egypt', year: 1882, clip: [24, 21.9, 37.5, 32] }], held: ['British Africa'],
    occupied: true, by: 'United Kingdom',
    basis: 'Anglo-Egyptian War (1882); Ottoman suzerainty until 1914',
  },
  {
    owner: ['Sultanate of Egypt'], ru: 'Египетский султанат', wiki: 'Sultanate of Egypt', create: true, from: 1915, to: 1921,
    areas: [{ record: 'Khedivate of Egypt', year: 1882, clip: [24, 21.9, 37.5, 32] }], held: ['British Africa'],
    occupied: true, by: 'United Kingdom',
    basis: 'British protectorate (1914–1922)',
  },
  {
    // A dominion from 1910; Cliopatria keeps it in "British Africa" until 1931.
    owner: ['Union of South Africa'], create: true, from: 1910, to: 1931,
    // Without South West Africa, a German colony until 1915 and a mandate after.
    areas: [{ record: 'Union of South Africa', year: 1932, clip: [20, -35, 33, -22] }, { record: 'Union of South Africa', year: 1932, clip: [16, -35, 20, -28.6] }],
    held: ['British Africa'],
    basis: 'South Africa Act (1909)',
  },

  // ---- The First World War: lands occupied by the Central Powers.
  {
    owner: ['Kingdom of Belgium'], from: 1914, to: 1918,
    areas: [{ record: 'Kingdom of Belgium', year: 1913 }], held: ['German Empire'], occupied: true,
    basis: 'Treaty of London (1839); Hague Convention IV (1907)',
  },
  {
    owner: ['Kingdom of Serbia'], create: true, from: 1915, to: 1918,
    areas: [{ record: 'Kingdom of Serbia', year: 1914 }], held: ['Austria-Hungary', 'Kingdom of Bulgaria', 'German Empire'], occupied: true,
    basis: 'Hague Convention IV (1907); Treaty of Versailles (1919)',
  },
  {
    owner: ['Kingdom of Romania'], create: true, from: 1917, to: 1918,
    areas: [{ record: 'Kingdom of Romania', year: 1915 }], held: ['Austria-Hungary', 'German Empire', 'Kingdom of Bulgaria'], occupied: true,
    basis: 'Hague Convention IV (1907); the Treaty of Bucharest (1918) was never ratified',
  },

  // ---- Annexations and occupations before and in the Second World War,
  // none of them recognised by the Allies; each state comes back in its
  // borders before the war.
  {
    owner: ['Ethiopian Empire'], create: true, from: 1936, to: 1941,
    areas: [{ record: 'Ethiopian Empire', year: 1935 }], held: ['Italian Africa'], occupied: true,
    basis: 'League of Nations Covenant, article 10; Anglo-Ethiopian Agreement (1942)',
  },
  {
    owner: ['Republic of Austria'], create: true, from: 1938, to: 1944,
    areas: [{ record: 'Republic of Austria', year: 1937 }], held: ['Nazi Germany'], occupied: true,
    basis: 'Moscow Declaration (1943); Austrian State Treaty (1955)',
  },
  {
    owner: ['Czechoslovakia'], create: true, from: 1939, to: 1944,
    areas: [{ record: 'Czechoslovakia', year: 1937 }], held: ['Nazi Germany', 'Kingdom of Hungary', 'Slovakia', 'Second Polish Republic'], occupied: true,
    basis: 'Munich Agreement and Vienna Award held void by the Allies (1942–1973)',
  },
  {
    owner: ['Albania'], create: true, from: 1939, to: 1944,
    areas: [{ record: 'Albania', year: 1938 }], held: ['Kingdom of Italy', 'Nazi Germany'], occupied: true,
    basis: 'Hague Convention IV (1907); Paris Peace Treaty with Italy (1947)',
  },
  {
    owner: ['Second Polish Republic'], create: true, from: 1939, to: 1944,
    areas: [{ record: 'Second Polish Republic', year: 1938 }],
    held: ['Nazi Germany', 'Union of Soviet Socialist Republics', 'Republic of Lithuania', 'Slovakia'], occupied: true,
    basis: 'The 1939 partition unrecognised by the Allies; Atlantic Charter (1941)',
  },
  ...['Estonia', 'Republic of Latvia'].map((owner) => ({
    owner: [owner], create: true, from: 1940, to: 1991,
    areas: [{ record: owner, year: 1939 }], held: ['Union of Soviet Socialist Republics', 'Nazi Germany'], occupied: true,
    basis: 'The 1940 annexation unrecognised (Welles Declaration, 1940; European Parliament, 1983); independence restored in 1991',
  })),
  {
    owner: ['Republic of Lithuania'], create: true, from: 1940, to: 1944,
    areas: [{ record: 'Republic of Lithuania', year: 1939 }], held: ['Union of Soviet Socialist Republics', 'Nazi Germany'], occupied: true,
    basis: 'The 1940 annexation unrecognised (Welles Declaration, 1940; European Parliament, 1983)',
  },
  {
    owner: ['Republic of Lithuania'], create: true, from: 1945, to: 1991,
    areas: [{ record: 'Republic of Lithuania', year: 1993 }], held: ['Union of Soviet Socialist Republics'], occupied: true,
    basis: 'The 1940 annexation unrecognised (Welles Declaration, 1940; European Parliament, 1983); independence restored in 1991',
  },
  ...[['Denmark', 1939], ['Kingdom of Norway', 1939], ['Kingdom of Belgium', 1939], ['Luxembourg', 1939]].map(([owner, year]) => ({
    owner: [owner], create: true, from: 1940, to: 1944,
    areas: [{ record: owner, year }], held: ['Nazi Germany'], occupied: true,
    basis: 'Hague Convention IV (1907)',
  })),
  {
    owner: ['Netherlands'], create: true, from: 1940, to: 1944,
    areas: [{ record: 'Netherlands', year: 1939, clip: [3, 50.5, 7.5, 54] }], held: ['Nazi Germany'], occupied: true,
    basis: 'Hague Convention IV (1907)',
  },
  {
    // The French State at Vichy governed the occupied zone too, until 1944.
    owner: ['Vichy France'], create: true, from: 1940, to: 1944,
    areas: [{ record: 'French Third Republic', year: 1939, clip: [-5.5, 41, 10, 51.5] }], held: ['Nazi Germany', 'Kingdom of Italy'], occupied: true,
    basis: 'Armistice of 22 June 1940; Hague Convention IV (1907)',
  },
  {
    // The kingdom went on in the south, at war with Germany from October 1943.
    owner: ['Kingdom of Italy'], create: true, from: 1943, to: 1945,
    areas: [{ record: 'Kingdom of Italy', year: 1942, clip: [6, 36, 19, 47.2] }], held: ['Nazi Germany'], occupied: true,
    basis: 'Armistice of Cassibile (1943); Hague Convention IV (1907)',
  },
  {
    owner: ['Kingdom of Greece'], create: true, from: 1941, to: 1944,
    areas: [{ record: 'Kingdom of Greece', year: 1940 }], held: ['Nazi Germany', 'Kingdom of Italy', 'Kingdom of Bulgaria'], occupied: true,
    basis: 'Hague Convention IV (1907)',
  },
  {
    owner: ['Kingdom of Yugoslavia'], create: true, from: 1941, to: 1944,
    areas: [{ record: 'Kingdom of Yugoslavia', year: 1940 }],
    held: ['Nazi Germany', 'Kingdom of Italy', 'Kingdom of Hungary', 'Kingdom of Bulgaria', 'Independent State of Croatia', 'Albania'], occupied: true,
    basis: 'Hague Convention IV (1907)',
  },
  {
    owner: ['Union of Soviet Socialist Republics'], from: 1941, to: 1944,
    areas: [{ record: 'Union of Soviet Socialist Republics', year: 1938 }],
    held: ['Nazi Germany', 'Kingdom of Romania', 'Kingdom of Hungary', 'Finland'], occupied: true,
    basis: 'Hague Convention IV (1907)',
  },
  {
    owner: ['Republic of China'], from: 1931, to: 1945,
    areas: [{ record: 'Republic of China', year: 1930, clip: [97, 18, 135.5, 54] }], held: ['Empire of Japan'], occupied: true,
    basis: 'Lytton Report (1932); Cairo Declaration (1943)',
  },
  {
    owner: ['Republic of China'], from: 1946, to: 1946,
    areas: [{ record: 'Republic of China', year: 1930, clip: [118, 38, 135.5, 54] }], held: ['Union of Soviet Socialist Republics'], occupied: true,
    basis: 'Sino-Soviet Treaty of Friendship and Alliance (1945)',
  },
  ...[
    ['United States of America', [116, 4, 127, 21.5]],
    ['British Colonial Empire', [99, 0, 120, 23]],
    ['British Raj', [92, 9, 102, 29]],
    ['Dutch East Indies', null],
    ['French Indochina', null],
  ].map(([owner, clip]) => ({
    owner: [owner], create: true, from: 1942, to: 1945,
    areas: [{ record: owner, year: 1941, ...(clip ? { clip } : {}) }], held: ['Empire of Japan'], occupied: true,
    basis: 'Hague Convention IV (1907); Instrument of Surrender of Japan (1945)',
  })),
  {
    owner: ['Pahlavi Dynasty'], create: true, from: 1941, to: 1946,
    areas: [{ record: 'Pahlavi Dynasty', year: 1940 }],
    held: ['British Colonial Empire', 'British Empire', 'Union of Soviet Socialist Republics'], occupied: true,
    basis: 'Anglo-Soviet invasion (1941); Tripartite Treaty of Alliance (1942)',
  },
  {
    owner: ['Kingdom of Iraq'], create: true, from: 1941, to: 1947,
    areas: [{ record: 'Kingdom of Iraq', year: 1940 }], held: ['British Empire', 'British Colonial Empire', 'British Africa'], occupied: true,
    basis: 'Anglo-Iraqi Treaty (1930); British occupation 1941–1947',
  },
  {
    owner: ['Kingdom of Iceland', 'Republic of Iceland'], create: true, from: 1940, to: 1945,
    areas: [{ record: 'Kingdom of Iceland', year: 1938 }], held: ['British Empire', 'United States of America'], occupied: true,
    basis: 'British invasion (1940); defence agreement with the United States (1941)',
  },

  // ---- After the war: the Allied occupations, and states Cliopatria leaves
  // inside the Soviet Union.
  {
    owner: ['Germany'], ru: 'Германия', create: true, from: 1945, to: 1949,
    areas: [
      { record: 'Federal Republic of Germany', year: 1950 }, { record: 'German Democratic Republic', year: 1950 },
      { polygon: WEST_BERLIN }, { polygon: EAST_BERLIN },
    ],
    occupied: true, by: 'Allied powers', byRu: 'союзные державы',
    basis: 'Berlin Declaration (1945); Potsdam Agreement (1945)',
  },
  {
    owner: ['Second Republic of Austria'], create: true, from: 1945, to: 1946,
    areas: [{ record: 'Second Republic of Austria', year: 1947 }], occupied: true, by: 'Allied powers', byRu: 'союзные державы',
    basis: 'Allied Control Agreements for Austria (1945, 1946); Austrian State Treaty (1955)',
  },
  ...[['Hungary', 'Hungary'], ['Kingdom of Romania', 'Kingdom of Romania'], ['Kingdom of Bulgaria', "People's Republic of Bulgaria"]].map(([owner, record]) => ({
    owner: [owner], create: true, from: 1945, to: 1946,
    areas: [{ record, year: 1947 }], held: ['Union of Soviet Socialist Republics'], occupied: true,
    basis: 'Armistice agreements (1944–1945); Paris Peace Treaties (1947)',
  })),
  {
    owner: ['Czechoslovakia'], create: true, from: 1945, to: 1946,
    areas: [{ record: 'Czechoslovakia', year: 1947 }], held: ['Union of Soviet Socialist Republics'],
    basis: 'Restored in its borders before 1938, less Carpathian Ruthenia ceded to the USSR by the treaty of 1945',
  },
  {
    owner: ['Republic of Poland'], create: true, from: 1945, to: 1952,
    areas: [{ record: 'Republic of Poland', year: 1953 }], held: ['Union of Soviet Socialist Republics'],
    basis: 'Potsdam Agreement (1945); Polish–Soviet border agreement (1945)',
  },
  {
    owner: ['West Berlin'], create: true, from: 1949, to: 1990,
    areas: [{ polygon: WEST_BERLIN }],
    basis: 'Four-power status; Quadripartite Agreement on Berlin (1971)',
  },
  {
    owner: ['German Democratic Republic'], from: 1950, to: 1990,
    areas: [{ polygon: EAST_BERLIN }],
    basis: 'Capital of the GDR; Quadripartite Agreement on Berlin (1971)',
  },
  {
    owner: ['Japan'], create: true, from: 1946, to: 1952,
    areas: [{ record: 'Japan', year: 1953 }], held: ['United States of America'], occupied: true,
    basis: 'Potsdam Declaration (1945); Treaty of San Francisco (1951, in force 1952)',
  },

  // ---- The Cold War.
  {
    owner: ['Democratic Republic of Afghanistan'], create: true, from: 1979, to: 1982,
    areas: [{ record: 'Democratic Republic of Afghanistan', year: 1983 }], held: ['Union of Soviet Socialist Republics'], occupied: true,
    basis: 'UN GA resolution ES-6/2 (1980); Geneva Accords (1988)',
  },
  {
    // American troops were there at the government's request.
    owner: ['Republic of Vietnam'], from: 1967, to: 1972,
    areas: [{ record: 'Republic of Vietnam', year: 1966 }], held: ['United States of America'],
    basis: 'Paris Peace Accords (1973)',
  },
]

/**
 * Land Cliopatria leaves to no one while everything around it is held: each
 * patch (today's land inside `area`, a ring of [lon, lat]) joins whoever holds
 * the point `by` in each year. (Istanbul and small islands such as New
 * Providence are missing from Cliopatria too, but the map's land outline has
 * water there, so nothing is lost.)
 */
export const FILLS = [
  { name: 'Chukotka beyond 180°', area: [[-180, 62], [-168, 62], [-168, 72], [-180, 72], [-180, 62]], by: [176, 66] },
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
  'Kingdom of Sweden': { en: 'Sweden', ru: 'Швеция' },
  'Colony and Protectorate of Nigeria': { en: 'Colony and Protectorate of Nigeria', ru: 'Британская Нигерия' },
  'Dominion of Newfoundland': { en: 'Dominion of Newfoundland', ru: 'Доминион Ньюфаундленд' },
  'British mandates': { en: 'League of Nations mandate', ru: 'Мандат Лиги Наций' },
  'Poland–Lithuania': { en: 'Polish–Lithuanian union', ru: 'Польско-литовская уния' },
  'Habsburg lands': { en: 'Habsburg monarchy', ru: 'Габсбургская монархия' },
  'Chinese Soviet Republic': { en: 'Chinese Soviet Republic', ru: 'Китайская Советская Республика' },
  'Chinese Communist base areas': { en: 'Communist-controlled China (1927–1949)', ru: 'Освобождённые районы' },
  'Democratic Republic of Afghanistan': { en: 'Democratic Republic of Afghanistan', ru: 'Демократическая Республика Афганистан' },
  'Republic of Afghanistan': { en: 'Republic of Afghanistan (1987–1992)', ru: 'Республика Афганистан' },
  'Islamic State of Afghanistan': { en: 'Islamic State of Afghanistan', ru: 'Исламское Государство Афганистан' },
  'Islamic Republic of Afghanistan': { en: 'Islamic Republic of Afghanistan', ru: 'Исламская Республика Афганистан' },
  'West Berlin': { en: 'West Berlin', ru: 'Западный Берлин' },
  'Germany': { en: 'Allied-occupied Germany', ru: 'Оккупация Германии' },
  'North German Confederation': { en: 'North German Confederation', ru: 'Северогерманский союз' },
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
  { name: 'First Hellenic Republic', from: 1833, to: 1924, en: 'Kingdom of Greece', ru: 'Королевство Греция' },
  // The Ngô ruled until 965; Đinh Bộ Lĩnh founded Đại Cồ Việt in 968.
  { name: 'Ngô Dynasty', from: 966, to: 1410, en: 'Đại Việt', ru: 'Дайвьет' },
  { name: 'Caliphate of Córdoba', from: 1032, to: 1100, en: 'Taifa of Córdoba', ru: 'Кордовская тайфа' },
  { name: 'Kingdom of Castile', from: 900, to: 1064, en: 'County of Castile', ru: 'Графство Кастилия' },
  { name: 'Serbian Empire', from: 1372, to: 1500, en: 'Serbian Despotate', ru: 'Сербская деспотия' },
  { name: 'Republic of Florence', from: 1570, to: 1800, en: 'Grand Duchy of Tuscany', ru: 'Великое герцогство Тосканское' },
  // The Saadi line ended in 1659; the Alaouites ruled Morocco from 1666.
  { name: 'Saadi Sultanate', from: 1660, to: 1800, en: 'Sultanate of Morocco', ru: 'Марокканский султанат' },
  { name: 'Khmer Empire', from: 1432, to: 1900, en: 'Kingdom of Cambodia', ru: 'Камбоджа' },
  { name: 'Inca Empire', from: 1534, to: 1600, en: 'Neo-Inca State', ru: 'Государство Вилькабамба' },
  { name: 'Natalia Republic', from: 1844, to: 1909, en: 'Colony of Natal', ru: 'Колония Наталь' },
  // Natal joined the Union of South Africa in 1910.
  { name: 'Colony of Natal', from: 1910, to: 1910, remove: true },
  { name: "People's Republic of Zanzibar", from: 1850, to: 1963, en: 'Sultanate of Zanzibar', ru: 'Занзибарский султанат' },
  { name: 'Estado Novo', from: 1975, to: 2100, en: 'Portugal', ru: 'Португалия' },
  // The Union of South Africa became a republic in 1961.
  { name: 'South Africa', from: 1910, to: 1960, en: 'Union of South Africa', ru: 'Южно-Африканский Союз' },
  // The international zone was set up by the 1923 Tangier Convention.
  { name: 'Tangier International Zone', from: 1900, to: 1924, en: 'Tangier', ru: 'Танжер' },
  // Wrong name altogether; the place and years show which state it is.
  { name: 'Barghawata Conference', from: 700, to: 1100, en: 'Barghawata', ru: 'Баргвата' },
  { name: 'Livonian Conference', from: 1400, to: 1600, en: 'Livonian Confederation', ru: 'Ливонская конфедерация' },
  { name: 'Principality of Polotsky', from: 900, to: 1400, en: 'Principality of Polotsk', ru: 'Полоцкое княжество' },
  { name: 'Principality of Regensberg', from: 1800, to: 1820, en: 'Principality of Regensburg', ru: 'Княжество Регенсбург' },
  { name: 'Sultan of Yogyakarta', from: 1700, to: 2000, en: 'Sultanate of Yogyakarta', ru: 'Джокьякарта' },
  // No UN member recognised Ichkeria: under international law Chechnya stayed in Russia.
  { name: 'Chechen Republic', from: 1990, to: 2010, en: 'Russian Federation', ru: 'Россия' },
  // Alexander's empire, drawn before Ptolemy (king from 305 BC) under his kingdom's name.
  { name: 'Ptolemaic Kingdom', from: -331, to: -324, en: 'Macedonian Empire', ru: 'Древняя Македония' },
  // The Jin court fled south in 317: Eastern Jin, not Western.
  { name: 'Western Jin', from: 317, to: 425, en: 'Eastern Jin', ru: 'Восточная Цзинь' },
  // Names swapped for 1895–1897: Iran's land under "Dutch East Indies" and the
  // other way round; the Netherlands' umbrella took Iran along.
  { name: 'Dutch East Indies', from: 1895, to: 1897, en: 'Qajar Dynasty', ru: 'Каджары' },
  { name: 'Qajar Dynasty', from: 1895, to: 1897, dropAt: [[51, 34.5]], en: 'Dutch East Indies', ru: 'Голландская Ост-Индия' },
  { name: '(Netherlands)', from: 1895, to: 1897, dropAt: [[53, 32]] },
  // Prussia drawn as the German Confederation, of which it was one member
  // (and East Prussia not even that); the confederation's other members have
  // their own records. Then the North German Confederation of 1867.
  { name: 'German Confederation', from: 1815, to: 1866, en: 'Kingdom of Prussia', ru: 'Королевство Пруссия' },
  { name: 'German Confederation', from: 1867, to: 1870, en: 'North German Confederation', ru: 'Северогерманский союз' },
  // A dynasty's name for its states: Poland and Lithuania in personal union
  // until the Union of Lublin (1569); the Habsburgs' hereditary lands.
  { name: 'House of Jagiellon', from: 1300, to: 1568, en: 'Poland–Lithuania', ru: 'Польша и Литва' },
  { name: 'House of Jagiellon', from: 1569, to: 1600, en: 'Polish-Lithuanian Commonwealth', ru: 'Речь Посполитая' },
  { name: 'House of Habsburg', from: 1200, to: 1600, en: 'Habsburg lands', ru: 'Земли Габсбургов' },
  // A party's name for the state it ran: the Republic of China (the Beiyang
  // government until 1928, then the Nationalists), the Chinese Soviet
  // Republic (1931–1937), then the Communists' base areas.
  { name: 'Kuomintang', from: 1912, to: 1949, en: 'Republic of China', ru: 'Китайская республика' },
  // Until 1945 their land, and the rival coalition's of 1930, lies inside the
  // Republic's record: drawn as under their control (`control`), hatched.
  { name: 'Communist Party of China', from: 1931, to: 1935, en: 'Chinese Soviet Republic', ru: 'Китайская Советская Республика', control: 'Republic of China' },
  { name: 'Communist Party of China', from: 1936, to: 1945, en: 'Chinese Communist base areas', ru: 'Освобождённые районы КПК', control: 'Republic of China' },
  { name: 'Communist Party of China', from: 1946, to: 1949, en: 'Chinese Communist base areas', ru: 'Освобождённые районы КПК' },
  { name: 'Anti-Kuomintang Coalition', from: 1929, to: 1931, control: 'Republic of China' },
  // Afghanistan's governments by their names: the Democratic Republic (1978),
  // renamed Republic of Afghanistan in 1987, which held Kabul until April 1992;
  // then the mujahideen's Islamic State, and from 2002 the Islamic Republic.
  { name: 'Afghanistan', from: 1978, to: 1986, en: 'Democratic Republic of Afghanistan', ru: 'Демократическая Республика Афганистан' },
  { name: 'Afghanistan Mujahideen', from: 1987, to: 1991, en: 'Republic of Afghanistan', ru: 'Республика Афганистан' },
  { name: 'Afghanistan Mujahideen', from: 1992, to: 1996, en: 'Islamic State of Afghanistan', ru: 'Исламское Государство Афганистан' },
  { name: 'Taliban', from: 2002, to: 2005, en: 'Islamic Republic of Afghanistan', ru: 'Исламская Республика Афганистан' },
  // Colonies and dominions drawn inside another colony's record (`split`: the
  // parts centred in the boxes). Nigeria in the Gold Coast's; Canada (from
  // 1870, when Rupert's Land joined), Australia (1901), New Zealand and
  // Newfoundland (1907) in the British colonies'; Palestine, Transjordan and
  // Iraq, League of Nations mandates, in "British Africa"; Hanover, in personal
  // union with Britain until 1837, in "British Empire".
  { name: 'British Gold Coast', from: 1900, to: 1960, split: [[2.6, 4, 15, 14]], en: 'Colony and Protectorate of Nigeria', ru: 'Британская Нигерия' },
  { name: 'British Colonial Empire', from: 1870, to: 1931, split: [[-141, 41, -60, 84]], en: 'Canada', ru: 'Канада' },
  { name: 'British Colonial Empire', from: 1901, to: 1904, split: [[112, -44, 154, -10]], en: 'Commonwealth of Australia', ru: 'Австралия' },
  { name: 'British Colonial Empire', from: 1907, to: 1947, split: [[165, -48, 179.99, -33]], en: 'New Zealand', ru: 'Новая Зеландия' },
  { name: 'British Colonial Empire', from: 1907, to: 1948, split: [[-60, 46, -52, 52]], en: 'Dominion of Newfoundland', ru: 'Доминион Ньюфаундленд' },
  { name: 'British Africa', from: 1919, to: 1948, split: [[33, 28, 49, 38]], en: 'British mandates', ru: 'Британские подмандатные территории' },
  { name: 'British Empire', from: 1814, to: 1837, split: [[6, 50, 12.5, 54.5]], en: 'Kingdom of Hanover', ru: 'Королевство Ганновер' },
  // West Berlin drawn as France (its French sector only); see DE_JURE for the city.
  { name: 'French Fourth Republic', from: 1949, to: 1957, split: [[13, 52.3, 13.8, 52.7]], en: 'West Berlin', ru: 'Западный Берлин' },
  { name: 'French Fifth Republic', from: 1958, to: 1990, split: [[13, 52.3, 13.8, 52.7]], en: 'West Berlin', ru: 'Западный Берлин' },
  // The Bourbon lands went to the Crown in 1527; Cliopatria keeps them apart inside France.
  { name: 'House of Bourbon', from: 1527, to: 1600, remove: true },
  // A copy of the whole Neo-Assyrian Empire (Egypt included) under another name.
  { name: 'Assyrian Egypt', from: -700, to: -600, remove: true },
  // Land kept after it was lost: Hainan went to the People's Republic in 1950.
  { name: 'Republic of China', from: 1951, to: 2100, dropAt: [[109.8, 19.2]] },
  // Right state, but its Wikipedia link (and so the Russian name) points elsewhere.
  { name: 'Southern Liang', from: 397, to: 414, en: 'Southern Liang', ru: 'Южная Лян' },
  { name: 'Great Mongol State', from: 1911, to: 1924, en: 'Great Mongol State', ru: 'Богдо-ханская Монголия' },
]
