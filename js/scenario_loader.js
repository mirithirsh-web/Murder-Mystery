/* ============================================
   SCENARIO LOADER — Fetch & validate JSON
   ============================================ */

const ScenarioLoader = (() => {
  const SCENARIO_MANIFEST = [
    // { id: 'manor_murder',    file: 'scenarios/manor_murder.json',    langs: ['en'] },
    // { id: 'midnight_train',  file: 'scenarios/midnight_train.json',  langs: ['en', 'he'] },
    { id: 'deadly_secrets',  file: 'scenarios/deadly_secrets.json',  langs: ['en'] }
  ];

  const cache = {};

  function _fileForLang(entry) {
    const lang = typeof i18n !== 'undefined' ? i18n.getLang() : 'en';
    if (lang !== 'en' && entry.langs.includes(lang)) {
      return entry.file.replace('.json', `_${lang}.json`);
    }
    return entry.file;
  }

  function _visibleManifest() {
    const lang = typeof i18n !== 'undefined' ? i18n.getLang() : 'en';
    return SCENARIO_MANIFEST.filter(e => e.langs.includes(lang));
  }

  async function loadManifest() {
    const summaries = [];
    for (const entry of _visibleManifest()) {
      try {
        const scenario = await loadScenario(entry.id);
        summaries.push({
          id: scenario.id,
          title: scenario.title,
          setting: scenario.setting,
          suspectCount: scenario.suspects.length,
          availableThemes: scenario.available_themes || ['cozy', 'noir'],
          soloOnly: !!scenario.solo_only
        });
      } catch (e) {
        console.warn(`Failed to load scenario ${entry.id}:`, e);
      }
    }
    return summaries;
  }

  async function loadScenario(id) {
    const lang = typeof i18n !== 'undefined' ? i18n.getLang() : 'en';
    const cacheKey = `${id}_${lang}`;
    if (cache[cacheKey]) return cache[cacheKey];

    const entry = SCENARIO_MANIFEST.find(s => s.id === id);
    if (!entry) throw new Error(`Unknown scenario: ${id}`);

    const file = _fileForLang(entry);
    const resp = await fetch(file);
    if (!resp.ok) throw new Error(`HTTP ${resp.status} loading ${file}`);

    const scenario = await resp.json();
    validate(scenario);
    cache[cacheKey] = scenario;
    return scenario;
  }

  function clearCache() {
    for (const key of Object.keys(cache)) {
      delete cache[key];
    }
  }

  function validate(scenario) {
    const required = ['id', 'title', 'setting', 'victim', 'intro_narrative', 'suspects', 'solution'];
    for (const field of required) {
      if (!scenario[field]) throw new Error(`Scenario missing required field: ${field}`);
    }
    if (!Array.isArray(scenario.suspects) || scenario.suspects.length < 2) {
      throw new Error('Scenario must have at least 2 suspects');
    }
    const sol = scenario.solution;
    if (!sol.culprit || !sol.motive || !sol.method || !sol.reveal_narrative) {
      throw new Error('Solution missing required fields');
    }
  }

  function getSuspectsForDetective(scenario, role) {
    if (!role) return scenario.suspects;
    return scenario.suspects.filter(s => s.detective_assignment === role);
  }

  function getAllSuspectNames(scenario) {
    return scenario.suspects.map(s => ({ id: s.id, name: s.name }));
  }

  return {
    loadManifest,
    loadScenario,
    clearCache,
    getSuspectsForDetective,
    getAllSuspectNames
  };
})();
