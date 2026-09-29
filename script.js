
const SCALE = 100, MIN_PASSAGE = 60;
const room = document.getElementById('room');

const LIB = {
    sofa:{name:'Диван',w:2,h:1,h3:0.8,color:'#6366f1',shape:'rounded'},
    armchair:{name:'Кресло',w:0.9,h:0.9,h3:0.8,color:'#f59e0b',shape:'rounded'},
    chair:{name:'Стул',w:0.5,h:0.5,h3:0.9,color:'#dc2626',shape:'rounded'},
    table:{name:'Стол',w:1.2,h:0.8,h3:0.75,color:'#92400e',shape:'rect'},
    table_round:{name:'Круглый',w:1.2,h:1.2,h3:0.75,color:'#78350f',shape:'round'},
    wardrobe:{name:'Шкаф',w:1.2,h:0.6,h3:2.2,color:'#64748b',shape:'rect'},
    bed:{name:'Кровать',w:2,h:1.6,h3:0.5,color:'#a855f7',shape:'rect'},
    bed_single:{name:'Кровать 1-сп',w:1,h:2,h3:0.5,color:'#8b5cf6',shape:'rect'},
    lamp:{name:'Торшер',w:0.4,h:0.4,h3:1.6,color:'#eab308',shape:'round'},
    plant:{name:'Растение',w:0.5,h:0.5,h3:1,color:'#22c55e',shape:'round'},
    tv:{name:'ТВ',w:1.2,h:0.1,h3:0.7,color:'#1f2937',shape:'rect'},
    bookshelf:{name:'Полка',w:0.8,h:0.3,h3:1.8,color:'#a16207',shape:'rect'}
};
const COLORS = ['#f97316','#14b8a6','#ef4444','#8b5cf6','#3b82f6','#22c55e'];
let colorIdx = 0;
let roomW = 6, roomH = 5, wallH = 2.7;
let balcony = null, openings = [], currentTool = null;

// Счётчик
(function(){
    let v = parseInt(localStorage.getItem('planner-visits')||'0',10)+1;
    localStorage.setItem('planner-visits', v);
    const e = document.getElementById('visits-count');
    if (e) e.textContent = v;
})();

// Приветствие
const wb = document.getElementById('welcome-start');
if (wb) wb.addEventListener('click', function(){
    document.getElementById('welcome-modal').classList.add('hidden');
    try{localStorage.setItem('planner-welcomed','1');}catch(e){}
});
if (localStorage.getItem('planner-welcomed')==='1') {
    const wm = document.getElementById('welcome-modal');
    if (wm) wm.classList.add('hidden');
}

// Размер комнаты
function roomSize(){
    let w = roomW, h = roomH;
    if (balcony){
        if (balcony.side==='left'||balcony.side==='right') w += balcony.depth;
        if (balcony.side==='top'||balcony.side==='bottom') h += balcony.depth;
    }
    return {w:w, h:h};
}
function updateRoom(){
    const s = roomSize();
    room.style.width = (s.w*SCALE)+'px';
    room.style.height = (s.h*SCALE)+'px';
    renderBalcony(); renderOpenings();
}
function applyRoom(){
    let w = parseFloat(document.getElementById('room-w').value);
    let h = parseFloat(document.getElementById('room-h').value);
    let h2 = parseFloat(document.getElementById('room-h2').value);
    if (isNaN(w)||w<2) w=2; if (isNaN(h)||h<2) h=2;
    if (w>10) w=10; if (h>10) h=10;
    if (isNaN(h2)||h2<2.2) h2=2.2; if (h2>4) h2=4;
    roomW=w; roomH=h; wallH=h2;
    document.getElementById('room-w').value=w;
    document.getElementById('room-h').value=h;
    document.getElementById('room-h2').value=h2;
    updateRoom();
    room.querySelectorAll('.furniture').forEach(clamp);
    save();
}
document.getElementById('apply-room').addEventListener('click', applyRoom);

// Балкон
function renderBalcony(){
    const old = room.querySelector('.balcony-zone');
    if (old) old.remove();
    if (!balcony) return;
    const z = document.createElement('div');
    z.className = 'balcony-zone';
    const d = balcony.depth*SCALE;
    const W = room.clientWidth, H = room.clientHeight;
    if (balcony.side==='top') z.style.cssText='top:0;left:0;width:'+W+'px;height:'+d+'px;';
    if (balcony.side==='bottom') z.style.cssText='bottom:0;left:0;width:'+W+'px;height:'+d+'px;';
    if (balcony.side==='left') z.style.cssText='top:0;left:0;width:'+d+'px;height:'+H+'px;';
    if (balcony.side==='right') z.style.cssText='top:0;right:0;width:'+d+'px;height:'+H+'px;';
    const l = document.createElement('div');
    l.className = 'balcony-label';
    l.textContent = 'Балкон · '+balcony.depth+' м';
    z.appendChild(l);
    room.appendChild(z);
}
const bm = document.getElementById('balcony-modal');
document.getElementById('btn-balcony').addEventListener('click', function(){
    if (balcony){
        document.getElementById('balcony-side').value = balcony.side;
        document.getElementById('balcony-depth').value = balcony.depth;
        document.getElementById('balcony-opening').value = balcony.opening;
    }
    bm.classList.remove('hidden');
});
document.getElementById('balcony-close').addEventListener('click', function(){ bm.classList.add('hidden'); });
document.getElementById('balcony-apply').addEventListener('click', function(){
    const side = document.getElementById('balcony-side').value;
    let depth = parseFloat(document.getElementById('balcony-depth').value);
    let opening = parseFloat(document.getElementById('balcony-opening').value);
    if (isNaN(depth)||depth<0.8) depth=0.8; if (depth>3) depth=3;
    if (isNaN(opening)||opening<0.6) opening=0.6; if (opening>3) opening=3;
    balcony = {side:side, depth:depth, opening:opening};
    updateRoom(); save(); bm.classList.add('hidden');
});
document.getElementById('balcony-remove').addEventListener('click', function(){
    if (!balcony){ alert('Балкона нет'); return; }
    if (!confirm('Удалить балкон?')) return;
    balcony = null; updateRoom(); save(); bm.classList.add('hidden');
});

// Двери / окна
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
    openings.push({type:currentTool, side:side, position:pos, width:w,
        side_direction:document.getElementById('opening-side').value});
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

// Границы и проверки
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
function checkFits(name, w, h){
    const s = roomSize();
    if (!((w<=s.w&&h<=s.h)||(h<=s.w&&w<=s.h))){
        alert('«'+name+'» '+w+'×'+h+' м не влезает.');
        return false;
    }
    return true;
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

// Создание
function createEl(name, w, h, color, shape, h3, left, top){
    const el = document.createElement('div');
    el.className = 'furniture';
    if (shape && shape!=='rect') el.classList.add('shape-'+shape);
    el.style.width=(w*SCALE)+'px'; el.style.height=(h*SCALE)+'px';
    el.style.background=color;
    el.style.left=(left||0)+'px'; el.style.top=(top||0)+'px';
    el.dataset.name=name; el.dataset.w=w; el.dataset.h=h;
    el.dataset.height=h3||0.8; el.dataset.shape=shape||'rect';
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
document.querySelectorAll('.tool-btn[data-type]').forEach(function(b){
    b.addEventListener('click', function(){
        const t = LIB[b.dataset.type];
        if (!t || !checkFits(t.name, t.w, t.h)) return;
        const p = findFree(t.w, t.h);
        room.appendChild(createEl(t.name, t.w, t.h, t.color, t.shape, t.h3, p.x, p.y));
        save();
    });
});
document.getElementById('add-custom').addEventListener('click', function(){
    const name = document.getElementById('f-name').value.trim()||'Мебель';
    const shape = document.getElementById('f-shape').value;
    let w = parseFloat(document.getElementById('f-w').value);
    let h = parseFloat(document.getElementById('f-h').value);
    if (isNaN(w)||w<0.5) w=0.5; if (isNaN(h)||h<0.5) h=0.5;
    if (w>5) w=5; if (h>5) h=5;
    if (!checkFits(name,w,h)) return;
    const c = COLORS[colorIdx++%COLORS.length];
    const p = findFree(w,h);
    room.appendChild(createEl(name,w,h,c,shape,0.8,p.x,p.y));
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

// Эргономика
document.getElementById('btn-ergo').addEventListener('click', function(){
    const items = Array.from(room.querySelectorAll('.furniture'));
    items.forEach(function(el){el.classList.remove('ergo-warning');});
    if (items.length<2){ alert('Добавьте минимум 2 предмета.'); return; }
    const v = [];
    for (let i=0; i<items.length; i++){
        for (let j=i+1; j<items.length; j++){
            const a=items[i], b=items[j];
            const aL=a.offsetLeft, aT=a.offsetTop, aR=aL+a.offsetWidth, aB=aT+a.offsetHeight;
            const bL=b.offsetLeft, bT=b.offsetTop, bR=bL+b.offsetWidth, bB=bT+b.offsetHeight;
            const dx = Math.max(0, Math.max(aL,bL)-Math.min(aR,bR));
            const dy = Math.max(0, Math.max(aT,bT)-Math.min(aB,bB));
            if (dx===0&&dy===0 || (dy===0&&dx>0&&dx<MIN_PASSAGE) || (dx===0&&dy>0&&dy<MIN_PASSAGE)){
                a.classList.add('ergo-warning'); b.classList.add('ergo-warning');
                v.push(a.dataset.name+' ↔ '+b.dataset.name);
            }
        }
    }
    if (v.length===0) alert('Эргономика в порядке!');
    else alert('Проблем: '+v.length+'\n\n'+v.slice(0,15).join('\n'));
});

// Фото
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

// PNG, очистка
document.getElementById('save-png').addEventListener('click', function(){
    const btns = document.querySelectorAll('.rotate-btn, .delete-btn');
    btns.forEach(function(b){b.style.visibility='hidden';});
    html2canvas(room,{backgroundColor:'#fefefe',scale:2}).then(function(c){
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
    room.querySelectorAll('.furniture, .opening').forEach(function(el){el.remove();});
    openings=[]; save();
});

// Сохранение
function save(){
    const items = [];
    room.querySelectorAll('.furniture').forEach(function(el){
        items.push({
            name:el.dataset.name, w:parseFloat(el.dataset.w), h:parseFloat(el.dataset.h),
            height:parseFloat(el.dataset.height)||0.8, color:el.dataset.color,
            shape:el.dataset.shape, left:el.style.left, top:el.style.top
        });
    });
    try{
        localStorage.setItem('planner-state-v3', JSON.stringify({
            roomW:roomW, roomH:roomH, roomWallHeight:wallH,
            balcony:balcony, openings:openings, items:items
        }));
    }catch(e){}
}
function load(){
    const raw = localStorage.getItem('planner-state-v3');
    if (!raw) return false;
    try{
        const s = JSON.parse(raw);
        roomW = s.roomW||6; roomH = s.roomH||5;
        wallH = s.roomWallHeight||2.7;
        balcony = s.balcony||null; openings = s.openings||[];
        document.getElementById('room-w').value=roomW;
        document.getElementById('room-h').value=roomH;
        document.getElementById('room-h2').value=wallH;
        updateRoom();
        (s.items||[]).forEach(function(it){
            const el = createEl(it.name,it.w,it.h,it.color,it.shape,it.height,parseFloat(it.left),parseFloat(it.top));
            room.appendChild(el);
        });
        return true;
    }catch(e){ return false; }
}
if (!load()) updateRoom();

// 3D
let THREE=null, OrbitControlsClass=null;
let s3, cam3, r3, ctrl3, grp3, init3=false, loading3=false;

async function loadThree(){
    if (THREE) return true;
    if (loading3) return false;
    loading3 = true;
    try{
        THREE = await import('three');
        const m = await import('three/addons/controls/OrbitControls.js');
        OrbitControlsClass = m.OrbitControls;
        return true;
    }catch(err){
        console.error('3D error:', err);
        alert('Не удалось загрузить 3D');
        loading3 = false;
        return false;
    }
}

async function init3D(){
    if (init3) return;
    const ok = await loadThree();
    if (!ok) return;
    const cv = document.getElementById('canvas3d');
    const cont = document.getElementById('view-3d-container');
    const w = cont.clientWidth, h = cont.clientHeight;
    s3 = new THREE.Scene();
    s3.background = new THREE.Color(0xe0e7ff);
    cam3 = new THREE.PerspectiveCamera(50, w/h, 0.1, 200);
    cam3.position.set(8,8,12);
    r3 = new THREE.WebGLRenderer({canvas:cv, antialias:true});
    r3.setSize(w,h); r3.setPixelRatio(window.devicePixelRatio);
    r3.shadowMap.enabled = true;
    ctrl3 = new OrbitControlsClass(cam3, cv);
    ctrl3.enableDamping = true; ctrl3.dampingFactor = 0.08;
    ctrl3.maxPolarAngle = Math.PI/2.05;
    ctrl3.target.set(0,0,0);

    s3.add(new THREE.AmbientLight(0xffffff, 0.6));
    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(10,15,8); sun.castShadow = true;
    sun.shadow.mapSize.width = 2048; sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.left = -15; sun.shadow.camera.right = 15;
    sun.shadow.camera.top = 15; sun.shadow.camera.bottom = -15;
    s3.add(sun);

    const g = new THREE.Mesh(
        new THREE.PlaneGeometry(60,60),
        new THREE.MeshStandardMaterial({color:0xcbd5e1})
    );
    g.rotation.x = -Math.PI/2; g.position.y = -0.01;
    g.receiveShadow = true; s3.add(g);

    grp3 = new THREE.Group(); s3.add(grp3);
    init3 = true;
    build3D();

    function anim(){
        requestAnimationFrame(anim);
        ctrl3.update(); r3.render(s3, cam3);
    }
    anim();

    window.addEventListener('resize', function(){
        if (!init3) return;
        const w = cont.clientWidth, h = cont.clientHeight;
        cam3.aspect = w/h; cam3.updateProjectionMatrix();
        r3.setSize(w,h);
    });
}

function build3D(){
    if (!init3) return;
    while (grp3.children.length>0){
        const o = grp3.children.pop();
        if (o.geometry) o.geometry.dispose();
        if (o.material){
            if (Array.isArray(o.material)) o.material.forEach(function(m){m.dispose();});
            else o.material.dispose();
        }
    }
    const s = roomSize();
    const W = s.w, H = s.h, cx = W/2, cz = H/2;

    const fl = new THREE.Mesh(
        new THREE.BoxGeometry(W, 0.1, H),
        new THREE.MeshStandardMaterial({color:0xd6b48a})
    );
    fl.position.set(0,-0.05,0); fl.receiveShadow = true;
    grp3.add(fl);

    const wm = new THREE.MeshStandardMaterial({color:0xf1f5f9, side:THREE.DoubleSide, transparent:true, opacity:0.75});
    const w1 = new THREE.Mesh(new THREE.BoxGeometry(W, wallH, 0.1), wm); w1.position.set(0, wallH/2, cz); grp3.add(w1);
    const w2 = new THREE.Mesh(new THREE.BoxGeometry(W, wallH, 0.1), wm); w2.position.set(0, wallH/2, -cz); grp3.add(w2);
    const w3 = new THREE.Mesh(new THREE.BoxGeometry(0.1, wallH, H), wm); w3.position.set(-cx, wallH/2, 0); grp3.add(w3);
    const w4 = new THREE.Mesh(new THREE.BoxGeometry(0.1, wallH, H), wm); w4.position.set(cx, wallH/2, 0); grp3.add(w4);

    openings.forEach(function(op){
        const isDoor = op.type==='door';
        const ww = op.width;
        const hh = isDoor?2.05:1.4;
        const yy = isDoor? hh/2 : 1.0+hh/2;
        let geo;
        if (op.side==='top'||op.side==='bottom') geo = new THREE.BoxGeometry(ww, hh, 0.15);
        else geo = new THREE.BoxGeometry(0.15, hh, ww);
        const mat = new THREE.MeshStandardMaterial({
            color: isDoor?0x8b5a2b:0xbfdbfe,
            transparent:true, opacity: isDoor?0.95:0.6
        });
        const mesh = new THREE.Mesh(geo, mat);
        const off = op.position - (op.side==='top'||op.side==='bottom'? W/2 : H/2);
        if (op.side==='top') mesh.position.set(off, yy, -cz);
        if (op.side==='bottom') mesh.position.set(off, yy, cz);
        if (op.side==='left') mesh.position.set(-cx, yy, off);
        if (op.side==='right') mesh.position.set(cx, yy, off);
        mesh.castShadow = true;
        grp3.add(mesh);
    });

    room.querySelectorAll('.furniture').forEach(function(el){
        const w = parseFloat(el.dataset.w), d = parseFloat(el.dataset.h);
        const h = parseFloat(el.dataset.height)||0.8;
        const color = el.dataset.color||'#6366f1';
        const shape = el.dataset.shape||'rect';
        const px = el.offsetLeft/SCALE, pz = el.offsetTop/SCALE;
        const x3 = px + w/2 - cx, z3 = pz + d/2 - cz;
        let geo;
        if (shape==='round'||shape==='oval') geo = new THREE.CylinderGeometry(w/2, w/2, h, 24);
        else geo = new THREE.BoxGeometry(w, h, d);
        const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({color:color, roughness:0.7, metalness:0.05}));
        mesh.position.set(x3, h/2, z3);
        mesh.castShadow = true; mesh.receiveShadow = true;
        grp3.add(mesh);
    });
}

document.getElementById('view-2d').addEventListener('click', function(){
    document.getElementById('view-2d').classList.add('active');
    document.getElementById('view-3d').classList.remove('active');
    document.getElementById('view-2d-container').classList.add('active');
    document.getElementById('view-3d-container').classList.remove('active');
});
document.getElementById('view-3d').addEventListener('click', function(){
    document.getElementById('view-3d').classList.add('active');
    document.getElementById('view-2d').classList.remove('active');
    document.getElementById('view-3d-container').classList.add('active');
    document.getElementById('view-2d-container').classList.remove('active');
    setTimeout(async function(){
        await init3D();
        if (init3) build3D();
    }, 50);
});


