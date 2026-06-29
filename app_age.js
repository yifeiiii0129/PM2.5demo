const DATA = window.PM25_DATA;
const WORLD = window.WORLD_GEOJSON;

const els = {
  language: document.querySelector("#language"),
  ageGroup: document.querySelector("#ageGroup"),
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
    title: "WHO 5 µg/m³ 可避免死亡人数地图",
    language: "语言",
    ageGroup: "年龄段",
    countryPicker: "选择国家",
    cityPicker: "选择城市",
    countryPickerPlaceholder: "选择一个国家",
    cityPickerPlaceholder: "可选：选择一个城市",
    countryMode: "国家地图",
    cityMode: "城市点图",
    legend: "可减少比例",
    currentDeaths: "当前死亡人数",
    avoidableDeaths: "WHO 5 下可减少",
    avoidableShare: "可减少比例",
    level: "数据层级",
    location: "位置 / 展示城市",
    ageBreakdown: "年龄段明细",
    backToWorld: "返回国家地图",
    countryTitle: "国家层面",
    countrySubtitle: "点击国家区域查看详情；颜色按当前选择年龄段的 WHO 5 可减少比例显示",
    cityTitle: "城市点图",
    citySubtitle: "右侧先显示国家汇总；点击城市点后切换为城市数据",
    selectCountry: "请选择一个国家",
    selectCity: "请选择一个城市",
    clickCountry: "点击国家查看详情",
    chooseCountryFirst: "请先在国家地图点击一个国家",
    selectedCountry: "国家",
    selectedCountrySummary: "国家汇总",
    selectedRegion: "地区",
    selectedRegionSummary: "地区汇总",
    selectedCity: "城市",
    citiesInCountry: "当前展示城市数",
    noCities: "该国家暂无城市点数据",
    cityLayer: "City",
    countryLayer: "Country",
    avoidable: "可减少",
    share: "比例",
    current: "当前",
    age: "年龄",
    total25: "总计 25+",
    noSelection: "选择国家或城市后显示",
    noData: "无数据",
    noModeledData: "源数据中没有单独建模结果",
  },
  en: {
    eyebrow: "PM2.5 mortality explorer",
    title: "Avoidable deaths under WHO 5 µg/m³",
    language: "Language",
    ageGroup: "Age",
    countryPicker: "Country",
    cityPicker: "City",
    countryPickerPlaceholder: "Select a country",
    cityPickerPlaceholder: "Optional: select a city",
    countryMode: "Country map",
    cityMode: "City points",
    legend: "Avoidable share",
    currentDeaths: "Current deaths",
    avoidableDeaths: "Avoidable under WHO 5",
    avoidableShare: "Avoidable share",
    level: "Data level",
    location: "Location / displayed cities",
    ageBreakdown: "Age breakdown",
    backToWorld: "Back to country map",
    countryTitle: "Country level",
    countrySubtitle: "Click a country for details; colors use the selected age group's avoidable share",
    cityTitle: "City points",
    citySubtitle: "The panel first shows the country summary; click a city point to switch to city data",
    selectCountry: "Select a country",
    selectCity: "Select a city",
    clickCountry: "Click a country to view details",
    chooseCountryFirst: "Click a country first",
    selectedCountry: "Country",
    selectedCountrySummary: "Country summary",
    selectedRegion: "Region",
    selectedRegionSummary: "Region summary",
    selectedCity: "City",
    citiesInCountry: "Displayed cities",
    noCities: "No city point data for this country",
    cityLayer: "City",
    countryLayer: "Country",
    avoidable: "Avoidable",
    share: "Share",
    current: "Current",
    age: "Age",
    total25: "Total 25+",
    noSelection: "Shown after selecting a country or city",
    noData: "No data",
    noModeledData: "No separate modeled result in source data",
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
};

const countryDisplayZh = {
  "China Taiwan": "中国台湾",
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
let selectedCountry = null;
let selectedCity = null;
let countryLayer = null;
let cityLayer = null;
let syncingPickers = false;
let countryLayersByKey = new Map();

const countriesByName = new Map(DATA.countries.map((d) => [d.country, d]));
const citiesByCountry = DATA.cities.reduce((acc, city) => {
  if (!city.country || city.lat == null || city.lng == null) return acc;
  if (!acc.has(city.country)) acc.set(city.country, []);
  acc.get(city.country).push(city);
  return acc;
}, new Map());
const taiwanRegion = buildRegionFromCities("China Taiwan", "Taiwan");
const selectableCountries = [...DATA.countries, taiwanRegion].sort((a, b) =>
  a.country.localeCompare(b.country)
);

const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const pct = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 });

const map = L.map("map", {
  zoomControl: true,
  minZoom: 2,
  maxZoom: 10,
  worldCopyJump: true,
}).setView([22, 12], 2);

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
  return countriesByName.get(geoName) || countriesByName.get(countryAliases[geoName]);
}

function getAgeData(item) {
  return item && item.ages && item.ages[selectedAge] ? item.ages[selectedAge] : {};
}

function getCitiesForCountry(countryName) {
  return citiesByCountry.get(countryName) || citiesByCountry.get(countryToCityAliases[countryName]) || [];
}

function displayCountryName(item, feature) {
  if (item && item.kind === "region" && item.country === "China Taiwan") {
    return language === "zh" ? "中国台湾" : "China Taiwan";
  }
  if (language === "zh") {
    if (feature && feature.properties.NAME_ZH) return feature.properties.NAME_ZH;
    if (item && item.mapNameZh) return item.mapNameZh;
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

function displayCityName(city) {
  if (language === "zh") return cityDisplayZh[city.city_ascii] || cityDisplayZh[city.city] || city.city || city.city_ascii;
  return city.city_ascii || city.city;
}

function displayCityLocation(city) {
  const sourceCountry = city.country === "Taiwan" ? "China Taiwan" : city.country;
  const countryName = language === "zh" ? countryDisplayZh[sourceCountry] || sourceCountry : countryDisplayEn[sourceCountry] || sourceCountry;
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
  const active = selectedCountry && d && d.country === selectedCountry.country;
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

function clearCities() {
  if (cityLayer) {
    cityLayer.remove();
    cityLayer = null;
  }
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
  drawCities(country);
  if (layerForBounds) {
    map.fitBounds(layerForBounds.getBounds(), { padding: [28, 28], maxZoom: 5 });
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
  updateMetricPanel(
    d,
    typeKey,
    displayCountryName(d, feature),
    t("countryLayer"),
    count ? `${t("citiesInCountry")}: ${count}` : t("noCities")
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
      (country) => `<option value="${countryKey(country)}">${displayCountryName(country)}</option>`
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
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
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

els.countryPicker.addEventListener("change", () => {
  if (syncingPickers) return;
  const country = findCountryByKey(els.countryPicker.value);
  if (!country) {
    mode = "country";
    selectedCountry = null;
    selectedCity = null;
    clearCities();
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
