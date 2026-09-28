// 1 метр = 100 пикселей
const SCALE = 100;

const room = document.getElementById('room');

const LIB = {
    sofa:     { name: 'Диван',   w: 2, h: 1,   color: '#4a90e2' },
    table:    { name: 'Стол',    w: 1, h: 1,   color: '#8b572a' },
    wardrobe: { name: 'Шкаф',    w: 1, h: 0.5, color: '#7f8c8d' },
    bed:      { name: 'Кровать', w: 2, h: 1.5, color: '#9b59b6' }
};

// Добавление мебели
document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        const t = LIB[type];
        if (!t) return;

        const el = document.createElement('div');
        el.className = 'furniture';
        el.textContent = t.name
;
        el.style.width  = (t.w * SCALE) + 'px';
        el.style.height = (t.h * SCALE) + 'px';
        el.style.background = t.color;
        el.style.left = '0px';
        el.style.top
  = '0px';

        makeDraggable(el, t.w, t.h);
        room.appendChild(el);
    });
});

// Перетаскивание — работает и мышкой, и пальцем
function makeDraggable(el, wMeters, hMeters) {
    let startX = 0, startY = 0;
    let startLeft = 0, startTop = 0;

    function getPos(e) {
        if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    }

    function onStart(e) {
        e.preventDefault();
        const pos = getPos(e);
        startX = pos.x;
        startY = pos.y;
        startLeft = el.offsetLeft;
        startTop = el.offsetTop;
        el.classList.add('dragging');

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
    }

    function onMove(e) {
        e.preventDefault();
        const pos = getPos(e);
        const dx = pos.x - startX;
        const dy = pos.y - startY;

        let newLeft = startLeft + dx;
        let newTop  = startTop + dy;

        newLeft = Math.round(newLeft / 50) * 50;
        newTop  = Math.round(newTop / 50) * 50;

        const maxLeft = room.clientWidth - wMeters * SCALE;
        const maxTop  = room.clientHeight - hMeters * SCALE;

        if (newLeft < 0) newLeft = 0;
        if (newTop < 0) newTop = 0;
        if (newLeft > maxLeft) newLeft = maxLeft;
        if (newTop > maxTop) newTop = maxTop;

        el.style.left = newLeft + 'px';
        el.style.top
  = newTop + 'px';
    }

    function onEnd() {
        el.classList.remove('dragging');
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onEnd);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
    }

    el.addEventListener('mousedown', onStart);
    el.addEventListener('touchstart', onStart, { passive: false });
}

// Очистка
document.getElementById('clear-btn').addEventListener('click', () => {
    room.innerHTML = '';
});
