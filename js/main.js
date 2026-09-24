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

  function attachGames() {
    var openButtons = [].slice.call(document.querySelectorAll('[data-game-open]'));
    var focusedPanel = null;
    if (!openButtons.length) return;

    var en = {
      open: 'Open game',
      close: 'Close game',
      openLabel: 'Open the {title} game.',
      closeLabel: 'Close the {title} game.',
      start: 'Start game',
      again: 'Play again',
      reset: 'Reset',
      progress: 'Round {current} of {total}',
      done: 'Complete',
      emotion: {
        stage: 'Emotion Balloons game',
        promptLabel: 'Find the emotion',
        ready: 'Choose the balloon for the requested emotion.',
        prompt: 'Find the {emotion} balloon.',
        wrong: 'That balloon shows a different feeling. Try again; the round has not changed.',
        feedback: 'A possible match. Feelings can change with context, so this label is only a starting point.',
        complete: 'You explored five rounds. This is educational practice, not a test or diagnosis.',
        completeTitle: 'Five balloons explored',
        label: 'Pop the {emotion} balloon.',
        names: { calm: 'Calm', joy: 'Joy', worry: 'Worry', anger: 'Anger', sadness: 'Sadness', surprise: 'Surprise' },
        sequence: ['worry', 'joy', 'anger', 'sadness', 'surprise']
      },
      thought: {
        stage: 'Thought Bubbles game',
        promptLabel: 'Find the rigid thought',
        ready: 'Choose the bubble that leaves no room for an alternative.',
        prompt: 'Pop the bubble with the rigid thought.',
        wrong: 'That thought leaves uncertainty or another option open. The round has not changed.',
        reveal: 'A more balanced thought:',
        feedback: 'A rigid thought is one possibility, not a rule. A balanced option can keep facts and next steps in view.',
        complete: 'You explored five rounds. This is educational practice, not a test or diagnosis.',
        completeTitle: 'Five thought bubbles explored',
        bubbleLabel: 'Thought bubble: {thought}',
        rounds: [
          { rigid: 'I always fail this.', options: ['I might need another try.', 'I can check what happened.', 'This task is hard right now.'], balanced: 'I can look at what happened and try one manageable step.' },
          { rigid: 'They will definitely hate it.', options: ['Maybe they need more time.', 'I can ask calmly if it feels safe.', 'I can notice what I know and what I do not.'], balanced: 'I can consider more than one explanation and choose a calm next step.' },
          { rigid: 'If I feel nervous, I will fail.', options: ['I can prepare while I feel nervous.', 'Nerves are information, not a verdict.', 'I can begin with one small step.'], balanced: 'I can allow nerves and take one manageable step.' },
          { rigid: 'They are only being polite.', options: ['I can receive the feedback without guessing motives.', 'Maybe the tone was unclear.', 'I can ask for one concrete example.'], balanced: 'I can take in the feedback without deciding what someone must mean.' },
          { rigid: 'Nothing will ever change.', options: ['I can look for one thing that could change.', 'This pattern may feel strong right now.', 'I can review the facts and try one step.'], balanced: 'I can review the facts and keep one manageable possibility open.' }
        ]
      },
      focus: {
        stage: 'Focus Garden game',
        board: 'A 4 by 4 focus garden',
        promptLabel: 'Find the glowing leaf',
        ready: 'Take your time. Tap only the glowing leaf.',
        prompt: 'Tap the glowing leaf when you are ready.',
        wrong: 'That is an obstacle. The round has not changed; try the glowing leaf.',
        feedback: 'The glowing leaf is marked. This is a playful visual choice, not a judgement.',
        complete: 'You completed ten self-paced rounds. This is educational practice, not an attention test or diagnosis.',
        completeTitle: 'Ten garden rounds explored',
        start: 'Start 10 rounds',
        again: 'Play again',
        leaf: 'Glowing leaf target, row {row}, column {column}',
        bed: 'Garden bed, row {row}, column {column}',
        obstacles: {
          stone: 'Stone obstacle, row {row}, column {column}',
          cross: 'Cross obstacle, row {row}, column {column}',
          pebble: 'Pebble obstacle, row {row}, column {column}',
          twig: 'Twig obstacle, row {row}, column {column}',
          mushroom: 'Mushroom obstacle, row {row}, column {column}',
          fence: 'Fence obstacle, row {row}, column {column}'
        }
      },
      memory: {
        stage: 'Memory Path game',
        ready: 'Watch the sequence, then repeat it. Replay is unlimited and does not change your progress.',
        showing: 'The sequence is: {sequence}',
        yourTurn: 'Your turn. Enter the sequence.',
        wrong: 'That was not the next point. You can replay the same sequence without losing progress.',
        correct: 'The path is complete. The next sequence is one step longer.',
        progress: 'Path {current} of 5',
        done: 'Five paths complete',
        complete: 'You completed five sequences. This is educational practice, not a memory test or diagnosis.',
        completeTitle: 'Five paths explored',
        start: 'Start sequence',
        again: 'Play again',
        replay: 'Show sequence again',
        skip: 'Skip animation',
        node: 'Memory point {number}'
      }
    };

    var el = {
      open: 'Άνοιγμα παιχνιδιού',
      close: 'Κλείσιμο παιχνιδιού',
      openLabel: 'Άνοιγμα του παιχνιδιού {title}.',
      closeLabel: 'Κλείσιμο του παιχνιδιού {title}.',
      start: 'Ξεκίνα παιχνίδι',
      again: 'Παίξε ξανά',
      reset: 'Επαναφορά',
      progress: 'Γύρος {current} από {total}',
      done: 'Ολοκληρώθηκε',
      emotion: {
        stage: 'Παιχνίδι συναισθημάτων στα μπαλόνια',
        promptLabel: 'Βρείτε το συναίσθημα',
        ready: 'Διαλέξτε το μπαλόνι για το συναίσθημα που ζητά ο γύρος.',
        prompt: 'Βρείτε το μπαλόνι «{emotion}».',
        wrong: 'Αυτό το μπαλόνι δείχνει διαφορετικό συναίσθημα. Δοκιμάστε ξανά· ο γύρος δεν άλλαξε.',
        feedback: 'Μία πιθανή αντιστοίχιση. Τα συναισθήματα αλλάζουν ανάλογα με το πλαίσιο, άρα η ετικέτα είναι μόνο μια αρχή.',
        complete: 'Ολοκληρώσατε πέντε γύρους. Πρόκειται για εκπαιδευτική άσκηση, όχι για τεστ ή διάγνωση.',
        completeTitle: 'Δοκιμάσατε πέντε μπαλόνια',
        label: 'Σκάστε το μπαλόνι «{emotion}».',
        names: { calm: 'Ηρεμία', joy: 'Χαρά', worry: 'Ανησυχία', anger: 'Θυμός', sadness: 'Λύπη', surprise: 'Έκπληξη' },
        sequence: ['worry', 'joy', 'anger', 'sadness', 'surprise']
      },
      thought: {
        stage: 'Παιχνίδι φυσαλίδων σκέψεων',
        promptLabel: 'Βρείτε την απόλυτη σκέψη',
        ready: 'Διαλέξτε τη φυσαλίδα που δεν αφήνει χώρο για εναλλακτική.',
        prompt: 'Σκάστε τη φυσαλίδα με την απόλυτη σκέψη.',
        wrong: 'Αυτή η σκέψη αφήνει ανοιχτή μια πιθανότητα ή άλλη επιλογή. Ο γύρος δεν άλλαξε.',
        reveal: 'Μια πιο ισορροπημένη σκέψη:',
        feedback: 'Η απόλυτη σκέψη είναι μια πιθανότητα, όχι κανόνας. Μια ισορροπημένη επιλογή κρατά τα γεγονότα και το επόμενο βήμα ορατά.',
        complete: 'Ολοκληρώσατε πέντε γύρους. Πρόκειται για εκπαιδευτική άσκηση, όχι για τεστ ή διάγνωση.',
        completeTitle: 'Δοκιμάσατε πέντε φυσαλίδες σκέψεων',
        bubbleLabel: 'Φυσαλίδα σκέψης: {thought}',
        rounds: [
          { rigid: 'Πάντα αποτυγχάνω σε αυτό.', options: ['Ίσως χρειάζομαι άλλη μια προσπάθεια.', 'Μπορώ να δω τι ακριβώς συνέβη.', 'Αυτή η εργασία είναι δύσκολή τώρα.'], balanced: 'Μπορώ να δω τι συνέβη και να δοκιμάσω ένα διαχειρίσιμο βήμα.' },
          { rigid: 'Θα μισήσουν οπωσδήποτε αυτό.', options: ['Ίσως χρειάζονται περισσότερο χρόνο.', 'Μπορώ να ρωτήσω ήρεμα, αν νιώθω ασφαλές.', 'Μπορώ να διακρίνω τι ξέρω και τι όχι.'], balanced: 'Μπορώ να εξετάσω περισσότερες από μία εξηγήσεις και να διαλέξω ένα ήρεμο επόμενο βήμα.' },
          { rigid: 'Αν νιώσω νευρικότητα, θα αποτύχω.', options: ['Μπορώ να προετοιμαστώ όσο νιώθω νευρικότητα.', 'Η νευρικότητα είναι πληροφορία, όχι καταδικαστική απόφαση.', 'Μπορώ να ξεκινήσω με ένα μικρό βήμα.'], balanced: 'Μπορώ να δεχτώ τη νευρικότητα και να κάνω ένα διαχειρίσιμο βήμα.' },
          { rigid: 'Το είπαν απλώς από ευγένεια.', options: ['Μπορώ να δεχτώ το σχόλιο χωρίς να υποθέσω κίνητρα.', 'Ίσως ο τόνος δεν ήταν σαφής.', 'Μπορώ να ζητήσω ένα συγκεκριμένο παράδειγμα.'], balanced: 'Μπορώ να δεχτώ το σχόλιο χωρίς να αποφασίζω τι σημαίνει οπωσδήποτε για κάποιον.' },
          { rigid: 'Δεν θα αλλάξει τίποτα ποτέ.', options: ['Μπορώ να δω ένα πράγμα που θα μπορούσε να αλλάξει.', 'Αυτό το μοτίβο μπορεί να φαίνεται ισχυρό τώρα.', 'Μπορώ να εξετάσω τα γεγονότα και να δοκιμάσω ένα βήμα.'], balanced: 'Μπορώ να εξετάσω τα γεγονότα και να κρατώ ανοιχτή μία διαχειρίσιμη πιθανότητα.' }
        ]
      },
      focus: {
        stage: 'Παιχνίδι κήπου επίκεντρης',
        board: 'Κήπος επίκεντρης 4 × 4',
        promptLabel: 'Βρείτε το φωτεινό φύλλο',
        ready: 'Πάρτε τον χρόνο σας. Πατήστε μόνο το φωτεινό φύλλο.',
        prompt: 'Πατήστε το φωτεινό φύλλο όταν είστε έτοιμοι.',
        wrong: 'Αυτό είναι εμπόδιο. Ο γύρος δεν άλλαξε· δοκιμάστε το φωτεινό φύλλο.',
        feedback: 'Το φωτεινό φύλλο είναι σημειωμένο. Πρόκειται για μια παιχνιδιάστικη οπτική επιλογή, όχι για κρίση.',
        complete: 'Ολοκληρώσατε δέκα γύρους με τον δικό σας ρυθμό. Πρόκειται για εκπαιδευτική άσκηση, όχι για τεστ προσοχής ή διάγνωση.',
        completeTitle: 'Δοκιμάσατε δέκα γύρους στον κήπο',
        start: 'Ξεκίνα 10 γύρους',
        again: 'Παίξτε ξανά',
        leaf: 'Φωτεινό φύλλο-στόχος, γραμμή {row}, στήλη {column}',
        bed: 'Κρεβάτι κήπου, γραμμή {row}, στήλη {column}',
        obstacles: {
          stone: 'Εμπόδιο: πέτρα, γραμμή {row}, στήλη {column}',
          cross: 'Εμπόδιο: σταυρός, γραμμή {row}, στήλη {column}',
          pebble: 'Εμπόδιο: χαλικάκι, γραμμή {row}, στήλη {column}',
          twig: 'Εμπόδιο: κλαδάκι, γραμμή {row}, στήλη {column}',
          mushroom: 'Εμπόδιο: μανιτάρι, γραμμή {row}, στήλη {column}',
          fence: 'Εμπόδιο: φράχτης, γραμμή {row}, στήλη {column}'
        }
      },
      memory: {
        stage: 'Παιχνίδι διαδρομής μνήμης',
        ready: 'Παρακολουθήστε τη σειρά και μετά επαναλάβετέ τη. Η επανάληψη είναι απεριόριστη και δεν αλλάζει την πρόοδό σας.',
        showing: 'Η σειρά είναι: {sequence}',
        yourTurn: 'Η σειρά σας. Εισαγάγετε τη σειρά.',
        wrong: 'Αυτό δεν ήταν το επόμενο σημείο. Μπορείτε να δείτε ξανά την ίδια σειρά χωρίς να χάσετε πρόοδο.',
        correct: 'Η διαδρομή ολοκληρώθηκε. Η επόμενη σειρά έχει ένα βήμα παραπάνω.',
        progress: 'Διαδρομή {current} από 5',
        done: 'Ολοκληρώθηκαν πέντε διαδρομές',
        complete: 'Ολοκληρώσατε πέντε σειρές. Πρόκειται για εκπαιδευτική άσκηση, όχι για τεστ μνήμης ή διάγνωση.',
        completeTitle: 'Δοκιμάσατε πέντε διαδρομές',
        start: 'Ξεκίνα σειρά',
        again: 'Παίξε ξανά',
        replay: 'Δείτε τη σειρά ξανά',
        skip: 'Παράλειψε την κίνηση',
        node: 'Σημείο μνήμης {number}'
      }
    };
    var t = root.lang === 'en' ? en : el;

    function format(template, values) {
      return template.replace(/\{(\w+)\}/g, function (_, key) {
        return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : '';
      });
    }

    function setFeedback(element, message, good) {
      element.textContent = message;
      element.className = good ? 'game-feedback is-good' : 'game-feedback';
    }

    function shuffle(items) {
      var result = items.slice();
      for (var i = result.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var current = result[i];
        result[i] = result[j];
        result[j] = current;
      }
      return result;
    }

    function clearTimers(state) {
      state.timers.forEach(function (timer) { window.clearTimeout(timer); });
      state.timers = [];
    }

    function invalidate(state) {
      state.epoch += 1;
      clearTimers(state);
    }

    function later(state, callback, delay) {
      var epoch = state.epoch;
      state.timers.push(window.setTimeout(function () {
        if (state.epoch !== epoch) return;
        callback();
      }, delay));
    }

    function enable(items, value) {
      items.forEach(function (item) { item.disabled = !value; });
    }

    function focusElement(element) {
      if (!element) return;
      var panel = element.closest ? element.closest('.game-panel') : null;
      if (panel && panel.hidden) return;
      if (panel && focusedPanel && panel !== focusedPanel) return;
      try {
        element.focus({ preventScroll: true });
      } catch {
        element.focus();
      }
    }

    function gameButton(className, label) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = className;
      button.setAttribute('aria-label', label);
      return button;
    }

    function svgElement(markup) {
      var holder = document.createElement('span');
      holder.innerHTML = markup;
      return holder.firstElementChild;
    }

    var promptCounter = 0;

    function addPrompt(host, label, value) {
      var prompt = document.createElement('div');
      prompt.className = 'game-prompt';
      prompt.id = 'game-prompt-' + (++promptCounter);
      prompt.setAttribute('role', 'status');
      prompt.setAttribute('tabindex', '-1');
      host.setAttribute('aria-describedby', prompt.id);
      var labelNode = document.createElement('p');
      labelNode.className = 'game-prompt__label';
      labelNode.textContent = label;
      var valueNode = document.createElement('p');
      valueNode.className = 'game-prompt__text';
      valueNode.textContent = value;
      prompt.appendChild(labelNode);
      prompt.appendChild(valueNode);
      host.appendChild(prompt);
    }

    function showCompletion(host, variant, art, title, value) {
      host.removeAttribute('aria-describedby');
      host.textContent = '';
      var box = document.createElement('div');
      box.className = 'game-complete game-complete--' + variant;
      var artwork = svgElement(art);
      artwork.classList.add('game-complete__art');
      var titleNode = document.createElement('p');
      titleNode.className = 'game-complete__title';
      titleNode.textContent = title;
      var valueNode = document.createElement('p');
      valueNode.className = 'game-complete__text';
      valueNode.textContent = value;
      box.appendChild(artwork);
      box.appendChild(titleNode);
      box.appendChild(valueNode);
      host.appendChild(box);
    }

    function addBurst(host, state, variant) {
      var burst = document.createElement('span');
      burst.className = 'game-burst ' + variant;
      burst.setAttribute('aria-hidden', 'true');
      for (var i = 0; i < 8; i++) burst.appendChild(document.createElement('i'));
      host.appendChild(burst);
      later(state, function () {
        if (burst.parentNode) burst.parentNode.removeChild(burst);
      }, 850);
    }

    function shake(button, state, className) {
      button.classList.remove(className);
      void button.offsetWidth;
      button.classList.add(className);
      later(state, function () { button.classList.remove(className); }, 500);
    }

    function balloonSvg(kind) {
      var fills = {
        calm: '#8fcbb0', joy: '#f3b55b', worry: '#afc9dd', anger: '#e8836a',
        sadness: '#b9a7d4', surprise: '#f0a6b8'
      };
      var faces = {
        calm: '<path d="M28 53Q35 48 42 53M58 53Q65 48 72 53M37 72Q50 79 63 72"/>',
        joy: '<path d="M28 52Q35 42 42 52M58 52Q65 42 72 52"/><path d="M35 69Q50 85 65 69Q50 74 35 69Z" fill="#20302C" stroke="none"/>',
        worry: '<path d="M27 47L42 52M58 52L73 47M30 56Q35 61 40 56M60 56Q65 61 70 56M35 75Q42 68 50 73Q58 78 65 73"/>',
        anger: '<path d="M27 47L42 53M58 53L73 47"/><circle cx="35" cy="59" r="2.5" fill="#20302C" stroke="none"/><circle cx="65" cy="59" r="2.5" fill="#20302C" stroke="none"/><path d="M36 78Q50 65 64 78"/>',
        sadness: '<path d="M28 55Q35 63 42 55M58 55Q65 63 72 55M35 78Q50 66 65 78"/>',
        surprise: '<circle cx="35" cy="56" r="5"/><circle cx="65" cy="56" r="5"/><ellipse cx="50" cy="75" rx="6" ry="8"/>'
      };
      return '<svg viewBox="0 0 100 126" aria-hidden="true" focusable="false"><path d="M50 6C27 6 14 23 14 45c0 20 13 33 28 42l8 9 8-9c15-9 28-22 28-42C86 23 73 6 50 6Z" fill="' + fills[kind] + '" stroke="#20302C" stroke-width="2.5"/><path d="M25 34Q31 18 48 15" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity=".7"/><g fill="none" stroke="#20302C" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' + faces[kind] + '</g><path d="M46 97h8l-4 8Z" fill="#20302C"/><path d="M50 105c0 8 8 7 8 14" fill="none" stroke="#20302C" stroke-width="2" stroke-linecap="round"/></svg>';
    }

    function thoughtSvg() {
      return '<svg viewBox="0 0 52 40" aria-hidden="true" focusable="false"><path d="M9 27c-5 0-8-3-8-7s3-7 8-7c1-5 5-8 10-8 4 0 8 2 10 5 2-2 5-3 8-3 6 0 10 4 10 9 4 1 6 4 6 8 0 5-4 8-9 8H16c-4 0-6 2-8 4-2-2-3-3-5-3Z" fill="#DEEDE4" stroke="#2E7D63" stroke-width="2"/><circle cx="18" cy="18" r="2" fill="#2E7D63"/><circle cx="29" cy="14" r="2" fill="#2E7D63"/><circle cx="40" cy="18" r="2" fill="#2E7D63"/></svg>';
    }

    var focusArt = {
      leaf: '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M48 13C30 13 17 22 16 38c8 8 24 7 32-5 4-6 4-13 0-20Z" fill="#2E7D63" stroke="#20302C" stroke-width="2"/><path d="M18 46C27 36 35 27 47 17" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/><path d="M31 35c-7-5-12-5-16-3M36 28c-1-7 1-11 5-15" fill="none" stroke="#1E5B46" stroke-width="2" stroke-linecap="round"/></svg>',
      stone: '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M10 40 17 19l15 4 12 15-8 14H18Z" fill="#A9B7B0" stroke="#20302C" stroke-width="2"/><path d="m22 27 7 4 9-3M22 40l8 4 9-5" fill="none" stroke="#F7F4EE" stroke-width="2" stroke-linecap="round"/></svg>',
      cross: '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M32 9v46M9 32h46" stroke="#8A3E24" stroke-width="9" stroke-linecap="round"/><circle cx="32" cy="32" r="6" fill="#E8825F" stroke="#20302C" stroke-width="2"/></svg>',
      pebble: '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><ellipse cx="25" cy="39" rx="14" ry="10" fill="#B9A7D4" stroke="#20302C" stroke-width="2"/><ellipse cx="41" cy="44" rx="11" ry="8" fill="#D8CDEA" stroke="#20302C" stroke-width="2"/><path d="M18 36c5-4 10-4 14-1M37 41c4-3 7-3 10 0" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/></svg>',
      twig: '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M12 49c13-5 23-17 39-35M25 38l-8-9M34 29l-2-12M40 25l11-1" fill="none" stroke="#765A24" stroke-width="5" stroke-linecap="round"/><path d="M17 40c-6-2-9-6-10-11 7 0 11 3 14 7M34 29c4-6 8-8 14-8-1 7-5 11-11 13" fill="#EDB458" stroke="#20302C" stroke-width="1.5"/></svg>',
      mushroom: '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M11 32c2-13 11-20 21-20s19 7 21 20H11Z" fill="#E8825F" stroke="#20302C" stroke-width="2"/><path d="M25 32v18c0 5 4 7 7 7s7-2 7-7V32" fill="#F7F4EE" stroke="#20302C" stroke-width="2"/><circle cx="23" cy="23" r="3" fill="#F7F4EE"/><circle cx="38" cy="19" r="4" fill="#F7F4EE"/><circle cx="45" cy="27" r="2.5" fill="#F7F4EE"/></svg>',
      fence: '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M12 19h40M12 31h40M12 43h40M19 12v40M32 12v40M45 12v40" fill="none" stroke="#8A3E24" stroke-width="5" stroke-linecap="round"/><path d="m12 19 7-7 7 7M25 31l7-7 7 7M38 43l7-7 7 7" fill="none" stroke="#20302C" stroke-width="2"/></svg>',
      bed: '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M9 48c8-8 14 5 22-3s14 5 24-4" fill="none" stroke="#8AB69D" stroke-width="4" stroke-linecap="round"/><path d="M17 50c0-10 5-16 11-16M45 50c0-8-4-13-9-16" fill="none" stroke="#2E7D63" stroke-width="3" stroke-linecap="round"/><circle cx="29" cy="27" r="3" fill="#EDB458"/><circle cx="37" cy="35" r="2" fill="#E8825F"/></svg>'
    };

    var completionArt = {
      emotion: '<svg viewBox="0 0 180 120" aria-hidden="true" focusable="false"><circle cx="144" cy="25" r="15" fill="#EDB458"/><path d="M28 83C28 51 45 28 68 28s40 23 40 55c0 17-12 27-28 35l-12 10-12-10C40 110 28 100 28 83Z" fill="#8FCBB0" stroke="#20302C" stroke-width="3"/><path d="M48 67q10-9 20 0M76 67q10-9 20 0M58 86q18 15 36 0" fill="none" stroke="#20302C" stroke-width="4" stroke-linecap="round"/><path d="m119 72 8 8 15-18M21 42l8 8M13 62l9 4M144 78l10 3" fill="none" stroke="#E8825F" stroke-width="4" stroke-linecap="round"/></svg>',
      thought: '<svg viewBox="0 0 180 120" aria-hidden="true" focusable="false"><path d="M22 101c25-12 111-12 136 0" fill="none" stroke="#8AB69D" stroke-width="6" stroke-linecap="round"/><path d="M88 100c0-28 2-48 10-63" fill="none" stroke="#2E7D63" stroke-width="6" stroke-linecap="round"/><path d="M97 58C73 54 63 38 67 22c22-3 35 10 30 36ZM101 76c22-4 35-18 33-34-20-3-32 9-33 34Z" fill="#8FCBB0" stroke="#1E5B46" stroke-width="3"/><circle cx="102" cy="29" r="12" fill="#EDB458"/><path d="M96 29h12M102 23v12" stroke="#20302C" stroke-width="2.5" stroke-linecap="round"/></svg>',
      focus: '<svg viewBox="0 0 180 120" aria-hidden="true" focusable="false"><path d="M20 99c28-13 112-13 140 0" fill="none" stroke="#8AB69D" stroke-width="7" stroke-linecap="round"/><path d="M89 100V55" stroke="#2E7D63" stroke-width="6" stroke-linecap="round"/><path d="M89 76C65 73 54 59 58 43c22-1 33 13 31 33ZM91 66c18-3 31-15 32-31-20-2-31 10-32 31Z" fill="#8FCBB0" stroke="#1E5B46" stroke-width="3"/><g fill="#E8825F" stroke="#20302C" stroke-width="2"><circle cx="89" cy="35" r="13"/><circle cx="68" cy="45" r="13"/><circle cx="110" cy="45" r="13"/><circle cx="78" cy="18" r="13"/><circle cx="100" cy="18" r="13"/></g><circle cx="89" cy="35" r="9" fill="#EDB458"/></svg>',
      memory: '<svg viewBox="0 0 180 120" aria-hidden="true" focusable="false"><path d="M15 88c28-34 45 17 70-17s38 23 80-26" fill="none" stroke="#E8825F" stroke-width="7" stroke-linecap="round"/><circle cx="31" cy="78" r="10" fill="#8FCBB0" stroke="#20302C" stroke-width="2"/><circle cx="70" cy="74" r="10" fill="#D8E8F2" stroke="#20302C" stroke-width="2"/><circle cx="102" cy="84" r="10" fill="#F4E3B7" stroke="#20302C" stroke-width="2"/><circle cx="139" cy="55" r="10" fill="#E5DEF1" stroke="#20302C" stroke-width="2"/><path d="m89 16 4 9 10 1-8 7 3 10-9-5-9 5 3-10-8-7 10-1Z" fill="#EDB458" stroke="#20302C" stroke-width="2"/></svg>'
    };

    function memorySvg() {
      return '<svg class="memory-path__svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path class="memory-path__base" d="M10 73C18 53 23 62 29 44S42 52 47 66 59 51 64 35 77 46 80 58 86 40 90 25"/><path class="memory-path__highlight" pathLength="1" d="M10 73C18 53 23 62 29 44S42 52 47 66 59 51 64 35 77 46 80 58 86 40 90 25"/><circle cx="10" cy="73" r="2" fill="#EDB458"/><circle cx="90" cy="25" r="2" fill="#2E7D63"/></svg>';
    }

    function initEmotion(panel) {
      var stage = panel.querySelector('[data-emotion-stage]');
      var progress = panel.querySelector('[data-emotion-progress]');
      var message = panel.querySelector('[data-emotion-message]');
      var start = panel.querySelector('[data-emotion-start]');
      var resetButton = panel.querySelector('[data-emotion-reset]');
      if (!stage || !progress || !message || !start || !resetButton) return;
      var state = { round: 0, active: false, locked: false, epoch: 0, timers: [] };
      var buttons = [];
      stage.setAttribute('aria-label', t.emotion.stage);
      stage.setAttribute('tabindex', '-1');

      function render() {
        stage.textContent = '';
        buttons = [];
        progress.textContent = state.active ? format(t.progress, { current: state.round + 1, total: 5 }) : '';
        var target = state.active ? t.emotion.sequence[state.round] : null;
        addPrompt(stage, t.emotion.promptLabel, state.active ? format(t.emotion.prompt, { emotion: t.emotion.names[target] }) : t.emotion.ready);
        var grid = document.createElement('div');
        grid.className = 'emotion-grid';
        shuffle(['calm', 'joy', 'worry', 'anger', 'sadness', 'surprise']).forEach(function (kind) {
          var button = gameButton('emotion-balloon', format(t.emotion.label, { emotion: t.emotion.names[kind] }));
          button.setAttribute('data-emotion-kind', kind);
          button.innerHTML = balloonSvg(kind);
          button.disabled = !state.active;
          button.addEventListener('click', choose.bind(null, kind, button));
          buttons.push(button);
          grid.appendChild(button);
        });
        stage.appendChild(grid);
      }

      function finish() {
        state.active = false;
        state.locked = true;
        showCompletion(stage, 'emotion', completionArt.emotion, t.emotion.completeTitle, t.emotion.complete);
        progress.textContent = t.done;
        setFeedback(message, t.emotion.complete, true);
        start.hidden = false;
        start.textContent = t.again;
        focusElement(start);
      }

      function choose(kind, button) {
        if (!state.active || state.locked) return;
        if (kind !== t.emotion.sequence[state.round]) {
          shake(button, state, 'is-wobble');
          setFeedback(message, t.emotion.wrong, false);
          return;
        }
        state.locked = true;
        enable(buttons, false);
        button.classList.add('is-popped');
        addBurst(button, state, 'emotion-burst');
        setFeedback(message, t.emotion.feedback, true);
        later(state, function () {
          if (state.round >= 4) finish();
          else {
            state.round += 1;
            state.locked = false;
            render();
            focusElement(stage);
          }
        }, 850);
      }

      function begin() {
        invalidate(state);
        state.round = 0;
        state.active = true;
        state.locked = false;
        start.hidden = true;
        setFeedback(message, t.emotion.ready, false);
        render();
        focusElement(stage);
      }

      function resetGame() {
        invalidate(state);
        state.round = 0;
        state.active = false;
        state.locked = false;
        start.hidden = false;
        start.textContent = t.start;
        render();
        setFeedback(message, t.emotion.ready, false);
      }

      start.textContent = t.start;
      resetButton.textContent = t.reset;
      start.addEventListener('click', begin);
      resetButton.addEventListener('click', resetGame);
      render();
      progress.textContent = '';
      setFeedback(message, t.emotion.ready, false);
      return resetGame;
    }
    function initThought(panel) {
      var stage = panel.querySelector('[data-thought-stage]');
      var progress = panel.querySelector('[data-thought-progress]');
      var message = panel.querySelector('[data-thought-message]');
      var start = panel.querySelector('[data-thought-start]');
      var resetButton = panel.querySelector('[data-thought-reset]');
      if (!stage || !progress || !message || !start || !resetButton) return;
      var state = { round: 0, active: false, locked: false, epoch: 0, timers: [] };
      var buttons = [];
      stage.setAttribute('aria-label', t.thought.stage);
      stage.setAttribute('tabindex', '-1');

      function render() {
        stage.textContent = '';
        buttons = [];
        progress.textContent = state.active ? format(t.progress, { current: state.round + 1, total: 5 }) : '';
        var item = t.thought.rounds[state.round];
        addPrompt(stage, t.thought.promptLabel, state.active ? t.thought.prompt : t.thought.ready);
        var grid = document.createElement('div');
        grid.className = 'thought-grid';
        var options = [{ text: item.rigid, rigid: true }].concat(item.options.map(function (value) {
          return { text: value, rigid: false };
        }));
        shuffle(options).forEach(function (option) {
          var button = gameButton('thought-bubble', format(t.thought.bubbleLabel, { thought: option.text }));
          button.setAttribute('data-rigid', option.rigid ? 'true' : 'false');
          var icon = document.createElement('span');
          icon.className = 'thought-bubble__icon';
          icon.innerHTML = thoughtSvg();
          var value = document.createElement('span');
          value.className = 'thought-bubble__text';
          value.textContent = option.text;
          button.appendChild(icon);
          button.appendChild(value);
          button.disabled = !state.active;
          button.addEventListener('click', choose.bind(null, option.rigid, item, button));
          buttons.push(button);
          grid.appendChild(button);
        });
        stage.appendChild(grid);
      }

      function finish() {
        state.active = false;
        state.locked = true;
        showCompletion(stage, 'thought', completionArt.thought, t.thought.completeTitle, t.thought.complete);
        progress.textContent = t.done;
        setFeedback(message, t.thought.complete, true);
        start.hidden = false;
        start.textContent = t.again;
        focusElement(start);
      }

      function choose(rigid, item, button) {
        if (!state.active || state.locked) return;
        if (!rigid) {
          shake(button, state, 'is-wobble');
          setFeedback(message, t.thought.wrong, false);
          return;
        }
        state.locked = true;
        enable(buttons, false);
        button.classList.add('is-deflated');
        addBurst(button, state, 'thought-burst');
        var reveal = document.createElement('div');
        reveal.className = 'thought-reveal';
        reveal.setAttribute('role', 'status');
        var label = document.createElement('p');
        label.className = 'thought-reveal__label';
        label.textContent = t.thought.reveal;
        var balanced = document.createElement('p');
        balanced.className = 'thought-reveal__text';
        balanced.textContent = item.balanced;
        reveal.appendChild(label);
        reveal.appendChild(balanced);
        stage.appendChild(reveal);
        setFeedback(message, t.thought.feedback, true);
        later(state, function () {
          if (state.round >= 4) finish();
          else {
            state.round += 1;
            state.locked = false;
            render();
            focusElement(stage);
          }
        }, 1000);
      }

      function resetGame() {
        invalidate(state);
        state.round = 0;
        state.active = false;
        state.locked = false;
        start.hidden = false;
        start.textContent = t.start;
        render();
        setFeedback(message, t.thought.ready, false);
      }

      start.textContent = t.start;
      resetButton.textContent = t.reset;
      start.addEventListener('click', function () {
        invalidate(state);
        state.round = 0;
        state.active = true;
        state.locked = false;
        start.hidden = true;
        setFeedback(message, t.thought.ready, false);
        render();
        focusElement(stage);
      });
      resetButton.addEventListener('click', resetGame);
      render();
      progress.textContent = '';
      setFeedback(message, t.thought.ready, false);
      return resetGame;
    }

    function initFocus(panel) {
      var stage = panel.querySelector('[data-focus-stage]');
      var progress = panel.querySelector('[data-focus-progress]');
      var message = panel.querySelector('[data-focus-message]');
      var start = panel.querySelector('[data-focus-start]');
      var resetButton = panel.querySelector('[data-focus-reset]');
      if (!stage || !progress || !message || !start || !resetButton) return;
      var kinds = ['stone', 'cross', 'pebble', 'twig', 'mushroom', 'fence'];
      var state = { round: 0, active: false, locked: false, epoch: 0, timers: [] };
      var buttons = [];
      stage.setAttribute('aria-label', t.focus.stage);
      stage.setAttribute('tabindex', '-1');

      function render() {
        stage.textContent = '';
        buttons = [];
        progress.textContent = state.active ? format(t.progress, { current: state.round + 1, total: 10 }) : '';
        addPrompt(stage, t.focus.promptLabel, state.active ? t.focus.prompt : t.focus.ready);
        var slots = [];
        for (var n = 0; n < 16; n++) slots.push(n);
        var positions = shuffle(slots);
        var board = document.createElement('div');
        board.className = 'focus-board';
        board.setAttribute('role', 'group');
        board.setAttribute('aria-label', t.focus.board);
        for (var i = 0; i < 16; i++) {
          var position = positions[i];
          var row = Math.floor(position / 4) + 1;
          var column = position % 4 + 1;
          var cell;
          if (state.active && i === 0) {
            cell = gameButton('focus-cell focus-cell--target', format(t.focus.leaf, { row: row, column: column }));
            cell.setAttribute('data-focus-kind', 'leaf');
            cell.innerHTML = focusArt.leaf;
            cell.addEventListener('click', choose.bind(null, 'leaf', cell));
            buttons.push(cell);
          } else if (state.active && i < 9) {
            var kind = kinds[(i - 1 + state.round) % kinds.length];
            cell = gameButton('focus-cell focus-cell--obstacle', format(t.focus.obstacles[kind], { row: row, column: column }));
            cell.setAttribute('data-focus-kind', kind);
            cell.innerHTML = focusArt[kind];
            cell.addEventListener('click', choose.bind(null, kind, cell));
            buttons.push(cell);
          } else {
            cell = document.createElement('span');
            cell.className = 'focus-cell focus-cell--bed';
            cell.setAttribute('aria-hidden', 'true');
            cell.innerHTML = focusArt.bed;
          }
          cell.style.gridColumn = String(column);
          cell.style.gridRow = String(row);
          board.appendChild(cell);
        }
        stage.appendChild(board);
      }

      function finish() {
        state.active = false;
        state.locked = true;
        showCompletion(stage, 'focus', completionArt.focus, t.focus.completeTitle, t.focus.complete);
        progress.textContent = t.done;
        setFeedback(message, t.focus.complete, true);
        start.hidden = false;
        start.textContent = t.focus.again;
        focusElement(start);
      }

      function choose(kind, button) {
        if (!state.active || state.locked) return;
        if (kind !== 'leaf') {
          shake(button, state, 'is-shaking');
          setFeedback(message, t.focus.wrong, false);
          return;
        }
        state.locked = true;
        enable(buttons, false);
        button.classList.add('is-hit');
        addBurst(button, state, 'focus-burst');
        setFeedback(message, t.focus.feedback, true);
        later(state, function () {
          if (state.round >= 9) finish();
          else {
            state.round += 1;
            state.locked = false;
            render();
            focusElement(stage);
          }
        }, 800);
      }

      function resetGame() {
        invalidate(state);
        state.round = 0;
        state.active = false;
        state.locked = false;
        start.hidden = false;
        start.textContent = t.focus.start;
        render();
        setFeedback(message, t.focus.ready, false);
      }

      start.textContent = t.focus.start;
      resetButton.textContent = t.reset;
      start.addEventListener('click', function () {
        invalidate(state);
        state.round = 0;
        state.active = true;
        state.locked = false;
        start.hidden = true;
        setFeedback(message, t.focus.ready, false);
        render();
        focusElement(stage);
      });
      resetButton.addEventListener('click', resetGame);
      render();
      progress.textContent = '';
      setFeedback(message, t.focus.ready, false);
      return resetGame;
    }

    function initMemory(panel) {
      var stage = panel.querySelector('[data-memory-stage]');
      var progress = panel.querySelector('[data-memory-progress]');
      var message = panel.querySelector('[data-memory-message]');
      var start = panel.querySelector('[data-memory-start]');
      var replay = panel.querySelector('[data-memory-replay]');
      var resetButton = panel.querySelector('[data-memory-reset]');
      if (!stage || !progress || !message || !start || !replay || !resetButton) return;
      var positions = [
        { x: 12, y: 73 }, { x: 29, y: 44 }, { x: 47, y: 66 },
        { x: 64, y: 35 }, { x: 80, y: 58 }, { x: 89, y: 25 }
      ];
      var state = { round: 0, sequence: [], input: 0, active: false, locked: false, showing: false, epoch: 0, timers: [], buttons: [], path: null };
      stage.setAttribute('aria-label', t.memory.stage);
      stage.setAttribute('tabindex', '-1');

      function renderMap() {
        stage.textContent = '';
        state.buttons = [];
        state.path = null;
        var map = document.createElement('div');
        map.className = 'memory-path';
        map.innerHTML = memorySvg();
        state.path = map.querySelector('.memory-path__highlight');
        positions.forEach(function (position, index) {
          var button = gameButton('memory-node', format(t.memory.node, { number: index + 1 }));
          button.textContent = String(index + 1);
          button.setAttribute('data-tone', String(index));
          button.style.left = position.x + '%';
          button.style.top = position.y + '%';
          button.disabled = true;
          button.addEventListener('click', choose.bind(null, index, button));
          state.buttons.push(button);
          map.appendChild(button);
        });
        stage.appendChild(map);
      }

      function makeSequence(length) {
        var sequence = [];
        var previous = -1;
        for (var i = 0; i < length; i++) {
          var value = Math.floor(Math.random() * 6);
          if (value === previous) value = (value + 1 + Math.floor(Math.random() * 5)) % 6;
          sequence.push(value);
          previous = value;
        }
        return sequence;
      }

      function setNodes(value) {
        enable(state.buttons, value);
      }

      function enableInput() {
        state.showing = false;
        state.input = 0;
        state.buttons.forEach(function (button) { button.classList.remove('is-lit', 'is-wrong'); });
        if (state.path) {
          state.path.classList.remove('is-tracing');
          state.path.style.strokeDashoffset = '0';
        }
        setNodes(true);
        start.hidden = true;
        replay.hidden = false;
        setFeedback(message, t.memory.yourTurn, false);
        focusElement(state.buttons[0]);
      }

      function skipSequence() {
        invalidate(state);
        state.locked = false;
        enableInput();
      }

      function showSequence() {
        invalidate(state);
        state.active = true;
        state.showing = true;
        state.locked = false;
        state.input = 0;
        setNodes(false);
        start.hidden = false;
        start.textContent = t.memory.skip;
        replay.hidden = true;
        state.buttons.forEach(function (button) { button.classList.remove('is-lit', 'is-wrong'); });
        if (state.path) {
          state.path.classList.add('is-tracing');
          state.path.style.strokeDashoffset = '1';
        }
        var sequenceText = state.sequence.map(function (value) { return value + 1; }).join(' → ');
        setFeedback(message, format(t.memory.showing, { sequence: sequenceText }), false);
        state.sequence.forEach(function (value, index) {
          later(state, function () {
            state.buttons[value].classList.add('is-lit');
            if (state.path) state.path.style.strokeDashoffset = String(1 - ((index + 1) / state.sequence.length));
          }, 450 + index * 700);
          later(state, function () {
            state.buttons[value].classList.remove('is-lit');
          }, 900 + index * 700);
        });
        focusElement(stage);
        later(state, enableInput, 450 + state.sequence.length * 700);
      }

      function finish() {
        invalidate(state);
        state.active = false;
        state.showing = false;
        state.locked = true;
        state.input = 0;
        setNodes(false);
        replay.hidden = true;
        start.hidden = false;
        start.textContent = t.memory.again;
        progress.textContent = t.memory.done;
        setFeedback(message, t.memory.complete, true);
        showCompletion(stage, 'memory', completionArt.memory, t.memory.completeTitle, t.memory.complete);
        focusElement(start);
      }

      function choose(value, button) {
        if (!state.active || state.locked || button.disabled) return;
        if (value !== state.sequence[state.input]) {
          button.classList.add('is-wrong');
          setNodes(false);
          state.input = 0;
          state.buttons.forEach(function (node) { node.classList.remove('is-lit'); });
          setFeedback(message, t.memory.wrong, false);
          later(state, function () {
            button.classList.remove('is-wrong');
            setNodes(true);
            focusElement(state.buttons[0]);
          }, 500);
          return;
        }
        button.classList.add('is-lit');
        state.input += 1;
        if (state.input < state.sequence.length) return;
        state.locked = true;
        setNodes(false);
        setFeedback(message, t.memory.correct, true);
        if (state.round >= 5) {
          finish();
          return;
        }
        state.round += 1;
        state.sequence = makeSequence(state.round + 1);
        progress.textContent = format(t.memory.progress, { current: state.round });
        later(state, showSequence, 700);
      }

      function resetGame() {
        invalidate(state);
        state.round = 0;
        state.sequence = [];
        state.input = 0;
        state.active = false;
        state.showing = false;
        state.locked = false;
        start.hidden = false;
        start.textContent = t.memory.start;
        replay.hidden = true;
        renderMap();
        progress.textContent = '';
        setFeedback(message, t.memory.ready, false);
      }

      function begin() {
        if (state.showing) {
          skipSequence();
          return;
        }
        invalidate(state);
        state.round = 1;
        state.sequence = makeSequence(2);
        state.active = true;
        state.showing = false;
        state.locked = false;
        progress.textContent = format(t.memory.progress, { current: state.round });
        renderMap();
        showSequence();
      }

      start.textContent = t.memory.start;
      replay.textContent = t.memory.replay;
      resetButton.textContent = t.reset;
      start.addEventListener('click', begin);
      replay.addEventListener('click', showSequence);
      resetButton.addEventListener('click', resetGame);
      renderMap();
      progress.textContent = t.memory.ready;
      setFeedback(message, t.memory.ready, false);
      return resetGame;
    }

    var initializers = { emotion: initEmotion, thought: initThought, focus: initFocus, memory: initMemory };
    var gameResets = {};

    function titleForPanel(panel) {
      var titleId = panel.getAttribute('aria-labelledby');
      var titleNode = titleId ? document.getElementById(titleId) : null;
      return titleNode ? titleNode.textContent.trim() : '';
    }

    openButtons.forEach(function (button) {
      var type = button.getAttribute('data-game-open');
      var panel = document.getElementById(button.getAttribute('aria-controls'));
      if (!panel) return;
      var title = titleForPanel(panel);
      button.hidden = false;
      button.textContent = t.open;
      button.setAttribute('aria-label', format(t.openLabel, { title: title }));
      button.setAttribute('aria-expanded', 'false');
      button.addEventListener('click', function () {
        var opening = panel.hidden;
        if (opening) {
          openButtons.forEach(function (otherButton) {
            if (otherButton === button) return;
            var otherPanel = document.getElementById(otherButton.getAttribute('aria-controls'));
            if (!otherPanel || otherPanel.hidden) return;
            var otherType = otherButton.getAttribute('data-game-open');
            if (typeof gameResets[otherType] === 'function') gameResets[otherType]();
            otherPanel.hidden = true;
            otherButton.setAttribute('aria-expanded', 'false');
            otherButton.setAttribute('aria-label', format(t.openLabel, { title: titleForPanel(otherPanel) }));
            otherButton.textContent = t.open;
          });
        }
        if (opening && !panel.hasAttribute('data-ready')) {
          if (initializers[type]) gameResets[type] = initializers[type](panel);
          panel.setAttribute('data-ready', 'true');
        }
        if (!opening && typeof gameResets[type] === 'function') gameResets[type]();
        if (opening) focusedPanel = panel;
        else if (focusedPanel === panel) focusedPanel = null;
        panel.hidden = !opening;
        button.setAttribute('aria-expanded', String(opening));
        button.setAttribute('aria-label', format(opening ? t.closeLabel : t.openLabel, { title: title }));
        button.textContent = opening ? t.close : t.open;
        if (!opening) focusElement(button);
      });
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
    attachGames();

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
