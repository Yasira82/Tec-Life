// The words of the stage 1 session — "talk it through without saving"
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
  entryTitle: 'افهم مشكلة بتتكرر معاك',
  entryHint:  'كام سؤال يساعدوك توصفها بكلامك. مفيش حاجة من اللي هتكتبه بتتحفظ.',
  entryCta:   'ابدأ',

  introTitle: 'قبل ما نبدأ',
  introIs:    'دي بتساعدك توصف حاجة بتتكرر وعايز تغيّرها — بكلامك إنت، خطوة خطوة.',
  introIsNot: 'دي مش تشخيص، ومش حكم عليك، ومش هتديك نصيحة مالهاش أساس.',
  introNothingSaved: 'مفيش حاجة من اللي هتكتبه هنا هتتحفظ. أول ما تقفل الصفحة، كله بيروح.',
  start:  'ابدأ',
  cancel: 'مش دلوقتي',

  problemQ:    'إيه الحاجة اللي بتتكرر وعايز تغيّرها؟',
  problemHint: 'بكلامك إنت. جملة أو اتنين كفاية — مثلًا: «بأجّل الحاجات المهمة لآخر لحظة».',

  rolesNote: 'لما تذكر حد، اوصفه بدوره — «مديري»، «صاحبي» — من غير اسمه.',

  whenWhatQ:    'افتكر آخر مرة حصلت. كان إمتى تقريبًا، وإيه اللي كان بيحصل — كنت فين، مين كان موجود، وهل كان فيه ضغط عليك؟',
  whenWhatHint: 'اللي تحس إنه مهم بس. «من حوالي أسبوعين» تمام.',
  didFollowedQ:    'عملت إيه، وإيه اللي حصل بعدها؟',
  didFollowedHint: 'اللي عملته واللي جه بعده — زي ما حصل، مش زي ما المفروض يحصل.',
  anotherQ:    'فاكر مرة تانية حصلت فيها — مرة مختلفة عن دي؟',
  anotherYes:  'أيوه، مرة مختلفة',
  anotherSame: 'لأ — دي كانت نفس المرة',
  anotherNone: 'مش فاكر مرة تانية',
  secondWhenWhatQ:    'المرة التانية دي — كانت إمتى تقريبًا، وإيه اللي كان بيحصل؟',
  secondDidFollowedQ: 'والمرة دي — عملت إيه، وإيه اللي حصل بعدها؟',

  next: 'التالي', back: 'رجوع', skip: 'تخطّي',

  planTitle: 'خطوة صغيرة، لو حابب',
  planIntro: 'المرة الجاية لما تحصل، حاول تكتب لنفسك تلات حاجات — في أي مكان بتكتب فيه ملاحظاتك:',
  planItems: ['كانت إمتى.', 'كنت فين، ومين كان موجود.', 'كنت مستني إيه في اللحظة دي.'],
  planNote:  'وصف مرتين بداية. كام مرة كمان، مكتوبين قريب من اللحظة، بيوضحوا أكتر من الذاكرة.',

  summaryTitle: 'اللي طلع من الجلسة',
  toldMe:       'اللي قلتهولي',
  problemLabel: 'المشكلة',
  timeLabel:    'مرة',
  mightExplain:     'إيه اللي ممكن يفسرها',
  mightExplainBody: 'النسخة دي مش بتقترح تفسيرات. هي بس بتساعدك تحط المشكلة في كلام.',
  dontKnow:     'اللي منعرفوش',
  dontKnowOne:  'ليه بتحصل. محدش خمّن هنا — مرة واحدة من الذاكرة مش كفاية علشان نعرف.',
  dontKnowTwo:  'ليه بتحصل. محدش خمّن هنا — مرتين من الذاكرة مش كفاية علشان نعرف.',
  support: 'لو حاسس إن الحمل تقيل عليك دلوقتي، كلّم حد بتثق فيه، أو جهة دعم متخصصة في بلدك.',
  notSaved: 'مفيش حاجة اتحفظت. لو عايز تحتفظ بده، انسخه دلوقتي.',
  copy:   'انسخ',
  copied: 'اتنسخ',

  clearerQ:        'شايف المشكلة أوضح من الأول؟',
  clearerYes:      'أيوه',
  clearerSomewhat: 'شوية',
  clearerNo:       'لأ',
  thanks:          'شكرًا.',

  finish: 'إنهاء',

  readingTitle:   'الجلسة الأولى — القراءة',
  readingHint:    'أعداد بس، بالأسبوع. مفيش شخص ولا نص بيتخزن أبدًا. الأعداد الأقل من 5 مخفية.',
  readingFewer:   'أقل من 5',
  readingResult:  {
    encouraging:     'مشجّعة — اطلب موافقة المرحلة التانية',
    failure:         'فشل — أعد تصميم الجلسة',
    in_between:      'بين الاتنين — عدّل الأسئلة وأعد الاختبار على مجموعة جديدة',
    not_enough_data: 'لسه الجلسات مش كفاية',
  },
  readingStarted: 'بدأوا', readingReached: 'وصلوا للآخر', readingClearer: 'أوضح (أيوه + شوية)', readingNo: '«لأ»',
  readingWeek: 'أسبوع',
};

export function sessionCopy(locale: Locale): SessionCopy {
  return locale === 'ar' ? ar : en;
}
