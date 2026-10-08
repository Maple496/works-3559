// src/main.js —— 入口：创建画布、装配模块、Work.register 容器合同
// 职责：mount 时初始化画布与模块；destroy 时停 RAF、解绑监听、清空 stage

var canvas = null;
var g = null;
var rafId = 0;
var onBoundsFn = null;
var pointerDownFn = null;
var pointerMoveFn = null;
var keyDownFn = null;
var lastTime = 0;

function boardPointFromEvent(ev) {
  if (!canvas) return null;
  var rect = canvas.getBoundingClientRect();
  return ui.hitTest(ev.clientX - rect.left, ev.clientY - rect.top);
}

function mount(ctx) {
  var W = (ctx.bounds && ctx.bounds.w) || 320;
  var H = (ctx.bounds && ctx.bounds.h) || 480;

  canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  canvas.style.position = 'absolute';
  canvas.style.left = '0px';
  canvas.style.top = '0px';
  canvas.style.touchAction = 'none';
  ctx.stage.appendChild(canvas);
  g = canvas.getContext('2d');

  engine.init();
  ui.init(ctx.stage, engine);
  ui.layout({ w: W, h: H });

  onBoundsFn = function (b) {
    if (!canvas) return;
    canvas.width = b.w;
    canvas.height = b.h;
    ui.layout(b);
  };
  ctx.onBounds(onBoundsFn);

  pointerDownFn = function (ev) {
    ui.start();
    var p = boardPointFromEvent(ev);
    if (p) engine.tryPlace(p.r, p.c);
  };
  pointerMoveFn = function (ev) {
    var p = boardPointFromEvent(ev);
    if (p) engine.hover(p.r, p.c);
  };
  canvas.addEventListener('pointerdown', pointerDownFn);
  canvas.addEventListener('pointermove', pointerMoveFn);

  keyDownFn = function (ev) {
    if (ev.key === 'ArrowUp' || ev.key === 'ArrowDown' ||
        ev.key === 'ArrowLeft' || ev.key === 'ArrowRight' ||
        ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      ui.start();
    }
    if (ev.key === 'ArrowUp') engine.moveCursor(-1, 0);
    else if (ev.key === 'ArrowDown') engine.moveCursor(1, 0);
    else if (ev.key === 'ArrowLeft') engine.moveCursor(0, -1);
    else if (ev.key === 'ArrowRight') engine.moveCursor(0, 1);
    else if (ev.key === 'Enter' || ev.key === ' ') engine.confirmCursor();
    else if (ev.key === 'r' || ev.key === 'R') engine.restart();
  };
  window.addEventListener('keydown', keyDownFn);

  lastTime = 0;
  function frame(t) {
    lastTime = t;
    if (g && engine && ui) {
      engine.update(0);
      ui.render(g);
    }
    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
}

function destroy() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
  onBoundsFn = null;
  if (canvas && pointerDownFn) canvas.removeEventListener('pointerdown', pointerDownFn);
  if (canvas && pointerMoveFn) canvas.removeEventListener('pointermove', pointerMoveFn);
  if (keyDownFn) window.removeEventListener('keydown', keyDownFn);
  pointerDownFn = pointerMoveFn = keyDownFn = null;
  if (ui && ui.destroy) ui.destroy();
  if (engine && engine.destroy) engine.destroy();
  if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
  canvas = null;
  g = null;
}

Work.register({
  mount: mount,
  destroy: destroy
});
