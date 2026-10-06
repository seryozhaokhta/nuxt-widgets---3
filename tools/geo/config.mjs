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
}

/**
 * Name fixes for Cliopatria records, applied by name and overlapping years.
 * Each one was checked against Wikipedia; see tools/geo/polity-check.md.
 */
export const CORRECTIONS = [
  // Wrong state for the years: the later state gets its own name.
  { name: 'Denmark-Norway', from: 1815, to: 2100, en: 'Kingdom of Denmark', ru: 'Дания' },
  { name: 'First Hellenic Republic', from: 1833, to: 1924, en: 'Kingdom of Greece', ru: 'Королевство Греция' },
  { name: 'First Hellenic Republic', from: 1925, to: 1945, en: 'Greece', ru: 'Греция' },
  { name: 'Later Zhou', from: -800, to: -200, en: 'Eastern Zhou', ru: 'Восточная Чжоу' },
  { name: 'Great Yuan', from: -200, to: 100, en: 'Dayuan', ru: 'Давань' },
  { name: 'Ngô Dynasty', from: 1000, to: 1410, en: 'Đại Việt', ru: 'Дайвьет' },
  { name: 'Caliphate of Córdoba', from: 1032, to: 1100, en: 'Taifa of Córdoba', ru: 'Кордовская тайфа' },
  { name: 'Kingdom of Castile', from: 900, to: 1064, en: 'County of Castile', ru: 'Графство Кастилия' },
  { name: 'Serbian Empire', from: 1372, to: 1500, en: 'Serbian Despotate', ru: 'Сербская деспотия' },
  { name: 'County of Savoy', from: 1417, to: 1600, en: 'Duchy of Savoy', ru: 'Савойское герцогство' },
  { name: 'Republic of Florence', from: 1570, to: 1800, en: 'Grand Duchy of Tuscany', ru: 'Великое герцогство Тосканское' },
  { name: 'Astrakhan Khanate', from: 1600, to: 1800, en: 'Kalmyk Khanate', ru: 'Калмыцкое ханство' },
  { name: 'Saadi Sultanate', from: 1700, to: 1800, en: 'Sultanate of Morocco', ru: 'Марокканский султанат' },
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
  { name: 'Federated Republic of Mexico', from: 1860, to: 1867, en: 'Mexico', ru: 'Мексика' },
  // Right state, but its Wikipedia link (and so the Russian name) points elsewhere.
  { name: 'Southern Liang', from: 397, to: 414, en: 'Southern Liang', ru: 'Южная Лян' },
  { name: 'Great Mongol State', from: 1911, to: 1924, en: 'Great Mongol State', ru: 'Богдо-ханская Монголия' },
  { name: 'Hungarian Nationalists', from: 1956, to: 1957, en: 'Hungarian Nationalists', ru: 'Венгерские повстанцы' },
]
