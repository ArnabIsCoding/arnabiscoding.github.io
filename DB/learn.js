// Toggle mobile menu
const menuToggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('.menu');

menuToggle.addEventListener('click', () => {
  menu.classList.toggle('show');
});

// Close mobile menu when clicking outside
window.addEventListener('click', (e) => {
  if (!e.target.closest('.menu-toggle') && !e.target.closest('.menu')) {
    menu.classList.remove('show');
  }
});
window.addEventListener('scroll', function() {
  const pageCounter = document.querySelector('.page-counter');
  const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
  const pageNumber = Math.round(scrollPosition / 1000) + 1;
  pageCounter.textContent = pageNumber;
});
function openNav() {
  document.getElementById("mySidebar").style.width = "250px";
  document.getElementById("main").style.marginLeft = "250px";
}

function closeNav() {
  document.getElementById("mySidebar").style.width = "0";
  document.getElementById("main").style.marginLeft= "0";
}

//link underline attempt
const headingElements = document.querySelectorAll('h1[id], h2[id], h3[id]');
  const links = document.querySelectorAll('a[href^="#"]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const targetElement = entry.target;
      const targetId = targetElement.id;
      const correspondingLink = document.querySelector(`a[href="#${targetId}"]`);

      if (entry.isIntersecting) {
        correspondingLink.classList.add('viewrn');
      } else {
        correspondingLink.classList.remove('viewrn');
      }
    });
  }, {
    rootMargin: '0px 0px -50% 0px',
  });

  headingElements.forEach((headingElement) => {
    observer.observe(headingElement);
  });
