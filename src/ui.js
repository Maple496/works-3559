// src/ui.js —— 界面与渲染
// 职责：把 engine 状态画到 canvas；管理 stage 内 absolute 覆盖层（按钮/引导）

var uiStage = null;    // 引用 ctx.stage，init 时赋值
var restartBtn = null; // 重开按钮（absolute，挂 stage）
var started = false;   // 首帧引导：点击/触摸开始
var _cell = 0;         // 每格像素
var _ox = 0;           // 棋盘原点 x
var _oy = 0;           // 棋盘原点 y
var _engine = null;

// 初始化界面层：创建覆盖元素并挂入 stage
function uiInit(stage, engineRef) {
  uiStage = stage;
  _engine = engineRef;
  started = false;
  restartBtn = document.createElement('button');
  restartBtn.textContent = '重新开始';
  restartBtn.style.position = 'absolute';
  restartBtn.style.right = '8px';
  restartBtn.style.top = '8px';
  restartBtn.style.padding = '6px 14px';
  restartBtn.style.fontSize = '14px';
  restartBtn.style.background = 'rgba(40,40,40,0.85)';
  restartBtn.style.color = '#fff';
  restartBtn.style.border = '1px solid #888';
  restartBtn.style.borderRadius = '4px';
  restartBtn.style.cursor = 'pointer';
  restartBtn.style.zIndex = '10';
  restartBtn.onpointerdown = function (e) {
    e.stopPropagation();
  };
  restartBtn.onclick = function (e) {
    e.stopPropagation();
    _engine.restart();
    started = true;
  };
  stage.appendChild(restartBtn);
}

// 尺寸变化时重排：依据 bounds 计算棋盘原点与格距
function uiLayout(bounds) {
  var w = bounds.w, h = bounds.h;
  _cell = Math.min(w, h) / (SIZE + 2);
  _ox = (w - _cell * (SIZE - 1)) / 2;
  _oy = (h - _cell * (SIZE - 1)) / 2;
}

function _stoneXY(r, c) {
  return { x: _ox + c * _cell, y: _oy + r * _cell };
}

// 标记开始（首 次 canvas 交互）
function uiStart() {
  started = true;
}

// 画布坐标 -> 棋盘格
function uiHitTest(x, y) {
  var c = Math.round((x - _ox) / _cell);
  var r = Math.round((y - _oy) / _cell);
  if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return null;
  return { r: r, c: c };
}

// 每帧渲染（g = 2d context）
function uiRender(g) {
  var w = g.canvas.width, h = g.canvas.height;
  g.clearRect(0, 0, w, h);

  if (!started) {
    g.fillStyle = 'rgba(0,0,0,0.65)';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff';
    g.font = 'bold ' + Math.floor(_cell * 1.2 || 24) + 'px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('点击 / 触摸开始', w / 2, h / 2);
    return;
  }

  // 棋盘背景
  g.fillStyle = '#c8a165';
  var pad = _cell * 0.5;
  g.fillRect(_ox - pad, _oy - pad, _cell * (SIZE - 1) + pad * 2, _cell * (SIZE - 1) + pad * 2);

  // 网格线
  g.strokeStyle = '#5a4020';
  g.lineWidth = 1;
  for (var i = 0; i < SIZE; i++) {
    var p = i * _cell;
    g.beginPath();
    g.moveTo(_ox, _oy + p);
    g.lineTo(_ox + (SIZE - 1) * _cell, _oy + p);
    g.stroke();
    g.beginPath();
    g.moveTo(_ox + p, _oy);
    g.lineTo(_ox + p, _oy + (SIZE - 1) * _cell);
    g.stroke();
  }

  // 星位
  var stars = [3, 7, 11];
  g.fillStyle = '#3a2810';
  for (var sr = 0; sr < stars.length; sr++) {
    for (var sc = 0; sc < stars.length; sc++) {
      var sp = _stoneXY(stars[sr], stars[sc]);
      g.beginPath();
      g.arc(sp.x, sp.y, _cell * 0.12, 0, Math.PI * 2);
      g.fill();
    }
  }

  // 棋子
  var board = _engine.board;
  var lr = -1, lc = -1;
  if (_engine.lastMove) { lr = _engine.lastMove.r; lc = _engine.lastMove.c; }
  for (var r = 0; r < SIZE; r++) {
    for (var c = 0; c < SIZE; c++) {
      var v = board[r][c];
      if (!v) continue;
      var pt = _stoneXY(r, c);
      var rad = _cell * 0.42;
      g.beginPath();
      g.arc(pt.x, pt.y, rad, 0, Math.PI * 2);
      g.fillStyle = v === 1 ? '#111' : '#eee';
      g.fill();
      g.lineWidth = 1;
      g.strokeStyle = v === 1 ? '#000' : '#999';
      g.stroke();
      if (r === lr && c === lc) {
        g.beginPath();
        g.arc(pt.x, pt.y, rad * 0.55, 0, Math.PI * 2);
        g.strokeStyle = '#e33';
        g.lineWidth = 2;
        g.stroke();
      }
    }
  }

  // 光标虚线框
  var cur = _engine.cursor;
  if (cur) {
    var cp = _stoneXY(cur.r, cur.c);
    var half = _cell * 0.5;
    g.setLineDash([4, 3]);
    g.strokeStyle = '#00c';
    g.lineWidth = 2;
    g.strokeRect(cp.x - half, cp.y - half, _cell, _cell);
    g.setLineDash([]);
  }

  // 状态栏
  g.textAlign = 'left';
  g.textBaseline = 'alphabetic';
  g.fillStyle = '#222';
  g.font = '14px sans-serif';
  var status = _engine.winner !== 0
    ? (_engine.winner === 3 ? '平局' : (_engine.winner === 1 ? '黑方胜' : '白方胜'))
    : (_engine.current === 1 ? '轮到黑方' : '轮到白方');
  g.fillText(status, 8, h - 8);

  // 胜负横幅
  if (_engine.winner !== 0) {
    g.fillStyle = 'rgba(0,0,0,0.45)';
    g.fillRect(0, h / 2 - 44, w, 88);
    g.fillStyle = '#fff';
    g.font = 'bold ' + Math.floor(_cell * 1.1 || 28) + 'px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    var msg = _engine.winner === 3 ? '平局' : (_engine.winner === 1 ? '黑方获胜！' : '白方获胜！');
    g.fillText(msg, w / 2, h / 2);
    g.font = '14px sans-serif';
    g.fillText('点击「重新开始」再来一局', w / 2, h / 2 + _cell * 0.9 + 16);
  }
}

// 销毁：移除 stage 内覆盖元素
function uiDestroy() {
  if (restartBtn && restartBtn.parentNode) {
    restartBtn.parentNode.removeChild(restartBtn);
  }
  restartBtn = null;
  uiStage = null;
  _engine = null;
}

var ui = {
  init: uiInit,
  layout: uiLayout,
  render: uiRender,
  start: uiStart,
  hitTest: uiHitTest,
  destroy: uiDestroy
};
