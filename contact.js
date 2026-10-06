// Email-link chooser. A plain mailto: link opens the computer's default mail app,
// which on many PCs is an unconfigured Outlook. Instead, clicking any mailto: link
// opens a small box offering: copy the address, open Gmail in the browser, or use
// the device's mail app. Without JavaScript the links still work as normal mailto links.
(function () {
  if (typeof HTMLDialogElement !== 'function') return; // very old browser: keep plain mailto

  var css = ''
    + '.mc-dialog{border:none;border-radius:16px;padding:0;width:min(420px,calc(100vw - 32px));box-shadow:0 20px 60px rgba(0,0,0,.25);color:#14281a;font-family:"DM Sans",system-ui,sans-serif}'
    + '.mc-dialog::backdrop{background:rgba(10,25,15,.45)}'
    + '.mc-body{padding:1.4rem 1.4rem 1.2rem;display:flex;flex-direction:column;gap:.9rem}'
    + '.mc-head{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem}'
    + '.mc-title{font-family:"Fraunces",Georgia,serif;font-size:1.35rem;font-weight:600;margin:0}'
    + '.mc-close{background:none;border:none;font-size:1.5rem;line-height:1;cursor:pointer;color:#45584b;padding:0 .2rem}'
    + '.mc-sub{margin:0;font-size:.9rem;color:#45584b}'
    + '.mc-addr{display:flex;gap:.5rem;align-items:center;background:#f3f1e8;border-radius:10px;padding:.55rem .6rem .55rem .8rem}'
    + '.mc-addr code{flex:1;font-family:inherit;font-size:.95rem;font-weight:600;word-break:break-all}'
    + '.mc-btn{display:block;text-align:center;text-decoration:none;font:inherit;font-weight:600;font-size:.92rem;border-radius:10px;padding:.65rem .9rem;cursor:pointer;border:1px solid rgba(20,40,25,.2);background:#fff;color:#1c3a24}'
    + '.mc-btn.mc-primary{background:#1c3a24;color:#eef3ea;border-color:#1c3a24}'
    + '.mc-copy{flex:none;padding:.4rem .75rem;font-size:.82rem}'
    + '.mc-note{margin:0;font-size:.78rem;color:#6a7a6f}';
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var dlg = document.createElement('dialog');
  dlg.className = 'mc-dialog';
  dlg.setAttribute('aria-labelledby', 'mcTitle');
  dlg.innerHTML = ''
    + '<div class="mc-body">'
    +   '<div class="mc-head"><h2 class="mc-title" id="mcTitle">Email theciae</h2>'
    +   '<button type="button" class="mc-close" aria-label="Close">×</button></div>'
    +   '<p class="mc-sub">Send your notes or suggestions to this address:</p>'
    +   '<div class="mc-addr"><code id="mcAddr"></code><button type="button" class="mc-btn mc-copy" id="mcCopy">Copy</button></div>'
    +   '<a class="mc-btn mc-primary" id="mcGmail" target="_blank" rel="noopener">Open in Gmail</a>'
    +   '<a class="mc-btn" id="mcApp">Use my email app</a>'
    +   '<p class="mc-note">Tip: on a computer, “Open in Gmail” is usually easiest. You can also copy the address into any email service.</p>'
    + '</div>';
  document.body.appendChild(dlg);

  var addrEl = dlg.querySelector('#mcAddr'), copyBtn = dlg.querySelector('#mcCopy');
  var gmailEl = dlg.querySelector('#mcGmail'), appEl = dlg.querySelector('#mcApp');

  function open(href) {
    var u;
    try { u = new URL(href); } catch (e) { return false; }
    var to = decodeURIComponent(u.pathname);
    var su = u.searchParams.get('subject') || '';
    var body = u.searchParams.get('body') || '';
    addrEl.textContent = to;
    copyBtn.textContent = 'Copy';
    gmailEl.href = 'https://mail.google.com/mail/?view=cm&fs=1'
      + '&to=' + encodeURIComponent(to)
      + (su ? '&su=' + encodeURIComponent(su) : '')
      + (body ? '&body=' + encodeURIComponent(body) : '');
    appEl.href = href;
    dlg.showModal();
    return true;
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="mailto:"]');
    if (!a || dlg.contains(a)) return;
    if (open(a.getAttribute('href'))) e.preventDefault();
  });

  copyBtn.addEventListener('click', function () {
    var text = addrEl.textContent;
    var done = function () { copyBtn.textContent = 'Copied ✓'; };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else { fallback(); }
    function fallback() {
      var r = document.createRange(); r.selectNodeContents(addrEl);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      try { document.execCommand('copy'); done(); } catch (err) { copyBtn.textContent = 'Press Ctrl+C'; }
    }
  });

  dlg.querySelector('.mc-close').addEventListener('click', function () { dlg.close(); });
  gmailEl.addEventListener('click', function () { dlg.close(); });
  appEl.addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); }); // click on backdrop
})();
