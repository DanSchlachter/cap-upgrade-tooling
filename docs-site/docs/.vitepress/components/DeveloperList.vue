<template>
  <div class="dl-root">
    <div class="dl-header">
      <h1 class="dl-title">Developer Upgrade Guide</h1>
      <p class="dl-subtitle">
        Technical migration steps for developers and AI agents.
        Grouped by version and runtime. Code blocks, detection commands and auto-fix scripts included.
      </p>
    </div>

    <div v-if="loading" class="dl-state">Loading…</div>
    <div v-else-if="error" class="dl-state dl-error">Failed to load data: {{ error }}</div>

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
            <span v-if="vg.highCount"     class="meta-pill pill-high">{{ vg.highCount }} high severity</span>
            <span v-if="vg.autoFixCount"  class="meta-pill pill-autofix">{{ vg.autoFixCount }} auto-fixable</span>
            <span v-if="vg.redeployCount" class="meta-pill pill-redeploy">{{ vg.redeployCount }} need redeployment</span>
          </div>
        </div>

        <!-- Runtime sub-sections -->
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
                  <span v-if="entry.effort" class="badge badge-effort" :class="`effort-${entry.effort}`">
                    effort: {{ entry.effort }}
                  </span>
                  <span v-if="entry.needsRedeployment" class="badge badge-redeploy">Redeployment</span>
                  <span v-if="entry.autoFix?.available" class="badge badge-autofix">Auto Fix</span>
                  <span v-if="!entry.actionRequired" class="badge badge-ok">No action needed</span>
                </div>
                <div class="entry-meta-right">
                  <span class="affects-label" v-if="entry.affects?.length">
                    Affects: {{ entry.affects.join(', ') }}
                  </span>
                </div>
              </div>

              <h4 class="entry-title">
                <span class="entry-id">{{ entry.id }}</span>
                {{ entry.title }}
              </h4>
              <p class="entry-desc" v-html="renderMarkdown(entry.description)" />

              <!-- Applicability detection -->
              <div v-if="entry.applicable !== true" class="applicable-block">
                <div class="block-label">Detect if applicable</div>
                <div class="code-wrap">
                  <pre class="code-pre"><code>{{ entry.applicable }}</code></pre>
                  <button class="copy-btn" @click="copy(entry.applicable, `${entry.id}-ap`)">
                    {{ copied[`${entry.id}-ap`] ? '✓ Copied' : 'Copy' }}
                  </button>
                </div>
              </div>

              <!-- Affected files -->
              <div v-if="entry.affectedFiles?.length" class="affected-files">
                <span class="block-label">Affected files: </span>
                <code v-for="g in entry.affectedFiles" :key="g" class="glob-tag">{{ g }}</code>
              </div>

              <!-- Developer steps -->
              <div v-if="entry.steps.developer?.length" class="dev-steps">
                <div class="block-label">Steps</div>
                <ol class="steps-ol">
                  <li
                    v-for="(step, i) in entry.steps.developer"
                    :key="i"
                    v-html="renderMarkdown(step)"
                  />
                </ol>
              </div>

              <!-- Auto-fix script -->
              <div v-if="entry.autoFix?.available && entry.autoFix.script" class="autofix-block">
                <div class="autofix-head">
                  <span class="autofix-label">Auto Fix Script</span>
                  <button class="copy-btn copy-btn-green" @click="copy(entry.autoFix.script, `${entry.id}-fix`)">
                    {{ copied[`${entry.id}-fix`] ? '✓ Copied' : 'Copy' }}
                  </button>
                </div>
                <pre class="autofix-pre"><code>{{ entry.autoFix.script }}</code></pre>
              </div>

              <!-- References -->
              <div v-if="entry.references?.length" class="entry-refs">
                <span class="refs-label">References:</span>
                <a
                  v-for="ref in entry.references"
                  :key="ref"
                  :href="ref"
                  target="_blank"
                  rel="noopener"
                >{{ shortUrl(ref) }} ↗</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue'
import { useChanges } from '../composables/useChanges.js'

const { changes, loading, error } = useChanges()

// ── Group by version then runtime ─────────────────────────────────────
const versionGroups = computed(() => {
  const pairs = []
  const seen  = new Set()
  changes.value.forEach(e => {
    const key = `${e.sourceVersion}→${e.targetVersion}`
    if (!seen.has(key)) { seen.add(key); pairs.push({ from: e.sourceVersion, to: e.targetVersion }) }
  })

  return pairs.map(({ from, to }) => {
    const entries = changes.value.filter(e => e.sourceVersion === from && e.targetVersion === to)

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
      autoFixCount: entries.filter(e => e.autoFix?.available).length,
      redeployCount:entries.filter(e => e.needsRedeployment).length,
    }
  })
})

// ── Copy ──────────────────────────────────────────────────────────────
const copied = reactive({})
async function copy(text, key) {
  try {
    await navigator.clipboard.writeText(text)
    copied[key] = true
    setTimeout(() => { copied[key] = false }, 2000)
  } catch {}
}

// ── Helpers ───────────────────────────────────────────────────────────
function slugify(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function runtimeLabel(rt) {
  return { nodejs: 'Node.js', java: 'Java', both: 'Node.js + Java' }[rt] || rt
}

function shortUrl(url) {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

// Minimal inline markdown → html
function renderMarkdown(text) {
  return (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1 ↗</a>')
}
</script>

<style scoped>
.dl-root { max-width: 900px; margin: 0 auto; padding-bottom: 4rem; }

.dl-header { margin-bottom: 2rem; }
.dl-title  { font-size: 1.8rem; font-weight: 700; margin: 0 0 0.4rem; }
.dl-subtitle { color: var(--vp-c-text-2); margin: 0; max-width: 640px; line-height: 1.6; }

.dl-state { padding: 2rem; text-align: center; color: var(--vp-c-text-2); }
.dl-error { color: #e53e3e; }

/* ── Version section ─────────────────────────────────────────── */
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
.pill-autofix { background: #d1fae5; color: #065f46; border-color: #6ee7b7; }
.pill-redeploy{ background: #fef3c7; color: #92400e; border-color: #fde68a; }

/* ── Runtime sub-section ──────────────────────────────────────── */
.runtime-subsection { padding: 1.25rem 1.5rem; }
.runtime-subsection + .runtime-subsection { border-top: 1px solid var(--vp-c-divider); }

.runtime-heading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-2);
  border: none;
  padding: 0;
}
.runtime-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.dot-nodejs  { background: #16a34a; }
.dot-java    { background: #2563eb; }
.dot-both    { background: #7c3aed; }

/* ── Entry cards ──────────────────────────────────────────────── */
.entry-list { display: flex; flex-direction: column; gap: 1rem; }

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

.entry-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
}
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

.badge-effort.effort-high   { background: #fee2e2; color: #991b1b; }
.badge-effort.effort-medium { background: #fef3c7; color: #92400e; }
.badge-effort.effort-low    { background: #f0fdf4; color: #166534; }

.badge-redeploy { background: #fef3c7; color: #92400e; }
.badge-autofix  { background: #d1fae5; color: #065f46; }
.badge-ok       { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }

.entry-meta-right {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  text-align: right;
}
.affects-label { font-style: italic; }

.entry-id {
  display: inline-block;
  font-family: monospace;
  font-size: 0.7rem;
  font-weight: 400;
  color: var(--vp-c-text-3);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 3px;
  padding: 0.05rem 0.35rem;
  margin-right: 0.4rem;
  vertical-align: middle;
}

.entry-title { margin: 0 0 0.5rem; font-size: 1rem; font-weight: 600; }
.entry-desc  { margin: 0 0 0.75rem; font-size: 0.875rem; line-height: 1.6; color: var(--vp-c-text-1); }

.entry-desc :deep(code),
.steps-ol :deep(code) {
  font-family: monospace;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 3px;
  padding: 0.1em 0.35em;
  font-size: 0.875em;
}

/* Applicable block */
.applicable-block { margin-bottom: 0.75rem; }
.block-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--vp-c-text-2);
  margin-bottom: 0.3rem;
}

.code-wrap {
  position: relative;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  overflow: hidden;
}

.code-pre {
  margin: 0;
  padding: 0.6rem 3rem 0.6rem 0.8rem;
  font-size: 0.8125rem;
  font-family: 'SFMono-Regular', Consolas, monospace;
  overflow-x: auto;
  white-space: pre;
}

/* Affected files */
.affected-files {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-bottom: 0.75rem;
  font-size: 0.8rem;
}
.glob-tag {
  font-family: monospace;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  padding: 0.1rem 0.4rem;
  font-size: 0.78rem;
}

/* Dev steps */
.dev-steps { margin-bottom: 0.75rem; }
.steps-ol {
  margin: 0.35rem 0 0;
  padding-left: 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.steps-ol li { font-size: 0.875rem; line-height: 1.6; }

/* Auto-fix */
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
  border-bottom: 1px solid #6ee7b7;
}
.autofix-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #065f46;
}
.autofix-pre {
  margin: 0;
  padding: 0.75rem 1rem;
  font-size: 0.82rem;
  font-family: 'SFMono-Regular', Consolas, monospace;
  overflow-x: auto;
}

/* Copy buttons */
.copy-btn {
  position: absolute;
  top: 0.4rem;
  right: 0.5rem;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: background 0.1s;
}
.copy-btn:hover { background: var(--vp-c-bg-mute); }

.copy-btn-green {
  position: static;
  border-color: #6ee7b7;
  background: #fff;
  color: #065f46;
}
.copy-btn-green:hover { background: #ecfdf5; }

/* References */
.entry-refs {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  font-size: 0.8rem;
}
.refs-label { color: var(--vp-c-text-2); }
.entry-refs a { color: var(--vp-c-brand-1, #3b82f6); text-decoration: none; }
.entry-refs a:hover { text-decoration: underline; }

@media (max-width: 600px) {
  .version-heading { flex-direction: column; align-items: flex-start; }
  .runtime-subsection { padding: 1rem; }
  .entry-head { flex-direction: column; }
}
</style>
