// app.js – Fixed Theme System with Working Selection Outline & Clipboard Export
console.log('app.js starting...');

// ============================================================
//  GLOBAL REFERENCES
// ============================================================
const save = window.save || function() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(window.games || []));
};
const saveCollections = window.saveCollections || function() {
  localStorage.setItem(COLLECTION_KEY, JSON.stringify(window.collections || []));
};

// ============================================================
//  THEME SYSTEM
// ============================================================

const PRESET_THEMES = {
  'black': { bg: '#000000', surface: '#0d0d0d', surface2: '#1a1a1a', text: '#f0f0f0', textSecondary: '#888888', accent: '#ffffff', divider: '#2a2a2a' },
  'white': { bg: '#fafafa', surface: '#ffffff', surface2: '#f5f5f5', text: '#111111', textSecondary: '#777777', accent: '#111111', divider: '#e5e5e5' }
};

const MAIN_COLORS = [
  { name: 'Red', hex: '#ef4444' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Lime', hex: '#84cc16' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Teal', hex: '#14b8a6' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Sky', hex: '#0ea5e9' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Violet', hex: '#8b5cf6' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Magenta', hex: '#d946ef' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Rose', hex: '#f43f5e' }
];

function hexToHsl(hex) {
  let r = parseInt(hex.slice(1,3), 16) / 255;
  let g = parseInt(hex.slice(3,5), 16) / 255;
  let b = parseInt(hex.slice(5,7), 16) / 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; } 
  else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) { r = g = b = l; } 
  else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  const toHex = (x) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

function generateThemeFromMainColor(hex) {
  let { h, s, l } = hexToHsl(hex);
  const bg        = hslToHex(h, s, 8);
  const surface   = hslToHex(h, s, 14);
  const surface2  = hslToHex(h, s, 20);
  const accent    = hex;
  const divider   = hslToHex(h, s, 25);

  const savedTextColor = localStorage.getItem(TEXT_COLOR_KEY);
  let text, textSecondary;
  if (savedTextColor) {
    text = savedTextColor;
    textSecondary = savedTextColor === '#ffffff' ? '#aaaaaa' : '#666666';
  } else {
    const bgLightness = hexToHsl(bg).l;
    const isBgDark = bgLightness < 50; 
    text = isBgDark ? '#f0f0f0' : '#111111';
    textSecondary = isBgDark ? '#aaaaaa' : '#666666';
  }
  return { bg, surface, surface2, text, textSecondary, accent, divider };
}

window.applyTheme = function(theme) {
  if (!theme) return;
  const root = document.documentElement;
  root.style.setProperty('--bg', theme.bg);
  root.style.setProperty('--surface', theme.surface);
  root.style.setProperty('--surface2', theme.surface2);
  root.style.setProperty('--text', theme.text);
  root.style.setProperty('--text-secondary', theme.textSecondary);
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--divider', theme.divider);
  localStorage.setItem(COLOR_THEME_KEY, JSON.stringify(theme));
  updateSettingsUI(theme);
};

function applyTextColor(hex) {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return;
  localStorage.setItem(TEXT_COLOR_KEY, hex);
  const root = document.documentElement;
  root.style.setProperty('--text', hex);
  const hsl = hexToHsl(hex);
  const isLight = hsl.l > 50;
  root.style.setProperty('--text-secondary', isLight ? '#666666' : '#aaaaaa');
  const savedTheme = localStorage.getItem(COLOR_THEME_KEY);
  if (savedTheme) {
    try {
      const theme = JSON.parse(savedTheme);
      theme.text = hex;
      theme.textSecondary = isLight ? '#666666' : '#aaaaaa';
      localStorage.setItem(COLOR_THEME_KEY, JSON.stringify(theme));
    } catch (e) {}
  }
  showToast('Text color updated', 'success');
  updateSettingsUI(JSON.parse(localStorage.getItem(COLOR_THEME_KEY) || '{}'));
}

// FIXED: Update the active state properly
function updateSettingsUI(theme) {
  const hexInput = document.getElementById('hexInput');
  const previewBox = document.getElementById('colorPreview');
  const textHexInput = document.getElementById('textHexInput');
  const textPreviewBox = document.getElementById('textColorPreview');
  
  if (hexInput) hexInput.value = theme.accent || '#ffffff';
  if (previewBox) previewBox.style.background = theme.accent || '#ffffff';
  if (textHexInput) textHexInput.value = theme.text || '#ffffff';
  if (textPreviewBox) textPreviewBox.style.background = theme.text || '#ffffff';
  
  // FIX: Properly update active state on theme boxes
  document.querySelectorAll('.theme-box').forEach(box => {
    const boxHex = box.dataset.hex;
    // Remove all active classes and inline styles
    box.classList.remove('active');
    box.style.border = '2px solid transparent';
    // Apply active if matches
    if (boxHex === theme.accent) {
      box.classList.add('active');
      box.style.border = '2px solid #ffffff';
    }
  });
}

// ============================================================
//  GLOBAL UI FUNCTIONS
// ============================================================
window.closeEditModal = function() {
  const modal = document.getElementById('editModal');
  if (modal) modal.classList.remove('open');
};
window.closeDetail = function() {
  document.getElementById('detailSheet').classList.remove('open');
  document.getElementById('overlayBg').classList.remove('show');
};

function showToast(message, type = 'info', duration = 2500) {
  const existing = document.getElementById('customToast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.id = 'customToast';
  toast.style.cssText = `
    position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
    z-index: 9999; padding: 14px 24px; background: var(--surface);
    color: var(--text); border: 1px solid var(--divider); border-radius: 16px;
    font-family: 'Outfit', sans-serif; font-size: 15px; font-weight: 600;
    box-shadow: 0 12px 40px rgba(0,0,0,0.5); max-width: 90%; text-align: center;
    backdrop-filter: blur(10px); animation: slideDown 0.3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => { if (toast.parentNode) toast.remove(); }, duration);
}

function showConfirm(message, onConfirm) {
  const existing = document.getElementById('customConfirm');
  if (existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.id = 'customConfirm';
  overlay.style.cssText = `position: fixed; inset: 0; z-index: 99999; background: rgba(0,0,0,0.6); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; animation: fadeIn 0.2s ease;`;
  const box = document.createElement('div');
  box.style.cssText = `background: var(--surface); padding: 28px 24px; border-radius: 24px; max-width: 340px; width: 90%; box-shadow: 0 24px 60px rgba(0,0,0,0.6); text-align: center; font-family: 'Outfit', sans-serif;`;
  box.innerHTML = `
    <div style="font-size: 28px; margin-bottom: 8px;">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#d04040;display:inline-block;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    </div>
    <div style="font-size: 17px; font-weight: 700; color: var(--text); margin-bottom: 6px;">Are you sure?</div>
    <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 20px;">${message}</div>
    <div style="display: flex; gap: 10px; justify-content: center;">
      <button id="confirmCancelBtn" style="padding: 10px 24px; background: var(--surface2); border: 1px solid var(--divider); border-radius: 12px; font-weight: 600; font-size: 14px; cursor: pointer; color: var(--text); flex:1;">Cancel</button>
      <button id="confirmOkBtn" style="padding: 10px 24px; background: #d04040; border: none; border-radius: 12px; font-weight: 600; font-size: 14px; cursor: pointer; color: #fff; flex:1;">Yes, do it</button>
    </div>
  `;
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  document.getElementById('confirmCancelBtn').onclick = () => overlay.remove();
  document.getElementById('confirmOkBtn').onclick = () => { overlay.remove(); if (onConfirm) onConfirm(); };
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
}

const animStyle = document.createElement('style');
animStyle.textContent = `
  @keyframes slideDown { from { opacity: 0; transform: translateX(-50%) translateY(-20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
`;
document.head.appendChild(animStyle);

// ============================================================
//  NAVIGATION & RENDER
// ============================================================
function render() {
  const area = document.getElementById('contentArea');
  if (!area) return;
  const activeTab = document.querySelector('.bottom-nav .nav-tab.active');
  const page = activeTab ? activeTab.dataset.page : 'library';
  if (page === 'library') renderLibrary(area);
  else if (page === 'collections') renderCollections(area);
  else if (page === 'search') renderSearch(area);
  else if (page === 'settings') renderSettings(area);
}

// ============================================================
//  LIBRARY
// ============================================================
function renderLibrary(area) {
  const gList = window.games || [];
  if (gList.length === 0) {
    area.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;text-align:center;"><div style="margin-bottom:16px;"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-secondary);"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg></div><div style="font-size:20px;font-weight:700;color:var(--text);margin-bottom:8px;">Your library is empty</div><div style="font-size:14px;color:var(--text-secondary);max-width:280px;line-height:1.6;">Tap the <strong>+ Add</strong> button below to add your first game!</div></div>`;
    return;
  }
  const favs = gList.filter(g => g.favorite === true);
  let html = '';
  if (favs.length > 0) {
    html += `<div class="section"><div class="section-title">Favorites</div></div><div class="scroll-container"><div class="scroll-track">`;
    favs.forEach(g => { html += buildCard(g); });
    html += `<div class="scroll-spacer"></div></div></div>`;
  }
  const cList = window.collections || [];
  if (cList.length > 0) {
    const sorted = [...cList].sort((a, b) => a.name.localeCompare(b.name));
    sorted.forEach(c => {
      const collGames = gList.filter(g => g.collection === c.id);
      if (collGames.length === 0) return;
      html += `<div class="section"><div class="section-title">${c.name}</div></div><div class="scroll-container collection-scroll"><div class="scroll-track">`;
      collGames.forEach(g => { html += buildCard(g); });
      html += `<div class="scroll-spacer"></div></div></div>`;
    });
  }
  html += `<div class="section"><div class="section-title">All Games</div></div>`;
  const viewBtn = document.getElementById('btnViewToggle');
  const viewClass = viewBtn && viewBtn.dataset.view === 'list' ? ' list' : '';
  html += `<div class="game-grid${viewClass}">`;
  gList.forEach(g => { html += buildGridCard(g); });
  html += `</div>`;
  area.innerHTML = html;
  
  document.querySelectorAll('.scroll-container').forEach(container => {
    const cards = container.querySelectorAll('.scroll-card');
    if (!cards.length) return;
    function updateZoom() {
      const rect = container.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      cards.forEach(card => {
        const cr = card.getBoundingClientRect();
        const cardCenter = cr.left + cr.width / 2;
        card.classList.toggle('active', Math.abs(center - cardCenter) < cr.width / 2);
      });
    }
    container.addEventListener('scroll', updateZoom);
    setTimeout(updateZoom, 150);
  });
}

function buildCard(g) {
  const img = g.cover ? `<img src="${g.cover}" alt="">` : `<div style="width:100%;height:100%;background:var(--surface2);display:flex;align-items:center;justify-content:center;">${imagePlaceholderSvg()}</div>`;
  return `<div class="scroll-card" onclick="openDetail('${g.id}')"><div class="scroll-card-img">${img}</div><div class="scroll-card-info"><div class="scroll-card-title">${g.title}</div><div class="scroll-card-meta">${g.platform||''}</div></div></div>`;
}
function buildGridCard(g) {
  const img = g.cover ? `<img src="${g.cover}" alt="">` : `<div style="width:100%;height:100%;background:var(--surface2);display:flex;align-items:center;justify-content:center;">${imagePlaceholderSvg()}</div>`;
  return `<div class="grid-card" onclick="openDetail('${g.id}')"><div class="grid-img">${img}</div><div class="grid-info"><div class="grid-title">${g.title}</div><div class="grid-meta">${g.platform||''}</div></div></div>`;
}
function imagePlaceholderSvg() {
  return `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
}

// ============================================================
//  COLLECTIONS
// ============================================================
function renderCollections(area) {
  const cList = window.collections || [];
  if (cList.length === 0) {
    area.innerHTML = `<div style="padding:16px 14px 8px;"><div style="display:flex;gap:10px;margin-bottom:16px;"><input type="text" id="newCollectionName" placeholder="New collection name..." style="flex:1;padding:8px 12px;border:1px solid var(--divider);border-radius:8px;background:var(--surface2);color:var(--text);font-size:14px;"><button class="add-btn" onclick="window.addCollection()" style="padding:6px 16px;font-size:13px;">Create</button></div><div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;text-align:center;"><div style="margin-bottom:16px;"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-secondary);"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg></div><div style="font-size:20px;font-weight:700;color:var(--text);margin-bottom:8px;">No collections yet</div><div style="font-size:14px;color:var(--text-secondary);max-width:280px;line-height:1.6;">Type a name above and tap <strong>Create</strong> to organize your games!</div></div></div>`;
    return;
  }
  let html = `<div style="padding:16px 14px 8px;"><div style="display:flex;gap:10px;margin-bottom:16px;"><input type="text" id="newCollectionName" placeholder="New collection name..." style="flex:1;padding:8px 12px;border:1px solid var(--divider);border-radius:8px;background:var(--surface2);color:var(--text);font-size:14px;"><button class="add-btn" onclick="window.addCollection()" style="padding:6px 16px;font-size:13px;">Create</button></div><div style="display:flex;flex-direction:column;gap:10px;">`;
  const sorted = [...cList].sort((a, b) => a.name.localeCompare(b.name));
  sorted.forEach(c => {
    const gList = window.games || [];
    const count = gList.filter(g => g.collection === c.id).length;
    html += `<div style="display:flex;justify-content:space-between;align-items:center;background:var(--surface);border:1px solid var(--divider);border-radius:8px;padding:12px 16px;"><div><strong>${c.name}</strong> <span style="font-size:12px;color:var(--text-secondary);">${count} games</span></div><button onclick="window.deleteCollection('${c.id}')" style="background:var(--surface2);border:none;padding:4px 10px;border-radius:4px;cursor:pointer;">Delete</button></div>`;
  });
  html += `</div></div>`;
  area.innerHTML = html;
}
window.addCollection = function() {
  const input = document.getElementById('newCollectionName');
  if (!input) return;
  const name = input.value.trim();
  if (!name) { showToast('Please enter a collection name', 'error'); return; }
  const cList = window.collections || [];
  cList.push({ id: Date.now().toString(36), name });
  window.collections = cList;
  saveCollections(); render(); showToast('Collection created!', 'success'); input.value = '';
};
window.deleteCollection = function(id) {
  showConfirm('Delete this collection and remove all games from it?', () => {
    let cList = window.collections || [];
    cList = cList.filter(c => c.id !== id);
    window.collections = cList;
    const gList = window.games || [];
    gList.forEach(g => { if (g.collection === id) g.collection = ''; });
    window.games = gList;
    saveCollections(); save(); render(); showToast('Collection deleted.', 'info');
  });
};

// ============================================================
//  SEARCH
// ============================================================
function renderSearch(area) {
  const query = document.getElementById('searchInput')?.value?.toLowerCase()?.trim() || '';
  const gList = window.games || [];
  const results = gList.filter(g => !query || g.title.toLowerCase().includes(query) || (g.platform||'').toLowerCase().includes(query));
  let html = `<div style="padding:16px 14px 8px;"><div style="display:flex;gap:10px;margin-bottom:16px;"><input type="text" id="searchInput" placeholder="Search games..." value="${query}" style="flex:1;padding:10px 14px;border:1px solid var(--divider);border-radius:8px;background:var(--surface2);color:var(--text);font-size:14px;" oninput="render()" autofocus /></div><div style="font-size:13px;color:var(--text-secondary);margin-bottom:10px;">${results.length} game${results.length !== 1 ? 's' : ''} found</div><div class="game-grid">`;
  if (results.length === 0) {
    if (!query) { html += `<div style="grid-column:1/-1;text-align:center;padding:40px 0;color:var(--text-secondary);"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:0 auto 12px;color:var(--text-secondary);"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>Search for a game by title or platform</div>`; }
    else { html += `<div style="grid-column:1/-1;text-align:center;padding:40px 0;color:var(--text-secondary);">No games found matching "<strong>${query}</strong>"</div>`; }
  } else { results.forEach(g => { html += buildGridCard(g); }); }
  html += `</div></div>`;
  area.innerHTML = html;
}

// ============================================================
//  SETTINGS
// ============================================================
function renderSettings(area) {
  const customCss = localStorage.getItem(CUSTOM_CSS_KEY) || '';
  const customJs = localStorage.getItem(CUSTOM_JS_KEY) || '';
  const customHtml = localStorage.getItem(CUSTOM_HTML_KEY) || '';
  const currentTheme = JSON.parse(localStorage.getItem(COLOR_THEME_KEY) || '{}');
  
  const html = `
    <div style="padding:16px 14px; max-width: 100%;">
      <div style="background:var(--surface); border:1px solid var(--divider); border-radius:12px; padding:16px; margin-bottom:14px;">
        <div style="font-weight:600; margin-bottom:12px;">Theme Colors</div>
        <div style="display:flex; gap:10px; margin-bottom:16px;">
          <button onclick="window.applyTheme(PRESET_THEMES['black'])" 
                  style="flex:1; padding:10px; border-radius:8px; border:1px solid var(--divider); 
                         background:#000; color:#fff; cursor:pointer; font-weight:600; font-size:14px;">
            Black
          </button>
          <button onclick="window.applyTheme(PRESET_THEMES['white'])" 
                  style="flex:1; padding:10px; border-radius:8px; border:1px solid var(--divider); 
                         background:#fff; color:#000; cursor:pointer; font-weight:600; font-size:14px;">
            White
          </button>
        </div>
        <div style="display:grid; grid-template-columns: repeat(8, 1fr); border:1px solid var(--divider); border-radius:8px; overflow:hidden; margin-bottom:14px;">
          ${MAIN_COLORS.map(color => {
            const isActive = currentTheme.accent === color.hex;
            return `
              <div class="theme-box ${isActive ? 'active' : ''}" 
                   data-hex="${color.hex}"
                   onclick="window.applyMainColorTheme('${color.hex}')"
                   style="aspect-ratio:1; background:${color.hex}; 
                          cursor:pointer; transition: all 0.15s ease;
                          ${isActive ? 'border: 2px solid #ffffff;' : 'border: 2px solid transparent;'}
                          box-sizing:border-box;">
              </div>
            `;
          }).join('')}
        </div>
        <div style="display:flex; gap:10px; align-items:center; justify-content:center;">
          <label style="font-size:12px; color:var(--text-secondary);">Hex:</label>
          <input type="text" id="hexInput" value="${currentTheme.accent || '#ffffff'}" 
                 style="padding:6px 10px; border:1px solid var(--divider); border-radius:6px; background:var(--surface2); color:var(--text); font-family:monospace; font-size:13px; width:80px;"
                 oninput="window.updatePreviewFromHex(this.value)">
          <div id="colorPreview" style="width:32px; height:32px; border-radius:8px; background:${currentTheme.accent || '#ffffff'}; border:1px solid var(--divider);"></div>
          <button onclick="window.applyCustomHexColor()" style="padding:6px 14px; border-radius:8px; background:var(--accent); color:var(--bg); border:none; cursor:pointer; font-size:12px; font-family:'Outfit',sans-serif;">Apply</button>
        </div>
      </div>

      <div style="background:var(--surface); border:1px solid var(--divider); border-radius:12px; padding:16px; margin-bottom:14px;">
        <div style="font-weight:600; margin-bottom:12px;">Text Color</div>
        <div style="display:flex; gap:10px; margin-bottom:16px;">
          <button onclick="window.applyTextColor('#ffffff')" 
                  style="flex:1; padding:10px; border-radius:8px; border:1px solid var(--divider); 
                         background:#000; color:#fff; cursor:pointer; font-weight:600; font-size:14px;">
            White
          </button>
          <button onclick="window.applyTextColor('#000000')" 
                  style="flex:1; padding:10px; border-radius:8px; border:1px solid var(--divider); 
                         background:#fff; color:#000; cursor:pointer; font-weight:600; font-size:14px;">
            Black
          </button>
        </div>
        <div style="display:flex; gap:10px; align-items:center; justify-content:center;">
          <label style="font-size:12px; color:var(--text-secondary);">Hex:</label>
          <input type="text" id="textHexInput" value="${currentTheme.text || '#ffffff'}" 
                 style="padding:6px 10px; border:1px solid var(--divider); border-radius:6px; background:var(--surface2); color:var(--text); font-family:monospace; font-size:13px; width:80px;"
                 oninput="window.updateTextPreviewFromHex(this.value)">
          <div id="textColorPreview" style="width:32px; height:32px; border-radius:8px; background:${currentTheme.text || '#ffffff'}; border:1px solid var(--divider);"></div>
          <button onclick="window.applyCustomTextColor()" style="padding:6px 14px; border-radius:8px; background:var(--accent); color:var(--bg); border:none; cursor:pointer; font-size:12px; font-family:'Outfit',sans-serif;">Apply</button>
        </div>
      </div>

      <div style="background:var(--surface); border:1px solid var(--divider); border-radius:12px; padding:16px; margin-bottom:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <div style="font-weight:600; display:flex; align-items:center; gap:8px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg> Live HTML Editor</div>
          <div style="display:flex; gap:6px;"><button onclick="undoHtml()" style="background:#e0e0e0; border:1px solid var(--divider); padding:4px 12px; border-radius:6px; cursor:pointer; font-size:11px; color:#333;">Undo</button><button onclick="resetHtml()" style="background:var(--surface2); border:1px solid var(--divider); padding:4px 12px; border-radius:6px; cursor:pointer; font-size:11px;">Reset</button><button onclick="applyHtml()" style="background:var(--accent); color:var(--bg); border:none; padding:4px 12px; border-radius:6px; cursor:pointer; font-size:11px;">Apply</button></div>
        </div>
        <textarea id="htmlEditor" style="width:100%; height:150px; padding:10px; border:1px solid var(--divider); border-radius:8px; background:var(--surface2); color:var(--text); font-family:'Courier New',monospace; font-size:13px; resize:vertical;">${customHtml}</textarea>
        <div style="font-size:11px; color:var(--text-secondary); margin-top:6px;">Write HTML and click Apply. Injects into #customHtmlContainer.</div>
      </div>
      
      <div style="background:var(--surface); border:1px solid var(--divider); border-radius:12px; padding:16px; margin-bottom:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <div style="font-weight:600; display:flex; align-items:center; gap:8px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.37 2.63L21 5.25l-8.5 8.5L9 11.25l8.5-8.5z"/><path d="M3.5 21l2-4 4-2-6 6z"/></svg> Live CSS Editor</div>
          <div style="display:flex; gap:6px;"><button onclick="undoCss()" style="background:#e0e0e0; border:1px solid var(--divider); padding:4px 12px; border-radius:6px; cursor:pointer; font-size:11px; color:#333;">Undo</button><button onclick="resetCss()" style="background:var(--surface2); border:1px solid var(--divider); padding:4px 12px; border-radius:6px; cursor:pointer; font-size:11px;">Reset</button><button onclick="applyCss()" style="background:var(--accent); color:var(--bg); border:none; padding:4px 12px; border-radius:6px; cursor:pointer; font-size:11px;">Apply</button></div>
        </div>
        <textarea id="cssEditor" style="width:100%; height:150px; padding:10px; border:1px solid var(--divider); border-radius:8px; background:var(--surface2); color:var(--text); font-family:'Courier New',monospace; font-size:13px; resize:vertical;">${customCss}</textarea>
        <div style="font-size:11px; color:var(--text-secondary); margin-top:6px;">Write CSS and click Apply. Use Undo to revert styles.</div>
      </div>

      <div style="background:var(--surface); border:1px solid var(--divider); border-radius:12px; padding:16px; margin-bottom:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <div style="font-weight:600; display:flex; align-items:center; gap:8px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Live JS Editor</div>
          <div style="display:flex; gap:6px;"><button onclick="undoJs()" style="background:#e0e0e0; border:1px solid var(--divider); padding:4px 12px; border-radius:6px; cursor:pointer; font-size:11px; color:#333;">Undo</button><button onclick="resetJs()" style="background:var(--surface2); border:1px solid var(--divider); padding:4px 12px; border-radius:6px; cursor:pointer; font-size:11px;">Reset</button><button onclick="applyJs()" style="background:var(--accent); color:var(--bg); border:none; padding:4px 12px; border-radius:6px; cursor:pointer; font-size:11px;">Apply</button></div>
        </div>
        <textarea id="jsEditor" style="width:100%; height:150px; padding:10px; border:1px solid var(--divider); border-radius:8px; background:var(--surface2); color:var(--text); font-family:'Courier New',monospace; font-size:13px; resize:vertical;">${customJs}</textarea>
        <div style="font-size:11px; color:var(--text-secondary); margin-top:6px;">Write JS and click Apply. Use Undo to remove injected elements.</div>
      </div>

      <div style="background:var(--surface); border:1px solid var(--divider); border-radius:12px; padding:16px;">
        <div style="font-weight:600; margin-bottom:10px;">Data</div>
        <div style="display:flex; flex-wrap:wrap; gap:8px;"><button onclick="exportData()" style="background:var(--surface2); border:1px solid var(--divider); padding:6px 14px; border-radius:8px; cursor:pointer; font-size:12px;">Export Backup</button><button onclick="document.getElementById('importInput').click()" style="background:var(--surface2); border:1px solid var(--divider); padding:6px 14px; border-radius:8px; cursor:pointer; font-size:12px;">Import Backup</button><button onclick="clearAllData()" style="background:#d04040; color:#fff; border:none; padding:6px 14px; border-radius:8px; cursor:pointer; font-size:12px;">Clear All</button><button onclick="restoreDefaults()" style="background:#000; color:#fff; border:none; padding:6px 14px; border-radius:8px; cursor:pointer; font-size:12px;">Restore Defaults</button></div>
        <input type="file" id="importInput" accept=".json" style="display:none;" onchange="importData(this)" />
      </div>
    </div>
  `;
  area.innerHTML = html;
}

// ============================================================
//  COLOR THEME FUNCTIONS
// ============================================================
window.applyMainColorTheme = function(hex) {
  const theme = generateThemeFromMainColor(hex);
  window.applyTheme(theme);
  showToast('Theme applied', 'info');
};
window.updatePreviewFromHex = function(value) {
  let hex = value.trim();
  if (hex.startsWith('#')) hex = hex.substring(1);
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length === 6 && /^[0-9a-fA-F]+$/.test(hex)) {
    hex = '#' + hex;
    document.getElementById('colorPreview').style.background = hex;
  }
};
window.applyCustomHexColor = function() {
  const hex = document.getElementById('hexInput').value.trim();
  if (hex && /^#[0-9a-fA-F]{6}$/.test(hex)) {
    const theme = generateThemeFromMainColor(hex);
    window.applyTheme(theme);
    showToast('Custom theme applied', 'info');
  } else {
    showToast('Invalid hex color. Use #RRGGBB format.', 'error');
  }
};

// ============================================================
//  TEXT COLOR FUNCTIONS
// ============================================================
window.updateTextPreviewFromHex = function(value) {
  let hex = value.trim();
  if (hex.startsWith('#')) hex = hex.substring(1);
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length === 6 && /^[0-9a-fA-F]+$/.test(hex)) {
    hex = '#' + hex;
    document.getElementById('textColorPreview').style.background = hex;
  }
};
window.applyCustomTextColor = function() {
  const hex = document.getElementById('textHexInput').value.trim();
  if (hex && /^#[0-9a-fA-F]{6}$/.test(hex)) {
    window.applyTextColor(hex);
  } else {
    showToast('Invalid hex color. Use #RRGGBB format.', 'error');
  }
};
window.applyTextColor = applyTextColor;
window.PRESET_THEMES = PRESET_THEMES;

// ============================================================
//  EDITOR FUNCTIONS (HTML, CSS, JS)
// ============================================================
window.applyHtml = function() {
  const editor = document.getElementById('htmlEditor');
  if (!editor) return;
  const html = editor.value;
  localStorage.setItem(CUSTOM_HTML_KEY, html);
  const old = document.getElementById('customHtmlContainer');
  if (old) old.remove();
  if (html.trim()) {
    const container = document.createElement('div');
    container.id = 'customHtmlContainer';
    container.className = 'js-injected';
    container.innerHTML = html;
    document.body.appendChild(container);
    showToast('HTML applied', 'success');
  } else { showToast('HTML cleared', 'info'); }
};
window.undoHtml = function() {
  const container = document.getElementById('customHtmlContainer');
  if (container) container.remove();
  localStorage.removeItem(CUSTOM_HTML_KEY);
  const editor = document.getElementById('htmlEditor');
  if (editor) editor.value = '';
  showToast('HTML reverted', 'info');
};
window.resetHtml = function() { undoHtml(); };
window.applyCss = function() {
  const editor = document.getElementById('cssEditor');
  if (!editor) return;
  const css = editor.value;
  localStorage.setItem(CUSTOM_CSS_KEY, css);
  const old = document.getElementById('customCss');
  if (old) old.remove();
  if (css.trim()) {
    const style = document.createElement('style');
    style.id = 'customCss';
    style.textContent = css;
    document.head.appendChild(style);
    showToast('CSS applied', 'success');
  } else { showToast('CSS cleared', 'info'); }
};
window.undoCss = function() {
  const old = document.getElementById('customCss');
  if (old) old.remove();
  localStorage.removeItem(CUSTOM_CSS_KEY);
  const editor = document.getElementById('cssEditor');
  if (editor) editor.value = '';
  showToast('CSS reverted', 'info');
};
window.resetCss = function() { undoCss(); };
window.applyJs = function() {
  const editor = document.getElementById('jsEditor');
  if (!editor) return;
  const js = editor.value;
  localStorage.setItem(CUSTOM_JS_KEY, js);
  const old = document.getElementById('customJs');
  if (old) old.remove();
  undoJs();
  if (js.trim()) {
    const script = document.createElement('script');
    script.id = 'customJs';
    script.textContent = js;
    document.body.appendChild(script);
    showToast('JS applied', 'success');
  } else { showToast('JS cleared', 'info'); }
};
window.undoJs = function() {
  const testBtn = document.querySelector('button[style*="Test Button"]');
  if (testBtn) testBtn.remove();
  const injected = document.querySelectorAll('.js-injected');
  injected.forEach(el => el.remove());
  console.log('Cleaned up injected elements');
};
window.resetJs = function() {
  undoJs();
  localStorage.removeItem(CUSTOM_JS_KEY);
  const editor = document.getElementById('jsEditor');
  if (editor) editor.value = '';
  const old = document.getElementById('customJs');
  if (old) old.remove();
  showToast('JS reset', 'info');
};

// ============================================================
//  RESTORE DEFAULTS
// ============================================================
window.restoreDefaults = function() {
  showConfirm('Remove all custom HTML, CSS, JS, and reset the app to default state?', () => {
    localStorage.removeItem(CUSTOM_HTML_KEY); const htmlEl = document.getElementById('customHtmlContainer'); if (htmlEl) htmlEl.remove();
    localStorage.removeItem(CUSTOM_CSS_KEY); const cssEl = document.getElementById('customCss'); if (cssEl) cssEl.remove();
    localStorage.removeItem(CUSTOM_JS_KEY); const jsEl = document.getElementById('customJs'); if (jsEl) jsEl.remove();
    localStorage.removeItem(COLOR_THEME_KEY);
    localStorage.removeItem(TEXT_COLOR_KEY);
    const injected = document.querySelectorAll('.js-injected'); injected.forEach(el => el.remove());
    const htmlEditor = document.getElementById('htmlEditor'); if (htmlEditor) htmlEditor.value = '';
    const cssEditor = document.getElementById('cssEditor'); if (cssEditor) cssEditor.value = '';
    const jsEditor = document.getElementById('jsEditor'); if (jsEditor) jsEditor.value = '';
    window.applyTheme(PRESET_THEMES['black']);
    showToast('App restored to default. Reloading...', 'success');
    setTimeout(() => { location.reload(); }, 800);
  });
};

// ============================================================
//  EXPORT / IMPORT / CLEAR (FIXED EXPORT FOR HERMIT/WEBVIEW)
// ============================================================
function exportData() {
  const data = { 
    games: window.games || [], 
    collections: window.collections || [], 
    theme: localStorage.getItem(COLOR_THEME_KEY), 
    text: localStorage.getItem(TEXT_COLOR_KEY) 
  };
  
  const jsonString = JSON.stringify(data, null, 2);

  // NEW METHOD: Copy to clipboard (Works in Hermit/WebView)
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(jsonString).then(() => {
      showToast('✅ Backup copied to clipboard! Paste it into a text file.', 'success');
    }).catch(() => {
      fallbackExport(jsonString);
    });
  } else {
    fallbackExport(jsonString);
  }
}

// Fallback for older browsers or if clipboard fails
function fallbackExport(jsonString) {
  // Create a temporary textarea to copy the text
  const textarea = document.createElement('textarea');
  textarea.value = jsonString;
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    showToast('✅ Backup copied to clipboard!', 'success');
  } catch (err) {
    showToast('❌ Could not copy. Here is your data (see console).', 'error');
    console.log("MANUAL BACKUP DATA:", jsonString);
  }
  document.body.removeChild(textarea);
}

function importData(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    try {
      const data = JSON.parse(ev.target.result);
      if (data.games) { window.games = data.games; save(); }
      if (data.collections) { window.collections = data.collections; saveCollections(); }
      if (data.theme) { localStorage.setItem(COLOR_THEME_KEY, data.theme); const theme = JSON.parse(data.theme); window.applyTheme(theme); }
      if (data.text) { localStorage.setItem(TEXT_COLOR_KEY, data.text); window.applyTextColor(data.text); }
      render(); showToast('Import successful', 'success');
    } catch (err) { showToast('Invalid backup file', 'error'); }
  }; reader.readAsText(file); input.value = '';
}
function clearAllData() {
  showConfirm('Delete ALL games and collections permanently? This cannot be undone.', () => { window.games = []; window.collections = []; save(); saveCollections(); render(); showToast('All data cleared', 'info'); });
}

// ============================================================
//  APPLY SAVED CODE ON STARTUP
// ============================================================
function applySavedHtml() {
  const html = localStorage.getItem(CUSTOM_HTML_KEY);
  if (html && html.trim()) {
    const old = document.getElementById('customHtmlContainer'); if (old) old.remove();
    const container = document.createElement('div'); container.id = 'customHtmlContainer'; container.className = 'js-injected'; container.innerHTML = html; document.body.appendChild(container);
  }
}
function applySavedCss() {
  const css = localStorage.getItem(CUSTOM_CSS_KEY);
  if (css && css.trim()) {
    const old = document.getElementById('customCss'); if (old) old.remove();
    const style = document.createElement('style'); style.id = 'customCss'; style.textContent = css; document.head.appendChild(style);
  }
}
function applySavedJs() {
  const js = localStorage.getItem(CUSTOM_JS_KEY);
  if (js && js.trim()) {
    const old = document.getElementById('customJs'); if (old) old.remove();
    const script = document.createElement('script'); script.id = 'customJs'; script.textContent = js; document.body.appendChild(script);
  }
}

// ============================================================
//  MODAL & DETAIL
// ============================================================
let editingId = null; let currentRating = 0; let coverDataUrl = null;
function updateStars() { document.querySelectorAll('#starPicker span').forEach((span, i) => { span.classList.toggle('on', i < currentRating); }); }
window.openEditModal = function(id) {
  const gList = window.games || [];
  const cList = window.collections || [];
  const g = id ? gList.find(x => x.id === id) : null;
  editingId = id || null; currentRating = g ? (g.rating || 0) : 0; coverDataUrl = g ? g.cover : null;
  document.getElementById('editModalTitle').textContent = id ? 'Edit Game' : 'Add Game';
  document.getElementById('fTitle').value = g ? g.title : ''; document.getElementById('fPlatform').value = g ? (g.platform||'') : '';
  document.getElementById('fEmulator').value = g ? (g.emulator||'') : ''; document.getElementById('fPerformance').value = g ? (g.performance||'') : '';
  document.getElementById('fStatus').value = g ? (g.status||'') : ''; document.getElementById('fNotes').value = g ? (g.notes||'') : '';
  document.getElementById('btnDelete').classList.toggle('hidden', !id);
  const collEl = document.getElementById('fCollection'); collEl.innerHTML = '<option value="">None</option>' + cList.map(c => `<option value="${c.id}" ${g && g.collection === c.id ? 'selected' : ''}>${c.name}</option>`).join('');
  const favEl = document.getElementById('fFavorite'); if (g && g.favorite) favEl.classList.add('favorite-active'); else favEl.classList.remove('favorite-active');
  updateStars(); document.getElementById('editModal').classList.add('open');
};
document.getElementById('editModal').addEventListener('click', function(e) { if (e.target === this) window.closeEditModal(); });
document.querySelectorAll('#starPicker span').forEach((span, i) => { span.addEventListener('click', function() { currentRating = i + 1; updateStars(); }); });
document.getElementById('fFavorite').addEventListener('click', function(e) { e.stopPropagation(); this.classList.toggle('favorite-active'); });
document.getElementById('fCoverFile').addEventListener('change', function(e) { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = function(ev) { coverDataUrl = ev.target.result; }; reader.readAsDataURL(file); });
document.getElementById('btnSave').addEventListener('click', function() {
  const title = document.getElementById('fTitle').value.trim(); if (!title) return;
  let gList = window.games || [];
  const game = { id: editingId || Date.now().toString(36), title: title, cover: coverDataUrl || (editingId ? gList.find(g => g.id === editingId)?.cover : '') || '', platform: document.getElementById('fPlatform').value, emulator: document.getElementById('fEmulator').value, performance: document.getElementById('fPerformance').value, status: document.getElementById('fStatus').value, rating: currentRating, notes: document.getElementById('fNotes').value.trim(), favorite: document.getElementById('fFavorite').classList.contains('favorite-active') || false, collection: document.getElementById('fCollection').value || '' };
  if (editingId) { const idx = gList.findIndex(g => g.id === editingId); gList[idx] = game; } else { gList.push(game); }
  window.games = gList;
  save(); window.closeEditModal(); showToast('Game saved successfully', 'success');
  setTimeout(() => { document.querySelectorAll('.bottom-nav .nav-tab').forEach(b => b.classList.remove('active')); document.getElementById('navLibrary').classList.add('active'); render(); }, 500);
});
document.getElementById('btnDelete').addEventListener('click', function() {
  if (!editingId) return;
  showConfirm('Delete this game permanently?', () => { let gList = window.games || []; gList = gList.filter(g => g.id !== editingId); window.games = gList; save(); window.closeEditModal(); showToast('Game deleted', 'info');
  setTimeout(() => { document.querySelectorAll('.bottom-nav .nav-tab').forEach(b => b.classList.remove('active')); document.getElementById('navLibrary').classList.add('active'); render(); }, 500); });
});
function openDetail(id) {
  const gList = window.games || [];
  const g = gList.find(x => x.id === id); if (!g) return;
  document.getElementById('dName').textContent = g.title; document.getElementById('dPlatform').textContent = g.platform || '—'; document.getElementById('dEmulator').textContent = g.emulator || '—'; document.getElementById('dPerf').textContent = g.performance || '—'; document.getElementById('dStatus').textContent = g.status || '—'; document.getElementById('dRating').textContent = g.rating ? '★'.repeat(g.rating) + '☆'.repeat(5 - g.rating) : '—'; document.getElementById('dNotes').textContent = g.notes || '';
  const coverImg = document.getElementById('dCover'); const placeholder = document.getElementById('dPlaceholder');
  if (g.cover) { coverImg.src = g.cover; coverImg.style.display = 'block'; placeholder.style.display = 'none'; } else { coverImg.style.display = 'none'; placeholder.style.display = 'flex'; }
  document.getElementById('dEditBtn').onclick = () => { window.closeDetail(); window.openEditModal(g.id); };
  document.getElementById('detailSheet').classList.add('open'); document.getElementById('overlayBg').classList.add('show');
}

// ============================================================
//  START THE APP
// ============================================================
function initializeApp() {
  // Apply saved theme first
  const savedTheme = localStorage.getItem(COLOR_THEME_KEY);
  if (savedTheme) {
    try {
      const theme = JSON.parse(savedTheme);
      window.applyTheme(theme);
    } catch (e) {
      window.applyTheme(PRESET_THEMES['black']);
    }
  } else {
    window.applyTheme(PRESET_THEMES['black']);
  }

  const navTabs = document.querySelectorAll('.bottom-nav .nav-tab');
  navTabs.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const id = this.id;
      if (id === 'navAdd') { window.openEditModal(); return; }
      navTabs.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      render();
    });
  });
  
  document.getElementById('btnDarkMode').addEventListener('click', function() {
    const currentTheme = JSON.parse(localStorage.getItem(COLOR_THEME_KEY) || '{}');
    const isDark = currentTheme.bg === '#000000';
    const newTheme = isDark ? PRESET_THEMES['white'] : PRESET_THEMES['black'];
    window.applyTheme(newTheme);
    showToast(isDark ? 'White mode on' : 'Black mode on', 'success');
  });
  
  document.getElementById('btnViewToggle').addEventListener('click', function() {
    this.dataset.view = this.dataset.view === 'list' ? 'grid' : 'list';
    render();
  });

  // Apply saved customizations
  setTimeout(() => {
    applySavedCss();
    applySavedJs();
    applySavedHtml();
  }, 150);

  // Wait for IndexedDB
  if (window.dbReady) {
    render();
  } else {
    window.addEventListener('dbReady', () => {
      render();
    });
  }
  console.log('App initialized!');
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

console.log('app.js fully loaded');