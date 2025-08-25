// Wait for the DOM to load fully
document.addEventListener('DOMContentLoaded', function () {
  const yearSpan = document.getElementById('year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  const form = document.getElementById('subscribe-form');
  const messageElem = document.getElementById('message');

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      messageElem.textContent = '';
      const email = document.getElementById('email').value.trim();
      const name = document.getElementById('name').value.trim();
      if (!email) {
        messageElem.textContent = 'Please enter a valid email address.';
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
});