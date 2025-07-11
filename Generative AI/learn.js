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
