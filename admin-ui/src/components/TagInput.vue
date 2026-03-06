<template>
  <div class="tag-input">
    <div class="tags">
      <span v-for="(tag, i) in modelValue" :key="i" class="tag">
        {{ tag }}
        <button type="button" class="remove" @click="remove(i)" aria-label="Remove">×</button>
      </span>
      <input
        v-model="current"
        type="text"
        :placeholder="modelValue.length === 0 ? placeholder : ''"
        @keydown.enter.prevent="add"
        @keydown.tab.prevent="add"
        @keydown.backspace="backspace"
        @blur="add"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  placeholder: { type: String, default: 'Add item and press Enter' },
})

const emit = defineEmits(['update:modelValue'])
const current = ref('')

function add() {
  const val = current.value.trim()
  if (val && !props.modelValue.includes(val)) {
    emit('update:modelValue', [...props.modelValue, val])
  }
  current.value = ''
}

function remove(i) {
  const next = [...props.modelValue]
  next.splice(i, 1)
  emit('update:modelValue', next)
}

function backspace() {
  if (current.value === '' && props.modelValue.length > 0) {
    const next = [...props.modelValue]
    next.pop()
    emit('update:modelValue', next)
  }
}
</script>

<style scoped>
.tag-input {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  padding: 0.3rem 0.4rem;
  cursor: text;
  transition: border-color 0.15s;
}

.tag-input:focus-within {
  border-color: #0070f3;
  box-shadow: 0 0 0 3px rgba(0, 112, 243, 0.12);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  align-items: center;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  padding: 0.15rem 0.55rem 0.15rem 0.6rem;
  font-size: 0.8rem;
  font-weight: 500;
}

.remove {
  background: none;
  border: none;
  cursor: pointer;
  color: #93c5fd;
  font-size: 1rem;
  line-height: 1;
  padding: 0;
  display: flex;
  align-items: center;
  transition: color 0.1s;
}

.remove:hover {
  color: #1d4ed8;
}

.tag-input input {
  border: none;
  outline: none;
  font-size: 0.875rem;
  font-family: inherit;
  background: transparent;
  flex: 1;
  min-width: 120px;
  padding: 0.15rem 0.25rem;
  color: #111827;
}
</style>
