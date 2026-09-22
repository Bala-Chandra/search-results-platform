// src/types/search.ts

/**
 * Represents the filters that can be applied to a search.
 *
 * These are DOMAIN types.
 * They don't know anything about Vue, Pinia or Quasar.
 */
export interface Filter {
  field: string;
  value: string;
}

/**
 * Sorting options supported by the backend.
 */
export type SortField = 'relevance' | 'title' | 'date';

export type SortDirection = 'asc' | 'desc';

export interface Sort {
  field: SortField;
  direction: SortDirection;
}

/**
 * Everything required to execute a search.
 *
 * IMPORTANT:
 * This is "executed search state", not draft input state.
 */
export interface SearchParams {
  query: string;
  filters: Filter[];
  sort: Sort;
  page: number;
  pageSize: number;
}

/**
 * One search result.
 */
export interface SearchResult {
  id: number;
  title: string;
  description: string;
  category: string;
  date: string;
}

/**
 * Generic pagination information.
 */
export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Generic server response.
 *
 * T allows this API infrastructure to eventually return
 * different types of resources.
 */
export interface SearchResponse<T> {
  items: T[];
  pagination: Pagination;
}

/**
 * Instead of having:
 *
 * isLoading
 * isError
 * hasError
 * isEmpty
 *
 * we model the state as a discriminated union.
 *
 * This means the TypeScript compiler can help us understand
 * which properties are available for each state.
 */
export type AsyncState<T> =
  | {
      status: 'idle';
    }
  | {
      status: 'loading';
    }
  | {
      status: 'success';
      data: T;
    }
  | {
      status: 'empty';
      data: T;
    }
  | {
      status: 'error';
      error: string;
    };
