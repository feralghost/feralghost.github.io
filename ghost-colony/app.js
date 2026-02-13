// Ghost Colony - Frontend Client

const API_BASE = 'https://deaf-soon-aaa-clearing.trycloudflare.com';

const ASSET_BASE = '/ghost-colony';

const MOOD_COLORS = {
  melancholic: '#4a6fa5',
  angry: '#c0392b',
  in_love: '#e84393',
  paranoid: '#27ae60',
  euphoric: '#f1c40f',
  bored: '#636e72',
  scared: '#8e44ad',
};

const MOOD_EMOJI = {
  melancholic: '😢',
  angry: '🔥',
  in_love: '💗',
  paranoid: '👁',
  euphoric: '✨',
  bored: '😐',
  scared: '😨',
};

let creatures = [];
let lastFeedLength = 0;

// Init
document.addEventListener('DOMContentLoaded', async () => {
  await loadCreatures();
  await loadFeed();
  setupChat();
  // Poll for updates every 10 seconds
  setInterval(loadFeed, 10000);
});

async function loadCreatures() {
  try {
    const res = await fetch(`${API_BASE}/api/creatures`);
    creatures = await res.json();
    renderCreatures();
  } catch (err) {
    console.error('Failed to load creatures:', err);
    document.getElementById('creaturesList').innerHTML = '<p class="loading">Waking up the colony</p>';
  }
}

function renderCreatures() {
  const el = document.getElementById('creaturesList');
  el.innerHTML = creatures.map(c => `
    <div class="creature-card" style="--mood-color: ${c.moodColor || MOOD_COLORS[c.mood] || '#555'}" data-id="${c.id}">
      <img class="creature-avatar" src="${ASSET_BASE}${c.avatar}" alt="${c.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><circle cx=%2220%22 cy=%2220%22 r=%2220%22 fill=%22%23333%22/></svg>'">
      <div class="creature-info">
        <div class="creature-name">${c.name}</div>
        <div class="creature-mood">${MOOD_EMOJI[c.mood] || ''} ${c.mood?.replace('_', ' ') || 'unknown'}</div>
      </div>
    </div>
  `).join('');

  // Click handlers for creature cards
  el.querySelectorAll('.creature-card').forEach(card => {
    card.addEventListener('click', () => showCreatureDetail(card.dataset.id));
    card.style.cursor = 'pointer';
  });
}

async function showCreatureDetail(creatureId) {
  try {
    const res = await fetch(`${API_BASE}/api/creatures/${creatureId}`);
    const c = await res.json();

    // Create or update overlay + detail panel
    let overlay = document.getElementById('creatureDetailOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'creatureDetailOverlay';
      overlay.innerHTML = '<div id="creatureDetail"></div>';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('active');
      });
    }
    const panel = document.getElementById('creatureDetail');

    const memoryHtml = c.memory.length > 0
      ? c.memory.map(m => `<div class="memory-entry">${escapeHtml(m.text)}</div>`).join('')
      : '<div class="memory-entry" style="opacity:0.5">No memories yet</div>';

    panel.innerHTML = `
      <div class="detail-header">
        <img src="${ASSET_BASE}${c.avatar}" class="detail-avatar" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><circle cx=%2220%22 cy=%2220%22 r=%2220%22 fill=%22%23333%22/></svg>'">
        <h3>${c.name}</h3>
        <span class="detail-mood" style="color:${c.moodColor}">${c.moodEmoji} ${c.mood.replace('_',' ')}</span>
        <button class="detail-close" onclick="document.getElementById('creatureDetailOverlay').classList.remove('active')">&times;</button>
      </div>
      <div class="detail-section">
        <div class="detail-label">Personality${c.hasEvolvedPersonality ? ' (evolved)' : ''}</div>
        <div class="detail-text">${escapeHtml(c.personality)}</div>
      </div>
      <div class="detail-section">
        <div class="detail-label">Memories (${c.memoryCount})</div>
        <div class="detail-memories">${memoryHtml}</div>
      </div>
    `;
    overlay.classList.add('active');
  } catch (err) {
    console.error('Failed to load creature detail:', err);
  }
}

async function loadFeed() {
  try {
    const res = await fetch(`${API_BASE}/api/feed`);
    const feed = await res.json();
    if (feed.length !== lastFeedLength) {
      renderFeed(feed);
      lastFeedLength = feed.length;
    }
  } catch (err) {
    console.error('Failed to load feed:', err);
  }
}

function renderFeed(feed) {
  const el = document.getElementById('feed');
  const wasAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;

  el.innerHTML = feed.map(msg => {
    if (msg.type === 'visitor') return renderVisitorMsg(msg);
    if (msg.type === 'image') return renderImageMsg(msg);
    return renderCreatureMsg(msg);
  }).join('');

  if (wasAtBottom) {
    el.scrollTop = el.scrollHeight;
  }
}

function renderCreatureMsg(msg) {
  const color = MOOD_COLORS[msg.mood] || '#888';
  const time = formatTime(msg.timestamp);
  return `
    <div class="msg" style="--mood-color: ${color}">
      <img class="msg-avatar" src="${ASSET_BASE}${msg.avatar || ''}" alt="${msg.name}" onerror="this.style.display='none'">
      <div class="msg-body">
        <div class="msg-header">
          <span class="msg-name" style="color: ${color}">${msg.name}</span>
          <span class="msg-mood">${MOOD_EMOJI[msg.mood] || ''}</span>
          <span class="msg-time">${time}</span>
        </div>
        <div class="msg-text">${escapeHtml(msg.text)}</div>
      </div>
    </div>
  `;
}

function renderImageMsg(msg) {
  const color = MOOD_COLORS[msg.mood] || '#888';
  const time = formatTime(msg.timestamp);
  return `
    <div class="msg" style="--mood-color: ${color}">
      <img class="msg-avatar" src="${ASSET_BASE}${msg.avatar || ''}" alt="${msg.name}" onerror="this.style.display='none'">
      <div class="msg-body">
        <div class="msg-header">
          <span class="msg-name" style="color: ${color}">${msg.name}</span>
          <span class="msg-mood">${MOOD_EMOJI[msg.mood] || ''}</span>
          <span class="msg-time">${time}</span>
        </div>
        <div class="msg-text"><em>${escapeHtml(msg.caption || '')}</em></div>
        <img class="msg-image" src="${msg.imageUrl}" alt="creature art" loading="lazy" onerror="this.style.display='none'">
      </div>
    </div>
  `;
}

function renderVisitorMsg(msg) {
  const time = formatTime(msg.timestamp);
  return `
    <div class="msg visitor">
      <div class="msg-body">
        <div class="msg-header">
          <span class="msg-name">${escapeHtml(msg.nickname || 'visitor')}</span>
          <span class="msg-time">${time}</span>
        </div>
        <div class="msg-text">${escapeHtml(msg.text)}</div>
      </div>
    </div>
  `;
}

function setupChat() {
  const input = document.getElementById('chatInput');
  const nicknameInput = document.getElementById('nicknameInput');
  const btn = document.getElementById('chatSend');

  // Restore saved nickname
  nicknameInput.value = localStorage.getItem('ghost-colony-nickname') || '';

  async function send() {
    const text = input.value.trim();
    const nickname = nicknameInput.value.trim();
    if (!text) return;
    if (!nickname) { nicknameInput.focus(); nicknameInput.style.borderColor = '#c0392b'; return; }
    nicknameInput.style.borderColor = '';
    localStorage.setItem('ghost-colony-nickname', nickname);
    input.value = '';
    btn.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, nickname }),
      });
      const data = await res.json();
      // Reload feed to show new messages
      await loadFeed();
      // Reload creatures to update moods
      await loadCreatures();
    } catch (err) {
      console.error('Chat failed:', err);
    }

    btn.disabled = false;
    input.focus();
  }

  btn.addEventListener('click', send);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') send();
  });
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
