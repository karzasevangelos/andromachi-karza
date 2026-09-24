/**
 * POST /contact — Cloudflare Pages Function.
 * Verifies Turnstile, forwards the enquiry via Brevo, stores nothing.
 *
 * Required environment variables (Pages → Settings → Variables):
 *   TURNSTILE_SECRET_KEY  — from the Turnstile widget (pair of the site key in js/main.js)
 *   BREVO_API_KEY         — Brevo → SMTP & API → API Keys
 *   CONTACT_TO            — where enquiries are delivered (her inbox)
 *   CONTACT_FROM          — a Brevo-verified sender, e.g. no-reply@andromachikarza.gr
 *
 * DESIGN RULE: this function NEVER claims success unless Brevo accepted the
 * message. A misconfigured deploy answers 503 with a clear message, so the
 * form fails loudly instead of silently discarding enquiries. MailChannels
 * free sending died 31 Aug 2024 — do not swap this for a MailChannels
 * tutorial. Brevo (France, EU) is used instead of Resend because Resend's
 * account data, metadata and logs live in the US.
 */

const MAX = { onoma: 200, tilefono: 60, email: 200, mynima: 3000 };

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

/* Minimal styled page for no-JS form posts (Accept: text/html). */
function htmlPage(ok, lang, tel) {
  const el = lang === 'el';
  const title = ok ? (el ? 'Το μήνυμα στάλθηκε' : 'Message sent')
                   : (el ? 'Η αποστολή απέτυχε' : 'Sending failed');
  const body = ok
    ? (el ? 'Θα σας απαντήσω εντός δύο εργάσιμων.' : 'I will reply within two working days.')
    : (el ? `Δεν ήταν δυνατή η αποστολή. Τηλεφωνήστε μου στο ${tel}.`
          : `The message could not be sent. Please call me on ${tel}.`);
  const back = el ? 'Επιστροφή' : 'Back';
  const home = el ? '/#epikoinonia' : '/en/#contact';
  return new Response(
`<!DOCTYPE html><html lang="${el ? 'el' : 'en'}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>
<style>body{font-family:system-ui,sans-serif;background:#F7F4EE;color:#20302C;display:grid;place-items:center;min-height:100vh;margin:0;padding:2rem;text-align:center}
main{max-width:26rem}h1{font-size:1.5rem}a{color:#1E5B46;font-weight:600}</style></head>
<body><main><h1>${title}</h1><p>${body}</p><p><a href="${home}">${back}</a></p></main></body></html>`,
    { status: ok ? 200 : 502, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const wantsHTML = (request.headers.get('accept') || '').includes('text/html');
  const referer = request.headers.get('referer') || '';
  const lang = referer.includes('/en/') ? 'en' : 'el';
  const TEL = lang === 'el' ? '698 835 5485' : '+30 698 835 5485'; // keep in sync with data-tel in the HTML

  let form;
  try {
    form = await request.formData();
  } catch {
    return json(400, { sent: false, message: 'Bad request.' });
  }

  const get = (k) => (form.get(k) || '').toString().trim().slice(0, MAX[k] || 500);
  const onoma = get('onoma');
  const tilefono = get('tilefono');
  const email = get('email');
  const mynima = get('mynima');

  // Honeypot: bots fill the hidden field. Answer "ok" so they move on;
  // no human ever sees this path, so no human is ever lied to.
  if (get('website')) return json(200, { sent: true });

  if (!tilefono && !email) {
    return json(400, { sent: false, message: lang === 'el'
      ? 'Συμπληρώστε τηλέφωνο ή email.' : 'Please provide a phone number or an email.' });
  }
  if (!form.get('synainesi')) {
    return json(400, { sent: false, message: lang === 'el'
      ? 'Απαιτείται η συγκατάθεσή σας.' : 'Your consent is required.' });
  }

  // Fail LOUDLY when unconfigured — never pretend.
  if (!env.TURNSTILE_SECRET_KEY || !env.BREVO_API_KEY || !env.CONTACT_TO || !env.CONTACT_FROM) {
    const message = lang === 'el'
      ? 'Η φόρμα δεν έχει ενεργοποιηθεί ακόμη.'
      : 'The form is not activated yet.';
    return wantsHTML ? htmlPage(false, lang, TEL) : json(503, { sent: false, message });
  }

  // Server-side Turnstile verification (the widget token comes with the form).
  const token = (form.get('cf-turnstile-response') || '').toString();
  if (!token) {
    return json(403, { sent: false, message: lang === 'el'
      ? 'Ο έλεγχος ασφαλείας δεν ολοκληρώθηκε.' : 'The security check was not completed.' });
  }
  const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      secret: env.TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: request.headers.get('CF-Connecting-IP') || undefined,
    }),
  }).then((r) => r.json()).catch(() => ({ success: false }));
  if (!verify.success) {
    return json(403, { sent: false, message: lang === 'el'
      ? 'Ο έλεγχος ασφαλείας απέτυχε.' : 'The security check failed.' });
  }

  // Deliver via Brevo. Plain text only — nothing the sender typed is ever
  // rendered as HTML anywhere.
  const lines = [
    'Νέο μήνυμα από τη φόρμα του ιστότοπου',
    '--------------------------------------',
    'Όνομα:    ' + (onoma || '—'),
    'Τηλέφωνο: ' + (tilefono || '—'),
    'Email:    ' + (email || '—'),
    '',
    'Μήνυμα:',
    mynima || '—',
    '',
    '--------------------------------------',
    'Συγκατάθεση (άρθρο 9 παρ. 2α ΓΚΠΔ): ΝΑΙ — μέσω του πλαισίου επιλογής της φόρμας.',
    'Χρόνος υποβολής: ' + new Date().toISOString(),
    'Γλώσσα σελίδας: ' + lang,
  ];

  const payload = {
    sender: { name: 'Φόρμα ιστότοπου', email: env.CONTACT_FROM },
    to: [{ email: env.CONTACT_TO }],
    subject: 'Νέο μήνυμα επικοινωνίας' + (onoma ? ' — ' + onoma : ''),
    textContent: lines.join('\n'),
  };
  if (email) payload.replyTo = { email };

  const send = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'api-key': env.BREVO_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (send.ok) {
    return wantsHTML ? htmlPage(true, lang, TEL) : json(200, { sent: true });
  }
  return wantsHTML ? htmlPage(false, lang, TEL) : json(502, { sent: false });
}

export function onRequestGet() {
  return new Response('Method Not Allowed', { status: 405 });
}
