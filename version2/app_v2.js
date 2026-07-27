const DATA = window.VERSION2_DATA;

const els = {
  year: document.querySelector("#yearSelect"),
  age: document.querySelector("#ageSelect"),
  ageControl: document.querySelector("#ageControl"),
  ageContext: document.querySelector("#ageContext"),
  country: document.querySelector("#countryPicker"),
  city: document.querySelector("#cityPicker"),
  countrySearch: document.querySelector("#countrySearch"),
  citySearch: document.querySelector("#citySearch"),
  countrySearchOptions: document.querySelector("#countrySearchOptions"),
  citySearchOptions: document.querySelector("#citySearchOptions"),
  modeTitle: document.querySelector("#modeTitle"),
  modeSubtitle: document.querySelector("#modeSubtitle"),
  selectionType: document.querySelector("#selectionType"),
  selectionName: document.querySelector("#selectionName"),
  currentDeaths: document.querySelector("#currentDeaths"),
  currentDeathsInterval: document.querySelector("#currentDeathsInterval"),
  currentRate: document.querySelector("#currentRate"),
  currentRateInterval: document.querySelector("#currentRateInterval"),
  avoidableDeaths: document.querySelector("#avoidableDeaths"),
  avoidableDeathsInterval: document.querySelector("#avoidableDeathsInterval"),
  avoidableRate: document.querySelector("#avoidableRate"),
  avoidableRateInterval: document.querySelector("#avoidableRateInterval"),
  who5Deaths: document.querySelector("#who5Deaths"),
  who5DeathsInterval: document.querySelector("#who5DeathsInterval"),
  avoidableShare: document.querySelector("#avoidableShare"),
  avoidableShareInterval: document.querySelector("#avoidableShareInterval"),
  pm25: document.querySelector("#pm25"),
  coverageMetric: document.querySelector("#coverageMetric"),
  coverage: document.querySelector("#coverage"),
  windowAreaMetric: document.querySelector("#windowAreaMetric"),
  windowArea: document.querySelector("#windowArea"),
  ageTableWrap: document.querySelector("#ageTableWrap"),
  ageBreakdown: document.querySelector("#ageBreakdown"),
  sizeLegend: document.querySelector("#sizeLegend"),
};

let year = "2020";
let ageKey = "post25";
let selectedCountry = null;
let selectedCity = null;
let geojson = null;
let countryLayer = null;
let cityLayer = null;
let countryLayersByIso = new Map();
let countrySearchMap = new Map();
let citySearchMap = new Map();
let citySizeScaleMax = 50000;

const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const one = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const pct = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 });
const rateFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

const isoAliases = { ADO: "AND", DRC: "COD", IMY: "IMN", ROM: "ROU", TMP: "TLS", WBG: "PSE" };
const countryNameAliases = {
  ALA: "Aland Islands",
  BLM: "Saint Barthelemy",
  CIV: "Cote d'Ivoire",
  CUW: "Curacao",
  STP: "Sao Tome and Principe",
  TUR: "Turkey",
};
const countryFallbackNames = { TWN: "Taiwan", XGZ: "Gaza" };

const map = L.map("map", { minZoom: 2, maxZoom: 10, worldCopyJump: true }).setView([22, 12], 2);
L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
  maxZoom: 10,
  attribution: "&copy; OpenStreetMap &copy; CARTO",
}).addTo(map);

function yearData() {
  return DATA.years[year];
}

function countries() {
  return yearData().countries;
}

function cities() {
  return yearData().cities;
}

function makeVirtualCountry(iso3) {
  const list = cities().filter((d) => d.iso3 === iso3);
  if (!list.length) return null;
  const population = list.reduce((sum, d) => sum + (d.population || 0), 0);
  const populationDenominator = list.reduce((sum, d) => sum + (d.population25PlusInWindow || 0), 0);
  const pm25Weight = list.reduce((sum, d) => sum + (d.pm25 || 0) * (d.population || 0), 0);
  const currentDeaths = list.reduce((sum, d) => sum + (d.currentDeaths || 0), 0);
  const currentDeathsLow = list.reduce((sum, d) => sum + (d.currentDeathsLow || 0), 0);
  const currentDeathsHigh = list.reduce((sum, d) => sum + (d.currentDeathsHigh || 0), 0);
  const avoidableDeaths = list.reduce((sum, d) => sum + (d.avoidableDeaths || 0), 0);
  const avoidableDeathsLow = list.reduce((sum, d) => sum + (d.avoidableDeathsLow || 0), 0);
  const avoidableDeathsHigh = list.reduce((sum, d) => sum + (d.avoidableDeathsHigh || 0), 0);
  const who5Deaths = list.reduce((sum, d) => sum + (d.who5Deaths || 0), 0);
  const who5DeathsLow = list.reduce((sum, d) => sum + (d.who5DeathsLow || 0), 0);
  const who5DeathsHigh = list.reduce((sum, d) => sum + (d.who5DeathsHigh || 0), 0);
  const rate = (value) => (populationDenominator ? (value * 100000) / populationDenominator : null);
  const ages = {};
  DATA.ageGroups.forEach((age) => {
    ages[age.key] =
      age.key === "post25"
        ? {
            label: age.label,
            populationDenominator,
            currentDeaths,
            currentDeathsLow,
            currentDeathsHigh,
            currentRatePer100k: rate(currentDeaths),
            currentRatePer100kLow: rate(currentDeathsLow),
            currentRatePer100kHigh: rate(currentDeathsHigh),
            avoidableDeaths,
            avoidableDeathsLow,
            avoidableDeathsHigh,
            avoidableRatePer100k: rate(avoidableDeaths),
            avoidableRatePer100kLow: rate(avoidableDeathsLow),
            avoidableRatePer100kHigh: rate(avoidableDeathsHigh),
            who5Deaths,
            who5DeathsLow,
            who5DeathsHigh,
            avoidableShare: currentDeaths ? avoidableDeaths / currentDeaths : null,
            avoidableShareLow: currentDeathsLow ? avoidableDeathsLow / currentDeathsLow : null,
            avoidableShareHigh: currentDeathsHigh ? avoidableDeathsHigh / currentDeathsHigh : null,
          }
        : { label: age.label, currentDeaths: null, avoidableDeaths: null, who5Deaths: null, avoidableShare: null };
  });
  return {
    iso3,
    name: countryFallbackNames[iso3] || iso3,
    pm25: population ? pm25Weight / population : null,
    ages,
    virtual: true,
  };
}

function countryOptions() {
  const list = countries().slice();
  const seen = new Set(list.map((d) => d.iso3));
  cities().forEach((city) => {
    if (!seen.has(city.iso3)) {
      const virtualCountry = makeVirtualCountry(city.iso3);
      if (virtualCountry) {
        list.push(virtualCountry);
        seen.add(city.iso3);
      }
    }
  });
  return list;
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/脙漏/g, "e")
    .replace(/脙麓/g, "o")
    .replace(/脙搂/g, "c")
    .replace(/脙拢/g, "a")
    .replace(/脙颅/g, "i")
    .replace(/脙录/g, "u")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

function cleanDisplayName(value) {
  return String(value || "")
    .replace(/脙漏/g, "e")
    .replace(/脙麓/g, "o")
    .replace(/脙搂/g, "c")
    .replace(/脙拢/g, "a")
    .replace(/脙颅/g, "i")
    .replace(/脙录/g, "u")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function countryName(country) {
  if (!country) return "";
  return countryNameAliases[country.iso3] || cleanDisplayName(country.name);
}

function cityName(city) {
  return cleanDisplayName((city && (city.cityAscii || city.city)) || "");
}

function featureIso(feature) {
  const raw = feature.properties.WB_A3 || feature.properties.ISO_A3;
  return isoAliases[raw] || raw;
}

function countryByIso(iso3) {
  return countries().find((d) => d.iso3 === iso3) || makeVirtualCountry(iso3);
}

function countryMetric(country) {
  if (!country || !country.ages) return null;
  return country.ages[ageKey] || country.ages.post25;
}

function cityMetric(city) {
  return city || null;
}

function formatNumber(value) {
  return value == null ? "--" : fmt.format(value);
}

function formatOne(value) {
  return value == null ? "--" : one.format(value);
}

function formatPercent(value) {
  return value == null ? "--" : pct.format(value);
}

function formatRate(value) {
  return value == null ? "--" : rateFmt.format(value);
}

function formatInterval(low, high, formatter) {
  return low == null || high == null ? "90% UI unavailable" : `90% UI: ${formatter(low)}–${formatter(high)}`;
}

function formatArea(value) {
  return value == null ? "--" : `${fmt.format(value)} km²`;
}

function updateCitySizeScale() {
  const maximum = Math.max(...cities().map((city) => city.avoidableDeaths || 0), 1);
  citySizeScaleMax = maximum;
  const ticks = [...new Set([1000, 10000, citySizeScaleMax])].filter((value) => value <= citySizeScaleMax);
  els.sizeLegend.innerHTML = ticks
    .map((value) => {
      const diameter = Math.round(radiusForValue(value) * 2);
      return `<span class="size-legend-item"><span class="legend-circle" style="width:${diameter}px;height:${diameter}px"></span><span>${formatNumber(value)}</span></span>`;
    })
    .join("");
}

function colorForShare(share) {
  if (share == null) return "#edf2ed";
  if (share < 0.3) return "#dcefd4";
  if (share < 0.5) return "#a8d2bf";
  if (share < 0.65) return "#4ba58a";
  if (share < 0.78) return "#0f7665";
  return "#b4472f";
}

function radiusForValue(value) {
  const bounded = Math.max(0, Math.min(Number(value) || 0, citySizeScaleMax));
  return 3 + Math.sqrt(bounded / citySizeScaleMax) * 14;
}

function radiusForCity(city) {
  return radiusForValue(city.avoidableDeaths);
}

function countryStyle(feature) {
  const d = countryByIso(featureIso(feature));
  const metric = countryMetric(d);
  const active = selectedCountry && d && selectedCountry.iso3 === d.iso3;
  return {
    color: active ? "#17201c" : "#ffffff",
    weight: active ? 2.2 : 0.8,
    fillColor: colorForShare(metric ? metric.avoidableShare : null),
    fillOpacity: d ? 0.82 : 0.28,
  };
}

function countryTooltip(country, fallbackName) {
  const metric = countryMetric(country);
  const name = country ? countryName(country) : cleanDisplayName(fallbackName);
  if (!country || !metric) return `<strong>${name}</strong><span>No modeled data</span>`;
  return `<strong>${name}</strong><span>Attributable mortality rate: ${formatRate(metric.currentRatePer100k)} per 100,000<br>${formatInterval(metric.currentRatePer100kLow, metric.currentRatePer100kHigh, formatRate)}<br>Avoidable rate at 5 μg/m³: ${formatRate(metric.avoidableRatePer100k)} per 100,000<br>Attributable deaths/year: ${formatNumber(metric.currentDeaths)}<br>Avoidable deaths/year: ${formatNumber(metric.avoidableDeaths)}<br>Avoidable share: ${formatPercent(metric.avoidableShare)}</span>`;
}

function cityTooltip(city) {
  return `<strong>${cityName(city)}</strong><span>3 × 3 city-centered window; adults 25+ only<br>Circle is not a city boundary or the window footprint<br>Population-weighted PM₂.₅: ${formatOne(city.pm25)} μg/m³<br>Attributable mortality rate: ${formatRate(city.currentRatePer100k)} per 100,000<br>${formatInterval(city.currentRatePer100kLow, city.currentRatePer100kHigh, formatRate)}<br>Avoidable rate at 5 μg/m³: ${formatRate(city.avoidableRatePer100k)} per 100,000<br>Attributable deaths/year: ${formatNumber(city.currentDeaths)}<br>Avoidable deaths/year: ${formatNumber(city.avoidableDeaths)}<br>Avoidable share: ${formatPercent(city.avoidableShare)}<br>Actual window area: ${formatArea(city.windowAreaKm2)}<br>Valid PM₂.₅ cells: ${formatNumber(city.validPm25Cells)} of ${formatNumber(city.windowCells)}</span>`;
}

function zoomToCountry(iso3) {
  const layer = countryLayersByIso.get(iso3);
  if (layer) map.fitBounds(layer.getBounds(), { padding: [34, 34], maxZoom: 5 });
  else {
    const points = cities()
      .filter((d) => d.iso3 === iso3 && d.lat != null && d.lng != null)
      .map((d) => [d.lat, d.lng]);
    if (points.length) map.fitBounds(L.latLngBounds(points), { padding: [38, 38], maxZoom: 7 });
  }
}

function zoomToCity(city) {
  if (city && city.lat != null && city.lng != null) map.setView([city.lat, city.lng], Math.max(map.getZoom(), 7));
}

function selectCountryByIso(iso3, options = {}) {
  const country = countryByIso(iso3);
  if (!country) return;
  selectedCountry = country;
  selectedCity = null;
  els.country.value = country.iso3;
  els.countrySearch.value = countryName(country);
  els.citySearch.value = "";
  populateCities();
  drawCountries();
  drawCities();
  renderPanel();
  if (options.zoom !== false) zoomToCountry(country.iso3);
}

function selectCityById(cityId, options = {}) {
  const city = cities().find((d) => d.id === cityId);
  if (!city) return;
  ageKey = "post25";
  els.age.value = ageKey;
  if (!selectedCountry || selectedCountry.iso3 !== city.iso3) {
    selectedCountry = countryByIso(city.iso3);
    populateCities();
  }
  selectedCity = city;
  els.country.value = selectedCountry ? selectedCountry.iso3 : "";
  els.countrySearch.value = selectedCountry ? countryName(selectedCountry) : "";
  els.city.value = city.id;
  els.citySearch.value = `${cityName(city)}, ${countryName(selectedCountry)}`;
  drawCountries();
  drawCities();
  renderPanel();
  if (options.zoom !== false) zoomToCity(city);
}

function drawCountries() {
  if (countryLayer) countryLayer.remove();
  countryLayersByIso = new Map();
  countryLayer = L.geoJSON(geojson, {
    style: countryStyle,
    onEachFeature: (feature, layer) => {
      const d = countryByIso(featureIso(feature));
      if (d) countryLayersByIso.set(d.iso3, layer);
      layer.bindTooltip(countryTooltip(d, feature.properties.NAM_0), { className: "map-tooltip", sticky: true });
      layer.on("click", () => {
        if (d) selectCountryByIso(d.iso3);
      });
    },
  }).addTo(map);
  // Age changes rebuild the country polygons. Keep that newly added SVG layer
  // behind the existing city markers so its fill opacity cannot wash them out.
  countryLayer.bringToBack();
}

function drawCities() {
  if (cityLayer) cityLayer.remove();
  cityLayer = L.layerGroup();
  const list = selectedCountry ? cities().filter((d) => d.iso3 === selectedCountry.iso3) : [];
  list
    .sort(
      (a, b) =>
        Number(Boolean(selectedCity) && a.id === selectedCity.id) -
        Number(Boolean(selectedCity) && b.id === selectedCity.id)
    )
    .forEach((city) => {
      const isSelected = Boolean(selectedCity) && selectedCity.id === city.id;
      const radius = radiusForCity(city);
      if (isSelected) {
        L.circleMarker([city.lat, city.lng], {
          radius: radius + 3,
          color: "#000000",
          weight: 1,
          fillColor: "#000000",
          fillOpacity: 1,
          interactive: false,
        }).addTo(cityLayer);
      }
      const marker = L.circleMarker([city.lat, city.lng], {
        radius,
        color: isSelected ? "#ffeb3b" : "#ffffff",
        weight: isSelected ? 3 : 0.7,
        fillColor: colorForShare(city.avoidableShare),
        fillOpacity: 0.86,
      });
      marker.bindTooltip(cityTooltip(city), { className: "map-tooltip", sticky: true });
      marker.on("click", () => selectCityById(city.id, { zoom: false }));
      marker.addTo(cityLayer);
    });
  cityLayer.addTo(map);
}

function populateYears() {
  els.year.innerHTML = Object.keys(DATA.years)
    .map((value) => `<option value="${value}">${value}</option>`)
    .join("");
  els.year.value = year;
}

function populateAges() {
  els.age.innerHTML = DATA.ageGroups.map((d) => `<option value="${d.key}">${d.label}</option>`).join("");
  els.age.value = ageKey;
}

function populateCountries() {
  countrySearchMap = new Map();
  const sorted = countryOptions().sort((a, b) => countryName(a).localeCompare(countryName(b)));
  els.country.innerHTML = `<option value="">Select a country</option>${sorted
    .map((d) => `<option value="${d.iso3}">${countryName(d)}</option>`)
    .join("")}`;
  els.countrySearchOptions.innerHTML = sorted.map((d) => `<option value="${countryName(d)}"></option>`).join("");
  sorted.forEach((d) => countrySearchMap.set(normalizeText(countryName(d)), d.iso3));
  els.country.value = selectedCountry ? selectedCountry.iso3 : "";
}

function populateCities() {
  citySearchMap = new Map();
  const scoped = selectedCountry ? cities().filter((d) => d.iso3 === selectedCountry.iso3) : cities();
  const sorted = scoped.slice().sort((a, b) => (b.population || 0) - (a.population || 0));
  els.city.disabled = !selectedCountry || !scoped.length;
  els.city.innerHTML = `<option value="">Select a city</option>${sorted
    .map((d) => `<option value="${d.id}">${cityName(d)}</option>`)
    .join("")}`;
  els.citySearchOptions.innerHTML = sorted
    .map((d) => `<option value="${cityName(d)}, ${countryName(countryByIso(d.iso3))}"></option>`)
    .join("");
  sorted.forEach((d) => {
    const country = countryByIso(d.iso3);
    citySearchMap.set(normalizeText(`${cityName(d)}, ${countryName(country)}`), d.id);
    if (!citySearchMap.has(normalizeText(cityName(d)))) citySearchMap.set(normalizeText(cityName(d)), d.id);
  });
  els.city.value = selectedCity ? selectedCity.id : "";
}

function renderAgeTable(country) {
  if (!els.ageBreakdown) return;
  if (!country) {
    els.ageBreakdown.innerHTML = "";
    return;
  }
  const rows = DATA.ageGroups
    .map((age) => {
      const metric = country.ages[age.key];
      const rateInterval = metric
        ? formatInterval(metric.currentRatePer100kLow, metric.currentRatePer100kHigh, formatRate)
        : "";
      return `<div class="age-row"><strong>${age.label}</strong><span title="${rateInterval}">${formatRate(metric ? metric.currentRatePer100k : null)}</span><span>${formatNumber(metric ? metric.currentDeaths : null)}</span><span>${formatPercent(metric ? metric.avoidableShare : null)}</span></div>`;
    })
    .join("");
  els.ageBreakdown.innerHTML = `<div class="age-row age-header"><strong>Age</strong><span>Rate/100k</span><span>Deaths</span><span>Avoidable</span></div>${rows}`;
}

function renderPanel() {
  const useCity = Boolean(selectedCity);
  const item = useCity ? selectedCity : selectedCountry;
  const metric = useCity ? cityMetric(selectedCity) : countryMetric(selectedCountry);
  els.age.disabled = useCity;
  els.ageControl.classList.toggle("city-age-locked", useCity);
  els.ageContext.textContent = useCity ? "Cities: adults 25+ only" : "";
  els.ageTableWrap.classList.toggle("is-hidden", useCity);
  els.modeTitle.textContent = selectedCountry ? "City-centered view" : "Country view";
  els.modeSubtitle.textContent = selectedCountry
    ? "Circle color shows avoidable share; circle area uses a square-root scale for avoidable deaths/year. Circles mark city coordinates and do not represent boundaries or window area."
    : "Country color shows the selected age group's avoidable share at the WHO 5 μg/m³ guideline. Select a country to show city-centered estimates.";
  els.selectionType.textContent = useCity
    ? "City-centered 3 × 3 window, adults 25+"
    : selectedCountry
      ? "Country"
      : "Select a country or city";
  els.selectionName.textContent = useCity
    ? `${cityName(selectedCity)}, ${countryName(selectedCountry)}`
    : selectedCountry
      ? countryName(selectedCountry)
      : "No location selected";
  els.currentDeaths.textContent = formatNumber(metric ? metric.currentDeaths : null);
  els.currentDeathsInterval.textContent = formatInterval(
    metric ? metric.currentDeathsLow : null,
    metric ? metric.currentDeathsHigh : null,
    formatNumber
  );
  els.currentRate.textContent = formatRate(metric ? metric.currentRatePer100k : null);
  els.currentRateInterval.textContent = formatInterval(
    metric ? metric.currentRatePer100kLow : null,
    metric ? metric.currentRatePer100kHigh : null,
    formatRate
  );
  els.avoidableDeaths.textContent = formatNumber(metric ? metric.avoidableDeaths : null);
  els.avoidableDeathsInterval.textContent = formatInterval(
    metric ? metric.avoidableDeathsLow : null,
    metric ? metric.avoidableDeathsHigh : null,
    formatNumber
  );
  els.avoidableRate.textContent = formatRate(metric ? metric.avoidableRatePer100k : null);
  els.avoidableRateInterval.textContent = formatInterval(
    metric ? metric.avoidableRatePer100kLow : null,
    metric ? metric.avoidableRatePer100kHigh : null,
    formatRate
  );
  els.who5Deaths.textContent = formatNumber(metric ? metric.who5Deaths : null);
  els.who5DeathsInterval.textContent = formatInterval(
    metric ? metric.who5DeathsLow : null,
    metric ? metric.who5DeathsHigh : null,
    formatNumber
  );
  els.avoidableShare.textContent = formatPercent(metric ? metric.avoidableShare : null);
  els.avoidableShareInterval.textContent = formatInterval(
    metric ? metric.avoidableShareLow : null,
    metric ? metric.avoidableShareHigh : null,
    formatPercent
  );
  els.pm25.textContent = !item || item.pm25 == null ? "--" : `${formatOne(item.pm25)} μg/m³`;
  els.coverageMetric.classList.toggle("is-hidden", Boolean(useCity));
  els.windowAreaMetric.classList.toggle("is-hidden", !useCity);
  els.coverage.textContent = selectedCountry ? formatNumber(cities().filter((d) => d.iso3 === selectedCountry.iso3).length) : "--";
  els.windowArea.textContent = useCity ? formatArea(selectedCity.windowAreaKm2) : "--";
  renderAgeTable(useCity ? null : selectedCountry);
}

function refresh() {
  selectedCountry = selectedCountry ? countryByIso(selectedCountry.iso3) : null;
  selectedCity = null;
  updateCitySizeScale();
  populateCountries();
  populateCities();
  drawCountries();
  drawCities();
  renderPanel();
}

function pickFromSearch(mapForInput, value, picker) {
  const exact = mapForInput.get(normalizeText(value));
  if (exact) {
    picker(exact);
    return;
  }
  const query = normalizeText(value);
  if (!query) return;
  const match = [...mapForInput.entries()].find(([label]) => label.includes(query));
  if (match) picker(match[1]);
}

function initEvents() {
  els.year.addEventListener("change", () => {
    year = els.year.value;
    refresh();
  });
  els.age.addEventListener("change", () => {
    ageKey = els.age.value;
    drawCountries();
    renderPanel();
  });
  els.country.addEventListener("change", () => selectCountryByIso(els.country.value));
  els.city.addEventListener("change", () => selectCityById(els.city.value));
  els.countrySearch.addEventListener("change", () => pickFromSearch(countrySearchMap, els.countrySearch.value, selectCountryByIso));
  els.countrySearch.addEventListener("keydown", (event) => {
    if (event.key === "Enter") pickFromSearch(countrySearchMap, els.countrySearch.value, selectCountryByIso);
  });
  els.citySearch.addEventListener("change", () => pickFromSearch(citySearchMap, els.citySearch.value, selectCityById));
  els.citySearch.addEventListener("keydown", (event) => {
    if (event.key === "Enter") pickFromSearch(citySearchMap, els.citySearch.value, selectCityById);
  });
}

function init() {
  populateYears();
  populateAges();
  const ready = window.WB_ADMIN0_GEOJSON
    ? Promise.resolve(window.WB_ADMIN0_GEOJSON)
    : fetch("./geo/wb_admin0_simplified.geojson").then((response) => response.json());

  ready.then((json) => {
    geojson = json;
    updateCitySizeScale();
    populateCountries();
    populateCities();
    renderPanel();
    drawCountries();
    initEvents();
  });
}

init();
