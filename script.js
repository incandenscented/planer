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
document.getElementById('apply-room').addEventListener('click', applyRoomSize);

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

// === ПРОВЕРКА: ВЛЕЗАЕТ ЛИ МЕБЕЛЬ В КОМНАТУ ===
function checkFits(name, w, h) {
    if (w > roomW && h > roomH) {
        alert('«' + name + '» ' + w + '×' + h + ' м не влезает в комнату ' +
              roomW + '×' + roomH + ' м.\n\nУменьшите размер мебели или увеличьте комнату.');
        return false;
    }
    if (w > roomW && h > roomW) {
        alert('«' + name + '» шириной ' + w + ' м не влезает в комнату шириной ' + roomW + ' м.\n\n' +
              'Попробуйте повернуть предмет кнопкой ↻ или уменьшить размер.');
        return false;
    }
    if (w > roomW && h > roomH) {
        alert('«' + name + '» не влезает в комнату.');
        return false;
    }
    // Общий случай — мебель не влезает ни в одном положении
    if (w > roomW && h > roomH) {
        alert('«' + name + '» не влезает в комнату.');
        return false;
    }
    // Проверяем оба варианта (как есть и повёрнутый)
    const fitsNormal    = (w <= roomW) && (h <= roomH);
    const fitsRotated   = (h <= roomW) && (w <= roomH);

    if (!fitsNormal && !fitsRotated) {
        alert('«' + name + '» ' + w + '×' + h + ' м не влезает в комнату ' +
              roomW + '×' + roomH + ' м.\n\nУменьшите мебель или увеличьте комнату.');
        return false;
    }
    return true;
}

// === ПОИСК СВОБОДНОГО МЕСТА ===
function findFreeSpot(wMeters, hMeters) {
    const stepPx = 50; // 0.5 м
    const roomPx = room.clientWidth;
    const roomPxH = room.clientHeight;
    const wPx = wMeters * SCALE;
    const hPx = hMeters * SCALE;

    for (let y = 0; y + hPx <= roomPxH; y += stepPx) {
        for (let x = 0; x + wPx <= roomPx; x += stepPx) {
            let overlaps = false;
            room.querySelectorAll('.furniture').forEach(other => {
                if (overlaps) return;
                const ox = other.offsetLeft;
                const oy = other.offsetTop;
                const ow = other.offsetWidth;
                const oh = other.offsetHeight;
                if (!(x + wPx <= ox || x >= ox + ow || y + hPx <= oy || y >= oy + oh)) {
                    overlaps = true;}
            });
            if (!overlaps) return { x, y };
        }
    }
    return { x: 0, y: 0 };
}

// === СОЗДАНИЕ ПРЕДМЕТА ===
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

    const rotateBtn = document.createElement('button');
    rotateBtn.className = 'rotate-btn';
    rotateBtn.textContent = '↻';
    rotateBtn.title = 'Повернуть на 90°';

    rotateBtn.addEventListener('mousedown', e => e.stopPropagation());
    rotateBtn.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });

    rotateBtn.onclick = function(e) {
        e.stopPropagation();
        e.preventDefault();
        rotateItem(el);
    };

    el.appendChild(rotateBtn);
    makeDraggable(el);
    return el;
}

// === ДОБАВЛЕНИЕ ГОТОВОЙ МЕБЕЛИ ===
document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.onclick = function() {
        const t = LIB[btn.dataset.type];
        if (!t) return;

        if (!checkFits(t.name
, t.w, t.h)) return;

        const el = createFurnitureElement(t.name
, t.w, t.h, t.color);
        const spot = findFreeSpot(t.w, t.h);
        el.style.left = spot.x + 'px';
        el.style.top
  = spot.y + 'px';
        room.appendChild(el);
        saveState();
    };
});

// === ДОБАВЛЕНИЕ СВОЕЙ МЕБЕЛИ ===
document.getElementById('add-custom').onclick = function() {
    const name = document.getElementById('f-name').value.trim() || 'Мебель';
    let w = parseFloat(document.getElementById('f-w').value);
    let h = parseFloat(document.getElementById('f-h').value);

    if (isNaN(w) || w < 0.5) w = 0.5;
    if (isNaN(h) || h < 0.5) h = 0.5;
    if (w > 5) w = 5;
    if (h > 5) h = 5;

    if (!checkFits(name, w, h)) return;

    const color = CUSTOM_COLORS[colorIndex % CUSTOM_COLORS.length];
    colorIndex++;

    const el = createFurnitureElement(name, w, h, color);
    const spot = findFreeSpot(w, h);
    el.style.left = spot.x + 'px';
    el.style.top
  = spot.y + 'px';
    room.appendChild(el);
    document.getElementById('f-name').value = '';
    saveState();
};

// === ПОВОРОТ ===
function rotateItem(el) {
    const oldW = parseFloat(el.dataset.w);
    const oldH = parseFloat(el.dataset.h);

    // Проверяем, влезет ли повёрнутый предмет
    if (oldW > roomW && oldH > roomH) {
        alert('После поворота предмет не влезет в комнату.');
        return;
    }

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
    let isActive = false;

    function getPos(e) {
        if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    }

    function onStart(e) {
        if (e.target.classList.contains('rotate-btn')) return;

        e.preventDefault();
        const pos = getPos(e);
        startX = pos.x;
        startY = pos.y;
        startLeft = el.offsetLeft;
        startTop  = el.offsetTop;
        isActive = true;
        el.classList.add('dragging');

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
        document.addEventListener('touchcancel', onEnd);
    }

    function onMove(e) {
        if (!isActive) return;
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
        isActive = false;
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
document.getElementById('clear-btn').onclick = function() {
    if (!confirm('Удалить всю мебель?')) return;
    room.innerHTML = '';
    saveState();
};

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
