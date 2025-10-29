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

// ---- Visual constants ----
const BAR_PX = 36;      // fixed bar width (px)
const GAP_PX = 10;      // spacing between bars
const CHART_HEIGHT = '70vh'; // height of the chart area

// ---- Palette ----
const COLORS = {
  red: '#ef4444', redF: 'rgba(239,68,68,0.45)',
  green: '#22c55e', greenF: 'rgba(34,197,94,0.45)',
  yellow: '#f59e0b', yellowF: 'rgba(245,158,11,0.45)',
  currentBorder: '#3b82f6', // blue for current hour
};

const isDark = ref<boolean>(
  window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
);
let mq: MediaQueryList | null = null;

const tickColor = ref<string>(isDark.value ? '#e6eef7' : '#111827');
const gridColor = ref<string>(isDark.value ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)');
const dayColor = computed(() =>
  isDark.value ? 'rgba(230,238,247,0.7)' : 'rgba(17,24,39,0.6)'
);

onMounted(() => {
  if (window.matchMedia) {
    mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      isDark.value = mq!.matches;
      tickColor.value = isDark.value ? '#e6eef7' : '#111827';
      gridColor.value = isDark.value
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(0,0,0,0.08)';
    };
    mq.addEventListener?.('change', handler);
    onBeforeUnmount(() => mq?.removeEventListener?.('change', handler));
  }
});

// ---- Horizontal scroll sizing ----
const windowWidth = ref<number>(
  typeof window !== 'undefined' ? window.innerWidth : 1024
);
function onResize() {
  windowWidth.value = window.innerWidth || 1024;
}
onMounted(() => window.addEventListener('resize', onResize, { passive: true }));
onBeforeUnmount(() => window.removeEventListener('resize', onResize));

// Total canvas width = bars * (bar width + gap)
const chartWidth = computed(() => {
  const n = Math.max(1, props.points.length);
  const vw = Math.max(320, windowWidth.value);
  return Math.max(vw, n * (BAR_PX + GAP_PX));
});

// ---- Color classification ----
function classifyColors(points: UiPoint[]) {
  const arr = points.map((p, i) => ({ i, price: p.price }));
  const asc = [...arr].sort((a, b) => a.price - b.price);
  const lows = new Set(asc.slice(0, 3).map(x => x.i));
  const highs = new Set(asc.slice(-3).map(x => x.i));

  const bg: string[] = [];
  const border: string[] = [];
  const bwidth: number[] = [];

  points.forEach((p, i) => {
    const base = lows.has(i)
      ? COLORS.green
      : highs.has(i)
      ? COLORS.red
      : COLORS.yellow;
    const baseF = lows.has(i)
      ? COLORS.greenF
      : highs.has(i)
      ? COLORS.redF
      : COLORS.yellowF;
    bg.push(p.isForecast ? baseF : base);
    border.push(p.isCurrentHour ? COLORS.currentBorder : 'rgba(0,0,0,0)');
    bwidth.push(p.isCurrentHour ? 2 : 0);
  });
  return { bg, border, bwidth };
}

// ---- Label helpers ----
function weekdayHourParts(iso: string) {
  const d = new Date(iso);
  const weekday = new Intl.DateTimeFormat('da-DK', {
    timeZone: 'Europe/Copenhagen',
    weekday: 'short',
  })
    .format(d)
    .toLowerCase();
  const hour = new Intl.DateTimeFormat('da-DK', {
    timeZone: 'Europe/Copenhagen',
    hour: '2-digit',
    hour12: false,
  }).format(d);
  return { weekday, hour };
}

const labels = computed(() => props.points.map(p => p.label));

const data = computed(() => {
  const cls = classifyColors(props.points);
  const prices = props.points.map(p => p.price);
  return {
    labels: labels.value,
    datasets: [
      {
        label: 'Elpris',
        data: prices,
        backgroundColor: cls.bg,
        borderColor: cls.border,
        borderWidth: cls.bwidth,
        barThickness: BAR_PX,
        maxBarThickness: BAR_PX,
        hoverBackgroundColor: cls.bg,
        datalabels: {
          anchor: 'end',
          align: 'end',
        },
      },
    ],
  };
});

// ---- Chart.js options ----
const options = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  layout: { padding: { top: 28 } },
  plugins: {
    legend: { display: false },
    tooltip: { enabled: false }, // 🔕 Disable hover tooltip
    datalabels: {
      labels: {
        // Price (top)
        price: {
          display: true,
          offset: 34,
          formatter: (_: any, ctx: any) => {
            const p = (ctx.chart.data.datasets[ctx.datasetIndex].data as number[])[
              ctx.dataIndex
            ];
            return formatPriceDKK(Number(p));
          },
          font: { weight: 'bold', size: 13 },
          color: () => tickColor.value,
          textAlign: 'center',
          clip: false,
        },
        // Time (middle)
        time: {
          display: true,
          offset: 20,
          formatter: (_: any, ctx: any) => {
            const ui = (ctx.chart.data as any).__uiPoints as
              | UiPoint[]
              | undefined;
            const { hour } =
              ui && ui[ctx.dataIndex]
                ? weekdayHourParts(ui[ctx.dataIndex].iso)
                : weekdayHourParts((props.points[ctx.dataIndex] || {}).iso);
            return `kl. ${hour}`;
          },
          font: { size: 11 },
          color: () => tickColor.value,
          textAlign: 'center',
          clip: false,
        },
        // Day (bottom)
        day: {
          display: true,
          offset: 6,
          formatter: (_: any, ctx: any) => {
            const ui = (ctx.chart.data as any).__uiPoints as
              | UiPoint[]
              | undefined;
            const weekday =
              ui && ui[ctx.dataIndex]
                ? weekdayHourParts(ui[ctx.dataIndex].iso).weekday
                : weekdayHourParts((props.points[ctx.dataIndex] || {}).iso)
                    .weekday;
            return String(weekday).toLowerCase();
          },
          font: { size: 11 },
          color: () => dayColor.value,
          textAlign: 'center',
          clip: false,
        },
      },
    },
  },
  scales: {
    x: {
      ticks: { display: false },
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
})); // ✅ properly closed

// Attach UiPoints for label formatters
watch(() => props.points, () => {
  (data.value as any).__uiPoints = props.points;
});
</script>

<template>
  <!-- Only this area scrolls horizontally -->
  <div class="chart-scroll">
    <div class="chart-inner" :style="{ width: chartWidth + 'px' }">
      <div class="chart-wrap">
        <Bar :data="data" :options="options" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  max-width: 100%;
  height: 80vh; /* adjust height here */
  -webkit-overflow-scrolling: touch;
}

.chart-inner {
  display: block;
  height: 100%;
}

.chart-wrap {
  height: 100%;
  min-height: 0;
}
</style>
