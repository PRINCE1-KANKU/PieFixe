const nodemailer = require('nodemailer');

const isConfigured = Boolean(
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
);

let transporter = null;

function getTransporter() {
  if (!isConfigured) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: String(process.env.SMTP_SECURE || 'true') === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return transporter;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

// Sends the business a notification email about a new enquiry, and (optionally)
// an auto-reply confirmation to the customer. Never throws - callers decide
// whether email failure should block the API response.
async function sendEnquiryEmails(enquiry) {
  const result = { notifiedBusiness: false, notifiedCustomer: false, error: null };
  const mailer = getTransporter();
  const fromName = process.env.FROM_NAME || 'Pie Fixe website';
  const businessEmail = process.env.BUSINESS_EMAIL;

  if (!mailer || !businessEmail) {
    result.error = 'Email is not configured on the server (missing SMTP or BUSINESS_EMAIL env vars).';
    return result;
  }

  const fromAddress = `"${fromName}" <${process.env.SMTP_USER}>`;

  const summaryRows = [
    ['Name', enquiry.name],
    ['Email', enquiry.email],
    ['Phone', enquiry.phone || '—'],
    ['Appliance', enquiry.appliance || '—'],
    ['Source', enquiry.source || 'Website'],
    ['Submitted', new Date(enquiry.createdAt).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })]
  ];

  const businessHtml = `
    <h2 style="font-family:sans-serif;margin:0 0 12px;">New enquiry from the website</h2>
    <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;">
      ${summaryRows.map(([label, value]) => `
        <tr>
          <td style="padding:4px 12px 4px 0;color:#666;">${escapeHtml(label)}</td>
          <td style="padding:4px 0;font-weight:600;">${escapeHtml(value)}</td>
        </tr>`).join('')}
    </table>
    <p style="font-family:sans-serif;font-size:14px;margin-top:16px;white-space:pre-wrap;">${escapeHtml(enquiry.message || 'No additional details provided.')}</p>
  `;

  try {
    await mailer.sendMail({
      from: fromAddress,
      to: businessEmail,
      replyTo: enquiry.email,
      subject: `New enquiry: ${enquiry.appliance || 'General'} — ${enquiry.name}`,
      html: businessHtml
    });
    result.notifiedBusiness = true;
  } catch (error) {
    result.error = `Failed to notify business inbox: ${error.message}`;
    return result;
  }

  const shouldAutoReply = String(process.env.SEND_AUTOREPLY || 'true') === 'true' && enquiry.email;
  if (shouldAutoReply) {
    try {
      await mailer.sendMail({
        from: fromAddress,
        to: enquiry.email,
        subject: 'We got your message — Pie Fixe',
        html: `
          <p style="font-family:sans-serif;font-size:15px;">Hi ${escapeHtml(enquiry.name.split(' ')[0] || enquiry.name)},</p>
          <p style="font-family:sans-serif;font-size:15px;">Thanks for reaching out to Pie Fixe. We've received your enquiry about
          <strong>${escapeHtml(enquiry.appliance || 'your appliance')}</strong> and will get back to you shortly, usually within one business day.</p>
          <p style="font-family:sans-serif;font-size:15px;">If it's urgent, you can also message us directly on WhatsApp: +27 68 884 4462.</p>
          <p style="font-family:sans-serif;font-size:15px;">— The Pie Fixe team</p>
        `
      });
      result.notifiedCustomer = true;
    } catch (error) {
      // Business copy already sent, so don't fail the whole request over this.
      result.error = `Auto-reply to customer failed: ${error.message}`;
    }
  }

  return result;
}

async function sendPostUpdateEmail(post, action) {
  const mailer = getTransporter();
  const businessEmail = process.env.BUSINESS_EMAIL;
  if (!mailer || !businessEmail) {
    return { sent: false, error: 'Email is not configured on the server.' };
  }

  const fromName = process.env.FROM_NAME || 'Pie Fixe website';
  const fromAddress = `"${fromName}" <${process.env.SMTP_USER}>`;
  const verb = action === 'created' ? 'published' : 'updated';

  try {
    await mailer.sendMail({
      from: fromAddress,
      to: businessEmail,
      subject: `Blog post ${verb}: ${post.title}`,
      html: `
        <h2 style="font-family:sans-serif;margin:0 0 12px;">Blog post ${verb}</h2>
        <p style="font-family:sans-serif;font-size:14px;">
          <strong>${escapeHtml(post.title)}</strong> is now live on the Pie Fixe website.
        </p>
        <p style="font-family:sans-serif;font-size:14px;">Topic: ${escapeHtml(post.topic)}</p>
      `
    });
    return { sent: true, error: null };
  } catch (error) {
    console.error('Could not send blog post update email:', error);
    return { sent: false, error: 'The post was saved, but the update email could not be sent.' };
  }
}

module.exports = { sendEnquiryEmails, sendPostUpdateEmail, isEmailConfigured: isConfigured };
