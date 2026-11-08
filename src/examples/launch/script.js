import confetti from 'canvas-confetti'

// Line 1 loads an npm package: Cody fetches it from esm.sh, no install step.
// Lift the cover to arm the console, then launch; each launch is logged.
const cover = document.querySelector('.cover')
const launchButton = document.querySelector('.launch')
const lamp = document.querySelector('.lamp')
const state = document.querySelector('.state')
const countOut = document.querySelector('.count')
const particlesOut = document.querySelector('.particles')

const COLORS = ['#ffb000', '#c4291c', '#f2c230', '#f4efe2']
let launches = 0
let particles = 0

function setArmed (armed) {
  cover.setAttribute('aria-pressed', String(armed))
  launchButton.disabled = !armed
  lamp.classList.toggle('armed', armed)
  state.textContent = armed ? 'ARMED' : 'SAFE'
}

cover.addEventListener('click', () => {
  setArmed(cover.getAttribute('aria-pressed') !== 'true')
})

launchButton.addEventListener('click', () => {
  // Fire from the top of the button, as a share of the window
  const box = launchButton.getBoundingClientRect()
  const burst = {
    particleCount: 90 + Math.round(Math.random() * 60),
    angle: 75 + Math.round(Math.random() * 30),
    spread: 70,
    origin: { x: (box.left + box.width / 2) / innerWidth, y: box.top / innerHeight },
    colors: COLORS,
    disableForReducedMotion: true
  }
  confetti(burst)

  launches++
  particles += burst.particleCount
  countOut.textContent = String(launches).padStart(2, '0')
  particlesOut.textContent = String(particles).padStart(3, '0')
  console.log('Launch', { launch: launches, particles: burst.particleCount, angle: burst.angle })
})

setArmed(false)
