// Fill-in-blank dictation practice — subway-friendly: tap only, no typing, no speaking.
// Data: EXERCISES from exercises-data.js (Whisper transcripts of official free kaiwa audio).
// Segment playback uses the shared #audio element; window.__exSegEnd stops it at the
// sentence end. app.js clears that flag whenever a full track is loaded.
(function () {
  'use strict';
  var audio = document.getElementById('audio');
  var view = document.getElementById('practice');
  var chipsEl = document.getElementById('exChips');
  var scoreEl = document.getElementById('exScore');
  var cardsEl = document.getElementById('exCards');
  var tabListen = document.getElementById('tabListen');
  var tabPractice = document.getElementById('tabPractice');

  var STORE_KEY = 'minna-ex-v1';
  var store = {};
  try { store = JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch (e) { store = {}; }
  function saveStore() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) {}
  }

  var curLesson = 1;
  try {
    var last = JSON.parse(localStorage.getItem('minna-ex-lesson-v1') || 'null');
    if (last && EXERCISES[last]) curLesson = last;
  } catch (e) {}

  // ---- segment playback ----
  audio.addEventListener('timeupdate', function () {
    if (window.__exSegEnd != null && audio.currentTime >= window.__exSegEnd) {
      audio.pause();
      window.__exSegEnd = null;
    }
  });
  audio.addEventListener('pause', function () { window.__exSegEnd = null; });

  function playSegment(ex, btn) {
    window.__exSegEnd = ex.end;
    if (audio.getAttribute('src') !== 'audio/' + ex.file) audio.src = 'audio/' + ex.file;
    audio.currentTime = ex.start;
    audio.play().catch(function () {});
    if (btn) {
      btn.textContent = '▶ 再生中…';
      setTimeout(function () { btn.textContent = '▶ この文を聞く'; }, 1500);
    }
  }

  // ---- tabs ----
  function showTab(which) {
    var listen = which === 'listen';
    document.getElementById('list').style.display = listen ? '' : 'none';
    view.style.display = listen ? 'none' : '';
    tabListen.classList.toggle('on', listen);
    tabPractice.classList.toggle('on', !listen);
    if (!listen) render();
    window.scrollTo(0, 0);
  }
  tabListen.addEventListener('click', function () { showTab('listen'); });
  tabPractice.addEventListener('click', function () { showTab('practice'); });

  // ---- render ----
  function lessonStats(n) {
    var exs = EXERCISES[n] || [];
    var ans = store[n] || {};
    var done = Object.keys(ans).length;
    var ok = Object.keys(ans).filter(function (k) { return ans[k].correct; }).length;
    return { total: exs.length, done: done, ok: ok };
  }

  function renderChips() {
    chipsEl.innerHTML = '';
    Object.keys(EXERCISES).map(Number).sort(function (a, b) { return a - b; }).forEach(function (n) {
      var st = lessonStats(n);
      var b = document.createElement('button');
      b.className = 'chip' + (n === curLesson ? ' on' : '');
      b.textContent = '第' + n + '課' + (st.total ? ' ' + st.ok + '/' + st.total : '');
      b.addEventListener('click', function () {
        curLesson = n;
        try { localStorage.setItem('minna-ex-lesson-v1', JSON.stringify(n)); } catch (e) {}
        render();
      });
      chipsEl.appendChild(b);
    });
  }

  function render() {
    renderChips();
    var exs = EXERCISES[curLesson] || [];
    var st = lessonStats(curLesson);
    scoreEl.textContent = '第' + curLesson + '課　正解 ' + st.ok + ' / ' + st.done + ' 回答済み（全 ' + st.total + ' 問）';
    cardsEl.innerHTML = '';
    if (!exs.length) {
      cardsEl.innerHTML = '<p class="ex-empty">この課の練習はまだありません。</p>';
      return;
    }
    exs.forEach(function (ex, i) {
      var card = document.createElement('div');
      card.className = 'ex-card';
      var head = document.createElement('div');
      head.className = 'ex-head';
      var no = document.createElement('span');
      no.textContent = '文 ' + (i + 1) + ' / ' + exs.length;
      var play = document.createElement('button');
      play.className = 'ex-play';
      play.textContent = '▶ この文を聞く';
      play.addEventListener('click', function () { playSegment(ex, play); });
      head.appendChild(no);
      head.appendChild(play);
      card.appendChild(head);

      var disp = document.createElement('div');
      disp.className = 'ex-display';
      disp.textContent = ex.display;
      card.appendChild(disp);

      var opts = document.createElement('div');
      opts.className = 'ex-opts';
      var ans = (store[curLesson] || {})[i];
      ex.options.forEach(function (opt, oi) {
        var b = document.createElement('button');
        b.className = 'ex-opt';
        b.textContent = opt;
        if (ans) {
          b.disabled = true;
          if (oi === ex.answerIndex) b.classList.add('correct');
          else if (oi === ans.picked) b.classList.add('wrong');
        }
        b.addEventListener('click', function () {
          if ((store[curLesson] || {})[i]) return;
          if (!store[curLesson]) store[curLesson] = {};
          store[curLesson][i] = { picked: oi, correct: oi === ex.answerIndex };
          saveStore();
          render();
        });
        opts.appendChild(b);
      });
      card.appendChild(opts);

      if (ans) {
        var fb = document.createElement('div');
        fb.className = 'ex-feedback ' + (ans.correct ? 'good' : 'bad');
        fb.textContent = ans.correct ? '⭕ 正解！' : '❌ 正解は「' + ex.answer + '」';
        card.appendChild(fb);
        var full = document.createElement('div');
        full.className = 'ex-full';
        full.textContent = ex.text;
        card.appendChild(full);
        var again = document.createElement('button');
        again.className = 'ex-again';
        again.textContent = '🔁 もう一度聞く';
        again.addEventListener('click', function () { playSegment(ex, again); });
        card.appendChild(again);
      }
      cardsEl.appendChild(card);
    });

    var reset = document.createElement('button');
    reset.className = 'ex-reset';
    reset.textContent = 'この課の回答をリセット';
    reset.addEventListener('click', function () {
      delete store[curLesson];
      saveStore();
      render();
    });
    cardsEl.appendChild(reset);
  }

  render();
})();
