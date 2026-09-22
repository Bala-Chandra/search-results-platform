<script setup lang="ts">
import type { SearchResult } from '@/types/search';

defineProps<{
  results: SearchResult[];
}>();
</script>

<template>
  <div class="q-mt-lg">
    <q-card v-for="result in results" :key="result.id" data-testid="result-card" class="q-mb-sm">
      <q-card-section>
        <div class="text-h6">
          {{ result.title }}
        </div>

        <div class="text-body2 q-mt-sm">
          {{ result.description }}
        </div>

        <div class="text-caption q-mt-sm">{{ result.category }} · {{ result.date }}</div>
      </q-card-section>
    </q-card>
  </div>
</template>
