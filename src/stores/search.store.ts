// src/stores/search.store.ts

import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import { searchService } from '@/services/search.service';

import type {
  AsyncState,
  Filter,
  SearchParams,
  SearchResponse,
  SearchResult,
  Sort,
} from '@/types/search';

/**
 * The cache stores COMPLETE API responses against an exact request key.
 *
 * Example:
 *
 * query + filters + sort + page + pageSize
 *              ↓
 *          cache key
 *              ↓
 *       SearchResponse
 */
type Cache = Map<string, SearchResponse<SearchResult>>;

function createCacheKey(params: SearchParams): string {
  /**
   * We deliberately include every parameter that can change
   * the server response.
   *
   * If page is different, the response is different.
   * If sort is different, the response is different.
   */
  return JSON.stringify({
    query: params.query,
    filters: params.filters,
    sort: params.sort,
    page: params.page,
    pageSize: params.pageSize,
  });
}

export const useSearchStore = defineStore('search', () => {
  // ------------------------------------------------------------
  // EXECUTED SEARCH STATE
  // ------------------------------------------------------------

  /**
   * This is NOT the text currently being typed.
   *
   * It represents the search that the application has actually
   * executed.
   *
   * It belongs in Pinia because it is application-level search state.
   */
  const executedQuery = ref('');

  const filters = ref<Filter[]>([]);

  const sort = ref<Sort>({
    field: 'relevance',
    direction: 'desc',
  });

  const page = ref(1);

  /**
   * pageSize is application configuration in this example.
   *
   * It doesn't need to be represented in the URL.
   */
  const pageSize = ref(10);

  // ------------------------------------------------------------
  // SERVER STATE
  // ------------------------------------------------------------

  /**
   * The API response belongs to server state.
   *
   * Components don't call the API directly.
   * They interact with this store.
   */
  const state = ref<AsyncState<SearchResponse<SearchResult>>>({
    status: 'idle',
  });

  // ------------------------------------------------------------
  // CACHE
  // ------------------------------------------------------------

  /**
   * Cache is kept inside this small store for our exercise.
   *
   * In a larger production architecture, this could move into
   * a dedicated repository/cache layer.
   */
  const cache: Cache = new Map();

  // ------------------------------------------------------------
  // RACE CONDITION PROTECTION
  // ------------------------------------------------------------

  /**
   * Every request gets a monotonically increasing ID.
   *
   * Example:
   *
   * Request A → id 1
   * Request B → id 2
   *
   * If B finishes first, request A becomes stale.
   */
  let latestRequestId = 0;

  // ------------------------------------------------------------
  // DERIVED STATE
  // ------------------------------------------------------------

  /**
   * We don't store hasResults.
   *
   * It is derived from the response.
   */
  const hasResults = computed(() => {
    if (state.value.status !== 'success' && state.value.status !== 'empty') {
      return false;
    }

    return state.value.data.items.length > 0;
  });

  const totalResults = computed(() => {
    if (state.value.status !== 'success' && state.value.status !== 'empty') {
      return 0;
    }

    return state.value.data.pagination.total;
  });

  const totalPages = computed(() => {
    if (state.value.status !== 'success' && state.value.status !== 'empty') {
      return 0;
    }

    return state.value.data.pagination.totalPages;
  });

  // ------------------------------------------------------------
  // SEARCH
  // ------------------------------------------------------------

  async function search(query = executedQuery.value): Promise<void> {
    executedQuery.value = query;

    const params: SearchParams = {
      query: executedQuery.value,
      filters: filters.value,
      sort: sort.value,
      page: page.value,
      pageSize: pageSize.value,
    };

    const cacheKey = createCacheKey(params);

    /**
     * CACHE HIT
     *
     * We only use the cache when we have an exact match.
     *
     * We do NOT assume that cached page 1 can answer page 2.
     */
    const cachedResponse = cache.get(cacheKey);

    if (cachedResponse) {
      state.value =
        cachedResponse.items.length > 0
          ? {
              status: 'success',
              data: cachedResponse,
            }
          : {
              status: 'empty',
              data: cachedResponse,
            };

      return;
    }

    /**
     * Generate a new request ID.
     */
    const requestId = ++latestRequestId;

    state.value = {
      status: 'loading',
    };

    try {
      const response = await searchService.search(params);

      /**
       * RACE CONDITION PROTECTION
       *
       * If another search started after this request,
       * this response is stale.
       *
       * Example:
       *
       * A → requestId 1
       * B → requestId 2
       *
       * B finishes:
       * latestRequestId = 2
       *
       * A finishes:
       * requestId = 1
       *
       * 1 !== 2
       *
       * Therefore A must be ignored.
       */
      if (requestId !== latestRequestId) {
        return;
      }

      cache.set(cacheKey, response);

      state.value =
        response.items.length > 0
          ? {
              status: 'success',
              data: response,
            }
          : {
              status: 'empty',
              data: response,
            };
    } catch (error) {
      /**
       * A stale failed request shouldn't overwrite the latest request either.
       */
      if (requestId !== latestRequestId) {
        return;
      }

      state.value = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ------------------------------------------------------------
  // SEARCH PARAMETER ACTIONS
  // ------------------------------------------------------------

  function setFilters(newFilters: Filter[]) {
    filters.value = newFilters;

    /**
     * Changing filters should restart pagination from page 1.
     */
    page.value = 1;
  }

  function setSort(newSort: Sort) {
    sort.value = newSort;
    page.value = 1;
  }

  function setPage(newPage: number) {
    page.value = newPage;
  }

  function reset() {
    executedQuery.value = '';
    filters.value = [];
    sort.value = {
      field: 'relevance',
      direction: 'desc',
    };
    page.value = 1;

    state.value = {
      status: 'idle',
    };
  }

  return {
    executedQuery,
    filters,
    sort,
    page,
    pageSize,

    state,

    hasResults,
    totalResults,
    totalPages,

    search,
    setFilters,
    setSort,
    setPage,
    reset,

    // Expose this only for tests/debugging if desired.
    // We don't need components to know about the cache.
  };
});
