const loader = document.querySelector('.loader');
const canvas = document.querySelector('.cube-canvas');
const context = canvas.getContext('2d');
const cursor = document.querySelector('.cursor');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.matchMedia('(max-width: 800px)').matches;
const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
let pointer = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.45 };
let targetPointer = { ...pointer };
let cubes = [];
let scrollY = window.scrollY;
let targetScrollY = scrollY;
let lastCanvasFrame = 0;

window.addEventListener('load', () => {
  window.setTimeout(() => loader.classList.add('is-done'), prefersReducedMotion ? 0 : 1400);
});

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 2);
  canvas.width = window.innerWidth * ratio;
  canvas.height = window.innerHeight * ratio;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  const count = isMobile ? 10 : 36;
  cubes = Array.from({ length: count }, (_, index) => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    size: 3 + Math.random() * 10,
    depth: Math.random(),
    phase: Math.random() * Math.PI * 2,
    speed: 0.1 + Math.random() * 0.25,
    tilt: Math.random() * Math.PI,
    z: 0.2 + Math.random() * 0.8
  }));
}

function drawCube(cube, time) {
  const driftX = (pointer.x - window.innerWidth / 2) * cube.depth * 0.025;
  const driftY = (pointer.y - window.innerHeight / 2) * cube.depth * 0.025;
  const float = Math.sin(time * 0.001 * cube.speed + cube.phase) * 8;
  const scrollDrift = (scrollY * (0.015 + cube.z * 0.04)) % (window.innerHeight + 80);
  const x = cube.x + driftX + Math.sin(scrollY * 0.001 + cube.phase) * cube.z * 18;
  const y = ((cube.y + driftY + float - scrollDrift + window.innerHeight + 80) % (window.innerHeight + 80)) - 40;
  const size = cube.size * (0.8 + cube.depth * 0.5) * (1 + cube.z * 0.2);
  const alpha = 0.15 + cube.depth * 0.5;
  const side = size * 0.38;
  context.save();
  context.translate(x, y);
  context.rotate(cube.tilt + Math.sin(time * 0.0005 + cube.phase + scrollY * 0.001) * 0.12);
  context.strokeStyle = cube.depth > 0.5 ? `rgba(242, 103, 58, ${alpha})` : `rgba(23, 23, 23, ${alpha})`;
  context.lineWidth = cube.depth > 0.55 ? 1.5 : 1;
  context.beginPath();
  context.moveTo(-size / 2, -size / 2);
  context.lineTo(size / 2, -size / 2);
  context.lineTo(size / 2 + side, -size / 2 - side);
  context.lineTo(-size / 2 + side, -size / 2 - side);
  context.closePath();
  context.moveTo(size / 2, -size / 2);
  context.lineTo(size / 2, size / 2);
  context.lineTo(size / 2 + side, size / 2 - side);
  context.lineTo(size / 2 + side, -size / 2 - side);
  context.closePath();
  context.stroke();
  context.strokeRect(-size / 2, -size / 2, size, size);
  if (cube.depth > 0.68) {
    context.fillStyle = `rgba(213, 239, 98, ${alpha * 0.55})`;
    context.fillRect(-size / 2, -size / 2, size, size * 0.15);
  }
  context.restore();
}

function updateSectionDepth() {
  if (isMobile) return;

  document.querySelectorAll('main > section').forEach((section) => {
    const bounds = section.getBoundingClientRect();
    const sectionCenter = bounds.top + bounds.height / 2;
    const distance = (sectionCenter - window.innerHeight / 2) / (window.innerHeight + bounds.height / 2);
    const depth = Math.max(-1, Math.min(1, distance));
    const scale = 1 - Math.max(0, Math.abs(depth) - 0.72) * 0.025;
    section.style.setProperty('--scroll-depth', depth.toFixed(3));
    section.style.setProperty('--scroll-scale', scale.toFixed(3));
  });
}

function animate(time) {
  if (isMobile && time - lastCanvasFrame < 33) {
    requestAnimationFrame(animate);
    return;
  }
  lastCanvasFrame = time;
  context.clearRect(0, 0, window.innerWidth, window.innerHeight);
  pointer.x += (targetPointer.x - pointer.x) * 0.035;
  pointer.y += (targetPointer.y - pointer.y) * 0.035;
  scrollY += (targetScrollY - scrollY) * 0.08;
  updateSectionDepth();
  cubes.forEach((cube) => drawCube(cube, time));
  requestAnimationFrame(animate);
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('scroll', () => {
  targetScrollY = window.scrollY;
}, { passive: true });
if (hasFinePointer) {
  window.addEventListener('pointermove', (event) => {
    targetPointer = { x: event.clientX, y: event.clientY };
    if (cursor) {
      cursor.style.left = `${event.clientX}px`;
      cursor.style.top = `${event.clientY}px`;
    }
  });
}
resizeCanvas();
requestAnimationFrame(animate);

if (!prefersReducedMotion) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
} else {
  document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
}

if (hasFinePointer) {
  document.querySelectorAll('a, button, input, select, textarea').forEach((element) => {
    element.addEventListener('mouseenter', () => cursor?.classList.add('is-hover'));
    element.addEventListener('mouseleave', () => cursor?.classList.remove('is-hover'));
  });
}

const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
menuToggle?.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});
nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  nav.classList.remove('is-open');
  menuToggle?.setAttribute('aria-expanded', 'false');
}));

document.querySelector('.booking-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const message = [
    'Hi Pie Fixe, I would like to book a repair.',
    `Name: ${formData.get('name')}`,
    `Appliance: ${formData.get('appliance')}`,
    `Email: ${formData.get('email')}`,
    `Details: ${formData.get('message') || 'None provided'}`
  ].join('\n');

  // Log the booking on the server too, so it's emailed to the business inbox
  // even if the customer never sends the pre-filled WhatsApp message.
  if (typeof submitPieFixeEnquiry === 'function') {
    submitPieFixeEnquiry({
      name: formData.get('name'),
      email: formData.get('email'),
      appliance: formData.get('appliance'),
      message: formData.get('message'),
      source: 'Homepage booking form'
    });
  }

  window.open(`https://wa.me/27688844462?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  form.querySelector('.form-note').hidden = true;
  form.querySelector('.form-success').hidden = false;
});
