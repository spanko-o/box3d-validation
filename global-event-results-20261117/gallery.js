const rgbVideos = [...document.querySelectorAll('video[data-kind="generated"]')];
const allVideos = [...document.querySelectorAll('video')];
const groups = [...document.querySelectorAll('.result-group')];
const pairs = [];
const members = group => [...group.querySelectorAll('video[data-kind="generated"]')];

function refresh() {
  groups.forEach(group => {
    group.querySelector('.play-group').textContent = members(group).some(v => !v.paused) ? '暂停本组' : '播放本组';
  });
}

// Only RGB metadata loads near the viewport. Mask files have no src until opened.
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const video = entry.target;
    if (video.preload === 'none') { video.preload = 'metadata'; video.load(); }
    observer.unobserve(video);
  }), { rootMargin: '300px' });
  rgbVideos.forEach(video => observer.observe(video));
}

allVideos.forEach(video => {
  video.addEventListener('play', () => {
    if (video.paused) return;
    const group = video.closest('.result-group');
    allVideos.forEach(other => {
      if (other.closest('.result-group') !== group) other.pause();
    });
    refresh();
  });
  video.addEventListener('pause', refresh);
});

document.querySelectorAll('.card').forEach(card => {
  const rgb = card.querySelector('video[data-kind="generated"]');
  const mask = card.querySelector('video[data-kind="mask"]');
  const details = card.querySelector('.mask-details');
  if (!mask) return;
  const pair = { rgb, mask, details, loadPromise: null, seeking: new WeakMap() };
  pairs.push(pair);

  function seek(video, time, tolerance = .025) {
    if (video.readyState < 1 || !Number.isFinite(time)) return;
    if (Math.abs(video.currentTime - time) <= tolerance) return;
    pair.seeking.set(video, time);
    video.currentTime = time;
  }

  function followRGB(force = false) {
    if (!details.open || mask.readyState < 1) return;
    if (mask.playbackRate !== rgb.playbackRate) mask.playbackRate = rgb.playbackRate;
    // Seeking is also used to recover at loop boundaries and after buffering.
    if (force || (!rgb.seeking && !mask.seeking)) seek(mask, rgb.currentTime, force ? .025 : .12);
    if (rgb.paused) mask.pause();
    else if (mask.paused) mask.play().catch(() => {});
  }
  pair.followRGB = followRGB;

  function loadMask() {
    if (pair.loadPromise) return pair.loadPromise;
    pair.loadPromise = new Promise((resolve, reject) => {
      mask.addEventListener('loadedmetadata', resolve, { once: true });
      mask.addEventListener('error', reject, { once: true });
      mask.poster = mask.dataset.poster;
      mask.querySelector('source').src = mask.querySelector('source').dataset.src;
      mask.preload = 'auto';
      mask.load();
    });
    return pair.loadPromise;
  }

  details.addEventListener('toggle', () => {
    if (!details.open) { mask.pause(); return; }
    loadMask().then(() => followRGB(true)).catch(() => {
      card.querySelector('.mask-status').textContent = 'Mask 暂时无法加载，请刷新页面重试。';
    });
  });
  rgb.addEventListener('loadedmetadata', () => followRGB(true));
  mask.addEventListener('loadeddata', () => followRGB(true));

  [rgb, mask].forEach(video => {
    const other = video === rgb ? mask : rgb;
    video.addEventListener('play', () => {
      if (!details.open || video.paused) return;
      if (video === rgb) followRGB(true);
      else if (rgb.paused) rgb.play().catch(() => {});
    });
    video.addEventListener('pause', () => {
      if (!details.open || !video.paused) return;
      other.pause();
      if (video === rgb) followRGB(true);
    });
    video.addEventListener('seeking', () => {
      if (!details.open) return;
      const expected = pair.seeking.get(video);
      if (expected !== undefined && Math.abs(video.currentTime - expected) < .05) return;
      pair.seeking.delete(video);
      seek(other, video.currentTime);
    });
    video.addEventListener('seeked', () => pair.seeking.delete(video));
    video.addEventListener('ratechange', () => {
      if (details.open && other.playbackRate !== video.playbackRate) other.playbackRate = video.playbackRate;
    });
  });
});

// Keep open comparisons within one video frame; closed comparisons stay paused.
setInterval(() => pairs.forEach(pair => {
  if (pair.details.open && !pair.rgb.paused) pair.followRGB();
}), 100);

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
