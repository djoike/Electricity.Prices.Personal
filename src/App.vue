<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import PriceChart from './components/PriceChart.vue';
import HeaderInfo from './components/HeaderInfo.vue';
import { fetchPrices, mapToUi, type UiPoint } from './lib/api';
import { setupRefresh } from './lib/refresh';

const points = ref<UiPoint[]>([]);
const loading = ref<boolean>(false);
const error = ref<string | null>(null);
const lastUpdated = ref<Date | null>(null);

async function load() {
  error.value = null;
  loading.value = true;
  const controller = new AbortController();
  try {
    const raw = await fetchPrices(controller.signal);
    const mapped = mapToUi(raw);
    if (mapped.length) {
      points.value = mapped;
      lastUpdated.value = new Date();
      sessionStorage.setItem('prices-cache', JSON.stringify({ data: raw, ts: Date.now() }));
    } else {
      points.value = [];
    }
  } catch (e: any) {
    error.value = e?.message ?? 'Fejl';
  } finally {
    loading.value = false;
  }
}

let intervalId: number | null = null;

onMounted(() => {
  // Load from cache (valid for 2 minutes)
  const cached = sessionStorage.getItem('prices-cache');
  if (cached) {
    try {
      const obj = JSON.parse(cached);
      if (obj && Array.isArray(obj.data) && typeof obj.ts === 'number' && Date.now() - obj.ts < 120000) {
        points.value = mapToUi(obj.data);
        lastUpdated.value = new Date(obj.ts);
      }
    } catch {}
  }

  load();

  // Refresh on tab focus and on hidden hot-corner tap
  const teardown = setupRefresh(load);

  // 🔁 Also refresh every 30 seconds
  intervalId = window.setInterval(load, 30000);

  onBeforeUnmount(() => {
    teardown();
    if (intervalId != null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  });
});
</script>

<template>
  <div class="container">
    <div class="hot-corner" aria-hidden="true"></div>

    <header class="card">
      <HeaderInfo :last-updated="lastUpdated" />
    </header>

    <main class="card">
      <div v-if="error" class="error">Kunne ikke hente priser: {{ error }}</div>
      <div v-else-if="loading && !points.length">Henter priser…</div>
      <PriceChart v-else :points="points" />
    </main>

    <footer class="footer">
      <div>Data: stromligning.dk</div>
      <div>Tryk øverste højre hjørne for at opdatere</div>
    </footer>
  </div>
</template>

<style scoped>
/* keep scoped empty; styles in SCSS files */
</style>
