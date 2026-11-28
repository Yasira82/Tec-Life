// The words of the redesign's «My mirror» (Phase 1), in all twelve languages. A missing language
// falls back to English. `{n}` is a number.
import type { Locale } from '@/lib/i18n/locales';

export interface MirrorCopy {
  period: { week: string; month: string; m3: string };
  periodLabel: string;
  q1: string; q2: string; q3: string;
  sDays: string; sGoals: string; sSummaries: string; sSteps: string;
  only14: string; weekDots: string; atLeast: string; journeyOff: string; source: string;
  notEnough: string; gateTitle: string; gRecords: string; gDays: string; gSpan: string; have: string;
  ownTitle: string; ownNote: string; noLessons: string;
  records: string; kSummary: string; kDone: string; kPartly: string;
  nowStep: string; noStep: string; talk: string; stepOff: string;
  failed: string; retry: string;
}

const en: MirrorCopy = {
  period: { week: 'Week', month: 'Month', m3: '3 months' }, periodLabel: 'Period',
  q1: 'What happened?', q2: 'What did I learn?', q3: 'What’s next?',
  sDays: 'Days you logged progress', sGoals: 'Goals finished', sSummaries: 'Summaries kept', sSteps: 'Days you fully did your step',
  only14: 'Life keeps this for the last 14 days only, so it shows under “Week” only.',
  weekDots: 'Your step, last 7 days', atLeast: 'at least {n}',
  journeyOff: 'Your journey isn’t kept, so summaries and steps don’t show here.',
  source: 'Every number here comes from Life itself, counted over the whole period.',
  notEnough: 'There isn’t enough data yet to draw a reliable reading.',
  gateTitle: 'Something is read from your records once there are:',
  gRecords: '{n} or more steps or summaries', gDays: 'on {n} or more different days', gSpan: 'over {n} or more days', have: 'you have {n}',
  ownTitle: 'What you said helped',
  ownNote: 'In your own words, from the summaries you kept. Not a reading by the coach.',
  noLessons: 'Your kept summaries in this period don’t record what helped yet.',
  records: 'See the records ({n})', kSummary: 'Summary', kDone: 'Step done', kPartly: 'Step partly done',
  nowStep: 'Your current step', noStep: 'No step right now. Your coach can help you pick a small one.',
  talk: 'Talk to your coach', stepOff: 'Your step shows here while your journey is kept.',
  failed: 'This part didn’t load. The rest works as usual.', retry: 'Try again',
};

const ar: MirrorCopy = {
  period: { week: 'أسبوع', month: 'شهر', m3: '٣ أشهر' }, periodLabel: 'الفترة',
  q1: 'ماذا حدث؟', q2: 'ماذا تعلّمت؟', q3: 'ما التالي؟',
  sDays: 'أيام سجّلت فيها تقدّمًا', sGoals: 'أهداف أنجزتها', sSummaries: 'ملخصات محفوظة', sSteps: 'أيام نفّذت فيها خطوتك كاملة',
  only14: 'تحتفظ Life بهذا لآخر ١٤ يومًا فقط، لذلك يظهر في «أسبوع» فقط.',
  weekDots: 'خطوتك في آخر ٧ أيام', atLeast: '{n} على الأقل',
  journeyOff: 'رحلتك غير محفوظة، لذلك لا تظهر الملخصات والخطوات هنا.',
  source: 'كل رقم هنا من Life نفسها، محسوب على الفترة كلها.',
  notEnough: 'لا توجد بيانات كافية بعد لاستخلاص قراءة موثوقة.',
  gateTitle: 'نقرأ من سجلاتك عندما يتوفر:',
  gRecords: '{n} خطوات أو ملخصات أو أكثر', gDays: 'في {n} أيام مختلفة أو أكثر', gSpan: 'على مدى {n} يومًا أو أكثر', have: 'لديك {n}',
  ownTitle: 'ما قلتَ إنه ساعدك',
  ownNote: 'بكلماتك أنت، من الملخصات التي حفظتها. ليست قراءة من المدرب.',
  noLessons: 'ملخصاتك المحفوظة في هذه الفترة لا تذكر بعدُ ما ساعدك.',
  records: 'اعرض السجلات ({n})', kSummary: 'ملخص', kDone: 'خطوة منفّذة', kPartly: 'خطوة منفّذة جزئيًا',
  nowStep: 'خطوتك الحالية', noStep: 'لا توجد خطوة الآن. يمكن لمدربك أن يساعدك على اختيار خطوة صغيرة.',
  talk: 'تحدّث مع مدربك', stepOff: 'تظهر خطوتك هنا ما دامت رحلتك محفوظة.',
  failed: 'تعذّر تحميل هذا الجزء. بقية الشاشة تعمل كالمعتاد.', retry: 'حاول مرة أخرى',
};

const es: MirrorCopy = {
  period: { week: 'Semana', month: 'Mes', m3: '3 meses' }, periodLabel: 'Periodo',
  q1: '¿Qué pasó?', q2: '¿Qué aprendí?', q3: '¿Qué sigue?',
  sDays: 'Días en que registraste avance', sGoals: 'Metas terminadas', sSummaries: 'Resúmenes guardados', sSteps: 'Días en que hiciste tu paso completo',
  only14: 'Life guarda esto solo de los últimos 14 días, así que aparece solo en «Semana».',
  weekDots: 'Tu paso, últimos 7 días', atLeast: 'al menos {n}',
  journeyOff: 'Tu recorrido no se guarda, así que aquí no aparecen resúmenes ni pasos.',
  source: 'Cada número viene de Life, contado sobre todo el periodo.',
  notEnough: 'Todavía no hay datos suficientes para una lectura fiable.',
  gateTitle: 'Se lee algo de tus registros cuando hay:',
  gRecords: '{n} o más pasos o resúmenes', gDays: 'en {n} o más días distintos', gSpan: 'a lo largo de {n} o más días', have: 'tienes {n}',
  ownTitle: 'Lo que dijiste que te ayudó',
  ownNote: 'Con tus palabras, de los resúmenes que guardaste. No es una lectura del coach.',
  noLessons: 'Tus resúmenes de este periodo aún no dicen qué te ayudó.',
  records: 'Ver los registros ({n})', kSummary: 'Resumen', kDone: 'Paso hecho', kPartly: 'Paso hecho en parte',
  nowStep: 'Tu paso actual', noStep: 'Ahora no hay paso. Tu coach puede ayudarte a elegir uno pequeño.',
  talk: 'Habla con tu coach', stepOff: 'Tu paso aparece aquí mientras se guarde tu recorrido.',
  failed: 'Esta parte no cargó. El resto funciona como siempre.', retry: 'Reintentar',
};

const fr: MirrorCopy = {
  period: { week: 'Semaine', month: 'Mois', m3: '3 mois' }, periodLabel: 'Période',
  q1: 'Que s’est-il passé ?', q2: 'Qu’ai-je appris ?', q3: 'Et ensuite ?',
  sDays: 'Jours avec un progrès noté', sGoals: 'Objectifs terminés', sSummaries: 'Résumés conservés', sSteps: 'Jours où vous avez fait votre pas en entier',
  only14: 'Life ne garde cela que pour les 14 derniers jours : visible seulement dans « Semaine ».',
  weekDots: 'Votre pas, 7 derniers jours', atLeast: 'au moins {n}',
  journeyOff: 'Votre parcours n’est pas conservé : résumés et pas n’apparaissent pas ici.',
  source: 'Chaque nombre vient de Life, compté sur toute la période.',
  notEnough: 'Pas encore assez de données pour une lecture fiable.',
  gateTitle: 'On lit vos données quand il y a :',
  gRecords: '{n} pas ou résumés ou plus', gDays: 'sur {n} jours différents ou plus', gSpan: 'sur une durée de {n} jours ou plus', have: 'vous en avez {n}',
  ownTitle: 'Ce qui vous a aidé, selon vous',
  ownNote: 'Vos propres mots, tirés des résumés conservés. Pas une lecture du coach.',
  noLessons: 'Vos résumés de cette période ne disent pas encore ce qui a aidé.',
  records: 'Voir les éléments ({n})', kSummary: 'Résumé', kDone: 'Pas fait', kPartly: 'Pas fait en partie',
  nowStep: 'Votre pas actuel', noStep: 'Pas de pas pour l’instant. Votre coach peut vous aider à en choisir un petit.',
  talk: 'Parler à votre coach', stepOff: 'Votre pas s’affiche ici tant que votre parcours est conservé.',
  failed: 'Cette partie ne s’est pas chargée. Le reste fonctionne normalement.', retry: 'Réessayer',
};

const pt: MirrorCopy = {
  period: { week: 'Semana', month: 'Mês', m3: '3 meses' }, periodLabel: 'Período',
  q1: 'O que aconteceu?', q2: 'O que aprendi?', q3: 'E agora?',
  sDays: 'Dias em que registrou progresso', sGoals: 'Metas concluídas', sSummaries: 'Resumos guardados', sSteps: 'Dias em que fez seu passo por inteiro',
  only14: 'O Life guarda isso só dos últimos 14 dias, por isso aparece só em «Semana».',
  weekDots: 'Seu passo, últimos 7 dias', atLeast: 'pelo menos {n}',
  journeyOff: 'Sua jornada não é guardada, então resumos e passos não aparecem aqui.',
  source: 'Cada número vem do próprio Life, contado no período todo.',
  notEnough: 'Ainda não há dados suficientes para uma leitura confiável.',
  gateTitle: 'Algo é lido dos seus registros quando houver:',
  gRecords: '{n} ou mais passos ou resumos', gDays: 'em {n} ou mais dias diferentes', gSpan: 'ao longo de {n} ou mais dias', have: 'você tem {n}',
  ownTitle: 'O que você disse que ajudou',
  ownNote: 'Com suas palavras, dos resumos que guardou. Não é uma leitura do coach.',
  noLessons: 'Seus resumos deste período ainda não dizem o que ajudou.',
  records: 'Ver os registros ({n})', kSummary: 'Resumo', kDone: 'Passo feito', kPartly: 'Passo feito em parte',
  nowStep: 'Seu passo atual', noStep: 'Nenhum passo agora. Seu coach pode ajudar a escolher um pequeno.',
  talk: 'Fale com seu coach', stepOff: 'Seu passo aparece aqui enquanto sua jornada for guardada.',
  failed: 'Esta parte não carregou. O resto funciona normalmente.', retry: 'Tentar de novo',
};

const tr: MirrorCopy = {
  period: { week: 'Hafta', month: 'Ay', m3: '3 ay' }, periodLabel: 'Dönem',
  q1: 'Ne oldu?', q2: 'Ne öğrendim?', q3: 'Sırada ne var?',
  sDays: 'İlerleme kaydettiğin günler', sGoals: 'Biten hedefler', sSummaries: 'Saklanan özetler', sSteps: 'Adımını tamamen attığın günler',
  only14: 'Life bunu yalnızca son 14 gün için saklar, bu yüzden yalnızca «Hafta»da görünür.',
  weekDots: 'Adımın, son 7 gün', atLeast: 'en az {n}',
  journeyOff: 'Yolculuğun saklanmıyor, bu yüzden özetler ve adımlar burada görünmez.',
  source: 'Buradaki her sayı Life’ın kendisinden, tüm dönem boyunca sayılır.',
  notEnough: 'Güvenilir bir okuma için henüz yeterli veri yok.',
  gateTitle: 'Kayıtlarından şunlar olduğunda okunur:',
  gRecords: '{n} veya daha fazla adım ya da özet', gDays: '{n} veya daha fazla farklı günde', gSpan: '{n} veya daha fazla güne yayılmış', have: 'sende {n}',
  ownTitle: 'Sana yardım ettiğini söylediklerin',
  ownNote: 'Sakladığın özetlerden, kendi sözlerinle. Koçun bir okuması değil.',
  noLessons: 'Bu dönemdeki özetlerin henüz neyin yardım ettiğini yazmıyor.',
  records: 'Kayıtları gör ({n})', kSummary: 'Özet', kDone: 'Adım atıldı', kPartly: 'Adım kısmen atıldı',
  nowStep: 'Şu anki adımın', noStep: 'Şu an bir adım yok. Koçun küçük bir adım seçmene yardım edebilir.',
  talk: 'Koçunla konuş', stepOff: 'Yolculuğun saklandığı sürece adımın burada görünür.',
  failed: 'Bu bölüm yüklenemedi. Gerisi her zamanki gibi çalışıyor.', retry: 'Tekrar dene',
};

const ru: MirrorCopy = {
  period: { week: 'Неделя', month: 'Месяц', m3: '3 месяца' }, periodLabel: 'Период',
  q1: 'Что произошло?', q2: 'Чему я научился?', q3: 'Что дальше?',
  sDays: 'Дни, когда вы отмечали прогресс', sGoals: 'Завершённые цели', sSummaries: 'Сохранённые резюме', sSteps: 'Дни, когда вы сделали шаг полностью',
  only14: 'Life хранит это только за последние 14 дней, поэтому видно только в «Неделе».',
  weekDots: 'Ваш шаг, последние 7 дней', atLeast: 'не менее {n}',
  journeyOff: 'Ваш путь не сохраняется, поэтому резюме и шаги здесь не видны.',
  source: 'Каждое число здесь — из самого Life, за весь период.',
  notEnough: 'Пока недостаточно данных для надёжного вывода.',
  gateTitle: 'Из ваших записей что-то читается, когда есть:',
  gRecords: '{n} или больше шагов или резюме', gDays: 'в {n} или больше разных дней', gSpan: 'на протяжении {n} или больше дней', have: 'у вас {n}',
  ownTitle: 'Что, по вашим словам, помогло',
  ownNote: 'Вашими словами, из сохранённых резюме. Это не вывод коуча.',
  noLessons: 'В резюме за этот период пока не записано, что помогло.',
  records: 'Показать записи ({n})', kSummary: 'Резюме', kDone: 'Шаг сделан', kPartly: 'Шаг сделан частично',
  nowStep: 'Ваш текущий шаг', noStep: 'Сейчас шага нет. Коуч поможет выбрать небольшой.',
  talk: 'Поговорить с коучем', stepOff: 'Шаг виден здесь, пока ваш путь сохраняется.',
  failed: 'Эта часть не загрузилась. Остальное работает как обычно.', retry: 'Повторить',
};

const hi: MirrorCopy = {
  period: { week: 'सप्ताह', month: 'महीना', m3: '3 महीने' }, periodLabel: 'अवधि',
  q1: 'क्या हुआ?', q2: 'मैंने क्या सीखा?', q3: 'आगे क्या?',
  sDays: 'जिन दिनों आपने प्रगति दर्ज की', sGoals: 'पूरे हुए लक्ष्य', sSummaries: 'सहेजे गए सारांश', sSteps: 'जिन दिनों आपने अपना कदम पूरा उठाया',
  only14: 'Life इसे केवल पिछले 14 दिनों के लिए रखता है, इसलिए यह केवल «सप्ताह» में दिखता है।',
  weekDots: 'आपका कदम, पिछले 7 दिन', atLeast: 'कम से कम {n}',
  journeyOff: 'आपकी यात्रा सहेजी नहीं जा रही, इसलिए सारांश और कदम यहाँ नहीं दिखते।',
  source: 'यहाँ हर संख्या Life से ही है, पूरी अवधि में गिनी गई।',
  notEnough: 'भरोसेमंद निष्कर्ष के लिए अभी पर्याप्त डेटा नहीं है।',
  gateTitle: 'आपके रिकॉर्ड से तब पढ़ा जाता है जब हों:',
  gRecords: '{n} या अधिक कदम या सारांश', gDays: '{n} या अधिक अलग-अलग दिनों में', gSpan: '{n} या अधिक दिनों में फैले', have: 'आपके पास {n}',
  ownTitle: 'आपने जो कहा कि मदद मिली',
  ownNote: 'आपके अपने शब्दों में, सहेजे गए सारांशों से। यह कोच का निष्कर्ष नहीं है।',
  noLessons: 'इस अवधि के सारांशों में अभी यह दर्ज नहीं कि क्या मदद मिली।',
  records: 'रिकॉर्ड देखें ({n})', kSummary: 'सारांश', kDone: 'कदम उठाया', kPartly: 'कदम आंशिक रूप से उठाया',
  nowStep: 'आपका मौजूदा कदम', noStep: 'अभी कोई कदम नहीं। आपका कोच एक छोटा कदम चुनने में मदद कर सकता है।',
  talk: 'अपने कोच से बात करें', stepOff: 'जब तक आपकी यात्रा सहेजी जाती है, आपका कदम यहाँ दिखता है।',
  failed: 'यह हिस्सा लोड नहीं हुआ। बाकी सब सामान्य रूप से काम करता है।', retry: 'फिर से कोशिश करें',
};

const id: MirrorCopy = {
  period: { week: 'Minggu', month: 'Bulan', m3: '3 bulan' }, periodLabel: 'Periode',
  q1: 'Apa yang terjadi?', q2: 'Apa yang kupelajari?', q3: 'Apa selanjutnya?',
  sDays: 'Hari kamu mencatat kemajuan', sGoals: 'Tujuan selesai', sSummaries: 'Ringkasan tersimpan', sSteps: 'Hari kamu melakukan langkahmu sepenuhnya',
  only14: 'Life menyimpan ini hanya untuk 14 hari terakhir, jadi hanya tampil di «Minggu».',
  weekDots: 'Langkahmu, 7 hari terakhir', atLeast: 'setidaknya {n}',
  journeyOff: 'Perjalananmu tidak disimpan, jadi ringkasan dan langkah tidak tampil di sini.',
  source: 'Setiap angka di sini berasal dari Life sendiri, dihitung selama seluruh periode.',
  notEnough: 'Belum ada cukup data untuk bacaan yang dapat diandalkan.',
  gateTitle: 'Sesuatu dibaca dari catatanmu saat ada:',
  gRecords: '{n} atau lebih langkah atau ringkasan', gDays: 'pada {n} atau lebih hari berbeda', gSpan: 'selama {n} hari atau lebih', have: 'kamu punya {n}',
  ownTitle: 'Yang kamu bilang membantu',
  ownNote: 'Dengan kata-katamu sendiri, dari ringkasan yang kamu simpan. Bukan bacaan dari coach.',
  noLessons: 'Ringkasanmu di periode ini belum mencatat apa yang membantu.',
  records: 'Lihat catatan ({n})', kSummary: 'Ringkasan', kDone: 'Langkah dilakukan', kPartly: 'Langkah dilakukan sebagian',
  nowStep: 'Langkahmu sekarang', noStep: 'Belum ada langkah. Coach-mu bisa membantu memilih langkah kecil.',
  talk: 'Bicara dengan coach-mu', stepOff: 'Langkahmu tampil di sini selama perjalananmu disimpan.',
  failed: 'Bagian ini gagal dimuat. Sisanya berjalan seperti biasa.', retry: 'Coba lagi',
};

const vi: MirrorCopy = {
  period: { week: 'Tuần', month: 'Tháng', m3: '3 tháng' }, periodLabel: 'Khoảng thời gian',
  q1: 'Đã có gì xảy ra?', q2: 'Tôi học được gì?', q3: 'Tiếp theo là gì?',
  sDays: 'Số ngày bạn ghi tiến độ', sGoals: 'Mục tiêu đã xong', sSummaries: 'Bản tóm tắt đã lưu', sSteps: 'Số ngày bạn làm trọn bước của mình',
  only14: 'Life chỉ giữ dữ liệu này trong 14 ngày gần nhất, nên chỉ hiện ở «Tuần».',
  weekDots: 'Bước của bạn, 7 ngày qua', atLeast: 'ít nhất {n}',
  journeyOff: 'Hành trình của bạn không được lưu, nên tóm tắt và bước không hiện ở đây.',
  source: 'Mọi con số ở đây đều từ chính Life, tính trên cả khoảng thời gian.',
  notEnough: 'Chưa đủ dữ liệu để đưa ra nhận định đáng tin cậy.',
  gateTitle: 'Hồ sơ của bạn được đọc khi có:',
  gRecords: '{n} bước hoặc tóm tắt trở lên', gDays: 'vào {n} ngày khác nhau trở lên', gSpan: 'trải dài {n} ngày trở lên', have: 'bạn có {n}',
  ownTitle: 'Điều bạn nói đã giúp bạn',
  ownNote: 'Bằng lời của bạn, từ các bản tóm tắt đã lưu. Không phải nhận định của huấn luyện viên.',
  noLessons: 'Các bản tóm tắt trong khoảng này chưa ghi điều gì đã giúp bạn.',
  records: 'Xem các bản ghi ({n})', kSummary: 'Tóm tắt', kDone: 'Đã làm bước', kPartly: 'Đã làm một phần bước',
  nowStep: 'Bước hiện tại của bạn', noStep: 'Hiện chưa có bước nào. Huấn luyện viên có thể giúp bạn chọn một bước nhỏ.',
  talk: 'Trò chuyện với huấn luyện viên', stepOff: 'Bước của bạn hiện ở đây khi hành trình được lưu.',
  failed: 'Phần này không tải được. Phần còn lại vẫn hoạt động bình thường.', retry: 'Thử lại',
};

const ko: MirrorCopy = {
  period: { week: '주', month: '월', m3: '3개월' }, periodLabel: '기간',
  q1: '무슨 일이 있었나요?', q2: '무엇을 배웠나요?', q3: '다음은 무엇인가요?',
  sDays: '진행을 기록한 날', sGoals: '완료한 목표', sSummaries: '저장한 요약', sSteps: '한 걸음을 끝까지 실천한 날',
  only14: 'Life는 이 기록을 최근 14일만 보관해서 «주»에서만 보여요.',
  weekDots: '최근 7일의 한 걸음', atLeast: '최소 {n}',
  journeyOff: '여정이 저장되지 않아 요약과 한 걸음이 여기 보이지 않아요.',
  source: '여기 있는 모든 숫자는 Life에서 나온 것으로, 기간 전체를 세었어요.',
  notEnough: '믿을 만한 해석을 하기에는 아직 데이터가 부족해요.',
  gateTitle: '다음이 갖춰지면 기록에서 읽어요:',
  gRecords: '한 걸음이나 요약 {n}개 이상', gDays: '서로 다른 {n}일 이상', gSpan: '{n}일 이상에 걸쳐', have: '지금 {n}',
  ownTitle: '도움이 됐다고 말한 것',
  ownNote: '저장한 요약에 담긴 내 말 그대로예요. 코치의 해석이 아니에요.',
  noLessons: '이 기간의 요약에는 아직 무엇이 도움이 됐는지 적혀 있지 않아요.',
  records: '기록 보기 ({n})', kSummary: '요약', kDone: '실천함', kPartly: '일부 실천함',
  nowStep: '지금의 한 걸음', noStep: '지금은 한 걸음이 없어요. 코치가 작은 걸음을 고르도록 도와줄 수 있어요.',
  talk: '코치와 이야기하기', stepOff: '여정이 저장되는 동안 한 걸음이 여기 보여요.',
  failed: '이 부분을 불러오지 못했어요. 나머지는 평소처럼 작동해요.', retry: '다시 시도',
};

const zh: MirrorCopy = {
  period: { week: '一周', month: '一个月', m3: '3 个月' }, periodLabel: '时间段',
  q1: '发生了什么？', q2: '我学到了什么？', q3: '下一步是什么？',
  sDays: '记录进展的天数', sGoals: '完成的目标', sSummaries: '保存的摘要', sSteps: '完整完成这一步的天数',
  only14: 'Life 只保留最近 14 天的这项记录，所以只在「一周」中显示。',
  weekDots: '你的这一步，最近 7 天', atLeast: '至少 {n}',
  journeyOff: '你的旅程没有保存，所以这里不显示摘要和步骤。',
  source: '这里的每个数字都来自 Life 本身，按整个时间段统计。',
  notEnough: '数据还不够，无法得出可靠的解读。',
  gateTitle: '满足以下条件时才会从你的记录中解读：',
  gRecords: '{n} 条及以上的步骤或摘要', gDays: '分布在 {n} 个及以上不同的日子', gSpan: '跨越 {n} 天及以上', have: '你现在有 {n}',
  ownTitle: '你说过有帮助的事',
  ownNote: '出自你保存的摘要，是你自己的话，不是教练的解读。',
  noLessons: '这段时间的摘要还没有记录什么对你有帮助。',
  records: '查看记录（{n}）', kSummary: '摘要', kDone: '完成了这一步', kPartly: '部分完成了这一步',
  nowStep: '你当前的一步', noStep: '现在没有步骤。教练可以帮你选一个小步骤。',
  talk: '和教练聊聊', stepOff: '只要你的旅程被保存，你的这一步就会显示在这里。',
  failed: '这部分没有加载出来。其他部分照常可用。', retry: '重试',
};

const COPY: Partial<Record<Locale, MirrorCopy>> = { en, ar, es, fr, pt, tr, ru, hi, id, vi, ko, zh };
export const mirrorCopy = (locale: Locale): MirrorCopy => COPY[locale] ?? en;
