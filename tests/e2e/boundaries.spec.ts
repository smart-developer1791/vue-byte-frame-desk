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

import { parse } from '../../src/domain/frame.ts'
test('maximum escaped workspace downloads and re-imports in full at 320px', async ({ page }) => {
  test.setTimeout(60000)
  await page.setViewportSize({ width: 320, height: 1000 })
  await page.goto('/')
  const value = structuredClone(fixture)
  value.name = '"'.repeat(80)
  value.endian = 'big'
  value.type = 255
  value.sequence = 65535
  value.payload = 'FF'.repeat(128)
  await importData(page, value)
  await expect(page.locator('[data-byte]')).toHaveCount(136)
  const file = await deliver(page, 'JSON'),
    text = file.buffer.toString('utf8')
  expect(text.length).toBeLessThanOrEqual(120000)
  expect(parse(JSON.parse(text))).toEqual(parse(value))
  await importData(page, JSON.parse(text))
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
