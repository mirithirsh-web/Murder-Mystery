/* ============================================
   STATE MANAGER — localStorage, co-op codes,
   detective roles, notebook/clue tracking
   ============================================ */

const StateManager = (() => {
  const STORAGE_PREFIX = 'mm_';

  let state = {
    mode: 'solo',          // 'solo' | 'coop'
    gameCode: null,
    detectiveRole: null,   // 'A' | 'B' | null
    scenarioId: null,
    theme: 'noir',
    clues: [],             // [{ id, text, source, suspectId }]
    askedQuestions: [],     // [{ suspectId, choiceIndex, nodeId }]
    unlockedNodes: [],      // dialogue node IDs unlocked by clue chaining
    accusation: null,       // { hadMotiveVsMeredith?, hadOpportunity?, culprit, motive, method }
    coldCaseAccusation: null,
    score: null,
    secretsFound: [],       // secret IDs discovered
    storyPhase: 'pre_event', // 'pre_event' | 'post_event' (for two-phase scenarios)
    gamePhase: 'title'     // 'title' | 'intro' | 'pre_event' | 'murder_event' | 'investigation' | 'accusation' | 'cold_case_accusation' | 'reveal'
  };

  function _storageKey() {
    if (state.mode === 'coop' && state.gameCode) {
      return `${STORAGE_PREFIX}${state.gameCode}_${state.detectiveRole}`;
    }
    return `${STORAGE_PREFIX}solo_${state.scenarioId}`;
  }

  function save() {
    try {
      localStorage.setItem(_storageKey(), JSON.stringify(state));
    } catch (e) { /* quota exceeded — fail silently */ }
  }

  /** True if the player has done anything that should keep storyPhase / unlocks. */
  function _hasPlayProgress() {
    const clues = state.clues || [];
    const asked = state.askedQuestions || [];
    const secrets = state.secretsFound || [];
    return clues.length > 0 || asked.length > 0 || secrets.length > 0;
  }

  /** Party / pre-murder baseline for this scenario (keeps scenarioId, mode, theme, etc.). */
  function _resetStoryToPreEvent() {
    state.clues = [];
    state.askedQuestions = [];
    state.unlockedNodes = [];
    state.accusation = null;
    state.coldCaseAccusation = null;
    state.score = null;
    state.secretsFound = [];
    state.storyPhase = 'pre_event';
    save();
  }

  function load(scenarioId, mode, gameCode, role) {
    state.scenarioId = scenarioId;
    state.mode = mode;
    state.gameCode = gameCode;
    state.detectiveRole = role;

    const saved = localStorage.getItem(_storageKey());
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.scenarioId === scenarioId) {
          Object.assign(state, parsed);
          if (!_hasPlayProgress()) {
            _resetStoryToPreEvent();
          }
          return true;
        }
      } catch (e) { /* corrupt — start fresh */ }
    }
    _resetStoryToPreEvent();
    return false;
  }

  function reset() {
    state.clues = [];
    state.askedQuestions = [];
    state.unlockedNodes = [];
    state.accusation = null;
    state.coldCaseAccusation = null;
    state.score = null;
    state.secretsFound = [];
    state.storyPhase = 'pre_event';
    state.gamePhase = 'title';
    save();
  }

  function hasSavedProgress() {
    return _hasPlayProgress();
  }

  function clearSavedGame() {
    try {
      localStorage.removeItem(_storageKey());
    } catch (e) { /* ignore */ }
    reset();
  }

  // ---- Game code generation (co-op) ----

  function generateGameCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  // ---- Clue tracking ----

  function addClue(clue) {
    if (!clue || state.clues.some(c => c.id === clue.id)) return false;
    state.clues.push(clue);
    save();
    return true;
  }

  function hasClue(clueId) {
    return state.clues.some(c => c.id === clueId);
  }

  /** Single id or AND of ids (array). Missing/null means satisfied. */
  function satisfiesRequiresClue(requiresClue) {
    if (requiresClue == null) return true;
    const ids = Array.isArray(requiresClue) ? requiresClue : [requiresClue];
    return ids.every(id => hasClue(id));
  }

  /** At least one id present. Missing/null/empty means satisfied (no extra OR gate). */
  function satisfiesRequiresClueAny(requiresClueAny) {
    if (requiresClueAny == null) return true;
    const ids = Array.isArray(requiresClueAny) ? requiresClueAny : [requiresClueAny];
    if (ids.length === 0) return true;
    return ids.some(id => hasClue(id));
  }

  /**
   * Post-murder only: true if the player picked at least one dialogue option for this
   * suspect in a node other than `initial` (i.e. post_initial or an unlocked follow-up).
   */
  function hasPostEventExchange(suspectId) {
    const prefix = `${suspectId}:`;
    return state.askedQuestions.some(key => {
      if (!key.startsWith(prefix)) return false;
      const nodeId = key.slice(prefix.length).split(':')[0];
      return nodeId !== 'initial';
    });
  }

  /**
   * Optional per-choice gate: requires_post_interviews: ["suspect_a", "suspect_b"]
   * All listed suspects must have a post-event exchange before the choice is shown (post_event only).
   */
  function satisfiesRequiresPostInterviews(requiresPostInterviews) {
    if (!requiresPostInterviews || requiresPostInterviews.length === 0) return true;
    if (getStoryPhase() !== 'post_event') return true;
    return requiresPostInterviews.every(id => hasPostEventExchange(id));
  }

  // ---- Question tracking ----

  function markQuestionAsked(suspectId, nodeId, choiceIndex) {
    const key = `${suspectId}:${nodeId}:${choiceIndex}`;
    if (!state.askedQuestions.includes(key)) {
      state.askedQuestions.push(key);
      save();
    }
  }

  function wasQuestionAsked(suspectId, nodeId, choiceIndex) {
    return state.askedQuestions.includes(`${suspectId}:${nodeId}:${choiceIndex}`);
  }

  // ---- Unlock tracking (clue chaining) ----

  function unlockNode(nodeId) {
    if (!state.unlockedNodes.includes(nodeId)) {
      state.unlockedNodes.push(nodeId);
      save();
    }
  }

  function isNodeUnlocked(nodeId) {
    return state.unlockedNodes.includes(nodeId);
  }

  // ---- Phase tracking ----

  function setPhase(phase) {
    state.gamePhase = phase;
    save();
  }

  // ---- Story phase (two-phase scenarios) ----

  function setStoryPhase(phase) {
    state.storyPhase = phase;
    save();
  }

  function getStoryPhase() {
    return state.storyPhase || 'pre_event';
  }

  // ---- Secrets ----

  function addSecret(secretId) {
    if (!state.secretsFound) state.secretsFound = [];
    if (state.secretsFound.includes(secretId)) return false;
    state.secretsFound.push(secretId);
    save();
    return true;
  }

  function hasSecret(secretId) {
    return (state.secretsFound || []).includes(secretId);
  }

  function getSecretsFound() {
    return state.secretsFound || [];
  }

  // ---- Accusation ----

  function setAccusation(accusation) {
    state.accusation = accusation;
    save();
  }

  function setColdCaseAccusation(accusation) {
    state.coldCaseAccusation = accusation;
    save();
  }

  function setScore(score) {
    state.score = score;
    save();
  }

  // ---- Public API ----

  return {
    get state() { return state; },
    save,
    load,
    reset,
    hasSavedProgress,
    clearSavedGame,
    generateGameCode,
    addClue,
    hasClue,
    satisfiesRequiresClue,
    satisfiesRequiresClueAny,
    hasPostEventExchange,
    satisfiesRequiresPostInterviews,
    markQuestionAsked,
    wasQuestionAsked,
    unlockNode,
    isNodeUnlocked,
    setPhase,
    setStoryPhase,
    getStoryPhase,
    addSecret,
    hasSecret,
    getSecretsFound,
    setAccusation,
    setColdCaseAccusation,
    setScore
  };
})();
