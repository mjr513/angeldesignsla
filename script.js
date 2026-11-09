/* Angel Designs LA: portfolio filters, navigation, and media fallbacks. */
(() => {
  'use strict';

  function init() {
    const year = document.querySelector('#year');
    if (year) year.textContent = new Date().getFullYear();

    function setupFilters(sectionSelector, buttonSelector, cardSelector, filterKey, categoryKey) {
      const section = document.querySelector(sectionSelector);
      if (!section) return;
      const buttons = [...section.querySelectorAll(buttonSelector)];
      const cards = [...section.querySelectorAll(cardSelector)];
      if (!buttons.length) return;

      const status = document.createElement('p');
      status.className = 'filter-status';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      buttons[0].parentElement.insertAdjacentElement('afterend', status);

      function applyFilter(button) {
        const selected = button.dataset[filterKey] || 'all';
        buttons.forEach((item) => {
          const active = item === button;
          item.classList.toggle('active', active);
          item.setAttribute('aria-pressed', String(active));
        });
        let visible = 0;
        cards.forEach((card) => {
          const categories = (card.dataset[categoryKey] || '').trim().split(/\s+/);
          card.hidden = selected !== 'all' && !categories.includes(selected);
          if (!card.hidden) visible += 1;
        });
        status.textContent = visible
          ? `${visible} ${visible === 1 ? 'project' : 'projects'} shown`
          : 'No projects in this category yet.';
        window.instgrm?.Embeds?.process?.();
      }

      buttons.forEach((button) => {
        button.type = 'button';
        button.addEventListener('click', () => applyFilter(button));
      });
      applyFilter(buttons.find((button) => button.classList.contains('active')) || buttons[0]);
    }

    setupFilters('#work', '.filter-btn', '.work-card', 'filter', 'category');
    // Scope these cards to the archive. Media and report sections must stay visible.
    setupFilters('#previous-work', '.previous-tab', '.previous-card', 'previousFilter', 'previousType');

    const menu = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.nav');
    if (menu && nav) {
      const setMenu = (open) => {
        menu.setAttribute('aria-expanded', String(open));
        nav.classList.toggle('open', open);
      };
      menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
      nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && nav.classList.contains('open')) {
          setMenu(false);
          menu.focus();
        }
      });
      window.matchMedia('(min-width: 901px)').addEventListener('change', (event) => {
        if (event.matches) setMenu(false);
      });
    }

    document.querySelectorAll('img').forEach((image) => {
      const showFallback = () => {
        if (image.dataset.failed) return;
        image.dataset.failed = 'true';
        const fallback = document.createElement('div');
        fallback.className = 'asset-fallback';
        const description = document.createElement('div');
        description.textContent = image.alt || 'Project image';
        const note = document.createElement('small');
        note.textContent = 'Preview unavailable';
        description.append(note);
        fallback.append(description);
        image.hidden = true;
        image.insertAdjacentElement('afterend', fallback);
      };
      image.addEventListener('error', showFallback);
      if (image.complete && !image.naturalWidth) showFallback();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

/* Interactive studio terminal + a dependency-free, perspective-projected 3D mesh. */
(() => {
  function initTech() {
    const output = document.querySelector('#terminal-output');
    const form = document.querySelector('#terminal-form');
    const input = document.querySelector('#terminal-input');
    const modules = [...document.querySelectorAll('[data-command]')];
    const responses = {
      help: ['AVAILABLE COMMANDS', 'creative · web · meta · seo', 'work → portfolio / contact → get in touch'],
      creative: ['CREATIVE / PRODUCTION', 'Campaign identity. Social graphics. Video.', 'Original filming, drone footage, and report design.'],
      web: ['WEB / DEVELOPMENT', 'Custom campaign websites built around your message.', 'Responsive pages, clear navigation, and fast access.'],
      meta: ['META / BACKEND SERVICES', 'Business portfolios, Page connections, and permissions.', 'Authorization support, ad troubleshooting, and reporting.'],
      seo: ['SEARCH / OPTIMIZATION', 'Technical audits, page structure, and Search Console.', 'Help people find your candidate and campaign online.'],
      work: ['OPENING / SELECTED WORK', 'Campaign design and social content.'],
      contact: ['CONTACT / ANGEL DESIGNS LA', 'milorobanofficial@gmail.com', 'Tell us about your campaign and timeline.']
    };
    function run(raw) {
      const command = raw.trim().toLowerCase();
      if (!command || !output) return;
      output.replaceChildren();
      const commandLine = document.createElement('p');
      commandLine.className = 'terminal-command';
      commandLine.textContent = '$ ' + command;
      output.append(commandLine);
      (responses[command] || ['Command not found. Type help to see available commands.']).forEach((line, i) => {
        const row = document.createElement('p');
        row.textContent = line;
        if (i === 0) row.className = 'terminal-success';
        output.append(row);
      });
      modules.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.command === command)));
      if (command === 'work' || command === 'contact') document.getElementById(command)?.scrollIntoView({behavior: reduced.matches ? 'instant' : 'smooth'});
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    modules.forEach(button => { button.setAttribute('aria-pressed', 'false'); button.addEventListener('click', () => run(button.dataset.command)); });
    form?.addEventListener('submit', event => { event.preventDefault(); run(input.value); input.value = ''; });

    const dialog = document.querySelector('#brock-preview');
    const opener = document.querySelector('.open-brock');
    opener?.addEventListener('click', event => { if (dialog?.showModal) { event.preventDefault(); dialog.showModal(); } });
    dialog?.querySelector('.close-preview')?.addEventListener('click', () => dialog.close());
    dialog?.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });

    const canvas = document.querySelector('#signal-globe');
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    document.querySelector('.globe-fallback').hidden = true;
    const pause = document.querySelector('#motion-toggle');
    let paused = reduced.matches, visible = true, frame = 0, lastTime = 0;
    let yaw = 0, baseYaw = 0, sway = 0, pitch = -0.2, dragging = false, previousX = 0, previousY = 0, width = 0, height = 0;
    // California border (lon, lat), simplified from US state boundary data.
    const outline = [[-123.23,42.01],[-120,42],[-120,39],[-117.5,37.22],[-114.63,35],[-114.63,34.88],[-114.33,34.45],[-114.14,34.31],[-114.54,33.93],[-114.52,33.55],[-114.73,33.41],[-114.66,33.03],[-114.52,33.03],[-114.47,32.84],[-114.52,32.76],[-117.13,32.54],[-117.25,32.67],[-117.33,33.12],[-117.47,33.3],[-118.18,33.76],[-118.26,33.7],[-118.41,33.74],[-118.39,33.84],[-118.57,34.04],[-118.8,34],[-119.22,34.15],[-119.28,34.27],[-119.56,34.42],[-120.47,34.45],[-120.65,34.58],[-120.63,35.1],[-120.89,35.25],[-120.91,35.45],[-121.28,35.67],[-121.9,36.32],[-121.94,36.64],[-121.86,36.61],[-121.79,36.8],[-121.93,36.98],[-122.11,36.96],[-122.42,37.24],[-122.52,37.78],[-122.33,37.78],[-122.41,38.15],[-122.49,38.11],[-122.5,37.93],[-122.7,37.89],[-122.94,38.03],[-122.98,38.27],[-123.13,38.45],[-123.74,38.96],[-123.69,39.03],[-123.82,39.37],[-123.76,39.55],[-123.85,39.83],[-124.36,40.26],[-124.41,40.44],[-124.16,40.88],[-124.07,41.44],[-124.15,41.72],[-124.26,41.78],[-124.21,42]];
    const cities = [['Los Angeles',-118.24,34.05,true],['San Francisco',-122.42,37.77],['Sacramento',-121.49,38.58],['San Diego',-117.16,32.72],['Fresno',-119.79,36.74]];
    const lons = outline.map(p => p[0]), lats = outline.map(p => p[1]);
    const centerLon = (Math.min(...lons) + Math.max(...lons)) / 2, centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const unit = 2 / (Math.max(...lats) - Math.min(...lats)), squash = Math.cos(centerLat * Math.PI / 180);
    const toXY = (lon, lat) => [(lon - centerLon) * squash * unit, -(lat - centerLat) * unit];
    const flat = outline.map(([lon, lat]) => toXY(lon, lat));
    const thickness = 0.07, count = flat.length;
    // Extruded 3D slab: top and bottom outlines joined by struts, plus a clipped lat/lon grid inside.
    const vertices = [...flat.map(([x, y]) => [x, y, thickness]), ...flat.map(([x, y]) => [x, y, -thickness])];
    const lines = [];
    for (let i = 0; i < count; i++) {
      lines.push([i, (i + 1) % count], [count + i, count + (i + 1) % count]);
      if (i % 3 === 0) lines.push([i, count + i]);
    }
    function addSegment(a, b) { vertices.push([...a, 0], [...b, 0]); lines.push([vertices.length - 2, vertices.length - 1]); }
    function clip(axis, value) {
      const hits = [];
      for (let i = 0; i < count; i++) {
        const p = outline[i], q = outline[(i + 1) % count];
        if ((p[axis] <= value) !== (q[axis] <= value)) {
          const t = (value - p[axis]) / (q[axis] - p[axis]);
          hits.push(p[1 - axis] + t * (q[1 - axis] - p[1 - axis]));
        }
      }
      hits.sort((a, b) => a - b);
      for (let i = 0; i + 1 < hits.length; i += 2) {
        addSegment(axis ? toXY(hits[i], value) : toXY(value, hits[i]), axis ? toXY(hits[i + 1], value) : toXY(value, hits[i + 1]));
      }
    }
    for (let lat = 33; lat <= 41.5; lat += 0.75) clip(1, lat);
    for (let lon = -124; lon <= -114.5; lon += 0.75) clip(0, lon);
    const cityPoints = cities.map(([name, lon, lat, home]) => ({ name, home, p: [...toXY(lon, lat), 0] }));
    function transform(p) {
      const x = p[0] * Math.cos(yaw) + p[2] * Math.sin(yaw);
      const z = -p[0] * Math.sin(yaw) + p[2] * Math.cos(yaw);
      const y = p[1] * Math.cos(pitch) - z * Math.sin(pitch);
      const depth = p[1] * Math.sin(pitch) + z * Math.cos(pitch);
      const scale = Math.min(height * .35, width * .26) * 3.8 / (3.8 + depth);
      return [width / 2 + x * scale, height / 2 + y * scale, depth];
    }
    function draw() {
      ctx.clearRect(0, 0, width, height);
      yaw = baseYaw + Math.sin(sway) * .85;
      const points = vertices.map(transform);
      lines.forEach(([a, b], index) => {
        const one = points[a], two = points[b], depth = (one[2] + two[2]) / 2;
        const edge = index < count * 2 + Math.ceil(count / 3);
        ctx.lineWidth = edge ? 1.1 : .5;
        ctx.strokeStyle = `rgba(88,229,255,${Math.max(.1, Math.min(.9, (edge ? .62 : .26) - depth * .4))})`;
        ctx.beginPath(); ctx.moveTo(one[0],one[1]); ctx.lineTo(two[0],two[1]); ctx.stroke();
      });
      for (let ring = 0; ring < 2; ring++) {
        ctx.beginPath();
        for (let i = 0; i <= 100; i++) {
          const t = i / 100 * Math.PI * 2, radius = ring ? 1.44 : 1.32;
          const p = ring ? [radius * Math.cos(t), radius * Math.sin(t) * .48, radius * Math.sin(t) * .87] : [radius * Math.cos(t), radius * Math.sin(t) * -.3, radius * Math.sin(t) * .954];
          const q = transform(p); if (i) ctx.lineTo(q[0],q[1]); else ctx.moveTo(q[0],q[1]);
        }
        ctx.strokeStyle = ring ? '#ff436e80' : '#58e5ff80'; ctx.lineWidth = 1; ctx.stroke();
      }
      ctx.font = '600 9px "Space Grotesk", monospace';
      cityPoints.forEach(({ name, home, p }) => {
        const q = transform(p);
        ctx.fillStyle = home ? '#ff698b' : '#c0f6ff'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = home ? 16 : 10;
        ctx.beginPath(); ctx.arc(q[0], q[1], home ? 3 : 2, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = home ? 'rgba(255,105,139,.95)' : 'rgba(192,246,255,.7)';
        ctx.fillText(name.toUpperCase(), q[0] + 7, q[1] + 3);
      });
    }
    function loop(time) {
      frame = 0;
      const delta = Math.min(time - (lastTime || time), 40); lastTime = time;
      if (!dragging) sway += delta * .00045;
      draw(); if (!paused && visible) frame = requestAnimationFrame(loop);
    }
    function syncMotion() {
      pause.textContent = paused ? 'Resume motion' : 'Pause motion';
      pause.setAttribute('aria-pressed',String(paused));
      if (frame) cancelAnimationFrame(frame); frame=0;lastTime=0;
      if (!paused && visible) frame=requestAnimationFrame(loop); else draw();
    }
    function resize() {
      const rect = canvas.getBoundingClientRect(); width=rect.width; height=rect.height;
      const ratio=Math.min(window.devicePixelRatio || 1,2);
      canvas.width=Math.round(width*ratio); canvas.height=Math.round(height*ratio); ctx.setTransform(ratio,0,0,ratio,0,0); draw();
    }
    new ResizeObserver(resize).observe(canvas);
    new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;syncMotion();},{threshold:.05}).observe(canvas);
    pause.addEventListener('click',()=>{paused=!paused;syncMotion();});
    reduced.addEventListener('change',event=>{paused=event.matches;syncMotion();});
    canvas.addEventListener('pointerdown',e=>{dragging=true;previousX=e.clientX;previousY=e.clientY;canvas.setPointerCapture(e.pointerId);});
    canvas.addEventListener('pointermove',e=>{if(!dragging)return;baseYaw+=(e.clientX-previousX)*.008;pitch=Math.max(-1.1,Math.min(1.1,pitch+(e.clientY-previousY)*.006));previousX=e.clientX;previousY=e.clientY;draw();});
    ['pointerup','pointercancel','lostpointercapture'].forEach(event=>canvas.addEventListener(event,()=>{dragging=false;}));
    canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();baseYaw+=e.key==='ArrowLeft'?-.15:e.key==='ArrowRight'?.15:0;pitch=Math.max(-1.1,Math.min(1.1,pitch+(e.key==='ArrowUp'?-.1:e.key==='ArrowDown'?.1:0)));draw();});
    resize();syncMotion();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initTech,{once:true});else initTech();
})();
