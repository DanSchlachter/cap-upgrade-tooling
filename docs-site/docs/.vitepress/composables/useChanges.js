// Shared composable — loads changes.json from the public folder at runtime.
// In the VitePress build the file is copied to /public/changes.json so it
// is available both during SSR and in the browser without bundling it into JS.

import { ref, onMounted } from 'vue'

let _cache = null
const _listeners = []

export function useChanges() {
  const changes = ref(_cache || [])
  const loading = ref(!_cache)
  const error   = ref(null)

  if (!_cache) {
    _listeners.push({ changes, loading, error })

    // Only fetch once
    if (_listeners.length === 1) {
      fetch(import.meta.env.BASE_URL + 'changes.json')
        .then(r => r.json())
        .then(data => {
          _cache = data
          _listeners.forEach(l => {
            l.changes.value = data
            l.loading.value = false
          })
        })
        .catch(err => {
          _listeners.forEach(l => {
            l.error.value = err.message
            l.loading.value = false
          })
        })
    }
  }

  return { changes, loading, error }
}
