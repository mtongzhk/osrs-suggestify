const stateEl = document.getElementById('state');
const pingEl = document.getElementById('ping-result');
const pingBtn = document.getElementById('ping-btn');

function render(state) {
  stateEl.textContent = JSON.stringify(state, null, 2);
}

async function init() {
  if (!window.suggestify) {
    stateEl.textContent = 'Preload bridge unavailable.';
    return;
  }

  render(await window.suggestify.getState());
  window.suggestify.onStateChanged(render);

  window.suggestify
    .ping()
    .then((res) => console.log('suggestify bridge OK:', JSON.stringify(res)))
    .catch((err) => console.error('suggestify ping failed:', err));

  pingBtn.addEventListener('click', async () => {
    try {
      const res = await window.suggestify.ping();
      pingEl.textContent = `pong (v${res.version})`;
    } catch (err) {
      pingEl.textContent = `ping failed: ${err.message}`;
    }
  });
}

init();
