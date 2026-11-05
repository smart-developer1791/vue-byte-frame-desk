import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const fixture = JSON.parse(
  readFileSync(new URL('../public/sample-workspace.json', import.meta.url), 'utf8'),
)

import {
  parse,
  serialize,
  encode,
  decode,
  hex,
  xor,
  cleanHex,
  fieldAt,
  textExport,
} from '../src/domain/frame.ts'
test('sample has exact sync, endian fields, payload, and XOR coverage', () => {
  const w = parse(fixture),
    bytes = encode(w)
  assert.equal(hex(bytes), 'D3 91 10 34 12 06 00 48 65 6C 6C 6F 21 53')
  assert.deepEqual(decode(bytes, 'little'), { type: 16, sequence: 4660, payload: '48656C6C6F21' })
  assert.equal(hex(encode({ ...w, endian: 'big' })), 'D3 91 10 12 34 00 06 48 65 6C 6C 6F 21 53')
  assert.equal(xor(bytes.subarray(2)), 0)
  assert.match(serialize(w).provenance.marker, /^BF-[A-F0-9]{8}$/)
  assert.deepEqual(parse(serialize(w)), w)
})
test('both endian modes round trip all payload lengths including nonzero typed-array byte offsets', () => {
  for (const endian of ['little', 'big'] as const)
    for (let length = 0; length <= 128; length++) {
      const payload = Array.from({ length }, (_, i) =>
          ((i * 13) % 256).toString(16).padStart(2, '0'),
        )
          .join('')
          .toUpperCase(),
        w = parse({ ...fixture, endian, type: length, sequence: 65535 - length, payload }),
        frame = encode(w),
        container = new Uint8Array(frame.length + 11)
      container.set(frame, 5)
      assert.deepEqual(decode(container.subarray(5, 5 + frame.length), endian), {
        type: w.type,
        sequence: w.sequence,
        payload,
      })
    }
})
test('decoder rejects corrupt sync, impossible lengths, truncated/trailing data, checksums and unknown endian modes', () => {
  const bytes = encode(fixture)
  for (const index of [0, 1, 2, 5, 7, bytes.length - 1]) {
    const changed = bytes.slice()
    changed[index] ^= 1
    assert.throws(() => decode(changed, 'little'))
  }
  assert.throws(() => decode(bytes.subarray(0, -1), 'little'))
  assert.throws(() => decode(new Uint8Array([...bytes, 0]), 'little'))
  assert.throws(() => decode(new Uint8Array(137), 'little'))
  assert.throws(() => decode(bytes, 'big'))
  assert.throws(() => decode(bytes, 'sideways' as any))
})
test('workspace parsing rejects coercion and malformed pairs while the hex modifier normalizes only whitespace/case', () => {
  assert.equal(cleanHex('a a\nff\t10'), 'AAFF10')
  assert.equal(cleanHex('g g'), 'GG')
  assert.equal(parse({ ...fixture, payload: 'aaff' }).payload, 'AAFF')
  for (const change of [
    (w: any) => (w.endian = ['little']),
    (w: any) => (w.type = '16'),
    (w: any) => (w.type = 256),
    (w: any) => (w.sequence = 65536),
    (w: any) => (w.sequence = 1.2),
    (w: any) => (w.payload = 'A'),
    (w: any) => (w.payload = 'AA FF'),
    (w: any) => (w.payload = 'GG'),
    (w: any) => (w.payload = 'AA'.repeat(129)),
  ]) {
    const w = structuredClone(fixture)
    change(w)
    assert.throws(() => parse(w))
  }
})
test('empty payload endian ambiguity is explicit and annotated TXT retains printable bytes without control injection', () => {
  const w = parse({ ...fixture, payload: '', sequence: 0x1234 }),
    bytes = encode(w)
  assert.equal(bytes.length, 8)
  assert.equal(decode(bytes, 'big').sequence, 0x3412)
  assert.equal(decode(bytes, 'little').sequence, 0x1234)
  assert.deepEqual(
    Array.from({ length: 8 }, (_, i) => fieldAt(i, 8)),
    ['sync', 'sync', 'type', 'sequence', 'sequence', 'length', 'length', 'checksum'],
  )
  const text = textExport(fixture)
  assert.ok(text.includes('Hello!'))
  assert.ok(text.includes('0000  D3 91'))
  assert.ok(text.includes(serialize(fixture).provenance.marker))
})
test('maximum escaped workspaces produce exactly 136 binary bytes and complete round-trip JSON', () => {
  const w = parse({
      ...fixture,
      name: '"'.repeat(80),
      type: 255,
      sequence: 65535,
      payload: 'FF'.repeat(128),
    }),
    bytes = encode(w),
    json = JSON.stringify(serialize(w), null, 2)
  assert.equal(bytes.length, 136)
  assert.equal(xor(bytes.subarray(2)), 0)
  assert.deepEqual(decode(bytes, 'little'), { type: 255, sequence: 65535, payload: w.payload })
  assert.ok(json.length < 120000)
  assert.deepEqual(parse(JSON.parse(json)), w)
})
