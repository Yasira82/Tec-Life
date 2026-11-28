// The words the redesign's budget in «Me» adds (A1 — owner, 2026-11-28; KB plan §4 A1), in all twelve
// languages. Everything else reuses the dictionaries' `t.life.budget` words, which the current design
// already shows. `{n}` is an amount of π, `{app}` an app's name. A missing language falls back to English.
import type { Locale } from '@/lib/i18n/locales';

export interface BudgetCopy {
  /** The section heading, `{month}` = the month's name. */
  heading: string;
  /** Under a line: what is left of the cap, and how far past it — stated in words, never by colour alone. */
  left: string; overBy: string;
  add: string; chooseApp: string; save: string; cancel: string;
  /** The aria-label of a line's remove button. */
  removeApp: string;
  /** A change the server did not accept: the list shows what is saved now. */
  saveFailed: string;
  retry: string;
  /** Where the numbers come from, under the list. */
  source: string;
}

const en: BudgetCopy = {
  heading: 'My budget — {month}', left: '{n}π left', overBy: 'Over the cap by {n}π',
  add: '+ Cap for an app', chooseApp: 'App', save: 'Save', cancel: 'Cancel', removeApp: 'Remove the cap for {app}',
  saveFailed: 'Couldn’t save that change. The list shows what is saved now.', retry: 'Try again',
  source: 'The caps are yours. Spending comes from the payment service: your completed payments only. The full cash flow is in My mirror › Month.',
};

const COPY: Partial<Record<Locale, BudgetCopy>> = {
  en,
  ar: {
    heading: 'ميزانيتي — {month}', left: 'باقي {n}π', overBy: 'تجاوزت الحد بـ {n}π',
    add: '+ حد لتطبيق', chooseApp: 'التطبيق', save: 'حفظ', cancel: 'إلغاء', removeApp: 'احذف حد {app}',
    saveFailed: 'تعذّر حفظ هذا التغيير. القائمة تعرض ما هو محفوظ الآن.', retry: 'حاول مرة أخرى',
    source: 'الحدود منك. المصروف من خدمة الدفع: مدفوعاتك المكتملة فقط. التدفق الكامل في «مرآتي › شهر».',
  },
  es: {
    heading: 'Mi presupuesto — {month}', left: 'Quedan {n}π', overBy: 'Te pasaste del límite por {n}π',
    add: '+ Límite para una app', chooseApp: 'App', save: 'Guardar', cancel: 'Cancelar', removeApp: 'Quitar el límite de {app}',
    saveFailed: 'No se pudo guardar el cambio. La lista muestra lo guardado ahora.', retry: 'Reintentar',
    source: 'Los límites son tuyos. El gasto viene del servicio de pagos: solo tus pagos completados. El flujo completo está en Mi espejo › Mes.',
  },
  fr: {
    heading: 'Mon budget — {month}', left: 'Reste {n}π', overBy: 'Plafond dépassé de {n}π',
    add: '+ Plafond pour une app', chooseApp: 'App', save: 'Enregistrer', cancel: 'Annuler', removeApp: 'Retirer le plafond de {app}',
    saveFailed: 'Impossible d’enregistrer. La liste montre ce qui est enregistré.', retry: 'Réessayer',
    source: 'Les plafonds sont les vôtres. Les dépenses viennent du service de paiement : vos paiements terminés uniquement. Le flux complet est dans Mon miroir › Mois.',
  },
  pt: {
    heading: 'Meu orçamento — {month}', left: 'Restam {n}π', overBy: 'Passou do limite em {n}π',
    add: '+ Limite para um app', chooseApp: 'App', save: 'Salvar', cancel: 'Cancelar', removeApp: 'Remover o limite de {app}',
    saveFailed: 'Não foi possível salvar. A lista mostra o que está salvo agora.', retry: 'Tentar de novo',
    source: 'Os limites são seus. Os gastos vêm do serviço de pagamentos: só seus pagamentos concluídos. O fluxo completo está em Meu espelho › Mês.',
  },
  tr: {
    heading: 'Bütçem — {month}', left: '{n}π kaldı', overBy: 'Limit {n}π aşıldı',
    add: '+ Bir uygulama için limit', chooseApp: 'Uygulama', save: 'Kaydet', cancel: 'Vazgeç', removeApp: '{app} limitini kaldır',
    saveFailed: 'Değişiklik kaydedilemedi. Liste şu an kayıtlı olanı gösteriyor.', retry: 'Tekrar dene',
    source: 'Limitler senin. Harcamalar ödeme hizmetinden gelir: yalnızca tamamlanan ödemelerin. Tam nakit akışı Aynam › Ay bölümünde.',
  },
  ru: {
    heading: 'Мой бюджет — {month}', left: 'Осталось {n}π', overBy: 'Лимит превышен на {n}π',
    add: '+ Лимит для приложения', chooseApp: 'Приложение', save: 'Сохранить', cancel: 'Отмена', removeApp: 'Убрать лимит для {app}',
    saveFailed: 'Не удалось сохранить. В списке то, что сохранено сейчас.', retry: 'Повторить',
    source: 'Лимиты ваши. Расходы — из платёжного сервиса: только завершённые платежи. Весь денежный поток — в «Моё зеркало › Месяц».',
  },
  hi: {
    heading: 'मेरा बजट — {month}', left: '{n}π बाकी', overBy: 'सीमा से {n}π ज़्यादा',
    add: '+ किसी ऐप की सीमा', chooseApp: 'ऐप', save: 'सहेजें', cancel: 'रद्द करें', removeApp: '{app} की सीमा हटाएँ',
    saveFailed: 'बदलाव सहेजा नहीं जा सका। सूची अभी सहेजा हुआ दिखाती है।', retry: 'फिर कोशिश करें',
    source: 'सीमाएँ आपकी हैं। खर्च भुगतान सेवा से आता है: सिर्फ़ आपके पूरे हुए भुगतान। पूरा नकद प्रवाह मेरा आईना › महीना में है।',
  },
  id: {
    heading: 'Anggaranku — {month}', left: 'Sisa {n}π', overBy: 'Melewati batas {n}π',
    add: '+ Batas untuk aplikasi', chooseApp: 'Aplikasi', save: 'Simpan', cancel: 'Batal', removeApp: 'Hapus batas {app}',
    saveFailed: 'Perubahan tidak tersimpan. Daftar menampilkan yang tersimpan sekarang.', retry: 'Coba lagi',
    source: 'Batas adalah milikmu. Pengeluaran dari layanan pembayaran: hanya pembayaranmu yang selesai. Arus kas lengkap ada di Cerminku › Bulan.',
  },
  vi: {
    heading: 'Ngân sách của tôi — {month}', left: 'Còn {n}π', overBy: 'Vượt hạn mức {n}π',
    add: '+ Hạn mức cho một ứng dụng', chooseApp: 'Ứng dụng', save: 'Lưu', cancel: 'Hủy', removeApp: 'Bỏ hạn mức của {app}',
    saveFailed: 'Không lưu được thay đổi. Danh sách hiển thị những gì đang được lưu.', retry: 'Thử lại',
    source: 'Hạn mức là của bạn. Chi tiêu lấy từ dịch vụ thanh toán: chỉ các khoản đã hoàn tất. Dòng tiền đầy đủ ở Tấm gương › Tháng.',
  },
  ko: {
    heading: '내 예산 — {month}', left: '{n}π 남음', overBy: '한도를 {n}π 초과',
    add: '+ 앱별 한도', chooseApp: '앱', save: '저장', cancel: '취소', removeApp: '{app} 한도 삭제',
    saveFailed: '변경을 저장하지 못했습니다. 목록은 지금 저장된 내용을 보여 줍니다.', retry: '다시 시도',
    source: '한도는 직접 정한 것입니다. 지출은 결제 서비스의 완료된 결제만 보여 줍니다. 전체 현금 흐름은 나의 거울 › 월에 있습니다.',
  },
  zh: {
    heading: '我的预算 — {month}', left: '剩余 {n}π', overBy: '超出上限 {n}π',
    add: '+ 为应用设上限', chooseApp: '应用', save: '保存', cancel: '取消', removeApp: '删除 {app} 的上限',
    saveFailed: '未能保存更改。列表显示的是当前已保存的内容。', retry: '重试',
    source: '上限由你设定。支出来自支付服务：仅限已完成的付款。完整的现金流在 我的镜子 › 月。',
  },
};

export const budgetCopy = (locale: Locale): BudgetCopy => COPY[locale] ?? en;
