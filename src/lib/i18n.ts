import { writable, derived, get } from "svelte/store";

type Dict = Record<string, any>;

export const I18N: Record<string, Dict> = {
  en:{search:"search",ph:"track, city, country, or 'lat, lon'…",list:"list",map:"map",nearMe:"near me — find tracks around you",myLoc:"my current location",recent:"recent",featured:"featured circuits",tracks:"tracks",places:"places",jumpTo:"jump to",searchPlaces:"search tracks & places…",language:"language",reading:"reading the track…",tapBegin:"tap to begin",locating:"locating…",noCond:"couldn't read conditions",noMatch:"no matches — try a track, city, or 'lat, lon'",coords:"coordinates",toSunset:"to sunset",toSunrise:"to sunrise",toPeak:"to peak grip",peakNow:"peak now",peakGrip:"peak grip",conditions:"conditions",dryVsWet:"dry vs wet line",dryLine:"dry line",wetLine:"wet line",trackGrip:"track grip",lapPace:"lap-time pace",comfort:"comfort",temp:"temp",feelsLike:"feels like",humidity:"humidity",cloud:"cloud cover",wind:"wind",gusts:"gusts",precip:"precip",pressure:"pressure",trends:"trends",timeline:"timeline",nowLbl:"now",scrubNow:"now",airDensity:"air density",jetting:"jetting",trackTemp:"track temp",tyrePressure:"tyre pressure",bestWindow:"best window today",dryUntil:"dry until",rainUntil:"rain until",rainFrom:"rain from",dryAllDay:"dry all day",rainAllDay:"wet all day",light:"light",moderate:"moderate",heavy:"heavy",richen:"go richer",lean:"go leaner",baseline:"at baseline",units:"units",
    hintHtml:`click the name for recents · <b id="tlToggle">▣</b> timeline · <b id="graphToggle">📈</b> trends`,
    blurbHtml:`We score <i>track-day potential</i> from grip, air density &amp; <u id="blurbDet">live weather</u>. The clock is physics — the send button is you.`,
    phases:{night:"night",dawn:"dawn",day:"daytime",golden:"golden hour",dusk:"dusk"},
    tags:{send:"send it",grip:"grip city",good:"probably good",ok:"probably ok",patchy:"patchy",tough:"tough day",wet:"wet line",fullwet:"full wet"},
    why:{wet:"rain is killing grip",cold:"cold tyres, low grip",hot:"heat is greasing the track",windy:"strong gusts unsettle the kart",ideal:"cool, dry & calm — ideal",fine:"solid conditions"}},
  es:{search:"buscar",ph:"pista, ciudad, país o 'lat, lon'…",list:"lista",map:"mapa",nearMe:"cerca de mí — pistas cercanas",myLoc:"mi ubicación actual",recent:"recientes",featured:"circuitos destacados",tracks:"pistas",places:"lugares",jumpTo:"ir a",searchPlaces:"buscar pistas y lugares…",language:"idioma",reading:"leyendo la pista…",tapBegin:"toca para empezar",locating:"localizando…",noCond:"no se pudo leer el clima",noMatch:"sin resultados — pista, ciudad o 'lat, lon'",coords:"coordenadas",toSunset:"para el atardecer",toSunrise:"para el amanecer",toPeak:"al mejor agarre",peakNow:"agarre máximo",peakGrip:"mejor agarre",conditions:"condiciones",dryVsWet:"seco vs mojado",dryLine:"en seco",wetLine:"en mojado",trackGrip:"agarre",lapPace:"ritmo de vuelta",comfort:"confort",temp:"temp",feelsLike:"sensación",humidity:"humedad",cloud:"nubosidad",wind:"viento",gusts:"ráfagas",precip:"precip",pressure:"presión",trends:"tendencias",timeline:"cronología",nowLbl:"ahora",scrubNow:"ahora",airDensity:"densidad del aire",jetting:"carburación",trackTemp:"temp. pista",tyrePressure:"presión neumáticos",bestWindow:"mejor franja hoy",dryUntil:"seco hasta",rainUntil:"lluvia hasta",rainFrom:"lluvia desde",dryAllDay:"seco todo el día",rainAllDay:"lluvia todo el día",light:"ligera",moderate:"moderada",heavy:"fuerte",richen:"enriquecer",lean:"empobrecer",baseline:"de referencia",units:"unidades",
    hintHtml:`toca el nombre para recientes · <b id="tlToggle">▣</b> cronología · <b id="graphToggle">📈</b> tendencias`,
    blurbHtml:`Calculamos el <i>potencial de pista</i> según agarre, densidad del aire y <u id="blurbDet">clima en vivo</u>. El reloj es física — el acelerador eres tú.`,
    phases:{night:"noche",dawn:"amanecer",day:"día",golden:"hora dorada",dusk:"anochecer"},
    tags:{send:"a tope",grip:"puro agarre",good:"bastante bien",ok:"aceptable",patchy:"irregular",tough:"día difícil",wet:"en mojado",fullwet:"muy mojado"},
    why:{wet:"la lluvia mata el agarre",cold:"neumáticos fríos, poco agarre",hot:"el calor engrasa la pista",windy:"las ráfagas desestabilizan el kart",ideal:"fresco, seco y en calma — ideal",fine:"buenas condiciones"}},
  fr:{search:"rechercher",ph:"circuit, ville, pays ou 'lat, lon'…",list:"liste",map:"carte",nearMe:"près de moi — circuits proches",myLoc:"ma position actuelle",recent:"récents",featured:"circuits en vedette",tracks:"circuits",places:"lieux",jumpTo:"aller à",searchPlaces:"rechercher circuits et lieux…",language:"langue",reading:"lecture de la piste…",tapBegin:"touchez pour commencer",locating:"localisation…",noCond:"météo indisponible",noMatch:"aucun résultat — circuit, ville ou 'lat, lon'",coords:"coordonnées",toSunset:"avant le coucher",toSunrise:"avant le lever",toPeak:"au meilleur grip",peakNow:"grip max",peakGrip:"meilleur grip",conditions:"conditions",dryVsWet:"sec vs mouillé",dryLine:"sur le sec",wetLine:"sur le mouillé",trackGrip:"adhérence",lapPace:"rythme au tour",comfort:"confort",temp:"temp",feelsLike:"ressenti",humidity:"humidité",cloud:"nébulosité",wind:"vent",gusts:"rafales",precip:"précip",pressure:"pression",trends:"tendances",timeline:"chronologie",nowLbl:"maintenant",scrubNow:"maintenant",airDensity:"densité de l'air",jetting:"gicleur",trackTemp:"temp. piste",tyrePressure:"pression pneus",bestWindow:"meilleur créneau",dryUntil:"sec jusqu'à",rainUntil:"pluie jusqu'à",rainFrom:"pluie dès",dryAllDay:"sec toute la journée",rainAllDay:"pluie toute la journée",light:"légère",moderate:"modérée",heavy:"forte",richen:"enrichir",lean:"appauvrir",baseline:"de référence",units:"unités",
    hintHtml:`touchez le nom pour récents · <b id="tlToggle">▣</b> chronologie · <b id="graphToggle">📈</b> tendances`,
    blurbHtml:`Nous évaluons le <i>potentiel de roulage</i> selon l'adhérence, la densité de l'air et la <u id="blurbDet">météo en direct</u>. L'horloge, c'est la physique — l'accélérateur, c'est vous.`,
    phases:{night:"nuit",dawn:"aube",day:"jour",golden:"heure dorée",dusk:"crépuscule"},
    tags:{send:"fonce",grip:"max d'adhérence",good:"plutôt bien",ok:"correct",patchy:"irrégulier",tough:"journée difficile",wet:"sur le mouillé",fullwet:"très mouillé"},
    why:{wet:"la pluie tue l'adhérence",cold:"pneus froids, peu d'adhérence",hot:"la chaleur graisse la piste",windy:"les rafales déstabilisent le kart",ideal:"frais, sec et calme — idéal",fine:"bonnes conditions"}},
  de:{search:"suchen",ph:"Strecke, Stadt, Land oder 'lat, lon'…",list:"Liste",map:"Karte",nearMe:"in der Nähe — Strecken finden",myLoc:"mein aktueller Standort",recent:"zuletzt",featured:"ausgewählte Strecken",tracks:"Strecken",places:"Orte",jumpTo:"springe zu",searchPlaces:"Strecken & Orte suchen…",language:"Sprache",reading:"lese die Strecke…",tapBegin:"tippen zum Starten",locating:"orte…",noCond:"Wetter nicht verfügbar",noMatch:"keine Treffer — Strecke, Stadt oder 'lat, lon'",coords:"Koordinaten",toSunset:"bis Sonnenuntergang",toSunrise:"bis Sonnenaufgang",toPeak:"bis Bestgrip",peakNow:"Grip-Maximum",peakGrip:"Bestgrip",conditions:"Bedingungen",dryVsWet:"trocken vs nass",dryLine:"trocken",wetLine:"nass",trackGrip:"Grip",lapPace:"Rundentempo",comfort:"Komfort",temp:"Temp",feelsLike:"gefühlt",humidity:"Feuchte",cloud:"Bewölkung",wind:"Wind",gusts:"Böen",precip:"Niederschlag",pressure:"Druck",trends:"Trends",timeline:"Zeitleiste",nowLbl:"jetzt",scrubNow:"jetzt",airDensity:"Luftdichte",jetting:"Bedüsung",trackTemp:"Streckentemp.",tyrePressure:"Reifendruck",bestWindow:"bestes Zeitfenster",dryUntil:"trocken bis",rainUntil:"Regen bis",rainFrom:"Regen ab",dryAllDay:"ganztags trocken",rainAllDay:"ganztags nass",light:"leicht",moderate:"mäßig",heavy:"stark",richen:"fetter",lean:"magerer",baseline:"Referenz",units:"Einheiten",
    hintHtml:`Name antippen für Verlauf · <b id="tlToggle">▣</b> Zeitleiste · <b id="graphToggle">📈</b> Trends`,
    blurbHtml:`Wir bewerten das <i>Strecken-Potenzial</i> aus Grip, Luftdichte und <u id="blurbDet">Live-Wetter</u>. Die Uhr ist Physik — das Gaspedal bist du.`,
    phases:{night:"Nacht",dawn:"Dämmerung",day:"Tag",golden:"goldene Stunde",dusk:"Abenddämmerung"},
    tags:{send:"voll drauf",grip:"Grip pur",good:"ziemlich gut",ok:"okay",patchy:"durchwachsen",tough:"harter Tag",wet:"nass",fullwet:"sehr nass"},
    why:{wet:"Regen killt den Grip",cold:"kalte Reifen, wenig Grip",hot:"Hitze schmiert die Strecke",windy:"starke Böen stören das Kart",ideal:"kühl, trocken & ruhig — ideal",fine:"solide Bedingungen"}},
  it:{search:"cerca",ph:"pista, città, paese o 'lat, lon'…",list:"elenco",map:"mappa",nearMe:"vicino a me — piste vicine",myLoc:"la mia posizione attuale",recent:"recenti",featured:"circuiti in evidenza",tracks:"piste",places:"luoghi",jumpTo:"vai a",searchPlaces:"cerca piste e luoghi…",language:"lingua",reading:"lettura della pista…",tapBegin:"tocca per iniziare",locating:"localizzazione…",noCond:"meteo non disponibile",noMatch:"nessun risultato — pista, città o 'lat, lon'",coords:"coordinate",toSunset:"al tramonto",toSunrise:"all'alba",toPeak:"al massimo grip",peakNow:"grip massimo",peakGrip:"massimo grip",conditions:"condizioni",dryVsWet:"asciutto vs bagnato",dryLine:"su asciutto",wetLine:"su bagnato",trackGrip:"aderenza",lapPace:"passo gara",comfort:"comfort",temp:"temp",feelsLike:"percepita",humidity:"umidità",cloud:"nuvolosità",wind:"vento",gusts:"raffiche",precip:"precip",pressure:"pressione",trends:"andamento",timeline:"cronologia",nowLbl:"ora",scrubNow:"ora",airDensity:"densità aria",jetting:"carburazione",trackTemp:"temp. pista",tyrePressure:"pressione gomme",bestWindow:"miglior fascia oggi",dryUntil:"asciutto fino",rainUntil:"pioggia fino",rainFrom:"pioggia da",dryAllDay:"asciutto tutto il giorno",rainAllDay:"bagnato tutto il giorno",light:"leggera",moderate:"moderata",heavy:"forte",richen:"arricchire",lean:"smagrire",baseline:"di riferimento",units:"unità",
    hintHtml:`tocca il nome per i recenti · <b id="tlToggle">▣</b> cronologia · <b id="graphToggle">📈</b> andamento`,
    blurbHtml:`Valutiamo il <i>potenziale in pista</i> da aderenza, densità dell'aria e <u id="blurbDet">meteo in tempo reale</u>. L'orologio è fisica — l'acceleratore sei tu.`,
    phases:{night:"notte",dawn:"alba",day:"giorno",golden:"ora dorata",dusk:"tramonto"},
    tags:{send:"spingi",grip:"grip pieno",good:"abbastanza bene",ok:"discreto",patchy:"incostante",tough:"giornata dura",wet:"su bagnato",fullwet:"molto bagnato"},
    why:{wet:"la pioggia uccide l'aderenza",cold:"gomme fredde, poca aderenza",hot:"il caldo ingrassa la pista",windy:"le raffiche destabilizzano il kart",ideal:"fresco, asciutto e calmo — ideale",fine:"buone condizioni"}},
  pt:{search:"buscar",ph:"pista, cidade, país ou 'lat, lon'…",list:"lista",map:"mapa",nearMe:"perto de mim — pistas próximas",myLoc:"minha localização atual",recent:"recentes",featured:"circuitos em destaque",tracks:"pistas",places:"lugares",jumpTo:"ir para",searchPlaces:"buscar pistas e lugares…",language:"idioma",reading:"lendo a pista…",tapBegin:"toque para começar",locating:"localizando…",noCond:"clima indisponível",noMatch:"sem resultados — pista, cidade ou 'lat, lon'",coords:"coordenadas",toSunset:"até o pôr do sol",toSunrise:"até o nascer do sol",toPeak:"até o pico de aderência",peakNow:"pico agora",peakGrip:"pico de aderência",conditions:"condições",dryVsWet:"seco vs molhado",dryLine:"no seco",wetLine:"no molhado",trackGrip:"aderência",lapPace:"ritmo de volta",comfort:"conforto",temp:"temp",feelsLike:"sensação",humidity:"umidade",cloud:"nebulosidade",wind:"vento",gusts:"rajadas",precip:"precip",pressure:"pressão",trends:"tendências",timeline:"linha do tempo",nowLbl:"agora",scrubNow:"agora",airDensity:"densidade do ar",jetting:"carburação",trackTemp:"temp. pista",tyrePressure:"pressão pneus",bestWindow:"melhor janela hoje",dryUntil:"seco até",rainUntil:"chuva até",rainFrom:"chuva a partir",dryAllDay:"seco o dia todo",rainAllDay:"molhado o dia todo",light:"leve",moderate:"moderada",heavy:"forte",richen:"enriquecer",lean:"empobrecer",baseline:"de referência",units:"unidades",
    hintHtml:`toque no nome para recentes · <b id="tlToggle">▣</b> linha do tempo · <b id="graphToggle">📈</b> tendências`,
    blurbHtml:`Avaliamos o <i>potencial de pista</i> por aderência, densidade do ar e <u id="blurbDet">clima ao vivo</u>. O relógio é física — o acelerador é você.`,
    phases:{night:"noite",dawn:"amanhecer",day:"dia",golden:"hora dourada",dusk:"anoitecer"},
    tags:{send:"manda ver",grip:"pura aderência",good:"bem bom",ok:"razoável",patchy:"irregular",tough:"dia difícil",wet:"no molhado",fullwet:"muito molhado"},
    why:{wet:"a chuva mata a aderência",cold:"pneus frios, pouca aderência",hot:"o calor engordura a pista",windy:"rajadas desestabilizam o kart",ideal:"fresco, seco e calmo — ideal",fine:"boas condições"}},
  ja:{search:"検索",ph:"コース・都市・国 または 'lat, lon'…",list:"リスト",map:"地図",nearMe:"近くのコースを探す",myLoc:"現在地",recent:"最近",featured:"注目のサーキット",tracks:"コース",places:"場所",jumpTo:"移動",searchPlaces:"コースや場所を検索…",language:"言語",reading:"コースを読み込み中…",tapBegin:"タップして開始",locating:"位置を取得中…",noCond:"天気を取得できません",noMatch:"該当なし — コース・都市・'lat, lon'",coords:"座標",toSunset:"日没まで",toSunrise:"日の出まで",toPeak:"ベストグリップまで",peakNow:"今がピーク",peakGrip:"ベストグリップ",conditions:"コンディション",dryVsWet:"ドライ vs ウェット",dryLine:"ドライ",wetLine:"ウェット",trackGrip:"グリップ",lapPace:"ラップペース",comfort:"快適さ",temp:"気温",feelsLike:"体感",humidity:"湿度",cloud:"雲量",wind:"風",gusts:"突風",precip:"降水",pressure:"気圧",trends:"推移",timeline:"タイムライン",nowLbl:"現在",scrubNow:"現在",airDensity:"空気密度",jetting:"ジェッティング",trackTemp:"路面温度",tyrePressure:"タイヤ空気圧",bestWindow:"本日のベスト時間帯",dryUntil:"乾燥は",rainUntil:"雨は",rainFrom:"雨は",dryAllDay:"終日ドライ",rainAllDay:"終日ウェット",light:"弱い",moderate:"中程度",heavy:"強い",richen:"濃く",lean:"薄く",baseline:"基準",units:"単位",
    hintHtml:`名前をタップで履歴 · <b id="tlToggle">▣</b> タイムライン · <b id="graphToggle">📈</b> 推移`,
    blurbHtml:`<i>走行コンディション</i>をグリップ・空気密度・<u id="blurbDet">リアルタイムの天気</u>から採点。時計は物理 — アクセルはあなた。`,
    phases:{night:"夜",dawn:"夜明け",day:"昼",golden:"ゴールデンアワー",dusk:"夕暮れ"},
    tags:{send:"全開",grip:"グリップ良好",good:"なかなか良い",ok:"まずまず",patchy:"ムラあり",tough:"厳しい日",wet:"ウェット",fullwet:"豪雨"},
    why:{wet:"雨でグリップ低下",cold:"タイヤが冷えてグリップ不足",hot:"高温で路面が滑る",windy:"強い突風で車体が不安定",ideal:"涼しく乾いて穏やか — 理想的",fine:"良好なコンディション"}},
  zh:{search:"搜索",ph:"赛道、城市、国家 或 'lat, lon'…",list:"列表",map:"地图",nearMe:"附近 — 查找赛道",myLoc:"我的当前位置",recent:"最近",featured:"精选赛道",tracks:"赛道",places:"地点",jumpTo:"跳转",searchPlaces:"搜索赛道和地点…",language:"语言",reading:"正在读取赛道…",tapBegin:"点按开始",locating:"定位中…",noCond:"无法获取天气",noMatch:"无结果 — 试试赛道、城市或 'lat, lon'",coords:"坐标",toSunset:"距日落",toSunrise:"距日出",toPeak:"距最佳抓地",peakNow:"当前最佳",peakGrip:"最佳抓地",conditions:"状况",dryVsWet:"干 vs 湿",dryLine:"干地",wetLine:"湿地",trackGrip:"抓地力",lapPace:"单圈节奏",comfort:"舒适度",temp:"气温",feelsLike:"体感",humidity:"湿度",cloud:"云量",wind:"风速",gusts:"阵风",precip:"降水",pressure:"气压",trends:"趋势",timeline:"时间线",nowLbl:"现在",scrubNow:"现在",airDensity:"空气密度",jetting:"喷油针/主嘴",trackTemp:"赛道温度",tyrePressure:"胎压",bestWindow:"今日最佳时段",dryUntil:"干燥至",rainUntil:"降雨至",rainFrom:"降雨始于",dryAllDay:"全天干燥",rainAllDay:"全天有雨",light:"小",moderate:"中",heavy:"大",richen:"加浓",lean:"减稀",baseline:"基准",units:"单位",
    hintHtml:`点名称看最近 · <b id="tlToggle">▣</b> 时间线 · <b id="graphToggle">📈</b> 趋势`,
    blurbHtml:`我们根据抓地力、空气密度和<u id="blurbDet">实时天气</u>评估<i>赛道状态</i>。时钟是物理 — 油门是你。`,
    phases:{night:"夜晚",dawn:"黎明",day:"白天",golden:"黄金时刻",dusk:"黄昏"},
    tags:{send:"全力冲",grip:"抓地拉满",good:"相当不错",ok:"尚可",patchy:"不稳定",tough:"艰难的一天",wet:"湿地",fullwet:"大雨"},
    why:{wet:"降雨严重削弱抓地",cold:"轮胎偏冷、抓地不足",hot:"高温让赛道发滑",windy:"强阵风让卡丁车不稳",ideal:"凉爽干燥无风 — 理想",fine:"状况良好"}},
};

export const HINT_RECENTS: Record<string, string> = {
  en: "click the name for recents", es: "toca el nombre para recientes", fr: "touchez le nom pour récents",
  de: "Name antippen für Verlauf", it: "tocca il nome per i recenti", pt: "toque no nome para recentes",
  ja: "名前をタップで履歴", zh: "点名称看最近",
};

export const LANGS: [string, string][] = [
  ["en", "English"], ["es", "Español"], ["fr", "Français"], ["de", "Deutsch"],
  ["it", "Italiano"], ["pt", "Português"], ["ja", "日本語"], ["zh", "中文"],
];

export function pickLang(code: string): string {
  const c = (code || "en").slice(0, 2).toLowerCase();
  return I18N[c] ? c : "en";
}

export const lang = writable<string>(localStorage.getItem("gc_lang") || pickLang(navigator.language));
lang.subscribe((l) => { try { localStorage.setItem("gc_lang", l); } catch {} document.documentElement.lang = l; });

export function setLang(l: string) { lang.set(l); }

function translate(l: string, k: string): string {
  return (I18N[l] && I18N[l][k]) ?? I18N.en[k] ?? k;
}
function translateGroup(l: string, g: string, k: string): string {
  return (I18N[l]?.[g]?.[k]) ?? I18N.en[g]?.[k] ?? k;
}

/** reactive translate fns — use as $t('key') / $tg('tags','send') in components */
export const t = derived(lang, ($l) => (k: string) => translate($l, k));
export const tg = derived(lang, ($l) => (g: string, k: string) => translateGroup($l, g, k));

/** non-reactive lookups for use inside plain functions */
export const tNow = (k: string) => translate(get(lang), k);
export const tgNow = (g: string, k: string) => translateGroup(get(lang), g, k);
