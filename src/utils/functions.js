export function removeActiveClasses () {
  const dropDownMenus = document.querySelectorAll('.left-navbar-buttons')
  dropDownMenus.forEach(menu => {
    menu.classList.remove('buttons-active')
  })
}
//  GET COLOR FOR CONSOLE LOG //
export function getLogColor (type) {
  if (type === 'error') return 'rgb(255, 105, 105)'
  return 'rgb(57, 211, 134)'
}

export function getLogClass (type) {
  if (type === 'error') return 'error'
  return 'string-log'
}
