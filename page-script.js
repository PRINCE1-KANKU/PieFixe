const cursor = document.querySelector('.cursor');
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
document.body.style.cursor = 'auto';
const footerNote = document.querySelector('.site-footer small');
if (footerNote && !footerNote.querySelector('a[href="privacy.html"]')) {
  const privacyLink = document.createElement('a');
  privacyLink.href = 'privacy.html';
  privacyLink.textContent = 'Privacy policy';
  footerNote.prepend(privacyLink, document.createElement('br'));
}
if (hasFinePointer) {
  document.querySelectorAll('a, button, summary').forEach((element) => { element.style.cursor = 'pointer'; });
}

if (hasFinePointer) {
  window.addEventListener('pointermove', (event) => {
    if (cursor) {
      cursor.style.left = `${event.clientX}px`;
      cursor.style.top = `${event.clientY}px`;
    }
  });
}

menuToggle?.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});
nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  nav.classList.remove('is-open');
  menuToggle?.setAttribute('aria-expanded', 'false');
}));
if (hasFinePointer) {
  document.querySelectorAll('a, button, summary').forEach((element) => {
    element.addEventListener('mouseenter', () => cursor?.classList.add('is-hover'));
    element.addEventListener('mouseleave', () => cursor?.classList.remove('is-hover'));
  });
}
