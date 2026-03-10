import { reactive, watch } from 'vue'
import seedData from '../../changes.json'

const STORAGE_KEY = 'cap-upgrade-admin-store'

// Deep clone helper
const clone = (obj) => JSON.parse(JSON.stringify(obj))

// Original seed — never mutated, used to detect new entries
const original = clone(seedData)

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Basic sanity check
    if (!Array.isArray(parsed.entries) || !Array.isArray(parsed.dirtyIds)) return null
    return parsed
  } catch {
    return null
  }
}

function buildInitialState() {
  const saved = loadFromStorage()
  if (saved) {
    return {
      entries: saved.entries,
      dirtyIds: new Set(saved.dirtyIds),
      _fromStorage: true,
    }
  }
  return {
    entries: clone(seedData),
    dirtyIds: new Set(),
    _fromStorage: false,
  }
}

const initial = buildInitialState()

export const store = reactive({
  entries: initial.entries,
  dirtyIds: initial.dirtyIds,

  // True when the store was rehydrated from localStorage on this page load
  restoredFromDraft: initial._fromStorage,

  getById(id) {
    return this.entries.find(e => e.id === id) || null
  },

  save(entry) {
    const idx = this.entries.findIndex(e => e.id === entry.id)
    const updated = { ...entry, lastUpdated: new Date().toISOString().split('T')[0] }
    if (idx >= 0) {
      this.entries[idx] = updated
    } else {
      this.entries.push(updated)
    }
    this.dirtyIds.add(entry.id)
    this._persist()
  },

  delete(id) {
    this.entries = this.entries.filter(e => e.id !== id)
    this.dirtyIds.delete(id)
    this._persist()
  },

  isDirty(id) {
    return this.dirtyIds.has(id)
  },

  isNew(id) {
    return !original.find(e => e.id === id)
  },

  getDirtyEntries() {
    return this.entries.filter(e => this.dirtyIds.has(e.id))
  },

  // Called after the user downloads changes.json — clears dirty tracking and draft
  clearDirty() {
    this.dirtyIds = new Set()
    this._persist()
  },

  // Discard all local changes and reset to the imported seed data
  resetToSeed() {
    this.entries = clone(seedData)
    this.dirtyIds = new Set()
    this.restoredFromDraft = false
    localStorage.removeItem(STORAGE_KEY)
  },

  _persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        entries: this.entries,
        dirtyIds: [...this.dirtyIds],
      }))
    } catch {
      // localStorage unavailable (private browsing quota exceeded etc.) — silent fail
    }
  },
})
