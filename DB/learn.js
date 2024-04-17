function getScrollPosition() {
  return window.scrollY || document.documentElement.scrollTop;
}

window.addEventListener('scroll', function() {
  const pageCounter = document.querySelector('.page-counter');
  const scrollPosition = getScrollPosition();
  const pageNumber = Math.round(scrollPosition / 1000) + 1;
  pageCounter.textContent = pageNumber;
  console.log(pageNumber);
});

function openNav() {
  document.getElementById("mySidebar").style.width = "250px";
}

function closeNav() {
  document.getElementById("mySidebar").style.width = "0";
}

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

// Get all images with the class "lazy"
const lazyImages = document.querySelectorAll('img.lazy');

// Function to lazy load images
function lazyLoad() {
  lazyImages.forEach(img => {
    // Check if the image is in the viewport
    if (img.getBoundingClientRect().top < window.innerHeight && img.getBoundingClientRect().bottom >= 0) {
      // Load the image
      img.src = img.dataset.src;
      // Remove the "lazy" class so it doesn't get processed again
      img.classList.remove('lazy');
      // Unbind the event listener after loading the image
      img.removeEventListener('load', lazyLoad);
    }
  });
}

// Add the event listeners
window.addEventListener('scroll', lazyLoad);
window.addEventListener('resize', lazyLoad);
window.addEventListener('orientationChange', lazyLoad);

// Call the lazyLoad function initially
lazyLoad();