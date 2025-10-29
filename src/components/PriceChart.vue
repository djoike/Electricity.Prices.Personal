<!-- src/components/PriceChart.vue -->
<script setup lang="ts">
import { computed, watch, ref, onMounted, onBeforeUnmount } from 'vue';
import { Bar } from 'vue-chartjs';
import {
  Chart,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

import type { UiPoint } from '../lib/api';
import { formatPriceDKK } from '../lib/format';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, ChartDataLabels);

const props = defineProps<{ points: UiPoint[] }>();

// Color helpers (Tailwind-ish palette)
const COLORS = {
  red: '#ef4444', redF: 'rgba(239, 68, 68, 0.45)',
  green: '#22c55e', greenF: 'rgba(34, 197, 94, 0.45)',
  yellow: '#f59e0b', yellowF: 'rgba(245, 158, 11, 0.45)',
  currentBorder: getComputedStyle(document.documentElement).getPropertyValue('--current-border')?.trim() || '#ffd166',
};

const isDark = ref<boolean>(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
let mq: MediaQueryList | null = null;

const tickColor = ref<string>(isDark.value ? '#e6eef7' : '#111827');
const gridColor = ref<string>(isDark.value ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)');

onMounted(() => {
  if (window.matchMedia) {
    mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      isDark.value = mq!.matches;
      tickColor.value = isDark.value ? '#e6eef7' : '#111827';
      gridColor.value = isDark.value ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
    };
    mq.addEventListener?.('change', handler);
    onBeforeUnmount(() => mq?.removeEventListener?.('change', handler));
  }
});

const labels = computed(() => props.points.map(p => p.label));

function classifyColors(points: UiPoint[]) {
  const arr = points.map((p, i) => ({ i, price: p.price }));
  const asc = [...arr].sort((a, b) => a.price - b.price);
  const lows = new Set(asc.slice(0, 3).map(x => x.i));
  const highs = new Set(asc.slice(-3).map(x => x.i));

  const bg: string[] = [];
  const border: string[] = [];
  const bwidth: number[] = [];

  points.forEach((p, i) => {
    const base = lows.has(i) ? COLORS.green : highs.has(i) ? COLORS.red : COLORS.yellow;
    const baseF = lows.has(i) ? COLORS.greenF : highs.has(i) ? COLORS.redF : COLORS.yellowF;
    bg.push(p.isForecast ? baseF : base);
    border.push(p.isCurrentHour ? COLORS.currentBorder : 'rgba(0,0,0,0)');
    bwidth.push(p.isCurrentHour ? 2 : 0);
  });
  return { bg, border, bwidth };
}

const data = computed(() => {
  const cls = classifyColors(props.points);
  const prices = props.points.map(p => p.price);
  return {
    labels: labels.value,
    datasets: [{
      label: 'Elpris',
      data: prices,
      backgroundColor: cls.bg,
      borderColor: cls.border,
      borderWidth: cls.bwidth,
      hoverBackgroundColor: cls.bg,
      datalabels: {
        anchor: 'end',
        align: 'end',
        offset: 2,
        formatter: (v: number) => formatPriceDKK(v),
        color: tickColor.value,
        clip: false,
      },
    }],
  };
});

const options = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: any) => formatPriceDKK(ctx.parsed.y),
      },
    },
    datalabels: {
      // enabled via dataset settings
    },
  },
  scales: {
    x: {
      ticks: {
        color: tickColor.value,
        maxRotation: 0,
        autoSkip: true,
        autoSkipPadding: 10,
      },
      grid: { display: false },
    },
    y: {
      beginAtZero: true,
      grid: { color: gridColor.value },
      ticks: {
        color: tickColor.value,
        callback: (v: any) => formatPriceDKK(Number(v)),
      },
    },
  },
}));

// Trigger reactive updates when points or theme change
watch(() => [props.points, tickColor.value, gridColor.value], () => {});
</script>

<template>
  <div class="chart-wrap">
    <Bar :data="data" :options="options" />
  </div>
</template>

<style scoped>
.chart-wrap { height: 100%; }
</style>
