const videos = [...document.querySelectorAll('video')];
const groups = [...document.querySelectorAll('.result-group')];
function refresh() {
  groups.forEach(group => {
    const active = [...group.querySelectorAll('.grid video')].some(v => !v.paused);
    group.querySelector('.play-group').textContent = active ? '暂停本组' : '播放本组';
  });
}
videos.forEach(video => {
  video.addEventListener('play', () => {
    const group = video.closest('.grid');
    videos.forEach(other => {
      if (other !== video && (!group || other.closest('.grid') !== group)) other.pause();
    });
    refresh();
  });
  video.addEventListener('pause', refresh);
});
groups.forEach(group => {
  const members = [...group.querySelectorAll('.grid video')];
  group.querySelector('.play-group').addEventListener('click', async () => {
    if (members.some(v => !v.paused)) {
      members.forEach(v => v.pause());
    } else {
      members.forEach(v => { v.currentTime = 0; });
      await Promise.allSettled(members.map(v => v.play()));
    }
    refresh();
  });
});
document.querySelectorAll('details.comparison').forEach(item => {
  item.addEventListener('toggle', () => {
    if (!item.open) item.querySelectorAll('video').forEach(v => v.pause());
  });
});
