// The words of the owner's outcomes reading (admin only). Like the session reading, it is for
// one person: Arabic for Arabic, English for every other language.
import type { Locale } from '@/lib/i18n';

export interface OutcomesCopy {
  title: string; hint: string; fewer: string;
  people: string; entries: string;
  steps: string; stepsChosen: string; stepsAnswered: string; stepsDone: string; stepsPartly: string; stepsNotYet: string;
  daily: string; dailyFollowed: string; dailyDone: string; dailyPartly: string; dailyNotYet: string;
  measures: string; measuresBoth: string; measuresMoved: string; measuresSame: string; measuresUnknown: string; movedNote: string;
  feelings: string; feelingsBoth: string; heavyToLight: string; lightToHeavy: string; sameSide: string;
  cameBack: string;
}

const en: OutcomesCopy = {
  title: 'Does Life help? — reading',
  hint: 'What people chose and answered themselves, counted. Nothing they wrote. Your own entries are left out.',
  fewer: 'fewer than 5',
  people: 'People who kept a conversation', entries: 'Conversations kept',
  steps: 'The step', stepsChosen: 'A step agreed', stepsAnswered: 'Answered later', stepsDone: 'Did it', stepsPartly: 'Partly', stepsNotYet: 'Not yet',
  daily: 'Day by day', dailyFollowed: 'Steps followed daily', dailyDone: 'Days done', dailyPartly: 'Days partly', dailyNotYet: 'Days not yet',
  measures: 'Before and after', measuresBoth: 'Measured both times', measuresMoved: 'Number moved', measuresSame: 'Number unchanged', measuresUnknown: '"I don\'t know" / not counted',
  movedNote: '"Moved" is not "better": fewer cigarettes and more pages are both a move. The direction is the person\'s.',
  feelings: 'Feelings they picked', feelingsBoth: 'Picked at the start and the end', heavyToLight: 'Heavy → light', lightToHeavy: 'Light → heavy', sameSide: 'Same side',
  cameBack: 'Came back after a week or more',
};

const ar: OutcomesCopy = {
  title: 'هل Life يفيد؟ — القراءة',
  hint: 'ما اختاره الناس وأجابوا عنه بأنفسهم، معدودًا. لا شيء مما كتبوه. محادثاتك أنت مستبعدة.',
  fewer: 'أقل من 5',
  people: 'أشخاص احتفظوا بمحادثة', entries: 'محادثات محفوظة',
  steps: 'الخطوة', stepsChosen: 'خطوة متفق عليها', stepsAnswered: 'أجابوا عنها لاحقًا', stepsDone: 'فعلوها', stepsPartly: 'جزئيًا', stepsNotYet: 'ليس بعد',
  daily: 'يومًا بيوم', dailyFollowed: 'خطوات تابعوها يوميًا', dailyDone: 'أيام فعلوها', dailyPartly: 'أيام جزئيًا', dailyNotYet: 'أيام ليس بعد',
  measures: 'قبل وبعد', measuresBoth: 'قاسوا المرتين', measuresMoved: 'الرقم تغيّر', measuresSame: 'الرقم لم يتغيّر', measuresUnknown: '«لا أعرف» / لم يعدّوا',
  movedNote: '«تغيّر» لا تعني «تحسّن»: سجائر أقل وصفحات أكثر كلاهما تغيّر. الاتجاه يحدده الشخص.',
  feelings: 'مشاعر اختاروها', feelingsBoth: 'اختاروا في البداية والنهاية', heavyToLight: 'ثقيل ← خفيف', lightToHeavy: 'خفيف ← ثقيل', sameSide: 'نفس الجانب',
  cameBack: 'رجعوا بعد أسبوع أو أكثر',
};

export function outcomesCopy(locale: Locale): OutcomesCopy {
  return locale === 'ar' ? ar : en;
}
