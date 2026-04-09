/* ============================================
   GAME ENGINE — Core game loop, state machine,
   wires up all modules
   ============================================ */

const GameEngine = (() => {
  let currentScenario = null;
  let titleSelection = {
    scenarioId: null,
    theme: 'noir',
    mode: 'solo',
    gameCode: null,
    detectiveRole: null
  };

  function _previewUrlParams() {
    const search = window.location.search;
    if (search && search.length > 1) return new URLSearchParams(search);
    const hash = window.location.hash;
    if (hash && hash.length > 1 && hash.includes('=')) {
      return new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
    }
    return new URLSearchParams();
  }

  /**
   * Dev / QA: open the reveal screen with a perfect (Brilliant) score without playing.
   * Example: index.html?preview=reveal&case=deadly_secrets&theme=cozy
   * Params: preview=reveal|brilliant, case=<scenario id> (default deadly_secrets), theme=cozy|noir|...
   * Serve the site with the server root = the folder that contains index.html and scenarios/ (or fetches return 404).
   */
  async function _maybePreviewRevealFromUrl() {
    const params = _previewUrlParams();
    const pv = (params.get('preview') || '').trim().toLowerCase();
    if (pv !== 'reveal' && pv !== 'brilliant') return;

    const scenarioId = params.get('case') || 'deadly_secrets';
    const theme = params.get('theme');
    if (theme) {
      titleSelection.theme = theme;
      document.body.className = `theme-${theme}`;
      document.querySelectorAll('.theme-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.theme === theme);
      });
    }

    let scen;
    try {
      scen = await ScenarioLoader.loadScenario(scenarioId);
    } catch (e) {
      const tried = new URL(`scenarios/${scenarioId}.json`, window.location.href).href;
      console.error(
        '[preview] Could not load scenario.',
        'Expected JSON at a URL like:',
        tried,
        '(start your static server from the murder-mystery folder, or use /murder-mystery/ in the path.)',
        e
      );
      return;
    }

    try {
      localStorage.removeItem(`mm_solo_${scenarioId}`);
    } catch (err) {
      /* ignore */
    }
    StateManager.load(scenarioId, 'solo', null, null);
    StateManager.setPhase('reveal');
    StateManager.setStoryPhase('post_event');

    const sol = scen.solution;
    const profile = sol?.accusation_profile;
    const canonM = profile?.had_motive_vs_meredith || [];
    const canonO = profile?.had_opportunity || [];

    function normSortIds(ids) {
      return [...new Set((ids || []).filter(Boolean))].sort();
    }

    function perfectMultiGrade(maxPts, canonIds) {
      const idsa = normSortIds(canonIds);
      return {
        max: maxPts,
        points: maxPts,
        perfect: true,
        hitIds: idsa,
        missIds: [],
        extraIds: []
      };
    }

    const accusation = {
      hadMotiveVsMeredith: [...canonM],
      hadOpportunity: [...canonO],
      method: sol.method,
      culprit: sol.culprit,
      motive: sol.motive
    };
    StateManager.setAccusation(accusation);

    const ccSol = scen.cold_case_solution;
    const coldCaseAcc = ccSol
      ? {
          suspect: ccSol.culprit,
          cause: ccSol.cause,
          coverup: ccSol.coverup
        }
      : null;
    StateManager.setColdCaseAccusation(coldCaseAcc);

    const totalSecrets = scen.suspects.filter(s => s.secret).length;
    const mGrade = profile ? perfectMultiGrade(10, canonM) : null;
    const oGrade = profile ? perfectMultiGrade(10, canonO) : null;
    const mPts = mGrade ? mGrade.points : 0;
    const oPts = oGrade ? oGrade.points : 0;

    let maxScore = mPts + oPts + 20 + 40 + 20;
    let total = mPts + oPts + 20 + 40 + 20;

    if (ccSol) {
      maxScore += 100;
      total += 100;
    }
    if (totalSecrets > 0) {
      maxScore += totalSecrets * 10;
      total += totalSecrets * 10;
    }

    const score = {
      motiveSuspects: !!mGrade?.perfect,
      opportunitySuspects: !!oGrade?.perfect,
      motiveSuspectsGrade: mGrade,
      opportunitySuspectsGrade: oGrade,
      culprit: true,
      motive: true,
      method: true,
      motiveSuspectsPts: mPts,
      opportunitySuspectsPts: oPts,
      culpritPts: 40,
      motivePts: 20,
      methodPts: 20,
      total,
      maxScore,
      coldCase: ccSol
        ? { suspect: true, cause: true, coverup: true, total: 100 }
        : null,
      secrets: totalSecrets,
      secretsMax: totalSecrets
    };

    currentScenario = scen;
    titleSelection.scenarioId = scenarioId;

    try {
      UIRenderer.setScenarioImages(scen.images || null);
      UIRenderer.renderReveal(score, sol, accusation, scen);
      UIRenderer.showScreen('reveal');
      AudioManager.playReveal();
      console.log('[preview] Reveal screen (Brilliant mock):', scenarioId);
    } catch (e) {
      console.error('[preview] renderReveal failed:', e);
    }
  }

  async function boot() {
    try {
    console.log('[boot] Starting...');
    i18n.init();
    UIRenderer.init();
    document.body.className = `theme-${titleSelection.theme}`;
    document.querySelectorAll('.theme-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.theme === titleSelection.theme);
    });

    await reloadScenarios();
    UIRenderer.setupThemeSelector(onThemeChange);
    UIRenderer.setupModeSelector(onModeChange);
    UIRenderer.setupCoopControls(onCreateCode, onJoinCode, onRoleSelect);
    UIRenderer.setupNotebook();
    i18n.applyToDOM();

    UIRenderer.setOnDialogueClose(() => {
      if (currentScenario) renderInvestigation();
    });

    document.getElementById('btn-start').addEventListener('click', startGame);
    document.getElementById('btn-back-to-title').addEventListener('click', backToTitle);
    document.getElementById('btn-restart-case').addEventListener('click', restartCase);
    document.getElementById('btn-begin-investigation').addEventListener('click', beginInvestigation);
    document.getElementById('btn-back-to-intro').addEventListener('click', backToIntro);
    document.getElementById('btn-make-accusation').addEventListener('click', goToAccusation);
    document.getElementById('btn-cancel-accusation').addEventListener('click', cancelAccusation);
    document.getElementById('btn-play-again').addEventListener('click', playAgain);

    document.getElementById('btn-proceed-to-event').addEventListener('click', triggerMurderEvent);
    document.getElementById('btn-begin-post-investigation').addEventListener('click', beginPostInvestigation);
    document.getElementById('btn-cold-case-accusation')?.addEventListener('click', goToColdCaseAccusation);
    document.getElementById('btn-cancel-cold-case').addEventListener('click', cancelColdCaseAccusation);

    AudioManager.init(
      'assets/audio/dramatic_sting.m4a',
      'assets/audio/party_ambiance.m4a',
      'assets/audio/investigation_ambiance.m4a',
      'assets/audio/tragic_ending.m4a'
    );
    _setupAudioToggles();

    // Start music on the first user interaction with the page
    const _startOnFirstClick = () => {
      AudioManager.playDramatic();
      document.removeEventListener('click', _startOnFirstClick);
    };
    document.addEventListener('click', _startOnFirstClick);

    await _maybePreviewRevealFromUrl();

    console.log('[boot] Complete');
    } catch (err) {
      console.error('[boot] Error:', err);
    }
  }

  async function reloadScenarios() {
    const scenarios = await ScenarioLoader.loadManifest();
    UIRenderer.renderScenarioCards(scenarios, onScenarioSelect);
    titleSelection.scenarioId = null;
    document.querySelectorAll('.scenario-card').forEach(c => c.classList.remove('selected'));
    updateStartButton();
  }

  function _setupAudioToggles() {
    const btns = document.querySelectorAll('.btn-audio-toggle');
    const syncIcon = () => {
      const icon = AudioManager.isMuted() ? '🔇' : '🔊';
      btns.forEach(b => b.textContent = icon);
    };
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const wasMuted = AudioManager.isMuted();
        AudioManager.toggleMute();
        // If unmuting on the title screen, kick-start the dramatic track
        if (wasMuted && !AudioManager.isMuted()) {
          AudioManager.playDramatic();
        }
        syncIcon();
      });
    });
    syncIcon();
  }

  // ---- Title Screen Handlers ----

  function onScenarioSelect(scenario) {
    titleSelection.scenarioId = scenario.id;

    const themeBtns = document.querySelectorAll('.theme-btn');
    const currentTheme = titleSelection.theme;
    const currentStillAvailable = scenario.availableThemes.includes(currentTheme);
    let firstAvailable = null;
    themeBtns.forEach(btn => {
      const available = scenario.availableThemes.includes(btn.dataset.theme);
      btn.style.opacity = available ? '1' : '0.3';
      btn.style.pointerEvents = available ? '' : 'none';
      if (available && !firstAvailable) firstAvailable = btn;
    });
    if (!currentStillAvailable && firstAvailable) {
      themeBtns.forEach(b => b.classList.remove('active'));
      firstAvailable.classList.add('active');
      firstAvailable.click();
    }

    const modeSection = document.querySelector('.mode-selector')?.closest('.menu-section');
    if (modeSection) {
      if (scenario.soloOnly) {
        modeSection.classList.add('hidden');
        document.getElementById('coop-setup')?.classList.add('hidden');
        titleSelection.mode = 'solo';
        titleSelection.gameCode = null;
        titleSelection.detectiveRole = null;
      } else {
        modeSection.classList.remove('hidden');
      }
    }

    updateStartButton();
  }

  function onThemeChange(theme) {
    titleSelection.theme = theme;
  }

  function onModeChange(mode) {
    titleSelection.mode = mode;
    if (mode === 'solo') {
      titleSelection.gameCode = null;
      titleSelection.detectiveRole = null;
    }
    updateStartButton();
  }

  function onCreateCode(code) {
    titleSelection.gameCode = code;
    updateStartButton();
  }

  function onJoinCode(code) {
    titleSelection.gameCode = code;
    updateStartButton();
  }

  function onRoleSelect(role) {
    titleSelection.detectiveRole = role;
    updateStartButton();
  }

  function updateStartButton() {
    const btn = document.getElementById('btn-start');
    let ready = !!titleSelection.scenarioId;

    if (titleSelection.mode === 'coop') {
      ready = ready && !!titleSelection.gameCode && !!titleSelection.detectiveRole;
    }

    btn.disabled = !ready;
  }

  // ---- Game Flow ----

  async function startGame() {
    // Start audio immediately within the user gesture (before await)
    AudioManager.playDramatic();

    try {
      currentScenario = await ScenarioLoader.loadScenario(titleSelection.scenarioId);
    } catch (e) {
      AudioManager.stopDramatic();
      alert(i18n.t('error_load'));
      console.error(e);
      return;
    }

    const role = titleSelection.mode === 'coop' ? titleSelection.detectiveRole : null;
    StateManager.load(
      titleSelection.scenarioId,
      titleSelection.mode,
      titleSelection.gameCode,
      role
    );
    StateManager.state.theme = titleSelection.theme;
    StateManager.state.scenarioId = titleSelection.scenarioId;
    StateManager.state.mode = titleSelection.mode;
    StateManager.state.gameCode = titleSelection.gameCode;
    StateManager.state.detectiveRole = role;
    StateManager.setPhase('intro');

    UIRenderer.setScenarioImages(currentScenario.images || null);
    UIRenderer.renderIntro(currentScenario);
    updateIntroButtons();
    UIRenderer.showScreen('intro');
  }

  function updateIntroButtons() {
    const restartBtn = document.getElementById('btn-restart-case');
    const beginBtn = document.getElementById('btn-begin-investigation');
    if (StateManager.hasSavedProgress()) {
      restartBtn.classList.remove('hidden');
      beginBtn.textContent = i18n.t('continue_investigation');
    } else {
      restartBtn.classList.add('hidden');
      beginBtn.textContent = i18n.t('begin_investigation');
    }
  }

  function restartCase() {
    StateManager.clearSavedGame();
    StateManager.load(
      titleSelection.scenarioId,
      titleSelection.mode,
      titleSelection.gameCode,
      titleSelection.mode === 'coop' ? titleSelection.detectiveRole : null
    );
    StateManager.state.theme = titleSelection.theme;
    StateManager.setPhase('intro');
    updateIntroButtons();
  }

  function backToTitle() {
    AudioManager.stopDramatic();
    StateManager.clearSavedGame();
    currentScenario = null;
    StateManager.setPhase('title');
    UIRenderer.showScreen('title');
  }

  function backToIntro() {
    const dialoguePanel = document.getElementById('dialogue-panel');
    if (dialoguePanel && !dialoguePanel.classList.contains('hidden')) {
      dialoguePanel.classList.add('hidden');
      document.getElementById('suspect-grid').classList.remove('hidden');
      return;
    }
    StateManager.setPhase('intro');
    UIRenderer.renderIntro(currentScenario);
    updateIntroButtons();
    UIRenderer.showScreen('intro');
  }

  function _isTwoPhase() {
    return currentScenario && currentScenario.two_phase === true;
  }

  function beginInvestigation() {
    if (_isTwoPhase() && StateManager.getStoryPhase() === 'pre_event') {
      AudioManager.playParty();
      StateManager.setPhase('pre_event');
      renderInvestigation();
      UIRenderer.showScreen('investigation');
    } else {
      AudioManager.stopDramatic();
      StateManager.setPhase('investigation');
      renderInvestigation();
      UIRenderer.showScreen('investigation');
    }
  }

  function _updateProceedButton() {
    const btn = document.getElementById('btn-proceed-to-event');
    if (!btn || btn.classList.contains('hidden')) return;

    const role = StateManager.state.detectiveRole;
    const lockedSuspectIds = role
      ? currentScenario.suspects.filter(s => s.detective_assignment !== role).map(s => s.id)
      : [];

    const allChatsComplete = UIRenderer.allPlayableSuspectsFullyInterviewed(
      currentScenario.suspects,
      lockedSuspectIds,
      'pre_event',
      true
    );

    btn.disabled = !allChatsComplete;
    btn.style.opacity = allChatsComplete ? '' : '0.4';
    btn.style.cursor = allChatsComplete ? '' : 'not-allowed';
    btn.classList.toggle('btn-ready', allChatsComplete);
    btn.title = allChatsComplete ? '' : i18n.t('proceed_need_all_chats');
  }

  function triggerMurderEvent() {
    if (_isTwoPhase() && StateManager.getStoryPhase() === 'pre_event') {
      const role = StateManager.state.detectiveRole;
      const lockedSuspectIds = role
        ? currentScenario.suspects.filter(s => s.detective_assignment !== role).map(s => s.id)
        : [];
      if (
        !UIRenderer.allPlayableSuspectsFullyInterviewed(
          currentScenario.suspects,
          lockedSuspectIds,
          'pre_event',
          true
        )
      ) {
        return;
      }
    }
    StateManager.setPhase('murder_event');
    StateManager.setStoryPhase('post_event');
    StateManager.unlockNode('post_initial');
    UIRenderer.renderMurderEvent(currentScenario);
    UIRenderer.showScreen('murderEvent');
    AudioManager.playDramatic();
  }

  function beginPostInvestigation() {
    StateManager.setPhase('investigation');
    renderInvestigation();
    UIRenderer.showScreen('investigation');
    AudioManager.playInvestigation();
  }

  function renderInvestigation() {
    const role = StateManager.state.detectiveRole;

    const lockedSuspectIds = role
      ? currentScenario.suspects
          .filter(s => s.detective_assignment !== role)
          .map(s => s.id)
      : [];

    const storyPhase = StateManager.getStoryPhase();

    const eventBtn = document.getElementById('btn-proceed-to-event');
    const accuseBtn = document.getElementById('btn-make-accusation');
    const coldCaseBtn = document.getElementById('btn-cold-case-accusation');

    if (_isTwoPhase()) {
      UIRenderer.renderSuspectsForPhase(
        currentScenario.suspects,
        lockedSuspectIds,
        onSuspectClick,
        storyPhase,
        currentScenario
      );

      if (storyPhase === 'pre_event') {
        eventBtn.classList.remove('hidden');
        accuseBtn.classList.add('hidden');
        coldCaseBtn.classList.add('hidden');
      } else {
        eventBtn.classList.add('hidden');
        accuseBtn.classList.remove('hidden');
        // Cold case runs automatically after main accusation; no separate button on investigation.
        coldCaseBtn.classList.add('hidden');
      }
    } else {
      UIRenderer.renderSuspects(
        currentScenario.suspects,
        lockedSuspectIds,
        onSuspectClick
      );
      eventBtn.classList.add('hidden');
      accuseBtn.classList.remove('hidden');
      coldCaseBtn.classList.add('hidden');
    }

    UIRenderer.updateNotebook(StateManager.state.clues, currentScenario, StateManager.getSecretsFound());
    if (_isTwoPhase()) {
      _updateProceedButton();
    }
    _updateAccusationButton(lockedSuspectIds);
  }

  function _updateAccusationButton(lockedSuspectIds) {
    const accuseBtn = document.getElementById('btn-make-accusation');
    if (!accuseBtn || accuseBtn.classList.contains('hidden')) return;

    const allDone = UIRenderer.allPlayableSuspectsFullyInterviewed(
      currentScenario.suspects,
      lockedSuspectIds,
      StateManager.getStoryPhase(),
      _isTwoPhase()
    );
    accuseBtn.disabled = !allDone;
    accuseBtn.title = allDone ? '' : i18n.t('accusation_need_all_interviews');
  }

  // ---- Dialogue System ----

  function onSuspectClick(suspect) {
    UIRenderer.showDialogue(suspect, [], onDialogueChoice);
  }

  function _checkForNewLeads(currentSuspect, clueId, notifiedSet) {
    const phase = StateManager.getStoryPhase();
    for (const s of currentScenario.suspects) {
      if (s.id === currentSuspect.id || notifiedSet.has(s.id)) continue;
      const tree = s.dialogue_tree;
      const baseNode = (phase === 'post_event' && tree['post_initial']) ? 'post_initial' : 'initial';
      for (const [key, node] of Object.entries(tree)) {
        if (key !== baseNode && !StateManager.isNodeUnlocked(key)) continue;
        if (key === 'initial' && baseNode === 'post_initial') continue;
        if (!node.choices) continue;
        for (const c of node.choices) {
          if (notifiedSet.has(s.id)) continue;
          if (!c.requires_clue && !c.requires_clue_any) continue;
          const andReq = c.requires_clue;
          const anyReq = c.requires_clue_any;
          const andIds = andReq == null ? [] : (Array.isArray(andReq) ? andReq : [andReq]);
          const anyIds = anyReq == null ? [] : (Array.isArray(anyReq) ? anyReq : [anyReq]);
          if (!andIds.includes(clueId) && !anyIds.includes(clueId)) continue;
          if (
            StateManager.satisfiesRequiresClue(c.requires_clue) &&
            StateManager.satisfiesRequiresClueAny(c.requires_clue_any) &&
            StateManager.satisfiesRequiresPostInterviews(c.requires_post_interviews)
          ) {
            notifiedSet.add(s.id);
            UIRenderer.showNewLeadToast(s.name);
          }
        }
      }
    }
  }

  function _checkForSecretDiscovery(clueId) {
    if (!_isTwoPhase()) return;
    for (const s of currentScenario.suspects) {
      const sec = s.secret;
      if (sec && sec.trigger_clue === clueId) {
        const isNew = StateManager.addSecret(sec.id);
        if (isNew) {
          UIRenderer.showSecretToast(sec.text);
          UIRenderer.updateNotebook(StateManager.state.clues, currentScenario, StateManager.getSecretsFound());
        }
      }
    }
  }

  function _shouldTriggerMurderEvent(clueId) {
    return false;
  }

  function onDialogueChoice(suspect, choice, nodeId, choiceIndex) {
    StateManager.markQuestionAsked(suspect.id, nodeId, choiceIndex);
    if (_isTwoPhase() && StateManager.getStoryPhase() === 'pre_event') {
      _updateProceedButton();
    }

    UIRenderer.showDialogueResponse(choice.text, choice.response, choice.clue, suspect);

    const notifiedSuspects = new Set();

    if (choice.clue) {
      const clue = {
        ...choice.clue,
        source: suspect.name,
        suspectId: suspect.id
      };
      const isNew = StateManager.addClue(clue);
      if (isNew) {
        UIRenderer.updateNotebook(StateManager.state.clues, currentScenario, StateManager.getSecretsFound());
        _checkForNewLeads(suspect, clue.id, notifiedSuspects);
        _checkForSecretDiscovery(clue.id);

        if (_shouldTriggerMurderEvent(clue.id)) {
          setTimeout(() => triggerMurderEvent(), 2000);
          return;
        }
      }
    }

    if (choice.unlocks && choice.unlocks.length > 0) {
      choice.unlocks.forEach(unlockedNodeId => {
        StateManager.unlockNode(unlockedNodeId);
        const targetSuspect = currentScenario.suspects.find(
          s => s.id !== suspect.id && s.dialogue_tree[unlockedNodeId]
        );
        if (targetSuspect && !notifiedSuspects.has(targetSuspect.id)) {
          notifiedSuspects.add(targetSuspect.id);
          UIRenderer.showNewLeadToast(targetSuspect.name);
        }
      });
    }

    document.getElementById('btn-back-to-questions').onclick = () => {
      if (UIRenderer.hasRemainingQuestions(suspect)) {
        UIRenderer.returnToQuestions(suspect, onDialogueChoice);
      } else {
        document.getElementById('dialogue-panel').classList.add('hidden');
        document.getElementById('suspect-grid').classList.remove('hidden');
        renderInvestigation();
      }
    };
  }

  // ---- Accusation ----

  function goToAccusation() {
    const role = StateManager.state.detectiveRole;
    const lockedSuspectIds = role
      ? currentScenario.suspects.filter(s => s.detective_assignment !== role).map(s => s.id)
      : [];
    if (
      !UIRenderer.allPlayableSuspectsFullyInterviewed(
        currentScenario.suspects,
        lockedSuspectIds,
        StateManager.getStoryPhase(),
        _isTwoPhase()
      )
    ) {
      return;
    }
    StateManager.setPhase('accusation');
    AudioManager.stopAll();
    Accusation.init(currentScenario, onMainAccusationComplete);
    UIRenderer.showScreen('accusation');
  }

  function onMainAccusationComplete() {
    const accusation = Accusation.getSelection();
    StateManager.setAccusation(accusation);

    if (_isTwoPhase() && currentScenario.cold_case_solution) {
      setTimeout(() => goToColdCaseAccusation(), 1200);
    } else {
      setTimeout(() => _finalizeReveal(), 1200);
    }
  }

  function cancelAccusation() {
    StateManager.setPhase('investigation');
    UIRenderer.showScreen('investigation');
  }

  function goToColdCaseAccusation() {
    StateManager.setPhase('cold_case_accusation');
    Accusation.initColdCase(currentScenario, onColdCaseComplete);
    UIRenderer.showScreen('coldCaseAccusation');
  }

  function onColdCaseComplete() {
    const ccAccusation = Accusation.getColdCaseSelection();
    StateManager.setColdCaseAccusation(ccAccusation);
    setTimeout(() => _finalizeReveal(), 1200);
  }

  function cancelColdCaseAccusation() {
    StateManager.setPhase('investigation');
    UIRenderer.showScreen('investigation');
  }

  function _finalizeReveal() {
    const totalSecrets = currentScenario.suspects.filter(s => s.secret).length;
    const secretsFound = StateManager.getSecretsFound();

    const scoreResult = Accusation.scoreAll(
      secretsFound,
      _isTwoPhase() ? totalSecrets : 0
    );

    const accusation = Accusation.getSelection();
    StateManager.setScore(scoreResult);
    StateManager.setPhase('reveal');

    UIRenderer.renderReveal(scoreResult, currentScenario.solution, accusation, currentScenario);
    UIRenderer.showScreen('reveal');
    AudioManager.playReveal();
  }

  async function playAgain() {
    AudioManager.stopAll();
    StateManager.clearSavedGame();
    currentScenario = null;
    titleSelection = {
      scenarioId: null,
      theme: titleSelection.theme,
      mode: 'solo',
      gameCode: null,
      detectiveRole: null
    };
    i18n.applyToDOM();
    await reloadScenarios();
    UIRenderer.showScreen('title');
  }

  // ---- Boot ----
  // If this script runs after DOMContentLoaded (e.g. late injection), boot would never run with only DOMContentLoaded.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  return { boot };
})();
