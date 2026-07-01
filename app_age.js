const DATA = window.PM25_DATA;
const WORLD = window.WORLD_GEOJSON;
const BOUNDARY_INDEX = window.BOUNDARY_INDEX || { adm1: {}, adm2: {} };

const els = {
  language: document.querySelector("#language"),
  ageGroup: document.querySelector("#ageGroup"),
  dataYear: document.querySelector("#dataYear"),
  countryPicker: document.querySelector("#countryPicker"),
  cityPicker: document.querySelector("#cityPicker"),
  buttons: [...document.querySelectorAll(".mode-button")],
  modeTitle: document.querySelector("#modeTitle"),
  modeSubtitle: document.querySelector("#modeSubtitle"),
  selectionType: document.querySelector("#selectionType"),
  selectionName: document.querySelector("#selectionName"),
  currentDeaths: document.querySelector("#currentDeaths"),
  avoidableDeaths: document.querySelector("#avoidableDeaths"),
  avoidableShare: document.querySelector("#avoidableShare"),
  detailLevel: document.querySelector("#detailLevel"),
  detailLocation: document.querySelector("#detailLocation"),
  ageBreakdown: document.querySelector("#ageBreakdown"),
  backToWorld: document.querySelector("#backToWorld"),
};

const text = {
  zh: {
    eyebrow: "PM2.5 死亡负担探索器",
    title: "2020 年 PM2.5 过早死亡与 WHO 5 µg/m³ 可避免负担地图",
    language: "语言",
    ageGroup: "年龄段",
    dataYear: "数据年份",
    countryPicker: "选择国家",
    cityPicker: "选择城市",
    countryPickerPlaceholder: "选择一个国家",
    cityPickerPlaceholder: "可选：选择一个城市",
    notMapped: "未匹配地图边界",
    countryMode: "国家地图",
    cityMode: "城市点图",
    legend: "可减少比例",
    currentDeaths: "目前 PM2.5 导致的过早死亡",
    avoidableDeaths: "达到 WHO 5 µg/m³ 后可避免的过早死亡",
    avoidableShare: "可避免过早死亡比例",
    level: "数据层级",
    location: "位置 / 展示城市",
    ageBreakdown: "年龄段明细",
    backToWorld: "返回国家地图",
    countryTitle: "国家层面",
    countrySubtitle: "点击国家区域查看详情；颜色按当前选择年龄段的 WHO 5 可减少比例显示",
    cityTitle: "城市点图",
    citySubtitle: "选中国家后叠加 geoBoundaries ADM1/ADM2 边界；点击城市点后切换为城市数据",
    selectCountry: "请选择一个国家",
    selectCity: "请选择一个城市",
    clickCountry: "点击国家查看详情",
    chooseCountryFirst: "请先在国家地图点击一个国家",
    selectedCountry: "国家",
    selectedCountrySummary: "国家汇总",
    selectedRegion: "地区",
    selectedRegionSummary: "地区汇总",
    selectedCity: "城市",
    citiesInCountry: "本数据集覆盖城市数",
    noCities: "该国家暂无城市点数据",
    cityLayer: "City",
    countryLayer: "Country",
    avoidable: "可减少",
    share: "比例",
    current: "PM2.5 过早死亡",
    age: "年龄",
    total25: "总计 25+",
    noSelection: "选择国家或城市后显示",
    noData: "无数据",
    noModeledData: "源数据中没有单独建模结果",
    noMapBoundary: "该条目有模型结果，但当前地图边界文件中没有匹配边界；右侧仍显示数据。",
    methodEyebrow: "方法",
    methodTitle: "数据与健康模型",
    methodBody:
      "当前演示使用项目中处理好的 GHAP 2020 PM2.5 暴露数据，并结合人口和基线死亡率数据估计细颗粒物导致的过早死亡。健康影响估计使用 GEMM 模型。当前网页展示的是 2020 数据。",
    mapEyebrow: "地图说明",
    mapTitle: "边界与覆盖说明",
    mapBody:
      "国家地图使用 Natural Earth 1:10m admin_0_countries 边界。选中国家后，会加载 geoBoundaries CGAZ ADM1 和 ADM2 边界，用于展示省/州以及市/县级边界背景。CARTO/OpenStreetMap 仍只作为视觉底图。城市数量仍指数据集中的城市点记录数，不代表严格行政区面积汇总。",
    teamEyebrow: "团队",
    teamTitle: "技术团队与主要贡献者",
    teamBody: "Qianru Zhang",
    teamDrew: "Drew Shindell",
    teamYifei: "颜翼飞",
    teamQianru: "张倩茹",
  },
  en: {
    eyebrow: "PM2.5 mortality explorer",
    title: "2020 PM2.5 premature mortality and avoidable burden under WHO 5 µg/m³",
    language: "Language",
    ageGroup: "Age",
    dataYear: "Data year",
    countryPicker: "Country",
    cityPicker: "City",
    countryPickerPlaceholder: "Select a country",
    cityPickerPlaceholder: "Optional: select a city",
    notMapped: "not matched to map boundary",
    countryMode: "Country map",
    cityMode: "City points",
    legend: "Avoidable share",
    currentDeaths: "Premature deaths attributable to PM2.5",
    avoidableDeaths: "Premature deaths avoidable at WHO 5 µg/m³",
    avoidableShare: "Avoidable premature-death share",
    level: "Data level",
    location: "Location / displayed cities",
    ageBreakdown: "Age breakdown",
    backToWorld: "Back to country map",
    countryTitle: "Country level",
    countrySubtitle: "Click a country for details; colors use the selected age group's avoidable share",
    cityTitle: "City points",
    citySubtitle: "Selected countries show geoBoundaries ADM1/ADM2 outlines; click a city point to switch to city data",
    selectCountry: "Select a country",
    selectCity: "Select a city",
    clickCountry: "Click a country to view details",
    chooseCountryFirst: "Click a country first",
    selectedCountry: "Country",
    selectedCountrySummary: "Country summary",
    selectedRegion: "Region",
    selectedRegionSummary: "Region summary",
    selectedCity: "City",
    citiesInCountry: "Cities covered in this dataset",
    noCities: "No city point data for this country",
    cityLayer: "City",
    countryLayer: "Country",
    avoidable: "Avoidable",
    share: "Share",
    current: "PM2.5 deaths",
    age: "Age",
    total25: "Total 25+",
    noSelection: "Shown after selecting a country or city",
    noData: "No data",
    noModeledData: "No separate modeled result in source data",
    noMapBoundary:
      "This entry has modeled results, but no matching boundary in the current map file; the panel still shows the data.",
    methodEyebrow: "Methods",
    methodTitle: "Data and health model",
    methodBody:
      "This demo currently uses the processed GHAP 2020 PM2.5 exposure data in this project, paired with population and baseline mortality data, to estimate premature mortality attributable to fine particulate matter. Health impacts are estimated with the GEMM model. The current page displays 2020 data.",
    mapEyebrow: "Map note",
    mapTitle: "Boundary and coverage notes",
    mapBody:
      "The country map uses Natural Earth 1:10m admin_0_countries boundaries. When a country is selected, geoBoundaries CGAZ ADM1 and ADM2 outlines are loaded for province/state and city/county context. CARTO/OpenStreetMap tiles remain only as the visual basemap. City counts still refer to point records in the dataset, not strict administrative-area totals.",
    teamEyebrow: "Team",
    teamTitle: "Technical team and contributors",
    teamBody: "Qianru Zhang",
    teamDrew: "Drew Shindell",
    teamYifei: "Yifei Yan",
    teamQianru: "Qianru Zhang",
  },
};

const countryAliases = {
  "United States of America": "United Sts.of America",
  USA: "United Sts.of America",
  Russia: "Russian Fed.",
  Tanzania: "United Rep.of Tanzania",
  "United Republic of Tanzania": "United Rep.of Tanzania",
  Venezuela: "Boliv.Rep.of Venezuela",
  "Bosnia and Herz.": "Bosnia+Herzegovina",
  "Bosnia and Herzegovina": "Bosnia+Herzegovina",
  Brunei: "Brunei Darussalam",
  "Central African Rep.": "Central African Rep.",
  "Central African Republic": "Central African Rep.",
  "Dem. Rep. Congo": "Dem.Rep.of the Congo",
  "Democratic Republic of the Congo": "Dem.Rep.of the Congo",
  Congo: "Congo",
  "Republic of the Congo": "Congo",
  "Côte d'Ivoire": "Cote dIvoire",
  "Ivory Coast": "Cote dIvoire",
  "North Korea": "Dem.Peo.Rep.of Korea",
  "South Korea": "Rep.of Korea",
  Iran: "Isl.Rep.of Iran",
  Laos: "Lao Peo.Dem.Rep.",
  Libya: "Libyan Arab Jamahiriya",
  Macedonia: "Fmr.Yugoslav Rep.of Macedonia",
  "North Macedonia": "Fmr.Yugoslav Rep.of Macedonia",
  Moldova: "Rep.of Moldova",
  Morocco: "Morocco+W.Sahara",
  Serbia: "Serbia+Montenegro",
  "Republic of Serbia": "Serbia+Montenegro",
  Montenegro: "Serbia+Montenegro",
  eSwatini: "Swaziland",
  Czechia: "Czech Republic",
  Syria: "Syrian Arab Rep.",
  Vietnam: "Viet Nam",
  Bahamas: "Bahamas",
  "The Bahamas": "Bahamas",
  "Trinidad and Tobago": "Trinidad+Tobago",
  "Timor-Leste": "Timor-Leste",
  "East Timor": "Timor-Leste",
  "Guinea-Bissau": "Guinea-Bissau",
  "Guinea Bissau": "Guinea-Bissau",
  "Antigua and Barbuda": "Antigua+Barbuda",
  "Cabo Verde": "Cape Verde",
  "Federated States of Micronesia": "Fed.Sts.of Micronesia",
  "São Tomé and Principe": "Sao Tome+Principe",
  "São Tomé and Príncipe": "Sao Tome+Principe",
  "Saint Kitts and Nevis": "St.Kitts+Nevis",
  "Saint Lucia": "St.Lucia",
  "Saint Vincent and the Grenadines": "St.Vincent+Grenadines",
};

const countryIso3Aliases = {
  STP: "Sao Tome+Principe",
};

const countryToCityAliases = {
  "China Taiwan": "Taiwan",
  "United Sts.of America": "United States of America",
  "Russian Fed.": "Russia",
  "Rep.of Korea": "South Korea",
  "Dem.Peo.Rep.of Korea": "North Korea",
  "Isl.Rep.of Iran": "Iran",
  "Lao Peo.Dem.Rep.": "Laos",
  "Libyan Arab Jamahiriya": "Libya",
  "Syrian Arab Rep.": "Syria",
  "United Rep.of Tanzania": "Tanzania",
  "Viet Nam": "Vietnam",
  "Boliv.Rep.of Venezuela": "Venezuela",
  "Bosnia+Herzegovina": "Bosnia and Herzegovina",
  "Central African Rep.": "Central African Republic",
  Congo: "Congo (Brazzaville)",
  "Dem.Rep.of the Congo": "Congo (Kinshasa)",
  "Cote dIvoire": "Ivory Coast",
  "Rep.of Moldova": "Moldova",
  "Morocco+W.Sahara": "Morocco",
  "Serbia+Montenegro": "Serbia",
};

const countryDisplayEn = {
  "United Sts.of America": "United States of America",
  "Russian Fed.": "Russia",
  "Boliv.Rep.of Venezuela": "Venezuela",
  "Bosnia+Herzegovina": "Bosnia and Herzegovina",
  "Brunei Darussalam": "Brunei",
  "Central African Rep.": "Central African Republic",
  "Dem.Peo.Rep.of Korea": "North Korea",
  "Dem.Rep.of the Congo": "Democratic Republic of the Congo",
  "Cote dIvoire": "Côte d'Ivoire",
  "Isl.Rep.of Iran": "Iran",
  "Lao Peo.Dem.Rep.": "Laos",
  "Libyan Arab Jamahiriya": "Libya",
  "Fmr.Yugoslav Rep.of Macedonia": "North Macedonia",
  "Rep.of Korea": "South Korea",
  "Rep.of Moldova": "Moldova",
  "Syrian Arab Rep.": "Syria",
  "United Rep.of Tanzania": "Tanzania",
  "United Kingdom": "United Kingdom",
  "Viet Nam": "Vietnam",
  "Morocco+W.Sahara": "Morocco and Western Sahara",
  "Serbia+Montenegro": "Serbia and Montenegro",
  "Antigua+Barbuda": "Antigua and Barbuda",
  "Fed.Sts.of Micronesia": "Federated States of Micronesia",
  "Sao Tome+Principe": "São Tomé and Principe",
  "St.Kitts+Nevis": "Saint Kitts and Nevis",
  "St.Lucia": "Saint Lucia",
  "St.Vincent+Grenadines": "Saint Vincent and the Grenadines",
};

const countryDisplayZh = {
  "China Taiwan": "中国台湾",
  "Hong Kong": "中国香港",
  "Hong Kong S.A.R.": "中国香港",
  Macau: "中国澳门",
  Macao: "中国澳门",
  "Macau S.A.R": "中国澳门",
  "Macao S.A.R.": "中国澳门",
  "United Sts.of America": "美国",
  "Russian Fed.": "俄罗斯",
  "Boliv.Rep.of Venezuela": "委内瑞拉",
  "Bosnia+Herzegovina": "波斯尼亚和黑塞哥维那",
  "Brunei Darussalam": "文莱",
  "Central African Rep.": "中非共和国",
  "Dem.Peo.Rep.of Korea": "朝鲜",
  "Dem.Rep.of the Congo": "刚果民主共和国",
  Congo: "刚果共和国",
  "Cote dIvoire": "科特迪瓦",
  "Isl.Rep.of Iran": "伊朗",
  "Lao Peo.Dem.Rep.": "老挝",
  "Libyan Arab Jamahiriya": "利比亚",
  "Fmr.Yugoslav Rep.of Macedonia": "北马其顿",
  "Rep.of Korea": "韩国",
  "Rep.of Moldova": "摩尔多瓦",
  "Syrian Arab Rep.": "叙利亚",
  "United Rep.of Tanzania": "坦桑尼亚",
  "United Kingdom": "英国",
  "Viet Nam": "越南",
  "Morocco+W.Sahara": "摩洛哥和西撒哈拉",
  "Serbia+Montenegro": "塞尔维亚和黑山",
  Swaziland: "斯威士兰",
};

const cityDisplayZh = {
  "Hong Kong": "香港", Macau: "澳门", Macao: "澳门",
  Zhongli: "中坜", Hsinchu: "新竹", "New Taipei": "新北", Tainan: "台南", Taichung: "台中", Kaohsiung: "高雄", Taipei: "台北",
  Beijing: "北京", Shanghai: "上海", Tianjin: "天津", Chongqing: "重庆", Guangzhou: "广州", Shenzhen: "深圳", Dongguan: "东莞",
  Wuhan: "武汉", Chengdu: "成都", Nanjing: "南京", Hangzhou: "杭州", Xian: "西安", Zhengzhou: "郑州", Changsha: "长沙",
  Shenyeng: "沈阳", Shenyang: "沈阳", Jinan: "济南", Qingdao: "青岛", Dalian: "大连", Harbin: "哈尔滨", Changchun: "长春",
  Shijianzhuang: "石家庄", Shijiazhuang: "石家庄", Taiyuan: "太原", Hohhot: "呼和浩特", Baotou: "包头", Chifeng: "赤峰",
  Urumqi: "乌鲁木齐", Lanzhou: "兰州", Xining: "西宁", Yinchuan: "银川", Nanning: "南宁", Guiyang: "贵阳", Kunming: "昆明",
  Nanchang: "南昌", Fuzhou: "福州", Xiamen: "厦门", Quanzhou: "泉州", Wenzhou: "温州", Ningbo: "宁波", Suzhou: "苏州",
  Wuxi: "无锡", Xuzhou: "徐州", Changzhou: "常州", Zhenjiang: "镇江", Nantong: "南通", Yancheng: "盐城", Huaiyin: "淮阴",
  Jilin: "吉林", Tongliao: "通辽", Qiqihar: "齐齐哈尔", Daqing: "大庆", Jiamusi: "佳木斯", Jixi: "鸡西", Hegang: "鹤岗",
  Mudangiang: "牡丹江", Mudanjiang: "牡丹江", Anshan: "鞍山", Fushun: "抚顺", Benxi: "本溪", Fuxin: "阜新", Jinzhou: "锦州",
  Dandong: "丹东", Liaoyang: "辽阳", Yingkow: "营口", Yingkou: "营口", Linyi: "临沂", Weifang: "潍坊", Zibo: "淄博",
  Yantai: "烟台", Zaozhuang: "枣庄", Jining: "济宁", Taian: "泰安", Heze: "菏泽", Anyang: "安阳", Jiaozuo: "焦作",
  Kaifeng: "开封", Luoyang: "洛阳", Shangqiu: "商丘", Pingdingshan: "平顶山", Xinyang: "信阳", Xinxiang: "新乡", Puyang: "濮阳",
  Nanyang: "南阳", Baoding: "保定", Tangshan: "唐山", Handan: "邯郸", Cangzhou: "沧州", Langfang: "廊坊", Zhangjiakou: "张家口",
  Qinhuangdao: "秦皇岛", Datong: "大同", Linfen: "临汾", Yuci: "榆次", Yangquan: "阳泉", Changzhi: "长治", Jincheng: "晋城",
  Hefei: "合肥", Wuhu: "芜湖", Bengbu: "蚌埠", Huaibei: "淮北", Huainan: "淮南", Luan: "六安", Xuanzhou: "宣州",
  Jiujiang: "九江", Ganzhou: "赣州", Xinyu: "新余", Pingxiang: "萍乡", Jiaxing: "嘉兴", Huzhou: "湖州", Shaoxing: "绍兴",
  Jinhua: "金华", Foshan: "佛山", Zhuhai: "珠海", Jiangmen: "江门", Zhanjiang: "湛江", Shantou: "汕头", Shaoguan: "韶关",
  Beihai: "北海", Liuzhou: "柳州", Guilin: "桂林", Maoming: "茂名", Yangjiang: "阳江", Qingyuan: "清远", Haikou: "海口",
  Baoji: "宝鸡", Xianyang: "咸阳", Ankang: "安康", Tianshui: "天水", Yulin: "榆林", Yichang: "宜昌", Xiangfan: "襄樊",
  Xiangtan: "湘潭", Zhuzhou: "株洲", Yueyang: "岳阳", Hengyang: "衡阳", Changde: "常德", Yiyang: "益阳", Yongzhou: "永州",
  Leshan: "乐山", Luzhou: "泸州", Yibin: "宜宾", Mianyang: "绵阳", Nanchong: "南充", Neijiang: "内江", Suining: "遂宁",
  Zigong: "自贡", Wanxian: "万县", Anshun: "安顺", Zunyi: "遵义", Lupanshui: "六盘水", Liupanshui: "六盘水", Xingyi: "兴义",
  Baoshan: "保山", Shihezi: "石河子", Kashi: "喀什", Shiyan: "十堰", Shashi: "沙市", Zhucheng: "诸城", Xinyi: "新沂",
  Yangzhou: "扬州", Hechi: "河池", Zhangzhou: "漳州", Maanshan: "马鞍山", Rizhao: "日照", Shangrao: "上饶", Taizhou: "台州",
  Shuyang: "沭阳", Lianyungang: "连云港", Zhanyi: "沾益", Jianmen: "江门", Xiantao: "仙桃", Huangshi: "黄石", Lingyuan: "凌源",
  Yichun: "伊春", Fuyang: "阜阳", Jinxi: "锦西", Yangzhou: "扬州",
  London: "伦敦", Paris: "巴黎", Tokyo: "东京", Osaka: "大阪", Seoul: "首尔", Kabul: "喀布尔", "New York": "纽约",
  "Los Angeles": "洛杉矶", Chicago: "芝加哥", Toronto: "多伦多", Sydney: "悉尼", Melbourne: "墨尔本", Moscow: "莫斯科",
  Istanbul: "伊斯坦布尔", Cairo: "开罗", Delhi: "德里", Mumbai: "孟买", Bangkok: "曼谷", Singapore: "新加坡",
};

let language = "en";
let mode = "country";
let selectedAge = "post25";
let selectedYear = "2020";
let selectedCountry = null;
let selectedCity = null;
let countryLayer = null;
let cityLayer = null;
let admin1Layer = null;
let admin2Layer = null;
let syncingPickers = false;
let countryLayersByKey = new Map();
let boundaryRequestId = 0;

const countriesByName = new Map(DATA.countries.map((d) => [d.country, d]));
const citiesByCountry = DATA.cities.reduce((acc, city) => {
  if (!city.country || city.lat == null || city.lng == null) return acc;
  if (!acc.has(city.country)) acc.set(city.country, []);
  acc.get(city.country).push(city);
  return acc;
}, new Map());
const countryIso2ByName = DATA.cities.reduce((acc, city) => {
  if (city.country && city.iso2 && !acc.has(city.country)) acc.set(city.country, city.iso2);
  return acc;
}, new Map());
const countryIso3ByName = DATA.cities.reduce((acc, city) => {
  if (city.country && city.iso3 && !acc.has(city.country)) acc.set(city.country, city.iso3);
  return acc;
}, new Map());
Object.entries(countryToCityAliases).forEach(([countryName, cityCountryName]) => {
  const iso2 = countryIso2ByName.get(cityCountryName);
  if (iso2 && !countryIso2ByName.has(countryName)) countryIso2ByName.set(countryName, iso2);
  const iso3 = countryIso3ByName.get(cityCountryName);
  if (iso3 && !countryIso3ByName.has(countryName)) countryIso3ByName.set(countryName, iso3);
});
WORLD.features.forEach((feature) => {
  const geoName = geoCountryName(feature);
  const iso2 = feature.properties.ISO_A2_EH || feature.properties.ISO_A2 || feature.properties.WB_A2;
  const iso3 = feature.properties.ISO_A3_EH || feature.properties.ISO_A3 || feature.properties.ADM0_A3 || feature.properties.WB_A3;
  const dataName = countriesByName.has(geoName) ? geoName : countryAliases[geoName] || countryIso3Aliases[iso3];
  if (dataName && iso2 && iso2 !== "-99" && !countryIso2ByName.has(dataName)) {
    countryIso2ByName.set(dataName, iso2);
  }
  if (dataName && iso3 && iso3 !== "-99" && !countryIso3ByName.has(dataName)) {
    countryIso3ByName.set(dataName, iso3);
  }
  if (geoName === "Taiwan" && iso2 && iso2 !== "-99") countryIso2ByName.set("China Taiwan", iso2);
  if (geoName === "Taiwan") countryIso3ByName.set("China Taiwan", "TWN");
});
const taiwanRegion = buildRegionFromCities("China Taiwan", "Taiwan");
const selectableCountries = [...DATA.countries, taiwanRegion].sort((a, b) =>
  a.country.localeCompare(b.country)
);

const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const pct = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 });
const regionNamesZh =
  typeof Intl.DisplayNames === "function" ? new Intl.DisplayNames(["zh-CN"], { type: "region" }) : null;

const map = L.map("map", {
  zoomControl: true,
  minZoom: 2,
  maxZoom: 10,
  worldCopyJump: true,
}).setView([22, 12], 2);

map.createPane("admin2Pane");
map.getPane("admin2Pane").style.zIndex = 420;
map.getPane("admin2Pane").style.pointerEvents = "none";
map.createPane("admin1Pane");
map.getPane("admin1Pane").style.zIndex = 430;
map.getPane("admin1Pane").style.pointerEvents = "none";
map.createPane("cityPane");
map.getPane("cityPane").style.zIndex = 450;

L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
  maxZoom: 10,
  attribution: "&copy; OpenStreetMap &copy; CARTO",
}).addTo(map);

function t(key) {
  return text[language][key];
}

function countryKey(country) {
  return country ? country.country : "";
}

function cityKey(city) {
  return city ? `${city.country}||${city.city_id || city.city_ascii || city.city}` : "";
}

function buildRegionFromCities(regionName, sourceCountry) {
  const cities = citiesByCountry.get(sourceCountry) || [];
  const ages = {};
  (DATA.ageGroups || []).forEach((age) => {
    const totals = cities.reduce(
      (acc, city) => {
        const values = city.ages && city.ages[age.key] ? city.ages[age.key] : {};
        acc.currentDeaths += values.currentDeaths || 0;
        acc.avoidableDeaths += values.avoidableDeaths || 0;
        return acc;
      },
      { currentDeaths: 0, avoidableDeaths: 0 }
    );
    ages[age.key] = {
      currentDeaths: totals.currentDeaths,
      avoidableDeaths: totals.avoidableDeaths,
      avoidableShare: totals.currentDeaths ? totals.avoidableDeaths / totals.currentDeaths : null,
    };
  });
  const post = ages.post25 || {};
  return {
    country: regionName,
    kind: "region",
    sourceCountry,
    currentDeaths: post.currentDeaths,
    avoidableDeaths: post.avoidableDeaths,
    avoidableShare: post.avoidableShare,
    cityCount: cities.length,
    ages,
  };
}

function ageLabel(ageKey) {
  if (ageKey === "post25") return t("total25");
  const match = (DATA.ageGroups || []).find((age) => age.key === ageKey);
  return match ? match.label : ageKey.replace("_", "-");
}

function geoCountryName(feature) {
  return feature.properties.ADMIN || feature.properties.NAME || feature.properties.name;
}

function getCountryData(feature) {
  const geoName = geoCountryName(feature);
  if (geoName === "Taiwan") return taiwanRegion;
  const iso3 = feature.properties.ISO_A3_EH || feature.properties.ISO_A3 || feature.properties.ADM0_A3 || feature.properties.WB_A3;
  return countriesByName.get(geoName) || countriesByName.get(countryAliases[geoName]) || countriesByName.get(countryIso3Aliases[iso3]);
}

function isChinaCountry(country) {
  return country && country.country === "China";
}

function isTaiwanFeature(feature) {
  return geoCountryName(feature) === "Taiwan";
}

function chinaCityCountryNames() {
  return ["China", "Taiwan", "Hong Kong", "Hong Kong S.A.R.", "Macau", "Macau S.A.R", "Macao", "Macao S.A.R."];
}

function getAgeData(item) {
  return item && item.ages && item.ages[selectedAge] ? item.ages[selectedAge] : {};
}

function getCitiesForCountry(countryName) {
  if (countryName === "China") {
    const seen = new Set();
    return chinaCityCountryNames().flatMap((name) => citiesByCountry.get(name) || []).filter((city) => {
      const key = cityKey(city);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  return citiesByCountry.get(countryName) || citiesByCountry.get(countryToCityAliases[countryName]) || [];
}

function displayCountryName(item, feature) {
  if (item && item.kind === "region" && item.country === "China Taiwan") {
    return language === "zh" ? "中国台湾" : "China Taiwan";
  }
  if (language === "zh") {
    if (feature && feature.properties.NAME_ZH) return feature.properties.NAME_ZH;
    if (item && item.mapNameZh) return item.mapNameZh;
    if (item && localizedCountryName(item.country)) return localizedCountryName(item.country);
    if (item && countryDisplayZh[item.country]) return countryDisplayZh[item.country];
  }
  if (item && item.mapNameEn) return item.mapNameEn;
  if (item && countryDisplayEn[item.country]) return countryDisplayEn[item.country];
  return item ? item.country : "";
}

function displayGeoName(feature) {
  if (geoCountryName(feature) === "Taiwan") return language === "zh" ? "中国台湾" : "China Taiwan";
  if (language === "zh" && feature.properties.NAME_ZH) return feature.properties.NAME_ZH;
  return geoCountryName(feature);
}

function localizedCountryName(countryName) {
  if (language !== "zh" || !regionNamesZh) return "";
  const iso2 = countryIso2ByName.get(countryName);
  return iso2 ? regionNamesZh.of(iso2) : "";
}

function hasMapBoundary(country) {
  return country && countryLayersByKey.has(countryKey(country));
}

function countryIso3(country) {
  if (!country) return "";
  if (country.country === "China Taiwan") return "TWN";
  return countryIso3ByName.get(country.country) || "";
}

function adminIso3sForCountry(country) {
  const iso3 = countryIso3(country);
  if (!iso3) return [];
  return isChinaCountry(country) ? [iso3, "TWN"] : [iso3];
}

function countryPickerLabel(country) {
  const name = displayCountryName(country);
  return hasMapBoundary(country) ? name : `${name} (${t("notMapped")})`;
}

function displayCityName(city) {
  if (language === "zh") return cityDisplayZh[city.city_ascii] || cityDisplayZh[city.city] || city.city || city.city_ascii;
  return city.city_ascii || city.city;
}

function displayCityLocation(city) {
  const sourceCountry =
    city.country === "Taiwan"
      ? "China Taiwan"
      : city.country === "Hong Kong" || city.country === "Hong Kong S.A.R."
        ? "Hong Kong"
        : city.country === "Macau" || city.country === "Macau S.A.R" || city.country === "Macao" || city.country === "Macao S.A.R."
          ? "Macau"
          : city.country;
  const countryName =
    language === "zh"
      ? countryDisplayZh[sourceCountry] || localizedCountryName(sourceCountry) || sourceCountry
      : countryDisplayEn[sourceCountry] || sourceCountry;
  return `${countryName}${city.province ? `, ${city.province}` : ""}`;
}

function findCountryByKey(key) {
  return selectableCountries.find((country) => countryKey(country) === key) || null;
}

function findCityByKey(country, key) {
  if (!country || !key) return null;
  return getCitiesForCountry(country.country).find((city) => cityKey(city) === key) || null;
}

function formatNumber(value) {
  return value == null ? "--" : fmt.format(value);
}

function formatPercent(value) {
  return value == null ? "--" : pct.format(value);
}

function colorForShare(share) {
  if (share == null) return "#eef2e7";
  if (share < 0.4) return "#d9ead6";
  if (share < 0.55) return "#a8d2bf";
  if (share < 0.7) return "#4ba58a";
  if (share < 0.82) return "#0f7665";
  return "#a94628";
}

function maxCityAvoidableForAge() {
  return Math.max(...DATA.cities.map((d) => (d.ages && d.ages[selectedAge] ? d.ages[selectedAge].avoidableDeaths || 0 : 0)), 1);
}

function radiusForCity(value) {
  if (!value) return 3;
  return 3 + Math.sqrt(value / maxCityAvoidableForAge()) * 8;
}

function countryStyle(feature) {
  const d = getCountryData(feature);
  const age = getAgeData(d);
  const active =
    selectedCountry &&
    d &&
    (d.country === selectedCountry.country || (isChinaCountry(selectedCountry) && isTaiwanFeature(feature)));
  return {
    color: active ? "#17231f" : "#ffffff",
    weight: active ? 2.2 : 0.8,
    fillColor: d ? colorForShare(age.avoidableShare) : "#eef2e7",
    fillOpacity: d ? 0.82 : 0.34,
  };
}

function countryTooltip(d, feature) {
  const name = d ? displayCountryName(d, feature) : displayGeoName(feature);
  if (!d) return `<strong>${name}</strong><span>${t("noModeledData")}</span>`;
  const age = getAgeData(d);
  return `<strong>${name}</strong><span>${ageLabel(selectedAge)}<br>${t("avoidable")}: ${formatNumber(
    age.avoidableDeaths
  )}<br>${t("share")}: ${formatPercent(age.avoidableShare)}</span>`;
}

function cityTooltip(city) {
  const age = getAgeData(city);
  return `<strong>${displayCityName(city)}</strong><span>${ageLabel(selectedAge)}<br>${t(
    "avoidable"
  )}: ${formatNumber(age.avoidableDeaths)}<br>${t("share")}: ${formatPercent(age.avoidableShare)}</span>`;
}

function makeCityMarker(city) {
  const age = getAgeData(city);
  const marker = L.circleMarker([city.lat, city.lng], {
    radius: radiusForCity(age.avoidableDeaths),
    color: "#ffffff",
    weight: 0.8,
    fillColor: colorForShare(age.avoidableShare),
    fillOpacity: 0.82,
    pane: "cityPane",
    className: "city-marker",
  });
  marker.bindTooltip(cityTooltip(city), { className: "map-tooltip", sticky: true });
  marker.on("click", () => selectCity(city));
  return marker;
}

function drawCountries() {
  if (countryLayer) countryLayer.remove();
  countryLayersByKey = new Map();
  countryLayer = L.geoJSON(WORLD, {
    style: countryStyle,
    onEachFeature: (feature, layer) => {
      const d = getCountryData(feature);
      if (d) countryLayersByKey.set(countryKey(d), layer);
      layer.bindTooltip(countryTooltip(d, feature), {
        className: "map-tooltip",
        sticky: true,
      });
      layer.on({
        mouseover: () => layer.setStyle({ weight: 2, color: "#17231f" }),
        mouseout: () => countryLayer.resetStyle(layer),
        click: () => {
          if (!d) return;
          selectCountry(d, feature);
          showCountryCities(d, layer);
        },
      });
    },
  }).addTo(map);
}

function boundsForCountry(country, fallbackLayer) {
  const layers = [];
  const primaryLayer = countryLayersByKey.get(countryKey(country));
  if (primaryLayer) layers.push(primaryLayer);
  else if (fallbackLayer) layers.push(fallbackLayer);
  if (isChinaCountry(country)) {
    const taiwanLayer = countryLayersByKey.get(countryKey(taiwanRegion));
    if (taiwanLayer) layers.push(taiwanLayer);
  }
  if (!layers.length) return null;
  return layers.reduce((bounds, layer) => {
    const layerBounds = layer.getBounds();
    return bounds ? bounds.extend(layerBounds) : layerBounds;
  }, null);
}

function clearCities() {
  if (cityLayer) {
    cityLayer.remove();
    cityLayer = null;
  }
}

function clearAdminBoundaries() {
  boundaryRequestId += 1;
  if (admin1Layer) {
    admin1Layer.remove();
    admin1Layer = null;
  }
  if (admin2Layer) {
    admin2Layer.remove();
    admin2Layer = null;
  }
}

function loadBoundaryChunk(level, iso3) {
  const key = `${level}-${iso3}`;
  if (window.BOUNDARY_CHUNKS && window.BOUNDARY_CHUNKS[key]) {
    return Promise.resolve(window.BOUNDARY_CHUNKS[key]);
  }
  const src = BOUNDARY_INDEX[level] && BOUNDARY_INDEX[level][iso3];
  if (!src) return Promise.resolve(null);

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(window.BOUNDARY_CHUNKS ? window.BOUNDARY_CHUNKS[key] : null);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
}

function adminBoundaryStyle(level) {
  return {
    pane: level === "adm1" ? "admin1Pane" : "admin2Pane",
    interactive: false,
    fillOpacity: 0,
    color: level === "adm1" ? "#24332e" : "#6e7c76",
    weight: level === "adm1" ? 1.15 : 0.55,
    opacity: level === "adm1" ? 0.68 : 0.42,
  };
}

function drawAdminBoundaries(country) {
  clearAdminBoundaries();
  const requestId = boundaryRequestId;
  const iso3s = adminIso3sForCountry(country);
  if (!iso3s.length) return;

  const chunkRequests = [];
  iso3s.forEach((iso3) => {
    chunkRequests.push(loadBoundaryChunk("adm1", iso3));
    chunkRequests.push(loadBoundaryChunk("adm2", iso3));
  });
  Promise.all(chunkRequests).then((chunks) => {
    if (requestId !== boundaryRequestId) return;
    const adm1Features = [];
    const adm2Features = [];
    chunks.forEach((chunk, index) => {
      if (!chunk || !chunk.features) return;
      if (index % 2 === 0) adm1Features.push(...chunk.features);
      else adm2Features.push(...chunk.features);
    });
    if (adm2Features.length) {
      admin2Layer = L.geoJSON({ type: "FeatureCollection", features: adm2Features }, { style: () => adminBoundaryStyle("adm2") }).addTo(map);
    }
    if (adm1Features.length) {
      admin1Layer = L.geoJSON({ type: "FeatureCollection", features: adm1Features }, { style: () => adminBoundaryStyle("adm1") }).addTo(map);
    }
  });
}

function drawCities(country) {
  clearCities();
  cityLayer = L.layerGroup();
  getCitiesForCountry(country.country).forEach((city) => makeCityMarker(city).addTo(cityLayer));
  cityLayer.addTo(map);
}

function cityBoundsForCountry(country) {
  const latLngs = getCitiesForCountry(country.country).map((city) => [city.lat, city.lng]);
  return latLngs.length ? L.latLngBounds(latLngs) : null;
}

function showCountryCities(country, layerForBounds) {
  mode = "city";
  selectedCountry = country;
  selectedCity = null;
  updateModeButtons();
  drawCountries();
  drawAdminBoundaries(country);
  drawCities(country);
  const countryBounds = boundsForCountry(country, layerForBounds);
  if (countryBounds) {
    map.fitBounds(countryBounds, { padding: [28, 28], maxZoom: 5 });
  } else {
    const bounds = cityBoundsForCountry(country);
    if (bounds) map.fitBounds(bounds, { padding: [28, 28], maxZoom: 5 });
  }
  updateModeText();
  selectCountry(country);
  els.backToWorld.hidden = false;
}

function updateMetricPanel(item, typeKey, name, detailLevel, detailLocation) {
  const age = getAgeData(item);
  els.selectionType.textContent = t(typeKey);
  els.selectionName.textContent = name;
  els.currentDeaths.textContent = formatNumber(age.currentDeaths);
  els.avoidableDeaths.textContent = formatNumber(age.avoidableDeaths);
  els.avoidableShare.textContent = formatPercent(age.avoidableShare);
  els.detailLevel.textContent = detailLevel;
  els.detailLocation.textContent = detailLocation;
  renderAgeBreakdown(item);
}

function selectCountry(d, feature) {
  selectedCountry = d;
  selectedCity = null;
  if (feature) {
    selectedCountry.mapNameZh = feature.properties.NAME_ZH || "";
    selectedCountry.mapNameEn = geoCountryName(feature);
  }
  const count = getCitiesForCountry(d.country).length;
  const typeKey =
    d.kind === "region"
      ? mode === "city"
        ? "selectedRegionSummary"
        : "selectedRegion"
      : mode === "city"
        ? "selectedCountrySummary"
        : "selectedCountry";
  const coverageText = count ? `${t("citiesInCountry")}: ${count}` : t("noCities");
  const boundaryText = hasMapBoundary(d) ? coverageText : `${coverageText}; ${t("notMapped")}`;
  updateMetricPanel(
    d,
    typeKey,
    displayCountryName(d, feature),
    t("countryLayer"),
    boundaryText
  );
  syncLocationPickers();
}

function selectCity(d) {
  selectedCity = d;
  updateMetricPanel(
    d,
    "selectedCity",
    displayCityName(d),
    t("cityLayer"),
    displayCityLocation(d)
  );
  syncLocationPickers();
}

function renderAgeBreakdown(item) {
  if (!item || !item.ages) {
    els.ageBreakdown.innerHTML = `<p>${t("noSelection")}</p>`;
    return;
  }
  const rows = (DATA.ageGroups || []).map((age) => {
    const values = item.ages[age.key] || {};
    const active = age.key === selectedAge ? " active" : "";
    return `<tr class="${active}"><td>${ageLabel(age.key)}</td><td>${formatNumber(
      values.currentDeaths
    )}</td><td>${formatNumber(values.avoidableDeaths)}</td><td>${formatPercent(values.avoidableShare)}</td></tr>`;
  });
  els.ageBreakdown.innerHTML = `<table><thead><tr><th>${t("age")}</th><th>${t(
    "current"
  )}</th><th>${t("avoidable")}</th><th>${t("share")}</th></tr></thead><tbody>${rows.join("")}</tbody></table>`;
}

function resetPanel() {
  els.selectionType.textContent = mode === "country" ? t("selectCountry") : t("selectCity");
  els.selectionName.textContent = mode === "country" ? t("clickCountry") : t("chooseCountryFirst");
  els.currentDeaths.textContent = "--";
  els.avoidableDeaths.textContent = "--";
  els.avoidableShare.textContent = "--";
  els.detailLevel.textContent = mode === "country" ? t("countryLayer") : t("cityLayer");
  els.detailLocation.textContent = "--";
  renderAgeBreakdown(null);
}

function populateAgeSelector() {
  els.ageGroup.innerHTML = (DATA.ageGroups || [])
    .map((age) => `<option value="${age.key}">${ageLabel(age.key)}</option>`)
    .join("");
  els.ageGroup.value = selectedAge;
}

function populateCountryPicker() {
  els.countryPicker.innerHTML = [
    `<option value="">${t("countryPickerPlaceholder")}</option>`,
    ...selectableCountries.map(
      (country) => `<option value="${countryKey(country)}">${countryPickerLabel(country)}</option>`
    ),
  ].join("");
}

function populateCityPicker() {
  const cities = selectedCountry ? getCitiesForCountry(selectedCountry.country) : [];
  els.cityPicker.disabled = !selectedCountry || cities.length === 0;
  els.cityPicker.innerHTML = [
    `<option value="">${t("cityPickerPlaceholder")}</option>`,
    ...cities
      .slice()
      .sort((a, b) => displayCityName(a).localeCompare(displayCityName(b)))
      .map((city) => `<option value="${cityKey(city)}">${displayCityName(city)}</option>`),
  ].join("");
}

function syncLocationPickers() {
  if (!els.countryPicker || !els.cityPicker) return;
  syncingPickers = true;
  populateCountryPicker();
  populateCityPicker();
  els.countryPicker.value = selectedCountry ? countryKey(selectedCountry) : "";
  els.cityPicker.value = selectedCity ? cityKey(selectedCity) : "";
  syncingPickers = false;
}

function updateStaticText() {
  document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  els.language.value = language;
  if (els.dataYear) els.dataYear.value = selectedYear;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  const title = document.querySelector('[data-i18n="title"]');
  if (title) title.textContent = t("title").replace("2020", selectedYear);
  populateAgeSelector();
  syncLocationPickers();
}

function updateModeText() {
  if (mode === "country") {
    els.modeTitle.textContent = t("countryTitle");
    els.modeSubtitle.textContent = t("countrySubtitle");
  } else {
    els.modeTitle.textContent = t("cityTitle");
    els.modeSubtitle.textContent = t("citySubtitle");
  }
}

function updateModeButtons() {
  els.buttons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });
}

function refreshForAgeOrLanguage() {
  updateStaticText();
  updateModeText();
  drawCountries();
  if (mode === "city" && selectedCountry) drawCities(selectedCountry);
  if (selectedCity) selectCity(selectedCity);
  else if (selectedCountry) selectCountry(selectedCountry);
  else resetPanel();
}

els.buttons.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.mode === "country") {
      mode = "country";
      selectedCountry = null;
      selectedCity = null;
      clearCities();
      clearAdminBoundaries();
      drawCountries();
      map.setView([22, 12], 2);
      els.backToWorld.hidden = true;
      updateModeButtons();
      updateModeText();
      resetPanel();
      return;
    }
    mode = "city";
    updateModeButtons();
    updateModeText();
    if (!selectedCountry) {
      resetPanel();
      return;
    }
    showCountryCities(selectedCountry);
  });
});

els.backToWorld.addEventListener("click", () => {
  mode = "country";
  selectedCountry = null;
  selectedCity = null;
  clearCities();
  clearAdminBoundaries();
  drawCountries();
  map.setView([22, 12], 2);
  els.backToWorld.hidden = true;
  updateModeButtons();
  updateModeText();
  resetPanel();
});

els.language.addEventListener("change", () => {
  language = els.language.value;
  refreshForAgeOrLanguage();
});

els.ageGroup.addEventListener("change", () => {
  selectedAge = els.ageGroup.value;
  refreshForAgeOrLanguage();
});

els.dataYear.addEventListener("change", () => {
  selectedYear = els.dataYear.value;
  refreshForAgeOrLanguage();
});

els.countryPicker.addEventListener("change", () => {
  if (syncingPickers) return;
  const country = findCountryByKey(els.countryPicker.value);
  if (!country) {
    mode = "country";
    selectedCountry = null;
    selectedCity = null;
    clearCities();
    clearAdminBoundaries();
    drawCountries();
    map.setView([22, 12], 2);
    els.backToWorld.hidden = true;
    updateModeButtons();
    updateModeText();
    resetPanel();
    syncLocationPickers();
    return;
  }
  const layer = countryLayersByKey.get(countryKey(country));
  showCountryCities(country, layer);
});

els.cityPicker.addEventListener("change", () => {
  if (syncingPickers || !selectedCountry) return;
  const city = findCityByKey(selectedCountry, els.cityPicker.value);
  if (!city) {
    selectCountry(selectedCountry);
    return;
  }
  selectCity(city);
  map.setView([city.lat, city.lng], Math.max(map.getZoom(), 5));
});

populateAgeSelector();
drawCountries();
updateStaticText();
updateModeText();
resetPanel();
syncLocationPickers();
