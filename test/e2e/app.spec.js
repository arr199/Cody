import { test, expect } from '@playwright/test'
import { encode } from 'js-base64'

// End-to-end tests against the real app in a real browser. The only thing
// faked is the third-party link shortener, so tests never write to its database.

const SHORTENER = '**/simple-api-server-production.up.railway.app/**'
const SHORT_LINK = 'https://short.example/abc'

// Builds a share link the same way the app does: html|js|css, URL-safe base64
const shareLink = ({ html = '', js = '', css = '' }) =>
  `/#${[html, js, css].map(part => encode(part, true)).join('|')}`

const consoleRows = (page) => page.locator('#console .console-region > div')
const preview = (page) => page.frameLocator('#page')

async function openApp (page, path = '/') {
  await page.goto(path)
  await expect(page.locator('.monaco-editor')).toHaveCount(3)
}

// Clicks into an editor and puts the cursor at the very end of its content
async function focusEditorEnd (page, selector) {
  await page.locator(`${selector} .view-lines`).click()
  await page.keyboard.press('Control+End')
}

async function mockShortener (page, behavior) {
  await page.route(SHORTENER, route => {
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' }
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors })
    if (behavior === 'fail') return route.abort()
    return route.fulfill({ status: 200, headers: cors, json: { status: 'ok', link: SHORT_LINK } })
  })
}

test.describe('preview and console', () => {
  test('renders the code and shows console output', async ({ page }) => {
    const js = [
      "console.log('a'); console.log('a')",
      'const o = { n: 1 }; o.self = o; console.log(o)',
      'console.log(window)',
      "console.warn('careful')",
      "const tag = '</script>'; console.log('after script tag')",
      "throw new Error('boom')"
    ].join('\n')
    await openApp(page, shareLink({ html: '<h1 id="t">Hello</h1>', js, css: 'h1 { color: rgb(1, 2, 3) }' }))

    await expect(preview(page).locator('#t')).toHaveCSS('color', 'rgb(1, 2, 3)')
    const rows = consoleRows(page)
    await expect(rows).toHaveText([
      'a', // identical logs are both shown
      'a',
      '{n: 1, self: [Circular]}',
      'Window',
      'careful',
      'after script tag', // "</script>" in a string doesn't break the page
      'UncaughtError: boom'
    ])
    await expect(rows.filter({ hasText: 'careful' })).toHaveClass('warn')
    await expect(rows.filter({ hasText: 'boom' })).toHaveClass('error')
  })

  test('shows HTML in logs as text instead of rendering it', async ({ page }) => {
    let dialogs = 0
    page.on('dialog', dialog => { dialogs++; return dialog.dismiss() })
    await openApp(page, shareLink({ js: "console.log('<img src=x onerror=alert(1)>')" }))

    await expect(consoleRows(page)).toHaveText(['<img src=x onerror=alert(1)>'])
    await expect(page.locator('#console img')).toHaveCount(0)
    expect(dialogs).toBe(0)
  })

  test('sandboxes the preview from the app', async ({ page }) => {
    const js = [
      "try { parent.document.body.innerHTML = '' } catch (e) { console.log('parent:' + e.name) }",
      "try { localStorage.getItem('x') } catch (e) { console.log('storage:' + e.name) }"
    ].join('\n')
    await openApp(page, shareLink({ js }))

    await expect(consoleRows(page)).toHaveText(['parent:SecurityError', 'storage:SecurityError'])
    await expect(page.locator('#editors-container')).toBeVisible()
  })

  test('re-running after edits does not duplicate logs', async ({ page }) => {
    await openApp(page, shareLink({ js: "console.log('once')" }))
    await expect(consoleRows(page)).toHaveText(['once'])

    await focusEditorEnd(page, '#js-editor')
    for (let i = 0; i < 3; i++) {
      await page.keyboard.type(' ')
      await page.waitForTimeout(1700) // JS re-renders 1.5 s after the last edit
    }
    await expect(consoleRows(page)).toHaveText(['once'])
  })

  test('shows editor errors without wiping the logs', async ({ page }) => {
    await openApp(page, shareLink({ js: "console.log('kept')" }))
    await expect(consoleRows(page)).toHaveText(['kept'])

    await focusEditorEnd(page, '#css-editor')
    await page.keyboard.type('h1 { color: ')

    await expect(consoleRows(page).filter({ hasText: /^css Line 1:/ })).toHaveClass('error')
    await expect(consoleRows(page).filter({ hasText: 'kept' })).toHaveCount(1)
  })
})

test.describe('editors', () => {
  test('expands Emmet abbreviations in the HTML editor', async ({ page }) => {
    await openApp(page)
    await focusEditorEnd(page, '#html-editor')
    await page.keyboard.type('h1#title')
    await expect(page.locator('#html-editor .suggest-widget')).toBeVisible()
    await page.keyboard.press('Tab')

    await expect(preview(page).locator('h1#title')).toHaveCount(1)
  })

  test('suggests completions in the JS editor', async ({ page }) => {
    await openApp(page)
    await focusEditorEnd(page, '#js-editor')
    await page.keyboard.type('console.lo')

    await expect(page.locator('#js-editor .suggest-widget')).toContainText('log')
  })

  test('opens the find widget', async ({ page }) => {
    await openApp(page, shareLink({ js: "console.log('find me')" }))
    await focusEditorEnd(page, '#js-editor')
    await page.keyboard.press('Control+f')

    await expect(page.locator('#js-editor .find-widget')).toBeVisible()
  })
})

test.describe('share links', () => {
  test('keeps the code in the URL hash across reloads', async ({ page }) => {
    await openApp(page)
    await focusEditorEnd(page, '#js-editor')
    await page.keyboard.type("console.log('saved')")
    await expect(page).toHaveURL(/\/#.+/)

    await page.reload()
    await expect(consoleRows(page)).toHaveText(['saved'])
  })

  test('loads another share link opened in the same tab', async ({ page }) => {
    await openApp(page, shareLink({ js: "console.log('first')" }))
    await expect(consoleRows(page)).toHaveText(['first'])

    await page.goto(shareLink({ js: "console.log('second')" })) // only the hash changes
    await expect(consoleRows(page)).toHaveText(['second'])
  })

  test('opens legacy path links, including base64 containing "/"', async ({ page }) => {
    const html = '<p id="legacy">???</p>'
    expect(encode(html)).toContain('/')
    await openApp(page, `/${encode(html)}%7C${encode("console.log('legacy')")}%7C${encode('p { margin: 0 }')}`)

    await expect(preview(page).locator('#legacy')).toHaveText('???')
    await expect(consoleRows(page)).toHaveText(['legacy'])
    // ...and moves them over to the hash format
    await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/#.+/)
  })

  test('copies the shortened link', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await mockShortener(page, 'ok')
    await openApp(page, shareLink({ js: "console.log('share me')" }))

    await page.locator('#copy-url-button').click()
    await expect(page.locator('#url-copy-container')).toHaveText('URL Copied to Clipboard')
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(SHORT_LINK)
  })

  test('copies the full link when the shortener fails', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await mockShortener(page, 'fail')
    await openApp(page, shareLink({ js: "console.log('share me')" }))

    await page.locator('#copy-url-button').click()
    await expect(page.locator('#url-copy-container')).toHaveText('URL Copied to Clipboard')
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(page.url())
  })
})

test.describe('toolbar', () => {
  test('menus open and close with mouse and keyboard', async ({ page }) => {
    await openApp(page)
    const button = page.locator('#font-size-button')
    const menu = page.locator('#font-size-menu')

    await button.click()
    await expect(menu).toBeVisible()
    await expect(button).toHaveAttribute('aria-expanded', 'true')

    await page.keyboard.press('Escape')
    await expect(menu).toBeHidden()
    await expect(button).toBeFocused()

    // Clicking the icon inside the button opens it too
    await page.locator('#font-size-button svg').click()
    await expect(menu).toBeVisible()
    await expect(button).toHaveClass(/buttons-active/)

    // Clicking into the preview iframe closes it
    await page.locator('#page').click()
    await expect(menu).toBeHidden()

    // Keyboard selection
    await button.focus()
    await page.keyboard.press('Enter')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    await expect(menu).toBeHidden()
    await expect(page.locator('#js-editor .view-lines')).toHaveCSS('font-size', '14px')
  })

  test('theme and font size persist across reloads', async ({ page }) => {
    await openApp(page)

    await page.locator('#theme-button').click()
    await page.locator('#theme-menu [data-value="vs"]').click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

    await page.locator('#font-size-button').click()
    await page.locator('#font-size-menu [data-value="18"]').click()

    await page.reload()
    await expect(page.locator('.monaco-editor')).toHaveCount(3)
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await expect(page.locator('#js-editor .view-lines')).toHaveCSS('font-size', '18px')
  })

  test('switches between frontend and playground views', async ({ page }) => {
    await openApp(page)

    await page.locator('#playground-view-button').click()
    await expect(page.locator('#html-editor')).toBeHidden()
    await expect(page.locator('#css-editor')).toBeHidden()
    await expect(page.locator('#page')).toBeHidden()
    await expect(page.locator('#js-editor')).toBeVisible()
    await expect(page.locator('#console')).toBeVisible()

    await page.locator('#frontend-view-button').click()
    await expect(page.locator('#html-editor')).toBeVisible()
    await expect(page.locator('#page')).toBeVisible()
  })

  test('the app page itself has no uncaught errors', async ({ page }) => {
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    // pageerror also reports errors thrown inside the preview iframe, so use
    // code that doesn't throw
    await openApp(page, shareLink({ html: '<p>hi</p>', js: "console.log('ok')" }))
    await expect(consoleRows(page)).toHaveText(['ok'])
    expect(errors).toEqual([])
  })
})
