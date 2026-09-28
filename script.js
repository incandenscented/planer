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

        // Ставим в левый верхний угол комнаты
        el.style.left = '0px';
        el.style.top
  = '0px';

        makeDraggable(el, t.w, t.h);
        room.appendChild(el);
    });
});

// Перетаскивание вручную (через mousedown/mousemove/mouseup)
function makeDraggable(el, wMeters, hMeters) {
    let startX = 0, startY = 0;
    let startLeft = 0, startTop = 0;

    el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();

        startX = e.clientX;
        startY = e.clientY;
        startLeft = el.offsetLeft;
        startTop = el.offsetTop;

        el.classList.add('dragging');

        function onMove(ev) {
            const dx = ev.clientX - startX;
            const dy = ev.clientY - startY;

            let newLeft = startLeft + dx;
            let newTop  = startTop + dy;

            // Привязка к сетке 0.5 м = 50 пикселей
            newLeft = Math.round(newLeft / 50) * 50;
            newTop  = Math.round(newTop / 50) * 50;

            // Границы комнаты
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

        function onUp() {
            el.classList.remove('dragging');
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        }

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    });
}

// Очистка
document.getElementById('clear-btn').addEventListener('click', () => {
    room.innerHTML = '';
});