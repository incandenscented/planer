// 1 метр = 100 пикселей
const SCALE = 100;

const room = document.getElementById('room');

const LIB = {
    sofa:     { name: 'Диван',   w: 2, h: 1,   color: '#4a90e2' },
    table:    { name: 'Стол',    w: 1, h: 1,   color: '#8b572a' },
    wardrobe: { name: 'Шкаф',    w: 1, h: 0.5, color: '#7f8c8d' },
    bed:      { name: 'Кровать', w: 2, h: 1.5, color: '#9b59b6' }
};

const CUSTOM_COLORS = ['#e67e22', '#16a085', '#c0392b', '#8e44ad', '#2980b9', '#27ae60'];
let colorIndex = 0;

let roomW = 5;
let roomH = 4;

function updateRoomSize() {
    room.style.width  = (roomW * SCALE) + 'px';
    room.style.height = (roomH * SCALE) + 'px';
}

// === ИЗМЕНЕНИЕ РАЗМЕРА КОМНАТЫ ===
const applyBtn = document.getElementById('apply-room');

function applyRoomSize() {
    let w = parseFloat(document.getElementById('room-w').value);
    let h = parseFloat(document.getElementById('room-h').value);

    if (isNaN(w) || w < 2) w = 2;
    if (isNaN(h) || h < 2) h = 2;
    if (w > 8) w = 8;
    if (h > 8) h = 8;

    roomW = w;
    roomH = h;
    document.getElementById('room-w').value = w;
    document.getElementById('room-h').value = h;

    updateRoomSize();
    room.querySelectorAll('.furniture').forEach(clampItem);
    saveState();
}

// Слушаем и клик, и тач
applyBtn.addEventListener('click', applyRoomSize);
applyBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    applyRoomSize();
});

function clampItem(el) {
    const w = parseFloat(el.dataset.w);
    const h = parseFloat(el.dataset.h);

    let left = el.offsetLeft;
    let top  = el.offsetTop;

    const maxLeft = room.clientWidth  - w * SCALE;
    const maxTop  = room.clientHeight - h * SCALE;

    if (maxLeft < 0) { left = 0; }
    else if (left > maxLeft) { left = maxLeft; }

    if (maxTop < 0) { top = 0; }
    else if (top > maxTop) { top = maxTop; }

    if (left < 0) left = 0;
    if (top  < 0) top  = 0;

    left = Math.round(left / 50) * 50;
    top  = Math.round(top  / 50) * 50;

    el.style.left = left + 'px';
    el.style.top
  = top + 'px';
}

function createFurnitureElement(name, w, h, color) {
    const el = document.createElement('div');
    el.className = 'furniture';
    el.style.width  = (w * SCALE) + 'px';
    el.style.height = (h * SCALE) + 'px';
    el.style.background = color;
    el.dataset.name
 = name;
    el.dataset.w = w;
    el.dataset.h = h;

    const label = document.createElement('span');
    label.className = 'furniture-label';
    label.textContent = name;
    el.appendChild(label);

    // Кнопка поворота
    const rotateBtn = document.createElement('button');
    rotateBtn.className = 'rotate-btn';
    rotateBtn.textContent = '↻';
    rotateBtn.title = 'Повернуть на 90°';

    // Не даём кнопке запускать перетаскивание
    rotateBtn.addEventListener('mousedown', e => e.stopPropagation());
    rotateBtn.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });

    // Обработчик: и клик, и тач
    function doRotate(e) {
        e.stopPropagation();
        e.preventDefault();
        rotateItem(el);
    }
    rotateBtn.addEventListener('click', doRotate);
    rotateBtn.addEventListener('touchend', doRotate);

    el.appendChild(rotateBtn);

    makeDraggable(el);
    return el;
}

document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const t = LIB[btn.dataset.type];
        if (!t) return;
        const el = createFurnitureElement(t.name
, t.w, t.h, t.color);
        room.appendChild(el);
        saveState();
    });
});

// Своя мебель
const addCustomBtn = document.getElementById('add-custom');

function addCustom() {
    const name = document.getElementById('f-name').value.trim() || 'Мебель';
    let w = parseFloat(document.getElementById('f-w').value);
    let h = parseFloat(document.getElementById('f-h').value);

    if (isNaN(w) || w < 0.5) w = 0.5;
    if (isNaN(h) || h < 0.5) h = 0.5;
    if (w > 5) w = 5;
    if (h > 5) h = 5;

    const color = CUSTOM_
COLORS[colorIndex % CUSTOM_COLORS.length];
    colorIndex++;

    const el = createFurnitureElement(name, w, h, color);
    room.appendChild(el);
    document.getElementById('f-name').value = '';
    saveState();
}

addCustomBtn.addEventListener('click', addCustom);
addCustomBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    addCustom();
});

// === ПОВОРОТ ===
function rotateItem(el) {
    const oldW = parseFloat(el.dataset.w);
    const oldH = parseFloat(el.dataset.h);

    el.dataset.w = oldH;
    el.dataset.h = oldW;

    el.style.width  = (oldH * SCALE) + 'px';
    el.style.height = (oldW * SCALE) + 'px';

    clampItem(el);
    saveState();
}

// === ПЕРЕТАСКИВАНИЕ ===
function makeDraggable(el) {
    let startX = 0, startY = 0;
    let startLeft = 0, startTop = 0;

    function getPos(e) {
        if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    }

    function onStart(e) {
        // Если нажали на кнопку поворота — не начинаем перетаскивание
        if (e.target.classList.contains('rotate-btn')) return;

        e.preventDefault();
        const pos = getPos(e);
        startX = pos.x;
        startY = pos.y;
        startLeft = el.offsetLeft;
        startTop  = el.offsetTop;
        el.classList.add('dragging');

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
        document.addEventListener('touchcancel', onEnd);
    }

    function onMove(e) {
        e.preventDefault();
        const pos = getPos(e);
        const dx = pos.x - startX;
        const dy = pos.y - startY;

        const wM = parseFloat(el.dataset.w);
        const hM = parseFloat(el.dataset.h);

        let newLeft = startLeft + dx;
        let newTop  = startTop  + dy;

        newLeft = Math.round(newLeft / 50) * 50;
        newTop  = Math.round(newTop  / 50) * 50;

        const maxLeft = room.clientWidth  - wM * SCALE;
        const maxTop  = room.clientHeight - hM * SCALE;

        if (newLeft < 0) newLeft = 0;
        if (newTop  < 0) newTop  = 0;
        if (newLeft > maxLeft) newLeft = maxLeft;
        if (newTop  > maxTop)  newTop  = maxTop;

        el.style.left = newLeft + 'px';
        el.style.top
  = newTop  + 'px';
    }

    function onEnd() {
        el.classList.remove('dragging');
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onEnd);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
        document.removeEventListener('touchcancel', onEnd);
        saveState();
    }

    el.addEventListener('mousedown', onStart);
    el.addEventListener('touchstart', onStart, { passive: false });
}

// === ОЧИСТКА ===
document.getElementById('clear-btn').addEventListener('click', () => {
    if (!confirm('Удалить всю мебель?')) return;
    room.innerHTML = '';
    saveState();
});

// === СОХРАНЕНИЕ ===
function saveState() {
    const items = [];
    room.querySelectorAll('.furniture').forEach(el => {
        items.push({
            name: el.dataset.name
,
            w: parseFloat(el.dataset.w),
            h: parseFloat(el.dataset.h),
            color: el.style.background,
            left: el.style.left,
            top: el.style.top
        });
    });
    const state = { roomW, roomH, items };
    try {
        localStorage.setItem('planner-state', JSON.stringify(state));
    } catch (e) {}
}

function loadState() {
    const raw = localStorage.getItem('planner-state');
    if (!raw) return false;

    try {
        const state = JSON.parse(raw);
        roomW = state.roomW || 5;
        roomH = state.roomH || 4;

        document.getElementById('room-w').value = roomW;
        document.getElementById('room-h').value = roomH;
        updateRoomSize();

        (state.items || []).forEach(it => {
            const el = createFurnitureElement(it.name
, it.w, it.h, it.color);
            el.style.left = it.left;
            el.style.top
  = it.top
;
            room.appendChild(el);
        });
        return true;
    } catch (e) {
        return false;
    }
}

if (!loadState()) {
    updateRoomSize();
}
