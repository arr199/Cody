// Fireflies wander inside the jar and pulse like small lamps. Tap the glass
// and they scatter and flash. One glows a different colour: try to tap it.
const COUNT = 14
const jar = document.querySelector('.jar')
const canvas = document.querySelector('.swarm')
const ctx = canvas.getContext('2d')
const css = getComputedStyle(document.documentElement)
const GLOW = css.getPropertyValue('--glow').trim()
const ODD = css.getPropertyValue('--odd').trim()
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches
let width = 0
let height = 0

function resize () {
  const ratio = window.devicePixelRatio || 1
  width = canvas.clientWidth
  height = canvas.clientHeight
  canvas.width = width * ratio
  canvas.height = height * ratio
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
}

resize()
const flies = Array.from({ length: COUNT }, (_, index) => ({
  x: width * (0.2 + Math.random() * 0.6),
  y: height * (0.15 + Math.random() * 0.7),
  vx: 0,
  vy: 0,
  phase: Math.random() * Math.PI * 2,
  period: 120 + Math.random() * 160, // frames per pulse
  odd: index === 0
}))

// A pulse swells and fades like a lamp; the cube keeps it dim between flashes
const brightness = (fly) => Math.max(0, Math.sin(fly.phase)) ** 3

function draw (fly) {
  const glow = brightness(fly)
  const color = fly.odd ? ODD : GLOW
  const radius = 6 + glow * 18
  const halo = ctx.createRadialGradient(fly.x, fly.y, 0, fly.x, fly.y, radius)
  halo.addColorStop(0, color)
  halo.addColorStop(1, color + '00') // the same colour, fully transparent
  ctx.globalAlpha = 0.35 + glow * 0.65
  ctx.fillStyle = halo
  ctx.fillRect(fly.x - radius, fly.y - radius, radius * 2, radius * 2)
  ctx.globalAlpha = 1
  ctx.fillStyle = color
  ctx.fillRect(fly.x - 1.5, fly.y - 1.5, 3, 3) // a crisp core inside the soft halo
}

// dt is 1 at 60 frames per second, so they move the same on any screen
let last = performance.now()
function frame (now) {
  const dt = Math.min((now - last) / 16.7, 3)
  last = now
  ctx.clearRect(0, 0, width, height)
  for (const fly of flies) {
    fly.vx = fly.vx * 0.97 ** dt + (Math.random() - 0.5) * 0.08 * dt
    fly.vy = fly.vy * 0.97 ** dt + (Math.random() - 0.5) * 0.08 * dt
    fly.x = Math.min(Math.max(fly.x + fly.vx * dt, 12), width - 12)
    fly.y = Math.min(Math.max(fly.y + fly.vy * dt, 16), height - 12)
    if (fly.x === 12 || fly.x === width - 12) fly.vx *= -1 // bounce off the glass
    if (fly.y === 16 || fly.y === height - 12) fly.vy *= -1
    fly.phase += (Math.PI * 2 / fly.period) * dt
    draw(fly)
  }
  requestAnimationFrame(frame)
}

jar.addEventListener('click', (event) => {
  const box = canvas.getBoundingClientRect()
  const keyboard = event.detail === 0 // Enter or Space taps the middle of the jar
  const x = keyboard ? width / 2 : event.clientX - box.left
  const y = keyboard ? height / 2 : event.clientY - box.top
  const odd = flies.find(fly => fly.odd && Math.hypot(fly.x - x, fly.y - y) < 18)
  if (odd) console.log('Found the odd one out', { x: Math.round(odd.x), y: Math.round(odd.y) })

  for (const fly of flies) {
    const angle = Math.atan2(fly.y - y, fly.x - x)
    fly.vx += Math.cos(angle) * 3
    fly.vy += Math.sin(angle) * 3
    fly.phase = Math.PI / 2 // startled: every firefly flashes at once
  }
  console.log('Tapped the glass', { fireflies: flies.length })
})

// No motion: one lit still, redrawn whenever a resize clears the canvas
const drawStill = () => flies.forEach(fly => { fly.phase = Math.PI / 2; draw(fly) })
window.addEventListener('resize', () => {
  resize()
  if (calm) drawStill()
})
if (calm) drawStill()
else requestAnimationFrame(frame)
console.log('Jar sealed', { fireflies: COUNT })
