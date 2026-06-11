export function ThemeMenu () {
  return (
           ` 
            <div id="theme-menu" class="drop-down-menu-container">
                <ul className="dropdown-menu" aria-labelledby="theme-menu">
                    <li data-id="theme" data-theme="vs-dark" >Dark</li>
                    <li data-id="theme" data-theme="vs" >Light</li>
                    <li data-id="theme" data-theme="hc-black" >High Contrast Dark</li>
                    <li data-id="theme" data-theme="hc-light" >High Contrast Light</li>
                </ul>
            </div>
            `
  )
}
