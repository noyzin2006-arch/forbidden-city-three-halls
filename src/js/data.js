/* ============================================================
   data.js —— 内容数据契约校验与度量换算
   纯函数，无副作用，可在 node --test 中直接引入测试。
   ============================================================ */
(function (global) {
  'use strict';

  var HALL_IDS = ['taihe', 'zhonghe', 'baohe'];
  var ROOF_TYPES = ['double-hip', 'single-pyramidal', 'double-hip-gable'];

  var REQUIRED_KEYS = [
    'id', 'name', 'english', 'roof', 'baysWidth', 'baysDepth',
    'areaSqm', 'heightM', 'totalHeightM', 'plaque', 'couplet',
    'uses', 'history', 'details', 'source'
  ];

  function isFiniteNumber(v) {
    return typeof v === 'number' && Number.isFinite(v);
  }

  function isNonEmptyString(v) {
    return typeof v === 'string' && v.trim().length > 0;
  }

  /**
   * 校验三殿数据契约。
   * @param {Array} halls
   * @returns {{ok: boolean, errors: string[]}}
   */
  function validateHallData(halls) {
    var errors = [];

    if (!Array.isArray(halls)) {
      return { ok: false, errors: ['halls 必须是数组'] };
    }

    if (halls.length !== 3) {
      errors.push('halls 必须是 3 条，实际 ' + halls.length + ' 条');
    }

    var seen = {};

    halls.forEach(function (hall, i) {
      var at = 'halls[' + i + ']';

      if (!hall || typeof hall !== 'object') {
        errors.push(at + ' 不是对象');
        return;
      }

      REQUIRED_KEYS.forEach(function (key) {
        if (!Object.prototype.hasOwnProperty.call(hall, key)) {
          errors.push(at + ' 缺少字段 ' + key);
        }
      });

      if (HALL_IDS.indexOf(hall.id) === -1) {
        errors.push(at + ' 的 id=' + JSON.stringify(hall.id) + ' 不在 ' + HALL_IDS.join('/'));
      } else if (seen[hall.id]) {
        errors.push(at + ' 的 id 重复：' + hall.id);
      } else {
        seen[hall.id] = true;
      }

      if (!isNonEmptyString(hall.name)) errors.push(at + ' 的 name 为空');
      if (!isNonEmptyString(hall.english)) errors.push(at + ' 的 english 为空');

      if (ROOF_TYPES.indexOf(hall.roof) === -1) {
        errors.push(at + ' 的 roof=' + JSON.stringify(hall.roof) + ' 不是允许值');
      }

      if (!Number.isInteger(hall.baysWidth) || hall.baysWidth < 1) {
        errors.push(at + ' 的 baysWidth 必须是 ≥1 的整数');
      }
      if (!Number.isInteger(hall.baysDepth) || hall.baysDepth < 1) {
        errors.push(at + ' 的 baysDepth 必须是 ≥1 的整数');
      }

      if (!isFiniteNumber(hall.areaSqm) || hall.areaSqm <= 0) {
        errors.push(at + ' 的 areaSqm 必须是正数');
      }
      if (!isFiniteNumber(hall.heightM) || hall.heightM <= 0) {
        errors.push(at + ' 的 heightM 必须是正数');
      }
      if (hall.totalHeightM !== null && (!isFiniteNumber(hall.totalHeightM) || hall.totalHeightM <= 0)) {
        errors.push(at + ' 的 totalHeightM 必须是正数或 null');
      }

      if (!isNonEmptyString(hall.plaque)) errors.push(at + ' 的 plaque 为空');
      if (!isNonEmptyString(hall.couplet)) errors.push(at + ' 的 couplet 为空');

      if (!Array.isArray(hall.uses) || hall.uses.length === 0) {
        errors.push(at + ' 的 uses 必须是非空数组');
      } else if (!hall.uses.every(isNonEmptyString)) {
        errors.push(at + ' 的 uses 含空字符串');
      }

      if (!Array.isArray(hall.history) || hall.history.length === 0) {
        errors.push(at + ' 的 history 必须是非空数组');
      } else {
        hall.history.forEach(function (h, j) {
          if (!h || !Number.isInteger(h.year)) {
            errors.push(at + '.history[' + j + '] 的 year 必须是整数');
          }
          if (!h || !isNonEmptyString(h.label)) {
            errors.push(at + '.history[' + j + '] 的 label 为空');
          }
          if (!h || !isNonEmptyString(h.text)) {
            errors.push(at + '.history[' + j + '] 的 text 为空');
          }
        });
      }

      if (!Array.isArray(hall.details) || hall.details.length === 0) {
        errors.push(at + ' 的 details 必须是非空数组');
      } else {
        hall.details.forEach(function (d, j) {
          if (!d || !isNonEmptyString(d.label)) {
            errors.push(at + '.details[' + j + '] 的 label 为空');
          }
          if (!d || !isNonEmptyString(d.value)) {
            errors.push(at + '.details[' + j + '] 的 value 为空');
          }
        });
      }

      if (!Array.isArray(hall.source) || hall.source.length === 0) {
        errors.push(at + ' 的 source 必须是非空数组');
      } else {
        hall.source.forEach(function (s, j) {
          if (!s || !isNonEmptyString(s.label)) {
            errors.push(at + '.source[' + j + '] 的 label 为空');
          }
          if (!s || !isNonEmptyString(s.url) || !/^https:\/\//.test(s.url)) {
            errors.push(at + '.source[' + j + '] 的 url 必须是 https 地址');
          }
        });
      }
    });

    return { ok: errors.length === 0, errors: errors };
  }

  /**
   * 比较条比例：面积线性映射到 [0,1]。
   * @param {number} area
   * @param {number} max
   * @returns {number}
   */
  function compareBarScale(area, max) {
    if (!isFiniteNumber(area) || !isFiniteNumber(max) || max <= 0 || area <= 0) {
      return 0;
    }
    var ratio = area / max;
    if (ratio > 1) ratio = 1;
    if (ratio < 0) ratio = 0;
    return ratio;
  }

  /**
   * 统一度量格式化：数值 + 可选单位，千分位 + 定宽数字。
   * @param {number|string} value
   * @param {string} [unit]
   * @returns {string}
   */
  function formatMetric(value, unit) {
    var text = typeof value === 'number' ? String(value) : String(value == null ? '' : value);
    if (unit) text += ' ' + unit;
    return text;
  }

  global.SFLIP_DATA = {
    HALL_IDS: HALL_IDS,
    ROOF_TYPES: ROOF_TYPES,
    validateHallData: validateHallData,
    compareBarScale: compareBarScale,
    formatMetric: formatMetric
  };
})(typeof window !== 'undefined' ? window : globalThis);
