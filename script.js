const SCALE = 100;
const room = document.getElementById('room');

let roomW = 6, roomH = 5;
let openings = [], currentTool = null;
let colorIdx = 0;
const COLORS = ['#f97316','#14b8a6','#ef4444','#8b5cf6','#3b82f6','#22c55e','#92400e','#64748b'];

// Счётчик
(function(){
    let v = parseInt(localStorage.getItem('planner-visits')||'0',10)+1;
    localStorage.setItem('planner-visits', v);
    const e = document.getElementById('visits-count');
    if (e) e.textContent = v;
})();

// Приветствие
const wb = document.getElementById('welcome-start');
if (wb) {
    wb.addEventListener('click', function(){
        document.getElementById('welcome-modal').classList.add('hidden');
    });
}
// Показываем приветствие всегда (можно убрать эту строку если нужно 1 раз)
// Если хотите показывать только 1 раз — раскомментируйте:
// if (localStorage.getItem('planner-welcomed')==='1') {
//     document.getElementById('welcome-modal').classList.add('hidden');
// }

// Размер комнаты
function updateRoom(){
    room.style.width = (roomW*SCALE)+'px';
    room.style.height = (roomH*SCALE)+'px';
    renderOpenings();
}
function applyRoom(){
    let w = parseFloat(document.getElementById('room-w').value);
    let h = parseFloat(document.getElementById('room-h').value);
    if (isNaN(w)||w<2) w=2; if (isNaN(h)||h<2) h=2;
    if (w>10) w=10; if (h>10) h=10;
    roomW=w; roomH=h;
    document.getElementById('room-w').value=w;
    document.getElementById('room-h').value=h;
    updateRoom();
    room.querySelectorAll('.furniture').forEach(clamp);
    save();
}
document.getElementById('apply-room').addEventListener('click', applyRoom);

// Двери и окна
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
    const r = room.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const near = 15;
    let side=null, pos=0;
    if (Math.abs(y)<near) { side='top'; pos=x/SCALE; }
    else if (Math.abs(y-r.height)<near) { side='bottom'; pos=x/SCALE; }
    else if (Math.abs(x)<near) { side='left'; pos=y/SCALE; }
    else if (Math.abs(x-r.width)<near) { side='right'; pos=y/SCALE; }
    if (!side){ alert('Кликните ближе к стене.'); return; }
    let w = parseFloat(document.getElementById('opening-width').value);
    if (isNaN(w)||w<0.6) w=0.6; if (w>2.5) w=2.5;
    openings.push({type:currentTool, side:side, position:pos, width:w});
    renderOpenings(); save();
});

function renderOpenings(){
    room.querySelectorAll('.opening').forEach(function(el){ el.remove(); });
    openings.forEach(function(op, i){
        const el = document.createElement('div');
        el.className = 'opening '+op.type;
        const px = op.width*SCALE;
        if (op.side==='top'||op.side==='bottom'){
            el.style.width=px+'px'; el.style.height='8px';
            el.style.left=(op.position*SCALE-px/2)+'px';
            el.style.top=(op.side==='top'?'-5px':(room.clientHeight-3)+'px');
        } else {
            el.style.width='8px'; el.style.height=px+'px';
            el.style.top=(op.position*SCALE-px/2)+'px';
            el.style.left=(op.side==='left'?'-5px':(room.clientWidth-3)+'px');
        }
        el.style.pointerEvents='auto'; el.style.cursor='pointer';
        el.title='Двойной клик — удалить';
        el.addEventListener('dblclick', function(ev){
            ev.stopPropagation();
            if (confirm('Удалить?')){ openings.splice(i,1); renderOpenings(); save(); }
        });
        room.appendChild(el);
    });
}

// Границы
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

// Создание предмета
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
    s.className='furniture-size'; s.textContent=w+'×'+h+' м';
    el.appendChild(s);

    const d = document.createElement('button');
    d.className='delete-btn'; d.textContent='✕';
    d.addEventListener('mousedown', function(e){e.stopPropagation();});
    d.addEventListener('touchstart', function(e){e.stopPropagation();},{passive:true});
    d.addEventListener('click', function(e){e.stopPropagation();e.preventDefault();el.remove();save();});
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
});

function rotate(el){
    const ow = parseFloat(el.dataset.w), oh = parseFloat(el.dataset.h);
    el.dataset.w=oh; el.dataset.h=ow;
    el.style.width=(oh*SCALE)+'px'; el.style.height=(ow*SCALE)+'px';
    const s = el.querySelector('.furniture-size');
    if (s) s.textContent = oh+'×'+ow+' м';
    clamp(el); save();
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
    }
    el.addEventListener('mousedown',start);
    el.addEventListener('touchstart',start,{passive:false});
}

// ЗАМЕР ПО ФОТО
const pm = document.getElementById('photo-modal');
const pi = document.getElementById('photo-input');
const pimg = document.getElementById('photo-img');
const pg = document.getElementById('photo-grid');
const pc = document.getElementById('photo-container');
const p1 = document.getElementById('pt1'), p2 = document.getElementById('pt2');
const pinfo = document.getElementById('photo-info');
const pdl = document.getElementById('photo-dist-label');
const pd = document.getElementById('photo-dist');
const pa = document.getElementById('photo-apply');
let pp = [], pixDist = 0;

document.getElementById('btn-photo').addEventListener('click', function(){ pm.classList.remove('hidden'); });
document.getElementById('photo-close').addEventListener('click', function(){ pm.classList.add('hidden'); });

pi.addEventListener('change', function(e){
    const f = e.target.files[0];
    if (!f) return;
    pimg.src = URL.createObjectURL(f);
    pimg.onload = function(){ resetP(); pinfo.textContent='Кликните две точки на известном расстоянии'; };
});

function resetP(){
    pp=[]; pixDist=0;
    p1.classList.remove('visible'); p2.classList.remove('visible');
    pg.classList.remove('visible'); pdl.classList.add('hidden');
    pa.classList.add('hidden'); pinfo.textContent='';
}
document.getElementById('photo-reset').addEventListener('click', resetP);

pc.addEventListener('click', function(e){
    if (!pimg.src) return;
    const r = pc.getBoundingClientRect();
    const x = e.clientX-r.left+pc.scrollLeft;
    const y = e.clientY-r.top+pc.scrollTop;
    if (pp.length>=2) resetP();
    pp.push({x:x,y:y});
    if (pp.length===1){
        p1.style.left=x+'px'; p1.style.top=y+'px';
        p1.classList.add('visible');
        pinfo.textContent='Точка 1. Кликните вторую.';
    } else if (pp.length===2){
        p2.style.left=x+'px'; p2.style.top=y+'px';
        p2.classList.add('visible');
        pixDist = Math.hypot(pp[1].x-pp[0].x, pp[1].y-pp[0].y);
        pinfo.textContent='Расстояние: '+Math.round(pixDist)+' px. Укажите длину.';
        pdl.classList.remove('hidden'); pa.classList.remove('hidden');
    }
});

pa.addEventListener('click', function(){
    const m = parseFloat(pd.value);
    if (isNaN(m)||m<=0){ alert('Введите расстояние.'); return; }
    if (pixDist<=0) return;
    const ppm = pixDist/m;
    pg.classList.add('visible');
    pg.style.backgroundSize = ppm+'px '+ppm+'px';
    pinfo.textContent = 'Масштаб: 1 м = '+Math.round(ppm)+' px';
});

// PNG
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

// Очистка
document.getElementById('clear-btn').addEventListener('click', function(){
    if (!confirm('Удалить всё?')) return;
    room.querySelectorAll('.furniture, .opening').forEach(function(el){el.remove();});
    openings=[]; save();
});

// Сохранение
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


