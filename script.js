// ============================================================
//   ПЛАНИРОВЩИК КВАРТИРЫ — с балконом, эргономикой и замером
// ============================================================

const SCALE = 100; // 1 м = 100 пикселей
const MIN_PASSAGE = 60; // 60 см = минимум для прохода

const room = document.getElementById('room');

// Готовая мебель
const LIB = {
    sofa:        { name: 'Диван',    w: 2,   h: 1,   color: '#4a90e2', shape: 'rounded' },
    armchair:    { name: 'Кресло',   w: 0.9, h: 0.9, color: '#e67e22', shape: 'rounded' },
    chair:       { name: 'Стул',     w: 0.5, h: 0.5, color: '#c0392b', shape: 'rounded' },
    table:       { name: 'Стол',     w: 1.2, h: 0.8, color: '#8b572a', shape: 'rect'    },
    table_round: { name: 'Круглый',  w: 1.2, h: 1.2, color: '#a0522d', shape: 'round'   },
    wardrobe:    { name: 'Шкаф',     w: 1.2, h: 0.6, color: '#7f8c8d', shape: 'rect'    },
    bed:         { name: 'Кровать',  w: 2,   h: 1.6, color: '#9b59b6', shape: 'rect'    },
    lamp:        { name: 'Торшер',   w: 0.4, h: 0.4, color: '#f39c12', shape: 'round'   },
    plant:       { name: 'Растение', w: 0.5, h: 0.5, color: '#27ae60', shape: 'round'   }
};

const CUSTOM_COLORS = ['#e67e22','#16a085','#c0392b','#8e44ad','#2980b9','#27ae60','#d35400'];
let colorIndex = 0;

let roomW = 6;
let roomH = 5;
let balcony = null;

// ============================================================
// 1. СЧЁТЧИК ПОСЕЩЕНИЙ
// ============================================================
(function initVisitCounter() {
    let visits = parseInt(localStorage.getItem('planner-visits') || '0', 10);
    visits++;
    localStorage.setItem('planner-visits', visits);
    const el = document.getElementById('visits-count');
    if (el) el.textContent = visits;
})();

// ============================================================
// 2. РАЗМЕР КОМНАТЫ
// ============================================================
function totalRoomSize() {
    let w = roomW;
    let h = roomH;
    if (balcony) {
        if (balcony.side === 'left' || balcony.side === 'right') w += balcony.depth;
        if (balcony.side === 'top'  || balcony.side === 'bottom') h += balcony.depth;
    }
    return { w, h };
}

function updateRoomSize() {
    const size = totalRoomSize();
    room.style.width  = (size.w * SCALE) + 'px';
    room.style.height = (size.h * SCALE) + 'px';
    renderBalcony();
}

function applyRoomSize() {
    let w = parseFloat(document.getElementById('room-w').value);
    let h = parseFloat(document.getElementById('room-h').value);
    if (isNaN(w) || w < 2) w = 2;
    if (isNaN(h) || h < 2) h = 2;
    if (w > 10) w = 10;
    if (h > 10) h = 10;

    roomW = w;
    roomH = h;
    document.getElementById('room-w').value = w;
    document.getElementById('room-h').value = h;

    updateRoomSize();
    room.querySelectorAll('.furniture').forEach(clampItem);
    saveState();
}
document.getElementById('apply-room').addEventListener('click', applyRoomSize);

// ============================================================
// 3. БАЛКОН
// ============================================================
function renderBalcony() {
    const old = room.querySelector('.balcony-zone');
    if (old) old.remove();
    if (!balcony) return;

    const zone = document.createElement('div');
    zone.className = 'balcony-zone';

    const d = balcony.depth * SCALE;
    const totalW = room.clientWidth;
    const totalH = room.clientHeight;

    if (balcony.side === 'top') {
        zone.style.cssText = 'top:0; left:0; width:' + totalW + 'px; height:' + d + 'px;';
    } else if (balcony.side === 'bottom') {
        zone.style.cssText = 'bottom:0; left:0; width:' + totalW + 'px; height:' + d + 'px;';
    } else if (balcony.side === 'left') {
        zone.style.cssText = 'top:0; left:0; width:' + d + 'px; height:' + totalH + 'px;';
    } else if (balcony.side === 'right') {
        zone.style.cssText = 'top:0; right:0; width:' + d + 'px; height:' + totalH + 'px;';
    }const label = document.createElement('div');
    label.className = 'balcony-label';
    label.textContent = 'Балкон (' + balcony.depth + ' м)';
    zone.appendChild(label);

    const opening = document.createElement('div');
    opening.className = 'opening';
    const op = balcony.opening * SCALE;

    if (balcony.side === 'top') {
        opening.style.cssText = 'bottom:-2px; left:50%; transform:translateX(-50%); width:' + op + 'px; height:8px;';
    } else if (balcony.side === 'bottom') {
        opening.style.cssText = 'top:-2px; left:50%; transform:translateX(-50%); width:' + op + 'px; height:8px;';
    } else if (balcony.side === 'left') {
        opening.style.cssText = 'right:-2px; top:50%; transform:translateY(-50%); height:' + op + 'px; width:8px;';
    } else if (balcony.side === 'right') {
        opening.style.cssText = 'left:-2px; top:50%; transform:translateY(-50%); height:' + op + 'px; width:8px;';
    }
    zone.appendChild(opening);

    room.appendChild(zone);
}

const balconyModal = document.getElementById('balcony-modal');
document.getElementById('btn-balcony').addEventListener('click', () => {
    if (balcony) {
        document.getElementById('balcony-side').value = balcony.side;
        document.getElementById('balcony-depth').value = balcony.depth;
        document.getElementById('balcony-opening').value = balcony.opening;
    }
    balconyModal.classList.remove('hidden');
});
document.getElementById('balcony-close').addEventListener('click', () => {
    balconyModal.classList.add('hidden');
});
document.getElementById('balcony-apply').addEventListener('click', () => {
    const side = document.getElementById('balcony-side').value;
    let depth = parseFloat(document.getElementById('balcony-depth').value);
    let opening = parseFloat(document.getElementById('balcony-opening').value);
    if (isNaN(depth) || depth < 0.8) depth = 0.8;
    if (depth > 3) depth = 3;
    if (isNaN(opening) || opening < 0.6) opening = 0.6;
    if (opening > 3) opening = 3;

    balcony = { side: side, depth: depth, opening: opening };
    updateRoomSize();
    saveState();
    balconyModal.classList.add('hidden');
});
document.getElementById('balcony-remove').addEventListener('click', () => {
    if (!balcony) { alert('Балкона пока нет.'); return; }
    if (!confirm('Удалить балкон?')) return;
    balcony = null;
    updateRoomSize();
    saveState();
    balconyModal.classList.add('hidden');
});

// ============================================================
// 4. УДЕРЖАТЬ В ГРАНИЦАХ
// ============================================================
function clampItem(el) {
    const wPx = parseFloat(el.dataset.w) * SCALE;
    const hPx = parseFloat(el.dataset.h) * SCALE;

    let left = el.offsetLeft;
    let top  = el.offsetTop;

    const maxLeft = room.clientWidth  - wPx;
    const maxTop  = room.clientHeight - hPx;

    if (maxLeft < 0) left = 0; else if (left > maxLeft) left = maxLeft;
    if (maxTop  < 0) top  = 0; else if (top  > maxTop)  top  = maxTop;

    if (left < 0) left = 0;
    if (top  < 0) top  = 0;

    left = Math.round(left / 50) * 50;
    top  = Math.round(top  / 50) * 50;

    el.style.left = left + 'px';
    el.style.top
  = top + 'px';
}

// ============================================================
// 5. ПРОВЕРКА И ПОИСК МЕСТА
// ============================================================
function checkFits(name, w, h) {
    const size = totalRoomSize();
    const fitsNormal  = (w <= size.w && h <= size.h);
    const fitsRotated = (h <= size.w && w <= size.h);
    if (!fitsNormal && !fitsRotated) {
        alert('«' + name + '» ' + w + '×' + h + ' м не влезает в комнату ' + size.w + '×' + size.h + ' м.');
        return false;
    }
    return true;
}

function findFreeSpot(wMeters, hMeters) {
    const stepPx = 50;
    const roomPxW = room.clientWidth;
    const roomPxH = room.clientHeight;
    const wPx = wMeters * SCALE;
    const hPx = hMeters * SCALE;

    for (let y = 0; y + hPx <= roomPxH; y += stepPx) {
        for (let x = 0; x + wPx <= roomPxW; x += stepPx) {
            let overlaps = false;
            room.querySelectorAll('.furniture').forEach(function(other) {
                if (overlaps) return;
                if (!(x + wPx <= other.offsetLeft ||
                      x >= other.offsetLeft + other.offsetWidth ||
                      y + hPx <= other.offsetTop ||
                      y >= other.offsetTop + other.offsetHeight)) {
                    overlaps = true;
                }
            });
            if (!overlaps) return { x: x, y: y };
        }
    }
    return { x: 0, y: 0 };
}

// ============================================================
// 6. СОЗДАНИЕ ПРЕДМЕТА
// ============================================================
function createFurnitureElement(name, w, h, color, shape, left, top) {
    const el = document.createElement('div');
    el.className = 'furniture';
    if (shape && shape !== 'rect') el.classList.add('shape-' + shape);

    el.style.width  = (w * SCALE) + 'px';
    el.style.height = (h * SCALE) + 'px';
    el.style.background = color;
    el.style.left = (left != null ? left : 0) + 'px';
    el.style.top
  = (top  != null ? top  : 0) + 'px';

    el.dataset.name
 = name;
    el.dataset.w = w;
    el.dataset.h = h;
    el.dataset.shape = shape || 'rect';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'furniture-name';
    nameSpan.textContent = name;
    el.appendChild(nameSpan);

    const sizeSpan = document.createElement('span');
    sizeSpan.className = 'furniture-size';
    sizeSpan.textContent = w + '×' + h + ' м';
    el.appendChild(sizeSpan);

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.textContent = '✕';
    delBtn.addEventListener('mousedown', function(e) { e.stopPropagation(); });
    delBtn.addEventListener('touchstart', function(e) { e.stopPropagation(); }, { passive: true });
    delBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        el.remove();
        saveState();
    });
    el.appendChild(delBtn);

    const rotBtn = document.createElement('button');
    rotBtn.className = 'rotate-btn';
    rotBtn.textContent = '↻';
    rotBtn.addEventListener('mousedown', function(e) { e.stopPropagation(); });
    rotBtn.addEventListener('touchstart', function(e) { e.stopPropagation(); }, { passive: true });
    rotBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        rotateItem(el);
    });
    el.appendChild(rotBtn);

    makeDraggable(el);
    return el;
}

// ============================================================
// 7. ДОБАВЛЕНИЕ ГОТОВОЙ МЕБЕЛИ
// ============================================================
document.querySelectorAll('.tool-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
        const t = LIB[btn.dataset.type];
        if (!t) return;
        if (!checkFits(t.name
, t.w, t.h)) return;

        const position = findFreeSpot(t.w, t.h);
        const el = createFurnitureElement(t.name
, t.w, t.h, t.color, t.shape, position.x, position.y);
        room.appendChild(el);
        saveState();
    });
});

// ============================================================
// 8. ДОБАВЛЕНИЕ СВОЕЙ МЕБЕЛИ
// ============================================================
document.getElementById('add-custom').addEventListener('click', function() {
    const name = document.getElementById('f-name').value.trim() || 'Мебель';
    const shape = document.getElementById('f-shape').value;
    let w = parseFloat(document.getElementById('f-w').value);
    let h = parseFloat(document.getElementById('f-h').value);

    if (isNaN(w) || w < 0.5) w = 0.5;
    if (isNaN(h) || h < 0.5) h = 0.5;
    if (w > 5) w = 5;
    if (h > 5) h = 5;

    if (!checkFits(name, w, h)) return;

    const color = CUSTOM_COLORS[colorIndex % CUSTOM_COLORS.length];
    colorIndex++;

    const position = findFreeSpot(w, h);
    const el = createFurnitureElement(name, w, h, color, shape, position.x, position.y);
    room.appendChild(el);

    document.getElementById('f-name').value = '';
    saveState();
});

// ============================================================
// 9. ПОВОРОТ
// ============================================================
function rotateItem(el) {
    const oldW = parseFloat(el.dataset.w);
    const oldH = parseFloat(el.dataset.h);

    el.dataset.w = oldH;
    el.dataset.h = oldW;

    el.style.width  = (oldH * SCALE) + 'px';
    el.style.height = (oldW * SCALE) + 'px';

    const sizeEl = el.querySelector('.furniture-size');
    if (sizeEl) sizeEl.textContent = oldH + '×' + oldW + ' м';

    clampItem(el);
    saveState();
}

// ============================================================
// 10. ПЕРЕТАСКИВАНИЕ
// ============================================================
function makeDraggable(el) {
    let startX = 0, startY = 0, startLeft = 0, startTop = 0, isActive = false;

    function getPos(e) {
        if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        return { x: e.clientX, y: e.clientY };
    }

    function onStart(e) {
        if (e.target.classList.contains('rotate-btn') ||
            e.target.classList.contains('delete-btn')) return;
        e.preventDefault();
        const pos = getPos(e);
        startX = pos.x; startY = pos.y;
        startLeft = el.offsetLeft; startTop = el.offsetTop;
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

        const wPx = parseFloat(el.dataset.w) * SCALE;
        const hPx = parseFloat(el.dataset.h) * SCALE;

        let newLeft = Math.round((startLeft + dx) / 50) * 50;
        let newTop  = Math.round((startTop  + dy) / 50) * 50;

        const maxLeft = room.clientWidth  - wPx;
        const maxTop  = room.clientHeight - hPx;

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

// ============================================================
// 11. ЭРГОНОМИКА
// ============================================================
document.getElementById('btn-ergo').addEventListener('click', function() {
    const items = Array.from(room.querySelectorAll('.furniture'));
    items.forEach(function(el) { el.classList.remove('ergo-warning'); });

    if (items.length < 2) {
        alert('Добавьте минимум 2 предмета мебели для проверки.');
        return;
    }

    const violations = [];

    for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
            const a = items[i], b = items[j];
            const aL = a.offsetLeft, aT = a.offsetTop;
            const aR = aL + a.offsetWidth, aB = aT + a.offsetHeight;
            const bL = b.offsetLeft, bT = b.offsetTop;
            const bR = bL + b.offsetWidth, bB = bT + b.offsetHeight;

            const dx = Math.max(0, Math.max(aL, bL) - Math.min(aR, bR));
            const dy = Math.max(0, Math.max(aT, bT) - Math.min(aB, bB));

            const overlap  = (dx === 0 && dy === 0);
            const horizGap = (dy === 0 && dx > 0 && dx < MIN_PASSAGE);
            const vertGap  = (dx === 0 && dy > 0 && dy < MIN_PASSAGE);

            if (overlap) {
                a.classList.add('ergo-warning');
                b.classList.add('ergo-warning');
                violations.push('Пересечение: ' + a.dataset.name
 + ' ↔ ' + b.dataset.name
);
            } else if (horizGap) {
                a.classList.add('ergo-warning');
                b.classList.add('ergo-warning');
                violations.push('Проход ' + Math.round(dx) + ' см: ' + a.dataset.name
 + ' ↔ ' + b.dataset.name
);
            } else if (vertGap) {
                a.classList.add('ergo-warning');
                b.classList.add('ergo-warning');
                violations.push('Проход ' + Math.round(dy) + ' см: ' + a.dataset.name
 + ' ↔ ' + b.dataset.name
);
            }
        }
    }

    if (violations.length === 0) {
        alert('Эргономика в порядке! Все проходы между мебелью — не менее 60 см.');
    } else {
        alert('Найдено проблем: ' + violations.length + '\n\n' +
              violations.slice(0, 15).join('\n') +
              (violations.length > 15 ? '\n... и ещё ' + (violations.length - 15) : '') +
              '\n\nКрасной рамкой помечены проблемные предметы.');
    }
});

// ============================================================
// 12. ЗАМЕР ПО ФОТО
// ============================================================
const photoModal = document.getElementById('photo-modal');
const photoInput = document.getElementById('photo-input');
const photoImg = document.getElementById('photo-img');
const photoGrid = document.getElementById('photo-grid');
const photoContainer = document.getElementById('photo-container');
const pt1 = document.getElementById('pt1');
const pt2 = document.getElementById('pt2');
const photoInfo = document.getElementById('photo-info');
const photoDistLabel = document.getElementById('photo-dist-label');
const photoDist = document.getElementById('photo-dist');
const photoApply = document.getElementById('photo-apply');

let photoPoints = [];
let pixelDistance = 0;

document.getElementById('btn-photo').addEventListener('click', function() {
    photoModal.classList.remove('hidden');
});
document.getElementById('photo-close').addEventListener('click', function() {
    photoModal.classList.add('hidden');
});

photoInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    photoImg.src = url;
    photoImg.onload = function() {
        resetPhotoPoints();
        photoInfo.textContent = 'Кликните две точки на известном расстоянии';
    };
});

function resetPhotoPoints() {
    photoPoints = [];
    pixelDistance = 0;
    pt1.classList.remove('visible');
    pt2.classList.remove('visible');
    photoGrid.classList.remove('visible');
    photoDistLabel.classList.add('hidden');
    photoApply.classList.add('hidden');
    photoInfo.textContent = '';
}

document.getElementById('photo-reset').addEventListener('click', resetPhotoPoints);

photoContainer.addEventListener('click', function(e) {
    if (!photoImg.src) return;

    const rect = photoContainer.getBoundingClientRect();
    const x = e.clientX - rect.left + photoContainer.scrollLeft;
    const y = e.clientY - rect.top
  + photoContainer.scrollTop;

    if (photoPoints.length >= 2) {
        resetPhotoPoints();
    }

    photoPoints.push({ x: x, y: y });

    if (photoPoints.length === 1) {
        pt1.style.left = x + 'px';
        pt1.style.top
  = y + 'px';
        pt1.classList.add('visible');
        photoInfo.textContent ='Точка 1 установлена. Кликните вторую точку.';
    } else if (photoPoints.length === 2) {
        pt2.style.left = x + 'px';
        pt2.style.top
  = y + 'px';
        pt2.classList.add('visible');

        pixelDistance = Math.hypot(photoPoints[1].x - photoPoints[0].x, photoPoints[1].y - photoPoints[0].y);

        photoInfo.textContent = 'Расстояние между точками: ' + Math.round(pixelDistance) + ' px. Укажите реальную длину.';
        photoDistLabel.classList.remove('hidden');
        photoApply.classList.remove('hidden');
    }
});

photoApply.addEventListener('click', function() {
    const realMeters = parseFloat(photoDist.value);
    if (isNaN(realMeters) || realMeters <= 0) {
        alert('Введите корректное расстояние в метрах.');
        return;
    }
    if (pixelDistance <= 0) return;

    const pxPerMeter = pixelDistance / realMeters;
    photoGrid.classList.add('visible');
    photoGrid.style.backgroundSize = pxPerMeter + 'px ' + pxPerMeter + 'px';

    photoInfo.textContent = 'Масштаб применён! 1 метр = ' + Math.round(pxPerMeter) + ' пикселей. Одна клетка = 1 м.';
});

// ============================================================
// 13. СОХРАНЕНИЕ PNG
// ============================================================
document.getElementById('save-png').addEventListener('click', function() {
    const btns = document.querySelectorAll('.rotate-btn, .delete-btn');
    btns.forEach(function(b) { b.style.visibility = 'hidden'; });

    html2canvas(room, { backgroundColor: '#fafafa', scale: 2 }).then(function(canvas) {
        btns.forEach(function(b) { b.style.visibility = 'visible'; });
        const link = document.createElement('a');
        link.download
 = 'plan-kvartiry.png';
        link.href = canvas.toDataURL('image/png');
        link.click
();
    }).catch(function(err) {
        btns.forEach(function(b) { b.style.visibility = 'visible'; });
        alert('Не удалось сохранить картинку: ' + err.message);
    });
});

// ============================================================
// 14. ОЧИСТКА
// ============================================================
document.getElementById('clear-btn').addEventListener('click', function() {
    if (!confirm('Удалить всю мебель?')) return;
    room.querySelectorAll('.furniture').forEach(function(el) { el.remove(); });
    saveState();
});

// ============================================================
// 15. СОХРАНЕНИЕ / ЗАГРУЗКА
// ============================================================
function saveState() {
    const items = [];
    room.querySelectorAll('.furniture').forEach(function(el) {
        items.push({
            name: el.dataset.name
,
            w: parseFloat(el.dataset.w),
            h: parseFloat(el.dataset.h),
            color: el.style.background,
            shape: el.dataset.shape,
            left: el.style.left,
            top: el.style.top
        });
    });
    try {
        localStorage.setItem('planner-state-v2', JSON.stringify({
            roomW: roomW, roomH: roomH, balcony: balcony, items: items
        }));
    } catch (e) {}
}

function loadState() {
    const raw = localStorage.getItem('planner-state-v2');
    if (!raw) return false;
    try {
        const state = JSON.parse(raw);
        roomW = state.roomW || 6;
        roomH = state.roomH || 5;
        balcony = state.balcony || null;

        document.getElementById('room-w').value = roomW;
        document.getElementById('room-h').value = roomH;
        updateRoomSize();

        (state.items || []).forEach(function(it) {
            const el = createFurnitureElement(
                it.name
, it.w, it.h, it.color, it.shape,
                parseFloat(it.left), parseFloat(it.top
)
            );
            room.appendChild(el);
        });
        return true;
    } catch (e) { return false; }
}

if (!loadState()) {
    updateRoomSize();
}
