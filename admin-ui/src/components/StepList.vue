<template>
  <div class="step-list">
    <transition-group name="step" tag="ol" class="steps-ol">
      <li v-for="(step, i) in modelValue" :key="i" class="step-item">
        <span class="step-number">{{ i + 1 }}</span>
        <textarea
          :value="step"
          rows="2"
          @input="update(i, $event.target.value)"
        />
        <div class="step-actions">
          <button type="button" class="step-btn" :disabled="i === 0" @click="moveUp(i)" title="Move up">↑</button>
          <button type="button" class="step-btn" :disabled="i === modelValue.length - 1" @click="moveDown(i)" title="Move down">↓</button>
          <button type="button" class="step-btn danger" @click="remove(i)" title="Remove">×</button>
        </div>
      </li>
    </transition-group>

    <div class="add-row">
      <textarea
        v-model="newStep"
        :placeholder="placeholder"
        rows="2"
        @keydown.enter.prevent="add"
      />
      <button type="button" class="btn-add" @click="add">+ Add</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  placeholder: { type: String, default: 'Add a step and press Enter or click Add' },
})

const emit = defineEmits(['update:modelValue'])
const newStep = ref('')

function emit_(next) {
  emit('update:modelValue', next)
}

function add() {
  const val = newStep.value.trim()
  if (!val) return
  emit_([...props.modelValue, val])
  newStep.value = ''
}

function remove(i) {
  const next = [...props.modelValue]
  next.splice(i, 1)
  emit_(next)
}

function update(i, val) {
  const next = [...props.modelValue]
  next[i] = val
  emit_(next)
}

function moveUp(i) {
  if (i === 0) return
  const next = [...props.modelValue]
  ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
  emit_(next)
}

function moveDown(i) {
  if (i === props.modelValue.length - 1) return
  const next = [...props.modelValue]
  ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
  emit_(next)
}
</script>

<style scoped>
.step-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.steps-ol {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.5rem;
}

.step-number {
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  background: #e5e7eb;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 0.25rem;
}

.step-item textarea {
  flex: 1;
  font-family: inherit;
  font-size: 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 0.35rem 0.5rem;
  resize: vertical;
  background: #fff;
  color: #111827;
}

.step-item textarea:focus {
  outline: none;
  border-color: #0070f3;
  box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.12);
}

.step-actions {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex-shrink: 0;
}

.step-btn {
  width: 1.75rem;
  height: 1.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 0.8rem;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.1s;
  padding: 0;
}

.step-btn:hover:not(:disabled) {
  background: #f3f4f6;
  color: #111827;
}

.step-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.step-btn.danger:hover:not(:disabled) {
  background: #fee2e2;
  color: #ef4444;
  border-color: #fca5a5;
}

/* Add row */
.add-row {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.add-row textarea {
  flex: 1;
  font-family: inherit;
  font-size: 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0.4rem 0.6rem;
  resize: vertical;
  background: #fff;
  color: #111827;
}

.add-row textarea:focus {
  outline: none;
  border-color: #0070f3;
  box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.12);
}

.btn-add {
  flex-shrink: 0;
  padding: 0.45rem 0.85rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: background 0.1s;
  white-space: nowrap;
}

.btn-add:hover {
  background: #e5e7eb;
}

/* transition */
.step-enter-active,
.step-leave-active {
  transition: opacity 0.2s;
}
.step-enter-from,
.step-leave-to {
  opacity: 0;
}
</style>
