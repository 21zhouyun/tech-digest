// Minna no Nihongo listening player — feature 1 only.
// Audio files are local (audio/*.mp3, official free audio bundled in).
(function () {
  'use strict';
  var audio = document.getElementById('audio');
  var listEl = document.getElementById('list');
  var nowEl = document.getElementById('now');
  var statusEl = document.getElementById('status');
  var seekEl = document.getElementById('seek');
  var curEl = document.getElementById('cur');
  var durEl = document.getElementById('dur');
  var playBtn = document.getElementById('playBtn');
  var barEl = document.getElementById('bar');
  var progressLabel = document.getElementById('progressLabel');

  // Flattened playlist: [{lesson, file, label, lessonTitle}]
  var playlist = [];
  LESSONS.forEach(function (L) {
    L.tracks.forEach(function (t) {
      playlist.push({ lesson: L.n, lessonTitle: L.title, file: t.file, label: t.label });
    });
  });

  var DONE_KEY = 'minna-done-v1';
  var LAST_KEY = 'minna-last-v1';
  var done = {};
  try { done = JSON.parse(localStorage.getItem(DONE_KEY) || '{}'); } catch (e) { done = {}; }

  var idx = -1;              // current playlist index
  var repeatMode = 'off';    // off | one | all
  var speed = 1;
  var abA = null, abB = null;
  var shadowing = false;
  var repeat3 = false;
  var playCount = 0;         // plays of current track in repeat-3 mode
  var shadowTimer = null;

  function fmt(s) {
    if (!isFinite(s)) return '0:00';
    s = Math.max(0, Math.floor(s));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  function saveDone() {
    try { localStorage.setItem(DONE_KEY, JSON.stringify(done)); } catch (e) {}
    renderProgress();
  }
  function renderProgress() {
    var n = Object.keys(done).filter(function (k) { return done[k]; }).length;
    progressLabel.textContent = n + ' / ' + LESSONS.length + ' 課';
    barEl.style.width = (n / LESSONS.length * 100) + '%';
  }

  // ---- lesson list ----
  function buildList() {
    var groups = [{ book: 'I', title: '初級 I　第 0–25 課' }, { book: 'II', title: '初級 II　第 26–50 課' }];
    groups.forEach(function (g) {
      var h = document.createElement('section');
      var h2 = document.createElement('h2');
      h2.textContent = g.title;
      h.appendChild(h2);
      LESSONS.filter(function (L) { return L.book === g.book; }).forEach(function (L) {
        var card = document.createElement('div');
        card.className = 'lesson';
        card.dataset.lesson = L.n;
        var head = document.createElement('button');
        head.className = 'lesson-head';
        head.innerHTML = '<span class="num">第' + L.n + '課</span>' +
          '<span class="title">' + (L.n === 0 ? '発音・教室のことば・あいさつ・数字' : '会話・問題') + '</span>' +
          '<span class="count">' + L.tracks.length + ' トラック</span>';
        var check = document.createElement('input');
        check.type = 'checkbox';
        check.className = 'done-check';
        check.checked = !!done[L.n];
        check.title = '完了にする';
        check.addEventListener('click', function (ev) {
          ev.stopPropagation();
          done[L.n] = check.checked;
          saveDone();
        });
        head.appendChild(check);
        head.addEventListener('click', function () { card.classList.toggle('open'); });
        card.appendChild(head);

        var tracks = document.createElement('div');
        tracks.className = 'tracks';
        L.tracks.forEach(function (t) {
          var b = document.createElement('button');
          b.className = 'track';
          b.dataset.file = t.file;
          b.innerHTML = '<span class="play-ico">▶</span><span class="tlabel"></span>';
          b.querySelector('.tlabel').textContent = t.label;
          b.addEventListener('click', function () {
            playByFile(t.file);
            card.classList.add('open');
          });
          tracks.appendChild(b);
        });
        card.appendChild(tracks);

        var act = document.createElement('div');
        act.className = 'lesson-actions';
        var playAll = document.createElement('button');
        playAll.textContent = '▶ この課を最初から再生';
        playAll.addEventListener('click', function () {
          playByFile(L.tracks[0].file);
          card.classList.add('open');
        });
        act.appendChild(playAll);
        tracks.appendChild(act);
        h.appendChild(card);
      });
      listEl.appendChild(h);
    });
  }

  function markPlaying() {
    document.querySelectorAll('.track').forEach(function (el) { el.classList.remove('playing'); });
    if (idx >= 0) {
      var el = document.querySelector('.track[data-file="' + playlist[idx].file + '"]');
      if (el) el.classList.add('playing');
    }
  }

  function loadTrack(i, autoplay) {
    if (i < 0 || i >= playlist.length) return;
    clearTimeout(shadowTimer);
    idx = i;
    playCount = 0;
    var t = playlist[i];
    audio.src = 'audio/' + t.file;
    audio.playbackRate = speed;
    nowEl.textContent = '第' + t.lesson + '課　' + t.label;
    statusEl.textContent = '';
    clearAB(true);
    markPlaying();
    try { localStorage.setItem(LAST_KEY, JSON.stringify({ file: t.file })); } catch (e) {}
    if (autoplay) audio.play().catch(function () {});
    updatePlayBtn();
  }

  function playByFile(file) {
    var i = playlist.findIndex(function (t) { return t.file === file; });
    if (i >= 0) loadTrack(i, true);
  }

  function updatePlayBtn() {
    playBtn.textContent = audio.paused ? '▶ 再生' : '⏸ 停止';
  }

  // ---- transport ----
  playBtn.addEventListener('click', function () {
    if (idx < 0) { loadTrack(0, true); return; }
    if (audio.paused) audio.play().catch(function () {}); else audio.pause();
  });
  document.getElementById('prevBtn').addEventListener('click', function () {
    if (idx < 0) return;
    if (audio.currentTime > 3) { audio.currentTime = 0; return; }
    loadTrack((idx - 1 + playlist.length) % playlist.length, true);
  });
  document.getElementById('nextBtn').addEventListener('click', function () {
    if (idx < 0) return;
    loadTrack((idx + 1) % playlist.length, true);
  });
  document.getElementById('back5').addEventListener('click', function () {
    audio.currentTime = Math.max(0, audio.currentTime - 5);
  });
  document.getElementById('fwd10').addEventListener('click', function () {
    audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10);
  });

  // ---- repeat mode ----
  var repeatBtn = document.getElementById('repeatBtn');
  repeatBtn.addEventListener('click', function () {
    repeatMode = repeatMode === 'off' ? 'one' : repeatMode === 'one' ? 'all' : 'off';
    repeatBtn.textContent = repeatMode === 'off' ? '🔁 Off' : repeatMode === 'one' ? '🔁 1曲' : '🔁 全体';
    repeatBtn.classList.toggle('on', repeatMode !== 'off');
  });

  // ---- speed ----
  var speedsEl = document.getElementById('speeds');
  [0.5, 0.75, 1, 1.25, 1.5].forEach(function (s) {
    var b = document.createElement('button');
    b.textContent = s + 'x';
    if (s === 1) b.classList.add('on');
    b.addEventListener('click', function () {
      speed = s;
      audio.playbackRate = s;
      speedsEl.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
    });
    speedsEl.appendChild(b);
  });

  // ---- A-B loop ----
  var abLabel = document.getElementById('abLabel');
  function clearAB(silent) {
    abA = null; abB = null;
    document.getElementById('setA').classList.remove('on');
    document.getElementById('setB').classList.remove('on');
    abLabel.textContent = '';
    if (!silent) statusEl.textContent = '';
  }
  document.getElementById('setA').addEventListener('click', function () {
    abA = audio.currentTime;
    this.classList.add('on');
    abLabel.textContent = 'A ' + fmt(abA) + (abB != null ? ' – B ' + fmt(abB) : ' –');
  });
  document.getElementById('setB').addEventListener('click', function () {
    if (abA == null) { statusEl.textContent = '先に A を設定してください'; return; }
    if (audio.currentTime <= abA) { statusEl.textContent = 'B は A より後にしてください'; return; }
    abB = audio.currentTime;
    this.classList.add('on');
    abLabel.textContent = 'A ' + fmt(abA) + ' – B ' + fmt(abB) + '　ループ中';
  });
  document.getElementById('clearAB').addEventListener('click', function () { clearAB(); });

  // ---- shadowing + repeat-3 ----
  var shadowBtn = document.getElementById('shadowBtn');
  shadowBtn.addEventListener('click', function () {
    shadowing = !shadowing;
    shadowBtn.textContent = '🎙 シャドーイング：' + (shadowing ? 'On（3秒 pause）' : 'Off');
    shadowBtn.classList.toggle('on', shadowing);
  });
  var repeat3Btn = document.getElementById('repeat3Btn');
  repeat3Btn.addEventListener('click', function () {
    repeat3 = !repeat3;
    repeat3Btn.textContent = '×3 リピート：' + (repeat3 ? 'On' : 'Off');
    repeat3Btn.classList.toggle('on', repeat3);
  });

  // ---- audio events ----
  audio.addEventListener('play', updatePlayBtn);
  audio.addEventListener('pause', updatePlayBtn);
  audio.addEventListener('loadedmetadata', function () {
    durEl.textContent = fmt(audio.duration);
    seekEl.max = audio.duration || 100;
  });
  audio.addEventListener('timeupdate', function () {
    if (abA != null && abB != null && audio.currentTime >= abB) {
      audio.currentTime = abA;
      return;
    }
    curEl.textContent = fmt(audio.currentTime);
    if (!seekEl.matches(':active')) seekEl.value = audio.currentTime;
  });
  seekEl.addEventListener('input', function () {
    audio.currentTime = parseFloat(seekEl.value);
  });
  audio.addEventListener('ended', function () {
    if (repeatMode === 'one') { audio.currentTime = 0; audio.play(); return; }
    if (repeat3) {
      playCount++;
      if (playCount < 3) {
        statusEl.textContent = '第 ' + (playCount + 1) + ' / 3 回目';
        audio.currentTime = 0;
        audio.play();
        return;
      }
      playCount = 0;
    }
    function advance() {
      statusEl.textContent = '';
      if (idx >= playlist.length - 1) {
        if (repeatMode === 'all') loadTrack(0, true);
        else { updatePlayBtn(); }
      } else {
        loadTrack(idx + 1, true);
      }
    }
    if (shadowing) {
      statusEl.textContent = 'シャドーイング pause… 3秒後に次へ';
      shadowTimer = setTimeout(advance, 3000);
    } else {
      advance();
    }
  });
  audio.addEventListener('error', function () {
    statusEl.textContent = '音声を読み込めませんでした。オフラインの場合は一度オンラインで開いてください。';
  });

  // ---- init ----
  buildList();
  renderProgress();
  try {
    var last = JSON.parse(localStorage.getItem(LAST_KEY) || 'null');
    if (last && last.file) {
      var i = playlist.findIndex(function (t) { return t.file === last.file; });
      if (i >= 0) loadTrack(i, false);
    }
  } catch (e) {}
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
})();
