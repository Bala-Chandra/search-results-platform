// src/services/search.service.ts

import type { Filter, SearchParams, SearchResponse, SearchResult } from 'src/types/search';

/**
 * Mock dataset.
 *
 * In a real application this data would come from the backend.
 */
const MOCK_RESULTS: SearchResult[] = Array.from({ length: 100 }, (_, index) => ({
  id: index + 1,
  title: [
    'Vue 3 Composition API',
    'Pinia State Management',
    'TypeScript Advanced Types',
    'Frontend System Design',
    'React Architecture',
  ][index % 5],

  description: 'Enterprise frontend engineering concept used in modern applications.',

  category: ['frontend', 'backend', 'architecture'][index % 3],

  date: `2026-09-${String((index % 28) + 1).padStart(2, '0')}`,
}));

/**
 * Small helper to simulate network latency.
 */
const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

function matchesFilters(result: SearchResult, filters: Filter[]): boolean {
  return filters.every((filter) => {
    if (filter.field === 'category') {
      return result.category === filter.value;
    }

    return true;
  });
}

function matchesQuery(result: SearchResult, query: string): boolean {
  if (!query) {
    return true;
  }

  const normalizedQuery = query.toLowerCase();

  return (
    result.title.toLowerCase().includes(normalizedQuery) ||
    result.description.toLowerCase().includes(normalizedQuery)
  );
}

export const searchService = {
  async search(params: SearchParams): Promise<SearchResponse<SearchResult>> {
    /**
     * Simulate realistic network latency.
     *
     * Random latency is intentional because it allows us to reproduce
     * the race-condition scenario:
     *
     * Request A starts
     * Request B starts
     * B finishes first
     * A finishes later
     */
    const latency = 300 + Math.random() * 1000;

    await delay(latency);

    /**
     * This gives us an easy way to test error handling.
     *
     * Try searching for "error" during development.
     */
    if (params.query.toLowerCase() === 'error') {
      throw new Error('Mock server error');
    }

    let filtered = MOCK_RESULTS.filter((result) => {
      return matchesQuery(result, params.query) && matchesFilters(result, params.filters);
    });

    /**
     * Sorting is performed by the mock backend.
     *
     * In production this should normally happen server-side
     * when dealing with large datasets.
     */
    filtered = [...filtered].sort((a, b) => {
      if (params.sort.field === 'title') {
        return params.sort.direction === 'asc'
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      }

      if (params.sort.field === 'date') {
        return params.sort.direction === 'asc'
          ? a.date.localeCompare(b.date)
          : b.date.localeCompare(a.date);
      }

      // Relevance is already represented by our mock ordering.
      return 0;
    });

    const total = filtered.length;

    const start = (params.page - 1) * params.pageSize;
    const end = start + params.pageSize;

    const items = filtered.slice(start, end);

    return {
      items,
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        total,
        totalPages: Math.ceil(total / params.pageSize),
      },
    };
  },
};
