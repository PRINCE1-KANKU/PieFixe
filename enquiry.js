// Shared helper for sending enquiries to the Pie Fixe API (see config.js for the URL).
// Two ways to use it:
//   1. Add data-enquiry-form to any <form> with a [data-form-status] element inside it
//      and this file wires up submission + status messages automatically.
//   2. Call window.submitPieFixeEnquiry(payload) directly from another script
//      (used by the homepage booking form, which also opens WhatsApp).

async function submitPieFixeEnquiry(payload) {
  const apiBase = window.PIE_FIXE_API;
  if (!apiBase) {
    return { ok: false, error: 'Enquiry API is not configured (see config.js).' };
  }
  try {
    const response = await fetch(`${apiBase}/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { ok: false, error: result.error || 'Something went wrong sending your enquiry.' };
    }
    return { ok: true, ...result };
  } catch {
    return { ok: false, error: 'Could not reach the server. Please try WhatsApp instead.' };
  }
}

window.submitPieFixeEnquiry = submitPieFixeEnquiry;

function initAutoEnquiryForms() {
  document.querySelectorAll('form[data-enquiry-form]').forEach((form) => {
    const statusEl = form.querySelector('[data-form-status]');
    const submitButton = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(form).entries());
      payload.source = payload.source || 'Contact page';

      submitButton?.setAttribute('disabled', 'true');
      if (statusEl) {
        statusEl.hidden = false;
        statusEl.classList.remove('form-success');
        statusEl.textContent = 'Sending your enquiry…';
      }

      const result = await submitPieFixeEnquiry(payload);

      if (result.ok) {
        form.reset();
        if (statusEl) {
          statusEl.textContent = result.message || "Thanks — we've got your enquiry and will be in touch soon.";
          statusEl.classList.add('form-success');
        }
      } else if (statusEl) {
        statusEl.textContent = result.error;
      }

      submitButton?.removeAttribute('disabled');
    });
  });
}

document.addEventListener('DOMContentLoaded', initAutoEnquiryForms);
