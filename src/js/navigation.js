/* ============================================================
   navigation.js —— 导航、浮层、焦点、状态与动效开关
   原生 <a href="#..."> 承担跳转，JS 只做增强，不劫持滚动。
   ============================================================ */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'sflip.motion';

  function storageGet(key) {
    try {
      return global.sessionStorage ? global.sessionStorage.getItem(key) : null;
    } catch (e) {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      if (global.sessionStorage) global.sessionStorage.setItem(key, value);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * @param {{root: Document|HTMLElement, sections: Array<{id:string, el:Element}>, announce: Function}} options
   * @returns {Function} destroy
   */
  function initNavigation(options) {
    var opts = options || {};
    var root = opts.root || document;
    var sections = opts.sections || [];
    var announce = opts.announce || function () {};

    var destroyFns = [];

    function on(el, type, handler, passive) {
      if (!el) return;
      el.addEventListener(type, handler, passive ? { passive: true } : false);
      destroyFns.push(function () { el.removeEventListener(type, handler); });
    }

    /* ---------- 当前章节标记 ---------- */
    var currentId = null;

    function setCurrent(id) {
      if (!id || id === currentId) return;
      currentId = id;

      var groups = [
        root.querySelectorAll('.site-nav__link[href^="#"]'),
        root.querySelectorAll('.chapter-rail__item[href^="#"]'),
        root.querySelectorAll('.chapter-chips__item[href^="#"]')
      ];

      groups.forEach(function (list) {
        Array.prototype.forEach.call(list, function (link) {
          var href = link.getAttribute('href') || '';
          if (href === '#' + id) {
            link.setAttribute('aria-current', 'location');
          } else {
            link.removeAttribute('aria-current');
          }
        });
      });

      Array.prototype.forEach.call(root.querySelectorAll('.chapter-rail__item'), function (item) {
        var href = item.getAttribute('href') || '';
        if (href === '#' + id) {
          item.setAttribute('aria-current', 'true');
        } else {
          item.removeAttribute('aria-current');
        }
      });
    }

    function idFromHash() {
      var hash = (root.location && root.location.hash) || '';
      return hash.charAt(0) === '#' ? hash.slice(1) : '';
    }

    on(global, 'hashchange', function () {
      var id = idFromHash();
      if (!id) return;
      setCurrent(id);
    });

    if ('IntersectionObserver' in global) {
      var visible = new Map();
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.intersectionRatio);
          else visible.delete(entry.target.id);
        });
        var bestId = null;
        var bestRatio = 0;
        visible.forEach(function (ratio, id) {
          if (ratio > bestRatio) { bestRatio = ratio; bestId = id; }
        });
        if (bestId) setCurrent(bestId);
      }, { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.15, 0.4, 0.75] });

      sections.forEach(function (s) { if (s.el) io.observe(s.el); });
      destroyFns.push(function () { io.disconnect(); });
    }

    /* ---------- C03 导览索引浮层 ---------- */
    var dialog = root.getElementById('index-dialog');
    var openBtn = root.getElementById('index-open');
    var closeBtn = root.getElementById('index-close');

    if (dialog && openBtn) {
      var lastTrigger = null;

      on(openBtn, 'click', function () {
        lastTrigger = openBtn;
        if (typeof dialog.showModal === 'function') {
          dialog.showModal();
        } else {
          dialog.setAttribute('open', '');
        }
        announce('已打开导览索引，选择三殿之一继续阅读。');
      });

      on(closeBtn, 'click', function () {
        if (typeof dialog.close === 'function') dialog.close();
        else dialog.removeAttribute('open');
      });

      on(dialog, 'close', function () {
        if (lastTrigger && typeof lastTrigger.focus === 'function') {
          lastTrigger.focus();
        }
      });

      // 点击遮罩关闭
      on(dialog, 'click', function (event) {
        if (event.target !== dialog) return;
        if (typeof dialog.close === 'function') dialog.close();
        else dialog.removeAttribute('open');
      });

      // 选中锚点：先关闭再定位，焦点回触发按钮由 close 事件处理
      Array.prototype.forEach.call(dialog.querySelectorAll('a[href^="#"]'), function (link) {
        on(link, 'click', function () {
          var id = (link.getAttribute('href') || '').slice(1);
          if (typeof dialog.close === 'function') dialog.close();
          else dialog.removeAttribute('open');
          setCurrent(id);
          announce('已定位至' + link.textContent.trim() + '。');
        });
      });
    }

    /* ---------- C08 注释热点 ---------- */
    Array.prototype.forEach.call(root.querySelectorAll('[data-hotspot]'), function (btn) {
      var panelId = btn.getAttribute('aria-controls');
      var panel = panelId ? root.getElementById(panelId) : null;
      if (!panel) return;

      on(btn, 'click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
        panel.hidden = open;
        if (!open) {
          announce('已展开“' + btn.textContent.trim() + '”。');
        }
      });
    });

    /* ---------- 动效开关 ---------- */
    var motionBtn = root.getElementById('motion-toggle');
    var motionState = { on: true, controller: null };

    function systemReduced() {
      return !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }

    function applyMotion(on) {
      motionState.on = on;
      root.documentElement.setAttribute('data-motion', on ? 'on' : 'off');
      if (motionBtn) {
        motionBtn.setAttribute('aria-pressed', on ? 'false' : 'true');
        var label = motionBtn.querySelector('[data-motion-label]');
        var text = on ? '关闭动态装饰' : '开启动态装饰';
        if (label) label.textContent = text;
        motionBtn.setAttribute('aria-label', text);
        var icon = motionBtn.querySelector('use');
        if (icon) icon.setAttribute('href', on ? '#i-pause' : '#i-play');
      }
      if (!on && motionState.controller && motionState.controller.pause) {
        motionState.controller.pause();
      } else if (on && motionState.controller && motionState.controller.resume) {
        motionState.controller.resume();
      }
    }

    // 初始跟随系统偏好；用户主动选择后以 sessionStorage 为准
    var stored = storageGet(STORAGE_KEY);
    if (stored === 'off') {
      applyMotion(false);
    } else {
      applyMotion(!systemReduced());
    }

    if (motionBtn) {
      on(motionBtn, 'click', function () {
        var next = !motionState.on;
        applyMotion(next);
        storageSet(STORAGE_KEY, next ? 'on' : 'off');
        announce(next ? '已开启动态装饰。' : '已关闭动态装饰，正文与线稿照常可读。');
      });
    }

    /* ---------- 回到顶部 ---------- */
    Array.prototype.forEach.call(root.querySelectorAll('[data-scroll-top]'), function (link) {
      on(link, 'click', function () {
        var main = root.getElementById('main');
        if (main) {
          main.setAttribute('tabindex', '-1');
          main.focus({ preventScroll: true });
        }
        announce('已回到三大殿导览起点。');
      });
    });

    /* ---------- 返回 destroy ---------- */
    return function destroy() {
      destroyFns.forEach(function (fn) {
        try { fn(); } catch (e) { /* ignore */ }
      });
      destroyFns = [];
    };
  }

  global.SFLIP_NAV = {
    initNavigation: initNavigation,
    storageGet: storageGet,
    storageSet: storageSet
  };
})(typeof window !== 'undefined' ? window : globalThis);
