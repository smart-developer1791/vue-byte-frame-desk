<script setup lang="ts">
import { cleanHex } from '../domain/frame.ts'
const [model, modifiers] = defineModel<string, 'hex'>({
  required: true,
  set(value) {
    return modifiers.hex ? cleanHex(value) : value
  },
})
function edit(event: Event) {
  const field = event.target as HTMLTextAreaElement
  model.value = field.value
  if (modifiers.hex) field.value = cleanHex(field.value)
}
</script>
<template>
  <label
    >Payload HEX<textarea
      :value="model"
      rows="5"
      maxlength="1024"
      spellcheck="false"
      class="resize-none font-mono! text-xs! leading-relaxed"
      @input="edit"
    />
  </label>
  <p class="mt-2 text-xs leading-relaxed text-muted">
    Spaces and line breaks are removed; letters become uppercase. Invalid characters stay visible
    until you fix them. Up to 128 complete byte pairs.
  </p>
</template>
