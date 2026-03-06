<template>
  <div class="list-view">
    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h1 class="page-title">Breaking Changes</h1>
        <span class="entry-count">{{ filtered.length }} of {{ store.entries.length }}</span>
      </div>
      <div class="toolbar-right">
        <button
          v-if="store.dirtyIds.size > 0"
          class="btn btn--download"
          @click="downloadDirty"
        >
          Download Changes ({{ store.dirtyIds.size }})
        </button>
        <button class="btn btn--outline" @click="downloadAll">Download All</button>
        <router-link to="/new" class="btn btn--primary">+ New Entry</router-link>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <input
        v-model="search"
        class="filter-input"
        placeholder="Search by title, description, ID..."
        type="search"
      />
      <select v-model="filterRuntime" class="filter-select">
        <option value="">All runtimes</option>
        <option value="nodejs">Node.js</option>
        <option value="java">Java</option>
        <option value="both">Both</option>
      </select>
      <select v-model="filterCategory" class="filter-select">
        <option value="">All categories</option>
        <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
      </select>
      <select v-model="filterSeverity" class="filter-select">
        <option value="">All severities</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      <select v-model="filterSource" class="filter-select">
        <option value="">All versions</option>
        <option v-for="v in sourceVersions" :key="v" :value="v">From {{ v }}</option>
      </select>
    </div>

    <!-- Table -->
    <div class="table-wrapper">
      <table class="entries-table">
        <thead>
          <tr>
            <th style="width:32px"></th>
            <th>Title</th>
            <th style="width:90px">Runtime</th>
            <th style="width:120px">Category</th>
            <th style="width:80px">Severity</th>
            <th style="width:100px">Version</th>
            <th style="width:80px">Redeploy</th>
            <th style="width:100px">Auto Fix</th>
            <th style="width:110px">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="entry in filtered"
            :key="entry.id"
            :class="{ 'row--dirty': store.isDirty(entry.id), 'row--new': store.isNew(entry.id) }"
          >
            <td class="dirty-cell">
              <span v-if="store.isNew(entry.id)" class="badge badge--new" title="New entry">N</span>
              <span v-else-if="store.isDirty(entry.id)" class="badge badge--dirty" title="Modified">M</span>
            </td>
            <td>
              <div class="entry-title">{{ entry.title }}</div>
              <div class="entry-id">{{ entry.id }}</div>
            </td>
            <td>
              <span :class="'runtime-badge runtime-badge--' + entry.runtime">
                {{ entry.runtime }}
              </span>
            </td>
            <td>
              <span :class="'category-badge category-badge--' + slugify(entry.category)">
                {{ entry.category }}
              </span>
            </td>
            <td>
              <span :class="'severity-badge severity-badge--' + entry.severity">
                {{ entry.severity }}
              </span>
            </td>
            <td class="version-cell">
              {{ entry.sourceVersion }} → {{ entry.targetVersion ?? '∞' }}
            </td>
            <td class="center-cell">
              <span v-if="entry.needsRedeployment" class="flag flag--yes">Yes</span>
              <span v-else class="flag flag--no">No</span>
            </td>
            <td class="center-cell">
              <span v-if="entry.autoFix?.available" class="flag flag--yes">Yes</span>
              <span v-else class="flag flag--no">No</span>
            </td>
            <td class="actions-cell">
              <router-link :to="'/edit/' + entry.id" class="action-btn action-btn--edit">Edit</router-link>
              <button class="action-btn action-btn--delete" @click="confirmDelete(entry)">Delete</button>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="9" class="empty-state">No entries match the current filters.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { store } from '../store.js'

const search = ref('')
const filterRuntime = ref('')
const filterCategory = ref('')
const filterSeverity = ref('')
const filterSource = ref('')

const categories = ['Breaking Change', 'Deprecation', 'Behavior Change', 'Removal']

const sourceVersions = computed(() => {
  const vs = new Set(store.entries.map(e => e.sourceVersion))
  return [...vs].sort()
})

const filtered = computed(() => {
  return store.entries.filter(e => {
    if (filterRuntime.value && e.runtime !== filterRuntime.value) return false
    if (filterCategory.value && e.category !== filterCategory.value) return false
    if (filterSeverity.value && e.severity !== filterSeverity.value) return false
    if (filterSource.value && e.sourceVersion !== filterSource.value) return false
    if (search.value) {
      const q = search.value.toLowerCase()
      return (
        e.title.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
      )
    }
    return true
  })
})

function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, '-')
}

function confirmDelete(entry) {
  if (confirm(`Delete "${entry.title}"?\n\nThis cannot be undone.`)) {
    store.delete(entry.id)
  }
}

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function downloadDirty() {
  downloadJSON(store.getDirtyEntries(), 'changes-updated.json')
  store.clearDirty()
}

function downloadAll() {
  downloadJSON(store.entries, 'changes.json')
}
</script>

<style scoped>
.list-view { display: flex; flex-direction: column; gap: 16px; }

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.toolbar-left { display: flex; align-items: baseline; gap: 12px; }
.toolbar-right { display: flex; align-items: center; gap: 8px; }

.page-title { font-size: 22px; font-weight: 600; }
.entry-count { font-size: 13px; color: #666; }

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-input {
  flex: 1;
  min-width: 220px;
  padding: 7px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  background: #fff;
}
.filter-input:focus { outline: none; border-color: #0070f3; box-shadow: 0 0 0 2px rgba(0,112,243,0.15); }

.filter-select {
  padding: 7px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  background: #fff;
  cursor: pointer;
}
.filter-select:focus { outline: none; border-color: #0070f3; }

.table-wrapper {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  overflow-x: auto;
}

.entries-table { width: 100%; border-collapse: collapse; font-size: 13px; }

.entries-table thead { background: #f9fafb; }
.entries-table th {
  padding: 10px 14px;
  text-align: left;
  font-weight: 600;
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}

.entries-table td {
  padding: 10px 14px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}
.entries-table tbody tr:last-child td { border-bottom: none; }
.entries-table tbody tr:hover { background: #f9fafb; }

.row--dirty { background: #fffbeb; }
.row--new { background: #f0fdf4; }
.row--dirty:hover { background: #fef3c7; }
.row--new:hover { background: #dcfce7; }

.dirty-cell { text-align: center; }

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 700;
}
.badge--new { background: #16a34a; color: #fff; }
.badge--dirty { background: #d97706; color: #fff; }

.entry-title { font-weight: 500; color: #111; }
.entry-id { font-size: 11px; color: #9ca3af; font-family: monospace; margin-top: 2px; }

.runtime-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
}
.runtime-badge--nodejs { background: #dbeafe; color: #1d4ed8; }
.runtime-badge--java   { background: #fce7f3; color: #9d174d; }
.runtime-badge--both   { background: #ede9fe; color: #5b21b6; }

.category-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}
.category-badge--breaking-change { background: #fee2e2; color: #991b1b; }
.category-badge--removal          { background: #ffedd5; color: #9a3412; }
.category-badge--behavior-change  { background: #fef9c3; color: #713f12; }
.category-badge--deprecation      { background: #f3f4f6; color: #374151; }

.severity-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}
.severity-badge--high   { background: #fee2e2; color: #dc2626; }
.severity-badge--medium { background: #fef3c7; color: #d97706; }
.severity-badge--low    { background: #d1fae5; color: #059669; }

.version-cell { font-family: monospace; font-size: 12px; white-space: nowrap; }

.center-cell { text-align: center; }

.flag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}
.flag--yes { background: #d1fae5; color: #059669; }
.flag--no  { background: #f3f4f6; color: #6b7280; }

.actions-cell { white-space: nowrap; }

.action-btn {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  border: 1px solid transparent;
  margin-right: 4px;
  transition: background 0.15s;
}
.action-btn--edit {
  background: #eff6ff;
  color: #1d4ed8;
  border-color: #bfdbfe;
}
.action-btn--edit:hover { background: #dbeafe; }

.action-btn--delete {
  background: #fff5f5;
  color: #dc2626;
  border-color: #fecaca;
}
.action-btn--delete:hover { background: #fee2e2; }

.empty-state {
  text-align: center;
  padding: 48px;
  color: #9ca3af;
  font-size: 14px;
}

.btn {
  display: inline-block;
  padding: 7px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  text-decoration: none;
  transition: background 0.15s;
}
.btn--primary { background: #0070f3; color: #fff; }
.btn--primary:hover { background: #0061d5; }
.btn--outline { background: #fff; color: #374151; border-color: #d1d5db; }
.btn--outline:hover { background: #f9fafb; }
.btn--download { background: #d97706; color: #fff; }
.btn--download:hover { background: #b45309; }
</style>
