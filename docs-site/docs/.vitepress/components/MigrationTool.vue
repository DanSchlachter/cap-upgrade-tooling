<template>
  <div class="mt-root">
    <!-- ── Header ──────────────────────────────────────────── -->
    <div class="mt-header">
      <h1 class="mt-title">Migration Tool</h1>
      <p class="mt-subtitle">
        Select your upgrade path and runtime to see only the changes that apply to you.
      </p>
    </div>

    <!-- ── Filter bar ──────────────────────────────────────── -->
    <div class="mt-filters">
      <div class="filter-group">
        <label>Upgrading from</label>
        <select v-model="fromVersion">
          <option value="">Any</option>
          <option v-for="v in sourceVersions" :key="v" :value="v">{{ v }}</option>
        </select>
      </div>

      <div class="filter-group filter-arrow">→</div>

      <div class="filter-group">
        <label>Upgrading to</label>
        <select v-model="toVersion">
          <option value="">Any</option>
          <option v-for="v in targetVersions" :key="v" :value="v">{{ v }}</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Runtime</label>
        <select v-model="runtime">
          <option value="">All</option>
          <option value="nodejs">Node.js</option>
          <option value="java">Java</option>
          <option value="both">Both</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Category</label>
        <select v-model="category">
          <option value="">All</option>
          <option value="Breaking Change">Breaking Change</option>
          <option value="Behavior Change">Behavior Change</option>
          <option value="Deprecation">Deprecation</option>
          <option value="Removal">Removal</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Severity</label>
        <select v-model="severity">
          <option value="">All</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Action required</label>
        <select v-model="actionRequired">
          <option value="">All</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </div>

      <button class="filter-reset" @click="resetFilters" title="Clear all filters">
        Reset
      </button>
    </div>

    <!-- ── Loading / error ─────────────────────────────────── -->
    <div v-if="loading" class="mt-state">Loading changes…</div>
    <div v-else-if="error" class="mt-state mt-error">Failed to load data: {{ error }}</div>

    <!-- ── Result count ────────────────────────────────────── -->
    <div v-else class="mt-count">
      Showing <strong>{{ filtered.length }}</strong> of {{ changes.length }} entries
      <span v-if="highCount" class="count-pill high">{{ highCount }} high severity</span>
      <span v-if="redeployCount" class="count-pill redeploy">{{ redeployCount }} need redeployment</span>
    </div>

    <!-- ── Empty state ─────────────────────────────────────── -->
    <div v-if="!loading && !error && filtered.length === 0" class="mt-empty">
      No changes match the selected filters.
    </div>

    <!-- ── Entry cards ─────────────────────────────────────── -->
    <div v-else class="mt-cards">
      <div
        v-for="entry in filtered"
        :key="entry.id"
        class="mt-card"
        :class="[`sev-${entry.severity}`, { 'needs-action': entry.actionRequired }]"
      >
        <!-- Card header -->
        <div class="card-head">
          <div class="card-badges">
            <span class="badge" :class="`cat-${slugify(entry.category)}`">{{ entry.category }}</span>
            <span class="badge" :class="`sev-badge-${entry.severity}`">{{ entry.severity }}</span>
            <span class="badge runtime-badge" :class="`rt-${entry.runtime}`">{{ runtimeLabel(entry.runtime) }}</span>
            <span v-if="entry.needsRedeployment" class="badge badge-redeploy">Redeployment</span>
            <span v-if="entry.autoFix?.available" class="badge badge-autofix">Auto Fix</span>
          </div>
          <div class="card-version">
            <span class="version-tag">{{ entry.sourceVersion }}</span>
            <span class="version-arrow">→</span>
            <span class="version-tag">{{ entry.targetVersion ?? '…' }}</span>
          </div>
        </div>

        <!-- Title + description -->
        <h3 class="card-title">{{ entry.title }}</h3>
        <p class="card-desc">{{ entry.description }}</p>

        <!-- Applicability hint -->
        <div v-if="entry.applicable !== true" class="applicable-hint">
          <span class="applicable-label">Detect if applicable:</span>
          <code class="applicable-cmd">{{ entry.applicable }}</code>
        </div>

        <!-- Steps (tabbed admin / developer) -->
        <div class="card-steps">
          <div class="steps-tabs">
            <button
              class="steps-tab"
              :class="{ active: activeTab[entry.id] !== 'developer' }"
              @click="setTab(entry.id, 'admin')"
            >
              Admin steps
            </button>
            <button
              class="steps-tab"
              :class="{ active: activeTab[entry.id] === 'developer' }"
              @click="setTab(entry.id, 'developer')"
            >
              Developer steps
            </button>
          </div>

          <ol
            v-if="activeTab[entry.id] !== 'developer'"
            class="steps-list"
          >
            <li v-for="(step, i) in entry.steps.admin" :key="i">{{ step }}</li>
          </ol>
          <ol v-else class="steps-list steps-dev">
            <li v-for="(step, i) in entry.steps.developer" :key="i" v-html="renderMarkdown(step)" />
          </ol>
        </div>

        <!-- Auto-fix script -->
        <div v-if="entry.autoFix?.available && entry.autoFix.script" class="autofix-block">
          <div class="autofix-head">
            <span class="autofix-label">Auto Fix Script</span>
            <button class="copy-btn" @click="copyScript(entry.autoFix.script, entry.id)">
              {{ copied[entry.id] ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <pre class="autofix-pre"><code>{{ entry.autoFix.script }}</code></pre>
        </div>

        <!-- References -->
        <div v-if="entry.references?.length" class="card-refs">
          <a v-for="ref in entry.references" :key="ref" :href="ref" target="_blank" rel="noopener">
            Docs ↗
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useChanges } from '../composables/useChanges.js'

const { changes, loading, error } = useChanges()

// ── Filters ──────────────────────────────────────────────────────────
const fromVersion    = ref('')
const toVersion      = ref('')
const runtime        = ref('')
const category       = ref('')
const severity       = ref('')
const actionRequired = ref('')

function resetFilters() {
  fromVersion.value    = ''
  toVersion.value      = ''
  runtime.value        = ''
  category.value       = ''
  severity.value       = ''
  actionRequired.value = ''
}

// ── Derived version lists ─────────────────────────────────────────────
const sourceVersions = computed(() => {
  return [...new Set(changes.value.map(e => e.sourceVersion))].sort()
})

const targetVersions = computed(() => {
  return [...new Set(changes.value.map(e => e.targetVersion).filter(Boolean))].sort()
})

// ── Filtered list ─────────────────────────────────────────────────────
const filtered = computed(() => {
  return changes.value.filter(e => {
    if (fromVersion.value && e.sourceVersion !== fromVersion.value) return false
    if (toVersion.value   && e.targetVersion !== toVersion.value)   return false
    if (runtime.value) {
      if (runtime.value === 'both') {
        if (e.runtime !== 'both') return false
      } else {
        if (e.runtime !== runtime.value && e.runtime !== 'both') return false
      }
    }
    if (category.value       && e.category  !== category.value)          return false
    if (severity.value       && e.severity  !== severity.value)          return false
    if (actionRequired.value === 'yes' && !e.actionRequired)             return false
    if (actionRequired.value === 'no'  &&  e.actionRequired)             return false
    return true
  })
})

const highCount     = computed(() => filtered.value.filter(e => e.severity === 'high').length)
const redeployCount = computed(() => filtered.value.filter(e => e.needsRedeployment).length)

// ── Tabs (admin / developer per card) ─────────────────────────────────
const activeTab = reactive({})
function setTab(id, tab) { activeTab[id] = tab }

// ── Copy to clipboard ─────────────────────────────────────────────────
const copied = reactive({})
async function copyScript(script, id) {
  try {
    await navigator.clipboard.writeText(script)
    copied[id] = true
    setTimeout(() => { copied[id] = false }, 2000)
  } catch {}
}

// ── Helpers ───────────────────────────────────────────────────────────
function slugify(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function runtimeLabel(rt) {
  return { nodejs: 'Node.js', java: 'Java', both: 'Node.js + Java' }[rt] || rt
}

// Minimal inline markdown → html (bold, code, links only)
function renderMarkdown(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
}
</script>

<style scoped>
/* ── Root ───────────────────────────────────────────────────── */
.mt-root {
  max-width: 900px;
  margin: 0 auto;
  padding-bottom: 4rem;
}

.mt-header { margin-bottom: 1.5rem; }
.mt-title  { font-size: 1.8rem; font-weight: 700; margin: 0 0 0.4rem; }
.mt-subtitle { color: var(--vp-c-text-2); margin: 0; }

/* ── Filters ─────────────────────────────────────────────────── */
.mt-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
  align-items: flex-end;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.25rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 130px;
}

.filter-group label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--vp-c-text-2);
}

.filter-arrow {
  font-size: 1.25rem;
  color: var(--vp-c-text-3);
  padding-bottom: 0.25rem;
  align-self: flex-end;
  min-width: auto;
}

.filter-group select {
  font-family: inherit;
  font-size: 0.875rem;
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
}

.filter-reset {
  align-self: flex-end;
  padding: 0.4rem 0.85rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.15s;
}
.filter-reset:hover { background: var(--vp-c-bg-mute); }

/* ── State / count ────────────────────────────────────────────── */
.mt-state { padding: 2rem; text-align: center; color: var(--vp-c-text-2); }
.mt-error { color: var(--vp-c-danger-1, #e53e3e); }
.mt-empty { padding: 2rem; text-align: center; color: var(--vp-c-text-2); border: 1px dashed var(--vp-c-divider); border-radius: 8px; }

.mt-count {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.count-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}
.count-pill.high    { background: #fee2e2; color: #b91c1c; }
.count-pill.redeploy{ background: #fef3c7; color: #92400e; }

/* ── Cards ────────────────────────────────────────────────────── */
.mt-cards { display: flex; flex-direction: column; gap: 1rem; }

.mt-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 1.25rem 1.5rem;
  background: var(--vp-c-bg);
  border-left: 4px solid var(--vp-c-divider);
  transition: box-shadow 0.15s;
}
.mt-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.08); }

.mt-card.sev-high   { border-left-color: #ef4444; }
.mt-card.sev-medium { border-left-color: #f59e0b; }
.mt-card.sev-low    { border-left-color: #22c55e; }

/* Card head */
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.6rem;
}

.card-badges { display: flex; flex-wrap: wrap; gap: 0.35rem; }

.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

/* Category badges */
.cat-breaking-change { background: #fee2e2; color: #991b1b; }
.cat-behavior-change { background: #fef3c7; color: #92400e; }
.cat-deprecation     { background: #ede9fe; color: #5b21b6; }
.cat-removal         { background: #fce7f3; color: #9d174d; }

/* Severity badges */
.sev-badge-high   { background: #ef4444; color: #fff; }
.sev-badge-medium { background: #f59e0b; color: #fff; }
.sev-badge-low    { background: #22c55e; color: #fff; }

/* Runtime badges */
.rt-nodejs { background: #dcfce7; color: #166534; }
.rt-java   { background: #dbeafe; color: #1e40af; }
.rt-both   { background: #f3e8ff; color: #6b21a8; }

.badge-redeploy { background: #fef3c7; color: #92400e; }
.badge-autofix  { background: #d1fae5; color: #065f46; }

.card-version {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
}
.version-tag {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  padding: 0.1rem 0.4rem;
  font-family: monospace;
  font-size: 0.8rem;
}
.version-arrow { color: var(--vp-c-text-3); }

/* Title + desc */
.card-title { margin: 0 0 0.4rem; font-size: 1.05rem; font-weight: 600; }
.card-desc  { margin: 0 0 0.75rem; color: var(--vp-c-text-2); font-size: 0.9rem; line-height: 1.55; }

/* Applicability */
.applicable-hint {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 0.82rem;
}
.applicable-label { color: var(--vp-c-text-2); white-space: nowrap; }
.applicable-cmd {
  font-family: monospace;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  padding: 0.15rem 0.4rem;
  font-size: 0.8rem;
  word-break: break-all;
}

/* Steps */
.card-steps { margin-bottom: 0.75rem; }

.steps-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--vp-c-divider);
  margin-bottom: 0.6rem;
}

.steps-tab {
  padding: 0.4rem 0.85rem;
  font-size: 0.8rem;
  font-weight: 500;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--vp-c-text-2);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color 0.15s, border-color 0.15s;
}
.steps-tab.active {
  color: var(--vp-c-brand-1, #3b82f6);
  border-bottom-color: var(--vp-c-brand-1, #3b82f6);
}
.steps-tab:hover:not(.active) { color: var(--vp-c-text-1); }

.steps-list {
  margin: 0;
  padding-left: 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.steps-list li {
  font-size: 0.875rem;
  line-height: 1.55;
  color: var(--vp-c-text-1);
}

.steps-dev li :deep(code) {
  font-family: monospace;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 3px;
  padding: 0.1em 0.35em;
  font-size: 0.875em;
}

/* Auto-fix block */
.autofix-block {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  margin-bottom: 0.75rem;
  overflow: hidden;
}
.autofix-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.4rem 0.75rem;
  background: #d1fae5;
  border-bottom: 1px solid var(--vp-c-divider);
}
.autofix-label { font-size: 0.75rem; font-weight: 700; color: #065f46; text-transform: uppercase; letter-spacing: 0.04em; }
.copy-btn {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border: 1px solid #6ee7b7;
  border-radius: 4px;
  background: #fff;
  color: #065f46;
  cursor: pointer;
  transition: background 0.1s;
}
.copy-btn:hover { background: #ecfdf5; }

.autofix-pre {
  margin: 0;
  padding: 0.75rem 1rem;
  font-size: 0.82rem;
  overflow-x: auto;
  font-family: 'SFMono-Regular', Consolas, monospace;
}

/* References */
.card-refs {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}
.card-refs a {
  font-size: 0.8rem;
  color: var(--vp-c-brand-1, #3b82f6);
  text-decoration: none;
}
.card-refs a:hover { text-decoration: underline; }

/* ── Responsive ──────────────────────────────────────────────── */
@media (max-width: 640px) {
  .mt-filters { flex-direction: column; }
  .filter-arrow { display: none; }
  .filter-group { min-width: auto; width: 100%; }
  .card-head { flex-direction: column; align-items: flex-start; }
}
</style>
