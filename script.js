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
    let yaw = 0.5, pitch = -0.24, dragging = false, previousX = 0, previousY = 0, width = 0, height = 0;
    const vertices = [], lines = [];
    // Actual XYZ sphere geometry, transformed and projected every frame.
    for (let latitude = 0; latitude <= 14; latitude++) {
      for (let longitude = 0; longitude < 28; longitude++) {
        const phi = latitude / 14 * Math.PI, theta = longitude / 28 * Math.PI * 2;
        vertices.push([Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta)]);
        const index = latitude * 28 + longitude;
        lines.push([index, latitude * 28 + (longitude + 1) % 28]);
        if (latitude < 14) { lines.push([index, index + 28]); if (longitude % 2 === 0) lines.push([index, (latitude + 1) * 28 + (longitude + 1) % 28]); }
      }
    }
    function transform(p) {
      const x = p[0] * Math.cos(yaw) + p[2] * Math.sin(yaw);
      const z = -p[0] * Math.sin(yaw) + p[2] * Math.cos(yaw);
      const y = p[1] * Math.cos(pitch) - z * Math.sin(pitch);
      const depth = p[1] * Math.sin(pitch) + z * Math.cos(pitch);
      const scale = Math.min(height * .39, width * .26) * 3.8 / (3.8 + depth);
      return [width / 2 + x * scale, height / 2 + y * scale, depth];
    }
    function draw() {
      ctx.clearRect(0, 0, width, height);
      const points = vertices.map(transform);
      ctx.lineWidth = .6;
      lines.forEach(([a, b]) => {
        const one = points[a], two = points[b], depth = (one[2] + two[2]) / 2;
        ctx.strokeStyle = `rgba(88,229,255,${depth < 0 ? .4 + (-depth) * .25 : .075})`;
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
      points.forEach((p,i) => {
        if (i % 19 || p[2] > .3) return;
        ctx.fillStyle = i % 3 ? '#c0f6ff' : '#ff698b'; ctx.shadowColor=ctx.fillStyle; ctx.shadowBlur=10;
        ctx.beginPath(); ctx.arc(p[0],p[1],1.8,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
      });
    }
    function loop(time) {
      frame = 0;
      const delta = Math.min(time - (lastTime || time), 40); lastTime = time;
      if (!dragging) yaw += delta * .00013;
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
    canvas.addEventListener('pointermove',e=>{if(!dragging)return;yaw+=(e.clientX-previousX)*.008;pitch=Math.max(-1.1,Math.min(1.1,pitch+(e.clientY-previousY)*.006));previousX=e.clientX;previousY=e.clientY;draw();});
    ['pointerup','pointercancel','lostpointercapture'].forEach(event=>canvas.addEventListener(event,()=>{dragging=false;}));
    canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();yaw+=e.key==='ArrowLeft'?-.15:e.key==='ArrowRight'?.15:0;pitch=Math.max(-1.1,Math.min(1.1,pitch+(e.key==='ArrowUp'?-.1:e.key==='ArrowDown'?.1:0)));draw();});
    resize();syncMotion();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initTech,{once:true});else initTech();
})();
