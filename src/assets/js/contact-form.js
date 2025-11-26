// Contact Form Handler
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');

  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Clear previous status
    formStatus.innerHTML = '';
    formStatus.className = 'form-status';

    // Get form data
    const formData = new FormData(form);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message'),
      consent: formData.get('consent') === 'on'
    };

    // Basic validation
    if (!data.name || !data.email || !data.subject || !data.message) {
      showStatus('Please fill in all required fields.', 'error');
      return;
    }

    if (!data.consent) {
      showStatus('Please consent to data processing.', 'error');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      showStatus('Please enter a valid email address.', 'error');
      return;
    }

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>⏳</span> Sending...';
    submitBtn.disabled = true;

    try {
      // In a real implementation, you'd send this to a backend service
      // For now, we'll simulate a successful submission
      await simulateFormSubmission(data);

      showStatus('✅ Thank you for your message! I\'ll get back to you within 24-48 hours.', 'success');
      form.reset();

    } catch (error) {
      console.error('Form submission error:', error);
      showStatus('❌ Oops! Something went wrong. Please try again or contact me directly via email.', 'error');
    } finally {
      // Restore button
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  });

  function showStatus(message, type) {
    formStatus.innerHTML = message;
    formStatus.className = `form-status ${type}`;

    // Auto-hide success messages after 10 seconds
    if (type === 'success') {
      setTimeout(() => {
        formStatus.innerHTML = '';
        formStatus.className = 'form-status';
      }, 10000);
    }
  }

  // Simulate form submission (replace with actual backend integration)
  function simulateFormSubmission(data) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate 90% success rate
        if (Math.random() > 0.1) {
          resolve();
        } else {
          reject(new Error('Simulated network error'));
        }
      }, 1500);
    });
  }
});