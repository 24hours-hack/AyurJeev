document.addEventListener('DOMContentLoaded', function() {
    // Select elements
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    const serviceCards = document.querySelectorAll('.service-card');
    const statNumbers = document.querySelectorAll('.stat-number');

    // Mobile Navigation Toggle
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }

    // Animation for service cards (hover effect)
    serviceCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.15)';
            this.style.transform = 'translateY(-10px)'; // Add a slight lift
        });
        card.addEventListener('mouseleave', function() {
            this.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
            this.style.transform = 'translateY(0)'; // Reset position
        });
    });

    // Intersection Observer for stats animation
    const animateStats = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute('data-target'));
                let current = 0;
                const increment = target / 100; // Adjust for smoother animation

                const timer = setInterval(() => {
                    current += increment;
                    if (current < target) {
                        entry.target.textContent = Math.floor(current);
                    } else {
                        entry.target.textContent = target;
                        observer.unobserve(entry.target); // Stop observing once animated
                        clearInterval(timer);
                    }
                }, 20); // Speed of animation
            }
        });
    };

    const statsObserver = new IntersectionObserver(animateStats, {
        threshold: 0.5 // Trigger when 50% of the element is visible
    });

    statNumbers.forEach(stat => {
        statsObserver.observe(stat);
    });

    console.log('Main page loaded and scripts initialized.');
});
