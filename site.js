/* ============================================================
   SIMONE SLAWITZ — shared behaviour
   nav · language toggle · reveal · carousel · lightbox · motion
   ============================================================ */

/* ---------- race intro (homepage, first visit of the session only) ---------- */
(function(){
  var intro = document.getElementById('raceIntro');
  if(!intro) return;
  var seen = false;
  try{ seen = sessionStorage.getItem('raceIntroShown') === '1'; }catch(e){}
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(seen || reduced){
    intro.remove();
    return;
  }
  try{ sessionStorage.setItem('raceIntroShown', '1'); }catch(e){}
  var lights = intro.querySelectorAll('.race-lights span');
  var i = 0;
  function lightNext(){
    if(i < lights.length){
      lights[i].classList.add('lit');
      i++;
      setTimeout(lightNext, 165);
    }else{
      setTimeout(function(){
        lights.forEach(function(l){ l.classList.remove('lit'); });
        intro.classList.add('hide');
        setTimeout(function(){ intro.remove(); }, 520);
      }, 300);
    }
  }
  setTimeout(lightNext, 150);
})();

/* ---------- nav scroll + mobile menu ---------- */
(function(){
  var nav = document.getElementById('mainNav');
  if(nav){
    window.addEventListener('scroll', function(){
      nav.classList.toggle('scrolled', window.scrollY > 60);
    });
  }
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if(toggle && links){
    toggle.addEventListener('click', function(){
      links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', links.classList.contains('open'));
    });
    links.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded','false');
      });
    });
  }
})();

/* ---------- language toggle (persists across pages) ---------- */
(function(){
  var buttons = document.querySelectorAll('[data-lang-btn]');
  var translatable = document.querySelectorAll('[data-en][data-it]');
  function setLanguage(lang){
    document.documentElement.lang = lang;
    translatable.forEach(function(el){ el.innerHTML = el.dataset[lang]; });
    buttons.forEach(function(btn){ btn.classList.toggle('active', btn.dataset.langBtn === lang); });
    try{ localStorage.setItem('siteLanguage', lang); }catch(e){}
  }
  buttons.forEach(function(btn){
    btn.addEventListener('click', function(){ setLanguage(btn.dataset.langBtn); });
  });
  var saved = null;
  try{ saved = localStorage.getItem('siteLanguage'); }catch(e){}
  var browserLang = (navigator.language || 'en').toLowerCase().indexOf('it') === 0 ? 'it' : 'en';
  setLanguage((saved === 'en' || saved === 'it') ? saved : browserLang);
  window.setSiteLanguage = setLanguage;
})();

/* ---------- scroll reveal ---------- */
(function(){
  var nodes = document.querySelectorAll('.reveal');
  if(!nodes.length) return;
  if(!('IntersectionObserver' in window)){
    nodes.forEach(function(el){ el.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
    });
  },{threshold:.08});
  nodes.forEach(function(el){ io.observe(el); });
})();

/* ---------- gallery carousels ---------- */
(function(){
  document.querySelectorAll('.event-gallery').forEach(function(gallery){
    var figures = gallery.querySelectorAll('figure');
    if(figures.length < 2) return;
    figures.forEach(function(f,i){ f.classList.toggle('active', i===0); });
    var current = 0;

    var prev = document.createElement('button');
    prev.className = 'carousel-arrow prev'; prev.type='button';
    prev.setAttribute('aria-label','Previous photo'); prev.innerHTML = '‹';
    var next = document.createElement('button');
    next.className = 'carousel-arrow next'; next.type='button';
    next.setAttribute('aria-label','Next photo'); next.innerHTML = '›';
    var counter = document.createElement('div');
    counter.className = 'carousel-counter';
    counter.innerHTML = '<span class="cur">1</span> <span class="total">/ ' + figures.length + '</span>';
    gallery.appendChild(prev); gallery.appendChild(next); gallery.appendChild(counter);

    function goTo(i){
      figures[current].classList.remove('active');
      current = (i + figures.length) % figures.length;
      figures[current].classList.add('active');
      counter.querySelector('.cur').textContent = current + 1;
    }
    prev.addEventListener('click', function(e){ e.stopPropagation(); goTo(current-1); });
    next.addEventListener('click', function(e){ e.stopPropagation(); goTo(current+1); });

    var sx=0, sy=0;
    gallery.addEventListener('touchstart', function(e){
      if(!e.touches.length) return;
      sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    },{passive:true});
    gallery.addEventListener('touchend', function(e){
      if(!e.changedTouches.length) return;
      var dx = e.changedTouches[0].clientX - sx;
      var dy = e.changedTouches[0].clientY - sy;
      if(Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)){
        if(dx < 0) goTo(current+1); else goTo(current-1);
      }
    },{passive:true});
  });
})();

/* ---------- fullscreen lightbox for gallery images ---------- */
(function(){
  var lightbox = document.getElementById('galleryLightbox');
  if(!lightbox) return;
  var img = lightbox.querySelector('.gallery-lightbox-img');
  var caption = lightbox.querySelector('.gallery-lightbox-caption');
  var meta = lightbox.querySelector('.gallery-lightbox-meta');
  var count = lightbox.querySelector('.gallery-lightbox-count');
  var closeBtn = lightbox.querySelector('.gallery-lightbox-close');
  var prevBtn = lightbox.querySelector('.gallery-lightbox-prev');
  var nextBtn = lightbox.querySelector('.gallery-lightbox-next');
  var items = [], index = 0, tx=0, ty=0;

  function collect(source){
    var gallery = source.closest('.event-gallery');
    var imgs = gallery ? gallery.querySelectorAll('figure img') : [];
    items = Array.prototype.map.call(imgs, function(image){
      var fig = image.closest('figure');
      var t = fig ? fig.querySelector('.figcap-title') : null;
      var m = fig ? fig.querySelector('.figcap-meta') : null;
      return {
        src: image.currentSrc || image.src,
        alt: image.alt || '',
        caption: t ? t.textContent.trim() : '',
        meta: m ? m.textContent.trim() : ''
      };
    });
    index = Array.prototype.indexOf.call(imgs, source);
    if(index < 0) index = 0;
  }
  function render(){
    if(!items.length) return;
    var it = items[index];
    img.src = it.src; img.alt = it.alt;
    caption.textContent = it.caption; meta.textContent = it.meta;
    count.textContent = (index+1) + ' / ' + items.length;
  }
  function open(source){
    collect(source); render();
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }
  function close(){
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
    setTimeout(function(){ if(!lightbox.classList.contains('open')) img.src=''; },350);
  }
  function show(d){
    if(!items.length) return;
    index = (index + d + items.length) % items.length; render();
  }
  document.querySelectorAll('.event-gallery figure img').forEach(function(gi){
    gi.addEventListener('click', function(e){ e.preventDefault(); open(gi); });
  });
  closeBtn.addEventListener('click', close);
  if(prevBtn) prevBtn.addEventListener('click', function(e){ e.stopPropagation(); show(-1); });
  if(nextBtn) nextBtn.addEventListener('click', function(e){ e.stopPropagation(); show(1); });
  lightbox.addEventListener('click', function(e){ if(e.target === lightbox) close(); });
  window.addEventListener('keydown', function(e){
    if(!lightbox.classList.contains('open')) return;
    if(e.key === 'Escape') close();
    if(e.key === 'ArrowLeft') show(-1);
    if(e.key === 'ArrowRight') show(1);
  });
  lightbox.addEventListener('touchstart', function(e){
    if(!e.touches.length) return;
    tx = e.touches[0].clientX; ty = e.touches[0].clientY;
  },{passive:true});
  lightbox.addEventListener('touchend', function(e){
    if(!e.changedTouches.length) return;
    var dx = e.changedTouches[0].clientX - tx;
    var dy = e.changedTouches[0].clientY - ty;
    if(Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)){
      if(dx < 0) show(1); else show(-1);
    }
  },{passive:true});
})();

/* ---------- motion section: mark playing videos ---------- */
(function(){
  var motion = document.querySelector('.motion');
  if(!motion) return;
  motion.querySelectorAll('video').forEach(function(v){
    v.addEventListener('playing', function(){ motion.classList.add('video-is-playing'); });
    v.addEventListener('error', function(){ /* fallback stays visible */ });
  });
})();

/* ---------- scroll progress bar ---------- */
(function(){
  var bar = document.getElementById('scrollProgress');
  if(!bar) return;
  function update(){
    var h = document.documentElement;
    var scrolled = h.scrollTop;
    var max = h.scrollHeight - h.clientHeight;
    bar.style.width = (max > 0 ? (scrolled / max) * 100 : 0) + '%';
  }
  window.addEventListener('scroll', update, {passive:true});
  window.addEventListener('resize', update);
  update();
})();

/* ---------- cursor follow on portfolio imagery ---------- */
(function(){
  if(window.matchMedia && window.matchMedia('(pointer:coarse)').matches) return;
  var follower = document.getElementById('cursorFollow');
  if(!follower) return;
  var targets = document.querySelectorAll('.direction-card, .event-gallery figure img');
  if(!targets.length) return;
  var mx = 0, my = 0, fx = 0, fy = 0;
  document.addEventListener('mousemove', function(e){ mx = e.clientX; my = e.clientY; });
  function loop(){
    fx += (mx - fx) * .18; fy += (my - fy) * .18;
    follower.style.transform = 'translate(' + fx + 'px,' + fy + 'px) translate(-50%,-50%)';
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  targets.forEach(function(t){
    t.addEventListener('mouseenter', function(){
      follower.textContent = (document.documentElement.lang === 'it') ? 'Guarda' : 'View';
      follower.classList.add('show');
    });
    t.addEventListener('mouseleave', function(){ follower.classList.remove('show'); });
  });
})();

/* ---------- count-up numbers ---------- */
(function(){
  var nodes = document.querySelectorAll('[data-count]');
  if(!nodes.length) return;
  function animate(el){
    var target = parseInt(el.getAttribute('data-count'), 10);
    if(isNaN(target)) return;
    var start = null, duration = 1200;
    function step(ts){
      if(start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if(p < 1) requestAnimationFrame(step); else el.textContent = target;
    }
    requestAnimationFrame(step);
  }
  if(!('IntersectionObserver' in window)){
    nodes.forEach(function(el){ el.textContent = el.getAttribute('data-count'); });
    return;
  }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ animate(e.target); io.unobserve(e.target); }
    });
  }, {threshold:.6});
  nodes.forEach(function(el){ io.observe(el); });
})();
