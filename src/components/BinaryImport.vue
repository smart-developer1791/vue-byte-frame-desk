<script setup lang="ts">
import { shallowRef, ref, watch, onWatcherCleanup } from 'vue'
import { decode, type Fields, type Endian } from '../domain/frame.ts'
const props = defineProps<{ endian: Endian; revision: number }>()
const emit = defineEmits<{ loaded: [fields: Fields, revision: number] }>()
const file = shallowRef<File | null>(null),
  busy = ref(false),
  error = ref('')
function choose(event: Event) {
  const input = event.target as HTMLInputElement
  file.value = input.files?.[0] ?? null
  input.value = ''
}
watch(
  () => props.revision,
  () => {
    file.value = null
    error.value = ''
  },
)
watch(file, async (selected) => {
  if (!selected) return
  let active = true
  busy.value = true
  error.value = ''
  const endian = props.endian,
    revision = props.revision
  onWatcherCleanup(() => {
    active = false
    busy.value = false
  })
  try {
    if (selected.size < 8 || selected.size > 136) throw new Error('Frame must contain 8–136 bytes.')
    const bytes = new Uint8Array(await selected.arrayBuffer())
    if (active) emit('loaded', decode(bytes, endian), revision)
  } catch (e) {
    if (active) error.value = (e as Error).message
  } finally {
    if (active) busy.value = false
  }
})
</script>
<template>
  <div class="rounded-xl border border-line bg-background p-4" data-ui="binary-import">
    <h3 class="font-semibold">Read a checked frame</h3>
    <p class="mt-2 text-xs leading-relaxed text-muted">
      Uses the saved {{ endian }}-endian mode. A valid file replaces type, sequence, and payload;
      your workspace name stays.
    </p>
    <label class="mt-3"
      >Frame BIN file<input type="file" accept=".bin,application/octet-stream" @change="choose"
    /></label>
    <p class="mt-3 min-h-5 text-xs" :class="error ? 'text-danger' : 'text-muted'" role="alert">
      {{ error }}
    </p>
    <p class="min-h-4 text-xs text-muted" role="status">
      {{ busy ? 'Reading a frame…' : '8–136 bytes · sync, length, and XOR checked' }}
    </p>
  </div>
</template>
