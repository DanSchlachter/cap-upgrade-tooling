<template>
  <div class="al-root">
    <div class="al-header">
      <h1 class="al-title">Admin Upgrade Guide</h1>
      <p class="al-subtitle">
        Plain-language steps for system administrators and basis teams — no coding required.
        Each section covers one version upgrade.
      </p>
    </div>

    <div v-if="loading" class="al-state">Loading…</div>
    <div v-else-if="error" class="al-state al-error">Failed to load data: {{ error }}</div>

    <template v-else>
      <!-- ── Per-version section ─────────────────────────────── -->
      <section
        v-for="vg in versionGroups"
        :key="vg.label"
        class="version-section"
      >
        <div class="version-heading">
          <h2>
            Upgrading from <span class="v-tag">{{ vg.from }}</span>
            to <span class="v-tag">{{ vg.to ?? '…' }}</span>
          </h2>
          <div class="version-meta">
            <span class="meta-pill">{{ vg.entries.length }} changes</span>
            <span v-if="vg.highCount"    class="meta-pill pill-high">{{ vg.highCount }} high severity</span>
            <span v-if="vg.redeployCount" class="meta-pill pill-redeploy">{{ vg.redeployCount }} need redeployment</span>
          </div>
        </div>

        <!-- Runtime sub-groups within each version -->
        <div
          v-for="rg in vg.runtimeGroups"
          :key="rg.runtime"
          class="runtime-subsection"
        >
          <h3 class="runtime-heading">
            <span class="runtime-dot" :class="`dot-${rg.runtime}`" />
            {{ runtimeLabel(rg.runtime) }}
          </h3>

          <div class="entry-list">
            <div
              v-for="entry in rg.entries"
              :key="entry.id"
              class="entry-card"
              :class="`sev-${entry.severity}`"
            >
              <!-- Entry header -->
              <div class="entry-head">
                <div class="entry-badges">
                  <span class="badge" :class="`cat-${slugify(entry.category)}`">{{ entry.category }}</span>
                  <span class="badge sev-badge" :class="`sev-${entry.severity}`">{{ entry.severity }}</span>
                  <span v-if="entry.needsRedeployment" class="badge badge-redeploy">Redeployment required</span>
                  <span v-if="!entry.actionRequired" class="badge badge-info">No action required</span>
                </div>
              </div>

              <h4 class="entry-title">{{ entry.title }}</h4>

              <!-- Plain description -->
              <p class="entry-desc">{{ plainDescription(entry) }}</p>

              <!-- Admin steps -->
              <div v-if="entry.steps.admin?.length" class="admin-steps">
                <div class="steps-label">What you need to do:</div>
                <ol class="steps-ol">
                  <li v-for="(step, i) in entry.steps.admin" :key="i">{{ step }}</li>
                </ol>
              </div>

              <!-- Redeployment callout -->
              <div v-if="entry.needsRedeployment" class="callout callout-warn">
                A database redeployment is required as part of this change.
                Plan a deployment window with your development team before upgrading.
              </div>

              <!-- References -->
              <div v-if="entry.references?.length" class="entry-refs">
                <span class="refs-label">More information:</span>
                <a
                  v-for="ref in entry.references"
                  :key="ref"
                  :href="ref"
                  target="_blank"
                  rel="noopener"
                >Documentation ↗</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useChanges } from '../composables/useChanges.js'

const { changes, loading, error } = useChanges()

// ── Group by version then runtime ─────────────────────────────────────
const versionGroups = computed(() => {
  // Collect unique (from → to) pairs preserving order of first appearance
  const pairs = []
  const seen  = new Set()
  changes.value.forEach(e => {
    const key = `${e.sourceVersion}→${e.targetVersion}`
    if (!seen.has(key)) { seen.add(key); pairs.push({ from: e.sourceVersion, to: e.targetVersion }) }
  })

  return pairs.map(({ from, to }) => {
    const entries = changes.value.filter(e => e.sourceVersion === from && e.targetVersion === to)

    // Sub-group by runtime (nodejs first, then java, then both)
    const runtimeOrder = ['nodejs', 'java', 'both']
    const byRuntime = {}
    entries.forEach(e => {
      if (!byRuntime[e.runtime]) byRuntime[e.runtime] = []
      byRuntime[e.runtime].push(e)
    })

    const runtimeGroups = runtimeOrder
      .filter(rt => byRuntime[rt]?.length)
      .map(rt => ({ runtime: rt, entries: byRuntime[rt] }))

    return {
      label:        `${from}→${to}`,
      from,
      to,
      entries,
      runtimeGroups,
      highCount:    entries.filter(e => e.severity === 'high').length,
      redeployCount:entries.filter(e => e.needsRedeployment).length,
    }
  })
})

// ── Helpers ───────────────────────────────────────────────────────────
function slugify(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function runtimeLabel(rt) {
  return { nodejs: 'Node.js projects', java: 'Java projects', both: 'All projects (Node.js & Java)' }[rt] || rt
}

// Strip markdown syntax for the admin audience
function plainDescription(entry) {
  return entry.description
    .replace(/`([^`]+)`/g, '"$1"')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
}
</script>

<style scoped>
.al-root { max-width: 860px; margin: 0 auto; padding-bottom: 4rem; }

.al-header { margin-bottom: 2rem; }
.al-title  { font-size: 1.8rem; font-weight: 700; margin: 0 0 0.4rem; }
.al-subtitle { color: var(--vp-c-text-2); margin: 0; max-width: 640px; line-height: 1.6; }

.al-state { padding: 2rem; text-align: center; color: var(--vp-c-text-2); }
.al-error { color: #e53e3e; }

/* ── Version section ──────────────────────────────────────────── */
.version-section {
  margin-bottom: 3rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  overflow: hidden;
}

.version-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

.version-heading h2 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  border: none;
  padding: 0;
}

.v-tag {
  font-family: monospace;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  padding: 0.1rem 0.45rem;
  font-size: 1rem;
}

.version-meta { display: flex; gap: 0.4rem; flex-wrap: wrap; }

.meta-pill {
  display: inline-flex;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
}
.pill-high    { background: #fee2e2; color: #b91c1c; border-color: #fca5a5; }
.pill-redeploy{ background: #fef3c7; color: #92400e; border-color: #fde68a; }

/* ── Runtime sub-section ──────────────────────────────────────── */
.runtime-subsection { padding: 1.25rem 1.5rem; }
.runtime-subsection + .runtime-subsection {
  border-top: 1px solid var(--vp-c-divider);
}

.runtime-heading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem;
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-2);
  border: none;
  padding: 0;
}

.runtime-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot-nodejs { background: #16a34a; }
.dot-java   { background: #2563eb; }
.dot-both   { background: #7c3aed; }

/* ── Entry cards ──────────────────────────────────────────────── */
.entry-list { display: flex; flex-direction: column; gap: 0.875rem; }

.entry-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 1rem 1.25rem;
  background: var(--vp-c-bg);
  border-left: 4px solid var(--vp-c-divider);
}
.entry-card.sev-high   { border-left-color: #ef4444; }
.entry-card.sev-medium { border-left-color: #f59e0b; }
.entry-card.sev-low    { border-left-color: #22c55e; }

.entry-head { margin-bottom: 0.5rem; }
.entry-badges { display: flex; flex-wrap: wrap; gap: 0.3rem; }

.badge {
  display: inline-flex;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.cat-breaking-change { background: #fee2e2; color: #991b1b; }
.cat-behavior-change { background: #fef3c7; color: #92400e; }
.cat-deprecation     { background: #ede9fe; color: #5b21b6; }
.cat-removal         { background: #fce7f3; color: #9d174d; }

.sev-badge.sev-high   { background: #ef4444; color: #fff; }
.sev-badge.sev-medium { background: #f59e0b; color: #fff; }
.sev-badge.sev-low    { background: #22c55e; color: #fff; }

.badge-redeploy { background: #fef3c7; color: #92400e; }
.badge-info     { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }

.entry-title { margin: 0 0 0.5rem; font-size: 1rem; font-weight: 600; }
.entry-desc  { margin: 0 0 0.75rem; font-size: 0.875rem; line-height: 1.6; color: var(--vp-c-text-1); }

/* Admin steps */
.admin-steps { margin-bottom: 0.75rem; }
.steps-label {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--vp-c-text-2);
  margin-bottom: 0.4rem;
}
.steps-ol {
  margin: 0;
  padding-left: 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.steps-ol li { font-size: 0.875rem; line-height: 1.6; }

/* Callouts */
.callout {
  border-radius: 6px;
  padding: 0.6rem 0.9rem;
  font-size: 0.85rem;
  line-height: 1.5;
  margin-bottom: 0.75rem;
}
.callout-warn {
  background: #fef9c3;
  border-left: 3px solid #f59e0b;
  color: #78350f;
}

/* References */
.entry-refs {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  font-size: 0.8rem;
}
.refs-label { color: var(--vp-c-text-2); }
.entry-refs a { color: var(--vp-c-brand-1, #3b82f6); text-decoration: none; }
.entry-refs a:hover { text-decoration: underline; }

@media (max-width: 600px) {
  .version-heading { flex-direction: column; align-items: flex-start; }
  .runtime-subsection { padding: 1rem; }
}
</style>
