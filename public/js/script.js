/**
 * Script for the Nafez landing page.
 *
 * Responsibilities:
 *  1) Set current year in footer(s).
 *  2) Handle subscription form submission via fetch.
 *  3) Interactions: hero shrink on hover, rotating audience word,
 *     feature modals and subtle hover animations.
 *
 * If anime.js is available (loaded globally), some animations are
 * enhanced. Otherwise, CSS transitions provide graceful fallbacks.
 */

document.addEventListener('DOMContentLoaded', function () {
  // 1) Footer year(s)
  const yearSpan = document.getElementById('year');
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();
  const yearInfoSpan = document.getElementById('year-info');
  if (yearInfoSpan) yearInfoSpan.textContent = new Date().getFullYear();

  // 2) Newsletter subscription form
  const form = document.getElementById('subscribe-form');
  const messageElem = document.getElementById('message');
  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (messageElem) messageElem.textContent = '';
      const email = (document.getElementById('email') || {}).value?.trim?.() || '';
      const name = (document.getElementById('name') || {}).value?.trim?.() || '';
      const agreeCheckbox = document.getElementById('agree');
      if (!email) {
        if (messageElem) messageElem.textContent = 'Please enter a valid email address.';
        return;
      }
      if (agreeCheckbox && !(agreeCheckbox).checked) {
        if (messageElem) messageElem.textContent = 'Please agree to the Terms and Privacy Policy to continue.';
        return;
      }
      try {
        const response = await fetch('/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name }),
        });
        const data = await response.json().catch(() => ({}));
        if (response.ok) {
          if (messageElem) messageElem.textContent = "Thank you! We'll notify you when we launch.";
          form.reset();
        } else {
          if (messageElem) messageElem.textContent = data.error || 'There was an issue subscribing.';
        }
      } catch (err) {
        console.error(err);
        if (messageElem) messageElem.textContent = 'Unable to connect to the server. Please try again later.';
      }
    });
  }

  // 3) Interactions & animations
  const hero = document.querySelector('.hero');
  const audienceWord = document.getElementById('audienceWord');

  // Keep hero shrunken while a modal is open
  let modalOpen = false;
  if (hero) {
    hero.addEventListener('mouseenter', () => { if (!modalOpen) hero.classList.add('active'); });
    hero.addEventListener('mouseleave', () => { if (!modalOpen) hero.classList.remove('active'); });
    // On touch/small screens, show the hero content by default
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch || window.innerWidth <= 900) {
      hero.classList.add('active');
      hero.addEventListener('touchstart', () => hero.classList.add('active'), { passive: true });
    }
  }

  if (audienceWord) {
    const words = ['entrepreneurs', 'artists', 'techies', 'innovators', 'youth'];
    let currentIndex = 0;
    setInterval(() => {
      audienceWord.classList.remove('fade-in');
      audienceWord.classList.add('fade-out');
      setTimeout(() => {
        currentIndex = (currentIndex + 1) % words.length;
        audienceWord.textContent = words[currentIndex];
        audienceWord.classList.remove('fade-out');
        audienceWord.classList.add('fade-in');
        setTimeout(() => audienceWord.classList.remove('fade-in'), 200);
      }, 200);
    }, 2500);
  }

  // Modals: open/close
  const modalOverlay = document.getElementById('modalOverlay');
  const modalButtons = document.querySelectorAll('[data-modal-target]');
  const closeButtons = document.querySelectorAll('.close-modal');
  let lastFocused = null;

  function openModal(modal) {
    if (!modal || !modalOverlay) return;
    modalOpen = true;
    modal.classList.add('active');
    modalOverlay.classList.add('active');
    modalOverlay.setAttribute('aria-hidden', 'false');
    if (hero) hero.classList.add('active');
    if (window.anime) {
      anime({ targets: modal, opacity: [0, 1], translateY: [-30, 0], duration: 400, easing: 'easeOutQuad' });
    }
    // Move focus into the modal for accessibility
    lastFocused = document.activeElement;
    const focusTarget = modal.querySelector('.close-modal') || modal;
    focusTarget.focus && focusTarget.focus();
  }

  function closeModal(modal) {
    if (!modal || !modalOverlay) return;
    if (window.anime) {
      anime({
        targets: modal,
        opacity: [1, 0],
        translateY: [0, -30],
        duration: 400,
        easing: 'easeInQuad',
        complete: () => modal.classList.remove('active'),
      });
    } else {
      modal.classList.remove('active');
    }
    modalOverlay.classList.remove('active');
    modalOverlay.setAttribute('aria-hidden', 'true');
    modalOpen = false;
    if (hero) {
      // Keep shrunken if pointer still hovers hero, else reset
      if (hero.matches(':hover')) {
        hero.classList.add('active');
      } else {
        hero.classList.remove('active');
      }
    }
    // Restore focus
    if (lastFocused && lastFocused.focus) {
      lastFocused.focus();
      lastFocused = null;
    }
  }

  modalButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-modal-target');
      const modal = document.getElementById(targetId);
      openModal(modal);
    });
  });
  closeButtons.forEach((btn) => {
    btn.addEventListener('click', () => closeModal(btn.closest('.modal')));
  });
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        document.querySelectorAll('.modal.active').forEach((m) => m.classList.remove('active'));
        modalOverlay.classList.remove('active');
        modalOverlay.setAttribute('aria-hidden', 'true');
      }
    });
    // ESC to close any open modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalOpen) {
        const open = document.querySelector('.modal.active');
        if (open) closeModal(open);
      }
    });
  }

  // Feature card hover (anime.js enhanced)
  const featureCards = document.querySelectorAll('.feature');
  featureCards.forEach((card) => {
    card.addEventListener('mouseenter', () => {
      if (window.anime) {
        anime.remove(card);
        anime({ targets: card, scale: 1.05, duration: 300, easing: 'easeOutQuad' });
      }
    });
    card.addEventListener('mouseleave', () => {
      if (window.anime) {
        anime.remove(card);
        anime({ targets: card, scale: 1.0, duration: 300, easing: 'easeOutQuad' });
      }
    });
    // Keyboard activation
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const targetId = card.getAttribute('data-modal-target');
        const modal = document.getElementById(targetId);
        openModal(modal);
      }
    });
  });
});
