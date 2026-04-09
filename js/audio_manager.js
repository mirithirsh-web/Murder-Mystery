const AudioManager = (function () {
  const FADE_MS = 2000;
  const VOLUME = 0.4;
  const STORAGE_KEY = 'mm_audio_muted';

  let dramaticTrack = null;
  let partyTrack = null;
  let investigationTrack = null;
  let revealTrack = null;
  let muted = false;

  function _createTrack(src, loop = true) {
    const audio = new Audio(src);
    audio.loop = loop;
    audio.volume = 0;
    audio.preload = 'auto';
    return audio;
  }

  function init(dramaticUrl, partyUrl, investigationUrl, revealUrl) {
    dramaticTrack = _createTrack(dramaticUrl);
    partyTrack = _createTrack(partyUrl);
    investigationTrack = _createTrack(investigationUrl);
    revealTrack = revealUrl ? _createTrack(revealUrl, false) : null;
    muted = localStorage.getItem(STORAGE_KEY) === '1';
  }

  function _fadeIn(track, targetVol, durationMs) {
    if (!track) return;
    track.volume = 0;
    if (muted) track.muted = true;
    track.play().catch(() => {});
    const steps = 30;
    const stepMs = durationMs / steps;
    const increment = targetVol / steps;
    let current = 0;
    const iv = setInterval(() => {
      current += increment;
      if (current >= targetVol) {
        track.volume = targetVol;
        clearInterval(iv);
      } else {
        track.volume = current;
      }
    }, stepMs);
    return iv;
  }

  function _fadeOut(track, durationMs) {
    return new Promise(resolve => {
      if (!track || track.paused) { resolve(); return; }
      const startVol = track.volume;
      if (startVol === 0) { track.pause(); resolve(); return; }
      const steps = 30;
      const stepMs = durationMs / steps;
      const decrement = startVol / steps;
      let current = startVol;
      const iv = setInterval(() => {
        current -= decrement;
        if (current <= 0) {
          track.volume = 0;
          track.pause();
          track.currentTime = 0;
          clearInterval(iv);
          resolve();
        } else {
          track.volume = current;
        }
      }, stepMs);
    });
  }

  function _stopAllTracks() {
    const promises = [];
    [dramaticTrack, partyTrack, investigationTrack, revealTrack].forEach(t => {
      if (t && !t.paused) promises.push(_fadeOut(t, FADE_MS));
    });
    return Promise.all(promises);
  }

  /** Fade out every track except `exclude`. Used when switching BGM so the target can stay "playing" at volume 0. */
  function _stopAllTracksExcept(exclude) {
    const promises = [];
    [dramaticTrack, partyTrack, investigationTrack, revealTrack].forEach(t => {
      if (t && t !== exclude && !t.paused) promises.push(_fadeOut(t, FADE_MS));
    });
    return Promise.all(promises);
  }

  /**
   * Start playback at volume 0 in the same synchronous turn as the user gesture.
   * Browsers often block audio.play() that runs only after async delays (e.g. post-fade Promise).
   */
  function _primePlay(track) {
    if (!track) return;
    track.volume = 0;
    if (muted) track.muted = true;
    track.play().catch(() => {});
  }

  function playDramatic() {
    if (!dramaticTrack || !dramaticTrack.paused) return;
    if (revealTrack && !revealTrack.paused) return;
    // Prime + start fade immediately (same turn as user gesture). Waiting until
    // other tracks finish fading leaves this track at volume 0 for ~FADE_MS; browsers
    // often suspend inaudible playback, so delayed _fadeIn then never becomes audible.
    _primePlay(dramaticTrack);
    _stopAllTracksExcept(dramaticTrack);
    _fadeIn(dramaticTrack, VOLUME, FADE_MS);
  }

  function playParty() {
    if (!partyTrack || !partyTrack.paused) return;
    _primePlay(partyTrack);
    _stopAllTracksExcept(partyTrack);
    _fadeIn(partyTrack, VOLUME, FADE_MS);
  }

  function playInvestigation() {
    if (!investigationTrack) return;
    _primePlay(investigationTrack);
    _stopAllTracksExcept(investigationTrack);
    _fadeIn(investigationTrack, VOLUME, FADE_MS);
  }

  /** Reveal / ending screen: fades out other BGM, then fades in (non-looping). */
  function playReveal() {
    if (!revealTrack) return;
    revealTrack.currentTime = 0;
    _primePlay(revealTrack);
    _stopAllTracksExcept(revealTrack);
    _fadeIn(revealTrack, VOLUME, FADE_MS);
  }

  function stopReveal() {
    if (revealTrack && !revealTrack.paused) {
      return _fadeOut(revealTrack, FADE_MS);
    }
    return Promise.resolve();
  }

  function stopAll() {
    return _stopAllTracks();
  }

  function stopDramatic() {
    if (dramaticTrack && !dramaticTrack.paused) {
      return _fadeOut(dramaticTrack, FADE_MS);
    }
    return Promise.resolve();
  }

  function toggleMute() {
    muted = !muted;
    localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
    [dramaticTrack, partyTrack, investigationTrack, revealTrack].forEach(t => {
      if (t) t.muted = muted;
    });
    return muted;
  }

  function isMuted() {
    return muted;
  }

  return {
    init,
    playDramatic,
    playParty,
    playInvestigation,
    playReveal,
    stopAll,
    stopDramatic,
    stopReveal,
    toggleMute,
    isMuted
  };
})();
