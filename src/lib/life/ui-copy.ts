// The words of the cards that were still English inside every language: Pro, Invite,
// the event names in Activity, the primary-focus choices, and the π tile. One module in
// all twelve languages, like session-copy.ts; a missing key can only fall back to
// English, never to an empty string.
import type { Locale } from '@/lib/i18n/locales';

export interface UiCopy {
  ev: Record<'payment.completed' | 'order.created' | 'user.created' | 'kyc.verified', string>;
  proTagline: string; perMonth: string; upgrade: (p: number) => string;
  preparing: string; confirmInPi: string; paymentFailed: string;
  paymentReceived: string; activating: string;
  onPro: string; onProBody: string; expires: (n: number) => string; renewNote: string;
  cancel: string; cancelling: string; cancelConfirm: string; cancelFailed: string;
  inviteTitle: string; inviteAnon: string; inviteBody: string; inviteCopy: string; inviteCopied: string;
  /** The π tile's label — the number above it already carries the π. */
  tracked: string;
  focus: Record<'Saving' | 'Earning' | 'Learning' | 'Building' | 'Trading', string>;
  showWeeks: string;
}

const en: UiCopy = {
  ev: { 'payment.completed': 'Payment completed', 'order.created': 'Order placed', 'user.created': 'Joined TEC', 'kyc.verified': 'Identity verified' },
  proTagline: 'Unlimited goals · Goal Insights', perMonth: '/ month', upgrade: (p) => `Upgrade — ${p}π`,
  preparing: 'Preparing…', confirmInPi: 'Confirm in Pi…', paymentFailed: 'Payment failed. Please try again.',
  paymentReceived: 'Payment received', activating: 'Activating Life Pro… this can take a few seconds. Reopen the app if the ★ PRO badge isn’t showing yet.',
  onPro: 'You’re on Life Pro', onProBody: 'Unlimited goals, goal reminders and personal economic reports are unlocked. Thanks for supporting TEC Life.',
  expires: (n) => `Expires in ${n} day${n === 1 ? '' : 's'}`, renewNote: 'Re-subscribe to keep Pro — a one-time monthly payment, no auto-renewal.',
  cancel: 'Cancel subscription', cancelling: 'Cancelling…', cancelConfirm: 'Cancel Pro in this app? Your Pro here ends now. Other apps and the Hub plan are not affected.', cancelFailed: 'Could not cancel',
  inviteTitle: 'Invite & earn', inviteAnon: 'Sign in with Pi to get your invite link — share it and earn a reward when a friend joins.',
  inviteBody: 'You both earn when a friend joins TEC through your link.', inviteCopy: 'Copy invite link', inviteCopied: '✓ Copied',
  tracked: 'tracked',
  focus: { Saving: 'Saving', Earning: 'Earning', Learning: 'Learning', Building: 'Building', Trading: 'Trading' },
  showWeeks: 'Week by week',
};

const ar: UiCopy = {
  ev: { 'payment.completed': 'دفعة مكتملة', 'order.created': 'طلب جديد', 'user.created': 'انضممت إلى TEC', 'kyc.verified': 'تم توثيق الهوية' },
  proTagline: 'أهداف بلا حد · تحليل الأهداف', perMonth: '/ شهريًا', upgrade: (p) => `ترقية — ${p}π`,
  preparing: 'جارٍ التحضير…', confirmInPi: 'أكّد في Pi…', paymentFailed: 'لم يتم الدفع. حاول مرة أخرى.',
  paymentReceived: 'تم استلام الدفعة', activating: 'جارٍ تفعيل Life Pro… قد يستغرق ذلك ثوانيَ. أعد فتح التطبيق إن لم تظهر علامة ★ PRO.',
  onPro: 'أنت مشترك في Life Pro', onProBody: 'الأهداف بلا حد، وتذكيرات الأهداف، والتقارير الاقتصادية الشخصية مفتوحة لك. شكرًا لدعمك TEC Life.',
  expires: (n) => `ينتهي بعد ${n} ${n === 1 ? 'يوم' : n === 2 ? 'يومين' : n <= 10 ? 'أيام' : 'يومًا'}`, renewNote: 'جدّد الاشتراك لتحتفظ بـ Pro — دفعة واحدة كل شهر، بلا تجديد تلقائي.',
  cancel: 'إلغاء الاشتراك', cancelling: 'جارٍ الإلغاء…', cancelConfirm: 'إلغاء Pro في هذا التطبيق؟ ينتهي Pro هنا الآن، ولا تتأثر التطبيقات الأخرى ولا خطة الـ Hub.', cancelFailed: 'تعذّر الإلغاء',
  inviteTitle: 'ادعُ واكسب', inviteAnon: 'سجّل دخولك بـ Pi لتحصل على رابط دعوتك — شاركه واكسب مكافأة عندما ينضم صديق.',
  inviteBody: 'تكسبان معًا عندما ينضم صديق إلى TEC عبر رابطك.', inviteCopy: 'انسخ رابط الدعوة', inviteCopied: '✓ تم النسخ',
  tracked: 'متتبَّع',
  focus: { Saving: 'الادخار', Earning: 'الكسب', Learning: 'التعلّم', Building: 'البناء', Trading: 'التجارة' },
  showWeeks: 'أسبوعًا بأسبوع',
};

const es: UiCopy = {
  ev: { 'payment.completed': 'Pago completado', 'order.created': 'Pedido realizado', 'user.created': 'Te uniste a TEC', 'kyc.verified': 'Identidad verificada' },
  proTagline: 'Metas ilimitadas · Análisis de metas', perMonth: '/ mes', upgrade: (p) => `Mejorar — ${p}π`,
  preparing: 'Preparando…', confirmInPi: 'Confirma en Pi…', paymentFailed: 'El pago falló. Inténtalo de nuevo.',
  paymentReceived: 'Pago recibido', activating: 'Activando Life Pro… puede tardar unos segundos. Vuelve a abrir la app si aún no ves ★ PRO.',
  onPro: 'Tienes Life Pro', onProBody: 'Metas ilimitadas, recordatorios y reportes económicos personales desbloqueados. Gracias por apoyar TEC Life.',
  expires: (n) => `Vence en ${n} día${n === 1 ? '' : 's'}`, renewNote: 'Vuelve a suscribirte para mantener Pro — un pago mensual único, sin renovación automática.',
  cancel: 'Cancelar suscripción', cancelling: 'Cancelando…', cancelConfirm: '¿Cancelar Pro en esta app? Tu Pro aquí termina ahora. Otras apps y el plan del Hub no cambian.', cancelFailed: 'No se pudo cancelar',
  inviteTitle: 'Invita y gana', inviteAnon: 'Inicia sesión con Pi para obtener tu enlace — compártelo y gana una recompensa cuando un amigo se una.',
  inviteBody: 'Ambos ganan cuando un amigo se une a TEC con tu enlace.', inviteCopy: 'Copiar enlace de invitación', inviteCopied: '✓ Copiado',
  tracked: 'registrados',
  focus: { Saving: 'Ahorrar', Earning: 'Ganar', Learning: 'Aprender', Building: 'Construir', Trading: 'Comerciar' },
  showWeeks: 'Semana a semana',
};

const fr: UiCopy = {
  ev: { 'payment.completed': 'Paiement effectué', 'order.created': 'Commande passée', 'user.created': 'Inscription à TEC', 'kyc.verified': 'Identité vérifiée' },
  proTagline: 'Objectifs illimités · Analyse des objectifs', perMonth: '/ mois', upgrade: (p) => `Passer à Pro — ${p}π`,
  preparing: 'Préparation…', confirmInPi: 'Confirmez dans Pi…', paymentFailed: 'Le paiement a échoué. Réessayez.',
  paymentReceived: 'Paiement reçu', activating: 'Activation de Life Pro… quelques secondes. Rouvrez l’app si le badge ★ PRO n’apparaît pas encore.',
  onPro: 'Vous êtes sur Life Pro', onProBody: 'Objectifs illimités, rappels et rapports économiques personnels débloqués. Merci de soutenir TEC Life.',
  expires: (n) => `Expire dans ${n} jour${n === 1 ? '' : 's'}`, renewNote: 'Réabonnez-vous pour garder Pro — un paiement mensuel unique, sans renouvellement automatique.',
  cancel: 'Annuler l’abonnement', cancelling: 'Annulation…', cancelConfirm: 'Annuler Pro dans cette app ? Votre Pro ici s’arrête maintenant. Les autres apps et le plan du Hub ne changent pas.', cancelFailed: 'Annulation impossible',
  inviteTitle: 'Invitez et gagnez', inviteAnon: 'Connectez-vous avec Pi pour obtenir votre lien — partagez-le et gagnez une récompense quand un ami rejoint.',
  inviteBody: 'Vous gagnez tous les deux quand un ami rejoint TEC avec votre lien.', inviteCopy: 'Copier le lien d’invitation', inviteCopied: '✓ Copié',
  tracked: 'suivis',
  focus: { Saving: 'Épargner', Earning: 'Gagner', Learning: 'Apprendre', Building: 'Construire', Trading: 'Commercer' },
  showWeeks: 'Semaine par semaine',
};

const pt: UiCopy = {
  ev: { 'payment.completed': 'Pagamento concluído', 'order.created': 'Pedido feito', 'user.created': 'Entrou no TEC', 'kyc.verified': 'Identidade verificada' },
  proTagline: 'Metas ilimitadas · Análise de metas', perMonth: '/ mês', upgrade: (p) => `Fazer upgrade — ${p}π`,
  preparing: 'Preparando…', confirmInPi: 'Confirme no Pi…', paymentFailed: 'O pagamento falhou. Tente de novo.',
  paymentReceived: 'Pagamento recebido', activating: 'Ativando o Life Pro… pode levar alguns segundos. Reabra o app se o selo ★ PRO ainda não aparecer.',
  onPro: 'Você tem o Life Pro', onProBody: 'Metas ilimitadas, lembretes e relatórios econômicos pessoais liberados. Obrigado por apoiar o TEC Life.',
  expires: (n) => `Expira em ${n} dia${n === 1 ? '' : 's'}`, renewNote: 'Assine de novo para manter o Pro — um pagamento mensal único, sem renovação automática.',
  cancel: 'Cancelar assinatura', cancelling: 'Cancelando…', cancelConfirm: 'Cancelar o Pro neste app? Seu Pro aqui termina agora. Outros apps e o plano do Hub não mudam.', cancelFailed: 'Não foi possível cancelar',
  inviteTitle: 'Convide e ganhe', inviteAnon: 'Entre com o Pi para obter seu link — compartilhe e ganhe uma recompensa quando um amigo entrar.',
  inviteBody: 'Vocês dois ganham quando um amigo entra no TEC pelo seu link.', inviteCopy: 'Copiar link de convite', inviteCopied: '✓ Copiado',
  tracked: 'registrados',
  focus: { Saving: 'Poupar', Earning: 'Ganhar', Learning: 'Aprender', Building: 'Construir', Trading: 'Negociar' },
  showWeeks: 'Semana a semana',
};

const tr: UiCopy = {
  ev: { 'payment.completed': 'Ödeme tamamlandı', 'order.created': 'Sipariş verildi', 'user.created': 'TEC’e katıldın', 'kyc.verified': 'Kimlik doğrulandı' },
  proTagline: 'Sınırsız hedef · Hedef analizi', perMonth: '/ ay', upgrade: (p) => `Yükselt — ${p}π`,
  preparing: 'Hazırlanıyor…', confirmInPi: 'Pi’de onayla…', paymentFailed: 'Ödeme başarısız. Tekrar dene.',
  paymentReceived: 'Ödeme alındı', activating: 'Life Pro etkinleştiriliyor… birkaç saniye sürebilir. ★ PRO rozeti görünmüyorsa uygulamayı yeniden aç.',
  onPro: 'Life Pro’dasın', onProBody: 'Sınırsız hedef, hatırlatmalar ve kişisel ekonomik raporlar açık. TEC Life’ı desteklediğin için teşekkürler.',
  expires: (n) => `${n} gün sonra bitiyor`, renewNote: 'Pro’yu korumak için yeniden abone ol — ayda bir tek ödeme, otomatik yenileme yok.',
  cancel: 'Aboneliği iptal et', cancelling: 'İptal ediliyor…', cancelConfirm: 'Bu uygulamada Pro iptal edilsin mi? Buradaki Pro şimdi biter. Diğer uygulamalar ve Hub planı etkilenmez.', cancelFailed: 'İptal edilemedi',
  inviteTitle: 'Davet et, kazan', inviteAnon: 'Davet bağlantını almak için Pi ile giriş yap — paylaş, bir arkadaşın katılınca ödül kazan.',
  inviteBody: 'Bir arkadaşın bağlantınla TEC’e katılınca ikiniz de kazanırsınız.', inviteCopy: 'Davet bağlantısını kopyala', inviteCopied: '✓ Kopyalandı',
  tracked: 'takip edilen',
  focus: { Saving: 'Birikim', Earning: 'Kazanç', Learning: 'Öğrenme', Building: 'İnşa', Trading: 'Ticaret' },
  showWeeks: 'Hafta hafta',
};

const ru: UiCopy = {
  ev: { 'payment.completed': 'Платёж выполнен', 'order.created': 'Заказ оформлен', 'user.created': 'Вы присоединились к TEC', 'kyc.verified': 'Личность подтверждена' },
  proTagline: 'Безлимит целей · Анализ целей', perMonth: '/ месяц', upgrade: (p) => `Перейти на Pro — ${p}π`,
  preparing: 'Подготовка…', confirmInPi: 'Подтвердите в Pi…', paymentFailed: 'Платёж не прошёл. Попробуйте снова.',
  paymentReceived: 'Платёж получен', activating: 'Активируем Life Pro… это займёт несколько секунд. Откройте приложение заново, если значок ★ PRO не появился.',
  onPro: 'У вас Life Pro', onProBody: 'Безлимит целей, напоминания и личные экономические отчёты открыты. Спасибо за поддержку TEC Life.',
  expires: (n) => `Истекает через ${n} дн.`, renewNote: 'Оформите подписку снова, чтобы сохранить Pro — разовый ежемесячный платёж, без автопродления.',
  cancel: 'Отменить подписку', cancelling: 'Отмена…', cancelConfirm: 'Отменить Pro в этом приложении? Pro здесь закончится сейчас. Другие приложения и план Hub не затронуты.', cancelFailed: 'Не удалось отменить',
  inviteTitle: 'Приглашайте и зарабатывайте', inviteAnon: 'Войдите через Pi, чтобы получить ссылку — поделитесь ею и получите награду, когда друг присоединится.',
  inviteBody: 'Вы оба получаете награду, когда друг присоединяется к TEC по вашей ссылке.', inviteCopy: 'Копировать ссылку', inviteCopied: '✓ Скопировано',
  tracked: 'отслежено',
  focus: { Saving: 'Сбережения', Earning: 'Заработок', Learning: 'Учёба', Building: 'Создание', Trading: 'Торговля' },
  showWeeks: 'По неделям',
};

const id: UiCopy = {
  ev: { 'payment.completed': 'Pembayaran selesai', 'order.created': 'Pesanan dibuat', 'user.created': 'Bergabung dengan TEC', 'kyc.verified': 'Identitas terverifikasi' },
  proTagline: 'Tujuan tanpa batas · Analisis tujuan', perMonth: '/ bulan', upgrade: (p) => `Tingkatkan — ${p}π`,
  preparing: 'Menyiapkan…', confirmInPi: 'Konfirmasi di Pi…', paymentFailed: 'Pembayaran gagal. Coba lagi.',
  paymentReceived: 'Pembayaran diterima', activating: 'Mengaktifkan Life Pro… butuh beberapa detik. Buka ulang aplikasi jika lencana ★ PRO belum muncul.',
  onPro: 'Kamu pengguna Life Pro', onProBody: 'Tujuan tanpa batas, pengingat, dan laporan ekonomi pribadi terbuka. Terima kasih telah mendukung TEC Life.',
  expires: (n) => `Berakhir dalam ${n} hari`, renewNote: 'Berlangganan lagi untuk mempertahankan Pro — satu pembayaran bulanan, tanpa perpanjangan otomatis.',
  cancel: 'Batalkan langganan', cancelling: 'Membatalkan…', cancelConfirm: 'Batalkan Pro di aplikasi ini? Pro di sini berakhir sekarang. Aplikasi lain dan paket Hub tidak terpengaruh.', cancelFailed: 'Tidak bisa membatalkan',
  inviteTitle: 'Undang & dapatkan', inviteAnon: 'Masuk dengan Pi untuk mendapatkan tautan undangan — bagikan dan dapatkan hadiah saat teman bergabung.',
  inviteBody: 'Kalian berdua dapat hadiah saat teman bergabung ke TEC lewat tautanmu.', inviteCopy: 'Salin tautan undangan', inviteCopied: '✓ Disalin',
  tracked: 'tercatat',
  focus: { Saving: 'Menabung', Earning: 'Menghasilkan', Learning: 'Belajar', Building: 'Membangun', Trading: 'Berdagang' },
  showWeeks: 'Per minggu',
};

const vi: UiCopy = {
  ev: { 'payment.completed': 'Thanh toán hoàn tất', 'order.created': 'Đã đặt hàng', 'user.created': 'Đã tham gia TEC', 'kyc.verified': 'Đã xác minh danh tính' },
  proTagline: 'Mục tiêu không giới hạn · Phân tích mục tiêu', perMonth: '/ tháng', upgrade: (p) => `Nâng cấp — ${p}π`,
  preparing: 'Đang chuẩn bị…', confirmInPi: 'Xác nhận trong Pi…', paymentFailed: 'Thanh toán thất bại. Hãy thử lại.',
  paymentReceived: 'Đã nhận thanh toán', activating: 'Đang kích hoạt Life Pro… có thể mất vài giây. Mở lại ứng dụng nếu chưa thấy huy hiệu ★ PRO.',
  onPro: 'Bạn đang dùng Life Pro', onProBody: 'Mục tiêu không giới hạn, nhắc nhở và báo cáo kinh tế cá nhân đã mở. Cảm ơn bạn đã ủng hộ TEC Life.',
  expires: (n) => `Hết hạn sau ${n} ngày`, renewNote: 'Đăng ký lại để giữ Pro — một lần thanh toán mỗi tháng, không tự gia hạn.',
  cancel: 'Hủy đăng ký', cancelling: 'Đang hủy…', cancelConfirm: 'Hủy Pro trong ứng dụng này? Pro ở đây kết thúc ngay. Các ứng dụng khác và gói Hub không bị ảnh hưởng.', cancelFailed: 'Không thể hủy',
  inviteTitle: 'Mời & nhận thưởng', inviteAnon: 'Đăng nhập bằng Pi để lấy liên kết mời — chia sẻ và nhận thưởng khi bạn bè tham gia.',
  inviteBody: 'Cả hai cùng nhận thưởng khi bạn bè tham gia TEC qua liên kết của bạn.', inviteCopy: 'Sao chép liên kết mời', inviteCopied: '✓ Đã sao chép',
  tracked: 'đã theo dõi',
  focus: { Saving: 'Tiết kiệm', Earning: 'Kiếm tiền', Learning: 'Học tập', Building: 'Xây dựng', Trading: 'Giao dịch' },
  showWeeks: 'Theo từng tuần',
};

const ko: UiCopy = {
  ev: { 'payment.completed': '결제 완료', 'order.created': '주문 완료', 'user.created': 'TEC 가입', 'kyc.verified': '본인 인증 완료' },
  proTagline: '무제한 목표 · 목표 분석', perMonth: '/ 월', upgrade: (p) => `업그레이드 — ${p}π`,
  preparing: '준비 중…', confirmInPi: 'Pi에서 확인하세요…', paymentFailed: '결제에 실패했어요. 다시 시도해 주세요.',
  paymentReceived: '결제 완료', activating: 'Life Pro를 활성화하는 중… 몇 초 걸릴 수 있어요. ★ PRO 배지가 안 보이면 앱을 다시 여세요.',
  onPro: 'Life Pro 이용 중', onProBody: '무제한 목표, 목표 알림, 개인 경제 리포트가 열렸어요. TEC Life를 응원해 주셔서 감사해요.',
  expires: (n) => `${n}일 후 만료`, renewNote: 'Pro를 유지하려면 다시 구독하세요 — 매달 한 번 결제, 자동 갱신 없음.',
  cancel: '구독 취소', cancelling: '취소 중…', cancelConfirm: '이 앱의 Pro를 취소할까요? 여기의 Pro는 지금 끝나요. 다른 앱과 Hub 요금제는 영향이 없어요.', cancelFailed: '취소하지 못했어요',
  inviteTitle: '초대하고 받기', inviteAnon: 'Pi로 로그인해 초대 링크를 받으세요 — 공유하고 친구가 가입하면 보상을 받아요.',
  inviteBody: '친구가 내 링크로 TEC에 가입하면 둘 다 보상을 받아요.', inviteCopy: '초대 링크 복사', inviteCopied: '✓ 복사됨',
  tracked: '기록됨',
  focus: { Saving: '저축', Earning: '수입', Learning: '학습', Building: '만들기', Trading: '거래' },
  showWeeks: '주별 보기',
};

const hi: UiCopy = {
  ev: { 'payment.completed': 'भुगतान पूरा', 'order.created': 'ऑर्डर दिया गया', 'user.created': 'TEC से जुड़े', 'kyc.verified': 'पहचान सत्यापित' },
  proTagline: 'असीमित लक्ष्य · लक्ष्य विश्लेषण', perMonth: '/ महीना', upgrade: (p) => `अपग्रेड करें — ${p}π`,
  preparing: 'तैयारी हो रही है…', confirmInPi: 'Pi में पुष्टि करें…', paymentFailed: 'भुगतान नहीं हुआ। फिर से कोशिश करें।',
  paymentReceived: 'भुगतान मिल गया', activating: 'Life Pro चालू हो रहा है… कुछ सेकंड लग सकते हैं। ★ PRO बैज न दिखे तो ऐप फिर से खोलें।',
  onPro: 'आप Life Pro पर हैं', onProBody: 'असीमित लक्ष्य, रिमाइंडर और निजी आर्थिक रिपोर्ट खुल गई हैं। TEC Life का साथ देने के लिए धन्यवाद।',
  expires: (n) => `${n} दिन में समाप्त`, renewNote: 'Pro बनाए रखने के लिए फिर से सदस्यता लें — हर महीने एक बार भुगतान, अपने-आप नवीनीकरण नहीं।',
  cancel: 'सदस्यता रद्द करें', cancelling: 'रद्द हो रहा है…', cancelConfirm: 'इस ऐप में Pro रद्द करें? यहाँ आपका Pro अभी खत्म होगा। दूसरे ऐप और Hub प्लान पर असर नहीं।', cancelFailed: 'रद्द नहीं हो सका',
  inviteTitle: 'बुलाएँ और कमाएँ', inviteAnon: 'अपना आमंत्रण लिंक पाने के लिए Pi से साइन इन करें — शेयर करें और दोस्त के जुड़ने पर इनाम पाएँ।',
  inviteBody: 'आपके लिंक से दोस्त TEC से जुड़े तो दोनों को इनाम मिलता है।', inviteCopy: 'आमंत्रण लिंक कॉपी करें', inviteCopied: '✓ कॉपी हो गया',
  tracked: 'दर्ज',
  focus: { Saving: 'बचत', Earning: 'कमाई', Learning: 'सीखना', Building: 'बनाना', Trading: 'व्यापार' },
  showWeeks: 'हफ़्ते-दर-हफ़्ते',
};

const zh: UiCopy = {
  ev: { 'payment.completed': '付款完成', 'order.created': '已下单', 'user.created': '加入 TEC', 'kyc.verified': '身份已验证' },
  proTagline: '无限目标 · 目标分析', perMonth: '/ 月', upgrade: (p) => `升级 — ${p}π`,
  preparing: '准备中…', confirmInPi: '请在 Pi 中确认…', paymentFailed: '付款失败，请重试。',
  paymentReceived: '已收到付款', activating: '正在开通 Life Pro… 可能需要几秒。如果还没看到 ★ PRO 标记，请重新打开应用。',
  onPro: '你已开通 Life Pro', onProBody: '无限目标、目标提醒和个人经济报告已解锁。感谢支持 TEC Life。',
  expires: (n) => `${n} 天后到期`, renewNote: '重新订阅即可保留 Pro — 每月一次性付款，不会自动续费。',
  cancel: '取消订阅', cancelling: '正在取消…', cancelConfirm: '在此应用中取消 Pro？此处的 Pro 将立即结束，其他应用和 Hub 方案不受影响。', cancelFailed: '无法取消',
  inviteTitle: '邀请赚奖励', inviteAnon: '用 Pi 登录获取你的邀请链接 — 分享出去，朋友加入后即可获得奖励。',
  inviteBody: '朋友通过你的链接加入 TEC，你们都能获得奖励。', inviteCopy: '复制邀请链接', inviteCopied: '✓ 已复制',
  tracked: '已记录',
  focus: { Saving: '储蓄', Earning: '赚钱', Learning: '学习', Building: '创造', Trading: '交易' },
  showWeeks: '按周查看',
};

const COPY: Record<Locale, UiCopy> = { en, ar, es, fr, pt, tr, ru, id, vi, ko, hi, zh };

export function uiCopy(locale: Locale): UiCopy {
  return COPY[locale] ?? en;
}
