<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
  search: [query: string];
}>();

/**
 * IMPORTANT ARCHITECTURAL DECISION:
 *
 * This is local component state.
 *
 * It represents what the user is currently typing.
 *
 * It is NOT the executed search state.
 */
const searchInput = ref('');

let debounceTimer: ReturnType<typeof setTimeout> | undefined;

function executeSearch() {
  const query = searchInput.value.trim();

  if (query.length === 0) {
    return;
  }

  emit('search', query);
}

/**
 * Debounce prevents an API call for every keystroke.
 *
 * We keep the timer local because it is UI interaction state.
 */
function onInput() {
  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    executeSearch();
  }, 400);
}
</script>

<template>
  <div class="row q-col-gutter-sm items-center">
    <div class="col">
      <q-input
        v-model="searchInput"
        data-testid="search-input"
        outlined
        label="Search"
        clearable
        @update:model-value="onInput"
        @keyup.enter="executeSearch"
      />
    </div>

    <div class="col-auto">
      <q-btn data-testid="search-button" color="primary" label="Search" @click="executeSearch" />
    </div>
  </div>
</template>
