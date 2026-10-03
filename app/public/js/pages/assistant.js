import { api } from '../api.js';
import { html, mount, initShell, $ } from '../ui.js';

const chat = [];

function answerView(a) {
  return html`
    <div class="msg">
      <p style="margin:0">${a.text}</p>
      ${a.bullets.length ? html`<ul>${a.bullets.map((b) => html`<li>${b}</li>`)}</ul>` : ''}
      ${a.citations.length ? html`<div class="cites" aria-label="Sources">${a.citations.map((c) => html`<code>${c}</code>`)}</div>` : ''}
      <p class="small muted" style="margin:8px 0 0">${a.sample_label} Live warnings: ${a.official_sources.map((s, i) => html`${i ? ' · ' : ''}<a href="${s.url}" target="_blank" rel="noopener">${s.name}</a>`)}</p>
    </div>`;
}

function render() {
  mount('#chat', chat.length ? chat.map((m) => (m.me ? html`<div class="msg me">${m.text}</div>` : answerView(m))) : html`<p class="empty">Try one of the questions below.</p>`);
  const last = $('#chat').lastElementChild;
  if (last) last.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

async function ask(question) {
  chat.push({ me: true, text: question });
  render();
  try {
    const a = await api.post('/assistant', { question });
    chat.push(a);
    if (a.suggestions?.length) renderSuggestions(a.suggestions);
  } catch (e) {
    chat.push({ text: e.message, bullets: [], citations: [], sample_label: '', official_sources: [] });
  }
  render();
}

function renderSuggestions(list) {
  mount('#suggestions', list.map((s) => html`<button class="chip" type="button" data-q="${s}">${s}</button>`));
}

async function main() {
  const [{ simulation }, { suggestions }] = await Promise.all([api.get('/simulate/typhoon'), api.get('/assistant/suggestions')]);
  initShell('chat', { simulation });
  renderSuggestions(suggestions);
  render();
  $('#suggestions').addEventListener('click', (e) => {
    const b = e.target.closest('[data-q]');
    if (b) ask(b.dataset.q);
  });
  $('#ask').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = $('#q').value.trim();
    if (!q) return;
    $('#q').value = '';
    ask(q);
  });
}

main();
