// Binds a WAI-ARIA tablist to the workspace. Clicking a tab, or moving
// between tabs with the arrow keys, Home or End, selects it. A tab's
// data-language / data-panel attributes say what it selects; `isSelected`
// maps the workspace state back to the tab that shows it.
export function connectTabs (tablist, workspace, isSelected) {
  const tabs = [...tablist.querySelectorAll('[role="tab"]')]
  const select = (tab) => workspace.select({ language: tab.dataset.language, panel: tab.dataset.panel })

  tablist.addEventListener('click', (event) => {
    const tab = event.target.closest('[role="tab"]')
    if (tab) select(tab)
  })

  tablist.addEventListener('keydown', (event) => {
    const index = tabs.indexOf(document.activeElement)
    if (index === -1) return
    const target = {
      ArrowRight: tabs[(index + 1) % tabs.length],
      ArrowLeft: tabs[(index - 1 + tabs.length) % tabs.length],
      Home: tabs[0],
      End: tabs[tabs.length - 1]
    }[event.key]
    if (!target) return
    event.preventDefault()
    target.focus()
    select(target)
  })

  workspace.subscribe((state) => {
    for (const tab of tabs) {
      const selected = isSelected(tab, state)
      tab.setAttribute('aria-selected', String(selected))
      tab.tabIndex = selected ? 0 : -1
    }
  })
}

// Shows the error dot on each tab whose language has errors
export function showTabErrors (tablist, languages) {
  for (const tab of tablist.querySelectorAll('[role="tab"]')) {
    const dot = tab.querySelector('.error-dot')
    if (dot) dot.hidden = !languages.has(tab.dataset.language)
  }
}
