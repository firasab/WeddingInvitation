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
  const bgMusic = document.getElementById('bgMusic');

  if (!cover || !openBtn || !app || !dock || !musicBtn) {
    console.error('Wedding invitation markup mismatch. Hard-refresh the page.');
    return;
  }

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  let musicPlaying = false;
  let audioUnlocked = false;
  let autoScrolling = false;
  let autoScrollRaf = 0;
  let opened = false;

  document.body.classList.add('is-locked');
  if (bgMusic) {
    bgMusic.volume = 0.7;
    bgMusic.setAttribute('playsinline', '');
    bgMusic.setAttribute('webkit-playsinline', '');
  }

  function musicSrc(autoplay, muted) {
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
      mute: muted ? '1' : '0',
      enablejsapi: '1',
      origin: window.location.origin || 'https://firasab.github.io',
    });
    return 'https://www.youtube.com/embed/' + YOUTUBE_VIDEO_ID + '?' + params.toString();
  }

  function setMusicPlaying(on) {
    musicPlaying = on;
    musicBtn.classList.toggle('playing', on);
  }

  // iOS: unlock audio on first touch (required by Safari)
  function unlockAudio() {
    if (audioUnlocked || !bgMusic) return;
    const p = bgMusic.play();
    if (p && typeof p.then === 'function') {
      p.then(() => {
        bgMusic.pause();
        bgMusic.currentTime = 0;
        audioUnlocked = true;
      }).catch(() => {});
    } else {
      try {
        bgMusic.pause();
        bgMusic.currentTime = 0;
        audioUnlocked = true;
      } catch (_) {}
    }
  }

  cover.addEventListener('touchstart', unlockAudio, { passive: true });
  cover.addEventListener('touchend', unlockAudio, { passive: true });
  openBtn.addEventListener('touchstart', unlockAudio, { passive: true });

  function playLocalAudio() {
    if (!bgMusic) return Promise.reject();
    bgMusic.muted = false;
    bgMusic.volume = 0.7;
    const p = bgMusic.play();
    if (p && typeof p.then === 'function') {
      return p.then(() => {
        setMusicPlaying(true);
        audioUnlocked = true;
      });
    }
    setMusicPlaying(true);
    return Promise.resolve();
  }

  function playYouTube() {
    if (!ytMusic) return;
    ytMusic.src = musicSrc(true, false);
    // Ask the embed to play/unmute (helps some WebKit builds)
    setTimeout(() => {
      try {
        ytMusic.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        ytMusic.contentWindow.postMessage('{"event":"command","func":"unMute","args":""}', '*');
        ytMusic.contentWindow.postMessage('{"event":"command","func":"setVolume","args":[70]}', '*');
      } catch (_) {}
    }, 400);
    setMusicPlaying(true);
  }

  // Must stay inside the user-gesture call stack for iPhone
  function playMusic() {
    if (isIOS) {
      // iPhone Safari blocks YouTube autoplay — use local audio
      playLocalAudio().catch(() => playYouTube());
      return;
    }
    // Android / desktop: YouTube works reliably
    playYouTube();
  }

  function pauseMusic() {
    if (bgMusic) {
      try { bgMusic.pause(); } catch (_) {}
    }
    if (ytMusic) ytMusic.src = '';
    setMusicPlaying(false);
  }

  function openInvitation(e) {
    if (opened) return;
    opened = true;
    if (e) e.preventDefault();

    // Unlock + play immediately in the same tap (critical for iPhone)
    unlockAudio();
    playMusic();

    cover.classList.add('is-gone');
    app.hidden = false;
    dock.hidden = false;
    document.body.classList.remove('is-locked');

    requestAnimationFrame(() => {
      setTimeout(startAutoScroll, 450);
    });
  }

  // Use both click and touchend for iOS Safari
  openBtn.addEventListener('click', openInvitation);
  openBtn.addEventListener('touchend', (e) => {
    // Avoid double-firing with the following click
    if (opened) return;
    openInvitation(e);
  }, { passive: false });

  musicBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (musicPlaying) pauseMusic();
    else playMusic();
  });

  if (bgMusic) {
    bgMusic.addEventListener('playing', () => setMusicPlaying(true));
    bgMusic.addEventListener('pause', () => {
      if (!ytMusic || !ytMusic.src) setMusicPlaying(false);
    });
  }

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
    window.addEventListener(evt, () => {
      if (opened) stopAutoScroll();
    }, { passive: true });
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
