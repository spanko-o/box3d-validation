'use strict';
const scenes = [...document.querySelectorAll('.scene')];
const allVideos = [...document.querySelectorAll('video')];
document.querySelector('#stacked').addEventListener('change', event => {
  document.body.classList.toggle('stacked', event.target.checked);
});
document.querySelector('#pause-all').addEventListener('click', () => allVideos.forEach(video => video.pause()));
document.querySelector('#speed').addEventListener('change', event => {
  allVideos.forEach(video => { video.playbackRate = Number(event.target.value); });
});

for (const scene of scenes) {
  const videos = [...scene.querySelectorAll('video')];
  const timeline = scene.querySelector('input[type="range"]');
  const output = scene.querySelector('output');
  const error = scene.querySelector('.error');
  const ready = video => video.readyState >= 1 ? Promise.resolve() : new Promise((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener('loadedmetadata', loaded);
      video.removeEventListener('error', failed);
    };
    const loaded = () => { cleanup(); resolve(); };
    const failed = () => { cleanup(); reject(new Error('视频加载失败，请刷新或下载查看。')); };
    video.addEventListener('loadedmetadata', loaded);
    video.addEventListener('error', failed);
    video.load();
  });
  const showFrame = frame => {
    timeline.value = frame;
    output.textContent = `帧 ${String(frame + 1).padStart(2, '0')} / 25`;
  };
  const pause = () => videos.forEach(video => video.pause());
  async function play(restart = false) {
    error.textContent = '';
    allVideos.filter(video => !videos.includes(video)).forEach(video => video.pause());
    try {
      pause();
      await Promise.all(videos.map(ready));
      const time = restart || videos[0].ended ? 0 : videos[0].currentTime;
      videos.forEach(video => { video.currentTime = time; });
      await Promise.all(videos.map(video => video.play()));
    } catch (err) {
      pause();
      error.textContent = '无法同步播放，请使用视频自带播放按钮或下载 MP4。';
    }
  }
  scene.querySelector('[data-action="play"]').addEventListener('click', () => play());
  scene.querySelector('[data-action="restart"]').addEventListener('click', () => play(true));
  scene.querySelector('[data-action="pause"]').addEventListener('click', pause);
  let seekVersion = 0;
  timeline.addEventListener('input', async () => {
    const version = ++seekVersion;
    const frame = Number(timeline.value);
    pause();
    showFrame(frame);
    try {
      await Promise.all(videos.map(ready));
      if (version !== seekVersion) return;
      videos.forEach(video => { video.currentTime = frame / 8; });
    } catch (err) { error.textContent = err.message; }
  });
  videos[0].addEventListener('timeupdate', () => {
    if (!videos[0].paused) showFrame(Math.min(24, Math.floor(videos[0].currentTime * 8)));
  });
  videos.forEach(video => video.addEventListener('error', () => {
    error.textContent = '视频加载失败，请刷新或下载查看。';
  }));
}
