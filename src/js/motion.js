/* ============================================================
   motion.js —— 单一 rAF 调度器 / 滚动进度驱动的图形增强
   原则：
   - 只写 transform 与 opacity，绝不写 top/left/width/height
   - 每帧最多测量 2 个可见 section，所有读先于所有写
   - 文字与正文永不因为动画被隐藏
   - 减弱动效 / 用户关闭时，不产生任何采样帧
   ============================================================ */
(function (global) {
  'use strict';

  function clamp(v, lo, hi) {
    return v < lo ? lo : (v > hi ? hi : v);
  }

  function lerp(from, to, t) {
    return from + (to - from) * t;
  }

  /** 局部进度：把总进度映射到 [start, start+span] 区间 */
  function local(p, start, span) {
    if (span <= 0) return p >= start ? 1 : 0;
    return clamp((p - start) / span, 0, 1);
  }

  /* ---------------- 场景映射表 ----------------
     每项声明：目标选择器、属性、初末值、进度区间。
     属性仅限 transform 分量与 opacity。
  ------------------------------------------- */
  var SCENES = {
    taihe: {
      'roof':     { prop: 'translateY', from: 36, to: 0, start: 0.00, span: 0.18 },
      'eaves':    { prop: 'translateY', from: 36, to: 0, start: 0.00, span: 0.18 },
      'dougong':  { prop: 'translateY', from: 18, to: 0, start: 0.02, span: 0.18 },
      'columns':  { prop: 'translateY', from: 12, to: -6, start: 0.00, span: 0.26 },
      'beast':    { prop: 'opacity',  from: 0.2, to: 1, start: 0.30, span: 0.40, stagger: 0.022 }
    },
    zhonghe: {
      'ridge-n': { prop: 'translateY', from: -18, to: 0, start: 0.00, span: 0.22 },
      'ridge-s': { prop: 'translateY', from: 18, to: 0, start: 0.00, span: 0.22 },
      'ridge-w': { prop: 'translateX', from: -18, to: 0, start: 0.02, span: 0.22 },
      'ridge-e': { prop: 'translateX', from: 18, to: 0, start: 0.02, span: 0.22 },
      'finial':  { prop: 'scale',     from: 0.8, to: 1, start: 0.12, span: 0.18 }
    },
    baohe: {
      'roof':   { prop: 'translateY', from: 18, to: 0, start: 0.00, span: 0.20 },
      'paper':  { prop: 'translateX', from: 24, to: 0, start: 0.08, span: 0.24 },
      'beast':  { prop: 'opacity',   from: 0.2, to: 1, start: 0.26, span: 0.40, stagger: 0.026 }
    }
  };

  /* ---------------- 场景元素收集 ---------------- */
  function collectSceneTargets(doc, sceneId) {
    var stage = doc.querySelector('[data-scene="' + sceneId + '"]');
    if (!stage) return null;

    var map = SCENES[sceneId];
    var groups = [];

    Object.keys(map).forEach(function (key) {
      var nodes = stage.querySelectorAll('[data-anim="' + key + '"]');
      if (nodes.length) {
        groups.push({ rule: map[key], nodes: Array.prototype.slice.call(nodes) });
      }
    });

    return { stage: stage, groups: groups };
  }

  /* ---------------- 主控制器 ---------------- */
  /**
   * @param {{root: Document|HTMLElement, sections: Array<{id:string, el:Element, scene?:string}>, reduced: boolean, onSample: Function, probe: Object|null}} options
   * @returns {{destroy: Function, refresh: Function, pause: Function, resume: Function}}
   */
  function initMotion(options) {
    var opts = options || {};
    var root = opts.root || document;
    var sections = opts.sections || [];
    var reduced = !!opts.reduced;
    var onSample = opts.onSample || function () {};
    var probe = opts.probe || null;

    var rafId = 0;
    var running = false;
    var dirty = true;
    var frameId = 0;
    var lastProgress = 0;
    var lastSceneId = '';

    var sceneTargets = {};
    sections.forEach(function (s) {
      if (!s.scene) return;
      var t = collectSceneTargets(root, s.scene);
      if (t) sceneTargets[s.scene] = t;
    });

    function setNodeStyle(node, rule, value) {
      if (rule.prop === 'opacity') {
        node.style.opacity = String(value);
        return;
      }
      if (rule.prop === 'scale') {
        node.style.scale = String(value);
        return;
      }
      // 用独立的 translate 属性，避免覆盖 SVG 元素自身的 transform 属性
      node.style.translate = rule.prop === 'translateX'
        ? value.toFixed(2) + 'px 0px'
        : '0px ' + value.toFixed(2) + 'px';
    }

    function resetNode(node) {
      node.style.translate = '';
      node.style.scale = '';
      node.style.opacity = '';
    }

    /** 把一个场景在给定总进度下的形态写进 DOM */
    function applyScene(sceneId, p) {
      var target = sceneTargets[sceneId];
      if (!target) return;

      target.groups.forEach(function (group) {
        var rule = group.rule;
        if (rule.stagger) {
          group.nodes.forEach(function (node, i) {
            var lp = local(p, rule.start + i * rule.stagger, rule.span);
            var v = lerp(rule.from, rule.to, lp);
            if (rule.prop === 'opacity') {
              node.style.opacity = v.toFixed(3);
            } else {
              node.style.translate = rule.prop === 'translateX'
                ? v.toFixed(2) + 'px 0px'
                : '0px ' + v.toFixed(2) + 'px';
            }
          });
        } else {
          var lv = lerp(rule.from, rule.to, local(p, rule.start, rule.span));
          group.nodes.forEach(function (node) {
            setNodeStyle(node, rule, lv);
          });
        }
      });
    }

    /** 时间轴：五个点顺序显影（正文恒为可读，只有年份标记与位移动效） */
    function applyTimeline(p) {
      var items = root.querySelectorAll('.timeline__item');
      Array.prototype.forEach.call(items, function (item, i) {
        var lp = local(p, i * 0.12, 0.18);
        var year = item.querySelector('.timeline__year');
        if (year) year.style.opacity = (0.25 + 0.75 * lp).toFixed(3);
        item.style.translate = '0px ' + ((1 - lp) * 8).toFixed(2) + 'px';
      });
    }

    /** 比较条：内部填充 scaleX */
    function applyCompare(p) {
      var bars = root.querySelectorAll('.compare__bar');
      Array.prototype.forEach.call(bars, function (bar, i) {
        var lp = local(p, i * 0.06, 0.22);
        var target = parseFloat(bar.getAttribute('data-target') || '1');
        bar.style.scale = (target * lp).toFixed(4) + ' 1';
      });
    }

    /** 测出当前最相关的 2 个 section 及其进度 */
    function measure() {
      var vh = global.innerHeight || 1;
      var list = [];

      sections.forEach(function (s) {
        if (!s.el) return;
        var rect = s.el.getBoundingClientRect();
        if (rect.bottom < -80 || rect.top > vh + 80) return;
        var p = clamp((vh - rect.top) / (vh + rect.height), 0, 1);
        list.push({ id: s.id, scene: s.scene, el: s.el, p: p });
      });

      list.sort(function (a, b) {
        var da = Math.abs(a.p - 0.5);
        var db = Math.abs(b.p - 0.5);
        return da - db;
      });

      return list.slice(0, 2);
    }

    function frame(timestamp) {
      rafId = 0;
      if (!running) return;

      frameId += 1;

      if (dirty) {
        dirty = false;
        var visible = measure();

        // 先读后写：测量全部完成后再统一写
        visible.forEach(function (item) {
          if (item.scene && sceneTargets[item.scene]) {
            applyScene(item.scene, item.p);
          }
          if (item.id === 'time') applyTimeline(item.p);
          if (item.id === 'compare') applyCompare(item.p);
        });

        if (visible.length) {
          lastProgress = visible[0].p;
          lastSceneId = visible[0].id;
        }
      }

      onSample({
        frameId: frameId,
        timestamp: timestamp,
        progress: lastProgress,
        sceneId: lastSceneId
      });

      if (probe && probe.frames.length < 300) {
        probe.frames.push({
          frameId: frameId,
          timestamp: timestamp,
          progress: lastProgress,
          sceneId: lastSceneId
        });
      }

      rafId = global.requestAnimationFrame(frame);
    }

    function ensureRAF() {
      if (rafId || !running) return;
      rafId = global.requestAnimationFrame(frame);
    }

    function onScroll() {
      dirty = true;
      ensureRAF();
    }

    function onResize() {
      dirty = true;
      ensureRAF();
    }

    function onVisibility() {
      if (global.document.hidden) {
        pause();
      } else {
        resume();
      }
    }

    function start() {
      if (running) return;
      running = true;
      dirty = true;
      global.addEventListener('scroll', onScroll, { passive: true });
      global.addEventListener('resize', onResize, { passive: true });
      global.document.addEventListener('visibilitychange', onVisibility);
      ensureRAF();
    }

    function pause() {
      running = false;
      if (rafId) {
        global.cancelAnimationFrame(rafId);
        rafId = 0;
      }
      global.removeEventListener('scroll', onScroll, { passive: true });
      global.removeEventListener('resize', onResize, { passive: true });
      global.document.removeEventListener('visibilitychange', onVisibility);
    }

    function resume() {
      if (running) return;
      if (reduced) return;
      start();
    }

    function refresh() {
      dirty = true;
      ensureRAF();
    }

    function destroy() {
      pause();
      Object.keys(sceneTargets).forEach(function (sceneId) {
        sceneTargets[sceneId].groups.forEach(function (group) {
          group.nodes.forEach(resetNode);
        });
      });
      var items = root.querySelectorAll('.timeline__item');
      Array.prototype.forEach.call(items, function (item) {
        item.style.translate = '';
        var year = item.querySelector('.timeline__year');
        if (year) year.style.opacity = '';
      });
      var bars = root.querySelectorAll('.compare__bar');
      Array.prototype.forEach.call(bars, function (bar) { bar.style.scale = ''; });
    }

    if (reduced) {
      // 减弱动效：不启动 rAF，probe.frames 不会增长
      running = false;
    } else {
      start();
    }

    return {
      destroy: destroy,
      refresh: refresh,
      pause: pause,
      resume: resume
    };
  }

  global.SFLIP_MOTION = {
    initMotion: initMotion,
    SCENES: SCENES
  };
})(typeof window !== 'undefined' ? window : globalThis);
