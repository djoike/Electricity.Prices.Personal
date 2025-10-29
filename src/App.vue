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
      // Save in sessionStorage to reduce flicker on quick tab switches
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

onMounted(() => {
  // Try load from cache first (valid for 2 minutes)
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

  const teardown = setupRefresh(load);
  onBeforeUnmount(() => teardown());
});
</script>

<template>
  <div class="container">
    <div class="hot-corner" aria-hidden="true"></div>

    <header class="card">
      <HeaderInfo :last-updated="lastUpdated" />
    </header>

    <main class="card" style="min-height: 40vh;">
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
/* Scoped extras (keep global styles in SCSS) */
</style>