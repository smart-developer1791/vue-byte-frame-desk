<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import sample from '../public/sample-workspace.json'
import StudioHeader from './components/StudioHeader.vue'
import DataTools from './components/DataTools.vue'
import AppDialog from './components/AppDialog.vue'
import HexPayload from './components/HexPayload.vue'
import BinaryImport from './components/BinaryImport.vue'
import { parse, serialize, encode, hex, fieldAt, textExport, type Fields } from './domain/frame.ts'
import { useDraft } from './services/draft.ts'
import { download } from './services/files.ts'
const { draft, storageStatus } = useDraft('vue-byte-frame-desk:v1', parse(sample), parse)
const title = ref(draft.value.name),
  endian = ref(draft.value.endian),
  type = ref<string | number>(draft.value.type),
  sequence = ref<string | number>(draft.value.sequence),
  payload = ref(draft.value.payload),
  error = ref(''),
  about = ref(false),
  revision = ref(0),
  selected = ref(0),
  notice = ref('')
const identity = computed(() => serialize(draft.value).provenance.marker),
  bytes = computed(() => encode(draft.value)),
  current = computed(() => bytes.value[selected.value]!)
function sync() {
  title.value = draft.value.name
  endian.value = draft.value.endian
  type.value = draft.value.type
  sequence.value = draft.value.sequence
  payload.value = draft.value.payload
}
watch(() => JSON.stringify(draft.value), sync)
watch(
  () => bytes.value.length,
  (length) => {
    if (selected.value >= length) selected.value = length - 1
  },
)
function replace(value: unknown) {
  draft.value = parse(value)
  sync()
  error.value = ''
  notice.value = 'Workspace loaded.'
  revision.value++
  selected.value = 0
}
function number(v: string | number) {
  return typeof v === 'number' ? v : v.trim() ? Number(v) : NaN
}
function save() {
  try {
    draft.value = parse({
      ...draft.value,
      name: title.value,
      endian: endian.value,
      type: number(type.value),
      sequence: number(sequence.value),
      payload: payload.value,
    })
    sync()
    error.value = ''
    revision.value++
    notice.value = 'Fields applied.'
  } catch (e) {
    error.value = (e as Error).message
  }
}
function loaded(fields: Fields, sourceRevision: number) {
  if (sourceRevision !== revision.value) return
  draft.value = parse({ ...draft.value, ...fields })
  sync()
  error.value = ''
  notice.value = 'Checked frame loaded; fields replaced.'
  revision.value++
  selected.value = 0
}
function exportBin() {
  download(identity.value + '.bin', bytes.value, 'application/octet-stream')
}
function exportText() {
  download(identity.value + '-frame.txt', textExport(draft.value), 'text/plain;charset=utf-8')
}
</script>
<template>
  <div data-project="vue-byte-frame-desk" class="min-h-screen">
    <StudioHeader title="Byte Frame Desk" subtitle="A frame, byte by byte" code="BF"
      ><DataTools
        :workspace="draft"
        :sample="sample"
        :parse="parse"
        :serialize="serialize"
        @replace="replace"
      /><button class="bg-surface hover:bg-soft" @click="about = true">About</button></StudioHeader
    >
    <main class="mx-auto max-w-[1480px] px-4 py-7 sm:px-6 lg:px-8">
      <section class="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div class="min-w-0 max-w-2xl">
          <p class="mb-2 text-xs font-bold uppercase tracking-[.18em] text-accent">
            A tiny binary workbench
          </p>
          <h1 class="break-words font-display text-3xl font-semibold leading-tight sm:text-4xl">
            {{ draft.name }}
          </h1>
          <p class="mt-3 max-w-xl leading-relaxed text-muted">
            Build a small packet, inspect its bytes, and read it back with the same explicit byte
            order.
          </p>
        </div>
        <div class="rounded-xl border border-line bg-surface px-4 py-3 text-right">
          <span class="block font-mono text-xs text-accent" data-ui="marker">{{ identity }}</span
          ><span class="mt-1 block text-xs text-muted" role="status">{{ storageStatus }}</span>
        </div>
      </section>
      <div
        data-ui="workspace"
        class="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]"
      >
        <section
          class="flex h-[960px] min-w-0 flex-col rounded-2xl border border-line bg-surface"
          data-ui="editor-panel"
        >
          <div class="flex items-center justify-between gap-3 border-b border-line p-5">
            <div>
              <h2 class="text-lg font-semibold">Compose the frame</h2>
              <p class="mt-1 text-xs text-muted">Fictional D3 91 format · bytes stay here</p>
            </div>
            <span class="rounded-full bg-soft px-3 py-1 font-mono text-xs text-accent"
              >{{ bytes.length }} B</span
            >
          </div>
          <div class="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
            <form class="space-y-4" @submit.prevent="save" novalidate data-ui="fields-form">
              <label>Workspace name<input v-model="title" maxlength="80" /></label
              ><label
                >Byte order<select v-model="endian">
                  <option value="little">Little endian · low byte first</option>
                  <option value="big">Big endian · high byte first</option>
                </select></label
              >
              <div class="grid grid-cols-2 gap-3">
                <label
                  >Message type<input
                    v-model="type"
                    type="number"
                    min="0"
                    max="255"
                    step="1" /></label
                ><label
                  >Sequence<input v-model="sequence" type="number" min="0" max="65535" step="1"
                /></label>
              </div>
              <HexPayload v-model.hex="payload" />
              <p class="min-h-5 text-xs text-danger" role="alert">{{ error }}</p>
              <button class="w-full border-accent! bg-accent text-on-accent hover:brightness-110">
                Apply frame fields
              </button>
            </form>
            <BinaryImport :endian="draft.endian" :revision="revision" @loaded="loaded" />
            <p class="min-h-5 text-xs text-accent" role="status">{{ notice }}</p>
            <a
              href="/sample-frame.bin"
              download
              class="inline-block text-xs font-semibold text-accent underline"
              >Download the sample BIN</a
            >
          </div>
        </section>
        <section
          class="flex h-[960px] min-w-0 flex-col rounded-2xl border border-line bg-surface"
          data-ui="preview-panel"
        >
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
            <div>
              <h2 class="text-lg font-semibold">Read the bytes</h2>
              <p class="mt-1 text-xs text-muted">
                {{ draft.endian }} endian · {{ draft.payload.length / 2 }} payload bytes
              </p>
            </div>
            <span class="rounded-md bg-soft px-3 py-2 font-mono text-xs font-semibold text-accent"
              >D3 91</span
            >
          </div>
          <div class="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
            <div class="grid grid-cols-3 gap-2">
              <div class="rounded-xl border border-line p-3">
                <p class="text-[10px] font-bold uppercase tracking-wide text-muted">Type</p>
                <p class="mt-1 font-mono text-lg">{{ draft.type }}</p>
              </div>
              <div class="rounded-xl border border-line p-3">
                <p class="text-[10px] font-bold uppercase tracking-wide text-muted">Sequence</p>
                <p class="mt-1 font-mono text-lg" data-ui="sequence">{{ draft.sequence }}</p>
              </div>
              <div class="rounded-xl border border-line p-3">
                <p class="text-[10px] font-bold uppercase tracking-wide text-muted">XOR</p>
                <p class="mt-1 font-mono text-lg" data-ui="checksum">{{ hex(bytes.slice(-1)) }}</p>
              </div>
            </div>
            <div class="h-[340px] overflow-y-auto rounded-xl border border-line bg-background p-4">
              <p class="mb-4 text-xs leading-relaxed text-muted">
                Select a byte for its offset, field, and bit pattern. Dark: checksum · tinted:
                payload.
              </p>
              <div class="grid grid-cols-8 gap-1.5 sm:grid-cols-16">
                <button
                  v-for="(byte, i) in bytes"
                  :key="i"
                  :data-byte="i"
                  :aria-label="
                    'Byte ' +
                    i +
                    ' ' +
                    fieldAt(i, bytes.length) +
                    ' ' +
                    byte.toString(16).toUpperCase().padStart(2, '0')
                  "
                  :aria-pressed="selected === i"
                  class="aspect-square min-h-0! min-w-0 rounded-md! p-0! font-mono text-xs! outline-offset-2!"
                  :class="[
                    fieldAt(i, bytes.length) === 'checksum'
                      ? 'border-accent! bg-accent text-white'
                      : fieldAt(i, bytes.length) === 'payload'
                        ? 'bg-soft text-accent'
                        : 'bg-surface text-muted',
                    selected === i ? 'ring-2 ring-accent ring-offset-2' : 'hover:brightness-95',
                  ]"
                  @click="selected = i"
                >
                  {{ byte.toString(16).toUpperCase().padStart(2, '0') }}
                </button>
              </div>
            </div>
            <div class="rounded-xl border border-line bg-soft p-4">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h3 class="font-semibold">
                  Byte {{ selected }} · {{ fieldAt(selected, bytes.length) }}
                </h3>
                <span class="font-mono text-lg text-accent" data-ui="byte-bits">{{
                  current.toString(2).padStart(8, '0')
                }}</span>
              </div>
              <p class="mt-2 font-mono text-xs text-muted">
                Offset 0x{{ selected.toString(16).toUpperCase().padStart(4, '0') }} · decimal
                {{ current }}
              </p>
            </div>
            <div class="rounded-xl border border-line p-4">
              <h3 class="font-semibold">On the wire</h3>
              <pre
                class="mt-3 h-24 overflow-auto whitespace-pre-wrap break-all font-mono text-xs leading-relaxed text-accent"
                data-ui="frame-hex"
                >{{ hex(bytes) }}</pre>
            </div>
            <p class="text-xs leading-relaxed text-muted">
              Sync occupies offsets 0–1; type 2; sequence 3–4; length 5–6. Payload starts at 7 and
              the last byte is XOR. This format carries no endian flag: choose the matching saved
              mode before importing. No serial or network connection is opened.
            </p>
          </div>
          <div class="flex flex-wrap gap-2 border-t border-line p-4">
            <button class="flex-1 bg-background hover:bg-soft" @click="exportBin">Export BIN</button
            ><button class="flex-1 bg-background hover:bg-soft" @click="exportText">
              Frame TXT
            </button>
          </div>
        </section>
      </div>
      <footer
        class="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-xs text-muted"
      >
        <span>Made with Vue · Stored on this device</span><span>CodeSculptor · MIT · 2026</span>
      </footer>
    </main>
    <AppDialog v-model="about" title="About Byte Frame Desk"
      ><div class="space-y-4 leading-relaxed text-muted">
        <p>
          This fictional frame format starts D3 91, then one type byte, a two-byte sequence,
          two-byte payload length, 0–128 payload bytes, and one XOR-8 checksum. Multi-byte fields
          follow your saved endian mode. XOR covers all bytes after sync except the checksum itself;
          it detects some errors but is not cryptographic authentication.
        </p>
        <p>
          JSON keeps the editable workspace. Local storage stays on this browser; exports let you
          keep a copy elsewhere.
        </p>
        <a href="/sample-workspace.json" class="font-semibold text-accent underline" download
          >Download the complete sample</a
        >
      </div></AppDialog
    >
  </div>
</template>
