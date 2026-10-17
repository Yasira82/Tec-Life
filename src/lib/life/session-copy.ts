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
  errUnavailable: string; errBusy: string; errLimit: string;
  endTitle: string; support: string;
  notSaved: string; copy: string; copied: string;
  clearerQ: string; clearerYes: string; clearerSomewhat: string; clearerNo: string; thanks: string;
  finish: string;
  readingTitle: string; readingHint: string; readingFewer: string; readingResult: Record<string, string>;
  readingStarted: string; readingReached: string; readingClearer: string; readingNo: string; readingWeek: string;
}

const en: SessionCopy = {
  entryTitle: 'Talk through a problem that keeps happening',
  entryHint:  'A conversation to help you understand it. Nothing of it is saved.',
  entryCta:   'Start',

  introTitle: 'Before we start',
  introIs:    'You will talk with Life about something that keeps happening and that you would like to change. It asks, and it listens — one step at a time.',
  introIsNot: 'It is not a diagnosis, not a judgement of you, and it gives no advice it cannot ground.',
  introAi:    'To reply, what you write is sent to an AI model (Groq). We do not keep it, and Groq’s retention is switched off for us. Numbers, emails and links are removed before it is sent — but that does not make your words fully anonymous.',
  introNothingSaved: 'Nothing of the conversation is saved. When you close this page it is gone.',
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
  errLimit:       'This conversation has reached its length. You can end it and start a new one.',

  endTitle: 'The conversation has ended',
  support:  'If things feel heavy right now, talk to someone you trust, or to a specialised support service where you live.',
  notSaved: 'Nothing was saved. If you want to keep this conversation, copy it now.',
  copy:   'Copy the conversation',
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
  entryTitle: 'تحدّث عن مشكلة تتكرر معك',
  entryHint:  'محادثة تساعدك على فهمها. لا يُحفظ شيء منها.',
  entryCta:   'ابدأ',

  introTitle: 'قبل أن نبدأ',
  introIs:    'ستتحدث مع Life عن أمر يتكرر وتريد تغييره. يسألك ويستمع إليك — خطوة بخطوة.',
  introIsNot: 'ليست تشخيصًا، ولا حكمًا عليك، ولا تقدّم نصيحة بلا أساس.',
  introAi:    'لكي يرد عليك، يُرسَل ما تكتبه إلى نموذج ذكاء اصطناعي (Groq). لا نحتفظ به، وقد أُوقف احتفاظ Groq به لدينا. تُحذف الأرقام والبريد والروابط قبل الإرسال — لكن ذلك لا يجعل كلامك مجهول الهوية تمامًا.',
  introNothingSaved: 'لا يُحفظ شيء من المحادثة. بمجرد إغلاق الصفحة تزول.',
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
  errLimit:       'بلغت المحادثة حدّها. يمكنك إنهاؤها وبدء محادثة جديدة.',

  endTitle: 'انتهت المحادثة',
  support:  'إن شعرت بأن العبء ثقيل عليك الآن، فتحدّث إلى شخص تثق به، أو إلى جهة دعم متخصصة في بلدك.',
  notSaved: 'لم يُحفظ شيء. إن أردت الاحتفاظ بهذه المحادثة، فانسخها الآن.',
  copy:   'نسخ المحادثة',
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
