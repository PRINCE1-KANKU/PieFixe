/* Set this to the Google Tag Manager container ID supplied for Pie Fixe. */
const googleTagManagerId = 'GTM-XXXXXXX';

if (googleTagManagerId !== 'GTM-XXXXXXX') {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
  const firstScript = document.getElementsByTagName('script')[0];
  const tagScript = document.createElement('script');
  tagScript.async = true;
  tagScript.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(googleTagManagerId)}`;
  firstScript.parentNode.insertBefore(tagScript, firstScript);
}
