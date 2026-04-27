import { test, expect } from '@playwright/test'

// Smoke E2E — runs against the Vite dev server (frontend-only).
// API calls (e.g. /api/site/home) will fail; the UI must still render fallback content.
// For full-stack E2E, run `npx wrangler pages dev dist ...` and set E2E_BASE_URL=http://localhost:8788.

test('home page renders the artist name as <h1>', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: /Belisa Wagner/i })).toBeVisible()
})

test('login page renders form', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByLabel(/mot de passe/i)).toBeVisible()
})

test('unknown route shows 404', async ({ page }) => {
  await page.goto('/this-route-does-not-exist')
  await expect(page.getByRole('heading', { name: '404' })).toBeVisible()
})

test('navigation between public pages works', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /^Oeuvres$/ }).click()
  await expect(page).toHaveURL(/\/oeuvres$/)
  await page.getByRole('link', { name: /^Blog$/ }).click()
  await expect(page).toHaveURL(/\/blog$/)
})

test('blog page does not show "Proposer un article" button to anonymous visitors', async ({ page }) => {
  await page.goto('/blog')
  await expect(page.getByRole('button', { name: /Proposer un article/i })).toHaveCount(0)
})
