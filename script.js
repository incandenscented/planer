// ============================================================
//   ПЛАНИРОВЩИК КВАРТИРЫ
// ============================================================

const SCALE = 100;
const MIN_PASSAGE = 60;

const room = document.getElementById('room');

const LIB = {
    sofa:        { name: 'Диван',    w: 2,   h: 1,   height: 0.8, color: '#6366f1', shape: 'rounded' },
    armchair:    { name: 'Кресло',   w: 0.9, h: 0.9, height: 0.8, color: '#f59e0b', shape: 'rounded' },
    chair:       { name: 'Стул',     w: 0.5, h: 0.5, height: 0.9, color: '#dc2626', shape: 'rounded' },
    table:       { name: 'Стол',     w: 1.2, h: 0.8, height: 0.75, color: '#92400e', shape: 'rect'    },
    table_round: { name: 'Круглый',  w: 1.2, h: 1.2, height: 0.75, color: '#78350f', shape: 'round'   },
    wardrobe:    { name: 'Шкаф',     w: 1.2, h: 0.6, height: 2.2, color: '#64748b', shape: 'rect'    },
    bed:         { name: 'Кровать',  w: 2,   h: 1.6, height: 0.5, color: '#a855f7', shape: 'rect'    },
    bed_single:  { name: 'Кровать 1-сп', w: 1, h: 2, height: 0.5, color: '#8b5cf6', shape: 'rect'    },
    lamp:        { name: 'Торшер',   w: 0.4, h: 0.4, height: 1.6, color: '#eab308', shape: 'round'   },
    plant:       { name: 'Растение', w: 0.5, h: 0.5, height: 1.0, color: '#22c55e', shape: 'round'   },
    tv:          { name: 'ТВ',       w: 1.2, h: 0.1, height: 0.7, color: '#1f2937', shape: 'rect'    },
    bookshelf:   { name: 'Полка',    w: 0.8, h: 0.3, height: 1.8, color: '#a16207', shape: 'rect'    }
};

const CUSTOM_COLORS = ['#f97316','#14b8a6','#ef4444','#8b5cf6','#3b82f6','#22c55e','#f59e0b'];
let colorIndex = 0;

let roomW = 6, roomH = 5, roomWallHeight = 2.7;
let balcony = null;
let openings = [];
let currentTool = null;

// ===== 1. СЧЁТЧИК =====
(function () {
    let visits = parseInt(localStorage.getItem('planner-visits') || '0', 10);
    visits++;
    localStorage.setItem('planner-visits', visits);
    const el = document.getElementById('visits-count');
    if (el) el.textContent = visits;
})();

// ===== 2. ПРИВЕТСТВЕННОЕ ОКНО =====
const welcomeBtn = document.getElementById('welcome-start');
if (welcomeBtn) {
    welcomeBtn.addEventListener('click', function() {
        document.getElementById('welcome-modal').classList.add('hidden');
        try { localStorage.setItem('planner-welcomed', '1'); } catch(e) {}
    });
}
if (localStorage.getItem('planner-welcomed') === '1') {
    const wm = document.getElementById('welcome-modal');
    if (wm) wm.classList.add('hidden');
}

// ===== 3. РАЗМЕР КОМНАТЫ =====
function totalRoomSize() {
    let w = roomW, h = roomH;
    if (balcony) {
        if (balcony.side === 'left' || balcony.side === 'right') w += balcony.depth;
        if (balcony.side === 'top'  || balcony.side === 'bottom') h += balcony.depth;
    }
    return { w: w, h: h };
}

function updateRoomSize() {
    const size = totalRoomSize();
    room.style.width  = (size.w * SCALE) + 'px';
    room.style.height = (size.h * SCALE) + 'px';
    renderBalcony();
    renderOpenings2D();
}

function applyRoomSize() {
    let w = parseFloat(document.getElementById('room-w').value);
    let h = parseFloat(document.getElementById('room-h').value);
    let h2 = parseFloat(document.getElementById('room-h2').value);
    if (isNaN(w) || w < 2) w = 2;
    if (isNaN(h) || h < 2) h = 2;
    if (w > 10) w = 10;
    if (h > 10) h = 10;
    if (isNaN(h2) || h2 < 2.2) h2 = 2.2;
    if (h2 > 4) h2 = 4;

    roomW = w; roomH = h; roomWallHeight = h2;
    document.getElementById('room-w').value = w;
    document.getElementById('room-h').value = h;
    document.getElementById('room-h2').value = h2;

    updateRoomSize();
    room.querySelectorAll('.furniture').forEach(clampItem);
    saveState();
}
document.getElementById('apply-room').addEventListener('click', applyRoomSize);

// ===== 4. БАЛКОН =====
function renderBalcony() {
    const old = room.querySelector('.balcony-zone');
    if (old) old.remove();
    if (!balcony) return;

    const zone = document.createElement('div');
    zone.className = 'balcony-zone';
    const d = balcony.depth * SCALE;
    const totalW = room.clientWidth;
    const totalH = room.clientHeight;

    if (balcony.side === 'top')    zone.style.cssText = 'top:0; left:0; width:' + totalW + 'px; height:' + d + 'px;';
    if (balcony.side === 'bottom') zone.style.cssText = 'bottom:0; left:0; width:' + totalW + 'px; height:' + d + 'px;';
    if (balcony.side === 'left')   zone.style.cssText = 'top:0; left:0; width:' + d + 'px; height:' + totalH + 'px;';
    if (balcony.side === 'right')  zone.style.cssText = 'top:0; right:0; width:' + d + 'px; height:' + totalH + 'px;';

    const label = document.createElement('div');
    label.className = 'balcony-label';
    label.textContent = 'Балкон · ' + balcony.depth + ' м';
    zone.appendChild(label);
    room.appendChild(zone);
}

const balconyModal = document.getElementById('balcony-modal');
document.getElementById('btn-balcony').addEventListener('click', function() {
    if (balcony) {
        document.getElementById('balcony-side').value = balcony.side;
        document.getElementById('balcony-depth').value = balcony.depth;
        document.getElementById('balcony-opening').value = balcony.opening;
    }
    balconyModal.classList.remove('hidden');
});
document.getElementById('balcony-close').addEventListener('click', function() { balconyModal.classList.add('hidden'); });
document.getElementById('balcony-apply').addEventListener('click', function() {
    const side = document.getElementById('balcony-side').value;
    let depth = parseFloat(document.getElementById('balcony-depth').value);
    let opening = parseFloat(document.getElementById('balcony-opening').value);
    if (isNaN(depth) || depth < 0.8) depth = 0.8;
    if (depth > 3) depth = 3;
    if (isNaN(opening) || opening < 0.6) opening = 0.6;
    if (opening > 3) opening = 3;
    balcony = { side: side, depth: depth, opening: opening };
    updateRoomSize(); saveState();
    balconyModal.classList.add('hidden');
});
document.getElementById('balcony-remove').addEventListener('click', function() {
    if (!balcony) { alert('Балкона пока нет.'); return; }
    if (!confirm('Удалить балкон?')) return;
    balcony = null; updateRoomSize(); saveState();
    balconyModal.classList.add('hidden');
});

// ===== 5. ДВЕРИ И ОКНА =====
document.querySelectorAll('.tool-btn[data-mode]').forEach(function(btn) {
    btn.addEventListener('click', function() {
        const mode = btn.dataset.mode;
        if (currentTool === mode) {
            currentTool = null;
            document.querySelectorAll('.tool-btn[data-mode]').forEach(function(b){ b.classList.remove('active'); });
            room.style.cursor = 'default';
        } else {
            currentTool = mode;
            document.querySelectorAll('.tool-btn[data-mode]').forEach(function(b){ b.classList.remove('active'); });
            btn.classList.add('active');
            room.style.cursor = 'copy';
        }
    });
});

room.addEventListener('click', function(e) {
    if (!currentTool) return;
    if (e.target.classList.contains('furniture') || e.target.closest('.furniture')) return;

    const rect = room.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top
;

    const nearEdge = 15;
    let side = null, position = 0;

    if (Math.abs(y) < nearEdge) { side = 'top'; position = x / SCALE; }
    else if (Math.abs(y - rect.height) < nearEdge) { side = 'bottom'; position = x / SCALE; }
    else if (Math.abs(x) < nearEdge) { side = 'left'; position = y / SCALE; }
    else if (Math.abs(x - rect.width) < nearEdge) { side = 'right'; position = y / SCALE; }

    if (!side) {
        alert('Кликните ближе к стене комнаты.');
        return;
    }

    let width = parseFloat(document.getElementById('opening-width').value);
    if (isNaN(width) || width < 0.6) width = 0.6;
    if (width > 2.5) width = 2.5;
    const side_direction = document.getElementById('opening-side').value;

    openings.push({ type: currentTool, side: side, position: position, width: width, side_direction: side_direction });
    renderOpenings2D();
    saveState();
});

function renderOpenings2D() {
    room.querySelectorAll('.opening').forEach(function(el) { el.remove(); });
    openings.forEach(function(op, index) {
        const el = document.createElement('div');
        el.className = 'opening ' + op.type;
        const wPx = op.width * SCALE;

        if (op.side === 'top' || op.side === 'bottom') {
            el.style.width = wPx + 'px'; el.style.height = '8px';
            el.style.left = (op.position * SCALE - wPx / 2) + 'px';
            el.style.top
  = (op.side === 'top' ? '-5px' : (room.clientHeight - 3) + 'px');
        } else {
            el.style.width = '8px'; el.style.height = wPx + 'px';
            el.style.top
  = (op.position * SCALE - wPx / 2) + 'px';
            el.style.left = (op.side === 'left' ? '-5px' : (room.clientWidth - 3) + 'px');
        }
        el.style.pointerEvents = 'auto';
        el.style.cursor = 'pointer';
        el.title = 'Двойной клик — удалить';
        el.addEventListener('dblclick', function(e) {
            e.stopPropagation();
            if (confirm('Удалить?')) { openings.splice(index, 1); renderOpenings2D(); saveState(); }
        });
        room.appendChild(el);
    });
}

// ===== 6. УДЕРЖАТЬ В ГРАНИЦАХ =====
function clampItem(el) {
    const wPx = parseFloat(el.dataset.w) * SCALE;
    const hPx = parseFloat(el.dataset.h) * SCALE;
    let left = el.offsetLeft, top = el.offsetTop;
    const maxLeft = room.clientWidth - wPx;
    const maxTop  = room.clientHeight - hPx;
    if (maxLeft < 0) left = 0; else if (left > maxLeft) left = maxLeft;
    if (maxTop  < 0) top = 0; else if (top > maxTop) top = maxTop;
    if (left < 0) left = 0; if (top < 0) top = 0;
    left = Math.round(left / 50) * 50;
    top  = Math.round(top / 50) * 50;
    el.style.left = left + 'px';
    el.style.top
  = top + 'px';
}

// ===== 7. ПРОВЕРКА И ПОИСК МЕСТА =====
function checkFits(name, w, h) {
    const size = totalRoomSize();
    const fitsNormal  = (w <= size.w && h <= size.h);
    const fitsRotated = (h <= size.w && w <= size.h);
    if (!fitsNormal && !fitsRotated) {
        alert('«' + name + '» ' + w + '×' + h + ' м не влезает в комнату.');
        return false;
    }
    return true;
}

function findFreeSpot(wMeters, hMeters) {
    const stepPx = 50;
    const roomPxW = room.clientWidth, roomPxH = room.clientHeight;
    const wPx = wMeters * SCALE, hPx = hMeters * SCALE;

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
    return { x el: 0, y.appendChild: 0 };
}

// ===== 8. СОЗДА(nameНИЕ ПРЕДМЕТА =Span====
function createFurnitureElement(name);

, w, h, color   , shape, height, left, top) {
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
 = name; el.dataset.w = w; el.dataset.h = h;
    el.dataset.height = height || 0.8;
    el.dataset.shape = shape || 'rect';
    el.dataset.color = color;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'furniture-name';
    nameSpan.textContent = name;
    const sizeSpan = document.createElement('span');
    sizeSpan.className = 'furniture-size';
    sizeSpan.textContent = w + '×' + h + ' м';
    el.appendChild(sizeSpan);

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn'; delBtn.textContent = '✕';
    delBtn.addEventListener('mousedown', function(e){ e.stopPropagation(); });
    delBtn.addEventListener('touchstart', function(e){ e.stopPropagation(); }, { passive: true });
    delBtn.addEventListener('click', function(e) {
        e.stopPropagation(); e.preventDefault();
        el.remove(); saveState();
    });
    el.appendChild(delBtn);

    const rotBtn = document.createElement('button');
    rotBtn.className = 'rotate-btn'; rotBtn.textContent = '↻';
    rotBtn.addEventListener('mousedown', function(e){ e.stopPropagation(); });
    rotBtn.addEventListener('touchstart', function(e){ e.stopPropagation(); }, { passive: true });
    rotBtn.addEventListener('click', function(e) {
        e.stopPropagation(); e.preventDefault();
        rotateItem(el);
    });
    el.appendChild(rotBtn);

    makeDraggable(el);
    return el;
}

// ===== 9. ДОБАВЛЕНИЕ МЕБЕЛИ =====
document.querySelectorAll('.tool-btn[data-type]').forEach(function(btn) {
    btn.addEventListener('click', function() {
        const t = LIB[btn.dataset.type];
        if (!t) return;
        if (!checkFits(t.name
, t.w, t.h)) return;
        const pos = findFreeSpot(t.w, t.h);
        const el = createFurnitureElement(t.name
, t.w, t.h, t.color, t.shape, t.height, pos.x, pos.y);
        room.appendChild(el);
        saveState();
    });
});

document.getElementById('add-custom').addEventListener('click', function() {
    const name = document.getElementById('f-name').value.trim() || 'Мебель';
    const shape = document.getElementById('f-shape').value;
    let w = parseFloat(document.getElementById('f-w').value);
    let h = parseFloat(document.getElementById('f-h').value);
    if (isNaN(w) || w < 0.5) w = 0.5;
    if (isNaN(h) || h < 0.5) h = 0.5;
    if (w > 5) w = 5; if (h > 5) h = 5;
    if (!checkFits(name, w, h)) return;

    const color = CUSTOM_COLORS[colorIndex % CUSTOM_COLORS.length];
    colorIndex++;
    const pos = findFreeSpot(w, h);
    const el = createFurnitureElement(name, w, h, color, shape, 0.8, pos.x, pos.y);
    room.appendChild(el);
    document.getElementById('f-name').value = '';
    saveState();
});

// ===== 10. ПОВОРОТ =====
function rotateItem(el) {
    const oldW = parseFloat(el.dataset.w);
    const oldH = parseFloat(el.dataset.h);
    el.dataset.w = oldH; el.dataset.h = oldW;
    el.style.width  = (oldH * SCALE) + 'px';
    el.style.height = (oldW * SCALE) + 'px';
    const sizeEl = el.querySelector('.furniture-size');
    if (sizeEl) sizeEl.textContent = oldH + '×' + oldW + ' м';
    clampItem(el); saveState();
}

// ===== 11. ПЕРЕТАСКИВАНИЕ =====
function makeDraggable(el) {
    let startX = 0, startY = 0, startLeft = 0, startTop = 0, isActive = false;

    function getPos(e) {
        if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        return { x: e.clientX, y: e.clientY };
    }

    function onStart(e) {
        if (e.target.classList.contains('rotate-btn') || e.target.classList.contains('delete-btn')) return;
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
        const dx = pos.x - startX, dy = pos.y - startY;
        const wPx = parseFloat(el.dataset.w) * SCALE;
        const hPx = parseFloat(el.dataset.h) * SCALE;
        let newLeft = Math.round((startLeft + dx) / 50) * 50;
        let newTop  = Math.round((startTop  + dy) / 50) * 50;
        const maxLeft = room.clientWidth - wPx;
        const maxTop  = room.clientHeight - hPx;
        if (newLeft < 0) newLeft = 0;
        if (newTop  < 0) newTop  = 0;
        if (newLeft > maxLeft) newLeft = maxLeft;
        if (newTop  > maxTop)  newTop  = maxTop;
        el.style.left = newLeft + 'px';
        el.style.top
  = newTop + 'px';
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

// ===== 12. ЭРГОНОМИКА =====
document.getElementById('btn-ergo').addEventListener('click', function() {
    const items = Array.from(room.querySelectorAll('.furniture'));
    items.forEach(function(el){ el.classList.remove('ergo-warning'); });
    if (items.length < 2) { alert('Добавьте минимум 2 предмета мебели.'); return; }

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
            if (overlap || horizGap || vertGap) {
                a.classList.add('ergo-warning');
                b.classList.add('ergo-warning');
                violations.push((overlap ? 'Пересечение: ' : 'Малый проход: ') + a.dataset.name
 + ' ↔ ' + b.dataset.name
);
            }
        }
    }
    if (violations.length === 0) alert('Эргономика в порядке! Проходы не менее 60 см.');
    else alert('Найдено проблем: ' + violations.length + '\n\n' + violations.slice(0, 15).join('\n'));
});

// ===== 13. ЗАМЕР ПО ФОТО =====
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

document.getElementById('btn-photo').addEventListener('click', function(){ photoModal.classList.remove('hidden'); });
document.getElementById('photo-close').addEventListener('click', function(){ photoModal.classList.add('hidden'); });

photoInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    photoImg.src = URL.createObjectURL(file);
    photoImg.onload = function() {
        resetPhotoPoints();
        photoInfo.textContent = 'Кликните две. точки наизвестном расстоянии';
    };
});

function resetPhoto Points() {
    photoPoints = [3]; pixelDistance = 0;
    pt1.classList.remove('visible'); pt2.classList.remove('visible');
    photoGrid.classList.remove('Dvisible');
    photoDistLabel.classList.add('hidden');
    photoApply.classList.add-('hidden');
    photoInfo.textContent = '';
}
documentП.getElementById('photo-reset').addEventListener('click', resetPhotoPoints);

photoContainer.addEventListener('click', function(e) {
    if (!photoImg.src) return;
    const rect = photoContainer.getBoundingClientRect();
    const x = e.clientX - rect.left + photoContainer.scrollLeft;
    const y = e.clientY - rect.top
 + photoContainer.scrollTop;
    if (photoPoints.length >= 2) resetPhotoPoints();
    photoPoints.push({ x: x, y: y });
    if (photoPoints.length === 1) {
        pt1.style.left = x + 'px'; pt1.style.top
 = y + 'px';
        pt1.classList.add('visible');
        photoInfo.textContent = 'Точка 1 установлена. Кликните вторую точку.';
    } else if (photoPoints.length === 2) {
        pt2.style.left = x + 'px'; pt2.style.top
 = y + 'px';
        pt2.classList.add('visible');
        pixelDistance = Math.hypot(photoPoints[1].x - photoPoints[0].x, photoPoints[1].y - photoPoints[0].y);
        photoInfo.textContent = 'Расстояние: ' + Math.round(pixelDistance) + ' px. Укажите реальную длину.';
        photoDistLabel.classList.remove('hidden');
        photoApply.classList.remove('hidden');
    }
});

photoApply.addEventListener('click', function() {
    const realMeters = parseFloat(photoDist.value);
    if (isNaN(realMeters) || realMeters <= 0) { alert('Введите корректное расстояние.'); return; }
    if (pixelDistance <= 0) return;
    const pxPerMeter = pixelDistance / realMeters;
    photoGrid.classList.add('visible');
    photoGrid.style.backgroundSize = pxPerMeter + 'px ' + pxPerMeter + 'px';
    photoInfo.textContent = 'Масштаб применён! 1 м = ' + Math.round(pxPerMeter) + ' px.';
});

// ===== 14. PNG =====
document.getElementById('save-png').addEventListener('click', function() {
    const btns = document.querySelectorAll('.rotate-btn, .delete-btn');
    btns.forEach(function(b){ b.style.visibility = 'hidden'; });
    html2canvas(room, { backgroundColor: '#fefefe', scale: 2 }).then(function(canvas) {
        btns.forEach(function(b){ b.style.visibility = 'visible'; });
        const link = document.createElement('a');
        link.download
 = 'plan-kvartiry.png';
        link.href = canvas.toDataURL('image/png');
        link.click
();
    }).catch(function(err) {
        btns.forEach(function(b){ b.style.visibility = 'visible'; });
        alert('Ошибка: ' + err.message);
    });
});

// ===== 15. ОЧИСТКА =====
document.getElementById('clear-btn').addEventListener('click', function() {
    if (!confirm('Удалить всю мебель и проёмы?')) return;
    room.querySelectorAll('.furniture, .opening').forEach(function(el){ el.remove(); });
    openings = []; saveState();
});

// ===== 16. СОХРАНЕНИЕ =====
function saveState() {
    const items = [];
    room.querySelectorAll('.furniture').forEach(function(el) {
        items.push({
            name: el.dataset.name
, w: parseFloat(el.dataset.w), h: parseFloat(el.dataset.h),
            height: parseFloat(el.dataset.height) || 0.8,
            color: el.dataset.color, shape: el.dataset.shape,
            left: el.style.left, top: el.style.top
        });
    });
    try {
        localStorage.setItem('planner-state-v3', JSON.stringify({
            roomW: roomW, roomH: roomH, roomWallHeight: roomWallHeight,
            balcony: balcony, openings: openings, items: items
        }));
    } catch (e) {}
}

function loadState() {
    const raw = localStorage.getItem('planner-state-v3');
    if (!raw) return false;
    try {
        const state = JSON.parse(raw);
        roomW = state.roomW || 6;
        roomH = state.roomH || 5;
        roomWallHeight = state.roomWallHeight || 2.7;
        balcony = state.balcony || null;
        openings = state.openings || [];

        document.getElementById('room-w').value = roomW;
        document.getElementById('room-h').value = roomH;
        document.getElementById('room-h2').value = roomWallHeight;
        updateRoomSize();

        (state.items || []).forEach(function(it) {
            const el = createFurnitureElement(it.name
, it.w, it.h, it.color, it.shape, it.height, parseFloat(it.left), parseFloat(it.top
));
            room.appendChild(el);
        });
        return true;
    } catch (e) { return false; }
}

if (!loadState()) updateRoomSize();

// ============================================================
// 17РОСМОТР (Three.js грузится ТОЛЬКО при клике на 3D)
// ============================================================
let THREE = null, OrbitControlsClass = null;
let threeScene, threeCamera, threeRenderer, threeControls, threeRoomGroup;
let threeInitialized = false;
let threeLoading = false;

async function loadThree() {
    if (THREE) return true;
    if (threeLoading) return false;
    threeLoading = true;
    try {
        THREE = await import('three');
        const mod = await import('three/addons/controls/OrbitControls.js');
        OrbitControlsClass = mod.OrbitControls;
        return true;
    } catch (err) {
        console.error('Ошибка загрузки Three.js:', err);
        alert('Не удалось загрузить 3D. Проверьте интернет.');
        threeLoading = false;
        return false;
    }
}

async function init3D() {
    if (threeInitialized) return;
    const ok = await loadThree();
    if (!ok) return;

    const canvas = document.getElementById('canvas3d');
    const container = document.getElementById('view-3d-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    threeScene = new THREE.Scene();
    threeScene.background = new THREE.Color(0xe0e7ff);

    threeCamera = new THREE.PerspectiveCamera(50, width / height, 0.1, 200);
    threeCamera.position.set(8, 8, 12);

    threeRenderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    threeRenderer.setSize(width, height);
    threeRenderer.setPixelRatio(window.devicePixelRatio);
    threeRenderer.shadowMap.enabled = true;

    threeControls = new OrbitControlsClass(threeCamera, canvas);
    threeControls.enableDamping = true;
    threeControls.dampingFactor = 0.08;
    threeControls.maxPolarAngle = Math.PI / 2.05;
    threeControls.target.set(0, 0, 0);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    threeScene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(10, 15, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.left = -15;
    sun.shadow.camera.right = 15;
    sun.shadow.camera.top
 = 15;
    sun.shadow.camera.bottom = -15;
    threeScene.add(sun);

    const groundGeo = new THREE.PlaneGeometry(60, 60);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    threeScene.add(ground);

    threeRoomGroup = new THREE.Group
();
    threeScene.add(threeRoomGroup);

    threeInitialized = true;
    build3DRoom();

    function animate() {
        requestAnimationFrame(animate);
        threeControls.update();
        threeRenderer.render(threeScene, threeCamera);
    }
    animate();

    window.addEventListener('resize', function() {
        if (!threeInitialized) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        threeCamera.aspect = w / h;
        threeCamera.updateProjectionMatrix();
        threeRenderer.setSize(w, h);
    });
}

function build3DRoom() {
    if (!threeInitialized) return;

    while (threeRoomGroup.children.length > 0) {
        const obj = threeRoomGroup.children.pop();
        if (obj.geometry)obj.geometry.dispose();
        if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach(function(m){ m.dispose(); });
            else obj.material.dispose();
        }
    }

    const size = totalRoomSize();
    const W = size.w, H = size.h;
    const wallH = roomWallHeight;
    const cx = W / 2, cz = H / 2;

    const floorGeo = new THREE.BoxGeometry(W, 0.1, H);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xd6b48a });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, -0.05, 0);
    floor.receiveShadow = true;
    threeRoomGroup.add(floor);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, side: THREE.DoubleSide, transparent: true, opacity: 0.75 });

    const wallBack = new THREE.Mesh(new THREE.BoxGeometry(W, wallH, 0.1), wallMat);
    wallBack.position.set(0, wallH / 2, cz);
    threeRoomGroup.add(wallBack);

    const wallFront = new THREE.Mesh(new THREE.BoxGeometry(W, wallH, 0.1), wallMat);
    wallFront.position.set(0, wallH / 2, -cz);
    threeRoomGroup.add(wallFront);

    const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.1, wallH, H), wallMat);
    wallLeft.position.set(-cx, wallH / 2, 0);
    threeRoomGroup.add(wallLeft);

    const wallRight = new THREE.Mesh(new THREE.BoxGeometry(0.1, wallH, H), wallMat);
    wallRight.position.set(cx, wallH / 2, 0);
    threeRoomGroup.add(wallRight);

    // Проёмы
    openings.forEach(function(op) {
        const isDoor = op.type === 'door';
        const width = op.width;
        const h = isDoor ? 2.05 : 1.4;
        const yPos = isDoor ? h / 2 : 1.0 + h / 2;

        let geo;
        if (op.side === 'top' || op.side === 'bottom') geo = new THREE.BoxGeometry(width, h, 0.15);
        else geo = new THREE.BoxGeometry(0.15, h, width);

        const mat = new THREE.MeshStandardMaterial({ color: isDoor ? 0x8b5a2b : 0xbfdbfe, transparent: true, opacity: isDoor ? 0.95 : 0.6 });
        const mesh = new THREE.Mesh(geo, mat);

        const offsetAlong = op.position - (op.side === 'top' || op.side === 'bottom' ? W / 2 : H / 2);
        if (op.side === 'top')    mesh.position.set(offsetAlong, yPos, -cz);
        if (op.side === 'bottom') mesh.position.set(offsetAlong, yPos, cz);
        if (op.side === 'left')   mesh.position.set(-cx, yPos, offsetAlong);
        if (op.side === 'right')  mesh.position.set(cx, yPos, offsetAlong);

        mesh.castShadow = true;
        threeRoomGroup.add(mesh);
    });

    // Мебель
    room.querySelectorAll('.furniture').forEach(function(el) {
        const w = parseFloat(el.dataset.w), d = parseFloat(el.dataset.h);
        const h = parseFloat(el.dataset.height) || 0.8;
        const color = el.dataset.color || '#6366f1';
        const shape = el.dataset.shape || 'rect';

        const pxX = el.offsetLeft / SCALE;
        const pxZ = el.offsetTop / SCALE;
        const x3d = pxX + w / 2 - cx;
        const z3d = pxZ + d / 2 - cz;

        let geo;
        if (shape === 'round' || shape === 'oval') geo = new THREE.CylinderGeometry(w / 2, w / 2, h, 24);
        else geo = new THREE.BoxGeometry(w, h, d);

        const mat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.7, metalness: 0.05 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x3d, h / 2, z3d);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        threeRoomGroup.add(mesh);
    });
}

// Переключатели 2D / 3D
document.getElementById('view-2d').addEventListener('click', function() {
    document.getElementById('view-2d').classList.add('active');
    document.getElementById('view-3d').classList.remove('active');
    document.getElementById('view-2d-container').classList.add('active');
    document.getElementById('view-3d-container').classList.remove('active');
});

document.getElementById('view-3d').addEventListener('click', function() {
    document.getElementById('view-3d').classList.add('active');
    document.getElementById('view-2d').classList.remove('active');
    document.getElementById('view-3d-container').classList.add('active');
    document.getElementById('view-2d-container').classList.remove('active');
    setTimeout(async function() {
        await init3D();
        if (threeInitialized) build3DRoom();
    }, 50);
});
