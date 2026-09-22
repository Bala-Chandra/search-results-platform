```vue
<template>
  <div class="row q-col-gutter-md q-mt-md">
    <div class="col-12 col-md-4">
      <q-select
        v-model="selectedCategory"
        data-testid="category-filter"
        label="Category"
        outlined
        clearable
        :options="['frontend', 'backend', 'architecture']"
        @update:model-value="updateCategory"
      />
    </div>

    <div class="col-12 col-md-4">
      <q-select
        v-model="selectedSort"
        data-testid="sort-select"
        label="Sort"
        outlined
        :options="[
          { label: 'Relevance', value: 'relevance-desc' },
          { label: 'Title A-Z', value: 'title-asc' },
          { label: 'Title Z-A', value: 'title-desc' },
          { label: 'Date newest', value: 'date-desc' },
          { label: 'Date oldest', value: 'date-asc' },
        ]"
        emit-value
        map-options
        @update:model-value="updateSort"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import type { Filter, Sort } from '@/types/search';

const props = defineProps<{
  filters: Filter[];
  sort: Sort;
}>();

const emit = defineEmits<{
  'update:filters': [filters: Filter[]];
  'update:sort': [sort: Sort];
}>();

const selectedCategory = ref(
  props.filters.find((filter) => filter.field === 'category')?.value ?? null,
);

const selectedSort = ref(props.sort);

const updateCategory = (value: string | null) => {
  const filters = value ? [{ field: 'category', value }] : [];

  emit('update:filters', filters);
};

const updateSort = (value: Sort) => {
  emit('update:sort', value);
};
</script>
```
