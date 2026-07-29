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
  selectionContext: document.querySelector("#selectionContext"),
  avoidableInsight: document.querySelector("#avoidableInsight"),
  avoidableInsightValue: document.querySelector("#avoidableInsightValue"),
  avoidableProgressBar: document.querySelector("#avoidableProgressBar"),
  currentDeaths: document.querySelector("#currentDeaths"),
  currentDeathsInterval: document.querySelector("#currentDeathsInterval"),
  currentRate: document.querySelector("#currentRate"),
  currentRateInterval: document.querySelector("#currentRateInterval"),
  avoidableDeaths: document.querySelector("#avoidableDeaths"),
  avoidableDeathsInterval: document.querySelector("#avoidableDeathsInterval"),
  pm25: document.querySelector("#pm25"),
  ageTableWrap: document.querySelector("#ageTableWrap"),
  ageBreakdown: document.querySelector("#ageBreakdown"),
  sizeLegend: document.querySelector("#sizeLegend"),
  map: document.querySelector("#map"),
  mapTooltip: document.querySelector("#mapTooltip"),
  mapZoomIn: document.querySelector("#mapZoomIn"),
  mapZoomOut: document.querySelector("#mapZoomOut"),
  mapReset: document.querySelector("#mapReset"),
};

let year = "2020";
let ageKey = "post25";
let selectedCountry = null;
let selectedCity = null;
let geojson = null;
let countryFeaturesByIso = new Map();
let primaryCountryFeatureByIso = new Map();
let countryDataByIso = new Map();
let projectedCountryBoundsByIso = new Map();
let countrySearchMap = new Map();
let citySearchMap = new Map();
let citySizeScaleMax = 50000;
let mapWidth = 960;
let mapHeight = 480;
let projection = null;
let geoPath = null;
let currentZoom = d3.zoomIdentity;
let resizeFrame = null;

const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const one = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const pct = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 });
const rateFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

const isoAliases = { ADO: "AND", DRC: "COD", IMY: "IMN", ROM: "ROU", TMP: "TLS", WBG: "PSE" };
const focusGeometryCache = new WeakMap();
const featureAreaCache = new WeakMap();
const countryNameAliases = {
  ALA: "Aland Islands",
  BLM: "Saint Barthelemy",
  CIV: "Cote d'Ivoire",
  CUW: "Curacao",
  STP: "Sao Tome and Principe",
  TUR: "Turkey",
};
const countryFallbackNames = { TWN: "Taiwan", XGZ: "Gaza" };

const sphere = { type: "Sphere" };
const graticule = d3.geoGraticule().step([30, 30])();
const mapSvg = d3.select(els.map).append("svg").attr("role", "img").attr("aria-label", els.map.getAttribute("aria-label"));
const mapViewport = mapSvg.append("g").attr("class", "map-viewport");
const spherePath = mapViewport.append("path").attr("class", "world-sphere");
const graticulePath = mapViewport.append("path").attr("class", "map-graticule");
const countryGroup = mapViewport.append("g").attr("class", "country-layer");
const ndlsaGroup = mapViewport.append("g").attr("class", "ndlsa-layer");
const cityGroup = mapViewport.append("g").attr("class", "city-layer");
const outlinePath = mapViewport.append("path").attr("class", "world-outline");

const zoomBehavior = d3
  .zoom()
  .scaleExtent([1, 10])
  .translateExtent([
    [-mapWidth, -mapHeight],
    [mapWidth * 2, mapHeight * 2],
  ])
  .on("zoom", (event) => {
    currentZoom = event.transform;
    mapViewport.attr("transform", currentZoom);
    // The Robinson sphere outline is useful in the world view, but after a
    // country zoom it becomes a large rounded rectangle around the viewport.
    outlinePath.attr("visibility", currentZoom.k > 1.05 ? "hidden" : "visible");
    updateCityMarkerScale();
    hideMapTooltip();
  });

mapSvg.call(zoomBehavior).on("dblclick.zoom", null);

function yearData() {
  return DATA.years[year];
}

function ringSignedArea(ring) {
  let area = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const point = ring[index];
    const next = ring[index + 1];
    area += point[0] * next[1] - next[0] * point[1];
  }
  return area / 2;
}

function orientRingForD3(ring, isExterior) {
  const clockwise = ringSignedArea(ring) < 0;
  return clockwise === isExterior ? ring : ring.slice().reverse();
}

function rewindGeometryForD3(geometry) {
  if (!geometry) return geometry;
  if (geometry.type === "Polygon") {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map((ring, index) => orientRingForD3(ring, index === 0)),
    };
  }
  if (geometry.type === "MultiPolygon") {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map((polygon) =>
        polygon.map((ring, index) => orientRingForD3(ring, index === 0))
      ),
    };
  }
  if (geometry.type === "GeometryCollection") {
    return {
      ...geometry,
      geometries: geometry.geometries.map(rewindGeometryForD3),
    };
  }
  return geometry;
}

function rewindFeatureForD3(feature) {
  return {
    ...feature,
    geometry: rewindGeometryForD3(feature.geometry),
  };
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

function rebuildCountryDataLookup() {
  countryDataByIso = new Map(countries().map((country) => [country.iso3, country]));
}

function countryOptions() {
  const list = countries().slice();
  const seen = new Set(list.map((d) => d.iso3));
  cities().forEach((city) => {
    if (!seen.has(city.iso3)) {
      const virtualCountry = countryByIso(city.iso3);
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
  if (!iso3) return null;
  if (countryDataByIso.has(iso3)) return countryDataByIso.get(iso3);
  const virtualCountry = makeVirtualCountry(iso3);
  if (virtualCountry) countryDataByIso.set(iso3, virtualCountry);
  return virtualCountry;
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

function formatPopulationContext(value) {
  if (value == null) return "--";
  if (value >= 1_000_000_000) return `${one.format(value / 1_000_000_000)} billion`;
  if (value >= 1_000_000) return `${one.format(value / 1_000_000)} million`;
  return formatNumber(value);
}

function formatAreaContext(value) {
  if (value == null) return "--";
  if (value >= 1_000_000) return `${one.format(value / 1_000_000)} million km²`;
  return formatArea(value);
}

function renderSelectionContext(items) {
  els.selectionContext.replaceChildren(
    ...items.map(({ text, highlight = false, prominent = false }) => {
      const item = document.createElement(highlight ? "strong" : "span");
      item.className = highlight
        ? `selection-context-highlight${prominent ? " selection-context-prominent" : ""}`
        : "selection-context-item";
      item.textContent = text;
      return item;
    })
  );
}

function drawNdlsa() {
  const features = window.WB_NDLSA_GEOJSON
    ? window.WB_NDLSA_GEOJSON.features.map(rewindFeatureForD3)
    : [];
  ndlsaGroup
    .selectAll("path")
    .data(features)
    .join("path")
    .attr("class", "ndlsa-shape")
    .attr("d", geoPath)
    .attr("fill", "#d8dfdc")
    .attr("fill-opacity", 0.72)
    .attr("stroke", "#5f6b66")
    .attr("stroke-width", 1.3)
    .attr("stroke-dasharray", "5 4")
    .attr("tabindex", 0)
    .attr("role", "button")
    .attr("aria-label", (feature) => {
      const name = cleanDisplayName(feature.properties.NAM_0 || "Non-determined legal status area");
      return `${name}, World Bank non-determined legal status area`;
    })
    .on("pointerenter pointermove", function (event, feature) {
      const name = cleanDisplayName(feature.properties.NAM_0 || "Non-determined legal status area");
      showMapTooltip(
        `<strong>${name}</strong><span>World Bank non-determined legal status area<br>Excluded from country area and population masks</span>`,
        event
      );
    })
    .on("pointerleave", hideMapTooltip)
    .on("focus", function (event, feature) {
      const name = cleanDisplayName(feature.properties.NAM_0 || "Non-determined legal status area");
      showMapTooltip(
        `<strong>${name}</strong><span>World Bank non-determined legal status area<br>Excluded from country area and population masks</span>`,
        event,
        this
      );
    })
    .on("blur", hideMapTooltip);
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
    weight: active ? 3 : 0.8,
    fillColor: colorForShare(metric ? metric.avoidableShare : null),
    fillOpacity: d ? 0.82 : 0.28,
  };
}

function countryTooltip(country, fallbackName) {
  const metric = countryMetric(country);
  const name = country ? countryName(country) : cleanDisplayName(fallbackName);
  if (!country || !metric) return `<strong>${name}</strong><span>No modeled data</span>`;
  return `<strong>${name}</strong><span>Attributable mortality rate: ${formatRate(metric.currentRatePer100k)} per 100,000<br>${formatInterval(metric.currentRatePer100kLow, metric.currentRatePer100kHigh, formatRate)}<br>Avoidable rate at 5 μg/m³: ${formatRate(metric.avoidableRatePer100k)} per 100,000<br>Attributable deaths/year: ${formatNumber(metric.currentDeaths)}<br>Avoidable deaths/year: ${formatNumber(metric.avoidableDeaths)}<br>Avoidable share: ${formatPercent(metric.avoidableShare)}<br>Fractional-mask population: ${formatNumber(country.population)}<br>Fractional land area: ${formatArea(country.fractionalLandAreaKm2)}</span>`;
}

function cityTooltip(city) {
  return `<strong>${cityName(city)}</strong><span>3 × 3 city-centered window; adults 25+ only<br>Circle is not a city boundary or the window footprint<br>Population-weighted PM₂.₅: ${formatOne(city.pm25)} μg/m³<br>Attributable mortality rate: ${formatRate(city.currentRatePer100k)} per 100,000<br>${formatInterval(city.currentRatePer100kLow, city.currentRatePer100kHigh, formatRate)}<br>Avoidable rate at 5 μg/m³: ${formatRate(city.avoidableRatePer100k)} per 100,000<br>Attributable deaths/year: ${formatNumber(city.currentDeaths)}<br>Avoidable deaths/year: ${formatNumber(city.avoidableDeaths)}<br>Avoidable share: ${formatPercent(city.avoidableShare)}<br>Actual window area: ${formatArea(city.windowAreaKm2)}<br>Valid PM₂.₅ cells: ${formatNumber(city.validPm25Cells)} of ${formatNumber(city.windowCells)}</span>`;
}

function showMapTooltip(html, event, anchor = null) {
  els.mapTooltip.innerHTML = html;
  els.mapTooltip.hidden = false;

  const mapRect = els.map.getBoundingClientRect();
  const anchorRect = anchor ? anchor.getBoundingClientRect() : null;
  const rawX = anchorRect ? anchorRect.left + anchorRect.width / 2 : event.clientX;
  const rawY = anchorRect ? anchorRect.top + anchorRect.height / 2 : event.clientY;
  const tooltipWidth = els.mapTooltip.offsetWidth;
  const tooltipHeight = els.mapTooltip.offsetHeight;
  const left = Math.max(8, Math.min(rawX - mapRect.left + 14, mapRect.width - tooltipWidth - 8));
  const top = Math.max(8, Math.min(rawY - mapRect.top + 14, mapRect.height - tooltipHeight - 8));

  els.mapTooltip.style.left = `${left}px`;
  els.mapTooltip.style.top = `${top}px`;
}

function hideMapTooltip() {
  els.mapTooltip.hidden = true;
}

function activateOnKeyboard(event, callback) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  callback();
}

function updateCityMarkerScale() {
  cityGroup.selectAll("circle").attr("r", function () {
    return Number(this.dataset.baseRadius || 0) / currentZoom.k;
  });
}

function mapTransformForBounds(bounds, maxZoom) {
  const [[x0, y0], [x1, y1]] = bounds;
  const dx = Math.max(1, x1 - x0);
  const dy = Math.max(1, y1 - y0);
  const scale = Math.min(maxZoom, 0.82 / Math.max(dx / mapWidth, dy / mapHeight));
  const centerX = (x0 + x1) / 2;
  const centerY = (y0 + y1) / 2;
  return d3.zoomIdentity
    .translate(mapWidth / 2, mapHeight / 2)
    .scale(Math.max(1, scale))
    .translate(-centerX, -centerY);
}

function focusGeometry(feature) {
  if (!feature || feature.geometry.type !== "MultiPolygon") return feature;
  if (focusGeometryCache.has(feature)) return focusGeometryCache.get(feature);

  let largestPolygon = null;
  let largestArea = -Infinity;
  feature.geometry.coordinates.forEach((polygon) => {
    const area = d3.geoArea({ type: "Polygon", coordinates: polygon });
    if (area > largestArea) {
      largestPolygon = polygon;
      largestArea = area;
    }
  });
  const focused = {
    type: "Feature",
    properties: feature.properties,
    geometry: { type: "Polygon", coordinates: largestPolygon },
  };
  focusGeometryCache.set(feature, focused);
  return focused;
}

function featureArea(feature) {
  if (featureAreaCache.has(feature)) return featureAreaCache.get(feature);
  const area = d3.geoArea(feature);
  featureAreaCache.set(feature, area);
  return area;
}

function primaryCountryFeature(features) {
  if (!features || !features.length) return null;
  const memberStates = features.filter(
    (feature) =>
      String(feature.properties.WB_STATUS || "")
        .trim()
        .toLowerCase() === "member state"
  );
  const candidates = memberStates.length ? memberStates : features;
  return candidates.reduce((largest, feature) =>
    !largest || featureArea(feature) > featureArea(largest) ? feature : largest
  );
}

function cacheProjectedCountryBounds(paths) {
  projectedCountryBoundsByIso = new Map();
  const pathByFeature = new WeakMap();
  paths.each(function (feature) {
    pathByFeature.set(feature, this);
  });
  primaryCountryFeatureByIso.forEach((feature, iso3) => {
    const path = pathByFeature.get(feature);
    if (!path) return;
    const box = path.getBBox();
    const crossesMap = box.width > mapWidth * 0.75;
    const bounds = crossesMap
      ? geoPath.bounds(focusGeometry(feature))
      : [
          [box.x, box.y],
          [box.x + box.width, box.y + box.height],
        ];
    projectedCountryBoundsByIso.set(iso3, bounds);
  });
}

function applyMapTransform(transform, animate = true) {
  const target = animate ? mapSvg.transition().duration(500) : mapSvg;
  target.call(zoomBehavior.transform, transform);
}

function zoomToCountry(iso3) {
  const feature = primaryCountryFeatureByIso.get(iso3);
  if (feature) {
    const bounds =
      projectedCountryBoundsByIso.get(iso3) || geoPath.bounds(focusGeometry(feature));
    projectedCountryBoundsByIso.set(iso3, bounds);
    applyMapTransform(mapTransformForBounds(bounds, 5));
    return;
  }

  const points = cities()
    .filter((d) => d.iso3 === iso3 && d.lat != null && d.lng != null)
    .map((d) => projection([d.lng, d.lat]))
    .filter(Boolean);
  if (!points.length) return;
  const xExtent = d3.extent(points, (point) => point[0]);
  const yExtent = d3.extent(points, (point) => point[1]);
  applyMapTransform(
    mapTransformForBounds(
      [
        [xExtent[0], yExtent[0]],
        [xExtent[1], yExtent[1]],
      ],
      7
    )
  );
}

function zoomToCity(city, animate = true) {
  if (!city || city.lat == null || city.lng == null) return;
  const point = projection([city.lng, city.lat]);
  if (!point) return;
  const scale = Math.max(currentZoom.k, 7);
  const transform = d3.zoomIdentity
    .translate(mapWidth / 2, mapHeight / 2)
    .scale(Math.min(scale, 10))
    .translate(-point[0], -point[1]);
  applyMapTransform(transform, animate);
}

function resetMapView(animate = true) {
  applyMapTransform(d3.zoomIdentity, animate);
}

function renderMapLayout() {
  const bounds = els.map.getBoundingClientRect();
  mapWidth = Math.max(320, Math.round(bounds.width));
  mapHeight = Math.max(160, Math.round(bounds.height));
  mapSvg.attr("viewBox", `0 0 ${mapWidth} ${mapHeight}`);

  projection = d3
    .geoRobinson()
    .fitExtent(
      [
        [18, 18],
        [mapWidth - 18, mapHeight - 18],
      ],
      sphere
    );
  geoPath = d3.geoPath(projection);

  zoomBehavior
    .extent([
      [0, 0],
      [mapWidth, mapHeight],
    ])
    .translateExtent([
      [-mapWidth, -mapHeight],
      [mapWidth * 2, mapHeight * 2],
    ]);

  spherePath.attr("d", geoPath(sphere));
  graticulePath.attr("d", geoPath(graticule));
  outlinePath.attr("d", geoPath(sphere));

  if (!geojson) return;
  drawCountries(true);
  drawNdlsa();
  drawCities();
  resetMapView(false);
  if (selectedCity) zoomToCity(selectedCity, false);
  else if (selectedCountry) {
    const feature = primaryCountryFeatureByIso.get(selectedCountry.iso3);
    if (feature) {
      const bounds =
        projectedCountryBoundsByIso.get(selectedCountry.iso3) ||
        geoPath.bounds(focusGeometry(feature));
      applyMapTransform(mapTransformForBounds(bounds, 5), false);
    }
  }
}

function scheduleMapLayout() {
  if (resizeFrame != null) cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => {
    resizeFrame = null;
    renderMapLayout();
  });
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

function indexCountryFeatures() {
  countryFeaturesByIso = new Map();
  geojson.features.forEach((feature) => {
    const iso3 = featureIso(feature);
    if (!countryFeaturesByIso.has(iso3)) countryFeaturesByIso.set(iso3, []);
    countryFeaturesByIso.get(iso3).push(feature);
  });
  primaryCountryFeatureByIso = new Map();
  countryFeaturesByIso.forEach((features, iso3) => {
    primaryCountryFeatureByIso.set(iso3, primaryCountryFeature(features));
  });
}

function drawCountries(projectGeometry = false) {
  const paths = countryGroup
    .selectAll("path")
    .data(geojson.features)
    .join((enter) =>
      enter
        .append("path")
        .attr("class", "country-shape")
        .attr("tabindex", 0)
        .attr("role", "button")
        .attr("aria-label", (feature) => {
          const d = countryByIso(featureIso(feature));
          const name = d ? countryName(d) : cleanDisplayName(feature.properties.NAM_0);
          return d ? `Select ${name}` : `${name}, no modeled data`;
        })
        .on("pointerenter pointermove", function (event, feature) {
          const d = countryByIso(featureIso(feature));
          showMapTooltip(countryTooltip(d, feature.properties.NAM_0), event);
        })
        .on("pointerleave", hideMapTooltip)
        .on("focus", function (event, feature) {
          const d = countryByIso(featureIso(feature));
          showMapTooltip(countryTooltip(d, feature.properties.NAM_0), event, this);
        })
        .on("blur", hideMapTooltip)
        .on("click", (event, feature) => {
          const d = countryByIso(featureIso(feature));
          if (d) selectCountryByIso(d.iso3);
        })
        .on("keydown", (event, feature) => {
          const d = countryByIso(featureIso(feature));
          if (d) activateOnKeyboard(event, () => selectCountryByIso(d.iso3));
        })
    );

  if (projectGeometry) {
    paths.attr("d", geoPath);
    cacheProjectedCountryBounds(paths);
  }

  paths.each(function (feature) {
    const style = countryStyle(feature);
    d3.select(this)
      .attr("fill", style.fillColor)
      .attr("fill-opacity", style.fillOpacity)
      .attr("stroke", style.color)
      .attr("stroke-width", style.weight);
  });
}

function drawCities() {
  const list = selectedCountry ? cities().filter((d) => d.iso3 === selectedCountry.iso3) : [];
  const sorted = list
    .slice()
    .sort(
      (a, b) =>
        Number(Boolean(selectedCity) && a.id === selectedCity.id) -
        Number(Boolean(selectedCity) && b.id === selectedCity.id)
    );

  const groups = cityGroup
    .selectAll("g.city-point")
    .data(sorted, (city) => city.id)
    .join("g")
    .attr("class", "city-point")
    .attr("transform", (city) => {
      const point = projection([city.lng, city.lat]);
      return point ? `translate(${point[0]},${point[1]})` : "translate(-9999,-9999)";
    });

  groups.each(function (city) {
    const group = d3.select(this);
    group.selectAll("*").remove();
      const isSelected = Boolean(selectedCity) && selectedCity.id === city.id;
      const radius = radiusForCity(city);
      if (isSelected) {
      group
        .append("circle")
        .attr("class", "city-marker city-marker-halo")
        .attr("data-base-radius", radius + 3)
        .attr("r", (radius + 3) / currentZoom.k)
        .attr("fill", "#000000")
        .attr("stroke", "#000000")
        .attr("stroke-width", 1)
        .attr("vector-effect", "non-scaling-stroke")
        .attr("pointer-events", "none");
      }
    group
      .append("circle")
      .attr("class", "city-marker")
      .attr("data-base-radius", radius)
      .attr("r", radius / currentZoom.k)
      .attr("fill", colorForShare(city.avoidableShare))
      .attr("fill-opacity", 0.86)
      .attr("stroke", isSelected ? "#ffeb3b" : "#ffffff")
      .attr("stroke-width", isSelected ? 3 : 0.7)
      .attr("vector-effect", "non-scaling-stroke")
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr("aria-label", `Select ${cityName(city)}`)
      .on("pointerenter pointermove", (event) => showMapTooltip(cityTooltip(city), event))
      .on("pointerleave", hideMapTooltip)
      .on("focus", function (event) {
        showMapTooltip(cityTooltip(city), event, this);
      })
      .on("blur", hideMapTooltip)
      .on("click", () => selectCityById(city.id, { zoom: false }))
      .on("keydown", (event) =>
        activateOnKeyboard(event, () => selectCityById(city.id, { zoom: false }))
      );
  });
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
  if (useCity) {
    renderSelectionContext([
      { text: "Adults 25+" },
      { text: "3 × 3 modeled window" },
      {
        text: `Window area ${formatArea(selectedCity.windowAreaKm2)}`,
        highlight: true,
        prominent: true,
      },
    ]);
  } else if (selectedCountry) {
    const context = [];
    if (selectedCountry.population != null) {
      context.push({
        text: `Population ${formatPopulationContext(selectedCountry.population)}`,
      });
    }
    if (selectedCountry.fractionalLandAreaKm2 != null) {
      context.push({
        text: `Land area ${formatAreaContext(selectedCountry.fractionalLandAreaKm2)}`,
      });
    }
    context.push({
      text: `${formatNumber(cities().filter((d) => d.iso3 === selectedCountry.iso3).length)} modeled cities`,
      highlight: true,
    });
    renderSelectionContext(context);
  } else {
    renderSelectionContext([
      { text: "Choose a location to view its exposure and health burden." },
    ]);
  }

  const avoidableShare = metric ? metric.avoidableShare : null;
  els.avoidableInsight.classList.toggle("is-hidden", avoidableShare == null);
  els.avoidableInsightValue.textContent = formatPercent(avoidableShare);
  els.avoidableProgressBar.style.width =
    avoidableShare == null ? "0%" : `${Math.max(0, Math.min(100, avoidableShare * 100))}%`;
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
  els.pm25.textContent = !item || item.pm25 == null ? "--" : `${formatOne(item.pm25)} μg/m³`;
  renderAgeTable(useCity ? null : selectedCountry);
}

function refresh() {
  const selectedIso = selectedCountry ? selectedCountry.iso3 : null;
  rebuildCountryDataLookup();
  selectedCountry = selectedIso ? countryByIso(selectedIso) : null;
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
  els.mapZoomIn.addEventListener("click", () => {
    mapSvg.transition().duration(250).call(zoomBehavior.scaleBy, 1.5);
  });
  els.mapZoomOut.addEventListener("click", () => {
    mapSvg.transition().duration(250).call(zoomBehavior.scaleBy, 1 / 1.5);
  });
  els.mapReset.addEventListener("click", () => resetMapView());

  if ("ResizeObserver" in window) {
    new ResizeObserver(scheduleMapLayout).observe(els.map);
  } else {
    window.addEventListener("resize", scheduleMapLayout);
  }
}

function init() {
  populateYears();
  populateAges();
  rebuildCountryDataLookup();
  renderMapLayout();
  const ready = window.WB_ADMIN0_GEOJSON
    ? Promise.resolve(window.WB_ADMIN0_GEOJSON)
    : fetch("./geo/wb_admin0_simplified.geojson").then((response) => response.json());

  ready.then((json) => {
    geojson = {
      ...json,
      features: json.features.map(rewindFeatureForD3),
    };
    indexCountryFeatures();
    updateCitySizeScale();
    populateCountries();
    populateCities();
    renderPanel();
    renderMapLayout();
    initEvents();
  });
}

init();
