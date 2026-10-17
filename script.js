const SCALE = 100;
const room = document.getElementById('room');

let roomW = 6, roomH = 5;
let openings = [], currentTool = null;
let colorIdx = 0;

const COLORS = [
    '#404040', '#525252', '#666666', '#1f2937', 
    '#374151', '#4b5563', '#334155', '#475569'
];

(function(){
    let v = parseInt(localStorage.getItem('planner-visits')||'0',10)+1;
    localStorage.setItem('planner-visits', v);
    const e = document.getElementById('visits-count');
    if (e) e.textContent = v;
})();

const wb = document.getElementById('welcome-start');
if (wb) {
    wb.addEventListener('click', function(){
        document.getElementById('welcome-modal').classList.add('hidden');
    });
}

function updateRoom(){
    room.style.width = (roomW*SCALE)+'px';
    room.style.height = (roomH*SCALE)+'px';
    renderOpenings();
    updateStats();
}
function applyRoom(){
    let w = parseFloat(document.getElementById('room-w').value);
    let h = parseFloat(document.getElementById('room-h').value);
    if (isNaN(w)||w<2) w=2; if (isNaN(h)||h<2) h=2;
    if (w>15) w=15; if (h>15) h=15;
    roomW=w; roomH=h;
    document.getElementById('room-w').value=w;
    document.getElementById('room-h').value=h;
    updateRoom();
    room.querySelectorAll('.furniture').forEach(clamp);
    save();
    updateStats();
}
document.getElementById('apply-room').addEventListener('click', applyRoom);

document.querySelectorAll('.tool-btn[data-mode]').forEach(function(b){
    b.addEventListener('click', function(){
        const m = b.dataset.mode;
        if (currentTool===m){
            currentTool=null;
            document.querySelectorAll('.tool-btn[data-mode]').forEach(function(x){x.classList.remove('active');});
            room.style.cursor='default';
        } else {
            currentTool=m;
            document.querySelectorAll('.tool-btn[data-mode]').forEach(function(x){x.classList.remove('active');});
            b.classList.add('active'); room.style.cursor='copy';
        }
    });
});

room.addEventListener('click', function(e){
    if (!currentTool) return;
    if (e.target.classList.contains('furniture') || e.target.closest('.furniture')) return;
    if (e.target.classList.contains('opening') || e.target.closest('.opening')) return;
    
    const r = room.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const near = 15;
    let side=null, pos=0;
    
    if (Math.abs(y) < near) { side = 'top'; pos = x / SCALE; }
    else if (Math.abs(y - r.height) < near) { side = 'bottom'; pos = x / SCALE; }
    else if (Math.abs(x) < near) { side = 'left'; pos = y / SCALE; }
    else if (Math.abs(x - r.width) < near) { side = 'right'; pos = y / SCALE; }
    
    if (!side) { alert('Кликните ближе к стене.'); return; }
    
    let w = parseFloat(document.getElementById('opening-width').value);
    if (isNaN(w) || w < 0.6) w = 0.6; 
    if (w > 2.5) w = 2.5;
    
    const openSide = document.getElementById('opening-side').value;
    
    openings.push({
        type: currentTool, 
        side: side, 
        position: pos, 
        width: w,
        openSide: openSide
    });
    
    renderOpenings(); 
    save();
});

function renderOpenings(){
    room.querySelectorAll('.opening, .opening-arc').forEach(function(el){ el.remove(); });
    
    openings.forEach(function(op, i){
        const el = document.createElement('div');
        el.className = 'opening ' + op.type;
        const px = op.width * SCALE;
        
        if (op.side === 'top' || op.side === 'bottom') {
            el.style.width = px + 'px'; el.style.height = '8px';
            el.style.left = (op.position * SCALE - px/2) + 'px';
            el.style.top = (op.side === 'top' ? '-5px' : (room.clientHeight - 3) + 'px');
        } else {
            el.style.width = '8px'; el.style.height = px + 'px';
            el.style.top = (op.position * SCALE - px/2) + 'px';
            el.style.left = (op.side === 'left' ? '-5px' : (room.clientWidth - 3) + 'px');
        }
        el.style.pointerEvents = 'auto'; 
        el.style.cursor = 'grab';
        el.title = 'Тяните, чтобы переместить. Двойной клик — удалить';
        
        let isDraggingOpening = false;

        function startDragOpening(e) {
            if (e.button && e.button !== 0) return; 
            e.stopPropagation(); 
            e.preventDefault();
            
            isDraggingOpening = true;
            el.style.cursor = 'grabbing';

            function onMove(ev) {
                if (!isDraggingOpening) return;
                ev.preventDefault();
                
                const rect = room.getBoundingClientRect();
                let clientX, clientY;
                
                if (ev.touches && ev.touches.length > 0) {
                    clientX = ev.touches[0].clientX;
                    clientY = ev.touches[0].clientY;
                } else {
                    clientX = ev.clientX;
                    clientY = ev.clientY;
                }

                let newPos = 0;
                if (op.side === 'top' || op.side === 'bottom') {
                    newPos = (clientX - rect.left) / SCALE;
                } else {
                    newPos = (clientY - rect.top) / SCALE;
                }

                const minPos = (op.width / 2);
                const maxPos = (op.side === 'top' || op.side === 'bottom' ? roomW : roomH) - (op.width / 2);
                
                if (newPos < minPos) newPos = minPos;
                if (newPos > maxPos) newPos = maxPos;

                newPos = Math.round(newPos * 10) / 10;
                
                op.position = newPos;
                renderOpenings(); 
            }

            function endDrag(ev) {
                if (!isDraggingOpening) return;
                isDraggingOpening = false;
                el.style.cursor = 'grab';
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', endDrag);
                document.removeEventListener('touchmove', onMove);
                document.removeEventListener('touchend', endDrag);
                save(); 
            }

            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', endDrag);
            document.addEventListener('touchmove', onMove, { passive: false });
            document.addEventListener('touchend', endDrag);
        }

        el.addEventListener('mousedown', startDragOpening);
        el.addEventListener('touchstart', startDragOpening.createElement, { passive: false });

        el.addEventListener('dblclick',(' function(ev){
            evdiv.stopPropagation();
            if (confirm');
('Удалить?')) { openings.splice(i, 1); renderOpenings(); save(); }
        });
        
        room.appendChild(el);

        // --- ДУГА ОТКРЫВАНИЯ (ИСПРАВЛЕНА ОШИБКА) ---
        const arc = document        arc.className = 'opening-arc ' + op.type + '-arc';
        
        const safeSide = op.openSide || 'in-left'; // Защита от старых данных
        const dirIn = safeSide.includes('in') ? 1 : -1; 
        const dirLeft = safeSide.includes('left') ? 1 : -1;
        
        if (op.side === 'top' || op.side === 'bottom') {
            arc.style.width = px + 'px';
            arc.style.height = px + 'px';
            arc.style.left = (op.position * SCALE - px/2) + 'px';
            
            if (op.side === 'top') {
                arc.style.top = dirIn === 1 ? '0px' : '-100%'; 
                arc.style.borderRadius = dirLeft === 1 ? '0 0 0 100%' : '0 0 100% 0';
            } else {
                arc.style.top = dirIn === 1 ? '100%' : '0px';
                arc.style.transform = 'translateY(-100%)';
                arc.style.borderRadius = dirLeft === 1 ? '100% 0 0 0' : '0 100% 0 0';
            }
        } else {
            arc.style.width = px + 'px';
            arc.style.height = px + 'px';
            arc.style.top = (op.position * SCALE - px/2) + 'px';
            
            if (op.side === 'left') {
                arc.style.left = dirIn === 1 ? '0px' : '-100%';
                arc.style.borderRadius = dirLeft === 1 ? '0 100% 0 0' : '0 0 100% 0';
            } else {
                arc.style.left = dirIn === 1 ? '100%' : '0px';
                arc.style.transform = 'translateX(-100%)';
                arc.style.borderRadius = dirLeft === 1 ? '100% 0 0 0' : '0 0 0 100%';
            }
        }
        arc.style.pointerEvents = 'none';
        room.appendChild(arc);
    });
}

function clamp(el){
    const wp = parseFloat(el.dataset.w)*SCALE;
    const hp = parseFloat(el.dataset.h)*SCALE;
    let l = el.offsetLeft, t = el.offsetTop;
    const ml = room.clientWidth-wp, mt = room.clientHeight-hp;
    if (ml<0) l=0; else if (l>ml) l=ml;
    if (mt<0) t=0; else if (t>mt) t=mt;
    if (l<0) l=0; if (t<0) t=0;
    l = Math.round(l/50)*50; t = Math.round(t/50)*50;
    el.style.left = l+'px'; el.style.top = t+'px';
}
function findFree(w, h){
    const step=50, W=room.clientWidth, H=room.clientHeight;
    const wp=w*SCALE, hp=h*SCALE;
    for (let y=0; y+hp<=H; y+=step){
        for (let x=0; x+wp<=W; x+=step){
            let ov=false;
            room.querySelectorAll('.furniture').forEach(function(o){
                if (ov) return;
                if (!(x+wp<=o.offsetLeft || x>=o.offsetLeft+o.offsetWidth ||
                      y+hp<=o.offsetTop || y>=o.offsetTop+o.offsetHeight)) ov=true;
            });
            if (!ov) return {x:x, y:y};
        }
    }
    return {x:0,y:0};
}

function createEl(name, w, h, color, shape, left, top){
    const el = document.createElement('div');
    el.className = 'furniture';
    if (shape && shape!=='rect') el.classList.add('shape-'+shape);
    el.style.width=(w*SCALE)+'px'; el.style.height=(h*SCALE)+'px';
    el.style.background=color;
    el.style.left=(left||0)+'px'; el.style.top=(top||0)+'px';
    el.dataset.name=name; el.dataset.w=w; el.dataset.h=h;
    el.dataset.shape=shape||'rect';
    el.dataset.color=color;

    const n = document.createElement('span');
    n.className='furniture-name'; n.textContent=name;
    el.appendChild(n);
    const s = document.createElement('span');
    s.className='furniture-size';
    s.textContent = w + '×' + h + ' м · ' + (w*h).toFixed(1) + ' м²';
    el.appendChild(s);

    const d = document.createElement('button');
    d.className='delete-btn'; d.textContent='✕';
    d.addEventListener('mousedown', function(e){e.stopPropagation();});
    d.addEventListener('touchstart', function(e){e.stopPropagation();},{passive:true});
    d.addEventListener('click', function(e){
        e.stopPropagation();e.preventDefault();
        el.remove();
        save();
        updateStats();
    });
    el.appendChild(d);

    const r = document.createElement('button');
    r.className='rotate-btn'; r.textContent='↻';
    r.addEventListener('mousedown', function(e){e.stopPropagation();});
    r.addEventListener('touchstart', function(e){e.stopPropagation();},{passive:true});
    r.addEventListener('click', function(e){e.stopPropagation();e.preventDefault();rotate(el);});
    el.appendChild(r);

    drag(el);
    return el;
}

document.getElementById('add-custom').addEventListener('click', function(){
    const name = document.getElementById('f-name').value.trim()||'Мебель';
    const shape = document.getElementById('f-shape').value;
    let w = parseFloat(document.getElementById('f-w').value);
    let h = parseFloat(document.getElementById('f-h').value);
    if (isNaN(w)||w<0.5) w=0.5; if (isNaN(h)||h<0.5) h=0.5;
    if (w>5) w=5; if (h>5) h=5;
    if (w>roomW && h>roomH){ alert('Не влезает в комнату'); return; }
    const c = COLORS[colorIdx++%COLORS.length];
    const p = findFree(w,h);
    room.appendChild(createEl(name,w,h,c,shape,p.x,p.y));
    document.getElementById('f-name').value='';
    save();
    updateStats();
});

function rotate(el){
    const ow = parseFloat(el.dataset.w), oh = parseFloat(el.dataset.h);
    el.dataset.w=oh; el.dataset.h=ow;
    el.style.width=(oh*SCALE)+'px'; el.style.height=(ow*SCALE)+'px';
    const s = el.querySelector('.furniture-size');
    if (s) s.textContent = oh+'×'+ow+' м · ' + (oh*ow).toFixed(1) + ' м²';
    clamp(el); save();
    updateStats();
}

function drag(el){
    let sx=0,sy=0,sl=0,st=0,on=false;
    function pos(e){
        if (e.touches&&e.touches.length>0) return {x:e.touches[0].clientX,y:e.touches[0].clientY};
        return {x:e.clientX,y:e.clientY};
    }
    function start(e){
        if (e.target.classList.contains('rotate-btn')||e.target.classList.contains('delete-btn')) return;
        e.preventDefault();
        const p = pos(e); sx=p.x; sy=p.y; sl=el.offsetLeft; st=el.offsetTop;
        on=true; el.classList.add('dragging');
        document.addEventListener('mousemove',move);
        document.addEventListener('mouseup',end);
        document.addEventListener('touchmove',move,{passive:false});
        document.addEventListener('touchend',end);
        document.addEventListener('touchcancel',end);
    }
    function move(e){
        if (!on) return; e.preventDefault();
        const p = pos(e);
        const dx = p.x-sx, dy = p.y-sy;
        const wp = parseFloat(el.dataset.w)*SCALE, hp = parseFloat(el.dataset.h)*SCALE;
        let nl = Math.round((sl+dx)/50)*50, nt = Math.round((st+dy)/50)*50;
        const ml = room.clientWidth-wp, mt = room.clientHeight-hp;
        if (nl<0) nl=0; if (nt<0) nt=0;
        if (nl>ml) nl=ml; if (nt>mt) nt=mt;
        el.style.left=nl+'px'; el.style.top=nt+'px';
    }
    function end(){
        on=false; el.classList.remove('dragging');
        document.removeEventListener('mousemove',move);
        document.removeEventListener('mouseup',end);
        document.removeEventListener('touchmove',move);
        document.removeEventListener('touchend',end);
        document.removeEventListener('touchcancel',end);
        save();
        updateStats();
    }
    el.addEventListener('mousedown',start);
    el.addEventListener('touchstart',start,{passive:false});
}

function updateStats(){
    const statsEl = document.getElementById('room-stats');
    if (!statsEl) return;
    const roomArea = roomW * roomH;
    let furnitureArea = 0;
    room.querySelectorAll('.furniture').forEach(function(el){
        const w = parseFloat(el.dataset.w) || 0;
        const h = parseFloat(el.dataset.h) || 0;
        furnitureArea += w * h;
    });
    const freeArea = Math.max(0, roomArea - furnitureArea);
    const occupiedPercent = roomArea > 0 ? Math.round((furnitureArea / roomArea) * 100) : 0;
    const freePercent = 100 - occupiedPercent;
    statsEl.innerHTML =
        '<span class="stat-item">📐 Комната: <strong>' + roomArea.toFixed(1) + ' м²</strong></span>' +
        '<span class="stat-item">🛋 Занято: <strong>' + furnitureArea.toFixed(1) + ' м²</strong> (' + occupiedPercent + '%)</span>' +
        '<span class="stat-item">⬜ Свободно: <strong>' + freeArea.toFixed(1) + ' м²</strong> (' + freePercent + '%)</span>';
}

const pm = document.getElementById('photo-modal');
const pi = document.getElementById('photo-input');
const pimg = document.getElementById('photo-img');
const pg = document.getElementById('photo-grid');
const pc = document.getElementById('photo-container');
const pinfo = document.getElementById('photo-info');
const phint = document.getElementById('photo-hint');
const pdl = document.getElementById('photo-dist-label');
const pd = document.getElementById('photo-dist');
const pa = document.getElementById('photo-apply');

const points = { scale: [], width: [], length: [] };
const pointEls = {
    scale: [document.getElementById('pt1'), document.getElementById('pt2')],
    width: [document.getElementById('pt3'), document.getElementById('pt4')],
    length: [document.getElementById('pt5'), document.getElementById('pt6')]
};

let photoMode = 'scale';
let pxPerMeter = 0;
let widthMeters = 0;
let lengthMeters = 0;

document.getElementById('btn-photo').addEventListener('click', function(){ pm.classList.remove('hidden'); });
document.getElementById('photo-close').addEventListener('click', function(){ pm.classList.add('hidden'); });

pi.addEventListener('change', function(e){
    const f = e.target.files[0];
    if (!f) return;
    pimg.src = URL.createObjectURL(f);
    pimg.onload = function(){
        resetPhoto();
        setMode('scale');
        phint.textContent = '1️⃣ Кликните 2 точки на известном предмете (например, кровать) и введите его длину';
    };
});

document.querySelectorAll('.mode-btn').forEach(function(b){
    b.addEventListener('click', function(){
        if (b.dataset.mode === 'width' && pxPerMeter <= 0) {
            alert('Сначала задайте масштаб на шаге 1.');
            return;
        }
        if (b.dataset.mode === 'length' && pxPerMeter <= 0) {
            alert('Сначала задайте масштаб на шаге 1.');
            return;
        }
        setMode(b.dataset.mode);
    });
});

function setMode(m){
    photoMode = m;
    document.querySelectorAll('.mode-btn').forEach(function(x){
        x.classList.toggle('active', x.dataset.mode === m);
    });
    if (m === 'scale') {
        phint.textContent = '1️⃣ Кликните 2 точки на известном предмете и введите его длину';
    } else if (m === 'width') {
        phint.textContent = '2️⃣ Кликните 2 угла задней стены (лево и право) — сайт посчитает ширину';
    } else if (m === 'length') {
        phint.textContent = '3️⃣ Кликните 2 точки: у ног и у задней стены (по боку) — сайт посчитает длину';
    }
}

pc.addEventListener('click', function(e){
    if (!pimg.src) return;
    const r = pc.getBoundingClientRect();
    const x = e.clientX - r.left + pc.scrollLeft;
    const y = e.clientY - r.top + pc.scrollTop;

    const arr = points[photoMode];
    const els = pointEls[photoMode];

    if (arr.length >= 2) {
        arr.length = 0;
        els.forEach(function(el){ el.classList.remove('visible'); });
        if (photoMode === 'scale') { pdl.classList.add('hidden'); pa.classList.add('hidden'); }
    }

    arr.push({x:x, y:y});

    if (arr.length === 1) {
        els[0].style.left = x+'px';
        els[0].style.top = y+'px';
        els[0].classList.add('visible');
        pinfo.textContent = 'Точка 1. Кликните вторую точку.';
    } else {
        els[1].style.left = x+'px';
        els[1].style.top = y+'px';
        els[1].classList.add('visible');

        const d = Math.hypot(arr[1].x-arr[0].x, arr[1].y-arr[0].y);

        if (photoMode === 'scale') {
            pinfo.textContent = 'Расстояние: ' + Math.round(d) + ' px. Введите реальную длину предмета.';
            pdl.classList.remove('hidden');
            pa.classList.remove('hidden');
        } else if (photoMode === 'width' && pxPerMeter > 0) {
            widthMeters = d / pxPerMeter;
            pinfo.textContent = 'Ширина комнаты: ≈ ' + widthMeters.toFixed(2) + ' м. Теперь шаг 3 — длина.';
            setMode('length');
        } else if (photoMode === 'length' && pxPerMeter > 0) {
            lengthMeters = d / pxPerMeter;
            pinfo.textContent = 'Длина комнаты: ≈ ' + lengthMeters.toFixed(2) + ' м. Нажмите «Перенести в план».';
        }
    }
});

pa.addEventListener('click', function(){
    const m = parseFloat(pd.value);
    if (isNaN(m)||m<=0){ alert('Введите корректное расстояние.'); return; }
    if (points.scale.length < 2) return;
    const d = Math.hypot(points.scale[1].x-points.scale[0].x, points.scale[1].y-points.scale[0].y);
    pxPerMeter = d / m;
    pg.classList.add('visible');
    pg.style.backgroundSize = pxPerMeter+'px '+pxPerMeter+'px';
    pinfo.textContent = 'Масштаб сохранён: 1 м = '+Math.round(pxPerMeter)+' px. Переходите к шагу 2 — ширина.';
    setMode('width');
});

document.getElementById('photo-to-plan').addEventListener('click', function(){
    if (widthMeters <= 0 || lengthMeters <= 0) {
        alert('Сначала задайте ширину и длину комнаты (шаги 2 и 3).');
        return;
    }
    let w = Math.round(widthMeters*10)/10;
    let h = Math.round(lengthMeters*10)/10;
    if (w < 2) w = 2;
    if (h < 2) h = 2;
    if (w > 15) w = 15;
    if (h > 15) h = 15;
    document.getElementById('room-w').value = w;
    document.getElementById('room-h').value = h;
    applyRoom();
    alert('✅ Размеры перенесены в план!\n\nШирина: ' + w + ' м\nДлина: ' + h + ' м');
    pm.classList.add('hidden');
});

function resetPhoto(){
    points.scale.length = 0;
    points.width.length = 0;
    points.length.length = 0;
    Object.values(pointEls).forEach(function(arr){
        arr.forEach(function(el){ el.classList.remove('visible'); });
    });
    pg.classList.remove('visible');
    pdl.classList.add('hidden');
    pa.classList.add('hidden');
    pinfo.textContent = '';
    pxPerMeter = 0;
    widthMeters = 0;
    lengthMeters = 0;
    setMode('scale');
}

document.getElementById('photo-reset').addEventListener('click', function(){
    resetPhoto();
    if (pimg.src) {
        phint.textContent = '1️⃣ Кликните 2 точки на известном предмете и введите его длину';
    }
});

document.getElementById('save-png').addEventListener('click', function(){
    const btns = document.querySelectorAll('.rotate-btn, .delete-btn');
    btns.forEach(function(b){b.style.visibility='hidden';});
    html2canvas(room,{backgroundColor:'#ffffff',scale:2}).then(function(c){
        btns.forEach(function(b){b.style.visibility='visible';});
        const a = document.createElement('a');
        a.download='plan.png'; a.href=c.toDataURL('image/png'); a.click();
    }).catch(function(err){
        btns.forEach(function(b){b.style.visibility='visible';});
        alert('Ошибка: '+err.message);
    });
});

document.getElementById('clear-btn').addEventListener('click', function(){
    if (!confirm('Удалить всё?')) return;
    room.querySelectorAll('.furniture, .opening, .opening-arc').forEach(function(el){el.remove();});
    openings=[]; save();
    updateStats();
});

function save(){
    const items = [];
    room.querySelectorAll('.furniture').forEach(function(el){
        items.push({
            name:el.dataset.name, w:parseFloat(el.dataset.w), h:parseFloat(el.dataset.h),
            color:el.dataset.color, shape:el.dataset.shape,
            left:el.style.left, top:el.style.top
        });
    });
    try{
        localStorage.setItem('planner-state-mini', JSON.stringify({
            roomW:roomW, roomH:roomH, openings:openings, items:items
        }));
    }catch(e){}
}
function load(){
    const raw = localStorage.getItem('planner-state-mini');
    if (!raw) return false;
    try{
        const s = JSON.parse(raw);
        roomW = s.roomW||6; roomH = s.roomH||5;
        openings = s.openings||[];
        document.getElementById('room-w').value=roomW;
        document.getElementById('room-h').value=roomH;
        updateRoom();
        (s.items||[]).forEach(function(it){
            const el = createEl(it.name,it.w,it.h,it.color,it.shape,parseFloat(it.left),parseFloat(it.top));
            room.appendChild(el);
        });
        return true;
    }catch(e){ return false; }
}

if (!load()) updateRoom();
updateStats();



