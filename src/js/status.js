/* ============================================================
   status.js —— 统一状态播报（aria-live）
   ============================================================ */
(function (global) {
  'use strict';

  var SUCCESS_CLEAR_MS = 1200;
  var timer = null;

  function statusEl(doc) {
    return (doc || document).getElementById('status-bar');
  }

  /**
   * 展示一条状态。success 会在 1200ms 后自动清理。
   * @param {'info'|'success'|'warning'|'danger'} type
   * @param {string} message
   * @param {Document} [doc]
   */
  function setStatus(type, message, doc) {
    var el = statusEl(doc);
    if (!el) return;

    if (timer) {
      global.clearTimeout(timer);
      timer = null;
    }

    el.setAttribute('data-tone', type || 'info');
    el.textContent = message || '';
    el.setAttribute('aria-live', type === 'danger' ? 'assertive' : 'polite');

    if (type === 'success') {
      timer = global.setTimeout(function () {
        clearStatus(doc);
        timer = null;
      }, SUCCESS_CLEAR_MS);
    }
  }

  /** 清空状态条。 */
  function clearStatus(doc) {
    var el = statusEl(doc);
    if (!el) return;
    el.removeAttribute('data-tone');
    el.textContent = '';
  }

  global.SFLIP_STATUS = {
    setStatus: setStatus,
    clearStatus: clearStatus
  };
})(typeof window !== 'undefined' ? window : globalThis);
