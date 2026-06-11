export function removeActiveClasses () {
  const dropDownMenus = document.querySelectorAll('.left-navbar-buttons')
  dropDownMenus.forEach(menu => {
    menu.classList.remove('buttons-active')
  })
}
//  GET COLOR FOR CONSOLE LOG (theme-aware) //
export function getLogColor (type) {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light'
  if (type === 'error') return isLight ? '#dc2626' : 'rgb(255, 105, 105)'
  return isLight ? '#047857' : 'rgb(57, 211, 134)'
}

export function getLogClass (type) {
  if (type === 'error') return 'error'
  return 'string-log'
}
