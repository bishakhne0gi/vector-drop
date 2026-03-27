import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Upload and Convert', () => {
  test('happy path: upload → convert → view SVG editor', async ({ page }) => {
    await page.goto('/')

    // Find file input
    const fileInput = page.getByTestId('file-input')
    await expect(fileInput).toBeAttached()

    const fixturePath = path.join(__dirname, '../../tests/fixtures/test-image.png')
    await fileInput.setInputFiles(fixturePath)

    // Conversion progress should appear
    await expect(page.getByTestId('conversion-progress')).toBeVisible()

    // Editor canvas should appear within 30s
    await expect(page.getByTestId('editor-canvas')).toBeVisible({ timeout: 30_000 })
  })

  test('rejects invalid file type (PDF) with error message', async ({ page }) => {
    await page.goto('/')

    const fileInput = page.getByTestId('file-input')
    const pdfPath = path.join(__dirname, '../../tests/fixtures/test.pdf')
    await fileInput.setInputFiles(pdfPath)

    await expect(page.getByTestId('upload-error')).toBeVisible()
    const errorText = await page.getByTestId('upload-error').textContent()
    expect(errorText?.toLowerCase()).toMatch(/invalid|unsupported|pdf|format/)
  })
})
