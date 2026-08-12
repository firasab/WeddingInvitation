(function () {
  'use strict';

  const WEDDING_DATE = new Date('2026-10-02T18:00:00');
  const YOUTUBE_VIDEO_ID = 'dvadmBbLkqE';

  const cover = document.getElementById('cover');
  const openBtn = document.getElementById('openBtn');
  const app = document.getElementById('app');
  const dock = document.getElementById('dock');
  const musicBtn = document.getElementById('musicBtn');
  const saveDateBtn = document.getElementById('saveDateBtn');
  const ytMusic = document.getElementById('ytMusic');

  // Stop early if this page is the wrong/outdated HTML
  if (!cover || !openBtn || !app || !dock || !musicBtn || !ytMusic) {
    console.error('Wedding invitation markup mismatch. Hard-refresh the page (Ctrl+F5).');
    return;
  }

  let musicPlaying = false;
  let autoScrolling = false;
  let autoScrollRaf = 0;

  document.body.classList.add('is-locked');

  function musicSrc(autoplay) {
    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      loop: '1',
      playlist: YOUTUBE_VIDEO_ID,
      controls: '0',
      disablekb: '1',
      fs: '0',
      modestbranding: '1',
      rel: '0',
      playsinline: '1',
      mute: '0',
      enablejsapi: '1',
      origin: window.location.origin || 'https://firasab.github.io',
    });
    return 'https://www.youtube.com/embed/' + YOUTUBE_VIDEO_ID + '?' + params.toString();
  }

  function setMusicPlaying(on) {
    musicPlaying = on;
    musicBtn.classList.toggle('playing', on);
  }

  // Must run inside the same user tap so mobile browsers allow sound
  function playMusic() {
    ytMusic.src = musicSrc(true);
    setMusicPlaying(true);
  }

  function pauseMusic() {
    ytMusic.src = '';
    setMusicPlaying(false);
  }

  function openInvitation() {
    cover.classList.add('is-gone');
    app.hidden = false;
    dock.hidden = false;
    document.body.classList.remove('is-locked');
    playMusic();
    requestAnimationFrame(() => {
      setTimeout(startAutoScroll, 450);
    });
  }

  openBtn.addEventListener('click', openInvitation);

  musicBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (musicPlaying) pauseMusic();
    else playMusic();
  });

  // ===== Auto-scroll until user touches / scrolls =====
  function stopAutoScroll() {
    if (!autoScrolling && !autoScrollRaf) return;
    autoScrolling = false;
    if (autoScrollRaf) {
      cancelAnimationFrame(autoScrollRaf);
      autoScrollRaf = 0;
    }
  }

  function startAutoScroll() {
    stopAutoScroll();
    autoScrolling = true;
    const maxScroll = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const speed = Math.max(0.55, Math.min(1.1, window.innerHeight / 900));

    function step() {
      if (!autoScrolling) return;
      const top = window.scrollY || document.documentElement.scrollTop || 0;
      const end = maxScroll();
      if (top >= end - 1) {
        stopAutoScroll();
        return;
      }
      window.scrollBy(0, speed);
      autoScrollRaf = requestAnimationFrame(step);
    }

    autoScrollRaf = requestAnimationFrame(step);
  }

  ['wheel', 'touchstart', 'touchmove', 'pointerdown', 'mousedown', 'keydown'].forEach((evt) => {
    window.addEventListener(evt, stopAutoScroll, { passive: true });
  });
  dock.addEventListener('click', stopAutoScroll);

  // ===== Dock navigation =====
  dock.querySelectorAll('[data-go]').forEach((btn) => {
    btn.addEventListener('click', () => {
      stopAutoScroll();
      const el = document.getElementById(btn.dataset.go);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // ===== Save date =====
  if (saveDateBtn) {
    saveDateBtn.addEventListener('click', () => {
      const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        'DTSTART:20261002T150000Z',
        'DTEND:20261002T180000Z',
        'SUMMARY:زفاف فراس ووفاء',
        'LOCATION:قاعة القصر الملكي — العيزرية',
        'DESCRIPTION:دعوة زفاف فراس يونس أبوسنينة ووفاء رياض شويكي',
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n');
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'wedding-firas-wafaa.ics';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // ===== Countdown =====
  function ar(n) {
    return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
  }

  const prev = {};
  function tick() {
    const diff = WEDDING_DATE - Date.now();
    const ids = ['days', 'hours', 'minutes', 'seconds'];
    let vals;
    if (diff <= 0) {
      vals = { days: '٠٠', hours: '٠٠', minutes: '٠٠', seconds: '٠٠' };
    } else {
      vals = {
        days: ar(String(Math.floor(diff / 86400000)).padStart(2, '0')),
        hours: ar(String(Math.floor((diff / 3600000) % 24)).padStart(2, '0')),
        minutes: ar(String(Math.floor((diff / 60000) % 60)).padStart(2, '0')),
        seconds: ar(String(Math.floor((diff / 1000) % 60)).padStart(2, '0')),
      };
    }
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (prev[id] !== vals[id]) {
        el.textContent = vals[id];
        prev[id] = vals[id];
      }
    });
  }

  tick();
  setInterval(tick, 1000);
})();
