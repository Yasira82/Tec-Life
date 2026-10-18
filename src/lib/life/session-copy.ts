// The words of Life's conversation (KB audits/LIFE_FIRST_SESSION_SPEC_DRAFT_2026-10-17.md
// §2, §5, §8). The Arabic is Modern Standard Arabic, not a dialect (owner, 2026-10-17) —
// the same register as the rest of Life's Arabic.
//
// Arabic and English only: the first reading is in those two languages (§8 Q7), and a
// conversation about a person's own life, machine-translated into ten more, is a worse
// conversation. Every other locale reads the English.
import type { Locale } from '@/lib/i18n';

export interface SessionCopy {
  entryTitle: string; entryHint: string; entryCta: string;
  introTitle: string; introIs: string; introIsNot: string; introAi: string; introNothingSaved: string;
  agree: string; cancel: string;
  rolesNote: string; opener: string;
  placeholder: string; send: string; thinking: string; endChat: string;
  you: string; life: string;
  errUnavailable: string; errBusy: string; errLimit: string; errCapacity: string;
  endTitle: string; support: string;
  notSaved: string; copy: string; copied: string;
  clearerQ: string; clearerYes: string; clearerSomewhat: string; clearerNo: string; thanks: string;
  finish: string;
  memoryNote: string;
  lastStepQ: string; outDone: string; outPartly: string; outNotYet: string; outThanks: string;
  keepTitle: string; endAndKeep: string; keepHint: string; keepWrite: string; keepWriting: string; keepSummaryFailed: string;
  fProblem: string; fUnderstanding: string; fStep: string;
  keepConsent: string; keepSave: string; keepSaveOn: string; keepSaved: string; keepFailed: string;
  fullOn: string; fullOff: string; fullTurnOn: string; fullTurnOnNote: string; fullSaveFailed: string; fullKeptEnd: string;
  cTitle: string; cHint: string; cEmpty: string; cContinue: string; cOpenFailed: string; cMessages: string; cUnreadable: string; cDownload: string; cLoading: string;
  jTitle: string; jHint: string; jEmpty: string; jOff: string; jStep: string;
  jDelete: string; jConfirm: string; jDownload: string; jMore: string; jLess: string;
  readingTitle: string; readingHint: string; readingFewer: string; readingResult: Record<string, string>;
  readingStarted: string; readingReached: string; readingClearer: string; readingNo: string; readingWeek: string;
}

const en: SessionCopy = {
  entryTitle: 'Talk through a problem that keeps happening',
  entryHint:  'A conversation to help you understand it. Only a summary you confirm is ever kept.',
  entryCta:   'Start',

  introTitle: 'Before we start',
  introIs:    'You will talk with Life about something that keeps happening and that you would like to change. It asks, and it listens — one step at a time.',
  introIsNot: 'It is not a diagnosis, not a judgement of you, and it gives no advice it cannot ground.',
  introAi:    'To reply, what you write is sent to an AI model (Groq). We do not keep it, and Groq’s retention is switched off for us. Numbers, emails and links are removed before it is sent — but that does not make your words fully anonymous.',
  introNothingSaved: 'The conversation itself is not saved — when you close this page it is gone. At the end you may keep a short summary that you read and confirm, only if you choose to.',
  agree:  'I agree — start',
  cancel: 'Not now',

  rolesNote: 'When you mention other people, describe them by their role — “my manager”, “a friend” — rather than by name.',
  opener:    'What keeps happening that you would like to change? Tell me in your own words — for example: “I leave important things until the last minute.”',

  placeholder: 'Write here…',
  send:        'Send',
  thinking:    'Life is writing…',
  endChat:     'End the conversation',
  you:  'You',
  life: 'Life',
  errUnavailable: 'Life could not reply right now. Try again in a moment.',
  errBusy:        'Many messages in a short time — wait a minute, then try again.',
  errLimit:       'This conversation has reached its length. End it and keep a short summary — Life will continue from it next time.',
  errCapacity:    'Life has reached its limit for now. Try again later — if today’s limit is used up, tomorrow. What you wrote is still in the box.',

  endTitle: 'The conversation has ended',
  support:  'If things feel heavy right now, talk to someone you trust, or to a specialised support service where you live.',
  notSaved: 'The conversation was not saved. If you want its full text, copy it now.',
  copy:   'Copy the conversation',
  copied: 'Copied',

  clearerQ:        'Do you see the problem more clearly than before?',
  clearerYes:      'Yes',
  clearerSomewhat: 'Somewhat',
  clearerNo:       'No',
  thanks:          'Thank you.',

  finish: 'Finish',

  memoryNote: 'Life will read your three most recent kept summaries so it can continue from where you were. They are sent to Groq with your messages.',
  lastStepQ:  'Last time you chose a small step: “{step}”. Did you try it?',
  outDone: 'Yes', outPartly: 'Partly', outNotYet: 'Not yet',
  outThanks: 'Noted. Life will continue from there.',

  keepTitle: 'Keep a summary in My journey',
  endAndKeep: 'End and write the summary',
  keepHint:  'Life writes a short summary of this conversation. Read it, correct it, and keep it only if it is right. Only the summary is kept — never the conversation.',
  keepWrite:   'Write the summary',
  keepWriting: 'Writing the summary…',
  keepSummaryFailed: 'Life could not write the summary right now. You can write it yourself below.',
  fProblem:       'What keeps happening',
  fUnderstanding: 'What became clearer',
  fStep:          'The small step you chose (optional)',
  keepConsent: 'Keeping turns on “Keep my journey” in Privacy. You can turn it off there at any time — turning it off deletes everything kept.',
  keepSave:   'Keep this summary',
  keepSaveOn: 'Turn on and keep',
  keepSaved:  'Kept in My journey.',
  keepFailed: 'It could not be kept right now. Try again in a moment.',

  fullOn:  'Your full conversation is kept, encrypted, in My journey — you can continue it later or delete it.',
  fullOff: 'Want to keep the whole conversation, so you can come back to it?',
  fullTurnOn: 'Keep my full conversations',
  fullTurnOnNote: 'This turns on “Keep my full conversations” in Privacy. The words are encrypted before they are stored. Turning it off deletes every kept conversation.',
  fullSaveFailed: 'The last message could not be kept. The conversation goes on; it will be kept with the next one.',
  fullKeptEnd: 'This conversation is kept in My journey. You can continue it or delete it there.',
  cTitle: 'My conversations',
  cHint: 'The full conversations you chose to keep, encrypted. Only you can see them.',
  cEmpty: 'No conversation kept yet.',
  cContinue: 'Continue',
  cOpenFailed: 'It could not be opened right now. Try again in a moment.',
  cMessages: '{n} messages',
  cUnreadable: 'This conversation cannot be read.',
  cDownload: 'Download conversations (JSON)',
  cLoading: 'Opening…',

  jTitle:    'My journey',
  jHint:     'The summaries you chose to keep, newest first. Only you can see them.',
  jEmpty:    'Nothing kept yet. At the end of a conversation you can keep a summary of it.',
  jOff:      'Keeping is off — nothing new is kept.',
  jStep:     'Step',
  jDelete:   'Delete',
  jConfirm:  'Tap again to delete',
  jDownload: 'Download (JSON)',
  jMore:     'Show all',
  jLess:     'Show less',

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
  entryTitle: 'تحدّث عن مشكلة تتكرر معك',
  entryHint:  'محادثة تساعدك على فهمها. لا يُحفظ منها إلا خلاصة تؤكدها أنت.',
  entryCta:   'ابدأ',

  introTitle: 'قبل أن نبدأ',
  introIs:    'ستتحدث مع Life عن أمر يتكرر وتريد تغييره. يسألك ويستمع إليك — خطوة بخطوة.',
  introIsNot: 'ليست تشخيصًا، ولا حكمًا عليك، ولا تقدّم نصيحة بلا أساس.',
  introAi:    'لكي يرد عليك، يُرسَل ما تكتبه إلى نموذج ذكاء اصطناعي (Groq). لا نحتفظ به، وقد أُوقف احتفاظ Groq به لدينا. تُحذف الأرقام والبريد والروابط قبل الإرسال — لكن ذلك لا يجعل كلامك مجهول الهوية تمامًا.',
  introNothingSaved: 'المحادثة نفسها لا تُحفظ — بمجرد إغلاق الصفحة تزول. في النهاية يمكنك أن تحتفظ بخلاصة قصيرة تقرؤها وتؤكدها، إن اخترت ذلك فقط.',
  agree:  'موافق — ابدأ',
  cancel: 'ليس الآن',

  rolesNote: 'عندما تذكر شخصًا، صِفه بدوره — «مديري»، «صديقي» — دون ذكر اسمه.',
  opener:    'ما الأمر الذي يتكرر وتريد تغييره؟ احكِ لي بكلماتك — مثلًا: «أؤجّل الأمور المهمة إلى آخر لحظة».',

  placeholder: 'اكتب هنا…',
  send:        'إرسال',
  thinking:    'Life يكتب…',
  endChat:     'إنهاء المحادثة',
  you:  'أنت',
  life: 'Life',
  errUnavailable: 'تعذّر على Life الرد الآن. حاول مرة أخرى بعد قليل.',
  errBusy:        'رسائل كثيرة في وقت قصير — انتظر دقيقة ثم حاول.',
  errLimit:       'بلغت المحادثة حدّها. أنهِها واحتفظ بخلاصة قصيرة لها — وسيكمل Life منها في المرة القادمة.',
  errCapacity:    'بلغ Life حدّه الآن. حاول لاحقًا — وإن نفد حدّ اليوم، فغدًا. ما كتبته ما زال في المربع.',

  endTitle: 'انتهت المحادثة',
  support:  'إن شعرت بأن العبء ثقيل عليك الآن، فتحدّث إلى شخص تثق به، أو إلى جهة دعم متخصصة في بلدك.',
  notSaved: 'لم تُحفظ المحادثة. إن أردت نصّها كاملًا، فانسخه الآن.',
  copy:   'نسخ المحادثة',
  copied: 'تم النسخ',

  clearerQ:        'هل ترى المشكلة بوضوح أكبر من قبل؟',
  clearerYes:      'نعم',
  clearerSomewhat: 'إلى حدٍّ ما',
  clearerNo:       'لا',
  thanks:          'شكرًا لك.',

  finish: 'إنهاء',

  memoryNote: 'سيقرأ Life آخر ثلاث خلاصات احتفظت بها، ليكمل من حيث كنت. تُرسَل إلى Groq مع رسائلك.',
  lastStepQ:  'في المرة السابقة اخترت خطوة صغيرة: «{step}». هل جرّبتها؟',
  outDone: 'نعم', outPartly: 'جزئيًا', outNotYet: 'ليس بعد',
  outThanks: 'سُجِّل ذلك. سيكمل Life من هنا.',

  keepTitle: 'احتفظ بخلاصة في مسيرتي',
  endAndKeep: 'أنهِ واكتب الخلاصة',
  keepHint:  'يكتب Life خلاصة قصيرة لهذه المحادثة. اقرأها وصحّحها، واحتفظ بها فقط إن كانت صحيحة. تُحفظ الخلاصة وحدها — لا المحادثة.',
  keepWrite:   'اكتب الخلاصة',
  keepWriting: 'تُكتب الخلاصة…',
  keepSummaryFailed: 'تعذّر على Life كتابة الخلاصة الآن. يمكنك كتابتها بنفسك أدناه.',
  fProblem:       'ما الذي يتكرر',
  fUnderstanding: 'ما الذي اتّضح',
  fStep:          'الخطوة الصغيرة التي اخترتها (اختياري)',
  keepConsent: 'الحفظ يفعّل «الاحتفاظ بمسيرتي» في الخصوصية. يمكنك إيقافه هناك متى شئت — وإيقافه يحذف كل ما حُفظ.',
  keepSave:   'احتفظ بهذه الخلاصة',
  keepSaveOn: 'فعّل واحتفظ',
  keepSaved:  'حُفظت في مسيرتي.',
  keepFailed: 'تعذّر الحفظ الآن. حاول مرة أخرى بعد قليل.',

  fullOn:  'تُحفظ محادثتك كاملة، مشفّرة، في مسيرتي — يمكنك إكمالها لاحقًا أو حذفها.',
  fullOff: 'هل تريد الاحتفاظ بالمحادثة كاملة لتعود إليها؟',
  fullTurnOn: 'احتفظ بمحادثاتي كاملة',
  fullTurnOnNote: 'هذا يفعّل «الاحتفاظ بمحادثاتي كاملة» في الخصوصية. يُشفَّر الكلام قبل حفظه. وإيقافه يحذف كل المحادثات المحفوظة.',
  fullSaveFailed: 'تعذّر حفظ الرسالة الأخيرة. المحادثة مستمرة، وستُحفظ مع الرسالة التالية.',
  fullKeptEnd: 'هذه المحادثة محفوظة في مسيرتي. يمكنك إكمالها أو حذفها من هناك.',
  cTitle: 'محادثاتي',
  cHint: 'المحادثات الكاملة التي اخترت الاحتفاظ بها، مشفّرة. لا يراها أحد غيرك.',
  cEmpty: 'لم تُحفظ أي محادثة بعد.',
  cContinue: 'أكمِل',
  cOpenFailed: 'تعذّر فتحها الآن. حاول مرة أخرى بعد قليل.',
  cMessages: '{n} رسالة',
  cUnreadable: 'تعذّرت قراءة هذه المحادثة.',
  cDownload: 'تنزيل المحادثات (JSON)',
  cLoading: 'تُفتح…',

  jTitle:    'مسيرتي',
  jHint:     'الخلاصات التي اخترت الاحتفاظ بها، الأحدث أولًا. لا يراها أحد غيرك.',
  jEmpty:    'لم يُحفظ شيء بعد. في نهاية المحادثة يمكنك الاحتفاظ بخلاصة لها.',
  jOff:      'الحفظ متوقف — لا يُحفظ شيء جديد.',
  jStep:     'الخطوة',
  jDelete:   'حذف',
  jConfirm:  'اضغط مرة أخرى للحذف',
  jDownload: 'تنزيل (JSON)',
  jMore:     'عرض الكل',
  jLess:     'عرض أقل',

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
