// The words of the stage 1 session. The Arabic is Modern Standard Arabic, not a
// dialect (owner, 2026-10-17) — the same register as the rest of Life's Arabic.
//
// The stage 1 session — "talk it through without saving"
// (KB audits/LIFE_FIRST_SESSION_SPEC_DRAFT_2026-10-17.md §2, §8 stage 1).
//
// Arabic and English only, on purpose: the spec's first reading is in those two
// languages (§8 Q7), and a question about a person's own life, machine-translated
// into ten more, is a worse question. Every other locale reads the English. These
// live apart from the twelve-language dictionaries so a stage that may be
// redesigned after its first reading does not have to be rewritten twelve times.
import type { Locale } from '@/lib/i18n';

export interface SessionCopy {
  entryTitle: string; entryHint: string; entryCta: string;
  introTitle: string; introIs: string; introIsNot: string; introNothingSaved: string; start: string; cancel: string;
  problemQ: string; problemHint: string;
  rolesNote: string;
  whenWhatQ: string; whenWhatHint: string;
  didFollowedQ: string; didFollowedHint: string;
  anotherQ: string; anotherYes: string; anotherSame: string; anotherNone: string;
  secondWhenWhatQ: string; secondDidFollowedQ: string;
  next: string; back: string; skip: string;
  planTitle: string; planIntro: string; planItems: string[]; planNote: string;
  summaryTitle: string;
  toldMe: string; problemLabel: string; timeLabel: string;
  mightExplain: string; mightExplainBody: string;
  dontKnow: string; dontKnowOne: string; dontKnowTwo: string;
  support: string;
  notSaved: string; copy: string; copied: string;
  clearerQ: string; clearerYes: string; clearerSomewhat: string; clearerNo: string; thanks: string;
  finish: string;
  readingTitle: string; readingHint: string; readingFewer: string; readingResult: Record<string, string>;
  readingStarted: string; readingReached: string; readingClearer: string; readingNo: string; readingWeek: string;
}

const en: SessionCopy = {
  entryTitle: 'Understand a problem that keeps happening',
  entryHint:  'A few questions to put it into words. Nothing you write is saved.',
  entryCta:   'Start',

  introTitle: 'Before we start',
  introIs:    'This helps you describe something that keeps happening and that you would like to change — in your own words, step by step.',
  introIsNot: 'It is not a diagnosis, not a judgement of you, and it gives no advice it cannot ground.',
  introNothingSaved: 'Nothing you write here will be saved. When you close this page it is gone.',
  start:  'Start',
  cancel: 'Not now',

  problemQ:    'What keeps happening that you would like to change?',
  problemHint: 'In your own words. One or two sentences is enough — for example: “I leave important things until the last minute.”',

  rolesNote: 'When you mention other people, describe them by their role — “my manager”, “a friend” — rather than by name.',

  whenWhatQ:    'Think of the last time it happened. Roughly when was it, and what was going on — where you were, who was there, any pressure you were under?',
  whenWhatHint: 'Only what feels relevant. “About two weeks ago” is fine.',
  didFollowedQ:    'What did you do, and what happened after?',
  didFollowedHint: 'What you did, and what followed — as it was, not as it should have been.',
  anotherQ:    'Can you think of another time it happened — a different time from that one?',
  anotherYes:  'Yes, a different time',
  anotherSame: 'No — that was the same time',
  anotherNone: 'I can’t remember another',
  secondWhenWhatQ:    'That other time — roughly when, and what was going on?',
  secondDidFollowedQ: 'And that time — what did you do, and what happened after?',

  next: 'Next', back: 'Back', skip: 'Skip',

  planTitle: 'One small step, if you want it',
  planIntro: 'Next time it happens, try to note three things — for yourself, wherever you keep notes:',
  planItems: ['When it was.', 'Where you were, and who was there.', 'What you were waiting for at that moment.'],
  planNote:  'Two descriptions are a start. A few more, noted close to the moment, show more than memory does.',

  summaryTitle: 'What came out of this',
  toldMe:       'What you told me',
  problemLabel: 'The problem',
  timeLabel:    'Time',
  mightExplain:     'What might explain it',
  mightExplainBody: 'This version does not suggest explanations. It only helps you put the problem into words.',
  dontKnow:     'What we don’t know',
  dontKnowOne:  'Why it happens. Nothing here has guessed — one remembered time is not enough to know.',
  dontKnowTwo:  'Why it happens. Nothing here has guessed — two remembered times are not enough to know.',
  support: 'If things feel heavy right now, talk to someone you trust, or to a specialised support service where you live.',
  notSaved: 'Nothing was saved. If you want to keep this, copy it now.',
  copy:   'Copy',
  copied: 'Copied',

  clearerQ:        'Do you see the problem more clearly than before?',
  clearerYes:      'Yes',
  clearerSomewhat: 'Somewhat',
  clearerNo:       'No',
  thanks:          'Thank you.',

  finish: 'Finish',

  readingTitle:   'First session — reading',
  readingHint:    'Counts only, by week. No person and no text is ever stored. Counts under 5 are hidden.',
  readingFewer:   'fewer than 5',
  readingResult:  {
    encouraging:     'Encouraging — ask for the next stage’s approval',
    failure:         'Failure — redesign the session',
    in_between:      'In between — revise the questions and retest with a new group',
    not_enough_data: 'Not enough sessions yet',
  },
  readingStarted: 'Started', readingReached: 'Reached the end', readingClearer: 'Clearer (yes + somewhat)', readingNo: '“No”',
  readingWeek: 'Week of',
};

const ar: SessionCopy = {
  entryTitle: 'افهم مشكلة تتكرر معك',
  entryHint:  'بضعة أسئلة تساعدك على وصفها بكلماتك. لا يُحفظ شيء مما تكتبه.',
  entryCta:   'ابدأ',

  introTitle: 'قبل أن نبدأ',
  introIs:    'تساعدك هذه الجلسة على وصف أمر يتكرر وتريد تغييره — بكلماتك أنت، خطوة بخطوة.',
  introIsNot: 'ليست تشخيصًا، ولا حكمًا عليك، ولا تقدّم نصيحة بلا أساس.',
  introNothingSaved: 'لا يُحفظ شيء مما تكتبه هنا. بمجرد إغلاق الصفحة يزول كل شيء.',
  start:  'ابدأ',
  cancel: 'ليس الآن',

  problemQ:    'ما الأمر الذي يتكرر وتريد تغييره؟',
  problemHint: 'بكلماتك أنت. تكفي جملة أو جملتان — مثلًا: «أؤجّل الأمور المهمة إلى آخر لحظة».',

  rolesNote: 'عندما تذكر شخصًا، صِفه بدوره — «مديري»، «صديقي» — دون ذكر اسمه.',

  whenWhatQ:    'تذكّر آخر مرة حدث فيها ذلك. متى كان تقريبًا، وماذا كان يجري — أين كنت، ومن كان حاضرًا، وهل كنت تحت ضغط؟',
  whenWhatHint: 'ما تراه مهمًا فقط. يكفي أن تقول «منذ أسبوعين تقريبًا».',
  didFollowedQ:    'ماذا فعلت، وماذا حدث بعد ذلك؟',
  didFollowedHint: 'ما فعلته وما تلاه — كما حدث، لا كما كان ينبغي أن يحدث.',
  anotherQ:    'هل تتذكر مرة أخرى حدث فيها ذلك — مرة مختلفة عن هذه؟',
  anotherYes:  'نعم، مرة مختلفة',
  anotherSame: 'لا — كانت المرة نفسها',
  anotherNone: 'لا أتذكر مرة أخرى',
  secondWhenWhatQ:    'تلك المرة الأخرى — متى كانت تقريبًا، وماذا كان يجري؟',
  secondDidFollowedQ: 'وفي تلك المرة — ماذا فعلت، وماذا حدث بعد ذلك؟',

  next: 'التالي', back: 'رجوع', skip: 'تخطٍّ',

  planTitle: 'خطوة صغيرة، إن أردت',
  planIntro: 'في المرة القادمة التي يحدث فيها ذلك، حاول أن تدوّن لنفسك ثلاثة أشياء — في أي مكان تدوّن فيه ملاحظاتك:',
  planItems: ['متى حدث.', 'أين كنت، ومن كان حاضرًا.', 'ما الذي كنت تنتظره في تلك اللحظة.'],
  planNote:  'وصف مرتين بداية. ومرات أخرى قليلة، تُدوَّن قريبًا من وقت حدوثها، توضّح أكثر مما تفعله الذاكرة.',

  summaryTitle: 'ما خرجت به الجلسة',
  toldMe:       'ما أخبرتني به',
  problemLabel: 'المشكلة',
  timeLabel:    'المرة',
  mightExplain:     'ما الذي قد يفسّرها',
  mightExplainBody: 'لا تقترح هذه النسخة تفسيرات. إنها تساعدك فقط على التعبير عن المشكلة بالكلمات.',
  dontKnow:     'ما لا نعرفه',
  dontKnowOne:  'لماذا يحدث ذلك. لم يُخمَّن شيء هنا — مرة واحدة من الذاكرة لا تكفي لنعرف.',
  dontKnowTwo:  'لماذا يحدث ذلك. لم يُخمَّن شيء هنا — مرتان من الذاكرة لا تكفيان لنعرف.',
  support: 'إن شعرت بأن العبء ثقيل عليك الآن، فتحدّث إلى شخص تثق به، أو إلى جهة دعم متخصصة في بلدك.',
  notSaved: 'لم يُحفظ شيء. إن أردت الاحتفاظ بهذا، فانسخه الآن.',
  copy:   'نسخ',
  copied: 'تم النسخ',

  clearerQ:        'هل ترى المشكلة بوضوح أكبر من قبل؟',
  clearerYes:      'نعم',
  clearerSomewhat: 'إلى حدٍّ ما',
  clearerNo:       'لا',
  thanks:          'شكرًا لك.',

  finish: 'إنهاء',

  readingTitle:   'الجلسة الأولى — القراءة',
  readingHint:    'أعداد فقط، حسب الأسبوع. لا يُخزَّن أي شخص ولا أي نص. الأعداد الأقل من 5 مخفية.',
  readingFewer:   'أقل من 5',
  readingResult:  {
    encouraging:     'مشجّعة — اطلب الموافقة على المرحلة الثانية',
    failure:         'فشل — أعد تصميم الجلسة',
    in_between:      'بين الحالتين — عدّل الأسئلة وأعد الاختبار على مجموعة جديدة',
    not_enough_data: 'عدد الجلسات غير كافٍ بعد',
  },
  readingStarted: 'بدأوا', readingReached: 'وصلوا إلى النهاية', readingClearer: 'أوضح (نعم + إلى حدٍّ ما)', readingNo: '«لا»',
  readingWeek: 'أسبوع',
};

export function sessionCopy(locale: Locale): SessionCopy {
  return locale === 'ar' ? ar : en;
}
