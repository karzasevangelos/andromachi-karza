/* =============================================================================
   ΑΝΔΡΟΜΑΧΗ ΚΑΡΖΑ — single-page site. No dependencies. No build step.

   THE GOVERNING RULE
   The page is FINISHED before this script runs. CSS only hides things under
   `html.js`, and this script adds that class ONLY when the visitor allows
   motion. No JS, blocked JS, reduced motion → complete, still page. If the
   animations die, nobody in distress ever finds out.
   ============================================================================= */
(function () {
  'use strict';

  /* Set this after creating a Turnstile widget in the Cloudflare dashboard.
     While it is empty no widget is injected and no external script loads.
     The Pages Function refuses to send until BOTH this and the server secret
     exist, so a misconfigured deploy fails LOUDLY instead of eating leads. */
  var TURNSTILE_SITE_KEY = '';

  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  var root = document.documentElement;
  var motionOK = !mq.matches;

  /* ---------------------------------------------------------------- reveals */
  function attachReveals() {
    if (!('IntersectionObserver' in window)) {
      root.classList.remove('js');           // ancient browser → show all
      return;
    }
    var targets = [].slice.call(document.querySelectorAll('.rv, .rv-kids, .steps'));
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    targets.forEach(function (t) {
      // Anything already in view on load must never wait for a scroll event.
      var r = t.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.9) t.classList.add('in');
      else io.observe(t);
    });
  }

  /* ------------------------------------------------- header + scroll state */
  function attachHeader() {
    var hdr = document.querySelector('.hdr');
    var hint = document.querySelector('.hero__scroll');
    if (!hdr) return;
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        hdr.classList.toggle('is-scrolled', window.scrollY > 12);
        if (hint && window.scrollY > 80) hint.classList.add('is-gone');
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* --------------------------------------------------- blob scroll parallax
     Motion driven by the user's own scrolling — it stops when they stop. */
  function attachParallax() {
    if (!motionOK) return;
    var blobs = [].slice.call(document.querySelectorAll('[data-drift]'));
    if (!blobs.length) return;
    var current = 0, target = 0, raf = null;
    function tick() {
      current += (target - current) * 0.08;
      blobs.forEach(function (b) {
        var speed = parseFloat(b.getAttribute('data-drift')) || 0.05;
        b.style.translate = '0 ' + (-current * speed).toFixed(1) + 'px';
      });
      if (Math.abs(target - current) > 0.5) raf = requestAnimationFrame(tick);
      else raf = null;
    }
    window.addEventListener('scroll', function () {
      target = window.scrollY;
      if (raf === null) raf = requestAnimationFrame(tick);
    }, { passive: true });
  }

  /* -------------------------------------------------- cursor glow (hero)
     A soft light that follows the pointer — motion the visitor drives. */
  function attachGlow() {
    if (!motionOK || !window.matchMedia('(pointer: fine)').matches) return;
    var hero = document.querySelector('.hero');
    var glow = document.querySelector('.hero__glow');
    if (!hero || !glow) return;
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = null, on = false;
    function tick() {
      cx += (tx - cx) * 0.09;
      cy += (ty - cy) * 0.09;
      glow.style.transform = 'translate(' + (cx - glow.offsetWidth / 2).toFixed(1) + 'px,' +
                                            (cy - glow.offsetHeight / 2).toFixed(1) + 'px)';
      if (Math.abs(tx - cx) > 0.5 || Math.abs(ty - cy) > 0.5) raf = requestAnimationFrame(tick);
      else raf = null;
    }
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
      if (!on) { on = true; glow.classList.add('on'); }
      if (raf === null) raf = requestAnimationFrame(tick);
    });
    hero.addEventListener('pointerleave', function () {
      on = false;
      glow.classList.remove('on');
    });
  }

  /* --------------------------------------------------- magnetic buttons
     Primary buttons lean toward the cursor. Uses the `translate` property so
     it composes with the CSS hover transform instead of fighting it. */
  function attachMagnetic() {
    if (!motionOK || !window.matchMedia('(pointer: fine)').matches) return;
    [].slice.call(document.querySelectorAll('.hero__cta .btn, .hdr .btn')).forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) / (r.width / 2);
        var y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
        el.style.translate = (x * 5).toFixed(1) + 'px ' + (y * 4).toFixed(1) + 'px';
      });
      el.addEventListener('pointerleave', function () {
        el.style.transition = 'translate .5s cubic-bezier(.22,1,.36,1)';
        el.style.translate = '0px 0px';
        setTimeout(function () { el.style.transition = ''; }, 500);
      });
    });
  }

  /* ------------------------------------------------------------ active nav */
  function attachActiveNav() {
    if (!('IntersectionObserver' in window)) return;
    var links = [].slice.call(document.querySelectorAll('.nav a[href^="#"]'));
    if (!links.length) return;
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && map[e.target.id]) {
          links.forEach(function (a) { a.classList.remove('is-active'); });
          map[e.target.id].classList.add('is-active');
        }
      });
    }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
    Object.keys(map).forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) io.observe(sec);
    });
  }

  /* ------------------------------------------------------------ mobile nav */
  function attachNav() {
    var btn = document.querySelector('[data-nav-toggle]');
    var panel = document.getElementById('navpanel');
    if (!btn || !panel) return;
    function set(open) {
      btn.setAttribute('aria-expanded', String(open));
      panel.hidden = !open;
    }
    set(false);
    btn.addEventListener('click', function () {
      set(btn.getAttribute('aria-expanded') !== 'true');
    });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) set(false);   // tapping an anchor closes it
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') {
        set(false);
        btn.focus();
      }
    });
  }

  /* ------------------------------------------------------------- turnstile */
  function attachTurnstile() {
    var slot = document.querySelector('[data-turnstile]');
    if (!slot || !TURNSTILE_SITE_KEY) return;
    slot.className = 'cf-turnstile';
    slot.setAttribute('data-sitekey', TURNSTILE_SITE_KEY);
    var s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  }

  /* -------------------------------------------------------------- the form
     There is NO simulated success state anywhere in this function. A success
     message renders if and only if the server confirmed the send. Anything
     else surfaces the failure AND the phone number — a silently discarded
     enquiry is the worst outcome this site can produce. */
  function attachForm() {
    var form = document.querySelector('[data-form]');
    if (!form) return;
    var msg = form.querySelector('[data-msg]');
    var btn = form.querySelector('button[type="submit"]');
    var tel = form.getAttribute('data-tel') || '';
    var strings = {
      el: {
        contact: 'Συμπληρώστε τηλέφωνο ή email, για να μπορέσω να απαντήσω.',
        consent: 'Χρειάζομαι τη συγκατάθεσή σας για να επικοινωνήσω μαζί σας.',
        sending: 'Αποστολή…',
        sent: 'Το μήνυμα στάλθηκε. Θα σας απαντήσω εντός δύο εργάσιμων.',
        fail: 'Δεν ήταν δυνατή η αποστολή. Τηλεφωνήστε μου στο ' + tel + '.',
        err: 'Σφάλμα: '
      },
      en: {
        contact: 'Please add a phone number or an email so I can reply.',
        consent: 'I need your consent before I can contact you.',
        sending: 'Sending…',
        sent: 'Your message was sent. I will reply within two working days.',
        fail: 'The message could not be sent. Please call me on ' + tel + '.',
        err: 'Error: '
      }
    };
    var t = strings[root.lang === 'en' ? 'en' : 'el'];

    function say(text, kind) {
      msg.textContent = text;
      msg.className = 'msg msg--' + kind;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var phone = (fd.get('tilefono') || '').toString().trim();
      var email = (fd.get('email') || '').toString().trim();

      if (!phone && !email) {
        say(t.err + t.contact, 'err');
        var f = form.querySelector('#tilefono');
        if (f) f.focus();
        return;
      }
      if (!fd.get('synainesi')) {
        say(t.err + t.consent, 'err');
        return;
      }

      btn.disabled = true;
      say(t.sending, 'ok');

      fetch(form.action, { method: 'POST', body: fd })
        .then(function (r) {
          return r.json().catch(function () { return {}; }).then(function (j) {
            return { ok: r.ok, body: j };
          });
        })
        .then(function (res) {
          if (res.ok && res.body && res.body.sent === true) {
            form.reset();
            say(t.sent, 'ok');
          } else {
            say(t.err + (res.body && res.body.message ? res.body.message + ' ' : '') + t.fail, 'err');
          }
          btn.disabled = false;
        })
        .catch(function () {
          say(t.err + t.fail, 'err');
          btn.disabled = false;
        });
    });
  }

  /* ------------------------------------------------------------------ boot */
  function init() {
    attachNav();
    attachTurnstile();
    attachForm();
    attachHeader();
    attachActiveNav();

    var y = document.querySelector('[data-year]');
    if (y) y.textContent = new Date().getFullYear();

    if (motionOK) {
      root.classList.add('js');       // arms the hidden states…
      attachReveals();
      attachParallax();
      attachGlow();
      attachMagnetic();
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          root.classList.add('loaded');   // …then fires the hero sequence
        });
      });
    }
  }

  var onChange = function (e) {
    if (e.matches) {
      motionOK = false;
      root.classList.remove('js', 'loaded');   // instantly whole and still
    }
  };
  if (mq.addEventListener) mq.addEventListener('change', onChange);
  else if (mq.addListener) mq.addListener(onChange);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
