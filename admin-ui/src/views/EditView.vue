<template>
  <div class="edit-view">
    <div class="page-header">
      <h1>{{ isNew ? 'New Entry' : 'Edit Entry' }}</h1>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="cancel">Cancel</button>
        <button class="btn btn-primary" @click="save">Save</button>
      </div>
    </div>

    <form @submit.prevent="save" novalidate>

      <!-- ── Identity ─────────────────────────────────────────── -->
      <section class="card">
        <h2>Identity</h2>
        <div class="form-grid">
          <div class="field">
            <label>ID <span class="required">*</span></label>
            <input
              v-model="form.id"
              type="text"
              placeholder="e.g. cds9-some-change"
              :disabled="!isNew"
              :class="{ error: errors.id }"
              @input="isNew && autoSlug()"
            />
            <span v-if="errors.id" class="field-error">{{ errors.id }}</span>
            <span v-if="isNew" class="hint">Auto-generated from title. Lowercase letters, digits and hyphens only.</span>
            <span v-else class="hint">ID is locked after creation.</span>
          </div>

          <div class="field field-full">
            <label>Title <span class="required">*</span></label>
            <input
              v-model="form.title"
              type="text"
              placeholder="Short, descriptive title"
              :class="{ error: errors.title }"
              @input="isNew && autoSlugFromTitle()"
            />
            <span v-if="errors.title" class="field-error">{{ errors.title }}</span>
          </div>

        </div>
      </section>

      <!-- ── Versioning ────────────────────────────────────────── -->
      <section class="card">
        <h2>Versioning</h2>
        <div class="form-grid">
          <div class="field">
            <label>Source Version <span class="required">*</span></label>
            <input
              v-model="form.sourceVersion"
              type="text"
              placeholder="e.g. 8.0"
              :class="{ error: errors.sourceVersion }"
            />
            <span v-if="errors.sourceVersion" class="field-error">{{ errors.sourceVersion }}</span>
          </div>

          <div class="field">
            <label>Target Version</label>
            <input v-model="form.targetVersion" type="text" placeholder="e.g. 9.0 (leave blank for open-ended)" />
            <span class="hint">Leave blank if the change applies beyond a single version jump.</span>
          </div>

          <div class="field">
            <label>Superseded By</label>
            <input v-model="form.supersededBy" type="text" placeholder="ID of the entry that supersedes this one" />
            <span class="hint">Used to chain entries across version paths (e.g. 7→8 points to the 8→9 entry).</span>
          </div>
        </div>
      </section>

      <!-- ── Classification ────────────────────────────────────── -->
      <section class="card">
        <h2>Classification</h2>
        <div class="form-grid">
          <div class="field">
            <label>Runtime <span class="required">*</span></label>
            <select v-model="form.runtime" :class="{ error: errors.runtime }">
              <option value="">— select —</option>
              <option value="nodejs">Node.js</option>
              <option value="java">Java</option>
              <option value="both">Both</option>
            </select>
            <span v-if="errors.runtime" class="field-error">{{ errors.runtime }}</span>
          </div>

          <div class="field">
            <label>Category <span class="required">*</span></label>
            <select v-model="form.category" :class="{ error: errors.category }">
              <option value="">— select —</option>
              <option value="Breaking Change">Breaking Change</option>
              <option value="Deprecation">Deprecation</option>
              <option value="Behavior Change">Behavior Change</option>
              <option value="Removal">Removal</option>
              <option value="Dependency Update">Dependency Update</option>
            </select>
            <span v-if="errors.category" class="field-error">{{ errors.category }}</span>
          </div>

          <div class="field">
            <label>Severity <span class="required">*</span></label>
            <select v-model="form.severity" :class="{ error: errors.severity }">
              <option value="">— select —</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <span v-if="errors.severity" class="field-error">{{ errors.severity }}</span>
          </div>

          <div class="field">
            <label>Effort</label>
            <select v-model="form.effort">
              <option value="">— select —</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <!-- Affects (multi-checkbox) -->
        <div class="field field-full mt-1">
          <label>Affects</label>
          <div class="checkbox-grid">
            <label v-for="opt in AFFECTS_OPTIONS" :key="opt" class="checkbox-item">
              <input type="checkbox" :value="opt" v-model="form.affects" />
              {{ opt }}
            </label>
          </div>
        </div>

        <!-- Tags -->
        <div class="field field-full mt-1">
          <label>Tags</label>
          <TagInput v-model="form.tags" placeholder="Add a tag and press Enter" />
        </div>
      </section>

      <!-- ── Description ───────────────────────────────────────── -->
      <section class="card">
        <h2>Description</h2>
        <div class="form-grid">
          <div class="field field-full">
            <label>Description <span class="required">*</span></label>
            <textarea
              v-model="form.description"
              rows="4"
              placeholder="Full description of the change and its impact"
              :class="{ error: errors.description }"
            />
            <span v-if="errors.description" class="field-error">{{ errors.description }}</span>
          </div>
        </div>
      </section>

      <!-- ── Applicability ─────────────────────────────────────── -->
      <section class="card">
        <h2>Applicability</h2>
        <div class="form-grid">
          <div class="field">
            <label>Action Required</label>
            <ToggleSwitch v-model="form.actionRequired" />
          </div>

          <div class="field">
            <label>Needs Redeployment</label>
            <ToggleSwitch v-model="form.needsRedeployment" />
          </div>
        </div>

        <!-- Applicable -->
        <div class="field field-full mt-1">
          <label>Applicable Detection</label>
          <div class="radio-row">
            <label class="radio-item">
              <input type="radio" v-model="applicableMode" value="always" />
              Always applicable
            </label>
            <label class="radio-item">
              <input type="radio" v-model="applicableMode" value="command" />
              Detection command
            </label>
          </div>
          <textarea
            v-if="applicableMode === 'command'"
            v-model="form.applicable"
            rows="2"
            :placeholder="applicablePlaceholder"
            class="code-input mt-half"
          />
          <span class="hint">If "Always applicable", the field is stored as <code>true</code>. Otherwise a shell command is used to detect if this change affects the project.</span>
        </div>

        <!-- Affected Files -->
        <div class="field field-full mt-1">
          <label>Affected Files (glob patterns)</label>
          <TagInput v-model="form.affectedFiles" placeholder="e.g. package.json, src/**/*.js" />
        </div>
      </section>

      <!-- ── Auto Fix ───────────────────────────────────────────── -->
      <section class="card">
        <h2>Auto Fix</h2>
        <div class="form-grid">
          <div class="field">
            <label>Auto Fix Available</label>
            <ToggleSwitch v-model="form.autoFix.available" />
          </div>
        </div>
        <div v-if="form.autoFix.available" class="field field-full mt-1">
          <label>Auto Fix Script</label>
          <textarea
            v-model="form.autoFix.script"
            rows="4"
            placeholder="Shell command(s) for developers to copy/paste"
            class="code-input"
          />
          <span class="hint">This is for copy/paste use only. Auto-invocation is a future feature.</span>
        </div>
      </section>

      <!-- ── Steps ──────────────────────────────────────────────── -->
      <section class="card">
        <h2>Steps</h2>

        <div class="steps-columns">
          <div class="steps-col">
            <h3>Admin / Basis Steps</h3>
            <StepList v-model="form.steps.admin" placeholder="Add an admin step…" />
          </div>
          <div class="steps-col">
            <h3>Developer Steps</h3>
            <StepList v-model="form.steps.developer" placeholder="Add a developer step…" />
          </div>
        </div>
      </section>

      <!-- ── References ─────────────────────────────────────────── -->
      <section class="card">
        <h2>References</h2>
        <div class="field field-full">
          <TagInput v-model="form.references" placeholder="Paste a URL and press Enter" />
          <span class="hint">Links to docs, release notes, or migration guides.</span>
        </div>
      </section>

      <!-- ── Footer actions ────────────────────────────────────── -->
      <div class="form-footer">
        <button type="button" class="btn btn-secondary" @click="cancel">Cancel</button>
        <button type="submit" class="btn btn-primary">Save</button>
      </div>

    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { store } from '../store.js'
import ToggleSwitch from '../components/ToggleSwitch.vue'
import TagInput from '../components/TagInput.vue'
import StepList from '../components/StepList.vue'

// ── Props ──────────────────────────────────────────────────────────────
const props = defineProps({
  id: { type: String, default: null },
})

const router = useRouter()
const isNew = computed(() => !props.id)

// ── Constants ──────────────────────────────────────────────────────────
const applicablePlaceholder = 'e.g. grep -r \'@sap/cds\' package.json'

const AFFECTS_OPTIONS = [
  'data-model',
  'custom-handlers',
  'configuration',
  'database',
  'messaging',
  'rest',
  'odata',
  'auth',
  'multitenancy',
  'dependencies',
]

// ── Form state ─────────────────────────────────────────────────────────
function blankForm() {
  return {
    id: '',
    title: '',
    sourceVersion: '',
    targetVersion: '',
    supersededBy: '',
    runtime: '',
    category: '',
    severity: '',
    effort: '',
    description: '',
    actionRequired: false,
    needsRedeployment: false,
    applicable: true,
    affects: [],
    tags: [],
    affectedFiles: [],
    autoFix: { available: false, script: null },
    steps: { admin: [], developer: [] },
    references: [],
  }
}

const form = reactive(blankForm())
const errors = reactive({})

// applicable can be `true` or a shell command string
const applicableMode = ref('always')

watch(applicableMode, (mode) => {
  if (mode === 'always') {
    form.applicable = true
  } else if (form.applicable === true) {
    form.applicable = ''
  }
})

// ── Load existing entry ────────────────────────────────────────────────
onMounted(() => {
  if (!isNew.value) {
    const entry = store.getById(props.id)
    if (!entry) {
      router.replace('/')
      return
    }
    // Deep-assign into reactive form
    Object.assign(form, JSON.parse(JSON.stringify(entry)))
    // Ensure nested objects exist (guard against old data shapes)
    if (!form.autoFix) form.autoFix = { available: false, script: null }
    if (!form.steps) form.steps = { admin: [], developer: [] }
    if (!form.steps.admin) form.steps.admin = []
    if (!form.steps.developer) form.steps.developer = []
    if (!form.affects) form.affects = []
    if (!form.tags) form.tags = []
    if (!form.affectedFiles) form.affectedFiles = []
    if (!form.references) form.references = []
    // Sync applicable mode
    applicableMode.value = form.applicable === true ? 'always' : 'command'
  }
})

// ── Slug helpers ───────────────────────────────────────────────────────
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

let titleEdited = false

function autoSlugFromTitle() {
  if (!titleEdited) {
    form.id = slugify(form.title)
  }
}

function autoSlug() {
  titleEdited = true
}

// ── Validation ─────────────────────────────────────────────────────────
function validate() {
  // Clear errors
  Object.keys(errors).forEach((k) => delete errors[k])

  if (!form.id.trim()) errors.id = 'ID is required.'
  else if (!/^[a-z0-9-]+$/.test(form.id)) errors.id = 'Only lowercase letters, digits and hyphens.'
  else if (isNew.value && store.getById(form.id)) errors.id = 'An entry with this ID already exists.'

  if (!form.title.trim()) errors.title = 'Title is required.'
  if (!form.sourceVersion.trim()) errors.sourceVersion = 'Source version is required.'
  if (!form.runtime) errors.runtime = 'Runtime is required.'
  if (!form.category) errors.category = 'Category is required.'
  if (!form.severity) errors.severity = 'Severity is required.'
  if (!form.description.trim()) errors.description = 'Description is required.'

  return Object.keys(errors).length === 0
}

// ── Save ───────────────────────────────────────────────────────────────
function save() {
  if (!validate()) {
    // Scroll to first error
    const el = document.querySelector('.field-error')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }

  // Normalise nullable fields
  const entry = JSON.parse(JSON.stringify(form))
  if (!entry.targetVersion) entry.targetVersion = null
  if (!entry.supersededBy) entry.supersededBy = null
  if (!entry.effort) entry.effort = null
  if (applicableMode.value === 'always') entry.applicable = true
  if (!entry.autoFix.available) entry.autoFix.script = null
  if (!entry.autoFix.script) entry.autoFix.script = null
  entry.lastUpdated = new Date().toISOString().split('T')[0]

  store.save(entry)
  router.push('/')
}

// ── Cancel ─────────────────────────────────────────────────────────────
function cancel() {
  router.push('/')
}
</script>

<style scoped>
/* ── Layout ─────────────────────────────────────────────────────── */
.edit-view {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.5rem 1rem 4rem;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

/* ── Cards ───────────────────────────────────────────────────────── */
.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.25rem;
}

.card h2 {
  margin: 0 0 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
  padding-bottom: 0.5rem;
}

.card h3 {
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ── Form grid ───────────────────────────────────────────────────── */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem 1.5rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field-full {
  grid-column: 1 / -1;
}

.mt-1 { margin-top: 1rem; }
.mt-half { margin-top: 0.5rem; }

/* ── Form elements ───────────────────────────────────────────────── */
label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

input[type="text"],
input[type="date"],
select,
textarea {
  font-family: inherit;
  font-size: 0.875rem;
  padding: 0.45rem 0.65rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  color: #111827;
  transition: border-color 0.15s;
  width: 100%;
  box-sizing: border-box;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: #0070f3;
  box-shadow: 0 0 0 3px rgba(0, 112, 243, 0.12);
}

input.error,
select.error,
textarea.error {
  border-color: #ef4444;
}

input:disabled {
  background: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}

textarea {
  resize: vertical;
}

.code-input {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.8125rem;
  background: #f8fafc;
}

.required {
  color: #ef4444;
}

.hint {
  font-size: 0.775rem;
  color: #6b7280;
  line-height: 1.4;
}

.hint code {
  background: #f3f4f6;
  padding: 0.1em 0.3em;
  border-radius: 3px;
  font-size: 0.875em;
}

.field-error {
  font-size: 0.8rem;
  color: #ef4444;
}

/* ── Checkboxes (Affects) ─────────────────────────────────────────── */
.checkbox-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.875rem;
  font-weight: 400;
  color: #374151;
  cursor: pointer;
}

.checkbox-item input {
  width: auto;
  cursor: pointer;
}

/* ── Radio row ───────────────────────────────────────────────────── */
.radio-row {
  display: flex;
  gap: 1.5rem;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.875rem;
  font-weight: 400;
  color: #374151;
  cursor: pointer;
}

.radio-item input {
  width: auto;
  cursor: pointer;
}

/* ── Steps columns ────────────────────────────────────────────────── */
.steps-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

/* ── Footer ──────────────────────────────────────────────────────── */
.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1rem;
}

/* ── Buttons ─────────────────────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1.1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.15s, border-color 0.15s;
}

.btn-primary {
  background: #0070f3;
  color: #fff;
  border-color: #0070f3;
}

.btn-primary:hover {
  background: #0056c7;
  border-color: #0056c7;
}

.btn-secondary {
  background: #fff;
  color: #374151;
  border-color: #d1d5db;
}

.btn-secondary:hover {
  background: #f9fafb;
}

/* ── Responsive ──────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .form-grid,
  .steps-columns {
    grid-template-columns: 1fr;
  }
  .field-full {
    grid-column: 1;
  }
}
</style>
