export function fontSizeDropDownMenu () {
  return (
       ` 
       <div id="font-size-menu" class="drop-down-menu-container">
            <ul className="dropdown-menu" aria-labelledby="font-size-menu">
                <li data-id="font-size" >14 px</li>
                <li data-id="font-size" >15 px</li>
                <li data-id="font-size" >16 px</li>
                <li data-id="font-size" >17 px</li>
                <li data-id="font-size" >18 px</li>
                <li data-id="font-size" >19 px</li>
                <li data-id="font-size" >20 px</li>
            </ul>
        </div> 
        `
  )
}

export function ThemeDropDownMenu () {
  return (
         ` 
         <div id="theme-menu" class="drop-down-menu-container">
              <ul className="dropdown-menu" aria-labelledby="theme-menu">
                  <li data-id="theme" >vs-dark</li>
                  <li data-id="theme" >hc-black</li>
                  <li data-id="theme" >hc-light</li>
              </ul>
          </div> 
          `
  )
}

export function UrlCopyContainer () {
  return (
    `<div id="url-copy-container" class="url-copy-container">
        <span>URL Copied to Clipboard</span>
    </div>`
  )
}
