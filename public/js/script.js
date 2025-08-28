// Wait for the DOM to load fully
<<<<<<< HEAD
document.addEventListener('DOMContentLoaded', function () {
=======
/**
 * Script for the Nafez landing page.
 *
 * This file handles a few responsibilities:
 *  1. Setting the current year in the footer.
 *  2. Handling subscription form submission via AJAX.
 *  3. Animating the hero section: shrinking the large Nafez logo when
 *     hovering over the hero area and rotating the audience word in the
 *     tagline.  These animations rely on the anime.js library, which
 *     should be loaded before this script (via CDN or local copy).
 */

document.addEventListener('DOMContentLoaded', function () {
  // 1. Update copyright year in the footer.
>>>>>>> c1089d0 (chore: last working landing build ready to push)
  const yearSpan = document.getElementById('year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

<<<<<<< HEAD
=======
  // 2. Handle the newsletter subscription form submission.
>>>>>>> c1089d0 (chore: last working landing build ready to push)
  const form = document.getElementById('subscribe-form');
  const messageElem = document.getElementById('message');

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      messageElem.textContent = '';
      const email = document.getElementById('email').value.trim();
      const name = document.getElementById('name').value.trim();
      const agreeCheckbox = document.getElementById('agree');
      if (!email) {
        messageElem.textContent = 'Please enter a valid email address.';
        return;
      }
      // Ensure user agreed to Terms and Privacy
      if (agreeCheckbox && !agreeCheckbox.checked) {
        messageElem.textContent = 'Please agree to the Terms and Privacy Policy to continue.';
        return;
      }
      try {
        const response = await fetch('/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name }),
        });
        const data = await response.json();
        if (response.ok) {
          messageElem.textContent = 'Thank you! We’ll notify you when we launch.';
          form.reset();
        } else {
          messageElem.textContent = data.error || 'There was an issue subscribing.';
        }
      } catch (err) {
        console.error(err);
        messageElem.textContent = 'Unable to connect to the server. Please try again later.';
      }
    });
  }
<<<<<<< HEAD
=======

  /*
    3. Animations: instead of relying on anime.js (which may not load
       locally in this environment), we implement simple interactions
       using CSS transitions and small bits of JavaScript.  The hero
       logo will shrink and move upward when the user hovers over the
       hero section, and the audience word in the tagline will cycle
       through a list of terms with a fade/translate effect.
  */
  const hero = document.querySelector('.hero');
  // Select the large logo inside the hero.  In the revised layout the
  // large logo lives inside a `.hero-logo` element rather than
  // `.nafez-logo-large`.  This query will return the image if it
  // exists; if not it will be undefined.  The logo is not used
  // programmatically anymore (the transformation is handled entirely
  // in CSS), but we keep this reference in case future logic needs
  // access to the element.
  const logoImg = document.querySelector('.hero-logo img');
  const audienceWord = document.getElementById('audienceWord');

  /*
    Hero activation:  When the user hovers over the hero section, we
    add the `.active` class to the hero and the `.shrink` class to the
    header.  This triggers CSS transitions that shrink the large logo,
    reveal the hero content and fade in the small nav logo.  When the
    pointer leaves, we remove these classes to reset the layout.
  */
  if (hero) {
    hero.addEventListener('mouseenter', () => {
      hero.classList.add('active');
    });
    hero.addEventListener('mouseleave', () => {
      hero.classList.remove('active');
    });
  }

  // Audience word rotation: cycle through an array of words every
  // couple of seconds.  We apply CSS classes to fade out, change
  // the text, then fade in.  The CSS transitions are defined in
  // styles.css.  If the environment does not support setInterval
  // (unlikely), this will simply leave the initial word intact.
  if (audienceWord) {
    const words = ['entrepreneurs', 'artists', 'techies', 'innovators', 'youth'];
    let currentIndex = 0;
    setInterval(() => {
      // Fade out the current word
      audienceWord.classList.remove('fade-in');
      audienceWord.classList.add('fade-out');
      setTimeout(() => {
        // Update the word after the fade-out completes
        currentIndex = (currentIndex + 1) % words.length;
        audienceWord.textContent = words[currentIndex];
        // Remove fade-out and trigger fade-in
        audienceWord.classList.remove('fade-out');
        audienceWord.classList.add('fade-in');
        // Remove fade-in class after animation completes to allow re-trigger
        setTimeout(() => {
          audienceWord.classList.remove('fade-in');
        }, 200);
      }, 200);
    }, 2500);
  }

  /*
    Modal functionality: each feature card has a data-modal-target
    attribute pointing to the id of the modal it should open.  When
    clicked, the corresponding modal appears over a semi‑transparent
    overlay.  The modal and overlay can be closed by clicking the
    close button or the overlay itself.  We use anime.js for
    graceful fades and translations if it is available; otherwise
    the classes alone control visibility.
  */
  const modalOverlay = document.getElementById('modalOverlay');
  const modalButtons = document.querySelectorAll('[data-modal-target]');
  const closeButtons = document.querySelectorAll('.close-modal');

  function openModal(modal) {
    if (!modal) return;
    modal.classList.add('active');
    modalOverlay.classList.add('active');
    // Animate the modal appearance if anime.js is loaded
    if (window.anime) {
      anime({
        targets: modal,
        opacity: [0, 1],
        translateY: [-30, 0],
        duration: 400,
        easing: 'easeOutQuad'
      });
    }
  }

  function closeModal(modal) {
    if (!modal) return;
    if (window.anime) {
      anime({
        targets: modal,
        opacity: [1, 0],
        translateY: [0, -30],
        duration: 400,
        easing: 'easeInQuad',
        complete: () => {
          modal.classList.remove('active');
        }
      });
    } else {
      modal.classList.remove('active');
    }
    modalOverlay.classList.remove('active');
  }

  // Open the appropriate modal when a feature card is clicked
  modalButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-modal-target');
      const modal = document.getElementById(targetId);
      openModal(modal);
    });
  });

  // Close button inside each modal
  closeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal');
      closeModal(modal);
    });
  });

  // Clicking outside the modal closes it
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        document.querySelectorAll('.modal.active').forEach((modal) => {
          modal.classList.remove('active');
        });
        modalOverlay.classList.remove('active');
      }
    });
  }

  /*
    Add a subtle animation to the feature cards on hover.  When the
    pointer enters a card, gently scale it up; when the pointer
    leaves, scale it back down.  This uses anime.js if available,
    otherwise falls back to CSS transitions defined in the stylesheet.
  */
  const featureCards = document.querySelectorAll('.feature');
  featureCards.forEach((card) => {
    card.addEventListener('mouseenter', () => {
      if (window.anime) {
        anime.remove(card);
        anime({
          targets: card,
          scale: 1.05,
          duration: 300,
          easing: 'easeOutQuad'
        });
      }
    });
    card.addEventListener('mouseleave', () => {
      if (window.anime) {
        anime.remove(card);
        anime({
          targets: card,
          scale: 1.0,
          duration: 300,
          easing: 'easeOutQuad'
        });
      }
    });
  });
>>>>>>> c1089d0 (chore: last working landing build ready to push)
});