/* ============================================
   ACCUSATION — Sequential flow; correctness at reveal only
   (multi-select + single-choice steps; cold case same pattern)
   ============================================ */

const Accusation = (() => {
  const MAIN_POINTS = {
    motiveSuspects: 10,
    opportunitySuspects: 10,
    method: 20,
    culprit: 40,
    motive: 20
  };

  const CC_POINTS = { suspect: 50, cause: 25, coverup: 25 };

  /** Partial credit: proportional hits on canon, minus penalty per false positive. */
  const MULTI_PICK_FALSE_POSITIVE_PENALTY = 2;

  let scenario = null;
  let mainSteps = [];
  let coldCaseSteps = [];
  let mainResults = {};
  let coldCaseResults = {};
  let currentStepIndex = 0;
  let onCompleteCallback = null;
  let isColdCase = false;

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function normalizeIdSet(ids) {
    return [...new Set((ids || []).filter(Boolean))].sort();
  }

  function setsEqual(a, b) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => v === b[i]);
  }

  /**
   * @param {string[]} pickedIds
   * @param {string[]} canonIds
   * @param {number} maxPoints
   * @returns {{ max: number, points: number, perfect: boolean, hitIds: string[], missIds: string[], extraIds: string[] }}
   */
  function gradeMultiPick(pickedIds, canonIds, maxPoints) {
    const canonS = normalizeIdSet(canonIds);
    const pickedS = normalizeIdSet(pickedIds);
    const pickedSet = new Set(pickedS);
    const canonSet = new Set(canonS);

    if (canonS.length === 0) {
      return {
        max: maxPoints,
        points: pickedS.length === 0 ? maxPoints : 0,
        perfect: pickedS.length === 0,
        hitIds: [],
        missIds: [],
        extraIds: pickedS
      };
    }

    const hitIds = canonS.filter(id => pickedSet.has(id));
    const missIds = canonS.filter(id => !pickedSet.has(id));
    const extraIds = pickedS.filter(id => !canonSet.has(id));
    const perfect = setsEqual(pickedS, canonS);

    const base = Math.round((maxPoints * hitIds.length) / canonS.length);
    const points = Math.max(0, base - MULTI_PICK_FALSE_POSITIVE_PENALTY * extraIds.length);

    return {
      max: maxPoints,
      points,
      perfect,
      hitIds,
      missIds,
      extraIds
    };
  }

  function buildMainSteps(sc) {
    const liveSuspects = sc.suspects.filter(s => !s.dies_at_event);
    const victimName = sc.victim?.name || 'the victim';
    const customSteps = sc.accusation_steps;
    const profile = sc.solution?.accusation_profile;

    const suspectOptions = [...liveSuspects].sort((x, y) => x.name.localeCompare(y.name)).map(s => ({
      value: s.id,
      label: s.name
    }));

    const steps = [];

    if (profile) {
      steps.push({
        key: 'motiveSuspects',
        type: 'multi',
        question: customSteps?.motive_suspects || i18n.t('acc_step_motive_suspects', { victim: victimName }),
        options: suspectOptions,
        correctSet: normalizeIdSet(profile.had_motive_vs_meredith || []),
        formatLabel: false
      });
      steps.push({
        key: 'opportunitySuspects',
        type: 'multi',
        question: customSteps?.opportunity || i18n.t('acc_step_opportunity'),
        options: suspectOptions,
        correctSet: normalizeIdSet(profile.had_opportunity || []),
        formatLabel: false
      });
    }

    steps.push(
      {
        key: 'method',
        type: 'single',
        question: customSteps?.method || `How did ${victimName} die?`,
        options: shuffle(extractMethods(sc)),
        correct: sc.solution.method,
        formatLabel: true
      },
      {
        key: 'culprit',
        type: 'single',
        question: customSteps?.culprit || `Who killed ${victimName}?`,
        options: shuffle(liveSuspects).map(s => ({ value: s.id, label: s.name })),
        correct: sc.solution.culprit,
        formatLabel: false
      },
      {
        key: 'motive',
        type: 'single',
        question: customSteps?.motive || 'What was the motive?',
        options: shuffle(extractMotives(sc)),
        correct: sc.solution.motive,
        formatLabel: true
      }
    );

    return steps;
  }

  function buildColdCaseSteps(sc) {
    const opts = sc.cold_case_accusation_options || {};
    const ccVictimName = sc.cold_case_victim?.name || 'the victim';
    const customSteps = sc.cold_case_accusation_steps;

    return [
      {
        key: 'cause',
        type: 'single',
        question: customSteps?.cause || `How did ${ccVictimName} really die?`,
        options: shuffle(opts.causes || []),
        correct: sc.cold_case_solution.cause,
        formatLabel: true
      },
      {
        key: 'suspect',
        type: 'single',
        question: customSteps?.who || `Who is responsible for ${ccVictimName}'s death?`,
        options: shuffle(opts.suspects || []),
        correct: sc.cold_case_solution.culprit,
        formatLabel: true
      },
      {
        key: 'coverup',
        type: 'single',
        question: customSteps?.coverup || 'How was it covered up?',
        options: shuffle(opts.coverups || []),
        correct: sc.cold_case_solution.coverup,
        formatLabel: true
      }
    ];
  }

  function extractMotives(sc) {
    return sc.accusation_options?.motives || ['greed', 'revenge', 'jealousy', 'self_preservation', 'passion'];
  }

  function extractMethods(sc) {
    return sc.accusation_options?.methods || ['poison', 'stabbing', 'blunt_force', 'strangulation', 'gunshot'];
  }

  function init(currentScenario, onComplete) {
    scenario = currentScenario;
    isColdCase = false;
    mainSteps = buildMainSteps(scenario);
    mainResults = {};
    currentStepIndex = 0;
    onCompleteCallback = onComplete;
    renderStep('accusation-step-container', mainSteps);
  }

  function initColdCase(currentScenario, onComplete) {
    scenario = currentScenario;
    isColdCase = true;
    coldCaseSteps = buildColdCaseSteps(scenario);
    coldCaseResults = {};
    currentStepIndex = 0;
    onCompleteCallback = onComplete;

    const victimDesc = document.getElementById('cold-case-victim-desc');
    if (scenario.cold_case_victim) {
      victimDesc.textContent = `${scenario.cold_case_victim.name}: ${scenario.cold_case_victim.description}`;
    }

    renderStep('cold-case-step-container', coldCaseSteps);
  }

  function formatMultiAnswerLabel(step, ids) {
    const list = normalizeIdSet(ids);
    return list.map(id => {
      const opt = step.options.find(o => o.value === id);
      return opt ? opt.label : id;
    }).join(', ') || `(${i18n.t('acc_none_selected')})`;
  }

  function renderCompletedStep(container, step, result) {
    const div = document.createElement('div');
    div.className = 'accusation-step completed';
    let answerText;
    if (step.type === 'multi') {
      answerText = formatMultiAnswerLabel(step, result.answer);
    } else {
      answerText = getOptionLabel(step, result.answer);
    }
    div.innerHTML = `
      <div class="step-question completed-question">${step.question}</div>
      <div class="step-answer step-answer-neutral">
        <span class="step-answer-label">${i18n.t('acc_your_choice')}</span>
        <span class="step-answer-text">${answerText}</span>
      </div>
    `;
    container.appendChild(div);
  }

  function renderStep(containerId, steps) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    const results = isColdCase ? coldCaseResults : mainResults;
    for (let i = 0; i < currentStepIndex; i++) {
      renderCompletedStep(container, steps[i], results[steps[i].key]);
    }

    if (currentStepIndex >= steps.length) {
      if (onCompleteCallback) onCompleteCallback();
      return;
    }

    const step = steps[currentStepIndex];

    const stepDiv = document.createElement('div');
    stepDiv.className = 'accusation-step active';
    stepDiv.id = 'active-step';

    const questionEl = document.createElement('div');
    questionEl.className = 'step-question';
    questionEl.textContent = step.question;
    stepDiv.appendChild(questionEl);

    const optionsEl = document.createElement('div');
    optionsEl.className = step.type === 'multi' ? 'accusation-options accusation-options-multi' : 'accusation-options';
    optionsEl.id = 'step-options';

    if (step.type === 'multi') {
      step.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'accusation-option accusation-option-multi';
        btn.textContent = opt.label;
        btn.dataset.value = opt.value;
        btn.addEventListener('click', () => {
          btn.classList.toggle('selected');
        });
        optionsEl.appendChild(btn);
      });

      const actions = document.createElement('div');
      actions.className = 'accusation-step-actions';
      const continueBtn = document.createElement('button');
      continueBtn.type = 'button';
      continueBtn.className = 'btn btn-primary';
      continueBtn.textContent = i18n.t('acc_continue');
      continueBtn.addEventListener('click', () => {
        const selected = [...optionsEl.querySelectorAll('.accusation-option-multi.selected')].map(b => b.dataset.value);
        const norm = normalizeIdSet(selected);
        const correct = setsEqual(norm, step.correctSet);
        results[step.key] = { answer: norm, correct };
        currentStepIndex++;
        renderStep(containerId, steps);
      });
      actions.appendChild(continueBtn);
      stepDiv.appendChild(optionsEl);
      stepDiv.appendChild(actions);
    } else {
      step.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'accusation-option';
        const value = typeof opt === 'object' ? opt.value : opt;
        const label = typeof opt === 'object' ? opt.label : (step.formatLabel ? i18n.formatLabel(opt) : opt);
        btn.textContent = label;
        btn.dataset.value = value;
        btn.addEventListener('click', () => {
          const isCorrect = value === step.correct;
          results[step.key] = { answer: value, correct: isCorrect };
          optionsEl.querySelectorAll('.accusation-option').forEach(b => { b.disabled = true; });
          setTimeout(() => {
            currentStepIndex++;
            renderStep(containerId, steps);
          }, 350);
        });
        optionsEl.appendChild(btn);
      });
      stepDiv.appendChild(optionsEl);
    }

    container.appendChild(stepDiv);
    requestAnimationFrame(() => stepDiv.classList.add('step-visible'));
  }

  function getOptionLabel(step, value) {
    if (value == null || value === '') return '';
    if (!step.formatLabel) {
      const opt = step.options.find(o => (typeof o === 'object' ? o.value : o) === value);
      return typeof opt === 'object' ? opt.label : (i18n.formatLabel(value) || value);
    }
    return i18n.formatLabel(value) || value;
  }

  function getSelection() {
    return {
      hadMotiveVsMeredith: mainResults.motiveSuspects?.answer || [],
      hadOpportunity: mainResults.opportunitySuspects?.answer || [],
      culprit: mainResults.culprit?.answer || null,
      motive: mainResults.motive?.answer || null,
      method: mainResults.method?.answer || null
    };
  }

  function getColdCaseSelection() {
    return {
      suspect: coldCaseResults.suspect?.answer || null,
      cause: coldCaseResults.cause?.answer || null,
      coverup: coldCaseResults.coverup?.answer || null
    };
  }

  function score() {
    const profile = scenario?.solution?.accusation_profile;
    let motiveSuspectsGrade = null;
    let opportunitySuspectsGrade = null;
    let mPts = 0;
    let oPts = 0;

    if (profile && mainResults.motiveSuspects) {
      motiveSuspectsGrade = gradeMultiPick(
        mainResults.motiveSuspects.answer,
        profile.had_motive_vs_meredith || [],
        MAIN_POINTS.motiveSuspects
      );
      mPts = motiveSuspectsGrade.points;
    }

    if (profile && mainResults.opportunitySuspects) {
      opportunitySuspectsGrade = gradeMultiPick(
        mainResults.opportunitySuspects.answer,
        profile.had_opportunity || [],
        MAIN_POINTS.opportunitySuspects
      );
      oPts = opportunitySuspectsGrade.points;
    }

    const methodPts = mainResults.method?.correct ? MAIN_POINTS.method : 0;
    const culpritPts = mainResults.culprit?.correct ? MAIN_POINTS.culprit : 0;
    const motivePts = mainResults.motive?.correct ? MAIN_POINTS.motive : 0;

    return {
      motiveSuspects: !!motiveSuspectsGrade?.perfect,
      opportunitySuspects: !!opportunitySuspectsGrade?.perfect,
      motiveSuspectsGrade,
      opportunitySuspectsGrade,
      culprit: !!mainResults.culprit?.correct,
      motive: !!mainResults.motive?.correct,
      method: !!mainResults.method?.correct,
      motiveSuspectsPts: mPts,
      opportunitySuspectsPts: oPts,
      culpritPts,
      motivePts,
      methodPts,
      total: mPts + oPts + methodPts + culpritPts + motivePts
    };
  }

  function scoreColdCase() {
    const suspectPts = coldCaseResults.suspect?.correct ? CC_POINTS.suspect : 0;
    const causePts = coldCaseResults.cause?.correct ? CC_POINTS.cause : 0;
    const coverupPts = coldCaseResults.coverup?.correct ? CC_POINTS.coverup : 0;

    return {
      suspect: !!coldCaseResults.suspect?.correct,
      cause: !!coldCaseResults.cause?.correct,
      coverup: !!coldCaseResults.coverup?.correct,
      total: suspectPts + causePts + coverupPts
    };
  }

  function scoreAll(secretsFound, totalSecrets) {
    const main = score();
    const cc = (Object.keys(coldCaseResults).length > 0) ? scoreColdCase() : null;
    const secretPoints = (secretsFound || []).length * 10;

    let total = main.total;
    let maxScore = 100;

    if (cc) {
      total += cc.total;
      maxScore += 100;
    }
    if (totalSecrets > 0) {
      total += secretPoints;
      maxScore += totalSecrets * 10;
    }

    return {
      ...main,
      coldCase: cc,
      secrets: (secretsFound || []).length,
      secretsMax: totalSecrets,
      total,
      maxScore
    };
  }

  return {
    init,
    initColdCase,
    getSelection,
    getColdCaseSelection,
    score,
    scoreColdCase,
    scoreAll
  };
})();
