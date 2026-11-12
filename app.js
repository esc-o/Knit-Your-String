(function () {
  var MAX_LENGTH = 12;
  var PRINT_MS = 2500;
  var RETRACT_MS = 700;

  var keyboardLayout = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["DELETE", "Z", "X", "C", "V", "B", "N", "M"],
    ["SPACE", "PRINT"]
  ];

  var value = "";
  var printPattern = false;
  var phase = "idle";

  var displayEl = document.getElementById("input-display");
  var placeholderEl = document.getElementById("placeholder");
  var checkmarkEl = document.getElementById("checkmark");
  var ledEl = document.getElementById("status-led");
  var keyboardEl = document.getElementById("keyboard");
  var receiptPop = document.getElementById("receipt-pop");
  var receiptWindow = document.getElementById("receipt-window");
  var receiptActions = document.getElementById("receipt-actions");
  var downloadBtn = document.getElementById("download-btn");
  var againBtn = document.getElementById("again-btn");
  var mouthEl = document.getElementById("mouth");

  var canvas = null;

  function updateDisplay() {
    displayEl.textContent = value;
    placeholderEl.style.display = value.length > 0 ? "none" : "block";
  }

  function renderKeyboard() {
    keyboardLayout.forEach(function (row) {
      var rowDiv = document.createElement("div");
      rowDiv.className = "key-row";
      row.forEach(function (key) {
        var btn = document.createElement("div");
        btn.dataset.key = key;
        btn.textContent = key === "SPACE" ? "" : key;
        btn.setAttribute("role", "button");
        btn.tabIndex = -1;
        var className = "key";
        if (key === "DELETE") className += " key-delete";
        else if (key === "SPACE") className += " key-space";
        else if (key === "PRINT") className += " key-print";
        btn.className = className;
        btn.addEventListener("pointerdown", function (event) {
          event.preventDefault();
          flashKey(key);
          handleKey(key);
        });
        rowDiv.appendChild(btn);
      });
      keyboardEl.appendChild(rowDiv);
    });
  }

  function flashKey(key) {
    var el = keyboardEl.querySelector('[data-key="' + key + '"]');
    if (!el) return;
    el.classList.add("is-down");
    window.setTimeout(function () {
      el.classList.remove("is-down");
    }, 90);
  }

  function handleKey(key) {
    if (phase !== "idle") return;
    if (key === "DELETE") {
      value = value.slice(0, -1);
    } else if (key === "SPACE") {
      if (value.length < MAX_LENGTH) value += " ";
    } else if (key === "PRINT") {
      triggerPrint();
      return;
    } else if (value.length < MAX_LENGTH) {
      value += key;
    }
    updateDisplay();
  }

  function toggleCheckbox() {
    if (phase !== "idle") return;
    printPattern = !printPattern;
    checkmarkEl.classList.toggle("hidden", !printPattern);
  }

  function setLed(on) {
    ledEl.classList.toggle("is-busy", on);
  }

  function placePop() {
    var slot = document.getElementById("slot").getBoundingClientRect();
    var width = Math.min(576, window.innerWidth - 32);
    receiptPop.style.top = slot.bottom - 2 + "px";
    receiptPop.style.width = width + "px";
  }

  function maxWindowHeight() {
    var top = receiptPop.getBoundingClientRect().top;
    var below = window.innerHeight - top - 16;
    var cap = window.innerHeight * 0.8;
    return Math.max(80, Math.min(below, cap) - 72);
  }

  function paperHeight() {
    if (!canvas) return 0;
    return canvas.offsetHeight;
  }

  function clearPaper() {
    receiptWindow.replaceChildren();
    canvas = null;
    receiptWindow.style.transition = "none";
    receiptWindow.style.height = "0px";
    receiptWindow.classList.remove("can-scroll");
    receiptWindow.scrollTop = 0;
    receiptActions.classList.remove("is-visible");
    receiptPop.classList.remove("is-open");
  }

  function triggerPrint() {
    if (phase !== "idle" || value.trim() === "") return;
    phase = "printing";
    setLed(true);
    clearPaper();

    var ready = document.fonts && document.fonts.load
      ? document.fonts.load('700 64px "JetBrains Mono"')
      : Promise.resolve();
    ready.then(runPrint, runPrint);
  }

  function runPrint() {
    if (phase !== "printing") return;
    canvas = window.drawReceipt(value, printPattern);
    receiptWindow.appendChild(canvas);
    receiptPop.classList.add("is-open");
    placePop();

    receiptWindow.style.transition = "none";
    receiptWindow.style.height = "0px";
    receiptWindow.classList.remove("can-scroll");
    void receiptWindow.offsetHeight;

    var target = Math.min(paperHeight(), maxWindowHeight());
    receiptWindow.style.transition = "height " + PRINT_MS + "ms linear";
    receiptWindow.style.height = target + "px";
  }

  function finishPrint() {
    phase = "shown";
    setLed(false);
    if (canvas && paperHeight() > receiptWindow.clientHeight + 1) {
      receiptWindow.classList.add("can-scroll");
    }
    receiptActions.classList.add("is-visible");
  }

  function retract() {
    if (phase !== "shown") return;
    phase = "retracting";
    receiptActions.classList.remove("is-visible");
    receiptWindow.classList.remove("can-scroll");

    var scrolled = receiptWindow.scrollTop;
    var visible = receiptWindow.clientHeight;
    receiptWindow.scrollTop = 0;
    canvas.style.transition = "none";
    canvas.style.transform = "translateY(" + -scrolled + "px)";
    void canvas.offsetHeight;

    canvas.style.transition = "transform " + RETRACT_MS + "ms linear";
    receiptWindow.style.transition = "height " + RETRACT_MS + "ms linear";
    canvas.style.transform = "translateY(" + -(scrolled + visible) + "px)";
    receiptWindow.style.height = "0px";
  }

  function finishRetract() {
    value = "";
    updateDisplay();
    clearPaper();
    phase = "idle";
    setLed(false);
  }

  receiptWindow.addEventListener("transitionend", function (event) {
    if (event.propertyName !== "height" || event.target !== receiptWindow) return;
    if (phase === "printing") finishPrint();
    else if (phase === "retracting") finishRetract();
  });

  downloadBtn.addEventListener("click", function () {
    if (phase !== "shown" || !canvas) return;
    canvas.toBlob(function (blob) {
      if (!blob) return;
      var slug = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "receipt";
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = "knit-" + slug + ".png";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    });
  });

  againBtn.addEventListener("click", function (event) {
    event.stopPropagation();
    retract();
  });

  document.getElementById("pattern-toggle").addEventListener("click", toggleCheckbox);

  document.addEventListener("pointerdown", function (event) {
    if (phase !== "shown") return;
    if (event.target.closest("#receipt-pop, #printer, #input-bar, #pattern-toggle, #keyboard")) return;
    retract();
  });

  document.addEventListener("keydown", function (event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.target.closest("#receipt-actions")) return;

    var key = event.key;
    if (key === "Backspace" || key === "Delete") {
      event.preventDefault();
      flashKey("DELETE");
      handleKey("DELETE");
    } else if (key === " ") {
      event.preventDefault();
      flashKey("SPACE");
      handleKey("SPACE");
    } else if (key === "Enter") {
      event.preventDefault();
      flashKey("PRINT");
      handleKey("PRINT");
    } else if (/^[a-zA-Z]$/.test(key)) {
      event.preventDefault();
      flashKey(key.toUpperCase());
      handleKey(key.toUpperCase());
    }
  });

  function fitKeyboard() {
    keyboardEl.style.transform = "none";
    var natural = keyboardEl.scrollWidth;
    var scale = Math.min(1, (window.innerWidth - 28) / natural);
    keyboardEl.style.transform = "scale(" + scale + ")";
  }

  window.addEventListener("resize", function () {
    fitKeyboard();
    if (phase === "printing" || phase === "shown") placePop();
  });

  renderKeyboard();
  fitKeyboard();
  updateDisplay();
})();
