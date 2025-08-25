'use strict';

// Nafez landing page script (resolved)
// - Handles year stamp
// - Subscribes via POST /subscribe
// - Basic validation + user feedback
// - Smooth scroll for in-page anchors

document.addEventListener('DOMContentLoaded', () => {
  // Year stamp
  const yearSpan = document.getElementById('year');
  if (yearSpan) {
    yearSpan.textContent = String(new Date().getFullYear());
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const targetId = a.getAttribute('href');
      if (targetId && targetId.startsWith('#')) {
        const el = document.querySelector(targetId);
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  // Subscribe form
  const form = document.getElementById('subscribe-form');
  const msg = document.getElementById('message');

  function setMessage(text, isError = false) {
    if (!msg) return;
    msg.textContent = text;
    // Use inline color for errors vs default success color set in CSS
    msg.style.color = isError ? '#ff6b6b' : '';
  }

  function isValidEmail(email) {
    // Simple, permissive check; server validates again
    return /.+@.+\..+/.test(email);
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameEl = /** @type {HTMLInputElement|null} */(document.getElementById('name'));
      const emailEl = /** @type {HTMLInputElement|null} */(document.getElementById('email'));
      const agreeEl = /** @type {HTMLInputElement|null} */(document.getElementById('agree'));
      const submitBtn = /** @type {HTMLButtonElement|null} */(form.querySelector('button[type="submit"]'));

      const name = (nameEl?.value || '').trim();
      const email = (emailEl?.value || '').trim().toLowerCase();

      if (agreeEl && !agreeEl.checked) {
        setMessage('Please accept the Terms of Use and Privacy Policy.', true);
        return;
      }
      if (!email || !isValidEmail(email)) {
        setMessage('Please enter a valid email address.', true);
        emailEl?.focus();
        return;
      }

      // Submit
      const originalBtnText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Please wait…';
      }
      setMessage('');

      try {
        const res = await fetch('/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name })
        });

        if (res.ok) {
          setMessage('Thanks! You\'re on the list.');
          if (nameEl) nameEl.value = '';
          if (emailEl) emailEl.value = '';
          if (agreeEl) agreeEl.checked = false;
        } else if (res.status === 409) {
          setMessage('You\'re already subscribed with that email.', true);
        } else if (res.status === 400) {
          setMessage('That email looks invalid. Please try again.', true);
        } else {
          setMessage('Something went wrong. Please try again shortly.', true);
        }
      } catch (err) {
        setMessage('Network error. Is the server running?', true);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText || 'Sign Me Up';
        }
      }
    });
  }
});
