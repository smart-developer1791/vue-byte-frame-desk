import { record } from './validation.ts'
import { single, integer, provenance } from './shared.ts'
export type Endian = 'little' | 'big'
export type Fields = { type: number; sequence: number; payload: string }
export type Workspace = Fields & { version: 1; name: string; endian: Endian }
export function cleanHex(value: string) {
  return value.replace(/\s/g, '').toUpperCase()
}
export function parse(value: unknown): Workspace {
  const o = record(value, 'Workspace')
  if (o.version !== 1) throw new Error('Workspace version must be 1.')
  if (o.endian !== 'little' && o.endian !== 'big') throw new Error('Endian must be little or big.')
  if (typeof o.payload !== 'string' || !/^(?:[0-9A-Fa-f]{2}){0,128}$/.test(o.payload))
    throw new Error('Payload must contain complete HEX byte pairs, at most 128 bytes.')
  return {
    version: 1,
    name: single(o.name, 'Workspace name', 80),
    endian: o.endian,
    type: integer(o.type, 'Message type', 0, 255),
    sequence: integer(o.sequence, 'Sequence', 0, 65535),
    payload: o.payload.toUpperCase(),
  }
}
export function serialize(value: unknown) {
  const w = parse(value)
  return { ...w, provenance: provenance('BF', 'vue-byte-frame-desk', w) }
}
export function xor(bytes: Uint8Array) {
  return bytes.reduce((sum, byte) => sum ^ byte, 0)
}
export function encode(value: unknown): Uint8Array {
  const w = parse(value),
    length = w.payload.length / 2,
    bytes = new Uint8Array(8 + length),
    view = new DataView(bytes.buffer)
  bytes.set([0xd3, 0x91, w.type])
  view.setUint16(3, w.sequence, w.endian === 'little')
  view.setUint16(5, length, w.endian === 'little')
  for (let i = 0; i < length; i++) bytes[7 + i] = parseInt(w.payload.slice(i * 2, i * 2 + 2), 16)
  bytes[bytes.length - 1] = xor(bytes.subarray(2, -1))
  return bytes
}
export function hex(bytes: Uint8Array) {
  return [...bytes].map((byte) => byte.toString(16).toUpperCase().padStart(2, '0')).join(' ')
}
export function decode(bytes: Uint8Array, endian: Endian): Fields {
  if (endian !== 'little' && endian !== 'big') throw new Error('Choose a valid endian mode.')
  if (bytes.length < 8 || bytes.length > 136) throw new Error('Frame must contain 8–136 bytes.')
  if (bytes[0] !== 0xd3 || bytes[1] !== 0x91) throw new Error('Frame sync must be D3 91.')
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength),
    length = view.getUint16(5, endian === 'little')
  if (length > 128 || bytes.length !== length + 8)
    throw new Error('Payload length does not match this endian mode or file size.')
  if (xor(bytes.subarray(2, -1)) !== bytes[bytes.length - 1])
    throw new Error('XOR checksum does not match.')
  return {
    type: bytes[2]!,
    sequence: view.getUint16(3, endian === 'little'),
    payload: hex(bytes.subarray(7, -1)).replaceAll(' ', ''),
  }
}
export function fieldAt(index: number, length: number) {
  return index < 2
    ? 'sync'
    : index === 2
      ? 'type'
      : index < 5
        ? 'sequence'
        : index < 7
          ? 'length'
          : index === length - 1
            ? 'checksum'
            : 'payload'
}
export function textExport(value: unknown) {
  const w = parse(value),
    bytes = encode(w)
  return (
    w.name +
    '\n' +
    serialize(w).provenance.marker +
    ' · CodeSculptor\nFictional D3 91 frame · ' +
    w.endian +
    ' endian\nType: ' +
    w.type +
    ' · Sequence: ' +
    w.sequence +
    ' · Payload: ' +
    w.payload.length / 2 +
    ' bytes\nXOR-8 covers type, sequence, length, and payload; sync is excluded.\n\n' +
    Array.from({ length: Math.ceil(bytes.length / 16) }, (_, row) => {
      const offset = row * 16,
        part = bytes.slice(offset, offset + 16)
      return (
        offset.toString(16).toUpperCase().padStart(4, '0') +
        '  ' +
        hex(part).padEnd(47, ' ') +
        '  ' +
        [...part].map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.')).join('')
      )
    }).join('\n') +
    '\n'
  )
}
