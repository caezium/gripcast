<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import L from "leaflet";
  import { overpassBBox } from "../lib/geo";

  export let lat = 45.42;
  export let lon = 10.5;
  export let active = false;
  const dispatch = createEventDispatcher();

  let el: HTMLDivElement;
  let map: L.Map | null = null;
  let layer: L.LayerGroup;
  let loading = false;
  let deb: any;

  function init() {
    if (map || !el) return;
    map = L.map(el, { zoomControl: true, attributionControl: true }).setView([lat, lon], 11);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 19, subdomains: "abcd", attribution: "&copy; OpenStreetMap &copy; CARTO" }).addTo(map);
    layer = L.layerGroup().addTo(map);
    map.on("moveend", () => { clearTimeout(deb); deb = setTimeout(load, 450); });
    load();
  }
  async function load() {
    if (!map) return;
    if (map.getZoom() < 7) return;
    const b = map.getBounds();
    loading = true;
    try {
      const tracks = await overpassBBox({ s: b.getSouth(), w: b.getWest(), n: b.getNorth(), e: b.getEast() }, 60);
      layer.clearLayers();
      tracks.forEach((tk) => {
        const m = L.marker([tk.lat, tk.lon], { icon: L.divIcon({ className: "", html: `<div class="mk">🏁</div>`, iconSize: [22, 22], iconAnchor: [11, 18] }) });
        m.bindTooltip(tk.name, { direction: "top" });
        m.on("click", () => dispatch("select", { lat: tk.lat, lon: tk.lon, name: tk.name }));
        layer.addLayer(m);
      });
    } catch {} finally { loading = false; }
  }
  onMount(init);
  onDestroy(() => { map?.remove(); map = null; });
  $: if (active && map) { setTimeout(() => { map!.invalidateSize(); map!.setView([lat, lon], 11); load(); }, 60); }
</script>

<div id="map" bind:this={el}>
  <div class="maphint" class:loading><span class="ms"></span><span>pan the map — circuits load automatically</span></div>
</div>
