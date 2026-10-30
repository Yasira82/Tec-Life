// The words of the daily step card on Home (owner, 2026-10-30), in all twelve languages. The
// three answers reuse session-copy's outDone / outPartly / outNotYet — the same question asked at
// the next conversation, so the same words. A missing key can only fall back to English.
import type { Locale } from '@/lib/i18n/locales';
import type { Trend } from './step-week';

export interface StepCopy {
  title: string; question: string; saved: string; failed: string; last7: string;
  /** The last seven days, said as counts — `{n}` done, `{p}` partly. */
  week: (n: number, p: number) => string;
  /** One plain line after the counts. `{m}` = the days done in the seven before. Never a loss. */
  trend: Record<Trend, (m: number) => string>;
  dayLabel: Record<'DONE' | 'PARTLY' | 'NOT_YET' | 'none', string>;
}

const en: StepCopy = {
  title: 'Your step', question: 'Did you do it today?',
  saved: 'Saved. You can change it until the day ends.', failed: 'Could not save — try again.', last7: 'Last 7 days',
  week: (n, p) => `This week: done on ${n} day${n === 1 ? '' : 's'}${p ? `, partly on ${p}` : ''}.`,
  trend: {
    first: () => 'Your first week with this step.',
    more:  (m) => `More than the week before (${m}).`,
    same:  () => 'The same as the week before.',
    fewer: () => 'A new week can start today.',
  },
  dayLabel: { DONE: 'done', PARTLY: 'partly', NOT_YET: 'not yet', none: 'no answer' },
};

const ar: StepCopy = {
  title: 'خطوتك', question: 'هل قمت بها اليوم؟',
  saved: 'تم الحفظ. يمكنك تغييره حتى نهاية اليوم.', failed: 'تعذّر الحفظ — حاول مرة أخرى.', last7: 'آخر ٧ أيام',
  // A week has seven days, so 0–7 only: «يومًا واحدًا» · «يومين» · «٣ أيام».
  week: (n, p) => `هذا الأسبوع: ${n === 0 ? 'لم تُسجَّل أيام بعد' : `قمت بها ${n === 1 ? 'يومًا واحدًا' : n === 2 ? 'يومين' : `${n} أيام`}`}${p ? `، وجزئيًا في ${p === 1 ? 'يوم' : p === 2 ? 'يومين' : `${p} أيام`}` : ''}.`,
  trend: {
    first: () => 'أسبوعك الأول مع هذه الخطوة.',
    more:  (m) => `أكثر من الأسبوع الذي قبله (${m}).`,
    same:  () => 'مثل الأسبوع الذي قبله.',
    fewer: () => 'أسبوع جديد يمكن أن يبدأ اليوم.',
  },
  dayLabel: { DONE: 'تمّت', PARTLY: 'جزئيًا', NOT_YET: 'ليس بعد', none: 'بلا إجابة' },
};

const es: StepCopy = {
  title: 'Tu paso', question: '¿Lo hiciste hoy?',
  saved: 'Guardado. Puedes cambiarlo hasta que termine el día.', failed: 'No se pudo guardar — inténtalo de nuevo.', last7: 'Últimos 7 días',
  week: (n, p) => `Esta semana: hecho ${n} día${n === 1 ? '' : 's'}${p ? `, en parte ${p}` : ''}.`,
  trend: { first: () => 'Tu primera semana con este paso.', more: (m) => `Más que la semana anterior (${m}).`, same: () => 'Igual que la semana anterior.', fewer: () => 'Hoy puede empezar una semana nueva.' },
  dayLabel: { DONE: 'hecho', PARTLY: 'en parte', NOT_YET: 'todavía no', none: 'sin respuesta' },
};

const fr: StepCopy = {
  title: 'Votre pas', question: 'L’avez-vous fait aujourd’hui ?',
  saved: 'Enregistré. Vous pouvez le changer jusqu’à la fin de la journée.', failed: 'Échec de l’enregistrement — réessayez.', last7: '7 derniers jours',
  week: (n, p) => `Cette semaine : fait ${n} jour${n > 1 ? 's' : ''}${p ? `, en partie ${p}` : ''}.`,
  trend: { first: () => 'Votre première semaine avec ce pas.', more: (m) => `Plus que la semaine d’avant (${m}).`, same: () => 'Comme la semaine d’avant.', fewer: () => 'Une nouvelle semaine peut commencer aujourd’hui.' },
  dayLabel: { DONE: 'fait', PARTLY: 'en partie', NOT_YET: 'pas encore', none: 'sans réponse' },
};

const pt: StepCopy = {
  title: 'Seu passo', question: 'Você fez hoje?',
  saved: 'Salvo. Você pode mudar até o fim do dia.', failed: 'Não foi possível salvar — tente de novo.', last7: 'Últimos 7 dias',
  week: (n, p) => `Esta semana: feito em ${n} dia${n === 1 ? '' : 's'}${p ? `, em parte em ${p}` : ''}.`,
  trend: { first: () => 'Sua primeira semana com este passo.', more: (m) => `Mais que a semana anterior (${m}).`, same: () => 'Igual à semana anterior.', fewer: () => 'Uma nova semana pode começar hoje.' },
  dayLabel: { DONE: 'feito', PARTLY: 'em parte', NOT_YET: 'ainda não', none: 'sem resposta' },
};

const tr: StepCopy = {
  title: 'Adımın', question: 'Bugün yaptın mı?',
  saved: 'Kaydedildi. Gün bitene kadar değiştirebilirsin.', failed: 'Kaydedilemedi — tekrar dene.', last7: 'Son 7 gün',
  week: (n, p) => `Bu hafta: ${n} gün yaptın${p ? `, ${p} gün kısmen` : ''}.`,
  trend: { first: () => 'Bu adımla ilk haftan.', more: (m) => `Önceki haftadan fazla (${m}).`, same: () => 'Önceki haftayla aynı.', fewer: () => 'Yeni bir hafta bugün başlayabilir.' },
  dayLabel: { DONE: 'yapıldı', PARTLY: 'kısmen', NOT_YET: 'henüz değil', none: 'cevap yok' },
};

const ru: StepCopy = {
  title: 'Ваш шаг', question: 'Сделали сегодня?',
  saved: 'Сохранено. Можно изменить до конца дня.', failed: 'Не удалось сохранить — попробуйте ещё раз.', last7: 'Последние 7 дней',
  week: (n, p) => `На этой неделе: сделано дней — ${n}${p ? `, частично — ${p}` : ''}.`,
  trend: { first: () => 'Ваша первая неделя с этим шагом.', more: (m) => `Больше, чем неделей раньше (${m}).`, same: () => 'Так же, как неделей раньше.', fewer: () => 'Новая неделя может начаться сегодня.' },
  dayLabel: { DONE: 'сделано', PARTLY: 'частично', NOT_YET: 'пока нет', none: 'нет ответа' },
};

const id: StepCopy = {
  title: 'Langkahmu', question: 'Sudah kamu lakukan hari ini?',
  saved: 'Tersimpan. Kamu bisa mengubahnya sampai hari berakhir.', failed: 'Gagal menyimpan — coba lagi.', last7: '7 hari terakhir',
  week: (n, p) => `Minggu ini: dilakukan ${n} hari${p ? `, sebagian ${p} hari` : ''}.`,
  trend: { first: () => 'Minggu pertamamu dengan langkah ini.', more: (m) => `Lebih banyak dari minggu sebelumnya (${m}).`, same: () => 'Sama dengan minggu sebelumnya.', fewer: () => 'Minggu baru bisa dimulai hari ini.' },
  dayLabel: { DONE: 'sudah', PARTLY: 'sebagian', NOT_YET: 'belum', none: 'tanpa jawaban' },
};

const vi: StepCopy = {
  title: 'Bước của bạn', question: 'Hôm nay bạn đã làm chưa?',
  saved: 'Đã lưu. Bạn có thể đổi đến hết ngày.', failed: 'Không lưu được — thử lại nhé.', last7: '7 ngày qua',
  week: (n, p) => `Tuần này: đã làm ${n} ngày${p ? `, làm một phần ${p} ngày` : ''}.`,
  trend: { first: () => 'Tuần đầu tiên của bạn với bước này.', more: (m) => `Nhiều hơn tuần trước (${m}).`, same: () => 'Giống tuần trước.', fewer: () => 'Một tuần mới có thể bắt đầu hôm nay.' },
  dayLabel: { DONE: 'đã làm', PARTLY: 'một phần', NOT_YET: 'chưa', none: 'chưa trả lời' },
};

const ko: StepCopy = {
  title: '나의 걸음', question: '오늘 했나요?',
  saved: '저장했어요. 오늘이 끝날 때까지 바꿀 수 있어요.', failed: '저장하지 못했어요 — 다시 시도해 주세요.', last7: '최근 7일',
  week: (n, p) => `이번 주: ${n}일 했어요${p ? `, ${p}일은 일부만` : ''}.`,
  trend: { first: () => '이 걸음과 함께하는 첫 주예요.', more: (m) => `지난주보다 많아요 (${m}).`, same: () => '지난주와 같아요.', fewer: () => '새로운 한 주는 오늘 시작할 수 있어요.' },
  dayLabel: { DONE: '했음', PARTLY: '일부', NOT_YET: '아직', none: '답 없음' },
};

const hi: StepCopy = {
  title: 'आपका कदम', question: 'क्या आज किया?',
  saved: 'सहेज लिया। दिन ख़त्म होने तक बदल सकते हैं।', failed: 'सहेज नहीं पाए — फिर कोशिश करें।', last7: 'पिछले 7 दिन',
  week: (n, p) => `इस हफ़्ते: ${n} दिन किया${p ? `, ${p} दिन थोड़ा` : ''}।`,
  trend: { first: () => 'इस कदम के साथ आपका पहला हफ़्ता।', more: (m) => `पिछले हफ़्ते से ज़्यादा (${m})।`, same: () => 'पिछले हफ़्ते जितना।', fewer: () => 'नया हफ़्ता आज शुरू हो सकता है।' },
  dayLabel: { DONE: 'किया', PARTLY: 'थोड़ा', NOT_YET: 'अभी नहीं', none: 'कोई जवाब नहीं' },
};

const zh: StepCopy = {
  title: '你的一小步', question: '今天做了吗？',
  saved: '已保存。今天结束前都可以修改。', failed: '保存失败——请再试一次。', last7: '最近 7 天',
  week: (n, p) => `这周：做到了 ${n} 天${p ? `，部分做到 ${p} 天` : ''}。`,
  trend: { first: () => '这是你和这一步的第一周。', more: (m) => `比上一周多（${m}）。`, same: () => '和上一周一样。', fewer: () => '新的一周可以从今天开始。' },
  dayLabel: { DONE: '做到了', PARTLY: '部分', NOT_YET: '还没有', none: '未回答' },
};

const COPY: Record<Locale, StepCopy> = { en, ar, es, fr, pt, tr, ru, id, vi, ko, hi, zh };

export function stepCopy(locale: Locale): StepCopy {
  return COPY[locale] ?? en;
}
