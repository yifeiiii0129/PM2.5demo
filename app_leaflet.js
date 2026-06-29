const DATA = window.PM25_DATA;
const WORLD = window.WORLD_GEOJSON;

const els = {
  language: document.querySelector("#language"),
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
  backToWorld: document.querySelector("#backToWorld"),
};

const text = {
  zh: {
    eyebrow: "PM2.5 死亡负担探索器",
    title: "WHO 5 µg/m³ 可避免死亡人数地图",
    language: "语言",
    countryMode: "国家层面",
    cityMode: "城市层面",
    legend: "可减少比例",
    currentDeaths: "当前死亡人数",
    avoidableDeaths: "WHO 5 下可减少",
    avoidableShare: "可减少比例",
    level: "数据层级",
    location: "位置 / 覆盖城市",
    backToWorld: "返回国家地图",
    countryTitle: "国家层面",
    countrySubtitle: "点击国家区域查看详情；颜色越深表示 WHO 标准下可减少比例越高",
    cityTitle: "城市层面",
    citySubtitle: "点击国家后显示该国城市；滚轮或 +/- 可缩放查看密集区域",
    selectCountry: "请选择一个国家",
    selectCity: "请选择一个城市",
    clickCountry: "点击国家查看详情",
    chooseCountryFirst: "请先在国家地图点击一个国家",
    selectedCountry: "国家",
    selectedCity: "城市",
    citiesInCountry: "该国城市数",
    noCities: "该国家暂无城市点数据",
    cityLayer: "City",
    countryLayer: "Country",
    avoidable: "可减少",
    share: "比例",
  },
  en: {
    eyebrow: "PM2.5 mortality explorer",
    title: "Avoidable deaths under WHO 5 µg/m³",
    language: "Language",
    countryMode: "Countries",
    cityMode: "Cities",
    legend: "Avoidable share",
    currentDeaths: "Current deaths",
    avoidableDeaths: "Avoidable under WHO 5",
    avoidableShare: "Avoidable share",
    level: "Data level",
    location: "Location / city coverage",
    backToWorld: "Back to country map",
    countryTitle: "Country level",
    countrySubtitle: "Click a country for details; darker colors mean a higher avoidable share under WHO 5",
    cityTitle: "City level",
    citySubtitle: "After selecting a country, city points appear; use wheel or +/- to inspect dense areas",
    selectCountry: "Select a country",
    selectCity: "Select a city",
    clickCountry: "Click a country to view details",
    chooseCountryFirst: "Click a country first",
    selectedCountry: "Country",
    selectedCity: "City",
    citiesInCountry: "Cities in country",
    noCities: "No city point data for this country",
    cityLayer: "City",
    countryLayer: "Country",
    avoidable: "Avoidable",
    share: "Share",
  },
};

const countryAliases = {
  USA: "United Sts.of America",
  Russia: "Russian Fed.",
  Venezuela: "Boliv.Rep.of Venezuela",
  "Bosnia and Herzegovina": "Bosnia+Herzegovina",
  Brunei: "Brunei Darussalam",
  "Central African Republic": "Central African Rep.",
  "Democratic Republic of the Congo": "Dem.Rep.of the Congo",
  "Republic of the Congo": "Congo",
  "Ivory Coast": "Cote dIvoire",
  "North Korea": "Dem.Peo.Rep.of Korea",
  "South Korea": "Rep.of Korea",
  Iran: "Isl.Rep.of Iran",
  Laos: "Lao Peo.Dem.Rep.",
  Libya: "Libyan Arab Jamahiriya",
  Macedonia: "Fmr.Yugoslav Rep.of Macedonia",
  Moldova: "Rep.of Moldova",
  Syria: "Syrian Arab Rep.",
  "United Republic of Tanzania": "United Rep.of Tanzania",
  Vietnam: "Viet Nam",
  "The Bahamas": "Bahamas",
  "Trinidad and Tobago": "Trinidad+Tobago",
  "East Timor": "Timor-Leste",
  "Guinea Bissau": "Guinea-Bissau",
};

const countryToCityAliases = {
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

let language = "zh";
let mode = "country";
let selectedCountry = null;
let selectedCity = null;
let countryLayer = null;
let cityLayer = null;

const countriesByName = new Map(DATA.countries.map((d) => [d.country, d]));
const citiesByCountry = DATA.cities.reduce((acc, city) => {
  if (!city.country || city.lat == null || city.lng == null) return acc;
  if (!acc.has(city.country)) acc.set(city.country, []);
  acc.get(city.country).push(city);
  return acc;
}, new Map());

const maxCityAvoidable = Math.max(...DATA.cities.map((d) => d.avoidableDeaths || 0));
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

function getCountryData(feature) {
  const geoName = feature.properties.name;
  return countriesByName.get(geoName) || countriesByName.get(countryAliases[geoName]);
}

function getCitiesForCountry(countryName) {
  return citiesByCountry.get(countryName) || citiesByCountry.get(countryToCityAliases[countryName]) || [];
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

function radiusForCity(value) {
  if (!value || !maxCityAvoidable) return 3;
  return 3 + Math.sqrt(value / maxCityAvoidable) * 8;
}

function countryStyle(feature) {
  const d = getCountryData(feature);
  const active = selectedCountry && d && d.country === selectedCountry.country;
  return {
    color: active ? "#17231f" : "#ffffff",
    weight: active ? 2.2 : 0.8,
    fillColor: d ? colorForShare(d.avoidableShare) : "#eef2e7",
    fillOpacity: d ? 0.82 : 0.34,
  };
}

function countryTooltip(d, name) {
  if (!d) return `<strong>${name}</strong><span>No data</span>`;
  return `<strong>${d.country}</strong><span>${t("avoidable")}: ${formatNumber(
    d.avoidableDeaths
  )}<br>${t("share")}: ${formatPercent(d.avoidableShare)}</span>`;
}

function cityTooltip(city) {
  return `<strong>${city.city_ascii || city.city}</strong><span>${t("avoidable")}: ${formatNumber(
    city.avoidableDeaths
  )}<br>${t("share")}: ${formatPercent(city.avoidableShare)}</span>`;
}

function makeCityMarker(city) {
  const marker = L.circleMarker([city.lat, city.lng], {
    radius: radiusForCity(city.avoidableDeaths),
    color: "#ffffff",
    weight: 0.8,
    fillColor: colorForShare(city.avoidableShare),
    fillOpacity: 0.82,
    className: "city-marker",
  });
  marker.bindTooltip(cityTooltip(city), { className: "map-tooltip", sticky: true });
  marker.on("click", () => selectCity(city));
  return marker;
}

function drawCountries() {
  if (countryLayer) countryLayer.remove();
  countryLayer = L.geoJSON(WORLD, {
    style: countryStyle,
    onEachFeature: (feature, layer) => {
      const d = getCountryData(feature);
      layer.bindTooltip(countryTooltip(d, feature.properties.name), {
        className: "map-tooltip",
        sticky: true,
      });
      layer.on({
        mouseover: () => layer.setStyle({ weight: 2, color: "#17231f" }),
        mouseout: () => countryLayer.resetStyle(layer),
        click: () => {
          if (!d) return;
          selectCountry(d);
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

function showCountryCities(country, layerForBounds) {
  mode = "city";
  selectedCountry = country;
  selectedCity = null;
  updateModeButtons();
  clearCities();
  drawCountries();
  cityLayer = L.layerGroup();
  getCitiesForCountry(country.country).forEach((city) => makeCityMarker(city).addTo(cityLayer));
  cityLayer.addTo(map);
  if (layerForBounds) {
    map.fitBounds(layerForBounds.getBounds(), { padding: [28, 28], maxZoom: 5 });
  }
  updateModeText();
  els.backToWorld.hidden = false;
}

function selectCountry(d) {
  selectedCountry = d;
  selectedCity = null;
  els.selectionType.textContent = t("selectedCountry");
  els.selectionName.textContent = d.country;
  els.currentDeaths.textContent = formatNumber(d.currentDeaths);
  els.avoidableDeaths.textContent = formatNumber(d.avoidableDeaths);
  els.avoidableShare.textContent = formatPercent(d.avoidableShare);
  els.detailLevel.textContent = t("countryLayer");
  const count = getCitiesForCountry(d.country).length;
  els.detailLocation.textContent = count ? `${t("citiesInCountry")}: ${count}` : t("noCities");
}

function selectCity(d) {
  selectedCity = d;
  els.selectionType.textContent = t("selectedCity");
  els.selectionName.textContent = d.city_ascii || d.city;
  els.currentDeaths.textContent = formatNumber(d.currentDeaths);
  els.avoidableDeaths.textContent = formatNumber(d.avoidableDeaths);
  els.avoidableShare.textContent = formatPercent(d.avoidableShare);
  els.detailLevel.textContent = t("cityLayer");
  els.detailLocation.textContent = `${d.country}${d.province ? `, ${d.province}` : ""}`;
}

function resetPanel() {
  els.selectionType.textContent = mode === "country" ? t("selectCountry") : t("selectCity");
  els.selectionName.textContent = mode === "country" ? t("clickCountry") : t("chooseCountryFirst");
  els.currentDeaths.textContent = "--";
  els.avoidableDeaths.textContent = "--";
  els.avoidableShare.textContent = "--";
  els.detailLevel.textContent = mode === "country" ? t("countryLayer") : t("cityLayer");
  els.detailLocation.textContent = "--";
}

function updateStaticText() {
  document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
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

function redrawCitiesForLanguage() {
  if (!selectedCountry || mode !== "city") return;
  clearCities();
  cityLayer = L.layerGroup();
  getCitiesForCountry(selectedCountry.country).forEach((city) => makeCityMarker(city).addTo(cityLayer));
  cityLayer.addTo(map);
}

function renderLanguage() {
  updateStaticText();
  updateModeText();
  drawCountries();
  redrawCitiesForLanguage();
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
  renderLanguage();
});

drawCountries();
updateStaticText();
updateModeText();
resetPanel();
