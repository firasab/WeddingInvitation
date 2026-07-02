(function () {
  'use strict';

  const WEDDING_DATE = new Date('2026-10-02T18:00:00');
  const YOUTUBE_VIDEO_ID = 'dvadmBbLkqE';

  let musicPlaying = false;
  let musicWanted = false;
  let ytPlayer = null;
  let ytReady = false;
  let dustRunning = false;

  const scene = document.getElementById('envelopeScene');
  const stage = document.getElementById('envelopeStage');
  const envelope3d = document.getElementById('envelope3d');
  const waxSeal = document.getElementById('waxSeal');
  const bloom = document.getElementById('openBloom');
  const mainContent = document.getElementById('mainContent');
  const musicBtn = document.getElementById('musicBtn');
  const dustCanvas = document.getElementById('dustCanvas');
  const groomFigure = document.getElementById('groomFigure');
  const brideFigure = document.getElementById('brideFigure');
  const coupleWalk = document.getElementById('coupleWalk');
  const heroSection = document.querySelector('.hero');

  requestAnimationFrame(() => stage.classList.add('ready'));

  // ===== YouTube background music =====
  function createYouTubePlayer() {
    if (ytPlayer) return;

    ytPlayer = new YT.Player('youtubePlayer', {
      videoId: YOUTUBE_VIDEO_ID,
      playerVars: {
        autoplay: 0,
        loop: 1,
        playlist: YOUTUBE_VIDEO_ID,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        origin: window.location.origin || window.location.href,
      },
      events: {
        onReady: (e) => {
          ytReady = true;
          e.target.setVolume(70);
          if (musicWanted) playMusic();
        },
        onStateChange: (e) => {
          if (e.data === YT.PlayerState.PLAYING) {
            musicPlaying = true;
            musicBtn.classList.add('playing');
          } else if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED) {
            musicPlaying = false;
            musicBtn.classList.remove('playing');
          }
        },
      },
    });
  }

  function initYouTube() {
    if (window.YT && window.YT.Player) {
      createYouTubePlayer();
      return;
    }

    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (typeof prevReady === 'function') prevReady();
      createYouTubePlayer();
    };

    if (!document.getElementById('yt-api-script')) {
      const tag = document.createElement('script');
      tag.id = 'yt-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  }

  let musicRetryCount = 0;
  const MUSIC_RETRY_MAX = 12;

  function playMusic() {
    musicWanted = true;

    if (!ytReady || !ytPlayer || typeof ytPlayer.playVideo !== 'function') {
      initYouTube();
      if (musicRetryCount < MUSIC_RETRY_MAX) {
        musicRetryCount += 1;
        setTimeout(playMusic, 400);
      }
      return;
    }

    try {
      ytPlayer.setVolume(70);
      if (typeof ytPlayer.unMute === 'function') ytPlayer.unMute();
      ytPlayer.playVideo();
      musicRetryCount = 0;
    } catch (err) {
      if (musicRetryCount < MUSIC_RETRY_MAX) {
        musicRetryCount += 1;
        setTimeout(playMusic, 400);
      }
    }
  }

  function pauseMusic() {
    musicWanted = false;
    if (!ytPlayer || typeof ytPlayer.pauseVideo !== 'function') return;
    ytPlayer.pauseVideo();
  }

  function startMusic() {
    playMusic();
  }

  function stopMusic() {
    pauseMusic();
  }

  musicBtn.addEventListener('click', () => {
    musicPlaying ? stopMusic() : startMusic();
  });

  initYouTube();

  // ===== Smooth couple walk animation =====
  function easeInOutSine(t) {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  }

  function isMobileLayout() {
    return window.innerWidth < 768;
  }

  function getHeroSpotPositions(anchoredMode) {
    const frame = document.querySelector('.hero-frame');
    const hero = heroSection;
    const mobile = isMobileLayout();
    const groomW = groomFigure.offsetWidth || (mobile ? 80 : 120);
    const brideW = brideFigure.offsetWidth || (mobile ? 80 : 120);
    const margin = mobile ? 0 : 6;
    const outsideGap = mobile ? 0 : 4;
    const useAnchored = anchoredMode ?? coupleWalk.classList.contains('anchored');

    if (!frame || !hero) {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      return {
        groomLeft: margin,
        brideLeft: vw - brideW - margin,
        bottomPx: mobile ? 12 : vh * 0.16,
      };
    }

    const frameRect = frame.getBoundingClientRect();

    if (useAnchored) {
      const heroRect = hero.getBoundingClientRect();
      return {
        groomLeft: Math.max(margin, frameRect.left - heroRect.left - groomW - outsideGap),
        brideLeft: Math.min(
          heroRect.width - brideW - margin,
          frameRect.right - heroRect.left + outsideGap
        ),
        bottomPx: mobile
          ? Math.max(8, heroRect.height - (frameRect.bottom - heroRect.top) - 8)
          : Math.max(32, heroRect.height - (frameRect.bottom - heroRect.top) + frameRect.height * 0.04),
      };
    }

    return {
      groomLeft: Math.max(margin, frameRect.left - groomW - outsideGap),
      brideLeft: Math.min(window.innerWidth - brideW - margin, frameRect.right + outsideGap),
      bottomPx: mobile
        ? Math.max(12, window.innerHeight - frameRect.bottom - 8)
        : Math.max(56, window.innerHeight - frameRect.bottom + frameRect.height * 0.05),
    };
  }

  function mountCoupleInHero() {
    if (!heroSection || coupleWalk.parentElement === heroSection) return;
    heroSection.insertBefore(coupleWalk, heroSection.firstChild);
  }

  function applyAnchoredSpots() {
    const spots = getHeroSpotPositions(true);
    groomFigure.style.setProperty('--spot-left', spots.groomLeft + 'px');
    groomFigure.style.setProperty('--spot-bottom', spots.bottomPx + 'px');
    brideFigure.style.setProperty('--spot-left', spots.brideLeft + 'px');
    brideFigure.style.setProperty('--spot-bottom', spots.bottomPx + 'px');
  }

  function animateCoupleWalk(onComplete) {
    const duration = 3200;
    const startTime = performance.now();
    coupleWalk.classList.add('uniting', 'couple-walking');

    brideFigure.style.right = 'auto';

    function getTargets() {
      const gap = 6;
      const center = window.innerWidth / 2;
      const groomW = groomFigure.offsetWidth;
      return {
        groomStart: groomFigure.offsetLeft,
        groomEnd: center - groomW - gap / 2,
        brideStart: brideFigure.offsetLeft,
        brideEnd: center + gap / 2,
      };
    }

    let targets = getTargets();

    function tick(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeInOutSine(t);

      const groomX = targets.groomStart + (targets.groomEnd - targets.groomStart) * eased;
      const brideX = targets.brideStart + (targets.brideEnd - targets.brideStart) * eased;
      const lift = Math.sin(eased * Math.PI) * 4;

      groomFigure.style.left = groomX + 'px';
      groomFigure.style.right = 'auto';
      groomFigure.style.transform = `translateY(${-lift}px)`;

      brideFigure.style.left = brideX + 'px';
      brideFigure.style.right = 'auto';
      brideFigure.style.transform = `translateY(${-lift}px)`;

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        coupleWalk.classList.remove('couple-walking');
        coupleWalk.classList.add('united');
        groomFigure.style.transform = 'translateY(-4px)';
        brideFigure.style.transform = 'translateY(-4px)';
        if (typeof onComplete === 'function') onComplete();
      }
    }

    requestAnimationFrame(tick);
  }

  function animateCoupleToSpots() {
    const duration = 1500;
    const startTime = performance.now();
    const spots = getHeroSpotPositions(false);
    const groomStartL = groomFigure.offsetLeft;
    const brideStartL = brideFigure.offsetLeft;
    const groomStartB = parseFloat(getComputedStyle(groomFigure).bottom) || 0;

    coupleWalk.classList.remove('united');
    coupleWalk.classList.add('anchoring');

    function tick(now) {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = easeInOutSine(t);

      groomFigure.style.left = groomStartL + (spots.groomLeft - groomStartL) * eased + 'px';
      brideFigure.style.left = brideStartL + (spots.brideLeft - brideStartL) * eased + 'px';
      groomFigure.style.bottom = groomStartB + (spots.bottomPx - groomStartB) * eased + 'px';
      brideFigure.style.bottom = groomStartB + (spots.bottomPx - groomStartB) * eased + 'px';
      groomFigure.style.right = 'auto';
      brideFigure.style.right = 'auto';
      groomFigure.style.transform = `translateY(${-4 * (1 - eased)}px)`;
      brideFigure.style.transform = `translateY(${-4 * (1 - eased)}px)`;

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        mountCoupleInHero();
        coupleWalk.classList.remove('uniting', 'anchoring');
        coupleWalk.classList.add('anchored');
        groomFigure.style.left = '';
        groomFigure.style.right = '';
        groomFigure.style.bottom = '';
        groomFigure.style.transform = '';
        brideFigure.style.left = '';
        brideFigure.style.right = '';
        brideFigure.style.bottom = '';
        brideFigure.style.transform = '';
        applyAnchoredSpots();
      }
    }

    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', () => {
    if (coupleWalk.classList.contains('anchored')) applyAnchoredSpots();
  });

  // ===== Cinematic open =====
  let opening = false;

  function openInvitation() {
    if (opening) return;
    opening = true;

    startMusic();
    waxSeal.classList.add('breaking');

    setTimeout(() => {
      scene.classList.add('envelope-opening');
      bloom.classList.add('active');
      envelope3d.classList.add('opening');
    }, 700);

    setTimeout(() => {
      scene.classList.add('couple-uniting');
      coupleWalk.classList.add('uniting');
      animateCoupleWalk(() => {
        setTimeout(() => {
          scene.classList.add('dismissed');
          mainContent.classList.add('visible');
          document.body.classList.add('opened');
          startDust();
          animateCoupleToSpots();
        }, 350);
      });
    }, 1500);
  }

  stage.addEventListener('click', openInvitation);
  waxSeal.addEventListener('click', (e) => { e.stopPropagation(); openInvitation(); });
  waxSeal.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openInvitation(); }
  });

  // Confetti removed — elegant envelope open only

  // ===== Floating rose dust & sparkles =====
  function startDust() {
    if (dustRunning) return;
    dustRunning = true;
    dustCanvas.classList.add('live');

    const ctx = dustCanvas.getContext('2d');
    const particles = [];
    let w, h;

    function resize() {
      w = dustCanvas.width = window.innerWidth;
      h = dustCanvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const dustColors = [
      [244, 196, 204],
      [212, 165, 116],
      [232, 201, 168],
      [255, 248, 245],
      [196, 176, 212],
    ];

    function spawn() {
      if (particles.length > 50) return;
      const c = dustColors[Math.floor(Math.random() * dustColors.length)];
      const isHeart = Math.random() > 0.85;
      particles.push({
        x: Math.random() * w,
        y: h + 5,
        r: isHeart ? 3 + Math.random() * 3 : 0.4 + Math.random() * 1.5,
        vy: 0.2 + Math.random() * 0.4,
        vx: (Math.random() - 0.5) * 0.25,
        alpha: 0.15 + Math.random() * 0.3,
        color: c,
        isHeart,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.03,
      });
    }

    for (let i = 0; i < 15; i++) {
      const c = dustColors[Math.floor(Math.random() * dustColors.length)];
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: 0.3 + Math.random() * 1,
        vy: 0.1 + Math.random() * 0.2,
        vx: (Math.random() - 0.5) * 0.15,
        alpha: 0.1 + Math.random() * 0.2,
        color: c,
        isHeart: false,
        rotation: 0,
        rotSpeed: 0,
      });
    }

    let frame = 0;

    function drawMiniHeart(x, y, size, rgba, rot) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.fillStyle = rgba;
      ctx.beginPath();
      const s = size;
      ctx.moveTo(0, s * 0.3);
      ctx.bezierCurveTo(0, -s * 0.5, -s, -s * 0.5, -s, s * 0.1);
      ctx.bezierCurveTo(-s, s * 0.8, 0, s * 1.2, 0, s * 1.5);
      ctx.bezierCurveTo(0, s * 1.2, s, s * 0.8, s, s * 0.1);
      ctx.bezierCurveTo(s, -s * 0.5, 0, -s * 0.5, 0, s * 0.3);
      ctx.fill();
      ctx.restore();
    }

    function loop() {
      if (!dustRunning) return;
      ctx.clearRect(0, 0, w, h);

      if (frame % 40 === 0) spawn();
      frame++;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.y -= p.vy;
        p.x += p.vx;
        p.alpha *= 0.9993;
        p.rotation += p.rotSpeed;

        if (p.y < -10 || p.alpha < 0.02) {
          particles.splice(i, 1);
          continue;
        }

        const [r, g, b] = p.color;
        const rgba = `rgba(${r}, ${g}, ${b}, ${p.alpha})`;

        if (p.isHeart) {
          drawMiniHeart(p.x, p.y, p.r, rgba, p.rotation);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = rgba;
          ctx.fill();
        }
      }

      requestAnimationFrame(loop);
    }
    loop();
  }

  // ===== Arabic numerals for countdown =====
  function toArabicNumerals(str) {
    return String(str).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
  }

  // ===== Countdown with pop animation =====
  const prevVals = { days: '', hours: '', minutes: '', seconds: '' };

  function updateCountdown() {
    const diff = WEDDING_DATE - Date.now();
    const ids = ['days', 'hours', 'minutes', 'seconds'];

    if (diff <= 0) {
      ids.forEach((id) => { document.getElementById(id).textContent = '٠٠'; });
      return;
    }

    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff / 3600000) % 24);
    const m = Math.floor((diff / 60000) % 60);
    const s = Math.floor((diff / 1000) % 60);

    const vals = {
      days: toArabicNumerals(String(d).padStart(2, '0')),
      hours: toArabicNumerals(String(h).padStart(2, '0')),
      minutes: toArabicNumerals(String(m).padStart(2, '0')),
      seconds: toArabicNumerals(String(s).padStart(2, '0')),
    };

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (vals[id] !== prevVals[id]) {
        el.textContent = vals[id];
        el.classList.remove('tick');
        void el.offsetWidth;
        el.classList.add('tick');
        prevVals[id] = vals[id];
      }
    });
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  // ===== Scroll reveal =====
  const revealObs = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('in-view'); }),
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('.reveal').forEach((el) => revealObs.observe(el));
})();
