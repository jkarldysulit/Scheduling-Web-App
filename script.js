/* =========================================================================
   SLIME SCHEDULE — script.js
   Sections:
   1. Ambient background particles
   2. Cursor trail droplets
   3. Interactive blob mascot (squish + eye tracking + blink)
   4. Magnetic buttons
   5. Scroll reveal (staggered) + scroll progress bar
   6. Active nav indicator on scroll
   7. Scheduling engine (add / list / filter / done / delete)
   8. Reminder + notification engine
========================================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ======================================================================
     1. AMBIENT BACKGROUND PARTICLES
  ====================================================================== */
  (function ambientParticles() {
    const layer = document.getElementById('particles-bg');
    const COUNT = 22;

    for (let i = 0; i < COUNT; i++) spawnBit(true);

    function spawnBit(initial) {
      const bit = document.createElement('div');
      bit.className = 'jelly-bit';

      const size = 8 + Math.random() * 22;
      const left = Math.random() * 100;
      const duration = 14 + Math.random() * 16;
      const delay = initial ? Math.random() * duration * -1 : 0;
      const drift = (Math.random() * 140 - 70) + 'px';
      const wobbleDur = 2.4 + Math.random() * 2.4;

      bit.style.width = size + 'px';
      bit.style.height = size + 'px';
      bit.style.left = left + 'vw';
      bit.style.setProperty('--drift', drift);
      bit.style.animationDuration = `${duration}s, ${wobbleDur}s`;
      bit.style.animationDelay = `${delay}s, ${Math.random() * 2}s`;

      layer.appendChild(bit);
    }
  })();

  /* ======================================================================
     2. CURSOR TRAIL DROPLETS
  ====================================================================== */
  (function cursorTrail() {
    const layer = document.getElementById('cursor-trail-layer');
    let lastSpawn = 0;
    const THROTTLE_MS = 45;
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (isTouch) return;

    window.addEventListener('mousemove', (e) => {
      const now = performance.now();
      if (now - lastSpawn < THROTTLE_MS) return;
      lastSpawn = now;

      const drop = document.createElement('span');
      drop.className = 'trail-drop';
      const size = 5 + Math.random() * 7;
      drop.style.width = size + 'px';
      drop.style.height = size + 'px';
      drop.style.left = e.clientX + 'px';
      drop.style.top = e.clientY + 'px';
      layer.appendChild(drop);

      setTimeout(() => drop.remove(), 750);
    });
  })();

  /* ======================================================================
     3. INTERACTIVE BLOB MASCOT
  ====================================================================== */
  (function blobMascot() {
    const svg = document.getElementById('blobSvg');
    const path = document.getElementById('blobPath');
    const shine = document.getElementById('blobShine');
    const eyeLeft = document.getElementById('eyeLeft');
    const eyeRight = document.getElementById('eyeRight');
    const blushLeft = document.getElementById('blushLeft');
    const blushRight = document.getElementById('blushRight');
    const wrap = document.getElementById('blobWrap');
    if (!svg || !path) return;

    const CENTER = { x: 150, y: 150 };
    const BASE_RADIUS = 92;
    const POINTS = 10;

    // eye anchor positions relative to blob center (before squish offset)
    const eyeLeftBase = { x: -34, y: -6 };
    const eyeRightBase = { x: 34, y: -6 };
    eyeLeft.setAttribute('transform', `translate(${CENTER.x + eyeLeftBase.x}, ${CENTER.y + eyeLeftBase.y})`);
    eyeRight.setAttribute('transform', `translate(${CENTER.x + eyeRightBase.x}, ${CENTER.y + eyeRightBase.y})`);
    blushLeft.setAttribute('transform', `translate(${CENTER.x - 66}, ${CENTER.y + 26})`);
    blushRight.setAttribute('transform', `translate(${CENTER.x + 26}, ${CENTER.y + 26}) scale(-1,1) translate(-20,0)`);

    let mouse = { x: CENTER.x, y: CENTER.y, active: false };
    let prevMouse = { x: 0, y: 0 };
    let velocity = { x: 0, y: 0 };
    let time = 0;
    let hovering = false;
    let squishBoost = 0; // extra energy from clicks/pokes

    // track global mouse for eye follow; track local hover for squish energy
    window.addEventListener('mousemove', (e) => {
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      if (prevMouse.x !== 0 || prevMouse.y !== 0) {
        velocity.x = dx;
        velocity.y = dy;
      }
      prevMouse = { x: e.clientX, y: e.clientY };
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    wrap.addEventListener('mouseenter', () => { hovering = true; });
    wrap.addEventListener('mouseleave', () => { hovering = false; });
    wrap.addEventListener('mousedown', () => { squishBoost = 1.4; blink(true); });
    wrap.addEventListener('touchstart', () => { squishBoost = 1.4; blink(true); }, { passive: true });

    function generatePath(radiusOffsets) {
      const pts = [];
      for (let i = 0; i < POINTS; i++) {
        const angle = (Math.PI * 2 * i) / POINTS;
        const r = BASE_RADIUS + radiusOffsets[i];
        pts.push({
          x: CENTER.x + Math.cos(angle) * r,
          y: CENTER.y + Math.sin(angle) * r,
        });
      }
      // smooth catmull-rom-ish via simple quadratic between midpoints for a jelly feel
      let d = `M ${pts[0].x} ${pts[0].y} `;
      for (let i = 0; i < POINTS; i++) {
        const curr = pts[i];
        const next = pts[(i + 1) % POINTS];
        const midX = (curr.x + next.x) / 2;
        const midY = (curr.y + next.y) / 2;
        d += `Q ${curr.x} ${curr.y} ${midX} ${midY} `;
      }
      d += 'Z';
      return d;
    }

    function blink(force) {
      if (eyeLeft.classList.contains('blink-anim') && !force) return;
      eyeLeft.classList.add('blink-anim');
      eyeRight.classList.add('blink-anim');
      setTimeout(() => {
        eyeLeft.classList.remove('blink-anim');
        eyeRight.classList.remove('blink-anim');
      }, 220);
    }

    function scheduleBlink() {
      const next = 2400 + Math.random() * 3200;
      setTimeout(() => { blink(false); scheduleBlink(); }, next);
    }
    scheduleBlink();

    // rect cache for mapping cursor to local blob space
    function getRect() { return svg.getBoundingClientRect(); }

    function animate() {
      time += 0.02;
      const rect = getRect();
      const localCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };

      // idle breathing wobble
      const offsets = [];
      for (let i = 0; i < POINTS; i++) {
        const idle = Math.sin(time * 1.6 + i * 1.3) * 4;

        // squish stretch based on velocity direction, strongest on the axis aligned with motion
        const angle = (Math.PI * 2 * i) / POINTS;
        const dirX = Math.cos(angle);
        const dirY = Math.sin(angle);
        const velMag = Math.min(Math.hypot(velocity.x, velocity.y) * (hovering ? 0.9 : 0.25), 22);
        const velAngle = Math.atan2(velocity.y || 0.001, velocity.x || 0.001);
        const alignment = Math.cos(angle - velAngle);
        const squish = alignment * velMag * (0.6 + squishBoost);

        offsets.push(idle + squish);
      }

      path.setAttribute('d', generatePath(offsets));

      // decay
      velocity.x *= 0.86;
      velocity.y *= 0.86;
      squishBoost *= 0.9;

      // shine drifts subtly with squish direction
      const shineOffsetX = Math.max(-6, Math.min(6, velocity.x * 0.3));
      const shineOffsetY = Math.max(-6, Math.min(6, velocity.y * 0.3));
      shine.setAttribute('cx', 105 + shineOffsetX);
      shine.setAttribute('cy', 95 + shineOffsetY);

      // eyes look toward cursor, clamped to a small radius
      const toCursorX = mouse.x - localCenter.x;
      const toCursorY = mouse.y - localCenter.y;
      const dist = Math.hypot(toCursorX, toCursorY) || 1;
      const lookRadius = 6;
      const lookX = (toCursorX / dist) * Math.min(lookRadius, dist / 20);
      const lookY = (toCursorY / dist) * Math.min(lookRadius, dist / 20);

      eyeLeft.style.transform = `translate(${lookX}px, ${lookY}px)`;
      eyeRight.style.transform = `translate(${lookX}px, ${lookY}px)`;

      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  })();

  /* ======================================================================
     4. MAGNETIC BUTTONS
  ====================================================================== */
  (function magneticButtons() {
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (isTouch) return;

    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      const strength = 0.35;
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'translate(0, 0)';
      });
    });
  })();

  /* ======================================================================
     5. SCROLL REVEAL (staggered) + SCROLL PROGRESS BAR
  ====================================================================== */
  (function scrollReveal() {
    const groups = {};
    document.querySelectorAll('[data-reveal]').forEach((el) => {
      const parent = el.closest('section') || el.parentElement;
      const key = parent ? parent.id || 'default' : 'default';
      groups[key] = groups[key] || 0;
      el.style.setProperty('--reveal-i', groups[key]);
      groups[key]++;
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));
  })();

  (function scrollProgress() {
    const fill = document.getElementById('scrollFill');
    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const pct = height > 0 ? (scrollTop / height) * 100 : 0;
      fill.style.width = pct + '%';
    }, { passive: true });
  })();

  /* ======================================================================
     6. ACTIVE NAV INDICATOR
  ====================================================================== */
  (function activeNav() {
    const links = document.querySelectorAll('.nav__link[data-nav]');
    const indicator = document.getElementById('navIndicator');
    const navLinksWrap = document.getElementById('navLinks');
    const sections = Array.from(links).map((l) => document.querySelector(l.getAttribute('href')));

    function moveIndicator(link) {
      if (!link) return;
      const linkRect = link.getBoundingClientRect();
      const wrapRect = navLinksWrap.getBoundingClientRect();
      indicator.style.left = (linkRect.left - wrapRect.left) + 'px';
      indicator.style.width = linkRect.width + 'px';
    }

    function setActive(link) {
      links.forEach((l) => l.classList.remove('is-active'));
      link.classList.add('is-active');
      moveIndicator(link);
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = sections.indexOf(entry.target);
          if (idx !== -1) setActive(links[idx]);
        }
      });
    }, { threshold: 0.4 });

    sections.forEach((s) => s && observer.observe(s));

    window.addEventListener('resize', () => {
      const active = document.querySelector('.nav__link.is-active');
      moveIndicator(active);
    });

    // initial placement
    setTimeout(() => moveIndicator(links[0]), 150);
  })();

  /* ======================================================================
     7 + 8. SCHEDULING ENGINE + REMINDERS
  ====================================================================== */
  (function scheduleApp() {
    const STORAGE_KEY = 'slimeSchedule.tasks.v1';
    const form = document.getElementById('questForm');
    const list = document.getElementById('questList');
    const emptyState = document.getElementById('emptyState');
    const filterBtns = document.querySelectorAll('.filter-pill');
    const notifBtn = document.getElementById('notifBtn');
    const notifBtnLabel = document.getElementById('notifBtnLabel');
    const toastLayer = document.getElementById('toastLayer');
    const statTotal = document.querySelector('[data-stat="total"]');
    const statDone = document.querySelector('[data-stat="done"]');
    const nextCountdownEl = document.getElementById('nextCountdown');
    const nextCountdownLabel = document.getElementById('nextCountdownLabel');

    // default date/time fields to "now-ish"
    const dateInput = document.getElementById('taskDate');
    const timeInput = document.getElementById('taskTime');
    const now = new Date();
    dateInput.value = now.toISOString().slice(0, 10);
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
    timeInput.value = inOneHour.toTimeString().slice(0, 5);

    let currentFilter = 'all';

    function loadTasks() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (err) {
        console.error('Could not read saved quests:', err);
        return [];
      }
    }

    function saveTasks(tasks) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      } catch (err) {
        console.error('Could not save quests:', err);
      }
    }

    let tasks = loadTasks();

    function rankLabel(rank) {
      return { goblin: 'Goblin', ogre: 'Ogre', catastrophe: 'Catastrophe' }[rank] || 'Goblin';
    }

    function formatDateTime(dt) {
      const opts = { weekday: 'short', month: 'short', day: 'numeric' };
      const dateStr = dt.toLocaleDateString(undefined, opts);
      const timeStr = dt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
      return `${dateStr} · ${timeStr}`;
    }

    function render() {
      const nowTs = Date.now();
      let visible = tasks.slice().sort((a, b) => a.timestamp - b.timestamp);

      if (currentFilter === 'today') {
        const todayStr = new Date().toDateString();
        visible = visible.filter((t) => new Date(t.timestamp).toDateString() === todayStr && !t.done);
      } else if (currentFilter === 'upcoming') {
        visible = visible.filter((t) => t.timestamp > nowTs && !t.done);
      } else if (currentFilter === 'done') {
        visible = visible.filter((t) => t.done);
      }

      list.innerHTML = '';

      if (visible.length === 0) {
        emptyState.hidden = false;
      } else {
        emptyState.hidden = true;
        visible.forEach((task, i) => {
          const li = document.createElement('li');
          li.className = `quest-card rank-${task.rank}` + (task.done ? ' is-done' : '');
          if (!task.done && task.timestamp <= nowTs && task.timestamp > nowTs - 60000) {
            li.classList.add('is-due');
          }
          li.style.animationDelay = `${Math.min(i, 8) * 60}ms`;
          li.dataset.id = task.id;

          const dt = new Date(task.timestamp);

          li.innerHTML = `
            <div class="quest-card__top">
              <span class="quest-card__title">${escapeHtml(task.title)}</span>
              <span class="quest-card__rank quest-card__rank--${task.rank}">${rankLabel(task.rank)}</span>
            </div>
            <div class="quest-card__meta">
              <span>${formatDateTime(dt)}</span>
            </div>
            ${task.notes ? `<p class="quest-card__notes">${escapeHtml(task.notes)}</p>` : ''}
            <div class="quest-card__actions">
              <button type="button" class="icon-btn icon-btn--done ${task.done ? 'is-active' : ''}" data-action="done">
                ${task.done ? 'Cleared' : 'Mark cleared'}
              </button>
              <button type="button" class="icon-btn icon-btn--delete" data-action="delete">Dismiss</button>
            </div>
          `;

          list.appendChild(li);
        });
      }

      // stats
      statTotal.textContent = tasks.filter((t) => !t.done).length;
      statDone.textContent = tasks.filter((t) => t.done).length;

      updateNextCountdownTarget();
    }

    function escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    function addTask(task) {
      tasks.push(task);
      saveTasks(tasks);
      render();
    }

    function removeTaskAnimated(id) {
      const card = list.querySelector(`[data-id="${id}"]`);
      if (card) {
        card.classList.add('is-leaving');
        setTimeout(() => {
          tasks = tasks.filter((t) => t.id !== id);
          saveTasks(tasks);
          render();
        }, 320);
      } else {
        tasks = tasks.filter((t) => t.id !== id);
        saveTasks(tasks);
        render();
      }
    }

    function toggleDone(id) {
      const task = tasks.find((t) => t.id === id);
      if (task) {
        task.done = !task.done;
        saveTasks(tasks);
        render();
        if (task.done) showToast('Quest cleared', `"${task.title}" is done. Nicely handled.`);
      }
    }

    list.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const card = btn.closest('.quest-card');
      const id = card.dataset.id;
      if (btn.dataset.action === 'done') toggleDone(id);
      if (btn.dataset.action === 'delete') removeTaskAnimated(id);
    });

    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterBtns.forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        currentFilter = btn.dataset.filter;
        render();
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('taskTitle').value.trim();
      const date = document.getElementById('taskDate').value;
      const time = document.getElementById('taskTime').value;
      const notes = document.getElementById('taskNotes').value.trim();
      const rank = form.querySelector('input[name="rank"]:checked').value;

      if (!title || !date || !time) return;

      const timestamp = new Date(`${date}T${time}`).getTime();

      addTask({
        id: 'q_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        title,
        notes,
        rank,
        timestamp,
        done: false,
        notified: false,
      });

      showToast('Quest summoned', `"${title}" was added to your log.`);
      form.reset();
      document.getElementById('taskDate').value = new Date().toISOString().slice(0, 10);
      form.querySelector('input[value="goblin"]').checked = true;
    });

    /* ---- Countdown to next upcoming quest ---- */
    let nextTargetTs = null;

    function updateNextCountdownTarget() {
      const upcoming = tasks
        .filter((t) => !t.done && t.timestamp > Date.now())
        .sort((a, b) => a.timestamp - b.timestamp)[0];
      nextTargetTs = upcoming ? upcoming.timestamp : null;
      nextCountdownLabel.textContent = upcoming ? upcoming.title : 'No quest queued';
    }

    function tickCountdown() {
      if (!nextTargetTs) {
        nextCountdownEl.textContent = '--:--:--';
      } else {
        const diff = Math.max(0, nextTargetTs - Date.now());
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        nextCountdownEl.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
      }
      requestAnimationFrame(() => setTimeout(tickCountdown, 1000));
    }
    function pad(n) { return String(n).padStart(2, '0'); }
    tickCountdown();

    /* ---- Toasts ---- */
    function showToast(title, body) {
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.innerHTML = `
        <span class="toast__blob" aria-hidden="true"></span>
        <span>
          <span class="toast__title">${escapeHtml(title)}</span>
          <span class="toast__body">${escapeHtml(body)}</span>
        </span>
      `;
      toastLayer.appendChild(toast);
      setTimeout(() => {
        toast.classList.add('is-leaving');
        setTimeout(() => toast.remove(), 350);
      }, 5000);
    }

    /* ---- Notification permission ---- */
    function refreshNotifBtn() {
      if (!('Notification' in window)) {
        notifBtnLabel.textContent = 'Alerts unsupported';
        notifBtn.disabled = true;
        return;
      }
      if (Notification.permission === 'granted') {
        notifBtnLabel.textContent = 'Alerts on';
        notifBtn.classList.add('is-on');
      } else {
        notifBtnLabel.textContent = 'Enable Alerts';
        notifBtn.classList.remove('is-on');
      }
    }
    refreshNotifBtn();

    notifBtn.addEventListener('click', async () => {
      if (!('Notification' in window)) return;
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
        refreshNotifBtn();
        showToast('Alerts ready', 'I will ping you the moment a quest is due.');
      } else if (Notification.permission === 'granted') {
        showToast('Already watching', 'Alerts are already switched on.');
      } else {
        showToast('Alerts blocked', 'Notifications are blocked in your browser settings.');
      }
    });

    /* ---- Gentle beep for due reminders (WebAudio, no asset files needed) ---- */
    function playChime() {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [660, 880];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.value = 0.0001;
          osc.connect(gain).connect(ctx.destination);
          const start = ctx.currentTime + i * 0.14;
          gain.gain.exponentialRampToValueAt = gain.gain.exponentialRampToValueAt || function(){};
          gain.gain.setValueAtTime(0.0001, start);
          gain.gain.exponentialRampToValueAtTime(0.12, start + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
          osc.start(start);
          osc.stop(start + 0.55);
        });
      } catch (err) {
        // audio not available, silently skip
      }
    }

    /* ---- Reminder loop: checks every second for due tasks ---- */
    setInterval(() => {
      const nowTs = Date.now();
      let changed = false;

      tasks.forEach((task) => {
        if (!task.done && !task.notified && task.timestamp <= nowTs) {
          task.notified = true;
          changed = true;

          showToast('Quest is due now', task.title);
          playChime();

          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification('Slime Schedule: quest due', {
                body: task.title,
                tag: task.id,
              });
            } catch (err) { /* ignore */ }
          }
        }
      });

      if (changed) {
        saveTasks(tasks);
        render();
      }
    }, 1000);

    render();
  })();

});
