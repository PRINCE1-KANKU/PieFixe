const cursor = document.querySelector('.cursor');
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
document.body.style.cursor = 'auto';
const mapFrame = document.querySelector('.map-frame');
mapFrame?.setAttribute('loading', 'lazy');
const pageHero = document.querySelector('.page-hero');
const pagePath = window.location.pathname;
const serviceArea = 'Johannesburg, including Sandton, Randburg, Midrand and surrounding areas';
const localMeta = pagePath.endsWith('services.html')
  ? { title: 'Same-day appliance repairs | Johannesburg | Pie Fixe', description: `Same-day TV, oven, fridge, freezer and aircon repair callouts across ${serviceArea}, subject to availability.` }
  : pagePath.endsWith('contact.html')
    ? { title: 'Same-day appliance callouts | Johannesburg | Pie Fixe', description: `Contact Pie Fixe for same-day appliance repair callouts across ${serviceArea}, subject to availability.` }
    : null;
if (localMeta) {
  document.title = localMeta.title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', localMeta.description);
  const proof = document.querySelector('.page-hero__proof') || document.createElement('div');
  proof.className = 'page-hero__proof';
  if (!proof.parentElement) pageHero?.append(proof);
  const sameDay = document.createElement('span');
  sameDay.textContent = `Same-day callouts across ${serviceArea}`;
  proof.prepend(sameDay);
}
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
