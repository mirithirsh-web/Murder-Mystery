/* ============================================
   UI RENDERER — DOM manipulation, screen
   transitions, suspects, dialogue, notebook
   ============================================ */

const UIRenderer = (() => {
  const screens = {};
  let notebookOpen = false;
  let _onDialogueClose = null;
  let _scenarioImages = null;
  const _nbExpandedSections = new Set();

  const TOAST_VISIBLE_CLUE_MS = 16000;
  const TOAST_VISIBLE_LEAD_MS = 16000;
  const TOAST_VISIBLE_SECRET_MS = 12000;
  const TOAST_EXIT_MS = 450;

  function getToastStack() {
    let el = document.getElementById('toast-stack');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast-stack';
      el.className = 'toast-stack';
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    return el;
  }

  function dismissToast(toast) {
    if (!toast || !toast.parentNode || toast.classList.contains('toast-dismissing')) return;
    if (toast._toastAutoHideId != null) {
      clearTimeout(toast._toastAutoHideId);
      toast._toastAutoHideId = null;
    }
    if (toast._toastRemoveId != null) {
      clearTimeout(toast._toastRemoveId);
      toast._toastRemoveId = null;
    }
    toast.classList.add('toast-dismissing');
    toast._toastRemoveId = setTimeout(() => {
      toast._toastRemoveId = null;
      toast.remove();
    }, TOAST_EXIT_MS);
  }

  function scheduleToastRemoval(toast, visibleMs) {
    if (toast._toastAutoHideId != null) {
      clearTimeout(toast._toastAutoHideId);
      toast._toastAutoHideId = null;
    }
    toast._toastAutoHideId = setTimeout(() => {
      toast._toastAutoHideId = null;
      dismissToast(toast);
    }, visibleMs);
  }

  function wireToastInteractions(toast) {
    const hint = i18n.t('toast_dismiss_hint');
    toast.setAttribute('role', 'button');
    toast.setAttribute('tabindex', '0');
    toast.setAttribute('aria-label', hint);
    toast.title = hint;
    toast.addEventListener('click', () => dismissToast(toast));
    toast.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        dismissToast(toast);
      }
    });
  }

  function setScenarioImages(images) {
    _scenarioImages = images || null;
  }

  function closeDialogueHandler() {
    document.getElementById('dialogue-panel').classList.add('hidden');
    document.getElementById('suspect-grid').classList.remove('hidden');
    if (_onDialogueClose) _onDialogueClose();
  }

  function setOnDialogueClose(fn) {
    _onDialogueClose = fn;
  }

  function init() {
    screens.title = document.getElementById('screen-title');
    screens.intro = document.getElementById('screen-intro');
    screens.investigation = document.getElementById('screen-investigation');
    screens.murderEvent = document.getElementById('screen-murder-event');
    screens.accusation = document.getElementById('screen-accusation');
    screens.coldCaseAccusation = document.getElementById('screen-cold-case-accusation');
    screens.reveal = document.getElementById('screen-reveal');
  }

  function showScreen(name) {
    const overlay = document.createElement('div');
    overlay.className = 'screen-transition';
    document.body.appendChild(overlay);
    setTimeout(() => overlay.remove(), 700);

    Object.values(screens).forEach(s => s.classList.remove('active'));
    const target = screens[name];
    if (target) {
      target.classList.add('active');
      target.scrollTop = 0;
      window.scrollTo(0, 0);
    }
  }

  // ---- Title Screen ----

  function renderScenarioCards(scenarios, onSelect) {
    const container = document.getElementById('scenario-list');
    container.innerHTML = '';
    scenarios.forEach(s => {
      const card = document.createElement('div');
      card.className = 'scenario-card';
      card.dataset.id = s.id;
      card.innerHTML = `
        <h3>${s.title}</h3>
        <p>${s.setting}</p>
        <div class="suspect-count">${s.suspectCount} ${i18n.t('suspects_label')}</div>
      `;
      card.addEventListener('click', () => {
        container.querySelectorAll('.scenario-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        onSelect(s);
      });
      container.appendChild(card);
    });
  }

  function setupThemeSelector(onChange) {
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const theme = btn.dataset.theme;
        document.body.className = `theme-${theme}`;
        onChange(theme);
      });
    });
  }

  function setupModeSelector(onChange) {
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode;
        const coopSetup = document.getElementById('coop-setup');
        if (mode === 'coop') {
          coopSetup.classList.remove('hidden');
        } else {
          coopSetup.classList.add('hidden');
        }
        onChange(mode);
      });
    });
  }

  function setupCoopControls(onCreateCode, onJoinCode, onRoleSelect) {
    document.getElementById('btn-create-game').addEventListener('click', () => {
      const code = StateManager.generateGameCode();
      showCoopStatus(code);
      onCreateCode(code);
    });

    document.getElementById('btn-join-game').addEventListener('click', () => {
      const code = document.getElementById('input-game-code').value.trim().toUpperCase();
      if (code.length >= 4) {
        showCoopStatus(code);
        onJoinCode(code);
      }
    });

    document.querySelectorAll('.role-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        onRoleSelect(btn.dataset.role);
      });
    });
  }

  function showCoopStatus(code) {
    const statusEl = document.getElementById('coop-status');
    statusEl.classList.remove('hidden');
    statusEl.innerHTML = `
      <div>${i18n.t('game_code_label')}</div>
      <div class="game-code">${code}</div>
      <div style="font-size: 0.8rem; color: var(--text-muted);">${i18n.t('share_code')}</div>
    `;
    document.getElementById('detective-role').classList.remove('hidden');
  }

  // ---- Intro Screen ----

  function renderIntro(scenario) {
    const sceneImg = document.getElementById('intro-scene-image');
    if (scenario.images?.scene) {
      sceneImg.innerHTML = `<img src="${scenario.images.scene}" alt="${scenario.title}">`;
      sceneImg.classList.remove('hidden');
    } else {
      sceneImg.innerHTML = '';
      sceneImg.classList.add('hidden');
    }

    document.getElementById('intro-title').textContent = scenario.title;
    document.getElementById('intro-setting').textContent = scenario.setting;

    const timeEl = document.getElementById('intro-time');
    if (scenario.estimated_time) {
      timeEl.textContent = `${i18n.t('estimated_time')}: ${scenario.estimated_time}`;
      timeEl.classList.remove('hidden');
    } else {
      timeEl.classList.add('hidden');
    }

    const victimCard = document.getElementById('intro-victim');
    if (scenario.hide_victim_on_intro) {
      victimCard.classList.add('hidden');
    } else {
      victimCard.classList.remove('hidden');
      document.getElementById('victim-name').textContent = scenario.victim.name;
      document.getElementById('victim-desc').textContent = scenario.victim.description;

      const victimPortrait = document.getElementById('victim-portrait');
      if (scenario.victim.portrait) {
        victimPortrait.innerHTML = `<img src="${scenario.victim.portrait}" alt="${scenario.victim.name}">`;
        victimPortrait.classList.remove('hidden');
      } else {
        victimPortrait.innerHTML = '';
        victimPortrait.classList.add('hidden');
      }
    }

    const crimeSceneImg = document.getElementById('intro-crime-scene');
    if (scenario.images?.crime_scene) {
      crimeSceneImg.innerHTML = `<img src="${scenario.images.crime_scene}" alt="The Crime Scene">`;
      crimeSceneImg.classList.remove('hidden');
    } else {
      crimeSceneImg.innerHTML = '';
      crimeSceneImg.classList.add('hidden');
    }

    const narrativeEl = document.getElementById('intro-narrative');
    const narrativeAfterEl = document.getElementById('intro-narrative-after');
    narrativeEl.innerHTML = '';
    narrativeAfterEl.innerHTML = '';
    narrativeEl.classList.add('typewriter');

    const paragraphs = scenario.intro_narrative.split('\n\n');

    if (scenario.images?.crime_scene && paragraphs.length > 1) {
      const beforeParagraphs = paragraphs.slice(0, -1);
      const afterParagraph = paragraphs[paragraphs.length - 1];

      beforeParagraphs.forEach(p => {
        const pEl = document.createElement('p');
        pEl.innerHTML = p;
        pEl.style.marginBottom = '1rem';
        narrativeEl.appendChild(pEl);
      });

      narrativeAfterEl.classList.add('typewriter');
      const pEl = document.createElement('p');
      pEl.innerHTML = afterParagraph;
      pEl.style.marginBottom = '1rem';
      narrativeAfterEl.appendChild(pEl);
    } else {
      paragraphs.forEach(p => {
        const pEl = document.createElement('p');
        pEl.innerHTML = p;
        pEl.style.marginBottom = '1rem';
        narrativeEl.appendChild(pEl);
      });
    }
  }

  // ---- Investigation Screen ----

  /** Base node + unlocked sub-nodes; each item spreads choice fields plus _fromNode, _originalIndex. */
  function _collectMergedDialogueChoices(suspect) {
    const tree = suspect.dialogue_tree;
    const phase = StateManager.getStoryPhase();
    const baseNode =
      phase === 'post_event' && tree['post_initial'] ? 'post_initial' : 'initial';
    const node = tree[baseNode];
    if (!node) return { baseNode, items: [] };

    const items = (node.choices || []).map((c, i) => ({
      ...c,
      _fromNode: baseNode,
      _originalIndex: i
    }));

    Object.keys(tree).forEach(key => {
      if (key === baseNode) return;
      if (!StateManager.isNodeUnlocked(key)) return;
      const un = tree[key];
      (un.choices || []).forEach((c, i) => {
        items.push({ ...c, _fromNode: key, _originalIndex: i });
      });
    });

    return { baseNode, items };
  }

  /** After requires_clue filter: choices with defer_until_rest_asked only when all other eligible choices were asked; deferred items last. */
  function _visibleDialogueChoiceItems(suspect) {
    const { items } = _collectMergedDialogueChoices(suspect);
    const passingClues = items.filter(
      c =>
        (!c.requires_clue || StateManager.satisfiesRequiresClue(c.requires_clue)) &&
        (!c.requires_clue_any || StateManager.satisfiesRequiresClueAny(c.requires_clue_any)) &&
        StateManager.satisfiesRequiresPostInterviews(c.requires_post_interviews)
    );
    const deferred = passingClues.filter(c => c.defer_until_rest_asked);
    const normal = passingClues.filter(c => !c.defer_until_rest_asked);
    const allNormalAsked = normal.every(c =>
      StateManager.wasQuestionAsked(suspect.id, c._fromNode, c._originalIndex)
    );
    const visibleLate = allNormalAsked ? deferred : [];
    return [...normal, ...visibleLate];
  }

  function _hasNewLeads(suspect) {
    const phase = StateManager.getStoryPhase();
    const { baseNode } = _collectMergedDialogueChoices(suspect);
    const visible = _visibleDialogueChoiceItems(suspect);
    for (let i = 0; i < visible.length; i++) {
      const choice = visible[i];
      if (StateManager.wasQuestionAsked(suspect.id, choice._fromNode, choice._originalIndex)) continue;
      if (phase === 'pre_event' && baseNode === 'initial') {
        if (choice.requires_clue) return true;
      } else {
        return true;
      }
    }
    return false;
  }

  function renderSuspects(suspects, lockedSuspects, onSuspectClick, storyPhase) {
    const grid = document.getElementById('suspect-grid');
    grid.innerHTML = '';
    const isPreEvent = storyPhase === 'pre_event';

    const bannerImg = document.getElementById('investigation-scene-image');
    if (_scenarioImages?.dining_car) {
      bannerImg.innerHTML = `<img src="${_scenarioImages.dining_car}" alt="Investigation">`;
      bannerImg.classList.remove('hidden');
    } else {
      bannerImg.innerHTML = '';
      bannerImg.classList.add('hidden');
    }

    document.getElementById('investigation-title').textContent =
      StateManager.state.mode === 'coop'
        ? i18n.t('detective_investigation', { role: StateManager.state.detectiveRole })
        : i18n.t(isPreEvent ? 'mingling' : 'investigation');

    suspects.forEach(suspect => {
      const card = document.createElement('div');
      const isLocked = lockedSuspects.includes(suspect.id);
      card.className = `suspect-card${isLocked ? ' locked' : ''}`;
      card.dataset.id = suspect.id;

      const hasBeenInterviewed = StateManager.state.askedQuestions.some(
        q => q.startsWith(suspect.id + ':')
      );
      const remainingQuestions = _countUnaskedQuestions(suspect);
      const isFullyDone = hasBeenInterviewed && remainingQuestions === 0;
      if (isFullyDone) card.classList.add('interviewed');

      const hasNewLead = _hasNewLeads(suspect);

      const usePortraitOnCard = suspect.portrait && !suspect.portrait_post;
      const avatarHtml = usePortraitOnCard
        ? `<div class="suspect-portrait"><img src="${suspect.portrait}" alt="${suspect.name}"></div>`
        : `<div class="suspect-avatar">${suspect.avatar || '👤'}</div>`;

      let badgeHtml = '';
      if (isLocked) {
        badgeHtml = `<div class="suspect-badge">${i18n.t('badge_other')}</div>`;
      } else if (hasNewLead) {
        badgeHtml = `<div class="suspect-badge new-lead-badge">${i18n.t('badge_new_lead')}</div>`;
      } else if (isFullyDone) {
        badgeHtml = `<div class="suspect-badge">${i18n.t(isPreEvent ? 'badge_chatted' : 'badge_interviewed')}</div>`;
      }

      card.innerHTML = `
        ${avatarHtml}
        <div class="suspect-name">${suspect.name}</div>
        <div class="suspect-role">${suspect.role}</div>
        ${badgeHtml}
      `;

      if (!isLocked) {
        card.addEventListener('click', () => onSuspectClick(suspect));
      }

      grid.appendChild(card);
    });
  }

  function showDialogue(suspect, availableNodes, onChoiceClick) {
    const panel = document.getElementById('dialogue-panel');
    const grid = document.getElementById('suspect-grid');

    grid.classList.add('hidden');
    panel.classList.remove('hidden');

    document.getElementById('dialogue-suspect-name').textContent = suspect.name;
    document.getElementById('dialogue-suspect-role').innerHTML = suspect.role;

    const existingPortrait = document.querySelector('.dialogue-portrait');
    if (existingPortrait) existingPortrait.remove();
    const phase = StateManager.getStoryPhase();
    const portraitSrc = (phase === 'post_event' && suspect.portrait_post) ? suspect.portrait_post : suspect.portrait;
    if (portraitSrc) {
      const portraitEl = document.createElement('div');
      portraitEl.className = 'dialogue-portrait';
      portraitEl.innerHTML = `<img src="${portraitSrc}" alt="${suspect.name}">`;
      const suspectInfo = document.querySelector('.suspect-info');
      suspectInfo.insertBefore(portraitEl, suspectInfo.firstChild);
    }

    const startNode = (phase === 'post_event' && suspect.dialogue_tree['post_initial']) ? 'post_initial' : 'initial';
    renderDialogueNode(suspect, startNode, onChoiceClick);

    document.getElementById('btn-close-dialogue').onclick = closeDialogueHandler;
  }

  function renderDialogueNode(suspect, nodeId, onChoiceClick) {
    const tree = suspect.dialogue_tree;
    const node = tree[nodeId];
    if (!node) return;

    const promptEl = document.getElementById('dialogue-prompt');
    const responseEl = document.getElementById('dialogue-response');
    const choicesEl = document.getElementById('dialogue-choices');
    const backBtn = document.getElementById('btn-back-to-questions');

    promptEl.innerHTML = '';
    if (node.scene_image) {
      const sceneDiv = document.createElement('div');
      sceneDiv.className = 'dialogue-scene-image';
      sceneDiv.innerHTML = `<img src="${node.scene_image}" alt="">`;
      promptEl.appendChild(sceneDiv);
    }
    const promptText = document.createElement('span');
    promptText.textContent = node.prompt;
    promptEl.appendChild(promptText);

    responseEl.classList.add('hidden');
    responseEl.innerHTML = '';
    backBtn.classList.add('hidden');
    choicesEl.classList.remove('hidden');
    choicesEl.innerHTML = '';

    const visibleChoices = _visibleDialogueChoiceItems(suspect);

    visibleChoices.forEach((choice, idx) => {
      const fromNode = choice._fromNode || nodeId;
      const originalIdx = choice._originalIndex !== undefined ? choice._originalIndex : idx;
      const wasAsked = StateManager.wasQuestionAsked(suspect.id, fromNode, originalIdx);
      const isNewLead = choice._fromNode && choice._fromNode !== 'initial' && !wasAsked;

      const btn = document.createElement('button');
      btn.className = `dialogue-choice${wasAsked ? ' asked' : ''}${isNewLead ? ' new-lead' : ''}`;
      if (isNewLead) btn.dataset.newLabel = i18n.t('badge_new_lead').toUpperCase();
      btn.textContent = choice.text;
      const payload = { ...choice };
      delete payload._fromNode;
      delete payload._originalIndex;
      btn.addEventListener('click', () => {
        onChoiceClick(suspect, payload, fromNode, originalIdx);
      });
      choicesEl.appendChild(btn);
    });
  }

  function _countUnaskedQuestions(suspect) {
    const visible = _visibleDialogueChoiceItems(suspect);
    return visible.filter(
      c => !StateManager.wasQuestionAsked(suspect.id, c._fromNode, c._originalIndex)
    ).length;
  }

  /**
   * True when every suspect the player can interview has been opened at least once
   * and has no remaining visible questions (same bar as the "interviewed" card badge).
   * @param {object[]} suspects
   * @param {string[]} lockedSuspectIds — co-op: other detective's roster
   * @param {string} storyPhase
   * @param {boolean} isTwoPhase — when true and post_event, victims (dies_at_event) are excluded
   */
  function allPlayableSuspectsFullyInterviewed(suspects, lockedSuspectIds, storyPhase, isTwoPhase) {
    let playable = suspects.filter(s => !lockedSuspectIds.includes(s.id));
    if (isTwoPhase && storyPhase === 'post_event') {
      playable = playable.filter(s => !s.dies_at_event);
    }
    if (playable.length === 0) return false;
    return playable.every(s => {
      const hasBeenInterviewed = StateManager.state.askedQuestions.some(q => q.startsWith(`${s.id}:`));
      return hasBeenInterviewed && _countUnaskedQuestions(s) === 0;
    });
  }

  function showDialogueResponse(question, text, clue, suspect) {
    const responseEl = document.getElementById('dialogue-response');
    const choicesEl = document.getElementById('dialogue-choices');
    const backBtn = document.getElementById('btn-back-to-questions');

    responseEl.innerHTML = '';

    const questionP = document.createElement('p');
    questionP.className = 'dialogue-question-echo';
    questionP.textContent = question;
    responseEl.appendChild(questionP);

    const textP = document.createElement('p');
    textP.innerHTML = text;
    responseEl.appendChild(textP);

    if (clue && _scenarioImages?.clues?.[clue.id]) {
      const imgDiv = document.createElement('div');
      imgDiv.className = 'clue-image';
      imgDiv.innerHTML = `<img src="${_scenarioImages.clues[clue.id]}" alt="${clue.text}">`;
      responseEl.appendChild(imgDiv);
    }

    responseEl.classList.remove('hidden');
    choicesEl.classList.add('hidden');

    const remaining = suspect ? _countUnaskedQuestions(suspect) : 1;
    if (remaining > 0) {
      backBtn.textContent = i18n.t('ask_another');
      backBtn.classList.remove('hidden');
    } else {
      backBtn.textContent = i18n.t('no_more_questions') || 'No more questions';
      backBtn.classList.remove('hidden');
    }

    if (clue && !clue.hideFromNotebook) {
      showClueToast(clue.text);
    }
  }

  function returnToQuestions(suspect, onChoiceClick) {
    const choicesEl = document.getElementById('dialogue-choices');
    const backBtn = document.getElementById('btn-back-to-questions');
    const responseEl = document.getElementById('dialogue-response');

    choicesEl.classList.remove('hidden');
    backBtn.classList.add('hidden');
    responseEl.classList.add('hidden');

    const phase = StateManager.getStoryPhase();
    const startNode = (phase === 'post_event' && suspect.dialogue_tree['post_initial']) ? 'post_initial' : 'initial';
    renderDialogueNode(suspect, startNode, onChoiceClick);
  }

  function showClueToast(text) {
    const isPreEvent = StateManager.getStoryPhase() === 'pre_event';
    const label = i18n.t(isPreEvent ? 'toast_clue_pre' : 'toast_clue');
    const icon = isPreEvent ? '📝' : '🔍';

    const toast = document.createElement('div');
    toast.className = 'clue-toast';
    toast.innerHTML = `${icon} ${label} ${text}`;
    getToastStack().appendChild(toast);
    wireToastInteractions(toast);
    scheduleToastRemoval(toast, TOAST_VISIBLE_CLUE_MS);
  }

  function showNewLeadToast(suspectName) {
    const toast = document.createElement('div');
    toast.className = 'clue-toast new-lead-toast';
    toast.textContent = `🔍 ${i18n.t('toast_new_lead', { name: suspectName })}`;
    getToastStack().appendChild(toast);
    wireToastInteractions(toast);
    scheduleToastRemoval(toast, TOAST_VISIBLE_LEAD_MS);
  }

  // ---- Notebook ----

  function setupNotebook() {
    const toggleBtn = document.getElementById('btn-notebook-toggle');
    const closeBtn = document.getElementById('btn-notebook-close');
    const panel = document.getElementById('notebook-panel');

    toggleBtn.addEventListener('click', () => {
      notebookOpen = !notebookOpen;
      panel.classList.toggle('open', notebookOpen);
    });

    closeBtn.addEventListener('click', () => {
      notebookOpen = false;
      panel.classList.remove('open');
    });
  }

  function updateNotebook(clues, scenario, secretsFound) {
    const body = document.getElementById('notebook-body');
    const countEl = document.getElementById('clue-count');
    const secretsCountEl = document.getElementById('secrets-count');
    const secretsTotalEl = document.getElementById('secrets-total');

    const profiles = scenario?.character_profiles || {};
    const isPostEvent = StateManager.getStoryPhase() === 'post_event';
    const isPreEvent = StateManager.getStoryPhase() === 'pre_event';
    secretsFound = secretsFound || [];

    // Phase-aware notebook title and footer label
    const titleEl = document.querySelector('.notebook-header h3');
    if (titleEl) {
      titleEl.textContent = i18n.t(isPreEvent ? 'detectives_notebook_pre' : 'detectives_notebook');
    }
    const footerLabelEl = countEl?.nextElementSibling;
    if (footerLabelEl && footerLabelEl.hasAttribute('data-i18n')) {
      footerLabelEl.textContent = i18n.t(isPreEvent ? 'clues_gathered_pre' : 'clues_gathered');
    }

    const allSecrets = (scenario?.suspects || [])
      .filter(s => s.secret)
      .map(s => s.secret);
    secretsTotalEl.textContent = allSecrets.length;
    secretsCountEl.textContent = secretsFound.length;

    const visibleClues = (clues || []).filter(c => !c.hideFromNotebook);

    // Adam cold-case section: substring match only gates *initial* visibility; each progressive_fact
    // row must check against all collected clue ids (e.g. clue_rose_tenants_past has no "adam" in id).
    const adamClueIds = [];
    (clues || []).forEach(c => {
      if (c.id && String(c.id).includes('adam')) adamClueIds.push(c.id);
    });
    const allDiscoveredClueIds = new Set((clues || []).map(c => c.id).filter(Boolean));

    // Notebook lists only visible clues; hidden ones still exist in state for requires_clue / unlocks
    const cluesBySuspect = {};
    visibleClues.forEach(c => {
      const key = c.suspectId || '_unknown';
      if (!cluesBySuspect[key]) cluesBySuspect[key] = [];
      cluesBySuspect[key].push(c);
    });

    const secretsByCharacter = {};
    if (isPostEvent) {
      allSecrets.forEach(sec => {
        if (!secretsFound.includes(sec.id)) return;
        const owner = (scenario?.suspects || []).find(s => s.secret && s.secret.id === sec.id);
        if (owner) secretsByCharacter[owner.id] = sec;
      });
    }

    let html = '';

    // "About You" section — always visible when profiles exist
    const nick = profiles.nick_vince;
    if (nick) {
      html += _renderNickSection(nick);
    }

    if (clues.length === 0) {
      html += `<p class="notebook-empty">${i18n.t(isPreEvent ? 'no_clues_pre' : 'no_clues')}</p>`;
      body.innerHTML = html;
      countEl.textContent = 0;
      _attachAccordionHandlers(body);
      return;
    }

    if (visibleClues.length === 0) {
      html += `<p class="notebook-empty">${i18n.t(isPreEvent ? 'no_clues_pre' : 'no_clues')}</p>`;
      body.innerHTML = html;
      countEl.textContent = 0;
      _attachAccordionHandlers(body);
      return;
    }

    // Character sections — same order as suspect grid
    const suspectOrder = isPostEvent && scenario.post_event_order
      ? scenario.post_event_order
      : (scenario?.suspects || []).map(s => s.id);

    const notebookRenderedIds = new Set();

    suspectOrder.forEach(sid => {
      const profile = profiles[sid];
      const suspect = (scenario?.suspects || []).find(s => s.id === sid);
      if (!profile || !suspect) return;

      const charClues = cluesBySuspect[sid] || [];
      const secret = secretsByCharacter[sid];

      if (charClues.length === 0 && !secret) return;

      notebookRenderedIds.add(sid);
      html += _renderCharacterSection(sid, profile, suspect, charClues, secret, isPostEvent);
    });

    // Victims / deceased not in post_event_order still need a row if they have clues or a found secret
    if (isPostEvent) {
      (scenario?.suspects || []).forEach(suspect => {
        if (!suspect.dies_at_event || notebookRenderedIds.has(suspect.id)) return;
        const sid = suspect.id;
        const profile = profiles[sid];
        if (!profile) return;
        const charClues = cluesBySuspect[sid] || [];
        const secret = secretsByCharacter[sid];
        if (charClues.length === 0 && !secret) return;
        notebookRenderedIds.add(sid);
        html += _renderCharacterSection(sid, profile, suspect, charClues, secret, isPostEvent);
      });
    }

    // Cold Case: Adam Green — show once any Adam-tagged clue exists OR any progressive_fact is found
    const adam = profiles.adam_green;
    const adamProgressKeys = adam?.progressive_facts ? Object.keys(adam.progressive_facts) : [];
    const showAdamColdCase =
      adam &&
      (adamClueIds.length > 0 || adamProgressKeys.some(k => allDiscoveredClueIds.has(k)));
    if (showAdamColdCase) {
      html += _renderColdCaseSection(adam, allDiscoveredClueIds);
    }

    body.innerHTML = html;
    countEl.textContent = visibleClues.length;

    // Restore expand/collapse state and attach handlers
    _attachAccordionHandlers(body);
  }

  function _renderClueItem(c) {
    const imgSrc = _scenarioImages?.clues?.[c.id];
    const imgHtml = imgSrc
      ? `<div class="notebook-clue-image"><img src="${imgSrc}" alt="${c.text}"></div>`
      : '';
    return `<div class="notebook-clue"><div>${c.text}</div>${imgHtml}</div>`;
  }

  function _attachAccordionHandlers(container) {
    container.querySelectorAll('.nb-section').forEach(section => {
      const key = section.dataset.character || section.classList.contains('nb-section-nick') && 'nick_vince' || section.classList.contains('nb-section-coldcase') && 'adam_green';
      if (key && _nbExpandedSections.has(key)) {
        section.classList.remove('nb-collapsed');
      }
      const header = section.querySelector('.nb-section-header');
      if (header) {
        header.addEventListener('click', () => {
          const sectionKey = section.dataset.character || (section.classList.contains('nb-section-nick') ? 'nick_vince' : 'adam_green');
          section.classList.toggle('nb-collapsed');
          if (section.classList.contains('nb-collapsed')) {
            _nbExpandedSections.delete(sectionKey);
          } else {
            _nbExpandedSections.add(sectionKey);
          }
        });
      }
    });
  }

  function _renderNickSection(nick) {
    const collapsed = _nbExpandedSections.has('nick_vince') ? '' : 'nb-collapsed';
    return `
      <div class="nb-section nb-section-nick ${collapsed}" data-character="nick_vince">
        <div class="nb-section-header">
          <span class="nb-section-avatar">🔍</span>
          <div class="nb-section-title">
            <strong>${nick.name}</strong>
            <span class="nb-section-role">${nick.role}</span>
          </div>
          <span class="nb-chevron">▾</span>
        </div>
        <div class="nb-section-body">
          <p class="nb-bio">${nick.bio}</p>
          <ul class="nb-relationships">
            ${nick.relationships.map(r => `<li>${r}</li>`).join('')}
          </ul>
        </div>
      </div>`;
  }

  function _renderCharacterSection(sid, profile, suspect, charClues, secret, isPostEvent) {
    const portrait = suspect.portrait || '';
    const avatarHtml = portrait
      ? `<img class="nb-section-portrait" src="${portrait}" alt="${profile.name}">`
      : `<span class="nb-section-avatar">${suspect.avatar || '👤'}</span>`;
    const secretBadge = secret
      ? `<span class="nb-secret-badge" title="${secret.text}">🔓</span>`
      : '';
    const collapsedClass = _nbExpandedSections.has(sid) ? '' : 'nb-collapsed';

    const relationship = isPostEvent && profile.relationship_to_victim
      ? `<div class="nb-relationship">${profile.relationship_to_victim}</div>`
      : '';
    const ageHtml = profile.age
      ? `<span class="nb-age">${profile.age}</span>`
      : '';
    const metaHtml = (ageHtml || relationship)
      ? `<div class="nb-profile-meta">${ageHtml}${relationship}</div>`
      : '';

    let cluesHtml = '';
    if (charClues.length > 0) {
      cluesHtml = `<div class="nb-clues">${charClues.map(c => _renderClueItem(c)).join('')}</div>`;
    }

    let secretHtml = '';
    if (secret) {
      secretHtml = `<div class="nb-secret-reveal"><span class="secret-icon">🔓</span> ${secret.text}</div>`;
    }

    return `
      <div class="nb-section nb-section-character ${collapsedClass}" data-character="${sid}">
        <div class="nb-section-header">
          ${avatarHtml}
          <div class="nb-section-title">
            <strong>${profile.name}</strong> ${secretBadge}
            <span class="nb-section-role">${suspect.role}</span>
          </div>
          <span class="nb-chevron">▾</span>
        </div>
        <div class="nb-section-body">
          ${metaHtml}
          ${cluesHtml}
          ${secretHtml}
        </div>
      </div>`;
  }

  function _renderColdCaseSection(adam, discoveredClueIds) {
    const collapsedClass = _nbExpandedSections.has('adam_green') ? '' : 'nb-collapsed';

    let factsHtml = '';
    if (adam.progressive_facts) {
      const entries = Object.entries(adam.progressive_facts);
      factsHtml = entries.map(([clueId, factText]) => {
        const discovered = discoveredClueIds.has(clueId);
        return discovered
          ? `<div class="nb-cold-fact discovered">✦ ${factText}</div>`
          : `<div class="nb-cold-fact locked">✦ ????????</div>`;
      }).join('');
    }

    return `
      <div class="nb-section nb-section-coldcase ${collapsedClass}" data-character="adam_green">
        <div class="nb-section-header">
          <span class="nb-section-avatar">🪦</span>
          <div class="nb-section-title">
            <strong>${adam.name}</strong>
            <span class="nb-section-role">${adam.role}</span>
          </div>
          <span class="nb-chevron">▾</span>
        </div>
        <div class="nb-section-body">
          <p class="nb-bio">${adam.bio}</p>
          ${factsHtml ? `<div class="nb-cold-facts">${factsHtml}</div>` : ''}
        </div>
      </div>`;
  }

  // ---- Murder Event Screen ----

  function renderMurderEvent(scenario) {
    const narrativeEl = document.getElementById('murder-event-narrative');
    narrativeEl.innerHTML = '';
    narrativeEl.classList.add('typewriter');
    const paragraphs = scenario.murder_event_narrative.split('\n\n');
    const imageBreaks = scenario.murder_event_images || {};

    paragraphs.forEach((p, idx) => {
      const pEl = document.createElement('p');
      pEl.innerHTML = p;
      pEl.style.marginBottom = '1rem';
      narrativeEl.appendChild(pEl);

      const imgSrc = imageBreaks[String(idx)];
      if (imgSrc) {
        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'murder-event-image';
        imgWrapper.innerHTML = `<img src="${imgSrc}" alt="">`;
        narrativeEl.appendChild(imgWrapper);
      }
    });
  }

  // ---- Secrets Tracking ----

  function showSecretToast(secretText) {
    const toast = document.createElement('div');
    toast.className = 'clue-toast secret-toast';
    toast.innerHTML = `🔓 <strong>${i18n.t('toast_secret')}</strong> ${secretText}`;
    getToastStack().appendChild(toast);
    wireToastInteractions(toast);
    scheduleToastRemoval(toast, TOAST_VISIBLE_SECRET_MS);
  }

  // Secrets are now rendered inline within character sections in updateNotebook

  // ---- Investigation with phase awareness ----

  function renderSuspectsForPhase(suspects, lockedSuspects, onSuspectClick, storyPhase, scenario) {
    const activeSuspects = storyPhase === 'post_event'
      ? suspects.filter(s => !s.dies_at_event)
      : suspects;

    if (storyPhase === 'post_event' && scenario && scenario.post_event_order) {
      const order = scenario.post_event_order;
      activeSuspects.sort((a, b) => {
        const ai = order.indexOf(a.id);
        const bi = order.indexOf(b.id);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      });
    }

    renderSuspects(activeSuspects, lockedSuspects, onSuspectClick, storyPhase);

    if (storyPhase === 'post_event') {
      const deadSuspects = suspects.filter(s => s.dies_at_event);
      const grid = document.getElementById('suspect-grid');
      deadSuspects.forEach(suspect => {
        const card = document.createElement('div');
        card.className = 'suspect-card deceased';
        const deceasedPortrait = suspect.portrait_post || suspect.portrait;
        const avatarHtml = deceasedPortrait
          ? `<div class="suspect-portrait"><img src="${deceasedPortrait}" alt="${suspect.name}"></div>`
          : `<div class="suspect-avatar">${suspect.avatar || '👤'}</div>`;
        card.innerHTML = `
          ${avatarHtml}
          <div class="suspect-name">${suspect.name}</div>
          <div class="suspect-role">${suspect.role}</div>
          <div class="suspect-badge deceased-badge">${i18n.t('badge_deceased')}</div>
        `;
        grid.appendChild(card);
      });
    }
  }

  // ---- Reveal Screen ----

  function renderReveal(score, solution, accusation, scenario) {
    const resultEl = document.getElementById('reveal-result');
    const scoreEl = document.getElementById('reveal-score');
    const narrativeEl = document.getElementById('reveal-narrative');
    const breakdownEl = document.getElementById('reveal-breakdown');

    const total = score.total;
    const maxScore = score.maxScore || 100;

    if (total >= maxScore * 0.85) {
      resultEl.textContent = i18n.t('result_brilliant');
      resultEl.className = 'reveal-result correct';
    } else if (total >= maxScore * 0.5) {
      resultEl.textContent = i18n.t('result_partial');
      resultEl.className = 'reveal-result partial';
    } else {
      resultEl.textContent = i18n.t('result_unsolved');
      resultEl.className = 'reveal-result wrong';
    }

    scoreEl.textContent = `${total} / ${maxScore}`;

    narrativeEl.classList.add('typewriter');

    function escapeHtml(s) {
      if (s == null || s === '') return '';
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function paraBlockHtml(narrativeText) {
      if (!narrativeText) return '';
      return narrativeText
        .split('\n\n')
        .map(p => `<p style="margin-bottom:1rem">${p}</p>`)
        .join('');
    }

    function figureBrilliantInline(src, altKey) {
      return `<figure class="reveal-scene-image reveal-brilliant-inline"><img src="${escapeHtml(src)}" alt="${escapeHtml(
        i18n.t(altKey)
      )}"></figure>`;
    }

    /** Insert figure immediately after the first paragraph containing `containsSubstring`, or after the last paragraph if none match. */
    function interleaveParagraphFigure(narrativeText, containsSubstring, figureHtml) {
      if (!narrativeText) return figureHtml || '';
      const paras = narrativeText.split('\n\n');
      if (paras.length === 0) return figureHtml || '';
      const idx = containsSubstring ? paras.findIndex(p => p.includes(containsSubstring)) : -1;
      const insertAfter = idx >= 0 ? idx : paras.length - 1;
      const parts = [];
      for (let i = 0; i < paras.length; i++) {
        parts.push(`<p style="margin-bottom:1rem">${paras[i]}</p>`);
        if (figureHtml && i === insertAfter) {
          parts.push(figureHtml);
          figureHtml = null;
        }
      }
      if (figureHtml) parts.push(figureHtml);
      return parts.join('');
    }

    const bb = _scenarioImages?.reveal_brilliant;
    const bbList = bb != null ? (Array.isArray(bb) ? bb : [bb]) : [];
    const layout = scenario.reveal_brilliant_layout;
    const useBrilliantLayout =
      layout && bbList.length >= 2 && layout.after_main_paragraph_contains;

    const coldCaseNarrativeText =
      score.coldCase && scenario.cold_case_solution?.reveal_narrative
        ? scenario.cold_case_solution.reveal_narrative
        : '';

    const coldCaseNarrativeWrapOpen =
      '<div class="cold-case-narrative" style="margin-top:1.5rem;padding:1rem;background:var(--bg);border-radius:var(--radius);border-left:3px solid var(--accent);">';
    const coldCaseNarrativeWrapClose = '</div>';

    let mainNarrativeHtml = '';
    if (useBrilliantLayout) {
      const taiFig = figureBrilliantInline(bbList[0], 'reveal_brilliant_img_1');
      mainNarrativeHtml = interleaveParagraphFigure(
        solution.reveal_narrative,
        layout.after_main_paragraph_contains,
        taiFig
      );
    } else {
      let prepend = '';
      if (bbList.length) {
        prepend =
          '<div class="reveal-brilliant-strip">' +
          bbList
            .map((src, i) => {
              const altKey = ['reveal_brilliant_img_1', 'reveal_brilliant_img_2'][i] || 'reveal_brilliant_img_extra';
              return `<figure class="reveal-scene-image reveal-brilliant-frame"><img src="${escapeHtml(
                src
              )}" alt="${escapeHtml(i18n.t(altKey))}"></figure>`;
            })
            .join('') +
          '</div>';
      } else if (_scenarioImages?.reveal) {
        prepend = `<div class="reveal-scene-image"><img src="${escapeHtml(_scenarioImages.reveal)}" alt="The Reveal"></div>`;
      }
      mainNarrativeHtml = prepend + paraBlockHtml(solution.reveal_narrative);
    }

    let coldNarrativeHtml = '';
    if (coldCaseNarrativeText) {
      if (useBrilliantLayout && layout.after_cold_case_paragraph_contains && bbList[1]) {
        const roseFig = figureBrilliantInline(bbList[1], 'reveal_brilliant_img_2');
        coldNarrativeHtml =
          coldCaseNarrativeWrapOpen +
          interleaveParagraphFigure(coldCaseNarrativeText, layout.after_cold_case_paragraph_contains, roseFig) +
          coldCaseNarrativeWrapClose;
      } else {
        coldNarrativeHtml =
          coldCaseNarrativeWrapOpen + paraBlockHtml(coldCaseNarrativeText) + coldCaseNarrativeWrapClose;
      }
    }

    narrativeEl.innerHTML = mainNarrativeHtml + coldNarrativeHtml;

    const culpritName = scenario.suspects.find(s => s.id === solution.culprit)?.name || solution.culprit;
    const accusedName = scenario.suspects.find(s => s.id === accusation.culprit)?.name || accusation.culprit;
    const victimName = scenario.victim?.name || 'the victim';
    const afb = solution.accusation_feedback || {};

    function namesForSuspectIds(ids) {
      if (!ids || !ids.length) return `(${i18n.t('acc_none_selected')})`;
      return ids.map(id => scenario.suspects.find(s => s.id === id)?.name || id).join(', ');
    }

    function normSortIds(ids) {
      return [...new Set((ids || []).filter(Boolean))].sort();
    }

    function suspectNameById(id) {
      return scenario.suspects.find(s => s.id === id)?.name || id;
    }

    function substVictim(text) {
      if (!text) return '';
      return String(text).replace(/\{victim\}/g, victimName);
    }

    function rationaleWithTitle(titleKey, bodyHtml) {
      if (!bodyHtml) return '';
      return `<div class="breakdown-rationale"><p class="feedback-title">${escapeHtml(i18n.t(titleKey))}</p>${bodyHtml}</div>`;
    }

    function setsEqualSorted(a, b) {
      if (a.length !== b.length) return false;
      return a.every((v, i) => v === b[i]);
    }

    function multiSelectRationale(grade, picked, canon, rightMap, wrongMap) {
      const canonS = normSortIds(canon);
      const pickedS = normSortIds(picked);
      if (!canonS.length && !pickedS.length) return '';

      const perfect = grade ? grade.perfect : setsEqualSorted(pickedS, canonS);

      function listForIds(ids, map, defaultKey) {
        return ids
          .map(id => {
            const raw = substVictim(map?.[id]);
            const body = raw
              ? escapeHtml(raw)
              : escapeHtml(i18n.t(defaultKey, { name: suspectNameById(id) }));
            return `<li><strong>${escapeHtml(suspectNameById(id))}:</strong> ${body}</li>`;
          })
          .join('');
      }

      if (perfect) {
        const items = listForIds(canonS, rightMap, 'feedback_canon_line_default');
        return rationaleWithTitle('feedback_fits', `<ul class="feedback-list">${items}</ul>`);
      }

      const hitIds = grade?.hitIds ?? canonS.filter(id => pickedS.includes(id));
      const missIds = grade?.missIds ?? canonS.filter(id => !pickedS.includes(id));
      const extraIds = grade?.extraIds ?? pickedS.filter(id => !canonS.includes(id));

      let body = '';
      if (hitIds.length) {
        body += `<p class="feedback-subtitle">${escapeHtml(i18n.t('feedback_got_right'))}</p><ul class="feedback-list">`;
        body += listForIds(hitIds, rightMap, 'feedback_canon_line_default');
        body += '</ul>';
      }
      if (extraIds.length) {
        body += `<p class="feedback-subtitle">${escapeHtml(i18n.t('feedback_extra'))}</p><ul class="feedback-list">`;
        body += listForIds(extraIds, wrongMap, 'feedback_extra_line_default');
        body += '</ul>';
      }
      if (missIds.length) {
        body += `<p class="feedback-subtitle">${escapeHtml(i18n.t('feedback_missing'))}</p><ul class="feedback-list">`;
        body += listForIds(missIds, rightMap, 'feedback_canon_line_default');
        body += '</ul>';
      }
      if (!body) return '';
      return rationaleWithTitle('feedback_review', body);
    }

    function multiSelectResultRow(grade, canon) {
      const max = grade?.max ?? 10;
      const pts = grade?.points ?? 0;
      let cls = 'wrong';
      let inner = '';
      if (grade?.perfect) {
        cls = 'correct';
        inner = `✓ ${i18n.t('correct')} (+${pts})`;
      } else if (pts > 0) {
        cls = 'partial';
        inner = `${i18n.t('acc_partial_score')} (+${pts} / ${max})`;
      } else {
        inner = `✗ ${i18n.t('wrong_dash')} (+0 / ${max}) — ${namesForSuspectIds(normSortIds(canon))}`;
      }
      return `<span class="result ${cls}">${inner}</span>`;
    }

    function singleRationale(isCorrect, playerVal, truthText, wrongMap) {
      const rawTruth = substVictim(truthText || '');
      if (isCorrect) {
        const p = rawTruth
          ? `<p class="feedback-p">${escapeHtml(rawTruth)}</p>`
          : `<p class="feedback-p">${escapeHtml(i18n.t('feedback_single_correct'))}</p>`;
        return rationaleWithTitle('feedback_fits', p);
      }
      let body = '';
      if (rawTruth) {
        body += `<p class="feedback-p"><strong>${escapeHtml(i18n.t('feedback_truth'))}:</strong> ${escapeHtml(rawTruth)}</p>`;
      }
      if (playerVal != null && playerVal !== '' && wrongMap && wrongMap[playerVal]) {
        body += `<p class="feedback-p"><strong>${escapeHtml(i18n.t('feedback_your_choice_note'))}:</strong> ${escapeHtml(substVictim(wrongMap[playerVal]))}</p>`;
      }
      if (!body) {
        body = `<p class="feedback-p">${escapeHtml(i18n.t('feedback_reveal_hint'))}</p>`;
      }
      return rationaleWithTitle('feedback_why', body);
    }

    const profile = solution.accusation_profile;
    const canonMotive = profile?.had_motive_vs_meredith || [];
    const canonOpp = profile?.had_opportunity || [];

    const methodPts = score.methodPts ?? 0;
    const culpritPts = score.culpritPts ?? 0;
    const motivePts = score.motivePts ?? 0;

    let breakdownHtml = `<h3>${i18n.t('score_breakdown')}</h3>`;

    if (profile) {
      const pickedM = accusation.hadMotiveVsMeredith || [];
      const pickedO = accusation.hadOpportunity || [];
      const ratM = multiSelectRationale(
        score.motiveSuspectsGrade,
        pickedM,
        canonMotive,
        afb.motive_suspects,
        afb.wrong_motive_suspects
      );
      const ratO = multiSelectRationale(
        score.opportunitySuspectsGrade,
        pickedO,
        canonOpp,
        afb.opportunity_suspects,
        afb.wrong_opportunity_suspects
      );
      breakdownHtml += `
      <div class="breakdown-block">
        <div class="breakdown-item">
          <span class="label">${i18n.t('label_acc_motive_suspects')} ${namesForSuspectIds(pickedM)}</span>
          ${multiSelectResultRow(score.motiveSuspectsGrade, canonMotive)}
        </div>
        ${ratM}
      </div>
      <div class="breakdown-block">
        <div class="breakdown-item">
          <span class="label">${i18n.t('label_acc_opportunity')} ${namesForSuspectIds(pickedO)}</span>
          ${multiSelectResultRow(score.opportunitySuspectsGrade, canonOpp)}
        </div>
        ${ratO}
      </div>`;
    }

    const ratMethod = singleRationale(
      score.method,
      accusation.method,
      afb.method,
      afb.wrong_method
    );
    const ratCulprit = singleRationale(
      score.culprit,
      accusation.culprit,
      afb.culprit,
      afb.wrong_culprit
    );
    const ratMotiveSingle = singleRationale(
      score.motive,
      accusation.motive,
      afb.motive,
      afb.wrong_motive_choice
    );

    breakdownHtml += `
      <div class="breakdown-block">
        <div class="breakdown-item">
          <span class="label">${i18n.t('label_method')} ${i18n.formatLabel(accusation.method || solution.method)}</span>
          <span class="result ${score.method ? 'correct' : 'wrong'}">
            ${score.method ? `✓ ${i18n.t('correct')} (+${methodPts})` : `✗ ${i18n.t('wrong_dash')} ${i18n.formatLabel(solution.method)}`}
          </span>
        </div>
        ${ratMethod}
      </div>
      <div class="breakdown-block">
        <div class="breakdown-item">
          <span class="label">${i18n.t('label_culprit')} ${accusedName || culpritName}</span>
          <span class="result ${score.culprit ? 'correct' : 'wrong'}">
            ${score.culprit ? `✓ ${i18n.t('correct')} (+${culpritPts})` : `✗ ${i18n.t('wrong_it_was')} ${culpritName}`}
          </span>
        </div>
        ${ratCulprit}
      </div>
      <div class="breakdown-block">
        <div class="breakdown-item">
          <span class="label">${i18n.t('label_motive')} ${i18n.formatLabel(accusation.motive || solution.motive)}</span>
          <span class="result ${score.motive ? 'correct' : 'wrong'}">
            ${score.motive ? `✓ ${i18n.t('correct')} (+${motivePts})` : `✗ ${i18n.t('wrong_dash')} ${i18n.formatLabel(solution.motive)}`}
          </span>
        </div>
        ${ratMotiveSingle}
      </div>
    `;

    if (score.coldCase) {
      const cc = score.coldCase;
      const ccSol = scenario.cold_case_solution;
      const ccAcc = StateManager.state.coldCaseAccusation || {};
      const ccfb = ccSol.cold_case_feedback || {};
      const ratCcWho = singleRationale(cc.suspect, ccAcc.suspect, ccfb.culprit, ccfb.wrong_culprit);
      const ratCcCause = singleRationale(cc.cause, ccAcc.cause, ccfb.cause, ccfb.wrong_cause);
      const ratCcCover = singleRationale(cc.coverup, ccAcc.coverup, ccfb.coverup, ccfb.wrong_coverup);
      breakdownHtml += `
        <h3 style="margin-top:1.5rem">${i18n.t('cold_case_breakdown')}</h3>
        <div class="breakdown-block">
          <div class="breakdown-item">
            <span class="label">${i18n.t('cold_case_who')}: ${i18n.formatLabel(ccAcc.suspect)}</span>
            <span class="result ${cc.suspect ? 'correct' : 'wrong'}">
              ${cc.suspect ? `✓ ${i18n.t('correct')} (+50)` : `✗ ${i18n.t('wrong_dash')} ${i18n.formatLabel(ccSol.culprit)}`}
            </span>
          </div>
          ${ratCcWho}
        </div>
        <div class="breakdown-block">
          <div class="breakdown-item">
            <span class="label">${i18n.t('cold_case_cause')}: ${i18n.formatLabel(ccAcc.cause)}</span>
            <span class="result ${cc.cause ? 'correct' : 'wrong'}">
              ${cc.cause ? `✓ ${i18n.t('correct')} (+25)` : `✗ ${i18n.t('wrong_dash')} ${i18n.formatLabel(ccSol.cause)}`}
            </span>
          </div>
          ${ratCcCause}
        </div>
        <div class="breakdown-block">
          <div class="breakdown-item">
            <span class="label">${i18n.t('cold_case_coverup')}: ${i18n.formatLabel(ccAcc.coverup)}</span>
            <span class="result ${cc.coverup ? 'correct' : 'wrong'}">
              ${cc.coverup ? `✓ ${i18n.t('correct')} (+25)` : `✗ ${i18n.t('wrong_dash')} ${i18n.formatLabel(ccSol.coverup)}`}
            </span>
          </div>
          ${ratCcCover}
        </div>
      `;
    }

    if (score.secrets !== undefined) {
      const secretsTotal = score.secretsMax || 10;
      breakdownHtml += `
        <h3 style="margin-top:1.5rem">${i18n.t('secrets_breakdown')}</h3>
        <div class="breakdown-item">
          <span class="label">${i18n.t('secrets_discovered')}: ${score.secrets} / ${secretsTotal}</span>
          <span class="result ${score.secrets === secretsTotal ? 'correct' : score.secrets > 0 ? 'partial' : 'wrong'}">
            +${score.secrets * 10}
          </span>
        </div>
      `;
    }

    breakdownEl.innerHTML = breakdownHtml;
  }

  function formatLabel(str) {
    if (!str) return '';
    return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  return {
    init,
    showScreen,
    renderScenarioCards,
    setupThemeSelector,
    setupModeSelector,
    setupCoopControls,
    renderIntro,
    renderSuspects,
    renderSuspectsForPhase,
    renderMurderEvent,
    showDialogue,
    renderDialogueNode,
    showDialogueResponse,
    returnToQuestions,
    hasRemainingQuestions: (suspect) => _countUnaskedQuestions(suspect) > 0,
    allPlayableSuspectsFullyInterviewed,
    setupNotebook,
    updateNotebook,
    showSecretToast,
    renderReveal,
    formatLabel,
    setOnDialogueClose,
    setScenarioImages,
    showNewLeadToast
  };
})();
