// Common functionality across all pages
document.addEventListener('DOMContentLoaded', () => {
    // Set current year in footer
    const currentYearElements = document.querySelectorAll('#current-year');
    if (currentYearElements.length > 0) {
        const year = new Date().getFullYear();
        currentYearElements.forEach(el => {
            el.textContent = year;
        });
    }
    
    // Mobile menu toggle (if needed)
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            const nav = document.querySelector('nav');
            nav.classList.toggle('active');
        });
    }
});