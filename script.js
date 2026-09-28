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
