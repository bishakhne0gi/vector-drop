import { test, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'

// To run this test locally, generate a 3-second test fixture once:
//   ffmpeg -f lavfi -i color=c=red:s=320x240:r=30:d=3 -vcodec libx264 \
//          -pix_fmt yuv420p tests/fixtures/test-video.mp4
// The test is skipped if the fixture is missing.
const FIXTURE = path.join(__dirname, '../../../tests/fixtures/test-video.mp4')

test.describe('Video Stop Motion', () => {
  test.skip(!fs.existsSync(FIXTURE), 'tests/fixtures/test-video.mp4 not present')

  test('upload → process → land on stop-motion view → export SVG', async ({ page }) => {
    await page.goto('/')
    const fileInput = page.getByTestId('file-input')
    await fileInput.setInputFiles(FIXTURE)

    await page.waitForURL(/\/processing\/video\//, { timeout: 30_000 })
    await page.waitForURL(/\/editor\/.*\/stopmotion/, { timeout: 120_000 })
    await expect(page.getByText(/Stop Motion —/)).toBeVisible()

    const before = await page.locator('svg').first().innerHTML()
    await page.locator('input[type="range"]').first().fill('5')
    await page.waitForTimeout(200)
    const after = await page.locator('svg').first().innerHTML()
    expect(before).not.toBe(after)

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export Animated SVG' }).click(),
    ])
    expect(download.suggestedFilename()).toMatch(/\.svg$/)
  })
})
