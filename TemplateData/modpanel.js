(function () {
  const KEY = 'slope_mod_states_v1';
  const body = document.body;
  const game = document.getElementById('gameContainer');
  if (!body || !game) return;

  const state = { mods: {}, intervals: {}, rafCap: 0, lastAlert: null };

  const original = {
    title: document.title,
    raf: window.requestAnimationFrame.bind(window),
    onkeydown: null
  };

  function setBodyClass(flag, cls) { body.classList.toggle(cls, !!flag); }

  function blockKey(code, enabled) {
    const id = `block_${code}`;
    if (enabled && !state.intervals[id]) {
      const handler = (e) => {
        if (e.code === code) {
          e.preventDefault();
          e.stopPropagation();
        }
      };
      state.intervals[id] = handler;
      document.addEventListener('keydown', handler, true);
    } else if (!enabled && state.intervals[id]) {
      document.removeEventListener('keydown', state.intervals[id], true);
      delete state.intervals[id];
    }
  }

  function pressKey(code, type = 'keydown') {
    document.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }));
  }

  function startInterval(name, fn, ms) {
    if (state.intervals[name]) return;
    state.intervals[name] = setInterval(fn, ms);
  }
  function stopInterval(name) {
    if (!state.intervals[name]) return;
    clearInterval(state.intervals[name]);
    delete state.intervals[name];
  }

  function capFps(limit) {
    if (!limit) {
      window.requestAnimationFrame = original.raf;
      state.rafCap = 0;
      return;
    }
    const minFrame = 1000 / limit;
    let last = 0;
    state.rafCap = limit;
    window.requestAnimationFrame = (cb) => original.raf((t) => {
      if (t - last >= minFrame) {
        last = t;
        cb(t);
      } else {
        window.requestAnimationFrame(cb);
      }
    });
  }

  function setTheme(theme) {
    ['mod-cinema', 'mod-wireframe', 'mod-neon', 'mod-night', 'mod-pastel', 'mod-vhs'].forEach((c) => body.classList.remove(c));
    if (theme) body.classList.add(theme);
  }

  const mods = [
    { id: 'hideAlert', name: 'Hide Promo Banner', desc: 'Removes the top blue promo alert.', apply: (on) => document.querySelector('.alert')?.style.setProperty('display', on ? 'none' : '') },
    { id: 'autoFullscreen', name: 'Auto Fullscreen Prompt', desc: 'Prompts fullscreen when panel opens.', apply: (on) => { if (on) game.requestFullscreen?.().catch(()=>{}); } },
    { id: 'focusGame', name: 'Always Focus Game', desc: 'Focuses game container every second.', apply: (on) => on ? startInterval('focusGame', ()=>game.focus?.(), 1000) : stopInterval('focusGame') },
    { id: 'muteTab', name: 'Mute Tab', desc: 'Mutes all audio output on this page.', apply: (on) => { document.querySelectorAll('audio,video').forEach((m)=>m.muted = on); } },
    { id: 'titleSlope', name: 'Custom Title', desc: 'Renames tab title to Slope Modded.', apply: (on) => { document.title = on ? 'Slope Modded x50' : original.title; } },

    { id: 'themeCinema', name: 'Cinema Contrast', desc: 'Sharper high-contrast visuals.', apply: (on)=> on ? setTheme('mod-cinema') : setTheme('') },
    { id: 'themeWireframe', name: 'Wireframe Vision', desc: 'Grayscale high contrast style.', apply: (on)=> on ? setTheme('mod-wireframe') : setTheme('') },
    { id: 'themeNeon', name: 'Neon Pop', desc: 'Color shifted neon mode.', apply: (on)=> on ? setTheme('mod-neon') : setTheme('') },
    { id: 'themeNight', name: 'Night Runner', desc: 'Dark low-brightness mode.', apply: (on)=> on ? setTheme('mod-night') : setTheme('') },
    { id: 'themePastel', name: 'Pastel Chill', desc: 'Soft desaturated color profile.', apply: (on)=> on ? setTheme('mod-pastel') : setTheme('') },
    { id: 'themeVhs', name: 'VHS Filter', desc: 'Retro sepia/contrast profile.', apply: (on)=> on ? setTheme('mod-vhs') : setTheme('') },
    { id: 'scanlines', name: 'CRT Scanlines', desc: 'Adds retro display scanlines.', apply: (on)=> setBodyClass(on, 'mod-scanlines') },
    { id: 'rgbShift', name: 'RGB Shift', desc: 'Adds slight chromatic separation.', apply: (on)=> setBodyClass(on, 'mod-rgbshift') },
    { id: 'blur', name: 'Motion Blur FX', desc: 'Adds slight blur for speed feel.', apply: (on)=> setBodyClass(on, 'mod-blur') },
    { id: 'sharpen', name: 'Sharpen FX', desc: 'Boosts edge contrast.', apply: (on)=> setBodyClass(on, 'mod-sharpen') },
    { id: 'invert', name: 'Inverted World', desc: 'Inverts all game colors.', apply: (on)=> setBodyClass(on, 'mod-invert') },
    { id: 'spin', name: 'Spin World', desc: 'Rotates viewport continuously.', apply: (on)=> setBodyClass(on, 'mod-spin') },
    { id: 'mirror', name: 'Mirror Mode', desc: 'Flips viewport horizontally.', apply: (on)=> setBodyClass(on, 'mod-mirror') },
    { id: 'tilt', name: '3D Tilt', desc: 'Tilts game viewport in perspective.', apply: (on)=> setBodyClass(on, 'mod-tilt') },
    { id: 'zoom', name: 'Zoom Boost', desc: 'Slightly zooms in viewport.', apply: (on)=> setBodyClass(on, 'mod-zoom') },

    { id: 'fpsCounter', name: 'FPS Counter', desc: 'Shows live frame counter.', apply: (on) => {
      let node = document.getElementById('modFpsCounter');
      if (on && !node) {
        node = document.createElement('div'); node.id = 'modFpsCounter'; body.appendChild(node);
        let last = performance.now(), frames = 0;
        const tick = () => {
          if (!state.mods.fpsCounter) return;
          frames++;
          const now = performance.now();
          if (now - last >= 1000) { node.textContent = `FPS ${frames}`; frames = 0; last = now; }
          original.raf(tick);
        };
        original.raf(tick);
      }
      if (!on && node) node.remove();
    } },
    { id: 'fps30', name: 'FPS Cap 30', desc: 'Caps rendering to ~30 FPS.', apply: (on)=> capFps(on ? 30 : 0) },
    { id: 'fps60', name: 'FPS Cap 60', desc: 'Caps rendering to ~60 FPS.', apply: (on)=> capFps(on ? 60 : 0) },

    { id: 'autoJump', name: 'Auto Jump Pulse', desc: 'Presses space every 900ms.', apply: (on)=> on ? startInterval('autoJump', ()=>{pressKey('Space'); pressKey('Space', 'keyup');}, 900) : stopInterval('autoJump') },
    { id: 'rapidJump', name: 'Rapid Jump', desc: 'Fast jump spam every 250ms.', apply: (on)=> on ? startInterval('rapidJump', ()=>{pressKey('Space'); pressKey('Space','keyup');}, 250) : stopInterval('rapidJump') },
    { id: 'holdLeft', name: 'Auto Hold Left', desc: 'Constantly pushes left movement.', apply: (on)=> on ? startInterval('holdLeft', ()=>pressKey('ArrowLeft'), 140) : stopInterval('holdLeft') },
    { id: 'holdRight', name: 'Auto Hold Right', desc: 'Constantly pushes right movement.', apply: (on)=> on ? startInterval('holdRight', ()=>pressKey('ArrowRight'), 140) : stopInterval('holdRight') },
    { id: 'zigzag', name: 'Auto Zig-Zag', desc: 'Alternates left and right each 400ms.', apply: (on)=> {
      if (!on) return stopInterval('zigzag');
      let left = true;
      startInterval('zigzag', ()=>{ pressKey(left ? 'ArrowLeft' : 'ArrowRight'); left = !left; }, 400);
    } },
    { id: 'noLeft', name: 'Disable Left Key', desc: 'Blocks left key input.', apply: (on)=> blockKey('ArrowLeft', on) },
    { id: 'noRight', name: 'Disable Right Key', desc: 'Blocks right key input.', apply: (on)=> blockKey('ArrowRight', on) },
    { id: 'wasdLeft', name: 'A = Left', desc: 'Maps A key to left.', apply: (on)=> mapKey('KeyA', 'ArrowLeft', on) },
    { id: 'wasdRight', name: 'D = Right', desc: 'Maps D key to right.', apply: (on)=> mapKey('KeyD', 'ArrowRight', on) },
    { id: 'jumpW', name: 'W = Jump', desc: 'Maps W key to space.', apply: (on)=> mapKey('KeyW', 'Space', on) },

    { id: 'heartbeatJump', name: 'Heartbeat Jump', desc: 'Double jump pulse rhythm.', apply: (on)=> {
      if (!on) return stopInterval('heartbeatJump');
      startInterval('heartbeatJump', ()=>{ pressKey('Space'); setTimeout(()=>pressKey('Space'), 120); }, 1000);
    } },

    { id: 'clock', name: 'Corner Clock', desc: 'Shows local time at bottom-right.', apply: (on)=> {
      let n = document.getElementById('modClock');
      if (on && !n) {
        n = document.createElement('div'); n.id = 'modClock'; n.style = 'position:fixed;right:12px;bottom:12px;z-index:11000;background:rgba(0,0,0,.65);color:#fff;padding:4px 8px;border-radius:6px;font:12px monospace';
        body.appendChild(n);
        startInterval('clock', ()=>n.textContent = new Date().toLocaleTimeString(), 1000);
      }
      if (!on && n) { n.remove(); stopInterval('clock'); }
    } },
    { id: 'crosshair', name: 'Center Crosshair', desc: 'Adds center alignment dot.', apply: (on)=> {
      let n = document.getElementById('modCrosshair');
      if (on && !n) { n = document.createElement('div'); n.id='modCrosshair'; n.style='position:fixed;left:50%;top:50%;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;background:#0ff;box-shadow:0 0 8px #0ff;z-index:10001;pointer-events:none'; body.appendChild(n); }
      if (!on && n) n.remove();
    } },
    { id: 'centerLine', name: 'Center Guide Line', desc: 'Vertical guide line overlay.', apply: (on)=> {
      let n = document.getElementById('modCenterLine');
      if (on && !n) { n = document.createElement('div'); n.id='modCenterLine'; n.style='position:fixed;left:50%;top:0;bottom:0;width:2px;background:rgba(0,255,255,.3);z-index:10000;pointer-events:none'; body.appendChild(n); }
      if (!on && n) n.remove();
    } },
    { id: 'edgeGuides', name: 'Edge Guides', desc: 'Adds left/right safe lane guides.', apply: (on)=> {
      ['L','R'].forEach((s) => {
        let n = document.getElementById(`modEdge${s}`);
        if (on && !n) { n = document.createElement('div'); n.id=`modEdge${s}`; n.style=`position:fixed;top:0;bottom:0;width:2px;left:${s==='L'?'33%':'67%'};background:rgba(255,255,0,.25);z-index:10000;pointer-events:none`; body.appendChild(n); }
        if (!on && n) n.remove();
      });
    } },

    { id: 'rainbowBorder', name: 'Rainbow Border', desc: 'Animated rainbow frame around game.', apply: (on)=> {
      game.style.outline = on ? '3px solid transparent' : '';
      game.style.boxShadow = on ? '0 0 0 3px #ff00ff, 0 0 16px rgba(255,0,255,.7)' : '';
    } },
    { id: 'hideCursor', name: 'Hide Cursor', desc: 'Hides mouse cursor in-game.', apply: (on)=> game.style.cursor = on ? 'none' : '' },
    { id: 'bigCursor', name: 'Big Cursor', desc: 'Large high-contrast crosshair cursor.', apply: (on)=> game.style.cursor = on ? 'crosshair' : '' },
    { id: 'preventContext', name: 'Disable Right Click', desc: 'Prevents accidental context menu.', apply: (on)=> {
      const id = 'ctxBlock';
      if (on && !state.intervals[id]) { state.intervals[id] = (e)=>e.preventDefault(); document.addEventListener('contextmenu', state.intervals[id]); }
      if (!on && state.intervals[id]) { document.removeEventListener('contextmenu', state.intervals[id]); delete state.intervals[id]; }
    } },

    { id: 'quickRestart', name: 'Quick Restart (R)', desc: 'Pressing R reloads game instantly.', apply: (on)=> {
      const id = 'quickRestart';
      if (on && !state.intervals[id]) {
        state.intervals[id] = (e) => { if (e.code === 'KeyR') location.reload(); };
        document.addEventListener('keydown', state.intervals[id]);
      }
      if (!on && state.intervals[id]) { document.removeEventListener('keydown', state.intervals[id]); delete state.intervals[id]; }
    } },

    { id: 'trailLeft', name: 'Left Trail Indicator', desc: 'Flashes left indicator every left press.', apply: (on)=> indicatorHook('ArrowLeft', '#00e0ff', on) },
    { id: 'trailRight', name: 'Right Trail Indicator', desc: 'Flashes right indicator every right press.', apply: (on)=> indicatorHook('ArrowRight', '#ff7f00', on) },
    { id: 'jumpIndicator', name: 'Jump Indicator', desc: 'Flashes top indicator on jump.', apply: (on)=> indicatorHook('Space', '#7dff00', on) },

    { id: 'autoPanelPin', name: 'Pin Mod Panel', desc: 'Keeps panel always open.', apply: (on)=> { if (on) panel.classList.remove('hidden'); } },
    { id: 'sortedAlpha', name: 'Sort Mods A-Z', desc: 'Sorts the panel alphabetically.', apply: (on)=> renderList(on ? [...mods].sort((a,b)=>a.name.localeCompare(b.name)) : mods) },
    { id: 'showOnlyEnabled', name: 'Show Enabled Only', desc: 'Filters panel to active mods.', apply: ()=> renderList(currentSource()) },
    { id: 'saveStates', name: 'Persist Mod States', desc: 'Saves enabled mods in local storage.', apply: (on)=> { if (on) localStorage.setItem(KEY, JSON.stringify(state.mods)); else localStorage.removeItem(KEY); } }
  ];

  function currentSource() {
    const sorted = state.mods.sortedAlpha ? [...mods].sort((a,b)=>a.name.localeCompare(b.name)) : mods;
    return state.mods.showOnlyEnabled ? sorted.filter((m)=>state.mods[m.id]) : sorted;
  }

  function indicatorHook(code, color, enabled) {
    const id = `indicator_${code}`;
    if (enabled && !state.intervals[id]) {
      state.intervals[id] = (e) => {
        if (e.code !== code) return;
        const n = document.createElement('div');
        n.style = `position:fixed;left:${code==='ArrowLeft'?'20px':code==='ArrowRight'?'calc(100% - 40px)':'50%'};top:${code==='Space'?'16px':'50%'};width:18px;height:18px;border-radius:50%;background:${color};box-shadow:0 0 16px ${color};z-index:10002;pointer-events:none;transform:translate(-50%,-50%)`;
        body.appendChild(n);
        setTimeout(()=>n.remove(), 150);
      };
      document.addEventListener('keydown', state.intervals[id]);
    } else if (!enabled && state.intervals[id]) {
      document.removeEventListener('keydown', state.intervals[id]);
      delete state.intervals[id];
    }
  }

  function mapKey(source, target, enabled) {
    const id = `map_${source}_${target}`;
    if (enabled && !state.intervals[id]) {
      state.intervals[id] = (e) => {
        if (e.code !== source) return;
        e.preventDefault();
        pressKey(target);
      };
      document.addEventListener('keydown', state.intervals[id]);
    } else if (!enabled && state.intervals[id]) {
      document.removeEventListener('keydown', state.intervals[id]);
      delete state.intervals[id];
    }
  }

  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'modPanelToggle';
  toggleBtn.textContent = 'Mods (50)';
  const panel = document.createElement('aside');
  panel.id = 'modPanel';
  panel.innerHTML = `<header>Slope Mod Panel<div class="mod-sub">50 client-side mods / helpers</div></header>
    <div class="toolbar"><input id="modSearch" type="search" placeholder="Search mods..."></div>
    <div class="mod-list" id="modList"></div>`;

  body.append(toggleBtn, panel);

  toggleBtn.addEventListener('click', () => {
    panel.classList.toggle('hidden');
    if (state.mods.autoFullscreen) game.requestFullscreen?.().catch(()=>{});
  });

  panel.classList.add('hidden');
  const modList = panel.querySelector('#modList');
  const search = panel.querySelector('#modSearch');

  function applyMod(id, enabled) {
    state.mods[id] = enabled;
    const m = mods.find((x)=>x.id===id);
    if (m?.apply) m.apply(enabled);
    if (state.mods.saveStates) localStorage.setItem(KEY, JSON.stringify(state.mods));
    if (id === 'showOnlyEnabled' || id === 'sortedAlpha') renderList(currentSource());
  }

  function renderList(source) {
    const query = (search.value || '').toLowerCase().trim();
    modList.innerHTML = '';
    source.filter((m)=> !query || m.name.toLowerCase().includes(query) || m.desc.toLowerCase().includes(query)).forEach((m) => {
      const row = document.createElement('div'); row.className = 'mod-item';
      row.innerHTML = `<div><div class='mod-title'>${m.name}</div><div class='mod-desc'>${m.desc}</div></div><button class='switch ${state.mods[m.id] ? 'active' : ''}' aria-label='toggle'></button>`;
      const sw = row.querySelector('.switch');
      sw.addEventListener('click', () => {
        const next = !state.mods[m.id];
        sw.classList.toggle('active', next);
        applyMod(m.id, next);
      });
      modList.appendChild(row);
    });
  }

  search.addEventListener('input', ()=>renderList(currentSource()));

  const persisted = JSON.parse(localStorage.getItem(KEY) || '{}');
  mods.forEach((m) => {
    const initial = !!persisted[m.id];
    state.mods[m.id] = initial;
    if (initial) m.apply(true);
  });

  renderList(mods);
})();
