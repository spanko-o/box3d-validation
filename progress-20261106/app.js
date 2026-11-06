'use strict';
const allVideos = [...document.querySelectorAll('video')];
let activeGroup = null;
let syncFrame = null;
function stopAll() {
  if (syncFrame !== null) cancelAnimationFrame(syncFrame);
  syncFrame = null;
  activeGroup = null;
  allVideos.forEach(video => video.pause());
}
allVideos.forEach(video => video.addEventListener('play', () => {
  const group = video.closest('[data-group]')?.dataset.group;
  if (activeGroup && activeGroup === group) return;
  if (syncFrame !== null) cancelAnimationFrame(syncFrame);
  syncFrame = null;
  activeGroup = null;
  allVideos.forEach(other => { if (other !== video) other.pause(); });
}));
document.querySelectorAll('[data-play]').forEach(button => {
  button.addEventListener('click', async () => {
    stopAll();
    const group = button.dataset.play;
    const videos = [...document.querySelector(`[data-group="${group}"]`).querySelectorAll('video')];
    activeGroup = group;
    const limit = Number(button.dataset.duration) || Infinity;
    const ready = video => new Promise((resolve, reject) => {
      if (video.readyState >= 2) return resolve();
      video.addEventListener('loadeddata', resolve, { once: true });
      video.addEventListener('error', reject, { once: true });
      video.load();
    });
    try {
      await Promise.all(videos.map(ready));
      if (activeGroup !== group) return;
      videos.forEach(video => { video.currentTime = 0; video.muted = true; });
      await Promise.all(videos.map(video => video.play()));
      const sync = () => {
        if (activeGroup !== group) return;
        const masterTime = videos[0].currentTime;
        if (masterTime >= limit - 0.03 || videos.some(video => video.ended)) {
          stopAll();
          return;
        }
        videos.slice(1).forEach(video => {
          if (Math.abs(video.currentTime - masterTime) > 0.16) video.currentTime = masterTime;
        });
        syncFrame = requestAnimationFrame(sync);
      };
      sync();
    } catch (error) {
      stopAll();
      button.textContent = '加载失败，请单独播放视频';
    }
  });
});
document.querySelectorAll('[data-pause]').forEach(button => button.addEventListener('click', stopAll));
document.addEventListener('visibilitychange', () => { if (document.hidden) stopAll(); });
