// src/engine.js —— 状态与规则引擎
// 职责：维护棋盘数据与回合状态；提供落子/胜负判定/重开；不接触 DOM

var SIZE = 15;
var EMPTY = 0, BLACK = 1, WHITE = 2;

var board = [];
var current = BLACK;
var winner = 0;
var moveCount = 0;
var lastMove = null;
var cursor = { r: 7, c: 7 };

function engineInit() {
  board = [];
  for (var r = 0; r < SIZE; r++) {
    var row = [];
    for (var c = 0; c < SIZE; c++) row.push(EMPTY);
    board.push(row);
  }
  current = BLACK;
  winner = 0;
  moveCount = 0;
  lastMove = null;
  cursor.r = (SIZE - 1) / 2;
  cursor.c = (SIZE - 1) / 2;
}

function inBoard(r, c) {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
}

function engineTryPlace(r, c) {
  if (winner !== 0) return false;
  if (!inBoard(r, c)) return false;
  if (board[r][c] !== EMPTY) return false;
  board[r][c] = current;
  lastMove = { r: r, c: c };
  moveCount++;
  var w = engineCheckWin(r, c);
  if (w !== 0) {
    winner = w;
  } else if (moveCount >= SIZE * SIZE) {
    winner = 3; // 平局
  } else {
    current = (current === BLACK) ? WHITE : BLACK;
  }
  return true;
}

function engineCheckWin(r, c) {
  var color = board[r][c];
  if (!color) return 0;
  var dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (var i = 0; i < dirs.length; i++) {
    var dr = dirs[i][0], dc = dirs[i][1];
    var count = 1;
    var rr = r + dr, cc = c + dc;
    while (inBoard(rr, cc) && board[rr][cc] === color) { count++; rr += dr; cc += dc; }
    rr = r - dr; cc = c - dc;
    while (inBoard(rr, cc) && board[rr][cc] === color) { count++; rr -= dr; cc -= dc; }
    if (count >= 5) return color;
  }
  return 0;
}

function engineMoveCursor(dr, dc) {
  cursor.r = Math.min(SIZE - 1, Math.max(0, cursor.r + dr));
  cursor.c = Math.min(SIZE - 1, Math.max(0, cursor.c + dc));
}

function engineConfirmCursor() {
  return engineTryPlace(cursor.r, cursor.c);
}

function engineRestart() {
  engineInit();
}

// 统一对外接口：main/ui 通过 engine.xxx 访问
var engine = {
  size: SIZE,
  black: BLACK,
  white: WHITE,
  get board() { return board; },
  get current() { return current; },
  get winner() { return winner; },
  get lastMove() { return lastMove; },
  get cursor() { return cursor; },
  init: engineInit,
  tryPlace: engineTryPlace,
  moveCursor: engineMoveCursor,
  confirmCursor: engineConfirmCursor,
  restart: engineRestart,
  hover: function (r, c) { cursor.r = r; cursor.c = c; },
  update: function () {},
  layout: function () {},
  destroy: function () {}
};

engineInit();
