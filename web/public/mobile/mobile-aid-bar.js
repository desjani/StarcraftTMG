(function setupMobileAidBar() {
  function init() {
    const bar = document.getElementById('aid-print-bar');
    if (!bar) return;

    const origPrint     = document.getElementById('aid-print-btn');
    const origCardDeck  = document.getElementById('aid-print-carddeck-btn');
    const origInk       = document.getElementById('aid-print-ink-friendly');
    const origCollapseAll = document.getElementById('aid-collapse-all-btn');
    const origExpandAll   = document.getElementById('aid-expand-all-btn');

    if (!origPrint) return;

    // ── Print options dialog ──────────────────────────────────────────────
    const dialog = document.createElement('dialog');
    dialog.className = 'mobile-print-dialog';
    dialog.innerHTML =
      '<div class="mobile-print-dialog-inner">' +
        '<p class="mobile-print-dialog-title">Print Options</p>' +
        '<button type="button" class="btn mobile-print-opt-btn" id="m-aid-print-pdf">\uD83D\uDDA8\uFE0F Print / Save as PDF</button>' +
        '<button type="button" class="btn ghost mobile-print-opt-btn" id="m-aid-print-cards">\uD83C\uDCCF Print Card Deck (MTG/Tarot)</button>' +
        '<label class="mobile-print-ink-label"><input type="checkbox" id="m-aid-print-ink"> Ink Friendly</label>' +
        '<button type="button" class="btn ghost mobile-print-opt-btn" id="m-aid-print-cancel">Cancel</button>' +
      '</div>';
    document.body.appendChild(dialog);

    // ── Print trigger row (full width) ────────────────────────────────────
    const printRow = document.createElement('div');
    printRow.className = 'mobile-aid-bar-row';

    const printTrigger = document.createElement('button');
    printTrigger.type = 'button';
    printTrigger.className = 'btn mobile-aid-print-trigger';
    printTrigger.textContent = '\uD83D\uDDA8\uFE0F Print';
    printRow.appendChild(printTrigger);

    // ── Collapse/expand row (two half-width buttons) ──────────────────────
    const collapseRow = document.createElement('div');
    collapseRow.className = 'mobile-aid-bar-row';

    const closeAllBtn = document.createElement('button');
    closeAllBtn.type = 'button';
    closeAllBtn.className = 'btn ghost mobile-aid-collapse-btn';
    closeAllBtn.textContent = 'Close All';

    const openAllBtn = document.createElement('button');
    openAllBtn.type = 'button';
    openAllBtn.className = 'btn ghost mobile-aid-collapse-btn';
    openAllBtn.textContent = 'Open All';

    collapseRow.appendChild(closeAllBtn);
    collapseRow.appendChild(openAllBtn);

    bar.appendChild(printRow);
    bar.appendChild(collapseRow);

    // ── Events ────────────────────────────────────────────────────────────
    printTrigger.addEventListener('click', () => {
      dialog.querySelector('#m-aid-print-ink').checked = origInk ? origInk.checked : false;
      dialog.showModal();
    });

    dialog.querySelector('#m-aid-print-pdf').addEventListener('click', () => {
      dialog.close();
      origPrint.click();
    });

    dialog.querySelector('#m-aid-print-cards').addEventListener('click', () => {
      dialog.close();
      origCardDeck.click();
    });

    dialog.querySelector('#m-aid-print-ink').addEventListener('change', (e) => {
      if (!origInk) return;
      origInk.checked = e.target.checked;
      origInk.dispatchEvent(new Event('change', { bubbles: true }));
    });

    dialog.querySelector('#m-aid-print-cancel').addEventListener('click', () => {
      dialog.close();
    });

    closeAllBtn.addEventListener('click', () => origCollapseAll.click());
    openAllBtn.addEventListener('click', () => origExpandAll.click());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
