// A cracktro: three dust fields drift behind the work at layered speeds, and
// MESSAGE rides a sine wave across the screen. Change MESSAGE and re-read it.
const MESSAGE = 'greetings to everyone reading this code ... edit MESSAGE in the js and this scroller changes ... '

// Three dust fields, each a wavy band; nearer fields are brighter and faster
const LAYERS = [
  { count: 160, speed: 0.12, size: 1, color: '#2e2e2e', band: 0.3, amp: 0.12 },
  { count: 110, speed: 0.3, size: 1.5, color: '#4a4a4a', band: 0.62, amp: 0.1 },
  { count: 50, speed: 0.6, size: 2, color: '#7b7b7b', band: 0.82, amp: 0.06 }
]
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches

const canvas = document.querySelector('.dust')
const ctx = canvas.getContext('2d')
const scroller = document.querySelector('.scroller')
// One full sine period across the width, so a band wraps around seamlessly
const stars = LAYERS.map(({ count, band, amp }) => Array.from({ length: count }, () => {
  const x = Math.random()
  return { x, y: band + Math.sin(x * Math.PI * 2) * amp + (Math.random() - 0.5) * 0.12 }
}))

const glyphs = [...MESSAGE].map(char => {
  const span = document.createElement('span')
  span.textContent = char
  scroller.append(span)
  return span
})
let widths = []
let lineWidth = 0

// Glyph widths depend on the pixel font, so measure once it has loaded
function measure () {
  widths = glyphs.map(span => span.offsetWidth)
  lineWidth = widths.reduce((sum, width) => sum + width, 0)
}

function resize () {
  const ratio = window.devicePixelRatio || 1
  canvas.width = canvas.clientWidth * ratio
  canvas.height = canvas.clientHeight * ratio
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
}

function drawDust (dt) {
  const { clientWidth: w, clientHeight: h } = canvas
  ctx.clearRect(0, 0, w, h)
  LAYERS.forEach((layer, index) => {
    ctx.fillStyle = layer.color
    for (const star of stars[index]) {
      star.x = (star.x - (layer.speed * dt) / w + 1) % 1
      ctx.fillRect(Math.round(star.x * w), Math.round(star.y * h), layer.size, layer.size)
    }
  })
}

// dt is 1 at 60 frames per second, so speed is the same on any screen
let offset = scroller.clientWidth
let last = performance.now()
function frame (now) {
  const dt = Math.min((now - last) / 16.7, 3)
  last = now
  offset -= 1.4 * dt
  if (offset < -lineWidth) offset = scroller.clientWidth

  let x = offset
  glyphs.forEach((span, index) => {
    span.style.translate = `${x}px ${Math.sin(x * 0.025 + now / 500) * 8}px`
    x += widths[index]
  })
  drawDust(dt)
  requestAnimationFrame(frame)
}

document.querySelector('.logo').addEventListener('click', (event) => {
  const letter = event.target.closest('.letter')
  if (!letter) return
  letter.classList.toggle('flipped')
  console.log('Letter flipped', { letter: letter.textContent, flipped: letter.classList.contains('flipped') })
})

window.addEventListener('resize', () => {
  resize()
  if (calm) drawDust(0) // resizing clears the canvas; repaint the still frame
})
resize()
document.fonts.ready.then(() => {
  measure()
  if (!calm) return requestAnimationFrame(frame)
  scroller.replaceChildren(MESSAGE.trim()) // no motion: print the message once
  drawDust(0)
})
console.log('Intro running', { message: MESSAGE.length + ' chars', layers: LAYERS.length })
