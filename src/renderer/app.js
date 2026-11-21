const connectCard = document.getElementById('connect-card');
const connectForm = document.getElementById('connect-form');
const rsnInput = document.getElementById('rsn-input');
const connectBtn = document.getElementById('connect-btn');
const connectStatus = document.getElementById('connect-status');
const connectError = document.getElementById('connect-error');

const accountCard = document.getElementById('account-card');
const accountRsn = document.getElementById('account-rsn');
const statLevel = document.getElementById('stat-level');
const statXp = document.getElementById('stat-xp');
const statFetched = document.getElementById('stat-fetched');
const refreshBtn = document.getElementById('refresh-btn');
const disconnectBtn = document.getElementById('disconnect-btn');
const accountError = document.getElementById('account-error');
const progressDetails = document.getElementById('progress-details');
const skillsGrid = document.getElementById('skills-grid');
const activitiesList = document.getElementById('activities-list');
const activitiesEmpty = document.getElementById('activities-empty');

// Display order for the 23 skills (hiscores also returns an "Overall" row,
// which is shown separately as total level/XP).
const SKILL_ORDER = [
  'attack', 'strength', 'defence', 'hitpoints', 'ranged', 'prayer', 'magic',
  'cooking', 'woodcutting', 'fletching', 'fishing', 'firemaking', 'crafting',
  'smithing', 'mining', 'herblore', 'agility', 'thieving', 'slayer', 'farming',
  'runecraft', 'hunter', 'construction', 'sailing',
];

const MAX_ACTIVITIES_SHOWN = 15;

function formatNumber(n) {
  return typeof n === 'number' ? n.toLocaleString('en-US') : '–';
}

function formatFetchedAt(iso) {
  if (!iso) return '–';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '–' : d.toLocaleString();
}

function renderConnectForm(account) {
  const connected = account?.status === 'connected' && account.progress;
  connectCard.classList.toggle('hidden', connected);

  if (account?.rsn) rsnInput.value = account.rsn;
  connectStatus.textContent = account?.status === 'connecting' ? 'Fetching account progress…' : '';
  connectBtn.disabled = account?.status === 'connecting';

  if (account?.status === 'error') {
    connectError.textContent = account.error ?? 'Something went wrong.';
    connectError.classList.remove('hidden');
  } else {
    connectError.classList.add('hidden');
  }
}

function renderAccount(account) {
  const connected = account?.status === 'connected' && account.progress;
  accountCard.classList.toggle('hidden', !connected);
  connectCard.classList.toggle('hidden', connected);
  if (!connected) return;

  const { progress } = account;
  accountRsn.textContent = progress.rsn ?? account.rsn;
  statLevel.textContent = formatNumber(progress.totalLevel);
  statXp.textContent = formatNumber(progress.totalXp);
  statFetched.textContent = formatFetchedAt(progress.fetchedAt);
  accountError.classList.add('hidden');

  skillsGrid.replaceChildren();
  for (const name of SKILL_ORDER) {
    const skill = progress.skills?.[name];
    if (!skill) continue;
    const el = document.createElement('div');
    el.className = 'skill' + (skill.level >= 99 ? ' max' : '');
    const nameEl = document.createElement('div');
    nameEl.className = 'name';
    nameEl.textContent = name.charAt(0).toUpperCase() + name.slice(1);
    const lvlEl = document.createElement('div');
    lvlEl.className = 'lvl';
    lvlEl.textContent = `Lvl ${skill.level}`;
    el.append(nameEl, lvlEl);
    skillsGrid.appendChild(el);
  }

  const entries = Object.values(progress.activities ?? {})
    .filter((a) => a.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ACTIVITIES_SHOWN);

  activitiesList.replaceChildren();
  for (const a of entries) {
    const li = document.createElement('li');
    const nameEl = document.createElement('span');
    nameEl.textContent = a.name;
    const scoreEl = document.createElement('span');
    scoreEl.textContent = formatNumber(a.score);
    li.append(nameEl, scoreEl);
    activitiesList.appendChild(li);
  }
  activitiesEmpty.classList.toggle('hidden', entries.length > 0);
}

function render(state) {
  const account = state?.account;
  renderConnectForm(account);
  renderAccount(account);
}

async function init() {
  if (!window.suggestify) {
    connectError.textContent = 'Preload bridge unavailable.';
    connectError.classList.remove('hidden');
    return;
  }

  render(await window.suggestify.getState());
  window.suggestify.onStateChanged(render);

  connectForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    connectBtn.disabled = true;
    connectStatus.textContent = 'Fetching account progress…';
    connectError.classList.add('hidden');
    try {
      await window.suggestify.connectAccount(rsnInput.value);
    } catch (err) {
      connectError.textContent = err.message;
      connectError.classList.remove('hidden');
    } finally {
      connectBtn.disabled = false;
    }
  });

  refreshBtn.addEventListener('click', () => window.suggestify.refreshAccount());
  disconnectBtn.addEventListener('click', () => window.suggestify.disconnectAccount());
}

init();
