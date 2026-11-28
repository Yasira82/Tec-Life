// The words of the redesign's Today screen (Phase 1), in all twelve languages. The step's own
// words (its title, the question, the three answers, saved / failed, the week) are step-copy's
// and session-copy's — the same step, the same words. A missing language falls back to English.
import type { Locale } from '@/lib/i18n/locales';

export interface TodayCopy {
  greet: Record<'morning' | 'afternoon' | 'evening', string>;
  /** The greeting with the name: `{g}` greeting, `{n}` @name. */
  withName: string;
  sub: string;
  talk: string;
  hint: { unknown: string; off: string; first: string; saved: string; savedTopic: string };
  noStep: string; stepOff: string;
  closest: string; ofTarget: string; left: string; steps: string;
  noGoals: string; addGoal: string; openGoals: string;
  failed: string; retry: string;
}

const en: TodayCopy = {
  greet: { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening' },
  withName: '{g}, {n}',
  sub: 'One small step today is enough.',
  talk: 'Talk to your coach',
  hint: {
    unknown: 'Tell it where you are today. It helps you pick one small step.',
    off: 'Your journey isn’t kept, so each conversation starts fresh.',
    first: 'Your first conversation: tell it where you are today.',
    saved: 'It remembers the conversations you kept.',
    savedTopic: 'It remembers the conversations you kept. The last one: “{t}”',
  },
  noStep: 'No step yet. Your coach can help you choose a small one.',
  stepOff: 'Your step shows here while your journey is kept.',
  closest: 'Closest goal', ofTarget: '{p}π of {t}π', left: '{n}π left', steps: '{d} of {n} steps',
  noGoals: 'No goals yet. Start with one small goal.', addGoal: 'Add a goal', openGoals: 'Open in My goals',
  failed: 'This part didn’t load. The rest works as usual.', retry: 'Try again',
};

const ar: TodayCopy = {
  greet: { morning: 'صباح الخير', afternoon: 'طاب يومك', evening: 'مساء الخير' },
  withName: '{g} يا {n}',
  sub: 'خطوة صغيرة اليوم تكفي.',
  talk: 'تحدّث مع مدربك',
  hint: {
    unknown: 'أخبره أين أنت اليوم، وسيساعدك على اختيار خطوة صغيرة.',
    off: 'رحلتك غير محفوظة، لذا تبدأ كل محادثة من جديد.',
    first: 'محادثتك الأولى: أخبره أين أنت اليوم.',
    saved: 'يتذكر المحادثات التي حفظتها.',
    savedTopic: 'يتذكر المحادثات التي حفظتها. آخرها: «{t}»',
  },
  noStep: 'لا توجد خطوة بعد. يمكن لمدربك أن يساعدك على اختيار خطوة صغيرة.',
  stepOff: 'تظهر خطوتك هنا ما دامت رحلتك محفوظة.',
  closest: 'أقرب هدف', ofTarget: '{p}π من {t}π', left: 'المتبقي {n}π', steps: '{d} من {n} خطوات',
  noGoals: 'لا توجد أهداف بعد. ابدأ بهدف صغير واحد.', addGoal: 'أضف هدفًا', openGoals: 'افتحه في أهدافي',
  failed: 'تعذّر تحميل هذا الجزء. بقية الشاشة تعمل كالمعتاد.', retry: 'حاول مرة أخرى',
};

const es: TodayCopy = {
  greet: { morning: 'Buenos días', afternoon: 'Buenas tardes', evening: 'Buenas noches' },
  withName: '{g}, {n}',
  sub: 'Un pequeño paso hoy es suficiente.',
  talk: 'Habla con tu coach',
  hint: {
    unknown: 'Cuéntale dónde estás hoy. Te ayuda a elegir un pequeño paso.',
    off: 'Tu recorrido no se guarda, así que cada conversación empieza de cero.',
    first: 'Tu primera conversación: cuéntale dónde estás hoy.',
    saved: 'Recuerda las conversaciones que guardaste.',
    savedTopic: 'Recuerda las conversaciones que guardaste. La última: «{t}»',
  },
  noStep: 'Aún no hay paso. Tu coach puede ayudarte a elegir uno pequeño.',
  stepOff: 'Tu paso aparece aquí mientras tu recorrido se guarde.',
  closest: 'Meta más cercana', ofTarget: '{p}π de {t}π', left: 'faltan {n}π', steps: '{d} de {n} pasos',
  noGoals: 'Aún no hay metas. Empieza con una pequeña.', addGoal: 'Añadir una meta', openGoals: 'Abrir en Mis metas',
  failed: 'Esta parte no cargó. Lo demás funciona como siempre.', retry: 'Reintentar',
};

const fr: TodayCopy = {
  greet: { morning: 'Bonjour', afternoon: 'Bon après-midi', evening: 'Bonsoir' },
  withName: '{g}, {n}',
  sub: 'Un petit pas aujourd’hui suffit.',
  talk: 'Parler à votre coach',
  hint: {
    unknown: 'Dites-lui où vous en êtes aujourd’hui. Il vous aide à choisir un petit pas.',
    off: 'Votre parcours n’est pas conservé : chaque conversation repart de zéro.',
    first: 'Votre première conversation : dites-lui où vous en êtes.',
    saved: 'Il se souvient des conversations que vous avez gardées.',
    savedTopic: 'Il se souvient des conversations gardées. La dernière : « {t} »',
  },
  noStep: 'Pas encore de pas. Votre coach peut vous aider à en choisir un petit.',
  stepOff: 'Votre pas s’affiche ici tant que votre parcours est conservé.',
  closest: 'Objectif le plus proche', ofTarget: '{p}π sur {t}π', left: 'reste {n}π', steps: '{d} sur {n} étapes',
  noGoals: 'Pas encore d’objectif. Commencez par un petit.', addGoal: 'Ajouter un objectif', openGoals: 'Ouvrir dans Mes objectifs',
  failed: 'Cette partie n’a pas chargé. Le reste fonctionne normalement.', retry: 'Réessayer',
};

const pt: TodayCopy = {
  greet: { morning: 'Bom dia', afternoon: 'Boa tarde', evening: 'Boa noite' },
  withName: '{g}, {n}',
  sub: 'Um pequeno passo hoje é suficiente.',
  talk: 'Fale com seu coach',
  hint: {
    unknown: 'Conte onde você está hoje. Ele ajuda você a escolher um pequeno passo.',
    off: 'Sua jornada não é guardada, então cada conversa começa do zero.',
    first: 'Sua primeira conversa: conte onde você está hoje.',
    saved: 'Ele lembra das conversas que você guardou.',
    savedTopic: 'Ele lembra das conversas que você guardou. A última: “{t}”',
  },
  noStep: 'Ainda não há passo. Seu coach pode ajudar a escolher um pequeno.',
  stepOff: 'Seu passo aparece aqui enquanto sua jornada for guardada.',
  closest: 'Meta mais próxima', ofTarget: '{p}π de {t}π', left: 'faltam {n}π', steps: '{d} de {n} passos',
  noGoals: 'Ainda não há metas. Comece com uma pequena.', addGoal: 'Adicionar meta', openGoals: 'Abrir em Minhas metas',
  failed: 'Esta parte não carregou. O resto funciona normalmente.', retry: 'Tentar de novo',
};

const tr: TodayCopy = {
  greet: { morning: 'Günaydın', afternoon: 'İyi günler', evening: 'İyi akşamlar' },
  withName: '{g}, {n}',
  sub: 'Bugün küçük bir adım yeter.',
  talk: 'Koçunla konuş',
  hint: {
    unknown: 'Bugün nerede olduğunu anlat. Küçük bir adım seçmene yardım eder.',
    off: 'Yolculuğun saklanmıyor, bu yüzden her konuşma baştan başlar.',
    first: 'İlk konuşman: bugün nerede olduğunu anlat.',
    saved: 'Sakladığın konuşmaları hatırlar.',
    savedTopic: 'Sakladığın konuşmaları hatırlar. Sonuncusu: “{t}”',
  },
  noStep: 'Henüz adım yok. Koçun küçük bir tane seçmene yardım edebilir.',
  stepOff: 'Yolculuğun saklandığı sürece adımın burada görünür.',
  closest: 'En yakın hedef', ofTarget: '{t}π hedefin {p}π’si', left: '{n}π kaldı', steps: '{n} adımdan {d}',
  noGoals: 'Henüz hedef yok. Küçük bir hedefle başla.', addGoal: 'Hedef ekle', openGoals: 'Hedeflerim’de aç',
  failed: 'Bu bölüm yüklenmedi. Gerisi her zamanki gibi çalışıyor.', retry: 'Tekrar dene',
};

const ru: TodayCopy = {
  greet: { morning: 'Доброе утро', afternoon: 'Добрый день', evening: 'Добрый вечер' },
  withName: '{g}, {n}',
  sub: 'Одного маленького шага сегодня достаточно.',
  talk: 'Поговорить с коучем',
  hint: {
    unknown: 'Расскажите, где вы сегодня. Коуч поможет выбрать маленький шаг.',
    off: 'Ваш путь не сохраняется, поэтому каждый разговор начинается заново.',
    first: 'Ваш первый разговор: расскажите, где вы сегодня.',
    saved: 'Помнит разговоры, которые вы сохранили.',
    savedTopic: 'Помнит сохранённые разговоры. Последний: «{t}»',
  },
  noStep: 'Шага пока нет. Коуч поможет выбрать маленький.',
  stepOff: 'Ваш шаг появляется здесь, пока путь сохраняется.',
  closest: 'Ближайшая цель', ofTarget: '{p}π из {t}π', left: 'осталось {n}π', steps: '{d} из {n} шагов',
  noGoals: 'Целей пока нет. Начните с одной маленькой.', addGoal: 'Добавить цель', openGoals: 'Открыть в «Мои цели»',
  failed: 'Эта часть не загрузилась. Остальное работает как обычно.', retry: 'Повторить',
};

const hi: TodayCopy = {
  greet: { morning: 'सुप्रभात', afternoon: 'नमस्कार', evening: 'शुभ संध्या' },
  withName: '{g}, {n}',
  sub: 'आज एक छोटा कदम काफ़ी है।',
  talk: 'अपने कोच से बात करें',
  hint: {
    unknown: 'बताइए आज आप कहाँ हैं। यह एक छोटा कदम चुनने में मदद करता है।',
    off: 'आपकी यात्रा सहेजी नहीं जाती, इसलिए हर बातचीत नए सिरे से शुरू होती है।',
    first: 'आपकी पहली बातचीत: बताइए आज आप कहाँ हैं।',
    saved: 'यह आपकी सहेजी हुई बातचीतें याद रखता है।',
    savedTopic: 'यह सहेजी हुई बातचीतें याद रखता है। पिछली: “{t}”',
  },
  noStep: 'अभी कोई कदम नहीं। आपका कोच एक छोटा कदम चुनने में मदद कर सकता है।',
  stepOff: 'जब तक आपकी यात्रा सहेजी जाती है, आपका कदम यहाँ दिखता है।',
  closest: 'सबसे नज़दीकी लक्ष्य', ofTarget: '{t}π में से {p}π', left: '{n}π बाकी', steps: '{n} में से {d} कदम',
  noGoals: 'अभी कोई लक्ष्य नहीं। एक छोटे लक्ष्य से शुरू करें।', addGoal: 'लक्ष्य जोड़ें', openGoals: 'मेरे लक्ष्य में खोलें',
  failed: 'यह हिस्सा लोड नहीं हुआ। बाकी सामान्य रूप से काम करता है।', retry: 'फिर से कोशिश करें',
};

const id: TodayCopy = {
  greet: { morning: 'Selamat pagi', afternoon: 'Selamat siang', evening: 'Selamat malam' },
  withName: '{g}, {n}',
  sub: 'Satu langkah kecil hari ini sudah cukup.',
  talk: 'Bicara dengan coach',
  hint: {
    unknown: 'Ceritakan posisimu hari ini. Coach membantu memilih satu langkah kecil.',
    off: 'Perjalananmu tidak disimpan, jadi setiap percakapan mulai dari awal.',
    first: 'Percakapan pertamamu: ceritakan posisimu hari ini.',
    saved: 'Coach ingat percakapan yang kamu simpan.',
    savedTopic: 'Coach ingat percakapan yang kamu simpan. Terakhir: “{t}”',
  },
  noStep: 'Belum ada langkah. Coach bisa membantumu memilih yang kecil.',
  stepOff: 'Langkahmu tampil di sini selama perjalananmu disimpan.',
  closest: 'Tujuan terdekat', ofTarget: '{p}π dari {t}π', left: 'sisa {n}π', steps: '{d} dari {n} langkah',
  noGoals: 'Belum ada tujuan. Mulai dengan satu yang kecil.', addGoal: 'Tambah tujuan', openGoals: 'Buka di Tujuanku',
  failed: 'Bagian ini tidak termuat. Sisanya berjalan seperti biasa.', retry: 'Coba lagi',
};

const vi: TodayCopy = {
  greet: { morning: 'Chào buổi sáng', afternoon: 'Chào buổi chiều', evening: 'Chào buổi tối' },
  withName: '{g}, {n}',
  sub: 'Hôm nay một bước nhỏ là đủ.',
  talk: 'Trò chuyện với coach',
  hint: {
    unknown: 'Kể cho coach bạn đang ở đâu hôm nay. Coach giúp bạn chọn một bước nhỏ.',
    off: 'Hành trình của bạn không được lưu, nên mỗi cuộc trò chuyện bắt đầu lại từ đầu.',
    first: 'Cuộc trò chuyện đầu tiên: kể bạn đang ở đâu hôm nay.',
    saved: 'Coach nhớ những cuộc trò chuyện bạn đã lưu.',
    savedTopic: 'Coach nhớ các cuộc trò chuyện đã lưu. Gần nhất: “{t}”',
  },
  noStep: 'Chưa có bước nào. Coach có thể giúp bạn chọn một bước nhỏ.',
  stepOff: 'Bước của bạn hiện ở đây khi hành trình được lưu.',
  closest: 'Mục tiêu gần nhất', ofTarget: '{p}π / {t}π', left: 'còn {n}π', steps: '{d}/{n} bước',
  noGoals: 'Chưa có mục tiêu. Hãy bắt đầu với một mục tiêu nhỏ.', addGoal: 'Thêm mục tiêu', openGoals: 'Mở trong Mục tiêu',
  failed: 'Phần này chưa tải được. Phần còn lại vẫn hoạt động bình thường.', retry: 'Thử lại',
};

const ko: TodayCopy = {
  greet: { morning: '좋은 아침이에요', afternoon: '좋은 오후예요', evening: '좋은 저녁이에요' },
  withName: '{g}, {n}',
  sub: '오늘은 작은 한 걸음이면 충분해요.',
  talk: '코치와 이야기하기',
  hint: {
    unknown: '오늘 어디쯤인지 말해 주세요. 작은 한 걸음을 고르도록 도와줘요.',
    off: '여정이 저장되지 않아 대화마다 처음부터 시작해요.',
    first: '첫 대화예요. 오늘 어디쯤인지 말해 주세요.',
    saved: '저장한 대화를 기억해요.',
    savedTopic: '저장한 대화를 기억해요. 마지막 대화: “{t}”',
  },
  noStep: '아직 걸음이 없어요. 코치가 작은 걸음을 고르도록 도와줄 수 있어요.',
  stepOff: '여정이 저장되는 동안 여기에 걸음이 표시돼요.',
  closest: '가장 가까운 목표', ofTarget: '{t}π 중 {p}π', left: '{n}π 남음', steps: '{n}단계 중 {d}',
  noGoals: '아직 목표가 없어요. 작은 목표 하나로 시작해 보세요.', addGoal: '목표 추가', openGoals: '내 목표에서 열기',
  failed: '이 부분을 불러오지 못했어요. 나머지는 평소처럼 작동해요.', retry: '다시 시도',
};

const zh: TodayCopy = {
  greet: { morning: '早上好', afternoon: '下午好', evening: '晚上好' },
  withName: '{g}，{n}',
  sub: '今天迈出一小步就够了。',
  talk: '和教练聊聊',
  hint: {
    unknown: '告诉它你今天的状态，它会帮你选一个小步骤。',
    off: '你的历程没有保存，所以每次对话都从头开始。',
    first: '第一次对话：告诉它你今天的状态。',
    saved: '它记得你保存的对话。',
    savedTopic: '它记得你保存的对话。最近一次：“{t}”',
  },
  noStep: '还没有步骤。教练可以帮你选一个小步骤。',
  stepOff: '只要你的历程在保存，你的步骤就会显示在这里。',
  closest: '最接近的目标', ofTarget: '{p}π / {t}π', left: '还差 {n}π', steps: '{n} 步中的 {d} 步',
  noGoals: '还没有目标。从一个小目标开始吧。', addGoal: '添加目标', openGoals: '在我的目标中打开',
  failed: '这部分没有加载。其余功能照常。', retry: '重试',
};

const COPY: Partial<Record<Locale, TodayCopy>> = { en, ar, es, fr, pt, tr, ru, hi, id, vi, ko, zh };

export const todayCopy = (locale: Locale): TodayCopy => COPY[locale] ?? en;

/** `{x}` placeholders, filled. */
export const fill = (s: string, v: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k: string) => String(v[k] ?? ''));
