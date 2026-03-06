import { reactive } from 'vue'
import seedData from '../../changes.json'

// Deep clone seed data so mutations are tracked against originals
const original = JSON.parse(JSON.stringify(seedData))

export const store = reactive({
  entries: JSON.parse(JSON.stringify(seedData)),
  // Set of IDs that have been created or modified since last download
  dirtyIds: new Set(),

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
  },

  delete(id) {
    this.entries = this.entries.filter(e => e.id !== id)
    this.dirtyIds.delete(id)
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

  clearDirty() {
    this.dirtyIds = new Set()
  },
})
