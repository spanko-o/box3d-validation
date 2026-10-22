'use strict';
const videos = [...document.querySelectorAll('video')];
videos.forEach(video => video.addEventListener('play', () => {
  videos.forEach(other => { if (other !== video) other.pause(); });
}));
document.addEventListener('visibilitychange', () => {
  if (document.hidden) videos.forEach(video => video.pause());
});
const links = [...document.querySelectorAll('nav a')];
function markSection() {
  const id = location.hash || '#event-data';
  links.forEach(link => {
    if (link.getAttribute('href') === id) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
window.addEventListener('hashchange', markSection);
markSection();
