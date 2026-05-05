/* app.js — Task Randomizer */

const STORAGE_KEY = 'rnd_tasks';
const CAT_CLASSES  = { work: 'cat-work', home: 'cat-home', health: 'cat-health', other: 'cat-other' };

let tasks       = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let activeFilter = 'all';

/* ── Persistence ───────────────────────────── */

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

/* ── Helpers ───────────────────────────────── */

function catBadge(cat) {
  if (!cat) return '';
  const cls = CAT_CLASSES[cat] || 'cat-other';
  return `<span class="task-cat ${cls}">${cat}</span>`;
}

function filteredTasks() {
  if (activeFilter === 'all') return tasks;
  return tasks.filter(t => t.cat === activeFilter);
}

/* ── Render tasks screen ───────────────────── */

function renderTasks() {
  const list  = document.getElementById('taskList');
  const count = document.getElementById('taskCount');
  const n     = tasks.length;

  count.textContent = n === 1 ? '1 task' : `${n} tasks`;

  const visible = filteredTasks();

  if (!visible.length) {
    list.innerHTML = `<p class="empty">${
      n ? 'No tasks in this category.' : 'No tasks yet — add one above.'
    }</p>`;
    return;
  }

  list.innerHTML = visible.map(t => {
    const realIndex = tasks.indexOf(t);
    return `
      <div class="task-item">
        <span class="task-name">${escapeHtml(t.name)}</span>
        ${catBadge(t.cat)}
        <button class="task-del" data-idx="${realIndex}" aria-label="Delete task">×</button>
      </div>`;
  }).join('');
}

/* ── Pick random task ──────────────────────── */

function pick() {
  const filterValue = document.getElementById('pickFilter').value;
  let pool;

  if      (filterValue === '')       pool = [...tasks];
  else if (filterValue === '__none') pool = tasks.filter(t => !t.cat);
  else                               pool = tasks.filter(t => t.cat === filterValue);

  const card = document.getElementById('resultCard');

  if (!pool.length) {
    document.getElementById('resultTask').textContent = 'No tasks in that category.';
    document.getElementById('resultCat').innerHTML    = '';
    card.style.display = 'block';
    return;
  }

  const t = pool[Math.floor(Math.random() * pool.length)];
  document.getElementById('resultTask').textContent = t.name;
  document.getElementById('resultCat').innerHTML    = catBadge(t.cat);
  card.style.display = 'block';
}

/* ── Screen navigation ─────────────────────── */

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');

  if (id === 'tasksScreen') renderTasks();
  if (id === 'homeScreen')  document.getElementById('resultCard').style.display = 'none';
}

/* ── Security helper ───────────────────────── */

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Event listeners ───────────────────────── */

// Navigation
document.getElementById('goTasks').addEventListener('click', () => showScreen('tasksScreen'));
document.getElementById('goHome').addEventListener('click',  () => showScreen('homeScreen'));

// Pick
document.getElementById('pickBtn').addEventListener('click', pick);

// Add task
document.getElementById('addBtn').addEventListener('click', () => {
  const input = document.getElementById('taskInput');
  const cat   = document.getElementById('catSelect').value;
  const name  = input.value.trim();
  if (!name) return;

  tasks.push({ name, cat });
  save();
  renderTasks();

  input.value = '';
  document.getElementById('catSelect').value = '';
  input.focus();
});

// Add on Enter key
document.getElementById('taskInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('addBtn').click();
});

// Delete task
document.getElementById('taskList').addEventListener('click', e => {
  const btn = e.target.closest('.task-del');
  if (!btn) return;
  tasks.splice(Number(btn.dataset.idx), 1);
  save();
  renderTasks();
});

// Filter pills
document.getElementById('filterRow').addEventListener('click', e => {
  const btn = e.target.closest('.cat-btn');
  if (!btn) return;
  activeFilter = btn.dataset.cat === 'all' ? 'all' : btn.dataset.cat;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.toggle('active', b === btn));
  renderTasks();
});

/* ── Service worker registration ───────────── */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => {
      console.warn('Service worker registration failed:', err);
    });
  });
}
