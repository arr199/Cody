export function removeActiveClasses () {
  const dropDownMenus = document.querySelectorAll('.left-navbar-buttons')
  dropDownMenus.forEach(menu => {
    menu.classList.remove('buttons-active')
  })
}
