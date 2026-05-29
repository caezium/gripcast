import "leaflet/dist/leaflet.css";
import "./app.css";
import App from "./App.svelte";

const app = new App({ target: document.getElementById("app")! });

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(import.meta.env.BASE_URL + "sw.js").catch(() => {});
  });
}

export default app;

