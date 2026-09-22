<script setup lang="ts">
import type { Filter, Sort } from 'src/types/search'

defineProps<{
  filters: Filter[]
  sort: Sort
}>()

const emit = defineEmits<{
  filtersChange: [filters: Filter[]]
  sortChange: [sort: Sort]
}>()

function updateCategory(category: string) {
  if (!category) {
    emit('filtersChange', [])
    return
  }

  emit('filtersChange', [
    {
      field: 'category',
      value: category,
    },
  ])
}

function updateSort(value: string) {
  const [field, direction] = value.split('-') as [
    Sort['field'],
    Sort['direction'],
  ]

  emit('sortChange', {
    field,
    direction,
  })
}
</script>

<template>
  <div class="row q-col-gutter-md q-mt-md">
    <div class="col-12 col-md-4">
      <q-select
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
