/* Thermal ticket drawing at the printer's 576px width.
   Browser canvas only: no printer commands, no local paths, no network. */
(function () {
  var WIDTH = 576;
  var INK = "#222222";
  var PAPER = "#ffffff";
  var FONT = '"JetBrains Mono", ui-monospace, monospace';

  var fontMap = {
    A: ["01110", "10001", "11111", "10001", "10001"],
    B: ["11110", "10001", "11110", "10001", "11110"],
    C: ["01111", "10000", "10000", "10000", "01111"],
    D: ["11110", "10001", "10001", "10001", "11110"],
    E: ["11111", "10000", "11110", "10000", "11111"],
    F: ["11111", "10000", "11110", "10000", "10000"],
    G: ["01111", "10000", "10111", "10001", "01111"],
    H: ["10001", "10001", "11111", "10001", "10001"],
    I: ["11111", "00100", "00100", "00100", "11111"],
    J: ["00001", "00001", "00001", "10001", "01110"],
    K: ["10001", "10010", "11100", "10010", "10001"],
    L: ["10000", "10000", "10000", "10000", "11111"],
    M: ["10001", "11011", "10101", "10001", "10001"],
    N: ["10001", "11001", "10101", "10011", "10001"],
    O: ["01110", "10001", "10001", "10001", "01110"],
    P: ["11110", "10001", "11110", "10000", "10000"],
    Q: ["01110", "10001", "10101", "10010", "01101"],
    R: ["11110", "10001", "11110", "10010", "10001"],
    S: ["01111", "10000", "01110", "00001", "11110"],
    T: ["11111", "00100", "00100", "00100", "00100"],
    U: ["10001", "10001", "10001", "10001", "01110"],
    V: ["10001", "10001", "10001", "01010", "00100"],
    W: ["10001", "10001", "10101", "11011", "10001"],
    X: ["10001", "01010", "00100", "01010", "10001"],
    Y: ["10001", "01010", "00100", "00100", "00100"],
    Z: ["11111", "00010", "00100", "01000", "11111"],
    " ": ["00000", "00000", "00000", "00000", "00000"]
  };

  function stitchesFor(text) {
    var rows = [[], [], [], [], []];
    var chars = String(text || "").toUpperCase().split("");
    chars.forEach(function (ch, index) {
      var glyph = fontMap[ch] || fontMap[" "];
      for (var r = 0; r < 5; r++) {
        rows[r].push.apply(rows[r], glyph[r].split(""));
        if (index < chars.length - 1) rows[r].push("0");
      }
    });
    return rows.map(function (row) {
      return row.join("");
    });
  }

  function textWidth(ctx, text, tracking) {
    var width = 0;
    for (var i = 0; i < text.length; i++) {
      width += ctx.measureText(text[i]).width;
      if (i < text.length - 1) width += tracking;
    }
    return width;
  }

  function fillTracked(ctx, text, centerX, baseline, tracking) {
    var width = textWidth(ctx, text, tracking);
    var x = centerX - width / 2;
    for (var i = 0; i < text.length; i++) {
      ctx.fillText(text[i], x, baseline);
      x += ctx.measureText(text[i]).width + tracking;
    }
  }

  function pair(ctx, left, right, y, size, pad) {
    ctx.font = "700 " + size + "px " + FONT;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(left, pad, y);
    ctx.textAlign = "right";
    ctx.fillText(right, WIDTH - pad, y);
    ctx.textAlign = "left";
  }

  function rule(ctx, y, pad) {
    ctx.save();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(WIDTH - pad, y);
    ctx.stroke();
    ctx.restore();
  }

  function fitWordSize(ctx, text, maxWidth) {
    var size = 56;
    while (size > 28) {
      ctx.font = "700 " + size + "px " + FONT;
      if (textWidth(ctx, text, size * 0.14) <= maxWidth) return size;
      size -= 2;
    }
    return size;
  }

  function londonStamp(date) {
    var time = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: "Europe/London"
    }).format(date);
    var day = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Europe/London"
    }).format(date);
    return { time: time, day: day };
  }

  function drawReceipt(text, withPattern) {
    var source = String(text || "");
    var pad = 40;
    var inner = WIDTH - pad * 2;
    var stamp = londonStamp(new Date());
    var order = String(Math.floor(Math.random() * 90000) + 10000);
    var word = source.toUpperCase();
    var chart = withPattern ? stitchesFor(source) : null;
    var cell = 0;
    var cols = 0;
    if (chart && chart[0]) {
      cols = chart[0].length;
      cell = Math.max(3, Math.min(12, Math.floor(inner / Math.max(cols, 1))));
    }

    var probe = document.createElement("canvas").getContext("2d");
    var wordSize = fitWordSize(probe, word, inner);

    var tooth = 12;
    var y = 0;
    function gap(n) {
      y += n;
    }

    gap(28);
    var titleY = y + 16;
    gap(34);
    gap(16);
    var orderY = y;
    gap(28);
    var dateY = y;
    gap(26);
    var rule1 = y;
    gap(22);
    var wordY = y + wordSize * 0.82;
    gap(wordSize + 4);
    gap(4);

    var rule2 = 0;
    var patternLabelY = 0;
    var gridTop = 0;
    var countY = 0;
    var legendY = 0;
    if (chart) {
      rule2 = y;
      gap(28);
      patternLabelY = y;
      gap(22);
      gridTop = y;
      gap(cell * 5);
      gap(20);
      countY = y;
      gap(22);
      legendY = y;
      gap(12);
    }

    var rule3 = y;
    gap(22);
    var lettersY = y;
    gap(24);
    var totalY = y;
    gap(22);
    var tear = y;
    var height = tear + tooth;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var canvas = document.createElement("canvas");
    canvas.width = Math.round(WIDTH * dpr);
    canvas.height = Math.round(height * dpr);
    var ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(WIDTH, 0);
    ctx.lineTo(WIDTH, tear);
    var step = 16;
    for (var x = WIDTH; x > 0; x -= step) {
      ctx.lineTo(x - step / 2, tear + tooth);
      ctx.lineTo(Math.max(0, x - step), tear);
    }
    ctx.closePath();
    ctx.fillStyle = PAPER;
    ctx.fill();

    ctx.fillStyle = INK;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "700 28px " + FONT;
    ctx.fillText("KNIT/KIOSK", WIDTH / 2, titleY);

    pair(ctx, "ORDER #" + order, stamp.time, orderY, 15, pad);
    pair(ctx, "DATE", stamp.day, dateY, 15, pad);
    rule(ctx, rule1, pad);

    ctx.fillStyle = INK;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.font = "700 " + wordSize + "px " + FONT;
    fillTracked(ctx, word, WIDTH / 2, wordY, wordSize * 0.14);

    if (chart) {
      rule(ctx, rule2, pad);
      ctx.font = "700 15px " + FONT;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("PATTERN GRID:", pad, patternLabelY);

      var gridWidth = cols * cell;
      var gridHeight = cell * 5;
      var gridLeft = Math.round((WIDTH - gridWidth) / 2);
      ctx.fillStyle = INK;
      ctx.fillRect(gridLeft, gridTop, gridWidth, gridHeight);
      for (var r = 0; r < chart.length; r++) {
        for (var c = 0; c < cols; c++) {
          if (chart[r][c] === "1") continue;
          ctx.fillStyle = PAPER;
          ctx.fillRect(gridLeft + c * cell + 1, gridTop + r * cell + 1, cell - 1, cell - 1);
        }
      }

      ctx.fillStyle = INK;
      ctx.font = "700 13px " + FONT;
      ctx.textAlign = "center";
      ctx.fillText(cols + " STITCHES  \u00d7  " + chart.length + " ROWS", WIDTH / 2, countY);

      var legend = [
        { filled: true, label: "CONTRAST" },
        { filled: false, label: "MAIN" }
      ];
      ctx.font = "700 13px " + FONT;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      var legendWidth = 0;
      legend.forEach(function (item, index) {
        legendWidth += 16 + 8 + ctx.measureText(item.label).width;
        if (index === 0) legendWidth += 28;
      });
      var lx = (WIDTH - legendWidth) / 2;
      legend.forEach(function (item) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = INK;
        if (item.filled) {
          ctx.fillStyle = INK;
          ctx.fillRect(lx, legendY - 7, 14, 14);
        } else {
          ctx.strokeRect(lx + 1, legendY - 6, 12, 12);
        }
        lx += 22;
        ctx.fillStyle = INK;
        ctx.fillText(item.label, lx, legendY);
        lx += ctx.measureText(item.label).width + 28;
      });
    }

    rule(ctx, rule3, pad);
    pair(ctx, "LETTERS", String(source.length), lettersY, 18, pad);
    pair(ctx, "TOTAL", "\u00a30.00", totalY, 26, pad);

    return canvas;
  }

  window.drawReceipt = drawReceipt;
})();
