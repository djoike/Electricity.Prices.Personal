<script setup lang="ts">
import { formatLastUpdated } from '../lib/format';
const props = defineProps<{ lastUpdated: Date | null }>();
</script>

<template>
  <div class="header">
    <div class="title">Elpriser – nu og 36 timer frem</div>
    <div class="meta" v-if="lastUpdated">Opdateret: {{ formatLastUpdated(lastUpdated) }}</div>
  </div>
</template>