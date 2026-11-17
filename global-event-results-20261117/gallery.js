const videos = [...document.querySelectorAll('video')];
const groups = [...document.querySelectorAll('.result-group')];
// Load metadata near the viewport; keep a long gallery inexpensive to open.
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      const video = entry.target;
      if (video.preload === 'none') { video.preload = 'metadata'; video.load(); }
      observer.unobserve(video);
    }
  }), {rootMargin:'300px'});
  videos.filter(v => v.dataset.kind === 'generated').forEach(v => observer.observe(v));
}
const members = group => [...group.querySelectorAll(':scope > .grid video')];
function refresh() {
  groups.forEach(group => {
    group.querySelector('.play-group').textContent = members(group).some(v => !v.paused) ? '暂停本组' : '播放本组';
  });
}
videos.forEach(video => {
  video.addEventListener('play', () => {
    const sync = video.closest('[data-sync]');
    videos.forEach(other => {
      if (other !== video && (!sync || other.closest('[data-sync]') !== sync)) other.pause();
    });
    refresh();
  });
  video.addEventListener('pause', refresh);
});
groups.forEach(group => {
  group.querySelector('.play-group').addEventListener('click', async () => {
    const selected = members(group);
    if (selected.some(v => !v.paused)) selected.forEach(v => v.pause());
    else {
      selected.forEach(v => { v.currentTime = 0; });
      await Promise.allSettled(selected.map(v => v.play()));
    }
    refresh();
  });
});
document.querySelectorAll('.mask-details').forEach(details => {
  details.addEventListener('toggle', () => {
    details.querySelectorAll('video').forEach(video => {
      if (!details.open) video.pause();
      else if (video.preload === 'none') { video.preload = 'metadata'; video.load(); }
    });
  });
});
