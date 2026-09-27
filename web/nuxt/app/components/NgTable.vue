<script setup lang="ts" generic="T extends Record<string, unknown>">
/**
 * NgTable — `.tron-table` with typed columns, sticky head and optional sorting.
 *
 * Deliberately NOT virtualised. Virtualisation is a separate component
 * (<NgVirtualTable>) because it changes the DOM contract: no real <tbody> rows,
 * no Ctrl+F, no native selection. Reach for it only above ~2 000 rows, and
 * remember the better answer for a 100 k-row transcript log is keyset pagination
 * with the filter in SQL, not more rows in the browser.
 *
 * The sticky header is why <NgPanel defer> must never wrap this: `defer` sets
 * `content-visibility: auto`, which breaks `position: sticky` inside it.
 */
export interface NgColumn<Row> {
  key: string
  label: string
  /** Right-align + tabular numerals. */
  numeric?: boolean
  sortable?: boolean
  width?: string
  /** Value accessor when the cell is not simply `row[key]`. */
  value?: (row: Row) => unknown
}

const props = withDefaults(
  defineProps<{
    columns: NgColumn<T>[]
    rows: T[]
    rowKey?: (row: T, index: number) => string | number
    compact?: boolean
    mono?: boolean
    clickable?: boolean
    selectedKey?: string | number | null
    /** Accessible name for the table. */
    caption?: string
  }>(),
  {
    rowKey: undefined,
    compact: false,
    mono: false,
    clickable: false,
    selectedKey: null,
    caption: undefined,
  },
)

const emit = defineEmits<{ rowClick: [row: T, index: number] }>()

const sortKey = defineModel<string | null>('sortKey', { default: null })
const sortDir = defineModel<'asc' | 'desc'>('sortDir', { default: 'asc' })

function toggleSort(col: NgColumn<T>) {
  if (!col.sortable) return
  if (sortKey.value === col.key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else {
    sortKey.value = col.key
    sortDir.value = 'asc'
  }
}

function cellValue(row: T, col: NgColumn<T>): unknown {
  return col.value ? col.value(row) : row[col.key]
}

const sortedRows = computed(() => {
  const key = sortKey.value
  if (!key) return props.rows
  const col = props.columns.find((c) => c.key === key)
  if (!col?.sortable) return props.rows
  const dir = sortDir.value === 'asc' ? 1 : -1
  return [...props.rows].sort((a, b) => {
    const av = cellValue(a, col)
    const bv = cellValue(b, col)
    if (av == null) return 1
    if (bv == null) return -1
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
    return String(av).localeCompare(String(bv)) * dir
  })
})

function ariaSort(col: NgColumn<T>) {
  if (!col.sortable) return undefined
  if (sortKey.value !== col.key) return 'none'
  return sortDir.value === 'asc' ? 'ascending' : 'descending'
}

function keyFor(row: T, i: number) {
  return props.rowKey ? props.rowKey(row, i) : i
}
</script>

<template>
  <div class="table-container">
    <table class="tron-table" :class="{ compact, mono }">
      <caption v-if="caption" class="sr-only">{{ caption }}</caption>
      <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            :class="[col.numeric && 'num', col.sortable && 'sortable']"
            :style="col.width ? { width: col.width } : undefined"
            :aria-sort="ariaSort(col)"
            scope="col"
            @click="toggleSort(col)"
          >
            {{ col.label }}
            <NgIcon
              v-if="col.sortable && sortKey === col.key"
              class="sort-caret"
              :name="sortDir === 'asc' ? 'ph:caret-up' : 'ph:caret-down'"
            />
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, i) in sortedRows"
          :key="keyFor(row, i)"
          :class="{ clickable, selected: selectedKey != null && keyFor(row, i) === selectedKey }"
          :tabindex="clickable ? 0 : undefined"
          @click="clickable && emit('rowClick', row, i)"
          @keydown.enter="clickable && emit('rowClick', row, i)"
        >
          <td v-for="col in columns" :key="col.key" :class="{ num: col.numeric }">
            <slot :name="`cell-${col.key}`" :row="row" :value="cellValue(row, col)" :index="i">
              {{ cellValue(row, col) }}
            </slot>
          </td>
        </tr>
        <tr v-if="!sortedRows.length">
          <td :colspan="columns.length">
            <slot name="empty">
              <NgEmptyState icon="ph:tray" message="Nothing here yet." />
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
