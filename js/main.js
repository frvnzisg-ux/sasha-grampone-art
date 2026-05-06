/* Sasha Grampone Art — interactions */

(function () {
  // Mobile nav toggle
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open);
    });
  }

  // Reveal-on-scroll
  const reveal = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveal.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    reveal.forEach((el) => io.observe(el));
  } else {
    reveal.forEach((el) => el.classList.add('visible'));
  }

  // Gallery filters
  const filterBtns = document.querySelectorAll('.gallery-filters button');
  const galleryItems = document.querySelectorAll('.gallery .gallery-item');
  if (filterBtns.length && galleryItems.length) {
    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const target = btn.dataset.filter;
        galleryItems.forEach((item) => {
          const cats = (item.dataset.category || '').split(' ');
          const show = target === 'all' || cats.includes(target);
          item.style.display = show ? '' : 'none';
        });
      });
    });
  }

  // Lightbox
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
      visibleItems = Array.from(galleryItems).filter((i) => i.style.display !== 'none');
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

    galleryItems.forEach((item, idx) => {
      item.addEventListener('click', () => {
        refreshVisible();
        const i = visibleItems.indexOf(item);
        showAt(i >= 0 ? i : 0);
      });
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

  // File-input label updates
  document.querySelectorAll('.field-file input[type="file"]').forEach((input) => {
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

  // Form submit — Formspree (with placeholder fallback) or demo
  document.querySelectorAll('form[data-demo], form[data-formspree]').forEach((form) => {
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
          setNote("Something went wrong. Please email hello@sashagramponeart.com directly.", 'error');
        }
      } catch (err) {
        setNote("Network error. Please email hello@sashagramponeart.com directly.", 'error');
      } finally {
        form.classList.remove('sending');
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  });

  // Click-to-play video embeds
  document.querySelectorAll('.video-embed').forEach((el) => {
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

  // Footer year
  const yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Before/After reveal slider
  document.querySelectorAll('.ba-slider').forEach((slider) => {
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

  // Animated stat counters
  const counters = document.querySelectorAll('.stat-num[data-count]');
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

  // Custom "View" cursor over gallery items
  const badge = document.querySelector('.cursor-badge');
  const galleryEls = document.querySelectorAll('.gallery .gallery-item');
  if (badge && galleryEls.length && window.matchMedia('(hover: hover)').matches) {
    document.addEventListener('mousemove', (e) => {
      badge.style.left = e.clientX + 'px';
      badge.style.top = e.clientY + 'px';
    });
    galleryEls.forEach((el) => {
      el.addEventListener('mouseenter', () => {
        badge.classList.add('visible');
        el.classList.add('cursor-hidden');
      });
      el.addEventListener('mouseleave', () => {
        badge.classList.remove('visible');
        el.classList.remove('cursor-hidden');
      });
    });
  }

  // Sticky inquire bar
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
})();
