<template>
  <button
    type="button"
    class="toggle"
    :class="{ on: modelValue }"
    :aria-checked="modelValue"
    role="switch"
    @click="toggle"
  >
    <span class="thumb" />
    <span class="label">{{ modelValue ? 'Yes' : 'No' }}</span>
  </button>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

function toggle() {
  emit('update:modelValue', !props.modelValue)
}
</script>

<style scoped>
.toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
}

.thumb {
  width: 36px;
  height: 20px;
  border-radius: 999px;
  background: #d1d5db;
  position: relative;
  transition: background 0.2s;
  flex-shrink: 0;
}

.thumb::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.toggle.on .thumb {
  background: #0070f3;
}

.toggle.on .thumb::after {
  transform: translateX(16px);
}

.label {
  font-size: 0.875rem;
  color: #374151;
  min-width: 2rem;
}
</style>
