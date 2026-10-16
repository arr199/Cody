import { test, expect } from '@playwright/test'
import { encode, decode } from 'js-base64'

// End-to-end tests against the real app in a real browser. The only thing
// faked is the third-party link shortener, so tests never write to its database.

const SHORTENER = '**/simple-api-server-production.up.railway.app/**'
const SHORT_LINK = 'https://short.example/abc'

// Builds a share link the same way the app does: html|js|css, URL-safe base64
const shareLink = ({ html = '', js = '', css = '' }) =>
  `/#${[html, js, css].map(part => encode(part, true)).join('|')}`

const consoleRows = (page) => page.locator('#console .console-region > div')

// WCAG 2 contrast ratio between two computed `rgb(r, g, b)` colours
function contrast (a, b) {
  const luminance = (rgb) => {
    const [r, g, bl] = rgb.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map(c => {
      const s = c / 255
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl
  }
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
const preview = (page) => page.frameLocator('#page')

async function openApp (page, path = '/') {
  await page.goto(path)
  await expect(page.locator('.monaco-editor')).toHaveCount(3)
}

// Opens an editor's tab, clicks into it and puts the cursor at the very end
async function focusEditorEnd (page, selector) {
  const language = selector.match(/#(\w+)-editor/)[1]
  await page.locator(`#tab-${language}`).click()
  await page.locator(`${selector} .view-lines`).click()
  await page.keyboard.press('Control+End')
}

const exampleOption = (page, id) => page.locator(`#examples-menu .example-option[data-value="${id}"]`)

async function chooseExample (page, id) {
  await page.locator('#examples-button').click()
  await exampleOption(page, id).click()
}

// The app opens on the welcome example; tests that need empty editors start here
async function openBlank (page) {
  await openApp(page)
  await chooseExample(page, 'blank')
  await expect(page).toHaveURL(/\/$/)
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
    await expect(page.locator('#workspace')).toBeVisible()
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

test.describe('run control', () => {
  const autoRun = (page) => page.locator('.editor-bar').getByRole('switch', { name: 'Auto-run' })
  const runButton = (page) => page.locator('.editor-bar').getByRole('button', { name: /^Run/ })

  test('with auto-run off, edits wait for Run, which shows the preview is out of date', async ({ page }) => {
    await openApp(page, shareLink({ html: '<p id="t">one</p>' }))
    const firstUrl = page.url()
    await autoRun(page).click()
    await expect(autoRun(page)).toHaveAttribute('aria-checked', 'false')

    await focusEditorEnd(page, '#html-editor')
    await page.keyboard.type(' two')
    await page.waitForTimeout(900) // HTML would have re-run after 0.5 s
    await expect(preview(page).locator('body')).toHaveText('one')
    await expect(runButton(page)).toHaveAccessibleName('Run, preview out of date')
    await expect(runButton(page)).toHaveAttribute('data-stale', '')
    expect(page.url()).not.toBe(firstUrl) // the link still follows the editors

    // Ctrl+Enter in the editor runs it, without adding a line
    await page.keyboard.press('Control+Enter')
    await expect(preview(page).locator('body')).toHaveText('one two')
    await expect(runButton(page)).toHaveAccessibleName('Run')
    await expect(page.locator('#html-editor .view-line')).toHaveCount(1)
  })

  test('Run re-runs the code straight away', async ({ page }) => {
    await openApp(page, shareLink({ js: 'document.body.dataset.run = Math.random()' }))
    const body = preview(page).locator('body')
    await expect(body).toHaveAttribute('data-run', /\d/)
    const first = await body.getAttribute('data-run')
    await runButton(page).click()
    await expect(body).not.toHaveAttribute('data-run', first)
    await expect(runButton(page)).toHaveAttribute('aria-keyshortcuts', 'Control+Enter Meta+Enter')
  })

  test('turning auto-run back on runs out-of-date code', async ({ page }) => {
    await openApp(page, shareLink({ html: '<p>one</p>' }))
    await autoRun(page).click()
    await focusEditorEnd(page, '#html-editor')
    await page.keyboard.type(' two')
    await expect(runButton(page)).toHaveAttribute('data-stale', '')
    await autoRun(page).click()
    await expect(preview(page).locator('body')).toHaveText('one two')
    await expect(runButton(page)).not.toHaveAttribute('data-stale')
  })

  test('remembers auto-run off, and still runs code that is loaded', async ({ page }) => {
    await openApp(page, shareLink({ html: '<p>first</p>' }))
    await autoRun(page).click()

    await page.goto(shareLink({ html: '<p>second</p>' })) // another link in the same tab
    await expect(preview(page).locator('body')).toHaveText('second')

    await page.reload()
    await expect(page.locator('.monaco-editor')).toHaveCount(3)
    await expect(autoRun(page)).toHaveAttribute('aria-checked', 'false')
    await expect(preview(page).locator('body')).toHaveText('second')
    await expect(runButton(page)).not.toHaveAttribute('data-stale')
  })

  test('the editor bar fits its controls at the narrowest split', async ({ page }) => {
    await openApp(page, shareLink({ html: '<p>x</p>' }))
    await page.locator('.handle-split').focus()
    await page.keyboard.press('Home')
    const pane = await page.locator('.editor-pane').boundingBox()
    const tab = await page.locator('#tab-js').boundingBox()
    for (const control of await page.locator('.editor-bar button:visible').all()) {
      const box = await control.boundingBox()
      expect(box.x + box.width).toBeLessThanOrEqual(pane.x + pane.width + 0.5)
      expect(box.y).toBeGreaterThanOrEqual(tab.y - 1) // one row, beside the tabs
      expect(box.y + box.height).toBeLessThanOrEqual(tab.y + tab.height + 1)
    }
  })

  test('on phones, the controls sit in the preview toolbar', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await openApp(page, shareLink({ html: '<p>one</p>' }))
    const toolbar = page.locator('.device-toolbar')
    const phoneRun = toolbar.getByRole('button', { name: /^Run/ })
    await expect(page.locator('.editor-bar')).toBeHidden()
    await toolbar.getByRole('switch', { name: 'Auto-run' }).click()

    await page.locator('.mobile-tabs [data-language="html"]').click()
    await page.locator('#html-editor .view-lines').click()
    await page.keyboard.press('Control+End')
    await page.keyboard.type(' two')
    await page.locator('.mobile-tabs [data-panel="preview"]').click()
    await expect(phoneRun).toHaveAccessibleName('Run, preview out of date')

    await phoneRun.click()
    await expect(preview(page).locator('body')).toHaveText('one two')
  })
})

test.describe('loop guard', () => {
  test('stops an infinite loop in the JS pane and runs the rest of the script', async ({ page }) => {
    const js = "console.log('before')\nwhile (true) {}\ndocument.body.append('after the loop')"
    await openApp(page, shareLink({ js }))

    await expect(preview(page).locator('body')).toHaveText('after the loop')
    const stopped = consoleRows(page).filter({ hasText: 'Stopped a loop at JS line 2 after 1 s. It may be infinite.' })
    await expect(stopped).toHaveClass('error')
    await expect(consoleRows(page).filter({ hasText: 'before' })).toHaveCount(1)

    // The app is still responsive
    await page.locator('#tab-css').click()
    await expect(page.locator('#css-editor')).toBeVisible()
  })

  test('stops an infinite loop in a script in the HTML pane', async ({ page }) => {
    const html = "<p id=\"t\">waiting</p>\n<script>\nfor (;;) {}\ndocument.getElementById('t').textContent = 'done'\n</script>"
    await openApp(page, shareLink({ html }))

    await expect(preview(page).locator('#t')).toHaveText('done')
    await expect(consoleRows(page).filter({ hasText: 'Stopped a loop at HTML line 3' })).toHaveCount(1)
  })

  test('guards the preview opened in a new tab too', async ({ page }) => {
    await page.goto('/preview.html' + shareLink({ js: "while (true) {}\ndocument.body.append('after the loop')" }).slice(1))
    await expect(page.frameLocator('#page').locator('body')).toHaveText('after the loop')
  })
})

test.describe('preview history', () => {
  test('re-rendering the preview does not add browser history entries', async ({ page }) => {
    await openApp(page, shareLink({ html: '<p>hi</p>', js: "console.log('v1')" }))
    await expect(consoleRows(page)).toHaveText(['v1'])
    const entries = await page.evaluate(() => history.length)

    await focusEditorEnd(page, '#css-editor')
    await page.keyboard.type('p { color: rgb(9, 9, 9) }')
    await expect(preview(page).locator('p')).toHaveCSS('color', 'rgb(9, 9, 9)')

    expect(await page.evaluate(() => history.length)).toBe(entries)
  })
})

test.describe('editors', () => {
  test('expands Emmet abbreviations in the HTML editor', async ({ page }) => {
    await openBlank(page)
    await focusEditorEnd(page, '#html-editor')
    await page.keyboard.type('h1#title')
    await expect(page.locator('#html-editor .suggest-widget')).toBeVisible()
    await page.keyboard.press('Tab')

    await expect(preview(page).locator('h1#title')).toHaveCount(1)
  })

  test('suggests completions in the JS editor', async ({ page }) => {
    test.slow() // the TypeScript worker can take a while to start under load
    await openBlank(page)
    await focusEditorEnd(page, '#js-editor')
    await page.keyboard.type('console.lo')

    // The TypeScript worker can still be starting under load; Ctrl+Space asks again
    const suggestions = page.locator('#js-editor .suggest-widget')
    await expect(async () => {
      await page.keyboard.press('Control+Space')
      await expect(suggestions).toContainText('log', { timeout: 2_000 })
    }).toPass({ timeout: 90_000 })
  })

  test('opens the find widget', async ({ page }) => {
    await openApp(page, shareLink({ js: "console.log('find me')" }))
    await focusEditorEnd(page, '#js-editor')
    await page.keyboard.press('Control+f')

    await expect(page.locator('#js-editor .find-widget')).toBeVisible()
  })
})

test.describe('examples', () => {
  test('opens on the welcome example, which answers in the console', async ({ page }) => {
    // The logo never stops riding its wave, so a click could never land on a
    // still target. Reduced motion stills it, and is worth covering anyway.
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openApp(page)
    // Without motion the whole message is printed, wrapped, and fully on screen
    const scroller = preview(page).locator('.scroller')
    await expect(scroller).toContainText('edit MESSAGE in the js')
    await expect.poll(() => scroller.evaluate(el =>
      el.scrollWidth <= el.clientWidth && el.getBoundingClientRect().bottom <= window.innerHeight
    )).toBe(true)

    const letters = preview(page).locator('.logo .letter')
    await expect(letters).toHaveText(['c', 'o', 'd', 'y'])
    await expect(consoleRows(page).first()).toContainText('Intro running')

    await letters.first().click()
    await expect(letters.first()).toHaveClass(/flipped/)
    await expect(consoleRows(page).last()).toContainText('Letter flipped')
    // The URL now holds the welcome code, so a reload or share keeps it
    await expect(page).toHaveURL(/\/#.+/)
  })

  test('scrolls whatever MESSAGE the welcome JS sets', async ({ page }) => {
    await openApp(page)
    await expect(preview(page).locator('.logo .letter')).toHaveCount(4)
    const [html, js, css] = new URL(page.url()).hash.slice(1).split('|').map(part => decode(part))
    const edited = js.replace(/const MESSAGE = '[^']*'/, "const MESSAGE = 'hello from the test'")
    expect(edited).not.toBe(js)

    await page.goto(shareLink({ html, js: edited, css }))
    await expect(preview(page).locator('.scroller')).toHaveText('hello from the test')
  })

  test('does not replace code from a share link with the welcome example', async ({ page }) => {
    await openApp(page, shareLink({ js: "console.log('mine')" }))
    await expect(consoleRows(page)).toHaveText(['mine'])
    await expect(preview(page).locator('.logo')).toHaveCount(0)
  })

  test('previews the hovered example in the menu before loading it', async ({ page }) => {
    await openApp(page, shareLink({ js: "console.log('mine')" }))
    await page.locator('#examples-button').click()
    // The previewed item is marked in the list
    await expect(exampleOption(page, 'welcome')).toHaveAttribute('aria-current', 'true')

    await exampleOption(page, 'canvas').hover()
    await expect(exampleOption(page, 'canvas')).toHaveAttribute('aria-current', 'true')
    await expect(exampleOption(page, 'welcome')).not.toHaveAttribute('aria-current')
    const detail = page.locator('#examples-menu .example-detail')
    await expect(detail.locator('.example-detail-title')).toHaveText('Fireflies')
    await expect(detail.frameLocator('iframe').locator('canvas')).toHaveCount(1)
    await expect(consoleRows(page)).toHaveText(['mine']) // previewing loads nothing

    await detail.getByRole('button', { name: 'Load example' }).click()
    await expect(preview(page).locator('canvas')).toHaveCount(1)
    await expect(page.locator('#examples-menu')).toBeHidden()
  })

  test('loads an example from the menu', async ({ page }) => {
    await openApp(page, shareLink({ js: "console.log('mine')" }))
    const before = page.url()

    await chooseExample(page, 'canvas')
    await expect(preview(page).locator('canvas')).toHaveCount(1)
    await expect(page.locator('#examples-menu')).toBeHidden()
    expect(page.url()).not.toBe(before)
  })

  test('examples set their labels in their own typefaces', async ({ page }) => {
    await openApp(page, shareLink({ js: "console.log('mine')" }))

    await chooseExample(page, 'canvas')
    await expect(preview(page).locator('.label')).toHaveCSS('font-family', /Caveat/)

    await chooseExample(page, 'todo')
    const stamp = preview(page).locator('.card.done').first()
    await expect.poll(() => stamp.evaluate(el => {
      const after = getComputedStyle(el, '::after')
      return `${after.fontFamily} ${after.fontSize}`
    })).toMatch(/Kalam.* 19px/)
  })

  test('Back restores the code from before an example was loaded', async ({ page }) => {
    await openApp(page, shareLink({ js: "console.log('mine')" }))
    await expect(consoleRows(page)).toHaveText(['mine'])

    await chooseExample(page, 'todo')
    await expect(preview(page).locator('form')).toHaveCount(1)

    // A hash-only history step never fires a page load for goBack() to wait on
    await page.evaluate(() => history.back())
    await expect(consoleRows(page)).toHaveText(['mine'])
    await expect(preview(page).locator('form')).toHaveCount(0)
  })

  test('an empty console says where output will appear', async ({ page }) => {
    await openBlank(page)
    await expect(consoleRows(page)).toHaveCount(0)
    const hint = await page.locator('#console').evaluate(el => getComputedStyle(el, '::before').content)
    expect(hint).toContain('Console output appears here')
  })

  test('Blank clears every editor and the preview', async ({ page }) => {
    await openBlank(page)

    for (const editor of ['#html-editor', '#css-editor', '#js-editor']) {
      await expect(page.locator(`${editor} .view-lines`)).toHaveText('')
    }
    await expect(consoleRows(page)).toHaveCount(0)
    await expect(preview(page).locator('body')).toBeEmpty()
  })

  test('lists each example with what it teaches and works from the keyboard', async ({ page }) => {
    await openApp(page, shareLink({ js: "console.log('mine')" }))
    const button = page.locator('#examples-button')
    const menu = page.locator('#examples-menu')

    await button.click()
    await expect(exampleOption(page, 'canvas')).toContainText('requestAnimationFrame')
    await page.keyboard.press('Escape')
    await expect(menu).toBeHidden()
    await expect(button).toBeFocused()

    await page.keyboard.press('Enter')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter') // first item: the welcome example
    await expect(menu).toBeHidden()
    await expect(preview(page).locator('.logo .letter')).toHaveCount(4)
  })
})

test.describe('tabbed editor', () => {
  test('tabs switch between the three editors', async ({ page }) => {
    await openApp(page, shareLink({ html: '<p>hello</p>', css: 'p { color: red }', js: "console.log('j')" }))
    await expect(page.locator('#js-editor')).toBeVisible()
    await expect(page.locator('#html-editor')).toBeHidden()

    await page.locator('#tab-html').click()
    await expect(page.locator('#html-editor')).toBeVisible()
    await expect(page.locator('#html-editor .view-lines')).toContainText('<p>hello</p>')
    await expect(page.locator('#tab-html')).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('#js-editor')).toBeHidden()
  })

  test('tabs work from the keyboard', async ({ page }) => {
    await openApp(page, shareLink({ js: "console.log('j')" }))
    await page.locator('#tab-js').focus()
    await page.keyboard.press('ArrowRight') // wraps around to HTML
    await expect(page.locator('#tab-html')).toBeFocused()
    await expect(page.locator('#html-editor')).toBeVisible()
    await page.keyboard.press('End')
    await expect(page.locator('#tab-js')).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('#tab-js')).toBeFocused()
  })

  test('a syntax error puts a dot on its language tab', async ({ page }) => {
    await openApp(page, shareLink({ css: 'p { color: }' }))
    await expect(page.locator('#tab-css .error-dot')).toBeVisible()
    await expect(page.locator('#tab-js .error-dot')).toBeHidden()
  })

  test('loading code opens the JS tab', async ({ page }) => {
    await openApp(page, shareLink({ js: "console.log('mine')" }))
    await page.locator('#tab-css').click()
    await chooseExample(page, 'canvas')
    await expect(page.locator('#tab-js')).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('#js-editor')).toBeVisible()
  })

  test('the top bar and view buttons are gone', async ({ page }) => {
    await openApp(page)
    await expect(page.locator('.top-navbar')).toHaveCount(0)
    await expect(page.locator('#frontend-view-button')).toHaveCount(0)
  })
})

test.describe('resizable layout', () => {
  async function drag (page, locator, dx, dy) {
    const box = await locator.boundingBox()
    const x = box.x + box.width / 2
    const y = box.y + box.height / 2
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x + dx, y + dy, { steps: 8 })
    await page.mouse.up()
  }

  test('dragging the split resizes the editor, even across the preview, and is remembered', async ({ page }) => {
    await openApp(page, shareLink({ js: "console.log('x')" }))
    const editor = page.locator('.editor-pane')
    const start = (await editor.boundingBox()).width

    await drag(page, page.locator('.handle-split'), -200, 0)
    const narrower = (await editor.boundingBox()).width
    expect(narrower).toBeLessThan(start - 150)

    // Dragging right passes over the preview iframe; pointer capture keeps it going
    await drag(page, page.locator('.handle-split'), 300, 0)
    const wider = (await editor.boundingBox()).width
    expect(wider).toBeGreaterThan(narrower + 250)

    await page.reload()
    await expect(page.locator('.monaco-editor')).toHaveCount(3)
    expect(Math.abs((await editor.boundingBox()).width - wider)).toBeLessThan(4)
  })

  test('handles work from the keyboard and reset on double-click', async ({ page }) => {
    await openApp(page, shareLink({ js: "console.log('x')" }))
    const handle = page.locator('.handle-split')
    await expect(handle).toHaveAttribute('role', 'separator')
    await expect(handle).toHaveAttribute('aria-valuenow', '50')

    await handle.focus()
    await page.keyboard.press('ArrowRight')
    await expect(handle).toHaveAttribute('aria-valuenow', '52')
    await page.keyboard.press('Shift+ArrowLeft')
    await expect(handle).toHaveAttribute('aria-valuenow', '42')

    await handle.dblclick()
    await expect(handle).toHaveAttribute('aria-valuenow', '50')
  })

  test('the console drawer resizes and is remembered', async ({ page }) => {
    await openApp(page, shareLink({ js: "console.log('x')" }))
    const handle = page.locator('.handle-console')
    const consolePane = page.locator('#console')
    expect(Math.round((await consolePane.boundingBox()).height)).toBe(160)

    await handle.focus()
    await page.keyboard.press('Shift+ArrowUp')
    await page.keyboard.press('Shift+ArrowUp')
    await expect(handle).toHaveAttribute('aria-valuenow', '288')
    expect(Math.round((await consolePane.boundingBox()).height)).toBe(288)

    await page.reload()
    await expect(page.locator('.monaco-editor')).toHaveCount(3)
    expect(Math.round((await consolePane.boundingBox()).height)).toBe(288)
  })

  test('stored sizes outside the limits are clamped', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cody-layout-split', '99')
      localStorage.setItem('cody-layout-console', 'oops')
    })
    await openApp(page, shareLink({ js: "console.log('x')" }))
    await expect(page.locator('.handle-split')).toHaveAttribute('aria-valuenow', '80')
    await expect(page.locator('.handle-console')).toHaveAttribute('aria-valuenow', '160')
  })

  test('re-clamps the console when the window shrinks', async ({ page }) => {
    await openApp(page, shareLink({ js: "console.log('x')" }))
    const handle = page.locator('.handle-console')
    await handle.focus()
    await page.keyboard.press('End') // as tall as allowed: 70% of the workspace
    await page.setViewportSize({ width: 1400, height: 500 })

    await expect.poll(async () => {
      const workspace = await page.locator('#workspace').boundingBox()
      const consoleBox = await page.locator('#console').boundingBox()
      return consoleBox.height <= (workspace.height - 24) * 0.7 + 1
    }).toBe(true)

    // Back at full height, the console returns to the size that was chosen
    await page.setViewportSize({ width: 1400, height: 900 })
    await expect.poll(async () => Math.round((await page.locator('#console').boundingBox()).height))
      .toBeGreaterThan(600)
  })
})

test.describe('device preview', () => {
  const frameWidth = async (page) => Math.round((await page.locator('.preview-frame').boundingBox()).width)

  test('presets set the preview width and the readout follows', async ({ page }) => {
    await openApp(page, shareLink({ html: '<p>x</p>' }))
    await page.getByRole('button', { name: 'Phone' }).click()
    expect(await frameWidth(page)).toBe(375)
    await expect(page.locator('.frame-readout')).toHaveText('375 px')
    await expect(page.getByRole('button', { name: 'Phone' })).toHaveAttribute('aria-pressed', 'true')

    await page.getByRole('button', { name: 'Full', exact: true }).click()
    const stage = Math.round((await page.locator('.preview-stage').boundingBox()).width)
    expect(await frameWidth(page)).toBe(stage)
    await expect(page.getByRole('button', { name: 'Full', exact: true })).toHaveAttribute('aria-pressed', 'true')
  })

  test('dragging the frame edge sets any width and is remembered', async ({ page }) => {
    await openApp(page, shareLink({ html: '<p>x</p>' }))
    await page.getByRole('button', { name: 'Tablet' }).click()
    const before = await frameWidth(page)
    const handle = page.locator('.handle-frame')
    const box = await handle.boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x - 100, box.y + box.height / 2, { steps: 6 })
    await page.mouse.up()

    const width = await frameWidth(page)
    expect(width).toBeLessThan(before - 150) // centred frame: both edges move
    await expect(page.locator('.frame-readout')).toHaveText(`${width} px`)
    for (const name of ['Phone', 'Tablet', 'Full']) {
      await expect(page.getByRole('button', { name, exact: true })).toHaveAttribute('aria-pressed', 'false')
    }

    await page.reload()
    await expect(page.locator('.monaco-editor')).toHaveCount(3)
    expect(Math.abs(await frameWidth(page) - width)).toBeLessThan(2)
  })

  test('a stored width never overflows the stage', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('cody-preview-width', '5000'))
    await openApp(page, shareLink({ html: '<p>x</p>' }))
    const stage = Math.round((await page.locator('.preview-stage').boundingBox()).width)
    expect(await frameWidth(page)).toBeLessThanOrEqual(stage)
    await expect(page.locator('.frame-readout')).toHaveText(new RegExp(`^${await frameWidth(page)}( / 5000)? px$`))
  })

  test('a chosen width survives the preview being hidden by a narrow window', async ({ page }) => {
    await openApp(page, shareLink({ html: '<p>x</p>' }))
    await page.getByRole('button', { name: 'Phone' }).click()
    await page.locator('#tab-css').click()
    await page.setViewportSize({ width: 800, height: 900 }) // phone layout: the preview is hidden
    await page.setViewportSize({ width: 1400, height: 900 })
    expect(await frameWidth(page)).toBe(375)
    await expect(page.getByRole('button', { name: 'Phone' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('a clamped preset is kept, and applies once there is room', async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 900 })
    await openApp(page, shareLink({ html: '<p>x</p>' }))
    const tablet = page.getByRole('button', { name: 'Tablet' })
    await tablet.click()
    await expect(page.locator('.frame-readout')).toHaveText(/^\d+ \/ 768 px$/)

    await page.setViewportSize({ width: 1101, height: 900 })
    await expect(page.locator('.frame-readout')).toHaveText(/^\d+ \/ 768 px$/)
    await expect(tablet).toHaveAttribute('aria-pressed', 'true')

    await page.setViewportSize({ width: 1900, height: 900 })
    await expect.poll(() => frameWidth(page)).toBe(768)
    await expect(page.locator('.frame-readout')).toHaveText('768 px')
  })

  test('every toolbar control fits on one line at 1024px wide', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    await openApp(page, shareLink({ html: '<p>x</p>' }))
    await page.getByRole('button', { name: 'Tablet' }).click() // the longest readout
    const pane = await page.locator('.preview-pane').boundingBox()
    for (const control of await page.locator('.device-toolbar :is(button, .frame-readout):visible').all()) {
      const box = await control.boundingBox()
      expect(box.x).toBeGreaterThanOrEqual(pane.x)
      expect(box.x + box.width).toBeLessThanOrEqual(pane.x + pane.width + 0.5)
      expect(box.height).toBeLessThan(32) // one line of text
    }
  })

  test('opens the result in a new, sandboxed tab', async ({ page }) => {
    const js = "try { parent.document.title } catch (e) { document.body.textContent = 'blocked:' + e.name }"
    await openApp(page, shareLink({ html: '<p>x</p>', js }))
    const [tab] = await Promise.all([
      page.waitForEvent('popup'),
      page.locator('#open-tab-button').click()
    ])
    await expect(tab).toHaveURL(/\/preview\.html#.+/)
    await expect(tab).toHaveTitle('Cody preview')
    await expect(tab.frameLocator('#page').locator('body')).toHaveText('blocked:SecurityError')
    expect(await tab.evaluate(() => window.opener)).toBeNull()
  })

  // A real pop-up blocker can't be switched on from a test, so this stands in
  // for one by making window.open return null, as a blocked call does
  test('says so when pop-ups are blocked', async ({ page }) => {
    await page.addInitScript(() => { window.open = () => null })
    await openApp(page, shareLink({ html: '<p>x</p>' }))
    await page.locator('#open-tab-button').click()
    await expect(page.locator('#url-copy-container')).toHaveText('Allow pop-ups to open the preview')
  })

  test('a preset wider than the pane says it was clamped', async ({ page }) => {
    await openApp(page, shareLink({ html: '<p>x</p>' }))
    const tablet = page.getByRole('button', { name: 'Tablet' })
    await tablet.click()
    // At the default split the preview pane is narrower than 768px
    await expect(page.locator('.frame-readout')).toHaveText(/^\d+ \/ 768 px$/)
    await expect(tablet).toHaveAttribute('aria-pressed', 'true')
    await expect(tablet).toHaveAttribute('data-clamped', '')
    await page.getByRole('button', { name: 'Phone' }).click()
    await expect(page.locator('.frame-readout')).toHaveText('375 px')
    await expect(tablet).not.toHaveAttribute('data-clamped')
  })

  test('a sized frame shows its edge, and Full leaves no clipped handle', async ({ page }) => {
    await openApp(page, shareLink({ html: '<p>x</p>' }))
    await page.getByRole('button', { name: 'Phone' }).click()
    await expect(page.locator('.preview-frame')).toHaveAttribute('data-sized', '')
    await page.getByRole('button', { name: 'Full', exact: true }).click()
    await expect(page.locator('.preview-frame')).not.toHaveAttribute('data-sized')
    const handle = await page.locator('.handle-frame').boundingBox()
    const stage = await page.locator('.preview-stage').boundingBox()
    expect(handle.x + handle.width).toBeLessThanOrEqual(stage.x + stage.width + 0.5)
  })

  test('the frame grip stays off the page until it is needed', async ({ page }) => {
    await openApp(page, shareLink({ html: '<p>x</p>' }))
    const grip = () => page.locator('.handle-frame').evaluate(el => getComputedStyle(el, '::after').opacity)
    expect(await grip()).toBe('0') // Full: the frame fills the stage
    await page.locator('.handle-frame').hover()
    await expect.poll(grip).toBe('1')
  })

  test('the pop-up message is readable on its background', async ({ page }) => {
    await page.addInitScript(() => { window.open = () => null })
    await openApp(page, shareLink({ html: '<p>x</p>' }))
    await page.locator('#open-tab-button').click()
    const toast = page.locator('#url-copy-container')
    await expect(toast).toBeVisible()
    const [fg, bg] = await toast.evaluate(el => [getComputedStyle(el).color, getComputedStyle(el).backgroundColor])
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5)
  })

  test('fullscreen shows the preview pane full screen', async ({ page }) => {
    await openApp(page, shareLink({ html: '<p>x</p>' }))
    await page.locator('#fullscreen-button').click()
    await expect.poll(() => page.evaluate(() => document.fullscreenElement?.classList.contains('preview-pane'))).toBe(true)
    await expect(page.locator('#fullscreen-button')).toHaveText('Exit fullscreen')
    await page.locator('#fullscreen-button').click()
    await expect.poll(() => page.evaluate(() => document.fullscreenElement)).toBeNull()
  })
})

test.describe('phone layout', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('opens on the preview, with the tab bar and no handles', async ({ page }) => {
    await openApp(page)
    await expect(page.locator('#page')).toBeVisible()
    await expect(page.locator('.editor-pane')).toBeHidden()
    await expect(page.locator('.mobile-tabs')).toBeVisible()
    await expect(page.locator('.handle-split')).toBeHidden()
    await expect(page.locator('.mobile-tabs [data-panel="preview"]')).toHaveAttribute('aria-selected', 'true')
  })

  test('the tab bar switches between editors, preview and console', async ({ page }) => {
    await openApp(page, shareLink({ html: '<p>hi</p>', js: "console.log('phone')" }))
    const tabs = page.locator('.mobile-tabs')

    await tabs.locator('[data-language="html"]').click()
    await expect(page.locator('#html-editor')).toBeVisible()
    await expect(page.locator('#page')).toBeHidden()

    await tabs.locator('[data-panel="console"]').click()
    await expect(page.locator('#console')).toBeVisible()
    await expect(consoleRows(page)).toHaveText(['phone'])
    await expect(page.locator('.editor-pane')).toBeHidden()
  })

  test('menus stay on screen', async ({ page }) => {
    await openApp(page)
    for (const id of ['#examples-button', '#theme-button']) {
      await page.locator(id).click()
      const menu = page.locator(`${id} + .drop-down-menu-container`)
      await expect(menu).toBeVisible()
      const box = await menu.boundingBox()
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(390)
      await page.keyboard.press('Escape')
    }
  })

  test('long console lines wrap instead of scrolling sideways', async ({ page }) => {
    await openApp(page, shareLink({ js: "console.log('a long line ' + 'x'.repeat(200))" }))
    await page.locator('.mobile-tabs [data-panel="console"]').click()
    await expect(consoleRows(page)).toHaveCount(1)
    expect(await page.locator('#console').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
  })

  test('a console row flows as one paragraph, not side-by-side columns', async ({ page }) => {
    await openApp(page, shareLink({ js: "console.log('label', 'x'.repeat(300))" }))
    await page.locator('.mobile-tabs [data-panel="console"]').click()
    const parts = consoleRows(page).first().locator('span')
    await expect(parts).toHaveCount(2)
    // The long second part wraps back to the row's start, under the first part
    const [labelRight, lastLineLeft] = await parts.evaluateAll(([label, long]) => {
      const lines = long.getClientRects()
      return [label.getBoundingClientRect().right, lines[lines.length - 1].left]
    })
    expect(lastLineLeft).toBeLessThan(labelRight)
  })

  test('choosing an example keeps the current panel', async ({ page }) => {
    await openApp(page)
    await chooseExample(page, 'canvas')
    await expect(page.frameLocator('#page').locator('canvas')).toHaveCount(1)
    await expect(page.locator('#page')).toBeVisible()
  })
})

test.describe('share links', () => {
  test('keeps the code in the URL hash across reloads', async ({ page }) => {
    await openBlank(page)
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
})

// Both tests use the operating system's clipboard, which parallel tests would share
test.describe('copy URL', () => {
  test.describe.configure({ mode: 'serial' })

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
