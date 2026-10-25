/* ============================================================
   boot.js —— 应用初始化 / 错误隔离 / 四态 / 探针
   initApp(doc) → { destroy, ready }
   ============================================================ */
(function (global) {
  'use strict';

  var STATUS_TEXT = {
    ready: '三殿导览已就绪，正文与线稿可直接阅读。',
    loading: '线稿已就位，正在启动光影层。文字导览可直接阅读。',
    error: '装饰效果未能启动，三殿文字与线稿仍可阅读。可在顶部选择“关闭动态装饰”。',
    empty: '建筑面积数据未完整载入。请先阅读三殿的形制与用途说明。',
    motionOff: '已关闭动态装饰，正文与线稿照常可读。',
    motionOn: '已开启动态装饰。'
  };

  function param(name, search) {
    var s = search || (global.location && global.location.search) || '';
    var m = new RegExp('[?&]' + name + '=([^&]*)').exec(s);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : null;
  }

  /**
   * @param {Document} [doc]
   * @returns {{destroy: Function, ready: Promise}}
   */
  function initApp(doc) {
    var d = doc || document;
    var root = d.documentElement;

    var destroyers = [];
    var readyResolve;
    var ready = new Promise(function (resolve) { readyResolve = resolve; });

    var status = global.SFLIP_STATUS;
    var announce = function (message) {
      if (status && status.setStatus) status.setStatus('info', message, d);
    };

    /* ---------------- 探针（仅测试参数开启） ---------------- */
    var probe = null;
    if (param('sflip_probe') === '1') {
      probe = { frames: [], statuses: [] };
      global.__sflipProbe = probe;
    }

    /* ---------------- 组件状态注入 ---------------- */
    var state = param('sflip_state');
    if (state === 'empty' || state === 'loading' || state === 'error') {
      root.setAttribute('data-state', state);
    }

    /* ---------------- 内容数据校验 ---------------- */
    var halls = [];
    var dataErrors = [];
    var dataNode = d.getElementById('hall-data');
    if (dataNode) {
      try {
        halls = JSON.parse(dataNode.textContent);
      } catch (e) {
        dataErrors.push('hall-data 解析失败：' + e.message);
      }
    } else {
      dataErrors.push('页面缺少 #hall-data');
    }

    var validator = global.SFLIP_DATA;
    if (validator && halls.length) {
      var result = validator.validateHallData(halls);
      if (!result.ok) {
        dataErrors = dataErrors.concat(result.errors);
      }
    }

    if (dataErrors.length && probe) {
      probe.statuses.push({ type: 'error', message: dataErrors.join('；') });
    }

    /* ---------------- 比较条比例（由数据算出，不硬编码） ---------------- */
    if (validator && halls.length) {
      var maxArea = halls.reduce(function (m, h) {
        return Math.max(m, h.areaSqm || 0);
      }, 0);
      Array.prototype.forEach.call(d.querySelectorAll('.compare__bar'), function (bar) {
        var id = bar.getAttribute('data-hall');
        var hall = halls.filter(function (h) { return h.id === id; })[0];
        if (!hall) return;
        var scale = validator.compareBarScale(hall.areaSqm, maxArea);
        bar.setAttribute('data-target', String(scale));
        bar.style.setProperty('--bar-scale', String(scale));
      });
    }

    /* ---------------- 章节清单 ---------------- */
    var sectionIds = ['intro', 'taihe', 'zhonghe', 'baohe', 'time', 'compare', 'sources'];
    var sections = sectionIds.map(function (id) {
      var el = d.getElementById(id);
      return { id: id, el: el, scene: (id === 'taihe' || id === 'zhonghe' || id === 'baohe') ? id : null };
    }).filter(function (s) { return !!s.el; });

    /* ---------------- 导航 / 浮层 / 状态 ---------------- */
    try {
      var nav = global.SFLIP_NAV;
      if (nav && nav.initNavigation) {
        var destroyNav = nav.initNavigation({ root: d, sections: sections, announce: announce });
        destroyers.push(destroyNav);
      }
    } catch (e) {
      if (probe) probe.statuses.push({ type: 'error', message: '导航初始化失败：' + e.message });
      if (status) status.setStatus('warning', '导览定位暂失效，请向下滚动。', d);
    }

    /* ---------------- 动效引擎 ---------------- */
    var motionController = null;
    try {
      var reduced = !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
      var rootMotion = root.getAttribute('data-motion');
      if (rootMotion === 'off') reduced = true;

      var motion = global.SFLIP_MOTION;
      if (motion && motion.initMotion) {
        motionController = motion.initMotion({
          root: d,
          sections: sections,
          reduced: reduced,
          probe: probe,
          onSample: function () {}
        });
        destroyers.push(function () { motionController.destroy(); });
      }
    } catch (e) {
      root.setAttribute('data-motion', 'off');
      if (probe) probe.statuses.push({ type: 'error', message: '动效初始化失败：' + e.message });
      if (status) status.setStatus('warning', STATUS_TEXT.error, d);
    }

    /* ---------------- 首屏入场（CSS 一次性动画） ---------------- */
    try {
      var heroStage = d.querySelector('.hero__stage');
      if (heroStage) {
        global.requestAnimationFrame(function () {
          heroStage.classList.add('is-ready');
        });
      }
    } catch (e) {
      /* 首屏装饰失败不影响正文 */
    }

    /* ---------------- 初始状态播报 ---------------- */
    if (state === 'error') {
      if (status) status.setStatus('danger', STATUS_TEXT.error, d);
    } else if (state === 'empty') {
      if (status) status.setStatus('info', STATUS_TEXT.empty, d);
    } else if (state === 'loading') {
      if (status) status.setStatus('warning', STATUS_TEXT.loading, d);
    } else if (dataErrors.length) {
      if (status) status.setStatus('warning', STATUS_TEXT.empty, d);
    } else {
      if (status) status.setStatus('success', STATUS_TEXT.ready, d);
    }

    readyResolve(true);

    return {
      ready: ready,
      destroy: function () {
        destroyers.reverse().forEach(function (fn) {
          try { fn(); } catch (e) { /* ignore */ }
        });
        destroyers = [];
      }
    };
  }

  global.SFLIP_BOOT = {
    initApp: initApp,
    STATUS_TEXT: STATUS_TEXT
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { initApp(document); });
    } else {
      initApp(document);
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
