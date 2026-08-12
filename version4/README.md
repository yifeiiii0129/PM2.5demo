# PM₂.₅ Mortality Explorer — Web Demo Version 4

Version 4 is a GitHub-ready snapshot of the current Robinson-projection website,
copied from Version 3. The earlier version directories remain unchanged.

Run locally from this folder:

```bash
python -m http.server 8765 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:8765/
```

Main files:

- `index.html`: page layout
- `app_v4.js`: map interaction, selectors, legends, country/city panels
- `styles.css`: visual styling
- `assets/data.js`: generated 2020–2023 PM₂.₅ + GEMM mortality data
- `geo/wb_admin0_simplified.geojson`: simplified World Bank Admin0 boundaries
- `downloads/`: downloadable country, city-centered, and window-sensitivity CSV files

Data build steps remain in the Version 2 source tree:

1. Build the fractional country masks from the project root:

   ```bash
   python processing/build_fractional_country_masks.py \
     --grid "web_demo_version2/data/country mask/admin0/wb_admin0_iso3_codes_025x025.nc" \
     --boundaries "web_demo_version2/data/map boundary/world bank official boundaries/World Bank Official Boundaries - Admin 0/WB_GAD_ADM0.shp" \
     --ndlsa "web_demo_version2/data/map boundary/world bank official boundaries/World Bank Official Boundaries - NDLSA/WB_GAD_ADM0_NDLSA.shp" \
     --country-table "web_demo_version2/data/country mask/admin0/wb_admin0_iso3_codes_025x025.country_table.csv" \
     --population "web_demo_version2/data/population/gpw-v4-population-count-adjusted-to-2015-unwpp-country-totals-rev11_2020_30_sec_tif/gpw_v4_population_count_adjusted_to_2015_unwpp_country_totals_rev11_2020_30_sec.tif" \
     --out "web_demo_version2/data/country mask/admin0/wb_admin0_fractional_masks_025x025.nc"
   ```

2. `../processing/prepare_version2_gemm_inputs.py`
3. `../../Impacts-master/ORGANIZED/impacts_driver/impacts_driver.py ../model_inputs/version2_current.yaml`
4. `../../Impacts-master/ORGANIZED/impacts_driver/impacts_driver.py ../model_inputs/version2_who5cf.yaml`
5. `build_version2_mortality_web_data.py`

Country PM₂.₅ uses exact polygon/grid-cell area fractions. Country population
and gridded mortality use the GPW 2020 30 arc-second population-weighted mask.
World Bank NDLSA polygons remain separate and unassigned. The fine-grid
aggregation design follows
[Drew Pendergrass' masking utility](https://github.com/drewpendergrass/masking).
When several Admin 0 features share an ISO code, the country display name
prefers the feature whose `WB_STATUS` is `Member State`; source order is used
only as the final fallback.

The corrected model outputs are written to `model_outputs/current_validpm` and
`model_outputs/who5cf_validpm`. The preprocessing step excludes the source
PM₂.₅ value `-999` before normalized linear interpolation; output cells without
valid source support remain zero only for compatibility with the legacy GEMM
driver. `PM25_source_weight` records which output cells have valid source
support.

City-centered method:

- Eligible populated places have source population above 500,000.
- Each estimate uses the model cell nearest the city coordinate and the eight
  surrounding cells (a 3 × 3 window on the 0.25° grid). At 35° latitude, the
  window covers approximately 75 x 75 km, or 5,700 km².
- Administrative extents vary widely: Paris proper is approximately 105 km²;
  New York City approximately 783 km²; Beijing municipality approximately
  16,410 km²; Shanghai municipality approximately 6,340 km²; and Shenzhen
  approximately 1,997 km². Exact values depend on the boundary definition and
  treatment of water.
- Because the fixed window is not clipped to administrative boundaries, it may
  overrepresent surrounding areas for compact cities and underrepresent the
  full extent of geographically large municipalities. Results are
  city-centered metropolitan region estimates, not city-boundary totals.
- Annual deaths are summed. City PM₂.₅ is population-weighted over cells with
  valid source support and population.
- City mortality rates use the estimated population aged 25+ in the window as
  their denominator and are reported per 100,000 people.
- The payload includes the GEMM mean and 5th/95th percentiles, displayed as a
  90% uncertainty interval. These intervals represent uncertainty in the GEMM
  concentration-response parameters, not all input or spatial uncertainties.
- Non-finite mortality cells are excluded without rescaling.
- Circles mark coordinates only. Five discrete colors encode avoidable share
  and circle area uses a square-root scale for avoidable deaths/year based on
  the selected year's data range; neither encodes a city boundary or window
  area. Nearby windows can overlap.
- Actual window area is calculated from latitude/longitude cell bounds and is
  included for every city.

Run the sensitivity analysis after the two GEMM scenarios finish:

```bash
python ../analysis/analyze_city_window_sensitivity.py
```

It writes all-city values and ranks, a representative coastal/inland subset,
window correlations, and method metadata under
`../analysis/city_window_sensitivity_results/`.

Projection decision: the interactive world map uses the Robinson projection
with vector boundaries, an outline of the sphere, and a light graticule. The
projection is fitted responsively to the available map extent. Geographic
calculations and city-window areas continue to use the original
latitude-longitude grid and do not depend on the display projection.

Notes:

- Country panels include age-specific rates, counts, avoidable shares, and
  uncertainty intervals.
- City panels show adults aged 25+ only. The age selector is disabled and the
  age-breakdown table is hidden while a city is selected.
- Population is fixed at GPW 2020 and age structure at SSP1 2015 in every
  displayed year, so year-to-year changes should not be interpreted as complete
  demographic trends.
- The browser payload includes 1,430 populated places above the 500,000
  source-population threshold whose modeled 3 × 3 window has a non-zero
  population aged 25+.
