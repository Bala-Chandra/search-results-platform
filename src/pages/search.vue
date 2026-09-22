<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import SearchBar from 'src/components/SearchBar.vue';
import FilterPanel from 'src/components/FilterPanel.vue';
import ResultsList from 'src/components/ResultsList.vue';

import { useSearchStore } from '@/stores/search.store';

import type { Filter, Sort } from '@/types/search';

const store = useSearchStore();

const route = useRoute();
const router = useRouter();

/**
 * ------------------------------------------------------------
 * ROUTER / URL STATE
 * ------------------------------------------------------------
 *
 * Meaningful search state is represented in the URL.
 *
 * This makes:
 *
 * /search?query=vue&page=2
 *
 * refreshable, bookmarkable and shareable.
 *
 * We DON'T put:
 *
 * loading
 * error
 * results
 * cache
 * panel-open state
 *
 * into the URL.
 *
 * Those are runtime/application state.
 */

function readFiltersFromUrl(): Filter[] {
  const category = route.query.category;

  if (typeof category !== 'string') {
    return [];
  }

  return [
    {
      field: 'category',
      value: category,
    },
  ];
}

function readSortFromUrl(): Sort {
  const sort = route.query.sort;

  switch (sort) {
    case 'title-asc':
      return { field: 'title', direction: 'asc' };

    case 'title-desc':
      return { field: 'title', direction: 'desc' };

    case 'date-asc':
      return { field: 'date', direction: 'asc' };

    case 'date-desc':
      return { field: 'date', direction: 'desc' };

    default:
      return {
        field: 'relevance',
        direction: 'desc',
      };
  }
}

async function syncUrl() {
  await router.replace({
    query: {
      ...route.query,

      query: store.executedQuery || undefined,

      category: store.filters.find((filter) => filter.field === 'category')?.value || undefined,

      sort:
        store.sort.field === 'relevance'
          ? 'relevance-desc'
          : `${store.sort.field}-${store.sort.direction}`,

      page: store.page > 1 ? String(store.page) : undefined,
    },
  });
}

async function executeSearch(query: string) {
  await store.search(query);
  await syncUrl();
}

async function changeFilters(filters: Filter[]) {
  store.setFilters(filters);

  await store.search();
  await syncUrl();
}

async function changeSort(sort: Sort) {
  store.setSort(sort);

  await store.search();
  await syncUrl();
}

async function changePage(page: number) {
  store.setPage(page);

  await store.search();
  await syncUrl();
}

/**
 * Restore meaningful state from the URL.
 *
 * This is why URL state and Pinia state are both useful:
 *
 * URL → persistence/navigation
 * Pinia → runtime application state
 */
onMounted(async () => {
  const query = typeof route.query.query === 'string' ? route.query.query : '';

  store.executedQuery = query;
  store.setFilters(readFiltersFromUrl());
  store.setSort(readSortFromUrl());

  const pageFromUrl = Number(route.query.page);

  if (Number.isInteger(pageFromUrl) && pageFromUrl > 0) {
    store.setPage(pageFromUrl);
  }

  if (query) {
    await store.search();
  }
});

/**
 * Pull the response out of the discriminated union.
 */
const results = computed(() => {
  if (store.state.status !== 'success' && store.state.status !== 'empty') {
    return [];
  }

  return store.state.data.items;
});
</script>

<template>
  <q-page padding>
    <div class="row justify-center">
      <div class="col-12 col-lg-10">
        <div class="text-h4 q-mb-lg">Search & Results Platform</div>

        <SearchBar @search="executeSearch" />

        <FilterPanel
          :filters="store.filters"
          :sort="store.sort"
          @filters-change="changeFilters"
          @sort-change="changeSort"
        />

        <!-- Loading -->
        <div v-if="store.state.status === 'loading'" class="q-pa-xl text-center">
          <q-spinner size="40px" />

          <div class="q-mt-md">Searching...</div>
        </div>

        <!-- Error -->
        <q-banner
          v-else-if="store.state.status === 'error'"
          data-testid="error-state"
          class="bg-negative text-white q-mt-lg"
        >
          {{ store.state.error }}
        </q-banner>

        <!-- Empty -->
        <div
          v-else-if="store.state.status === 'empty'"
          data-testid="empty-state"
          class="q-pa-xl text-center"
        >
          No results found.
        </div>

        <!-- Results -->
        <template v-else-if="store.state.status === 'success'">
          <div class="row justify-between items-center q-mt-lg">
            <div>{{ store.totalResults }} results</div>

            <div>Page {{ store.page }} of {{ store.totalPages }}</div>
          </div>

          <ResultsList :results="results" />

          <div class="row justify-center q-mt-lg">
            <q-pagination
              :model-value="store.page"
              :max="store.totalPages"
              @update:model-value="changePage"
            />
          </div>
        </template>
      </div>
    </div>
  </q-page>
</template>
