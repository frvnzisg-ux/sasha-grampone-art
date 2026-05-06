/* Sasha Grampone Art — interactions */

(function () {
  // ------ Helpers ------
  const $$ = (s, root = document) => root.querySelectorAll(s);
  const getGalleryItems = () => $$('.gallery .gallery-item');
  const esc = (s) => String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  // ------ Mobile nav toggle ------
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open);
    });
  }

  // ------ Reveal-on-scroll (re-callable for dynamically added .reveal) ------
  let revealObserver = null;
  function observeReveals() {
    const reveal = $$('.reveal:not(.visible)');
    if ('IntersectionObserver' in window) {
      if (!revealObserver) {
        revealObserver = new IntersectionObserver((entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('visible');
              revealObserver.unobserve(e.target);
            }
          });
        }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
      }
      reveal.forEach((el) => revealObserver.observe(el));
    } else {
      reveal.forEach((el) => el.classList.add('visible'));
    }
  }
  observeReveals();

  // ------ Dynamic gallery / featured rendering from /data/paintings.json ------
  // Containers opt in via:  <div class="gallery" data-source="paintings.json"></div>
  //                         <div class="featured-grid" data-source="paintings.json:featured"></div>
  async function renderDynamicSources() {
    const sources = $$('[data-source]');
    if (!sources.length) return;
    const fileNames = new Set();
    sources.forEach((el) => {
      const [file] = String(el.dataset.source).split(':');
      if (file) fileNames.add(file);
    });

    const cache = {};
    await Promise.all(
      [...fileNames].map(async (f) => {
        try {
          const res = await fetch(`/data/${f}?_=${Date.now()}`, { cache: 'no-store' });
          cache[f] = await res.json();
        } catch (e) {
          console.warn('Failed to load', f, e);
          cache[f] = { items: [] };
        }
      })
    );

    sources.forEach((el) => {
      const [file, scope] = String(el.dataset.source).split(':');
      const data = cache[file] || { items: [] };
      const items = (data.items || []).slice().sort((a, b) => (a.order || 999) - (b.order || 999));

      if (el.classList.contains('gallery')) {
        // Portfolio gallery — render full set; filter buttons handle visibility
        el.innerHTML = items.map((p) => `
          <div class="gallery-item" data-category="${esc(p.subject)}" data-title="${esc(p.title)}" data-meta="${esc(p.meta || p.label || '')}">
            <img src="${esc(p.image)}" alt="${esc(p.imageAlt || p.title)}" loading="lazy" />
            <div class="gallery-item-info"><h4>${esc(p.title)}</h4><span>${esc(p.label || '')}</span></div>
          </div>
        `).join('');
      } else if (el.classList.contains('featured-grid')) {
        // Homepage featured grid — only featured items, capped to 5
        const feat = items.filter((p) => p.featured).slice(0, 5);
        el.innerHTML = feat.map((p, idx) => `
          <a class="feat-card${idx === 0 ? ' feat-tall' : ''}" href="portfolio.html">
            <img src="${esc(p.image)}" alt="${esc(p.imageAlt || p.title)}" loading="lazy" />
            <div class="feat-card-info">
              <h4>${esc(p.title)}</h4>
              <span>${esc(p.label || '')}</span>
            </div>
          </a>
        `).join('');
      } else if (el.classList.contains('originals-grid')) {
        // Originals page
        const fmtPrice = (o) => {
          if (o.priceDisplay) return esc(o.priceDisplay);
          const n = parseFloat(o.price);
          if (!isFinite(n)) return '';
          return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
        };
        const statusLabel = (s) => ({
          available: 'Available',
          'coming-soon': 'Coming Soon',
          sold: 'Sold',
        })[s] || s;
        el.innerHTML = items.map((o) => `
          <article class="original-card">
            <div class="original-img">
              <span class="original-badge ${o.status === 'coming-soon' ? 'soon' : (o.status === 'sold' ? 'sold' : '')}">${esc(statusLabel(o.status))}</span>
              <img src="${esc(o.image)}" alt="${esc(o.imageAlt || o.title)}" loading="lazy" />
            </div>
            <div class="original-info">
              <h3>${esc(o.title)}</h3>
              <p class="original-meta">${esc([o.medium, o.size, o.year ? '' + o.year : null].filter(Boolean).join(' · '))}</p>
              <span class="original-price">${fmtPrice(o)}</span>
              <a href="${o.status === 'sold' ? 'commissions.html#inquire' : 'contact.html'}" class="btn btn-secondary">${esc(o.ctaLabel || 'Inquire to Purchase')}</a>
            </div>
          </article>
        `).join('');
      } else if (el.classList.contains('pricing')) {
        // Commissions pricing tiers
        const tiers = (data.pricing || []).slice();
        el.innerHTML = tiers.map((t) => `
          <div class="price-card">
            <p class="eyebrow">${esc(t.eyebrow || '')}</p>
            <h3>${esc(t.name || '')}</h3>
            <span class="price">${esc(t.fromDisplay || (t.from ? 'from $' + t.from : ''))}</span>
            <ul>${(t.items || []).map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
            <a href="#inquire" class="btn btn-secondary">Inquire</a>
          </div>
        `).join('');
      } else if (el.classList.contains('faq')) {
        // FAQ accordion
        const faq = (data.faq || []).slice();
        el.innerHTML = faq.map((f) => `
          <details>
            <summary>${esc(f.q || '')}</summary>
            <div>${esc(f.a || '')}</div>
          </details>
        `).join('');
      } else if (el.classList.contains('marquee-track')) {
        // Marquee — duplicate text twice for seamless scroll
        const text = (data.marquee || '').trim();
        if (text) {
          const span = `<span>${text.split('·').map((s) => `${esc(s.trim())}`).join(' <i class="dot"></i> ')}</span>`;
          el.innerHTML = span + span;
        }
      }
    });

    // Apply data-bind attributes — element textContent is set from a dotted path in site.json
    // e.g. <h1 data-bind="hero.headlinePrefix">...</h1>
    const siteData = cache['site.json'] || {};
    $$('[data-bind]').forEach((el) => {
      const path = el.dataset.bind.split('.');
      let v = siteData;
      for (const p of path) v = v?.[p];
      if (v != null && v !== '') {
        el.textContent = v;
        // Auto-sync mailto:/tel: hrefs so a contact-email change updates both
        const href = el.getAttribute && el.getAttribute('href');
        if (href && href.startsWith('mailto:')) el.setAttribute('href', 'mailto:' + v);
        else if (href && href.startsWith('tel:')) el.setAttribute('href', 'tel:' + v);
      }
    });
    // data-bind-attr supports binding to attributes: data-bind-attr="href:contact.instagramUrl"
    $$('[data-bind-attr]').forEach((el) => {
      const pairs = el.dataset.bindAttr.split(',').map((p) => p.trim());
      pairs.forEach((pair) => {
        const [attr, key] = pair.split(':').map((s) => s.trim());
        if (!attr || !key) return;
        const path = key.split('.');
        let v = siteData;
        for (const p of path) v = v?.[p];
        if (v != null && v !== '') el.setAttribute(attr, v);
      });
    });
    // data-count attribute (animated counters): keep value in sync
    $$('[data-bind-count]').forEach((el) => {
      const path = el.dataset.bindCount.split('.');
      let v = siteData;
      for (const p of path) v = v?.[p];
      if (v != null && isFinite(v)) {
        el.dataset.count = v;
        el.textContent = '0';
      }
    });

    // Re-observe new .reveal children, then notify other modules
    observeReveals();
    document.dispatchEvent(new CustomEvent('gallery:loaded'));
  }

  // ------ Gallery filters (re-queries items each click) ------
  const filterBtns = $$('.gallery-filters button');
  if (filterBtns.length) {
    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const target = btn.dataset.filter;
        getGalleryItems().forEach((item) => {
          const cats = (item.dataset.category || '').split(' ');
          const show = target === 'all' || cats.includes(target);
          item.style.display = show ? '' : 'none';
        });
      });
    });
  }

  // ------ Lightbox (uses event delegation; works for dynamic items) ------
  const lightbox = document.querySelector('.lightbox');
  if (lightbox) {
    const lbImg = lightbox.querySelector('img');
    const lbTitle = lightbox.querySelector('.lightbox-info h4');
    const lbMeta = lightbox.querySelector('.lightbox-info p');
    const closeBtn = lightbox.querySelector('.lightbox-close');
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');

    let visibleItems = [];
    let currentIndex = 0;

    const refreshVisible = () => {
      visibleItems = Array.from(getGalleryItems()).filter((i) => i.style.display !== 'none');
    };

    const showAt = (index) => {
      refreshVisible();
      if (!visibleItems.length) return;
      currentIndex = (index + visibleItems.length) % visibleItems.length;
      const item = visibleItems[currentIndex];
      const img = item.querySelector('img');
      lbImg.src = img.dataset.full || img.src;
      lbImg.alt = img.alt || '';
      lbTitle.textContent = item.dataset.title || '';
      lbMeta.textContent = item.dataset.meta || '';
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    };

    const close = () => {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    };

    document.body.addEventListener('click', (e) => {
      const item = e.target.closest('.gallery .gallery-item');
      if (!item) return;
      refreshVisible();
      const i = visibleItems.indexOf(item);
      showAt(i >= 0 ? i : 0);
    });

    if (closeBtn) closeBtn.addEventListener('click', close);
    if (prevBtn) prevBtn.addEventListener('click', () => showAt(currentIndex - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => showAt(currentIndex + 1));
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') showAt(currentIndex - 1);
      if (e.key === 'ArrowRight') showAt(currentIndex + 1);
    });
  }

  // ------ File-input label updates ------
  $$('.field-file input[type="file"]').forEach((input) => {
    input.addEventListener('change', () => {
      const label = input.closest('.field-file').querySelector('span');
      if (!label) return;
      if (input.files && input.files.length) {
        const names = Array.from(input.files).map((f) => f.name).join(', ');
        label.textContent = names.length > 60 ? input.files.length + ' files selected' : names;
      } else {
        label.textContent = label.dataset.placeholder || 'Choose photos';
      }
    });
  });

  // ------ Form submit — Formspree (with placeholder fallback) or demo ------
  $$('form[data-demo], form[data-formspree]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const note = form.querySelector('.form-note');
      const submitBtn = form.querySelector('button[type="submit"]');
      const action = form.getAttribute('action') || '';
      const isDemo = form.hasAttribute('data-demo');
      const isPlaceholder = action.includes('YOUR_FORM_ID') || !action;

      const setNote = (msg, cls) => {
        if (!note) return;
        note.textContent = msg;
        note.classList.remove('success', 'error');
        if (cls) note.classList.add(cls);
      };

      if (isDemo || isPlaceholder) {
        setNote("Thank you — your message has been received. Sasha will reply within 2 business days.", 'success');
        form.reset();
        return;
      }

      try {
        form.classList.add('sending');
        if (submitBtn) submitBtn.disabled = true;
        setNote('Sending…');
        const data = new FormData(form);
        const res = await fetch(action, {
          method: 'POST',
          body: data,
          headers: { Accept: 'application/json' }
        });
        if (res.ok) {
          setNote("Thank you — your message has been received. Sasha will reply within 2 business days.", 'success');
          form.reset();
        } else {
          setNote("Something went wrong. Please email hello@sashagrampone.art directly.", 'error');
        }
      } catch (err) {
        setNote("Network error. Please email hello@sashagrampone.art directly.", 'error');
      } finally {
        form.classList.remove('sending');
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  });

  // ------ Click-to-play video embeds ------
  $$('.video-embed').forEach((el) => {
    el.addEventListener('click', () => {
      if (el.classList.contains('playing')) return;
      const src = el.dataset.embed;
      if (!src) return;
      const iframe = document.createElement('iframe');
      iframe.src = src;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.title = el.dataset.title || 'Video';
      el.appendChild(iframe);
      el.classList.add('playing');
    });
  });

  // ------ Footer year ------
  const yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ------ Before/After reveal slider ------
  $$('.ba-slider').forEach((slider) => {
    const before = slider.querySelector('.ba-slider-before');
    const handle = slider.querySelector('.ba-slider-handle');
    if (!before || !handle) return;
    let pos = parseFloat(slider.dataset.position || '50');
    let dragging = false;
    const update = () => {
      before.style.clipPath = 'inset(0 ' + (100 - pos) + '% 0 0)';
      handle.style.left = pos + '%';
      handle.setAttribute('aria-valuenow', Math.round(pos));
    };
    const setFromX = (clientX) => {
      const rect = slider.getBoundingClientRect();
      pos = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      update();
    };
    const onDown = (e) => {
      dragging = true;
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      setFromX(x);
      e.preventDefault();
    };
    const onMove = (e) => {
      if (!dragging) return;
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      setFromX(x);
    };
    const onUp = () => { dragging = false; };
    slider.addEventListener('mousedown', onDown);
    slider.addEventListener('touchstart', onDown, { passive: false });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
    handle.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { pos = Math.max(0, pos - 4); update(); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { pos = Math.min(100, pos + 4); update(); e.preventDefault(); }
    });
    update();
  });

  // ------ Animated stat counters ------
  const counters = $$('.stat-num[data-count]');
  if ('IntersectionObserver' in window && counters.length) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseInt(el.dataset.count, 10);
        const duration = 1600;
        const start = performance.now();
        const animate = (now) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = Math.floor(eased * target);
          if (t < 1) requestAnimationFrame(animate);
          else el.textContent = target;
        };
        requestAnimationFrame(animate);
        cio.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach((c) => cio.observe(c));
  }

  // ------ Custom "View" cursor over gallery items (event delegation) ------
  const badge = document.querySelector('.cursor-badge');
  if (badge && window.matchMedia('(hover: hover)').matches) {
    document.addEventListener('mousemove', (e) => {
      badge.style.left = e.clientX + 'px';
      badge.style.top = e.clientY + 'px';
    });
    document.body.addEventListener('mouseover', (e) => {
      const item = e.target.closest('.gallery .gallery-item');
      if (item) {
        badge.classList.add('visible');
        item.classList.add('cursor-hidden');
      }
    });
    document.body.addEventListener('mouseout', (e) => {
      const item = e.target.closest('.gallery .gallery-item');
      if (item && !item.contains(e.relatedTarget)) {
        badge.classList.remove('visible');
        item.classList.remove('cursor-hidden');
      }
    });
  }

  // ------ Sticky inquire bar ------
  const sticky = document.querySelector('.sticky-inquire');
  if (sticky) {
    let dismissed = sessionStorage.getItem('inquire-dismissed') === '1';
    const update = () => {
      if (dismissed) return;
      const past = window.scrollY > window.innerHeight * 0.7;
      sticky.classList.toggle('visible', past);
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
    const closeBtn = sticky.querySelector('.sticky-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        dismissed = true;
        sessionStorage.setItem('inquire-dismissed', '1');
        sticky.classList.remove('visible');
      });
    }
  }

  // Kick off dynamic rendering after main listeners are set up
  renderDynamicSources();
})();
