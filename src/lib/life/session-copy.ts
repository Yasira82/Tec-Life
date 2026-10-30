// The words of Life's conversation (KB audits/LIFE_FIRST_SESSION_SPEC_DRAFT_2026-10-17.md
// §2, §5, §8). The Arabic is Modern Standard Arabic, not a dialect (owner, 2026-10-17) —
// the same register as the rest of Life's Arabic.
//
// All twelve of the app's languages (owner, 2026-10-20: "I want Life working in all 12").
// English and Arabic are written here; the other ten are in ./session-copy-langs/, translated
// from the English and waiting for a native speaker's read. The admin's reading (the counts
// only the owner sees) stays English outside Arabic — it is for one person, not for the people
// Life talks with. The model answers in the language the person writes in, whatever this is.
import type { Locale } from '@/lib/i18n';
import { es } from './session-copy-langs/es';
import { fr } from './session-copy-langs/fr';
import { pt } from './session-copy-langs/pt';
import { tr } from './session-copy-langs/tr';
import { ru } from './session-copy-langs/ru';
import { id } from './session-copy-langs/id';
import { vi } from './session-copy-langs/vi';
import { ko } from './session-copy-langs/ko';
import { hi } from './session-copy-langs/hi';
import { zh } from './session-copy-langs/zh';

export interface SessionCopy {
  entryTitle: string; entryHint: string; entryCta: string;
  introTitle: string; introIs: string; introIsNot: string; introAi: string; introNothingSaved: string;
  agree: string; cancel: string;
  rolesNote: string; opener: string;
  placeholder: string; send: string; thinking: string; endChat: string;
  /** The button under Life's reply, and the words it puts at the start of the box (the AI service
   *  knows them as a correction — tec-ai-service understand.ts CORRECTION). */
  notMeant: string; notMeantHint: string;
  you: string; life: string;
  errUnavailable: string; errBusy: string; errLimit: string; errCapacity: string;
  endTitle: string; support: string;
  notSaved: string; copy: string; copied: string;
  clearerQ: string; clearerYes: string; clearerSomewhat: string; clearerNo: string; thanks: string;
  finish: string;
  memoryNote: string;
  /** Awareness (2026-10-30): what else the coach sees while the journey is kept. */
  awareNote: string;
  lastStepQ: string; outDone: string; outPartly: string; outNotYet: string; outThanks: string;
  keepTitle: string; endAndKeep: string; keepHint: string; keepWrite: string; keepWriting: string; keepSummaryFailed: string;
  fProblem: string; fUnderstanding: string; fStep: string;
  fTried: string; fHelped: string; fTriggers: string; fReason: string;
  memStrip: string; memStripEdit: string; jMemEdit: string; jMemSave: string; jMemCancel: string; jMemFailed: string;
  fPractice: string; fWords: string; fFeelStart: string; fFeelEnd: string;
  bTitle: string; bHint: string; bStatementLabel: string; bStatementPh: string; bStatementEmpty: string; bEdit: string;
  bDid: string; bHelped: string; bPractice: string; bReasons: string; bWords: string; bFeelings: string; bEmpty: string;
  /** The closed list of feelings a person may CHOOSE (never inferred) — keyed like tec-life-service's LifeFeeling. */
  feel: Record<'CALM' | 'HOPEFUL' | 'DETERMINED' | 'PROUD' | 'RELIEVED' | 'TIRED' | 'ANXIOUS' | 'SAD' | 'FRUSTRATED' | 'ANGRY' | 'ASHAMED' | 'CONFUSED', string>;
  keepConsent: string; keepSave: string; keepSaveOn: string; keepSaved: string; keepFailed: string;
  fullOn: string; fullOff: string; fullTurnOn: string; fullTurnOnNote: string; fullSaveFailed: string; fullKeptEnd: string;
  cTitle: string; cHint: string; cEmpty: string; cContinue: string; cOpenFailed: string; cDeleteFailed: string; continueLast: string; startNew: string; menu: string; closeMenu: string; newConversation: string; cMessages: string; cUnreadable: string; cDownload: string; cLoading: string;
  jTitle: string; jSummaries: string; jHint: string; jEmpty: string; jOff: string; jStep: string;
  jDelete: string; jConfirm: string; jDownload: string; jMore: string; jLess: string;
  mAdd: string; mHint: string; mLabel: string; mLabelPh: string; mKindNumber: string; mKindRating: string;
  mPerDay: string; mPerWeek: string; mPerMonth: string; mValueNow: string; mSave: string; mSkip: string; mFailed: string;
  mBefore: string; mAfter: string; mFollowCta: string; mUnknown: string; mNotMeasured: string;
  mChange: string; mClaim: string; mRemove: string; mEdit: string; mOutOf5: string; jMakeGoal: string; jGoalNote: string;
  pGoalQ: string; pSkillQ: string; pAddGoal: string; pAddSkill: string; pNo: string; pAddedGoal: string; pAddedSkill: string; pFailed: string; pNote: string;
  readingTitle: string; readingHint: string; readingFewer: string; readingResult: Record<string, string>;
  readingStarted: string; readingReached: string; readingClearer: string; readingNo: string; readingWeek: string;
  readingLoop: string; readingKept: string; readingResumed: string; readingBefore: string; readingAfter: string; readingUnknown: string; readingGoal: string;
  realUseTitle: string; realUseMet: string; realUseNotYet: string; realUseBar: string;
}

const en: SessionCopy = {
  entryTitle: 'Talk with your personal life coach',
  entryHint:  'About anything you want to change or build in your life. Only a summary you confirm is ever kept.',
  entryCta:   'Start',

  introTitle: 'Before we start',
  introIs:    'You will talk with Life, your personal life coach, about something you want to change or build — a habit, a decision, your work, the people around you, yourself. It asks, it listens, and it helps you choose your own next step.',
  introIsNot: 'It is not a doctor, a lawyer or a financial adviser, not a diagnosis and not a judgement of you — and it gives no advice it cannot ground.',
  introAi:    'To reply, what you write is sent to an AI model. We do not keep it, and the model’s provider does not keep it for us. Numbers, emails and links are removed before it is sent — but that does not make your words fully anonymous. If you ask Life to look something up, only a general topic — never your words — is sent to a search service.',
  introNothingSaved: 'The conversation itself is not saved — when you close this page it is gone. At the end you may keep a short summary that you read and confirm, only if you choose to.',
  agree:  'I agree — start',
  cancel: 'Not now',

  rolesNote: 'When you mention other people, describe them by their role — “my manager”, “a friend” — rather than by name.',
  opener:    'I’m here to listen. What’s on your mind today, or what do you wish would change in your life? Start anywhere, in your own words.',

  placeholder: 'Write here…',
  notMeant: 'That\'s not what I meant', notMeantHint: 'Say it in other words — what did you mean?',
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

  memoryNote: "Life reads what you chose to keep — your summaries and your sentence about who you are becoming — so it can coach you from where you are. They are sent to the AI model with your messages.",

  awareNote: "Life also sees how your step went this week, your active goals and the time of day where you are, so it can start from your life today. They are sent with your messages too.",
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
  fTried: "What you already tried (optional)",
  fHelped: "What helped, even a little (optional)",
  fTriggers: "When it gets hard (optional)",
  fReason: "Why it matters to you (optional)",
  memStrip: "Life coaches you from what you chose to keep: what you tried, what helped, when it gets hard and why it matters to you. You can see and change it at any time.",
  memStripEdit: "See what Life remembers",
  jMemEdit: "Edit what Life remembers",
  jMemSave: "Save",
  jMemCancel: "Cancel",
  jMemFailed: "This could not be saved. Try again.",
  fPractice: "What you now do regularly (optional)",
  fWords: "A sentence of yours to keep (optional)",
  fFeelStart: "How you felt at the start (optional)",
  fFeelEnd: "How you feel now (optional)",
  bTitle: "I'm changing",
  bHint: "Built only from what you chose to keep.",
  bStatementLabel: "I am becoming…",
  bStatementPh: "Someone who…",
  bStatementEmpty: "Write one sentence about who you are becoming. Life will remind you of it when you doubt yourself.",
  bEdit: "Edit",
  bDid: "What you managed",
  bHelped: "What works for you",
  bPractice: "What you now do",
  bReasons: "Why it matters to you",
  bWords: "In your own words",
  bFeelings: "How you felt — start → end",
  bEmpty: "Every summary you keep adds to this page: what you managed, what works for you, and who you are becoming.",
  feel: {"CALM": "Calm", "HOPEFUL": "Hopeful", "DETERMINED": "Determined", "PROUD": "Proud", "RELIEVED": "Relieved", "TIRED": "Tired", "ANXIOUS": "Anxious", "SAD": "Sad", "FRUSTRATED": "Frustrated", "ANGRY": "Angry", "ASHAMED": "Ashamed", "CONFUSED": "Confused"},
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
  continueLast: 'Continue my last conversation',
  startNew: 'Start a new one',
  menu: 'My journey — conversations and summaries',
  closeMenu: 'Close',
  newConversation: 'New conversation',
  cOpenFailed: 'It could not be opened right now. Try again in a moment.',
  cDeleteFailed: 'It could not be deleted right now. Try again in a moment.',
  cMessages: '{n} messages',
  cUnreadable: 'This conversation cannot be read.',
  cDownload: 'Download conversations (JSON)',
  cLoading: 'Opening…',

  jTitle:    'My journey',
  jSummaries: 'Summaries',
  jHint:     'The summaries you chose to keep, newest first. Only you can see them.',
  jEmpty:    'Nothing kept yet. At the end of a conversation you can keep a summary of it.',
  jOff:      'Keeping is off — nothing new is kept.',
  jStep:     'Step',
  mAdd:        '+ Record a measure (optional)',
  mHint:       'If you like, write down one thing you can count now, and count it again later. Only you type the value, and you can skip.',
  mLabel:      'What will you count?',
  mLabelPh:    'e.g. cigarettes',
  mKindNumber: 'A number',
  mKindRating: 'A rating from 1 to 5',
  mPerDay: 'a day', mPerWeek: 'a week', mPerMonth: 'a month',
  mValueNow:   'Your value now',
  mSave: 'Save', mSkip: 'Skip', mFailed: 'It could not be saved. Try again.',
  mBefore: 'Before', mAfter: 'Later',
  mFollowCta:  'Record it again now',
  mUnknown: "I don't know", mNotMeasured: "I didn't count",
  mChange: 'From {a} to {b}, between {d1} and {d2}.',
  mClaim:  'A change you recorded — not proof that the step alone caused it.',
  mRemove: 'Remove the measure', mEdit: 'Edit', mOutOf5: '{n} of 5',
  jMakeGoal: 'Make it a goal',
  jGoalNote: 'Your step from My journey — edit it or ignore it. Nothing is saved until you tap Add.',
  pGoalQ: 'Keep this as a goal in Life?',
  pSkillQ: 'Add this to your skills in Life?',
  pAddGoal: 'Add to my goals',
  pAddSkill: 'Add to my skills',
  pNo: 'Not now',
  pAddedGoal: 'Added to your goals — you will find it, with its steps, in Goals.',
  pAddedSkill: 'Added to your skills.',
  pFailed: 'It could not be added. Try again.',
  pNote: 'Life suggested this from what you agreed. Nothing is added unless you tap.',
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
  readingLoop: 'The change loop', readingKept: 'Summaries kept', readingResumed: 'Conversations continued',
  readingBefore: 'Measures before', readingAfter: 'Values after', readingUnknown: '“I don’t know” / didn’t count', readingGoal: 'Steps made goals',
  realUseTitle: 'Real use',
  realUseMet: 'Met — real use exists; patterns can be considered',
  realUseNotYet: 'Not yet',
  realUseBar: 'Last 2 weeks: at least {reached} conversations reached the end and {after} “after” values. Your own use (admin) is not counted. Counts are events, not people.',
};

const ar: SessionCopy = {
  entryTitle: 'تحدّث مع مدرّبك الشخصي للحياة',
  entryHint:  'عن أي أمر تريد تغييره أو بناءه في حياتك. لا يُحفظ إلا خلاصة تؤكدها أنت.',
  entryCta:   'ابدأ',

  introTitle: 'قبل أن نبدأ',
  introIs:    'ستتحدث مع Life، مدرّبك الشخصي للحياة، عن أمر تريد تغييره أو بناءه — عادة، أو قرار، أو عملك، أو من حولك، أو نفسك. يسألك ويستمع إليك، ويساعدك على أن تختار خطوتك التالية بنفسك.',
  introIsNot: 'ليس طبيبًا ولا محاميًا ولا مستشارًا ماليًا، وليس تشخيصًا ولا حكمًا عليك، ولا يقدّم نصيحة بلا أساس.',
  introAi:    'لكي يرد عليك، يُرسَل ما تكتبه إلى نموذج ذكاء اصطناعي. لا نحتفظ به، ولا يحتفظ به مزوّد النموذج لدينا. تُحذف الأرقام والبريد والروابط قبل الإرسال — لكن ذلك لا يجعل كلامك مجهول الهوية تمامًا. وإذا طلبت من Life أن يبحث عن شيء، يُرسَل موضوع عام فقط — وليس كلماتك أبدًا — إلى خدمة بحث.',
  introNothingSaved: 'المحادثة نفسها لا تُحفظ — بمجرد إغلاق الصفحة تزول. في النهاية يمكنك أن تحتفظ بخلاصة قصيرة تقرؤها وتؤكدها، إن اخترت ذلك فقط.',
  agree:  'موافق — ابدأ',
  cancel: 'ليس الآن',

  rolesNote: 'عندما تذكر شخصًا، صِفه بدوره — «مديري»، «صديقي» — دون ذكر اسمه.',
  opener:    'أنا هنا لأسمعك. ما الذي يشغلك اليوم، أو ما الذي تتمنى أن يتغيّر في حياتك؟ ابدأ من أي مكان، وبكلماتك أنت.',

  placeholder: 'اكتب هنا…',
  notMeant: 'مش ده قصدي', notMeantHint: 'قلها بكلمات أخرى — ماذا قصدت؟',
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

  memoryNote: "يقرأ Life ما اخترت أن تحتفظ به — خلاصاتك وجملتك عمّن تصبح — ليدرّبك من حيث أنت. تُرسَل إلى نموذج الذكاء الاصطناعي مع رسائلك.",

  awareNote: "ويرى Life أيضًا كيف سارت خطوتك هذا الأسبوع، وأهدافك النشطة، والوقت عندك، ليبدأ من حياتك اليوم. تُرسَل هي أيضًا مع رسائلك.",
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
  fTried: "ما جرّبته من قبل (اختياري)",
  fHelped: "ما ساعدك ولو قليلًا (اختياري)",
  fTriggers: "متى يصعب الأمر (اختياري)",
  fReason: "لماذا يهمّك هذا (اختياري)",
  memStrip: "يدرّبك Life بناءً على ما اخترت أن تحتفظ به: ما جرّبته، وما ساعدك، ومتى يصعب الأمر، ولماذا يهمّك. يمكنك أن تراه وتغيّره في أي وقت.",
  memStripEdit: "اعرض ما يتذكّره Life",
  jMemEdit: "عدّل ما يتذكّره Life",
  jMemSave: "حفظ",
  jMemCancel: "إلغاء",
  jMemFailed: "تعذّر الحفظ. حاول مرة أخرى.",
  fPractice: "ما صرت تفعله بانتظام (اختياري)",
  fWords: "جملة قلتها وتريد أن تحتفظ بها (اختياري)",
  fFeelStart: "كيف كنت تشعر في البداية (اختياري)",
  fFeelEnd: "كيف تشعر الآن (اختياري)",
  bTitle: "أنا أتغيّر",
  bHint: "مبنيّة فقط مما اخترت أن تحتفظ به.",
  bStatementLabel: "أنا أصبحت…",
  bStatementPh: "شخصًا…",
  bStatementEmpty: "اكتب جملة واحدة عن الشخص الذي تصبحه. سيذكّرك Life بها حين تشكّ في نفسك.",
  bEdit: "تعديل",
  bDid: "ما استطعت أن تفعله",
  bHelped: "ما ينفع معك",
  bPractice: "ما صرت تفعله",
  bReasons: "لماذا يهمّك هذا",
  bWords: "بكلماتك أنت",
  bFeelings: "كيف شعرت — البداية ← النهاية",
  bEmpty: "كل خلاصة تحتفظ بها تضيف إلى هذه الصفحة: ما استطعت أن تفعله، وما ينفع معك، ومن تصبح.",
  feel: {"CALM": "هادئ", "HOPEFUL": "متفائل", "DETERMINED": "عازم", "PROUD": "فخور", "RELIEVED": "مرتاح", "TIRED": "متعب", "ANXIOUS": "قلق", "SAD": "حزين", "FRUSTRATED": "محبط", "ANGRY": "غاضب", "ASHAMED": "خجلان", "CONFUSED": "مشوّش"},
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
  continueLast: 'أكمِل محادثتي الأخيرة',
  startNew: 'ابدأ محادثة جديدة',
  menu: 'مسيرتي — المحادثات والخلاصات',
  closeMenu: 'إغلاق',
  newConversation: 'محادثة جديدة',
  cOpenFailed: 'تعذّر فتحها الآن. حاول مرة أخرى بعد قليل.',
  cDeleteFailed: 'تعذّر حذفها الآن. حاول مرة أخرى بعد قليل.',
  cMessages: '{n} رسالة',
  cUnreadable: 'تعذّرت قراءة هذه المحادثة.',
  cDownload: 'تنزيل المحادثات (JSON)',
  cLoading: 'تُفتح…',

  jTitle:    'مسيرتي',
  jSummaries: 'الخلاصات',
  jHint:     'الخلاصات التي اخترت الاحتفاظ بها، الأحدث أولًا. لا يراها أحد غيرك.',
  jEmpty:    'لم يُحفظ شيء بعد. في نهاية المحادثة يمكنك الاحتفاظ بخلاصة لها.',
  jOff:      'الحفظ متوقف — لا يُحفظ شيء جديد.',
  jStep:     'الخطوة',
  mAdd:        '+ سجّل قياسًا (اختياري)',
  mHint:       'إن أحببت، اكتب شيئًا واحدًا تستطيع أن تعدّه الآن، ثم عُدّه مرة أخرى لاحقًا. أنت وحدك من يكتب القيمة، ويمكنك أن تتخطى.',
  mLabel:      'ما الذي ستعدّه؟',
  mLabelPh:    'مثلًا: السجائر',
  mKindNumber: 'رقم',
  mKindRating: 'تقييم من 1 إلى 5',
  mPerDay: 'في اليوم', mPerWeek: 'في الأسبوع', mPerMonth: 'في الشهر',
  mValueNow:   'قيمتك الآن',
  mSave: 'احفظ', mSkip: 'تخطَّ', mFailed: 'تعذّر الحفظ. حاول مرة أخرى.',
  mBefore: 'قبل', mAfter: 'بعد',
  mFollowCta:  'سجّل القيمة الآن',
  mUnknown: 'لا أعرف', mNotMeasured: 'لم أعدّ',
  mChange: 'من {a} إلى {b}، بين {d1} و{d2}.',
  mClaim:  'تغيير سجّلته أنت، وليس دليلًا على أن الخطوة وحدها سببته.',
  mRemove: 'إزالة القياس', mEdit: 'تعديل', mOutOf5: '{n} من 5',
  jMakeGoal: 'اجعلها هدفًا',
  jGoalNote: 'خطوتك من مسيرتك — عدّلها أو تجاهلها. لا شيء يُحفظ قبل أن تضغط إضافة.',
  pGoalQ: 'أتحب أن تحتفظ بهذا هدفًا في Life؟',
  pSkillQ: 'أتحب أن تضيف هذا إلى مهاراتك في Life؟',
  pAddGoal: 'أضِف إلى أهدافي',
  pAddSkill: 'أضِف إلى مهاراتي',
  pNo: 'ليس الآن',
  pAddedGoal: 'أُضيف إلى أهدافك — تجده مع خطواته في الأهداف.',
  pAddedSkill: 'أُضيف إلى مهاراتك.',
  pFailed: 'تعذّرت الإضافة. حاول مرة أخرى.',
  pNote: 'اقترح Life هذا مما اتفقتما عليه. لا يُضاف شيء إلا إذا ضغطت.',
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
  readingLoop: 'دائرة التغيير', readingKept: 'خلاصات محفوظة', readingResumed: 'محادثات أُكملت',
  readingBefore: 'قياسات «قبل»', readingAfter: 'قيم «بعد»', readingUnknown: '«لا أعرف» / لم أعدّ', readingGoal: 'خطوات صارت أهدافًا',
  realUseTitle: 'الاستخدام الحقيقي',
  realUseMet: 'تحقّق — يوجد استخدام حقيقي، ويمكن التفكير في الأنماط',
  realUseNotYet: 'لم يتحقق بعد',
  realUseBar: 'آخر أسبوعين: {reached} محادثات على الأقل وصلت إلى النهاية و{after} قيم «بعد». استخدامك أنت (المشرف) لا يُحسب. الأعداد أحداث، لا أشخاص.',
};

/** The owner's reading — admin only, so it is not translated beyond English and Arabic. */
export const ADMIN_KEYS = [
  'readingTitle', 'readingHint', 'readingFewer', 'readingResult', 'readingStarted', 'readingReached',
  'readingClearer', 'readingNo', 'readingWeek', 'readingLoop', 'readingKept', 'readingResumed',
  'readingBefore', 'readingAfter', 'readingUnknown', 'readingGoal',
  'realUseTitle', 'realUseMet', 'realUseNotYet', 'realUseBar',
] as const;
type AdminKey = (typeof ADMIN_KEYS)[number];
/** What a person reads — every key a translation must have. */
export type PersonCopy = Omit<SessionCopy, AdminKey>;

const adminEn = Object.fromEntries(ADMIN_KEYS.map((k) => [k, en[k]])) as Pick<SessionCopy, AdminKey>;
const withAdmin = (c: PersonCopy): SessionCopy => ({ ...c, ...adminEn });

const COPY: Record<Locale, SessionCopy> = {
  en, ar,
  es: withAdmin(es), fr: withAdmin(fr), pt: withAdmin(pt), tr: withAdmin(tr), ru: withAdmin(ru),
  id: withAdmin(id), vi: withAdmin(vi), ko: withAdmin(ko), hi: withAdmin(hi), zh: withAdmin(zh),
};

export function sessionCopy(locale: Locale): SessionCopy {
  return COPY[locale] ?? en;
}
