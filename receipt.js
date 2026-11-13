/* 纸张与网格参数 */
const PAPER_W = 576; // 80mm @ 203dpi
const COLS = 25; // 所有分区共用的针数（宽）
const CELL = 20; // 单格边长 px → 图样宽 500px，左右各留 38px
const MARGIN_Y = 48; // 小票上下留白
const SECTION_GAP = 40; // 分区之间的留白
const TEXT_PX = 4; // 原文点阵字的像素块大小（≥2px）

/* 5×7 点阵字库：A–Z、0–9 */
const FONT = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "10001", "11001", "10101", "10011", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  0: ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  1: ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  2: ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  3: ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  4: ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  5: ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  6: ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  7: ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  8: ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  9: ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
};

/* 国际摩斯电码 */
const MORSE = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....", I: "..", J: ".---",
  K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-",
  U: "..-", V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..",
  0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-", 5: ".....", 6: "-....", 7: "--...", 8: "---..", 9: "----.",
};

const normalize = (s) => String(s).toUpperCase().replace(/[^A-Z0-9 ]/g, "").replace(/ +/g, " ").trim().slice(0, 16).trim();
const blank = (r, c) => Array.from({ length: r }, () => new Array(c).fill(0));

/* 顶部：字母/数字图纸。按空格分词，一个单词一行；超过 8 个字符折行。
   字母本身不宽于摩斯图样时，左右补空白列，底图列数与摩斯图样相同，单词水平居中。
   更宽的单词仍用原来的列数，不缩放。 */
function chartGrid(text) {
  const MAX_LINE = 8;
  const words = [];
  text.split(" ").filter(Boolean).forEach((w) => {
    for (let i = 0; i < w.length; i += MAX_LINE) words.push(w.slice(i, i + MAX_LINE));
  });
  const maxLen = Math.max(...words.map((w) => w.length));
  const padX = 2;
  const padY = 2;
  const lineGap = 3;
  const glyphCols = maxLen * 6 - 1;
  const natural = glyphCols + padX * 2;
  const cols = glyphCols <= COLS ? COLS : natural;
  const rows = padY * 2 + words.length * 7 + (words.length - 1) * lineGap;
  const g = blank(rows, cols);
  words.forEach((w, wi) => {
    const top = padY + wi * (7 + lineGap);
    const left = Math.floor((cols - (w.length * 6 - 1)) / 2);
    [...w].forEach((ch, ci) => FONT[ch].forEach((line, y) => [...line].forEach((b, x) => {
      if (b === "1") g[top + y][left + ci * 6 + x] = 1;
    })));
  });
  return g;
}

/* 摩斯电码 → 往返针，再上下左右镜像成对称图样。 */
function morseStream(text) {
  const out = [];
  const words = text.split(" ");
  words.forEach((w, wi) => {
    if (wi) out.push(0, 0, 0, 0, 0, 0, 0);
    [...w].forEach((ch, ci) => {
      if (ci) out.push(0, 0, 0);
      [...MORSE[ch]].forEach((sym, si) => {
        if (si) out.push(0);
        out.push(...(sym === "." ? [1] : [1, 1, 1]));
      });
    });
  });
  return out;
}

function morseGrid(text) {
  const one = morseStream(text);
  const Q = (COLS - 1) / 2;
  const MIN_Q_ROWS = 8;
  let stream = one.slice();
  while (stream.length < MIN_Q_ROWS * Q) stream.push(0, 0, 0, 0, 0, 0, 0, ...one);
  const qRows = Math.max(MIN_Q_ROWS, Math.ceil(one.length / Q));
  stream = stream.slice(0, qRows * Q);
  const q = blank(qRows, Q);
  stream.forEach((v, i) => {
    const r = Math.floor(i / Q);
    const k = i % Q;
    q[r][r % 2 === 0 ? k : Q - 1 - k] = v;
  });
  const rows = qRows * 2 + 1;
  const mid = qRows;
  const cmid = Q;
  const g = blank(rows, COLS);
  for (let r = 0; r < qRows; r += 1) {
    for (let c = 0; c < Q; c += 1) {
      const v = q[r][c];
      g[r][c] = v;
      g[r][COLS - 1 - c] = v;
      g[rows - 1 - r][c] = v;
      g[rows - 1 - r][COLS - 1 - c] = v;
    }
  }
  for (let r = 0; r < rows; r += 1) if ((r - mid) % 2 === 0) g[r][cmid] = 1;
  for (let c = 0; c < COLS; c += 1) if ((c - cmid) % 2 === 0) g[mid][c] = 1;
  return g;
}

function drawCross(ctx, g, x0, y0, s, exactW) {
  const rows = g.length;
  const cols = g[0].length;
  const xAt = (c) => (exactW == null ? x0 + c * s : x0 + Math.round((c * exactW) / cols));
  const yAt = (r) => (exactW == null ? y0 + r * s : y0 + Math.round(r * s));
  ctx.fillStyle = "#000";
  ctx.strokeStyle = "#000";
  ctx.lineCap = "round";
  for (let r = 0; r <= rows; r += 1) {
    for (let c = 0; c <= cols; c += 1) ctx.fillRect(xAt(c) - 1, yAt(r) - 1, 2, 2);
  }
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (!g[r][c]) continue;
      const x = xAt(c);
      const y = yAt(r);
      const cw = xAt(c + 1) - x;
      const ch = yAt(r + 1) - y;
      const inset = Math.max(2, Math.round(Math.min(cw, ch) * 0.16));
      ctx.lineWidth = Math.max(2, Math.round(Math.min(cw, ch) * 0.2));
      ctx.beginPath();
      ctx.moveTo(x + inset, y + inset);
      ctx.lineTo(x + cw - inset, y + ch - inset);
      ctx.moveTo(x + cw - inset, y + inset);
      ctx.lineTo(x + inset, y + ch - inset);
      ctx.stroke();
    }
  }
}

function wrapText(text, maxChars) {
  const lines = [];
  let cur = "";
  for (const w of text.split(" ")) {
    if (!cur) cur = w;
    else if ((cur + " " + w).length <= maxChars) cur += " " + w;
    else {
      lines.push(cur);
      cur = w;
    }
    while (cur.length > maxChars) {
      lines.push(cur.slice(0, maxChars));
      cur = cur.slice(maxChars);
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function textBlockSize(text, width) {
  const adv = 6 * TEXT_PX;
  const lineH = 10 * TEXT_PX;
  const maxChars = Math.floor((width + TEXT_PX) / adv);
  const lines = wrapText(text, maxChars);
  return { lines, adv, lineH, h: lines.length * lineH - 3 * TEXT_PX };
}

function drawText(ctx, block, cx, y0) {
  ctx.fillStyle = "#000";
  block.lines.forEach((line, li) => {
    const w = line.length * block.adv - TEXT_PX;
    let x = Math.round(cx - w / 2);
    const y = y0 + li * block.lineH;
    for (const ch of line) {
      FONT[ch].forEach((row, ry) => [...row].forEach((b, rx) => {
        if (b === "1") ctx.fillRect(x + rx * TEXT_PX, y + ry * TEXT_PX, TEXT_PX, TEXT_PX);
      }));
      x += block.adv;
    }
  });
}

function drawDivider(ctx, x, y, w, edge) {
  const dash = 12;
  const gap = 8;
  ctx.fillStyle = "#000";
  if (!edge) {
    const n = Math.floor((w + gap) / (dash + gap));
    const total = n * dash + (n - 1) * gap;
    const start = x + Math.round((w - total) / 2);
    for (let i = 0; i < n; i += 1) ctx.fillRect(start + i * (dash + gap), y, dash, 4);
    return;
  }
  const x0 = Math.round(x);
  const x1 = Math.round(x + w);
  const span = Math.max(dash, x1 - x0);
  let n = Math.max(1, Math.round(span / (dash + gap)));
  while (n > 1 && n * dash >= span) n -= 1;
  const gaps = n - 1;
  const leftover = span - n * dash;
  const gapBase = gaps ? Math.floor(leftover / gaps) : 0;
  let extra = gaps ? leftover - gapBase * gaps : 0;
  let cursor = x0;
  for (let i = 0; i < n; i += 1) {
    const dw = i === n - 1 ? x0 + span - cursor : dash;
    ctx.fillRect(cursor, y, dw, 4);
    if (i < gaps) {
      const g = gapBase + (extra > 0 ? 1 : 0);
      if (extra > 0) extra -= 1;
      cursor += dw + g;
    }
  }
}

function openPass(b, W, H, v) {
  const o = b.slice();
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : b[y * W + x]);
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const i = y * W + x;
      if (b[i] !== v) continue;
      let ok = false;
      for (let dy = -1; dy <= 0 && !ok; dy += 1) {
        for (let dx = -1; dx <= 0 && !ok; dx += 1) {
          if (at(x + dx, y + dy) === v && at(x + dx + 1, y + dy) === v && at(x + dx, y + dy + 1) === v && at(x + dx + 1, y + dy + 1) === v) ok = true;
        }
      }
      if (!ok) o[i] = 1 - v;
    }
  }
  return o;
}

function cleanBitmap(ctx, W, H) {
  const img = ctx.getImageData(0, 0, W, H);
  const a = img.data;
  let b = new Uint8Array(W * H);
  for (let i = 0, j = 0; i < a.length; i += 4, j += 1) {
    b[j] = (a[i] * 0.299 + a[i + 1] * 0.587 + a[i + 2] * 0.114) < 128 ? 1 : 0;
  }
  b = openPass(b, W, H, 1);
  b = openPass(b, W, H, 0);
  for (let j = 0, i = 0; j < b.length; j += 1, i += 4) {
    const v = b[j] ? 0 : 255;
    a[i] = a[i + 1] = a[i + 2] = v;
    a[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

/* 图纸单词在上。勾选时下面接摩斯图样。原文本和分割线在底部。 */
function renderReceipt(input, options) {
  const withPattern = !!(options && options.withPattern);
  const text = normalize(input) || "HELLO";
  const top = chartGrid(text);
  const mid = withPattern ? morseGrid(text) : null;
  const pw = COLS * CELL;
  const x0 = Math.round((PAPER_W - pw) / 2);
  const colsTop = top[0].length;
  let topCell = Math.min(CELL, Math.floor(pw / colsTop));
  let topX = Math.round((PAPER_W - colsTop * topCell) / 2);
  let hTop = top.length * topCell;
  if (!withPattern) {
    topCell = pw / colsTop;
    topX = x0;
    hTop = Math.round(top.length * topCell);
  }
  const block = textBlockSize(text, pw);
  const hMid = mid ? mid.length * CELL : 0;
  const DIV_GAP = 28;

  let H = MARGIN_Y + hTop + DIV_GAP + 4 + DIV_GAP + block.h + MARGIN_Y;
  if (withPattern) H += SECTION_GAP + hMid;
  H = Math.ceil(H / 8) * 8;

  const canvas = document.createElement("canvas");
  canvas.width = PAPER_W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, PAPER_W, H);

  let y = MARGIN_Y;
  drawCross(ctx, top, topX, y, topCell, withPattern ? null : pw);
  y += hTop;
  if (withPattern) {
    y += SECTION_GAP;
    drawCross(ctx, mid, x0, y, CELL);
    y += hMid;
  }
  y += DIV_GAP;
  if (withPattern) drawDivider(ctx, x0, y, pw);
  else drawDivider(ctx, topX - 1, y, pw + 2, true);
  y += 4 + DIV_GAP;
  drawText(ctx, block, PAPER_W / 2, y);

  cleanBitmap(ctx, PAPER_W, H);
  return {
    canvas,
    text,
    morse: [...text].map((ch) => (ch === " " ? "/" : MORSE[ch])).join(" "),
    top,
    mid,
  };
}

window.renderReceipt = renderReceipt;
