/* ============================================
   I18N — Lightweight internationalization module
   ============================================ */

const i18n = (() => {
  const STORAGE_KEY = 'mm_lang';

  const strings = {
    en: {
      page_title: 'Murder Mystery Detective',
      page_description: 'An Agatha Christie-style whodunit detective game',
      game_title_1: 'Murder Mystery',
      game_title_2: 'Detective',
      tagline: 'An Agatha Christie-style whodunit',
      select_case: 'Select a Case',
      visual_style: 'Visual Style',
      language: 'Language',
      mode: 'Mode',
      solo: 'Solo Detective',
      two_detectives: 'Two Detectives',
      coop_setup: 'Co-op Setup',
      create_game_code: 'Create Game Code',
      or: 'or',
      enter_game_code: 'Enter game code',
      join: 'Join',
      detective_a: 'Detective A',
      detective_b: 'Detective B',
      begin_investigation: 'Begin Investigation',
      continue_investigation: 'Continue Investigation',
      back_to_cases: 'Back to Case Selection',
      restart_case: 'Restart Case',
      the_victim: 'The Victim',
      estimated_time: 'Estimated time',
      back_to_case_overview: 'Back to case overview',
      notebook: 'Notebook',
      make_accusation: 'Make Accusation',
      accusation_need_all_interviews: 'Talk to every suspect and exhaust their questions first.',
      back_to_suspects: 'Back to suspects',
      ask_another: 'Ask another question',
      no_more_questions: 'End conversation',
      detectives_notebook: "Detective's Notebook",
      detectives_notebook_pre: "Nick's Notepad",
      no_clues: 'No clues gathered yet. Start interviewing suspects.',
      no_clues_pre: 'Nothing noted yet. Mingle and chat with the guests.',
      clues_gathered: 'clues gathered',
      clues_gathered_pre: 'notes',
      accusation_title: 'Make Your Accusation',
      accusation_subtitle: 'Who committed the murder, why, and how?',
      the_culprit: 'The Culprit',
      the_motive: 'The Motive',
      the_method: 'The Method',
      back_to_investigation: 'Back to Investigation',
      submit_accusation: 'Submit Accusation',
      play_another: 'Back to Case Selection',
      suspects_label: 'suspects',
      game_code_label: 'Game Code:',
      share_code: 'Share this code with your partner',
      investigation: 'Investigation',
      mingling: 'The Party',
      detective_investigation: "Detective {role}'s Investigation",
      badge_other: 'Other Detective',
      badge_new_lead: 'New Lead',
      badge_interviewed: 'Interviewed',
      badge_chatted: 'Chatted',
      clue_from: 'From:',
      toast_clue: 'Clue Found:',
      toast_clue_pre: 'Noted:',
      toast_new_lead: 'New lead — talk to {name}',
      result_brilliant: 'Brilliant Deduction!',
      result_partial: 'Partial Deduction',
      result_unsolved: 'Case Unsolved',
      reveal_brilliant_img_1:
        'Night outside the Marsh house: officers escorting Tai Marsh in handcuffs toward a police SUV; warm party light and decorations visible through the window',
      reveal_brilliant_img_2:
        'Rose White inside the Marsh house, stricken, party decorations around her; through the window, police lights and Tai being escorted away',
      reveal_brilliant_img_extra: 'Scene',
      score_breakdown: 'Score Breakdown',
      label_culprit: 'Culprit:',
      label_motive: 'Motive:',
      label_acc_motive_suspects: 'Motive (who wanted Meredith dead):',
      label_acc_opportunity: 'Opportunity:',
      label_method: 'Method:',
      correct: 'Correct',
      wrong_it_was: 'Wrong — it was',
      wrong_dash: 'Wrong —',
      error_load: 'Failed to load scenario. Please try again.',

      proceed_to_toast: 'Proceed to the Toast',
      proceed_need_all_chats: 'Talk to every guest and finish all their topics before the toast.',
      begin_investigation_post: 'Begin Investigation',
      cold_case_title: 'The Cold Case',
      cold_case_who: 'Who Is Responsible?',
      cold_case_cause: 'The Cause of Death',
      cold_case_coverup: 'The Cover-Up',
      submit_cold_case: 'Submit Solution',
      solve_cold_case: 'Solve Cold Case',
      cold_case_breakdown: 'Cold Case Breakdown',
      secrets_discovered: 'Secrets Discovered',
      secrets_label: 'secrets',
      secrets_notebook_hint:
        'Revealed secrets appear inside each character’s section below (expand the row; look for 🔓).',
      secrets_breakdown: 'Secrets Bonus',
      secret_unknown: '???',
      toast_secret: 'Secret Discovered!',
      badge_deceased: 'Deceased',

      cause_accidental_poisoning: 'Accidental Poisoning',
      cause_intentional_poisoning: 'Intentional Poisoning',
      cause_suicide: 'Suicide',
      cause_medical_negligence: 'Medical Negligence',
      cause_drug_interaction: 'Drug Interaction',
      coverup_staged_suicide: 'Staged Suicide',
      coverup_evidence_destroyed: 'Evidence Destroyed',
      coverup_false_testimony: 'False Testimony',
      coverup_bribed_officials: 'Bribed Officials',
      coverup_no_coverup: 'No Cover-Up',
      suspect_rose_white: 'Rose White',
      suspect_unknown_intruder: 'Unknown Intruder',
      suspect_suicide: 'Suicide',
      suspect_natalie_apple: 'Natalie Apple',
      suspect_dr_lili_rock: 'Dr. Lili Rock',
      suspect_leon_rock: 'Leon Rock',

      motive_silencing_witness: 'Silencing a Witness',
      motive_covering_tracks: 'Covering Tracks',
      motive_crime_of_passion: 'Crime of Passion',
      method_pressure_points: 'Pressure Points',
      method_drug_overdose: 'Drug Overdose',

      motive_revenge: 'Revenge',
      motive_justice: 'Justice',
      motive_hired_killer: 'Hired Killer',
      motive_inheritance: 'Inheritance',
      motive_silencing_a_witness: 'Silencing a Witness',
      motive_personal_grudge: 'Personal Grudge',
      motive_greed: 'Greed',
      motive_jealousy: 'Jealousy',
      motive_self_preservation: 'Self Preservation',
      motive_passion: 'Passion',

      method_stiletto_knife: 'Stiletto Knife',
      method_letter_opener: 'Letter Opener',
      method_surgical_scalpel: 'Surgical Scalpel',
      method_ice_pick: 'Ice Pick',
      method_penknife: 'Penknife',
      method_poison: 'Poison',
      method_stabbing: 'Stabbing',
      method_blunt_force: 'Blunt Force',
      method_strangulation: 'Strangulation',
      method_gunshot: 'Gunshot',
      method_poison_in_brandy: 'Poison in Brandy',

      acc_step_motive_suspects: 'Who had a reason to want {victim} dead?',
      acc_step_opportunity: 'Who had the opportunity?',
      acc_continue: 'Continue',
      acc_your_choice: 'Your choice:',
      acc_none_selected: 'none selected',
      acc_step_method: 'How did Meredith die?',
      acc_step_culprit: 'Who poisoned the glass?',
      acc_step_motive: 'Why was the drink poisoned?',
      acc_cc_step_cause: 'How did Adam Green really die?',
      acc_cc_step_who: 'Who is responsible?',
      acc_cc_step_coverup: 'How was it covered up?',
      acc_attempts_left: 'attempts remaining',
      acc_correct: 'Correct!',
      acc_wrong: 'Not quite.',
      acc_failed: 'The answer was:',
      acc_correct_was: 'correct answer',

      feedback_why: 'Why',
      feedback_fits: 'Why this fits',
      feedback_review: 'How this scores',
      feedback_got_right: 'What you got right',
      feedback_truth: 'What the evidence supports',
      feedback_your_choice_note: 'About your choice',
      feedback_missing: 'People you did not name',
      feedback_extra: 'Names that do not fit this category',
      feedback_canon_line_default: '{name} belongs here given what you learned in the interviews.',
      feedback_extra_line_default: '{name} does not belong in this category on the evidence you have.',
      feedback_single_correct: 'That lines up with how the evidence resolves the case.',
      feedback_single_wrong_truth: 'The case resolves as: {text}',
      feedback_reveal_hint: 'Read the reveal narrative above for the full resolution.',
      acc_partial_score: 'Partial'
    },

    he: {
      page_title: 'חקירת רצח',
      page_description: 'משחק בלשי בסגנון אגתה כריסטי',
      game_title_1: 'חקירת רצח',
      game_title_2: '',
      tagline: 'משחק בלשי בסגנון אגתה כריסטי',
      select_case: 'בחר תיק חקירה',
      visual_style: 'סגנון ויזואלי',
      language: 'שפה',
      mode: 'מצב משחק',
      solo: 'בלש יחיד',
      two_detectives: 'שני בלשים',
      coop_setup: 'הגדרות שיתוף',
      create_game_code: 'צור קוד משחק',
      or: 'או',
      enter_game_code: 'הזן קוד משחק',
      join: 'הצטרף',
      detective_a: 'בלש א׳',
      detective_b: 'בלש ב׳',
      begin_investigation: 'התחל חקירה',
      continue_investigation: 'המשך חקירה',
      back_to_cases: 'חזרה לבחירת תיק',
      restart_case: 'התחל מחדש',
      the_victim: 'הקורבן',
      estimated_time: 'זמן משוער',
      back_to_case_overview: 'חזרה לסקירת התיק',
      notebook: 'פנקס',
      make_accusation: 'פתור את התעלומה',
      accusation_need_all_interviews: 'דבר עם כל החשודים וסיים את כל השאלות לפני הפתרון.',
      back_to_suspects: 'חזרה לחשודים',
      ask_another: 'שאל שאלה נוספת',
      no_more_questions: 'סיים שיחה',
      detectives_notebook: 'פנקס הבלש',
      detectives_notebook_pre: 'הפנקס של ניק',
      no_clues: 'עדיין לא נאספו רמזים. התחל לחקור חשודים.',
      no_clues_pre: 'עדיין לא רשמת כלום. לכו להתערבב בין האורחים.',
      clues_gathered: 'רמזים נאספו',
      clues_gathered_pre: 'רשימות',
      accusation_title: 'הגש את פתרונך',
      accusation_subtitle: 'מי ביצע את הרצח, מדוע, וכיצד?',
      the_culprit: 'הרוצח',
      the_motive: 'המניע',
      the_method: 'השיטה',
      back_to_investigation: 'חזרה לחקירה',
      submit_accusation: 'הגש פתרון',
      play_another: 'חזרה לבחירת התיק',
      suspects_label: 'חשודים',
      game_code_label: 'קוד משחק:',
      share_code: 'שתף קוד זה עם השותף שלך',
      investigation: 'חקירה',
      mingling: 'מסיבה',
      detective_investigation: 'החקירה של בלש {role}',
      badge_other: 'בלש אחר',
      badge_new_lead: 'כיוון חקירה חדש',
      badge_interviewed: 'נחקר',
      badge_chatted: 'דיברתי',
      clue_from: 'מקור:',
      toast_clue: 'רמז נמצא:',
      toast_clue_pre: 'נרשם:',
      toast_new_lead: 'כיוון חקירה חדש — דבר עם {name}',
      result_brilliant: 'פתרון מושלם!',
      result_partial: 'פתרון חלקי',
      result_unsolved: 'התיק לא נפתר',
      reveal_brilliant_img_1:
        'לילה מחוץ לבית מארש: שוטרים מוליכים את טאי מארש בידיים אזוקות לעבר ניידת; אור חם וקישוטי מסיבה נראים בחלון',
      reveal_brilliant_img_2:
        'רוז וייט בתוך בית מארש, מזועזעת, קישוטי מסיבה סביבה; בחלון נראים אורות משטרה וטאי מובל החוצה',
      reveal_brilliant_img_extra: 'איור',
      score_breakdown: 'פירוט ניקוד',
      label_culprit: 'רוצח:',
      label_motive: 'מניע:',
      label_acc_motive_suspects: 'מניע (מי רצה שמרדית תמות):',
      label_acc_opportunity: 'הזדמנות:',
      label_method: 'שיטה:',
      correct: 'נכון',
      wrong_it_was: 'שגוי — זה היה',
      wrong_dash: 'שגוי —',
      error_load: 'טעינת התרחיש נכשלה. נסה שוב.',

      proceed_to_toast: 'המשך להרמת הכוסית',
      proceed_need_all_chats: 'דבר עם כל האורחים והשלם את כל נושאי השיחה לפני הרמת הכוסית.',
      begin_investigation_post: 'התחל חקירה',
      cold_case_title: 'תיק קר',
      cold_case_who: 'מי אחראי?',
      cold_case_cause: 'סיבת המוות',
      cold_case_coverup: 'הטיוח',
      submit_cold_case: 'הגש פתרון',
      solve_cold_case: 'פתור תיק קר',
      cold_case_breakdown: 'ניקוד התיק הקר',
      secrets_discovered: 'סודות שנחשפו',
      secrets_label: 'סודות',
      secrets_notebook_hint:
        'סודות שנחשפו מופיעים בתוך כרטיסי הדמויות למטה (פתחו את השורה; חפשו 🔓).',
      secrets_breakdown: 'בונוס סודות',
      secret_unknown: '???',
      toast_secret: 'סוד נחשף!',
      badge_deceased: 'נפטר/ה',

      cause_accidental_poisoning: 'הרעלה בשוגג',
      cause_intentional_poisoning: 'הרעלה במתכוון',
      cause_suicide: 'התאבדות',
      cause_medical_negligence: 'רשלנות רפואית',
      cause_drug_interaction: 'אינטראקציה בין תרופות',
      coverup_staged_suicide: 'התאבדות מבויימת',
      coverup_evidence_destroyed: 'ראיות הושמדו',
      coverup_false_testimony: 'עדות שקר',
      coverup_bribed_officials: 'שוחד לגורמים רשמיים',
      coverup_no_coverup: 'ללא טיוח',
      suspect_rose_white: 'רוז וייט',
      suspect_unknown_intruder: 'פורץ לא ידוע',
      suspect_suicide: 'התאבדות',
      suspect_natalie_apple: 'נטלי אפל',
      suspect_dr_lili_rock: 'ד"ר לילי רוק',
      suspect_leon_rock: 'ליאון רוק',

      motive_silencing_witness: 'השתקת עד',
      motive_covering_tracks: 'כיסוי עקבות',
      motive_crime_of_passion: 'פשע מתוך תשוקה',
      method_pressure_points: 'נקודות לחץ',
      method_drug_overdose: 'מנת יתר',

      motive_revenge: 'נקמה',
      motive_justice: 'צדק',
      motive_hired_killer: 'רוצח שכיר',
      motive_inheritance: 'ירושה',
      motive_silencing_a_witness: 'השתקת עד',
      motive_personal_grudge: 'טינה אישית',
      motive_greed: 'חמדנות',
      motive_jealousy: 'קנאה',
      motive_passion: 'תשוקה',

      method_stiletto_knife: 'סכין סטילטו',
      method_letter_opener: 'פותחן מכתבים',
      method_surgical_scalpel: 'אזמל כירורגי',
      method_ice_pick: 'דוקרן קרח',
      method_penknife: 'אולר',
      method_poison: 'רעל',
      method_stabbing: 'דקירה',
      method_blunt_force: 'חבלה קהה',
      method_strangulation: 'חנק',
      method_gunshot: 'ירי',

      acc_step_motive_suspects: 'מי היה לו סיבה לרצות ש{victim} תמות?',
      acc_step_opportunity: 'מי היה לו הזדמנות?',
      acc_continue: 'המשך',
      acc_your_choice: 'הבחירה שלך:',
      acc_none_selected: 'לא נבחר אף אחד',
      acc_step_method: 'איך מרדית מתה?',
      acc_step_culprit: 'מי הרעיל את הכוס?',
      acc_step_motive: 'למה הוכנס רעל לשתייה?',
      acc_cc_step_cause: 'איך אדם גרין באמת מת?',
      acc_cc_step_who: 'מי אחראי?',
      acc_cc_step_coverup: 'איך זה טושטש?',
      acc_attempts_left: 'ניסיונות נותרו',
      acc_correct: '!נכון',
      acc_wrong: 'לא בדיוק.',
      acc_failed: ':התשובה הנכונה',
      acc_correct_was: 'התשובה הנכונה',

      feedback_why: 'למה',
      feedback_fits: 'למה זה מתאים',
      feedback_review: 'איך זה נספר',
      feedback_got_right: 'מה שצדקת בו',
      feedback_truth: 'מה שהראיות תומכות בו',
      feedback_your_choice_note: 'לגבי הבחירה שלך',
      feedback_missing: 'אנשים שלא ציינת',
      feedback_extra: 'שמות שלא מתאימים לקטגוריה הזאת',
      feedback_canon_line_default: '{name} שייך כאן לפי מה שלמדת בחקירות.',
      feedback_extra_line_default: '{name} לא שייך לקטגוריה הזאת לפי הראיות שיש לך.',
      feedback_single_correct: 'זה מתיישב עם איך שהראיות פותרות את התיק.',
      feedback_single_wrong_truth: 'התיק נפתר כך: {text}',
      feedback_reveal_hint: 'קרא את סיפור החשיפה למעלה לפתרון המלא.',
      acc_partial_score: 'חלקי'
    }
  };

  let currentLang = 'en';

  function init() {
    // Production: English only (no title-screen language picker).
    currentLang = 'en';
    _applyDir();
  }

  function setLang(lang) {
    if (!strings[lang]) return;
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    _applyDir();
    applyToDOM();
  }

  function getLang() {
    return currentLang;
  }

  function t(key, replacements) {
    const val = strings[currentLang]?.[key] || strings.en[key] || key;
    if (!replacements) return val;
    return val.replace(/\{(\w+)\}/g, (_, k) => replacements[k] ?? _);
  }

  function formatLabel(str) {
    if (!str) return '';
    const prefixes = ['motive_', 'method_', 'cause_', 'coverup_', 'suspect_'];
    for (const p of prefixes) {
      const key = `${p}${str}`;
      if (strings[currentLang]?.[key]) return strings[currentLang][key];
    }
    return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  function _applyDir() {
    const html = document.documentElement;
    if (currentLang === 'he') {
      html.setAttribute('dir', 'rtl');
      html.setAttribute('lang', 'he');
    } else {
      html.setAttribute('dir', 'ltr');
      html.setAttribute('lang', 'en');
    }
  }

  function applyToDOM() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      el.title = t(el.dataset.i18nTitle);
    });
    document.title = t('page_title');
  }

  function isRTL() {
    return currentLang === 'he';
  }

  return { init, setLang, getLang, t, formatLabel, applyToDOM, isRTL };
})();
