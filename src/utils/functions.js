export function removeActiveClasses () {
  const dropDownMenus = document.querySelectorAll('.left-navbar-buttons')
  dropDownMenus.forEach(menu => {
    menu.classList.remove('buttons-active')
  })
}
//  GET COLOR FOR CONSOLE LOG //
export function getColor (value) {
  if (value === undefined || value === null || typeof value === 'boolean' || value === 'NaN' || value === 'Infinity' || value === '-Infinity') {
    return 'orange'
  }
  if (typeof value === 'number') {
    return 'orange'
  } else return 'rgb(57, 211, 134)'
}
