import { test, expect, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
const fixture = JSON.parse(
  await readFile(new URL('../../public/sample-workspace.json', import.meta.url), 'utf8'),
)
async function importData(page: Page, value: unknown) {
  await page.getByRole('button', { name: 'Import', exact: true }).click()
  await page.getByLabel('Workspace JSON', { exact: true }).fill(JSON.stringify(value))
  await page.getByRole('button', { name: 'Import workspace', exact: true }).click()
  await expect(page.locator('dialog[open]')).toHaveCount(0)
}
async function deliver(page: Page, label: string) {
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: label, exact: true }).click()
  const file = await pending
  return { name: file.suggestedFilename(), buffer: await readFile((await file.path())!) }
}

import { encode } from '../../src/domain/frame.ts'
test('the custom hex modifier normalizes the actual textarea while valid fields change endian bytes and persist', async ({
  page,
}) => {
  await page.goto('/')
  const payload = page.getByRole('textbox', { name: 'Payload HEX', exact: true })
  await payload.fill('00 aa\nff')
  await expect(payload).toHaveValue('00AAFF')
  await payload.fill('GG')
  await page.getByRole('button', { name: 'Apply frame fields', exact: true }).click()
  await expect(page.locator('[data-ui="fields-form"]').getByRole('alert')).toContainText(
    'complete HEX',
  )
  await expect(page.locator('[data-ui="sequence"]')).toHaveText('4660')
  await payload.fill('00 aa ff')
  await page.getByRole('combobox', { name: 'Byte order', exact: true }).selectOption('big')
  await page.getByRole('spinbutton', { name: 'Message type', exact: true }).fill('1')
  await page.getByRole('spinbutton', { name: 'Sequence', exact: true }).fill('258')
  await page.getByRole('button', { name: 'Apply frame fields', exact: true }).click()
  await expect(page.locator('[data-ui="frame-hex"]')).toHaveText('D3 91 01 01 02 00 03 00 AA FF 54')
  await page.locator('[data-byte="3"]').click()
  await expect(page.locator('[data-ui="byte-bits"]')).toHaveText('00000001')
  await page.reload()
  await expect(payload).toHaveValue('00AAFF')
  await expect(page.getByRole('combobox', { name: 'Byte order', exact: true })).toHaveValue('big')
})
test('downloaded BIN and public sample are exact bytes, checked file import replaces fields and TXT is annotated', async ({
  page,
}) => {
  await page.goto('/')
  const file = await deliver(page, 'Export BIN')
  expect([...file.buffer]).toEqual([
    0xd3, 0x91, 0x10, 0x34, 0x12, 6, 0, 0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x21, 0x53,
  ])
  expect(file.name).toMatch(/^BF-[A-F0-9]{8}\.bin$/)
  const response = await page.request.get('/sample-frame.bin')
  expect(response.ok()).toBe(true)
  expect(await response.body()).toEqual(file.buffer)
  const text = (await deliver(page, 'Frame TXT')).buffer.toString('utf8')
  expect(text).toContain('Hello!')
  expect(text).toContain('0000  D3 91')
  expect(text).toContain(await page.locator('[data-ui="marker"]').innerText())
  await page.getByLabel('Frame BIN file', { exact: true }).setInputFiles({
    name: 'checked.bin',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from(encode({ ...fixture, sequence: 600, payload: '1122' })),
  })
  await expect(page.locator('[data-ui="sequence"]')).toHaveText('600')
  await expect(page.getByRole('textbox', { name: 'Payload HEX', exact: true })).toHaveValue('1122')
  await expect(
    page.getByRole('heading', { level: 1, name: fixture.name, exact: true }),
  ).toBeVisible()
})
test('corrupt or oversized files and invalid numeric forms leave the saved frame intact', async ({
  page,
}) => {
  await page.goto('/')
  const input = page.getByLabel('Frame BIN file', { exact: true }),
    bad = encode(fixture)
  bad[7] ^= 1
  await input.setInputFiles({
    name: 'bad.bin',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from(bad),
  })
  await expect(page.locator('[data-ui="binary-import"]').getByRole('alert')).toContainText(
    'checksum',
  )
  await expect(page.locator('[data-ui="sequence"]')).toHaveText('4660')
  await input.setInputFiles({
    name: 'large.bin',
    mimeType: 'application/octet-stream',
    buffer: Buffer.alloc(137),
  })
  await expect(page.locator('[data-ui="binary-import"]').getByRole('alert')).toContainText('8–136')
  await page.getByRole('spinbutton', { name: 'Sequence', exact: true }).fill('')
  await page.getByRole('button', { name: 'Apply frame fields', exact: true }).click()
  await expect(page.locator('[data-ui="fields-form"]').getByRole('alert')).toContainText(
    'must be an integer',
  )
  expect(await page.evaluate(() => localStorage.getItem('vue-byte-frame-desk:v1'))).toBeNull()
})
test('latest file wins and applying fields prevents an older asynchronous read from overwriting them', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = File.prototype.arrayBuffer
    File.prototype.arrayBuffer = async function () {
      const result = await original.call(this)
      if (this.name.startsWith('slow')) await new Promise((resolve) => setTimeout(resolve, 300))
      return result
    }
  })
  await page.goto('/')
  const input = page.getByLabel('Frame BIN file', { exact: true }),
    file = (name: string, sequence: number) => ({
      name,
      mimeType: 'application/octet-stream',
      buffer: Buffer.from(encode({ ...fixture, sequence })),
    })
  await input.setInputFiles(file('slow-first.bin', 1))
  await input.setInputFiles(file('fast-second.bin', 2))
  await expect(page.locator('[data-ui="sequence"]')).toHaveText('2')
  await page.waitForTimeout(400)
  await expect(page.locator('[data-ui="sequence"]')).toHaveText('2')
  await input.setInputFiles(file('slow-third.bin', 3))
  await page.getByRole('spinbutton', { name: 'Sequence', exact: true }).fill('123')
  await page.getByRole('button', { name: 'Apply frame fields', exact: true }).click()
  await page.waitForTimeout(400)
  await expect(page.locator('[data-ui="sequence"]')).toHaveText('123')
})
