import { test, expect } from '@playwright/test'
import path from 'path'

// End-to-end: convert an image, open the stop-motion view from the toolbar,
// scrub the timeline, export the animated SVG.
test.describe('Stop Motion view', () => {
  test('open from toolbar, scrub, export animated SVG', async ({ page }) => {
    await page.goto('/')

    const fileInput = page.getByTestId('file-input')
    await expect(fileInput).toBeAttached()
    const fixturePath = path.join(__dirname, '../../../tests/fixtures/test-image.png')
    await fileInput.setInputFiles(fixturePath)

    await expect(page.getByTestId('editor-canvas')).toBeVisible({ timeout: 30_000 })

    // Open the stop-motion view via the new toolbar button.
    await page.getByRole('link', { name: /open stop-motion view/i }).click()

    // Header confirms we are on the right route.
    await expect(page.getByText(/Stop Motion —/)).toBeVisible()
    await expect(page.locator('svg').first()).toBeVisible()

    // Scrub the timeline — the preview SVG markup should change.
    const before = await page.locator('svg').first().innerHTML()
    await page.locator('input[type="range"]').first().fill('3')
    await page.waitForTimeout(100)
    const after = await page.locator('svg').first().innerHTML()
    expect(before).not.toBe(after)

    // Export Animated SVG — confirm a download fires.
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export Animated SVG' }).click(),
    ])
    expect(download.suggestedFilename()).toMatch(/\.svg$/)
  })
})
