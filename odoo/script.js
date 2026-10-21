/* @odoo-module */
// Portfolio behaviour. Plain JS, runs only on the page that contains
// .sk-portfolio and never touches content while the website editor is open.

(function () {
    function init() {
        var root = document.querySelector('.sk-portfolio');
        if (!root || root.dataset.skReady) {
            return;
        }
        root.dataset.skReady = '1';

        // The Home view must be the new layout (has the sidebar); otherwise do nothing.
        if (!root.querySelector('.sk-nav') || !root.querySelector('.sk-bento')) {
            if (window.console) { console.warn('Portfolio: update the Home view with the latest index.html'); }
            return;
        }

        // Leave the DOM alone while editing in the website builder.
        if (document.body.classList.contains('editor_enable') || document.querySelector('.o_we_website_top_actions')) {
            return;
        }

        // Load the theme fonts once
        if (!document.getElementById('sk-fonts')) {
            var f = document.createElement('link');
            f.id = 'sk-fonts';
            f.rel = 'stylesheet';
            f.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap';
            document.head.appendChild(f);
        }

        var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        root.classList.add('sk-js');
        document.body.classList.add('sk-page');

        var nav = root.querySelector('.sk-nav');
        var burger = root.querySelector('.sk-burger');
        var links = root.querySelectorAll('.sk-link');
        var topBtn = root.querySelector('.sk-top');
        var bar = root.querySelector('.sk-progress span');

        /* ---- storage helpers (may be blocked) ---- */
        function store(key, val) {
            try {
                if (val === undefined) {
                    return window.localStorage.getItem(key);
                }
                window.localStorage.setItem(key, val);
            } catch (e) { /* ignore */ }
            return null;
        }

        /* ---- toast ---- */
        var toast = document.createElement('div');
        toast.className = 'sk-toast';
        root.appendChild(toast);
        var toastTimer;
        function say(msg) {
            toast.textContent = msg;
            toast.classList.add('sk-show');
            clearTimeout(toastTimer);
            toastTimer = setTimeout(function () { toast.classList.remove('sk-show'); }, 2000);
        }

        /* ---- dark (default) / light theme ---- */
        var themeBtn = root.querySelector('[data-action="theme"]');
        function applyTheme(t) {
            if (t === 'light') {
                root.setAttribute('data-sk-theme', 'light');
            } else {
                root.removeAttribute('data-sk-theme');
            }
            if (themeBtn) {
                themeBtn.innerHTML = t === 'light' ? '<i class="fa fa-moon-o"></i>' : '<i class="fa fa-sun-o"></i>';
            }
            var wrap = document.getElementById('wrapwrap');
            if (wrap) {
                wrap.style.background = t === 'light' ? '#f2f6fd' : '#050a18';
            }
        }
        applyTheme(store('sk-theme') === 'light' ? 'light' : 'dark');
        if (themeBtn) {
            themeBtn.addEventListener('click', function () {
                var next = root.getAttribute('data-sk-theme') === 'light' ? 'dark' : 'light';
                applyTheme(next);
                store('sk-theme', next);
            });
        }

        /* ---- download CV: saves the embedded PDF directly (falls back to print) ---- */
        var dlBtn = root.querySelector('[data-action="download"]');
        if (dlBtn) {
            dlBtn.addEventListener('click', function () {
                var b64 = dlBtn.getAttribute('data-cv');
                if (!b64) {
                    root.querySelectorAll('.sk-reveal').forEach(function (el) { el.classList.add('sk-in'); });
                    say('Choose "Save as PDF" in the print dialog');
                    setTimeout(function () { window.print(); }, 350);
                    return;
                }
                try {
                    var bin = atob(b64);
                    var bytes = new Uint8Array(bin.length);
                    for (var i = 0; i < bin.length; i++) { bytes[i] = bin.charCodeAt(i); }
                    var blob = new Blob([bytes], { type: 'application/pdf' });
                    var url = URL.createObjectURL(blob);
                    var a = document.createElement('a');
                    a.href = url;
                    a.download = dlBtn.getAttribute('data-filename') || 'Resume.pdf';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
                    say('Resume downloaded');
                } catch (e) {
                    say('Download failed, please try again');
                }
            });
        }

        /* ---- copy email ---- */
        root.querySelectorAll('[data-copy]').forEach(function (el) {
            el.addEventListener('click', function () {
                var text = el.getAttribute('data-copy');
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(function () { say('Email copied'); }, function () { say(text); });
                } else {
                    say(text);
                }
            });
        });

        /* ---- mobile dropdown menu ---- */
        function closeMenu() {
            if (nav) { nav.classList.remove('sk-menu-open'); }
            if (burger) { burger.classList.remove('sk-open'); }
        }
        document.addEventListener('click', function (e) {
            if (nav && nav.classList.contains('sk-menu-open') && !nav.contains(e.target)) { closeMenu(); }
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') { closeMenu(); }
        });
        if (burger && nav) {
            burger.addEventListener('click', function () {
                var open = !nav.classList.contains('sk-menu-open');
                nav.classList.toggle('sk-menu-open', open);
                burger.classList.toggle('sk-open', open);
            });
        }

        /* ---- smooth scroll for in-page links ---- */
        root.querySelectorAll('a[href^="#"]').forEach(function (a) {
            a.addEventListener('click', function (e) {
                var target = root.querySelector(a.getAttribute('href'));
                if (!target) {
                    return;
                }
                e.preventDefault();
                target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
                closeMenu();
            });
        });

        /* ---- scroll: progress bar and back-to-top (Odoo may scroll #wrapwrap, not window) ---- */
        var wrapEl = document.getElementById('wrapwrap');
        function scrollInfo() {
            if (wrapEl && wrapEl.scrollHeight > wrapEl.clientHeight + 2 && getComputedStyle(wrapEl).overflowY !== 'visible') {
                return { y: wrapEl.scrollTop, max: wrapEl.scrollHeight - wrapEl.clientHeight };
            }
            var de = document.documentElement;
            return { y: window.pageYOffset || de.scrollTop, max: de.scrollHeight - window.innerHeight };
        }
        function onScroll() {
            var s = scrollInfo();
            if (bar) {
                bar.style.width = (s.max > 0 ? (s.y / s.max) * 100 : 0) + '%';
            }
            if (topBtn) {
                topBtn.classList.toggle('sk-show', s.y > 500);
            }
            if (nav) {
                nav.classList.toggle('sk-scrolled', s.y > 20);
            }
        }
        document.addEventListener('scroll', onScroll, { passive: true, capture: true });
        onScroll();

        /* ---- scroll-spy ---- */
        if ('IntersectionObserver' in window) {
            var spy = new IntersectionObserver(function (entries) {
                entries.forEach(function (en) {
                    if (en.isIntersecting) {
                        var id = '#' + en.target.id;
                        links.forEach(function (l) {
                            l.classList.toggle('sk-active', l.getAttribute('href') === id);
                        });
                    }
                });
            }, { rootMargin: '-40% 0px -55% 0px' });
            root.querySelectorAll('section[id]').forEach(function (s) { spy.observe(s); });
        }

        /* ---- reveal on scroll + stat counters ---- */
        function countUp(el) {
            var target = parseFloat(el.dataset.count);
            var suffix = el.dataset.suffix || '';
            var decimals = (String(el.dataset.count).split('.')[1] || '').length;
            if (reduced || isNaN(target)) {
                return;
            }
            var start = null;
            function step(ts) {
                start = start || ts;
                var p = Math.min((ts - start) / 1400, 1);
                var eased = 1 - Math.pow(1 - p, 3);
                el.textContent = (target * eased).toFixed(decimals) + (p === 1 ? suffix : '');
                if (p < 1) {
                    requestAnimationFrame(step);
                }
            }
            requestAnimationFrame(step);
        }

        var revealEls = root.querySelectorAll('.sk-reveal');
        if ('IntersectionObserver' in window) {
            var io = new IntersectionObserver(function (entries, obs) {
                entries.forEach(function (en) {
                    if (en.isIntersecting) {
                        en.target.classList.add('sk-in');
                        en.target.querySelectorAll('[data-count]').forEach(countUp);
                        obs.unobserve(en.target);
                    }
                });
            }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
            revealEls.forEach(function (el) { io.observe(el); });
        } else {
            revealEls.forEach(function (el) { el.classList.add('sk-in'); });
        }

        /* ---- tile spotlight follows the mouse ---- */
        root.querySelectorAll('.sk-tile').forEach(function (tile) {
            tile.addEventListener('mousemove', function (e) {
                var r = tile.getBoundingClientRect();
                tile.style.setProperty('--mx', (e.clientX - r.left) + 'px');
                tile.style.setProperty('--my', (e.clientY - r.top) + 'px');
            });
        });

        /* ---- typing role rotator ---- */
        var typed = root.querySelector('.sk-typed');
        if (typed && !reduced) {
            var words = (typed.dataset.words || '').split('|').filter(Boolean);
            var wi = 0, ci = words.length ? words[0].length : 0, deleting = true;
            (function tick() {
                var word = words[wi];
                typed.textContent = word.slice(0, ci);
                var delay = deleting ? 45 : 85;
                if (!deleting && ci === word.length) {
                    deleting = true;
                    delay = 1800;
                } else if (deleting && ci === 0) {
                    deleting = false;
                    wi = (wi + 1) % words.length;
                    return setTimeout(function () { ci = 1; tick(); }, 300);
                } else {
                    ci += deleting ? -1 : 1;
                }
                setTimeout(tick, delay);
            })();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
