const DATA = window.PM25_DATA;
const svg = document.querySelector("#map");
const tooltip = document.querySelector("#tooltip");
const buttons = [...document.querySelectorAll(".mode-button")];

const els = {
  modeTitle: document.querySelector("#modeTitle"),
  modeSubtitle: document.querySelector("#modeSubtitle"),
  selectionType: document.querySelector("#selectionType"),
  selectionName: document.querySelector("#selectionName"),
  currentDeaths: document.querySelector("#currentDeaths"),
  avoidableDeaths: document.querySelector("#avoidableDeaths"),
  avoidableShare: document.querySelector("#avoidableShare"),
  detailLevel: document.querySelector("#detailLevel"),
  detailLocation: document.querySelector("#detailLocation"),
};

let mode = "country";
let selectedKey = "";

const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const pct = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

const maxCountryAvoidable = Math.max(...DATA.countries.map((d) => d.avoidableDeaths || 0));
const maxCityAvoidable = Math.max(...DATA.cities.map((d) => d.avoidableDeaths || 0));

function project(lng, lat) {
  return {
    x: ((lng + 180) / 360) * 1000,
    y: ((90 - lat) / 180) * 560,
  };
}

function formatNumber(value) {
  return value == null ? "--" : fmt.format(value);
}

function formatPercent(value) {
  return value == null ? "--" : pct.format(value);
}

function colorForShare(share) {
  const s = Math.max(0, Math.min(1, share || 0));
  if (s < 0.45) return "#8fbfb1";
  if (s < 0.6) return "#3a9a83";
  if (s < 0.75) return "#0e7c66";
  return "#b8532f";
}

function radiusFor(value, max, min, maxRadius) {
  if (!value || !max) return min;
  return min + Math.sqrt(value / max) * (maxRadius - min);
}

function node(name, attrs = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  return el;
}

function drawBaseMap() {
  svg.innerHTML = "";

  for (let lng = -150; lng <= 150; lng += 30) {
    const a = project(lng, -70);
    const b = project(lng, 80);
    svg.appendChild(node("line", { class: "graticule", x1: a.x, y1: a.y, x2: b.x, y2: b.y }));
  }

  for (let lat = -60; lat <= 60; lat += 30) {
    const a = project(-180, lat);
    const b = project(180, lat);
    svg.appendChild(node("line", { class: "graticule", x1: a.x, y1: a.y, x2: b.x, y2: b.y }));
  }

  [
    "M135 170 C190 90 315 90 365 155 C415 220 325 275 235 265 C155 255 100 220 135 170 Z",
    "M250 285 C315 270 360 335 330 430 C300 520 220 505 205 415 C193 345 205 300 250 285 Z",
    "M430 130 C545 70 720 95 800 175 C870 245 800 315 680 292 C585 275 505 315 430 255 C365 202 370 158 430 130 Z",
    "M505 285 C565 255 640 305 650 390 C660 485 595 525 535 465 C485 415 455 320 505 285 Z",
    "M725 340 C805 310 900 340 930 405 C885 445 785 440 725 405 C690 382 690 355 725 340 Z",
    "M70 95 C120 65 175 75 205 110 C160 132 105 130 70 95 Z",
  ].forEach((d) => svg.appendChild(node("path", { class: "continent", d })));
}

function render() {
  drawBaseMap();
  if (mode === "country") renderCountries();
  if (mode === "city") renderCities();
}

function renderCountries() {
  els.modeTitle.textContent = "国家层面";
  els.modeSubtitle.textContent = "气泡放在国家城市加权中心，大小表示可减少死亡人数";
  els.selectionType.textContent = "请选择一个国家";
  els.detailLevel.textContent = "Country";

  DATA.countries
    .filter((d) => d.lat != null && d.lng != null)
    .sort((a, b) => (b.avoidableDeaths || 0) - (a.avoidableDeaths || 0))
    .forEach((d) => {
      const p = project(d.lng, d.lat);
      const r = radiusFor(d.avoidableDeaths, maxCountryAvoidable, 4, 34);
      const c = node("circle", {
        class: `bubble ${selectedKey === d.country ? "selected" : ""}`,
        cx: p.x,
        cy: p.y,
        r,
        fill: colorForShare(d.avoidableShare),
        opacity: 0.78,
        tabindex: 0,
      });
      c.addEventListener("mousemove", (event) => showTooltip(event, d.country, d));
      c.addEventListener("mouseleave", hideTooltip);
      c.addEventListener("click", () => selectCountry(d));
      c.addEventListener("keydown", (event) => {
        if (event.key === "Enter") selectCountry(d);
      });
      svg.appendChild(c);
    });
}

function renderCities() {
  els.modeTitle.textContent = "城市层面";
  els.modeSubtitle.textContent = "每个点是一座城市，旁边标注高影响城市名";
  els.selectionType.textContent = "请选择一个城市";
  els.detailLevel.textContent = "City";

  const topCities = new Set(
    [...DATA.cities]
      .sort((a, b) => (b.avoidableDeaths || 0) - (a.avoidableDeaths || 0))
      .slice(0, 55)
      .map((d) => `${d.city}|${d.country}`)
  );

  DATA.cities
    .filter((d) => d.lat != null && d.lng != null)
    .sort((a, b) => (a.avoidableDeaths || 0) - (b.avoidableDeaths || 0))
    .forEach((d) => {
      const p = project(d.lng, d.lat);
      const r = radiusFor(d.avoidableDeaths, maxCityAvoidable, 2.5, 18);
      const key = `${d.city}|${d.country}`;
      const c = node("circle", {
        class: `bubble ${selectedKey === key ? "selected" : ""}`,
        cx: p.x,
        cy: p.y,
        r,
        fill: colorForShare(d.avoidableShare),
        opacity: 0.72,
        tabindex: 0,
      });
      c.addEventListener("mousemove", (event) => showTooltip(event, d.city, d));
      c.addEventListener("mouseleave", hideTooltip);
      c.addEventListener("click", () => selectCity(d));
      c.addEventListener("keydown", (event) => {
        if (event.key === "Enter") selectCity(d);
      });
      svg.appendChild(c);

      if (topCities.has(key)) {
        svg.appendChild(
          node("text", {
            class: "city-label",
            x: p.x + r + 4,
            y: p.y + 4,
          })
        ).textContent = d.city_ascii || d.city;
      }
    });
}

function showTooltip(event, title, d) {
  tooltip.hidden = false;
  tooltip.innerHTML = `<strong>${title}</strong><span>可减少 ${formatNumber(
    d.avoidableDeaths
  )} 人，比例 ${formatPercent(d.avoidableShare)}</span>`;
  tooltip.style.left = `${event.clientX + 14}px`;
  tooltip.style.top = `${event.clientY + 14}px`;
}

function hideTooltip() {
  tooltip.hidden = true;
}

function selectCountry(d) {
  selectedKey = d.country;
  els.selectionType.textContent = "国家";
  els.selectionName.textContent = d.country;
  els.currentDeaths.textContent = formatNumber(d.currentDeaths);
  els.avoidableDeaths.textContent = formatNumber(d.avoidableDeaths);
  els.avoidableShare.textContent = formatPercent(d.avoidableShare);
  els.detailLevel.textContent = "Country";
  els.detailLocation.textContent = d.cityCount ? `${d.cityCount} 个城市用于定位` : "没有城市坐标";
  render();
}

function selectCity(d) {
  selectedKey = `${d.city}|${d.country}`;
  els.selectionType.textContent = "城市";
  els.selectionName.textContent = d.city || d.city_ascii;
  els.currentDeaths.textContent = formatNumber(d.currentDeaths);
  els.avoidableDeaths.textContent = formatNumber(d.avoidableDeaths);
  els.avoidableShare.textContent = formatPercent(d.avoidableShare);
  els.detailLevel.textContent = "City";
  els.detailLocation.textContent = `${d.country}${d.province ? `, ${d.province}` : ""}`;
  render();
}

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    mode = button.dataset.mode;
    selectedKey = "";
    buttons.forEach((item) => item.classList.toggle("active", item === button));
    els.selectionName.textContent = mode === "country" ? "Hover 或点击地图上的国家点" : "Hover 或点击地图上的城市点";
    els.currentDeaths.textContent = "--";
    els.avoidableDeaths.textContent = "--";
    els.avoidableShare.textContent = "--";
    els.detailLocation.textContent = "--";
    render();
  });
});

render();
