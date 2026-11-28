// The words the redesign's My goals adds (Phase 1), in all twelve languages. Everything the current
// Goals screen already says — mark done, delete, log, steps, the free-plan cap, Ask TEC AI, the
// areas — is reused from the dictionaries and future-copy, so one goal reads the same in both
// designs. A missing language falls back to English.
import type { Locale } from '@/lib/i18n/locales';

export interface GoalsCopy {
  priority: string; others: string; all: string; noneInArea: string; edit: string;
  sheetNew: string; sheetEdit: string; fTitle: string; fTarget: string; fSteps: string;
  save: string; cancel: string; confirmDelete: string; reopen: string;
  noTitle: string; badTarget: string; saveFailed: string;
  /** Next to an amount field (π logged or a target): not above 0 / written with a comma / too big. */
  amountInvalid: string; amountAmbiguous: string; amountTooLarge: string;
}

const en: GoalsCopy = {
  priority: 'Closest to done', others: 'Other goals', all: 'All', noneInArea: 'No goals in this area.', edit: 'Edit',
  sheetNew: 'New goal', sheetEdit: 'Edit goal', fTitle: 'Goal', fTarget: 'π target (optional)',
  fSteps: 'Steps toward it — one per line, up to 5',
  save: 'Save', cancel: 'Cancel', confirmDelete: 'Tap again to delete', reopen: 'Back to active',
  noTitle: 'Give the goal a name to save it.', badTarget: 'The π target must be a number above 0.',
  saveFailed: 'Couldn’t save. Nothing was changed — try again.',
  amountInvalid: 'Enter an amount above 0, like 5 or 2.5.', amountAmbiguous: 'Write it without a comma: a dot for decimals, like 1000 or 2.5.', amountTooLarge: 'That amount is too large.',
};

const ar: GoalsCopy = {
  priority: 'الأقرب للإنجاز', others: 'بقية الأهداف', all: 'الكل', noneInArea: 'لا توجد أهداف في هذا المجال.', edit: 'تعديل',
  sheetNew: 'هدف جديد', sheetEdit: 'تعديل الهدف', fTitle: 'الهدف', fTarget: 'المبلغ المستهدف بـ π (اختياري)',
  fSteps: 'الخطوات نحوه — خطوة في كل سطر، حتى 5',
  save: 'حفظ', cancel: 'إلغاء', confirmDelete: 'اضغط مرة أخرى للحذف', reopen: 'إعادته إلى النشطة',
  noTitle: 'اكتب اسمًا للهدف لحفظه.', badTarget: 'يجب أن يكون المبلغ رقمًا أكبر من 0.',
  saveFailed: 'تعذّر الحفظ. لم يتغير شيء — حاول مرة أخرى.',
  amountInvalid: 'اكتب مبلغًا أكبر من 0، مثل 5 أو 2.5.', amountAmbiguous: 'اكتبه بدون فاصلة: نقطة للكسور، مثل 1000 أو 2.5.', amountTooLarge: 'هذا المبلغ كبير جدًا.',
};

const es: GoalsCopy = {
  priority: 'Más cerca de lograrse', others: 'Otras metas', all: 'Todas', noneInArea: 'No hay metas en esta área.', edit: 'Editar',
  sheetNew: 'Nueva meta', sheetEdit: 'Editar meta', fTitle: 'Meta', fTarget: 'Objetivo en π (opcional)',
  fSteps: 'Pasos hacia ella — uno por línea, hasta 5',
  save: 'Guardar', cancel: 'Cancelar', confirmDelete: 'Toca otra vez para borrar', reopen: 'Volver a activas',
  noTitle: 'Ponle un nombre a la meta para guardarla.', badTarget: 'El objetivo en π debe ser un número mayor que 0.',
  saveFailed: 'No se pudo guardar. No cambió nada; inténtalo de nuevo.',
  amountInvalid: 'Escribe una cantidad mayor que 0, como 5 o 2.5.', amountAmbiguous: 'Escríbelo sin coma: un punto para los decimales, como 1000 o 2.5.', amountTooLarge: 'Esa cantidad es demasiado grande.',
};

const fr: GoalsCopy = {
  priority: 'Le plus proche du but', others: 'Autres objectifs', all: 'Tous', noneInArea: 'Aucun objectif dans ce domaine.', edit: 'Modifier',
  sheetNew: 'Nouvel objectif', sheetEdit: 'Modifier l’objectif', fTitle: 'Objectif', fTarget: 'Cible en π (facultatif)',
  fSteps: 'Les étapes — une par ligne, jusqu’à 5',
  save: 'Enregistrer', cancel: 'Annuler', confirmDelete: 'Touchez encore pour supprimer', reopen: 'Remettre en cours',
  noTitle: 'Donnez un nom à l’objectif pour l’enregistrer.', badTarget: 'La cible en π doit être un nombre supérieur à 0.',
  saveFailed: 'Enregistrement impossible. Rien n’a changé — réessayez.',
  amountInvalid: 'Saisissez un montant supérieur à 0, comme 5 ou 2.5.', amountAmbiguous: 'Écrivez-le sans virgule : un point pour les décimales, comme 1000 ou 2.5.', amountTooLarge: 'Ce montant est trop élevé.',
};

const pt: GoalsCopy = {
  priority: 'Mais perto de concluir', others: 'Outras metas', all: 'Todas', noneInArea: 'Nenhuma meta nesta área.', edit: 'Editar',
  sheetNew: 'Nova meta', sheetEdit: 'Editar meta', fTitle: 'Meta', fTarget: 'Alvo em π (opcional)',
  fSteps: 'Passos até ela — um por linha, até 5',
  save: 'Salvar', cancel: 'Cancelar', confirmDelete: 'Toque de novo para excluir', reopen: 'Voltar para ativas',
  noTitle: 'Dê um nome à meta para salvá-la.', badTarget: 'O alvo em π deve ser um número maior que 0.',
  saveFailed: 'Não foi possível salvar. Nada mudou — tente de novo.',
  amountInvalid: 'Digite um valor acima de 0, como 5 ou 2.5.', amountAmbiguous: 'Escreva sem vírgula: um ponto para decimais, como 1000 ou 2.5.', amountTooLarge: 'Esse valor é grande demais.',
};

const tr: GoalsCopy = {
  priority: 'Bitmeye en yakın', others: 'Diğer hedefler', all: 'Tümü', noneInArea: 'Bu alanda hedef yok.', edit: 'Düzenle',
  sheetNew: 'Yeni hedef', sheetEdit: 'Hedefi düzenle', fTitle: 'Hedef', fTarget: 'π hedefi (isteğe bağlı)',
  fSteps: 'Adımlar — her satıra bir tane, en fazla 5',
  save: 'Kaydet', cancel: 'Vazgeç', confirmDelete: 'Silmek için tekrar dokun', reopen: 'Aktife geri al',
  noTitle: 'Kaydetmek için hedefe bir ad ver.', badTarget: 'π hedefi 0’dan büyük bir sayı olmalı.',
  saveFailed: 'Kaydedilemedi. Hiçbir şey değişmedi — tekrar dene.',
  amountInvalid: "0'dan büyük bir tutar yaz, örneğin 5 veya 2.5.", amountAmbiguous: 'Virgülsüz yaz: ondalık için nokta, örneğin 1000 veya 2.5.', amountTooLarge: 'Bu tutar çok büyük.',
};

const ru: GoalsCopy = {
  priority: 'Ближе всего к цели', others: 'Другие цели', all: 'Все', noneInArea: 'В этой области целей нет.', edit: 'Изменить',
  sheetNew: 'Новая цель', sheetEdit: 'Изменить цель', fTitle: 'Цель', fTarget: 'Сумма в π (необязательно)',
  fSteps: 'Шаги к ней — по одному в строке, до 5',
  save: 'Сохранить', cancel: 'Отмена', confirmDelete: 'Нажмите ещё раз, чтобы удалить', reopen: 'Вернуть в активные',
  noTitle: 'Дайте цели название, чтобы сохранить.', badTarget: 'Сумма в π должна быть числом больше 0.',
  saveFailed: 'Не удалось сохранить. Ничего не изменилось — попробуйте снова.',
  amountInvalid: 'Введите сумму больше 0, например 5 или 2.5.', amountAmbiguous: 'Пишите без запятой: дробная часть через точку, например 1000 или 2.5.', amountTooLarge: 'Слишком большая сумма.',
};

const hi: GoalsCopy = {
  priority: 'पूरा होने के सबसे क़रीब', others: 'बाकी लक्ष्य', all: 'सभी', noneInArea: 'इस क्षेत्र में कोई लक्ष्य नहीं।', edit: 'बदलें',
  sheetNew: 'नया लक्ष्य', sheetEdit: 'लक्ष्य बदलें', fTitle: 'लक्ष्य', fTarget: 'π लक्ष्य (वैकल्पिक)',
  fSteps: 'उस तक के कदम — हर पंक्ति में एक, अधिकतम 5',
  save: 'सहेजें', cancel: 'रद्द करें', confirmDelete: 'हटाने के लिए फिर टैप करें', reopen: 'सक्रिय में वापस',
  noTitle: 'सहेजने के लिए लक्ष्य का नाम लिखें।', badTarget: 'π लक्ष्य 0 से बड़ी संख्या होनी चाहिए।',
  saveFailed: 'सहेजा नहीं जा सका। कुछ नहीं बदला — फिर कोशिश करें।',
  amountInvalid: '0 से बड़ी राशि लिखें, जैसे 5 या 2.5।', amountAmbiguous: 'बिना कॉमा के लिखें: दशमलव के लिए बिंदु, जैसे 1000 या 2.5।', amountTooLarge: 'यह राशि बहुत बड़ी है।',
};

const id: GoalsCopy = {
  priority: 'Paling dekat selesai', others: 'Tujuan lain', all: 'Semua', noneInArea: 'Tidak ada tujuan di bidang ini.', edit: 'Ubah',
  sheetNew: 'Tujuan baru', sheetEdit: 'Ubah tujuan', fTitle: 'Tujuan', fTarget: 'Target π (opsional)',
  fSteps: 'Langkah menuju ke sana — satu per baris, maks. 5',
  save: 'Simpan', cancel: 'Batal', confirmDelete: 'Ketuk lagi untuk menghapus', reopen: 'Kembalikan ke aktif',
  noTitle: 'Beri nama tujuan untuk menyimpannya.', badTarget: 'Target π harus angka di atas 0.',
  saveFailed: 'Gagal menyimpan. Tidak ada yang berubah — coba lagi.',
  amountInvalid: 'Masukkan jumlah di atas 0, misalnya 5 atau 2.5.', amountAmbiguous: 'Tulis tanpa koma: titik untuk desimal, misalnya 1000 atau 2.5.', amountTooLarge: 'Jumlah itu terlalu besar.',
};

const vi: GoalsCopy = {
  priority: 'Gần hoàn thành nhất', others: 'Mục tiêu khác', all: 'Tất cả', noneInArea: 'Không có mục tiêu trong lĩnh vực này.', edit: 'Sửa',
  sheetNew: 'Mục tiêu mới', sheetEdit: 'Sửa mục tiêu', fTitle: 'Mục tiêu', fTarget: 'Mức π (không bắt buộc)',
  fSteps: 'Các bước — mỗi dòng một bước, tối đa 5',
  save: 'Lưu', cancel: 'Hủy', confirmDelete: 'Chạm lần nữa để xóa', reopen: 'Đưa về đang làm',
  noTitle: 'Đặt tên cho mục tiêu để lưu.', badTarget: 'Mức π phải là số lớn hơn 0.',
  saveFailed: 'Không lưu được. Chưa có gì thay đổi — hãy thử lại.',
  amountInvalid: 'Nhập số tiền lớn hơn 0, ví dụ 5 hoặc 2.5.', amountAmbiguous: 'Viết không dùng dấu phẩy: dùng dấu chấm cho phần thập phân, ví dụ 1000 hoặc 2.5.', amountTooLarge: 'Số tiền đó quá lớn.',
};

const ko: GoalsCopy = {
  priority: '완료에 가장 가까운 목표', others: '다른 목표', all: '전체', noneInArea: '이 영역에는 목표가 없어요.', edit: '수정',
  sheetNew: '새 목표', sheetEdit: '목표 수정', fTitle: '목표', fTarget: 'π 목표 금액 (선택)',
  fSteps: '목표까지의 단계 — 한 줄에 하나씩, 최대 5개',
  save: '저장', cancel: '취소', confirmDelete: '한 번 더 누르면 삭제돼요', reopen: '진행 중으로 되돌리기',
  noTitle: '저장하려면 목표 이름을 적어 주세요.', badTarget: 'π 목표 금액은 0보다 큰 숫자여야 해요.',
  saveFailed: '저장하지 못했어요. 바뀐 건 없어요 — 다시 시도해 주세요.',
  amountInvalid: '0보다 큰 금액을 입력하세요. 예: 5 또는 2.5', amountAmbiguous: '쉼표 없이 입력하세요. 소수점은 마침표로, 예: 1000 또는 2.5', amountTooLarge: '금액이 너무 커요.',
};

const zh: GoalsCopy = {
  priority: '最接近完成', others: '其他目标', all: '全部', noneInArea: '这个领域还没有目标。', edit: '编辑',
  sheetNew: '新目标', sheetEdit: '编辑目标', fTitle: '目标', fTarget: 'π 目标金额（可选）',
  fSteps: '实现它的步骤——每行一个，最多 5 个',
  save: '保存', cancel: '取消', confirmDelete: '再点一次即删除', reopen: '恢复为进行中',
  noTitle: '给目标起个名字才能保存。', badTarget: 'π 目标金额必须是大于 0 的数字。',
  saveFailed: '保存失败。没有任何更改——请重试。',
  amountInvalid: '请输入大于 0 的金额，例如 5 或 2.5。', amountAmbiguous: '请不要用逗号：小数用点号，例如 1000 或 2.5。', amountTooLarge: '金额太大。',
};

const COPY: Partial<Record<Locale, GoalsCopy>> = { en, ar, es, fr, pt, tr, ru, hi, id, vi, ko, zh };
export const goalsCopy = (locale: Locale): GoalsCopy => COPY[locale] ?? en;
