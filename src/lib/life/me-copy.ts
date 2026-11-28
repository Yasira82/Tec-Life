// The words the redesign's Me screen adds (Phase 1), in all twelve languages. The privacy text
// follows what the code does (Tec-Life api/bff/life/talk, tec-life-service consent):
//   • JOURNEY keeps the summaries, and it is the ONLY switch that lets the coach use memory;
//   • CONVERSATIONS keeps the full text, and is its own switch — the coach reads the newest one
//     only while BOTH are on;
//   • the per-kind switches are what TEC AI in the Hub may read; Life's coach does not read them.
// Everything else on the screen reuses the dictionaries' words. A missing language is English.
import type { Locale } from '@/lib/i18n/locales';

export interface MeCopy {
  manage: string; noSkills: string;
  journey: string; counts: string; openJourney: string;
  /** «My journey» when what is kept could not be counted — never shown as 0. */
  countsFailed: string;
  /** «My skills» when the list could not be read — never shown as «no skills». */
  skillsFailed: string;
  gKeep: string; gHub: string; gHubNote: string; gReminder: string;
  keepJourney: string; keepJourneyDesc: string;
  keepConvs: string; keepConvsDesc: string;
  storedNotRead: string;
  offConfirm: string; offSummaries: string; offConversations: string; offDo: string; offKeep: string;
  settings: string; more: string;
  /** The confirmation's states: counting, a count that could not be read, deleting, a refusal. */
  counting: string; countFailed: string; deleting: string; offFailed: string;
  /** A list that came back at the service's cap: the true total may be higher. `{n}` = the cap. */
  atLeast: string;
  /** Turning JOURNEY off also deletes «I'm becoming…» (LifeSelf). */
  andSelf: string;
  saveFailed: string; loadFailed: string; retry: string;
}

const en: MeCopy = {
  manage: 'Manage', noSkills: 'No skills yet.',
  journey: 'My journey', counts: '{s} summaries · {c} conversations', openJourney: 'Open my journey',
  gKeep: 'What Life keeps', gHub: 'What TEC AI in the Hub may read',
  gHubNote: 'Each kind stays off until you turn it on. This is for TEC AI in the Hub, not for Life’s coach.',
  gReminder: 'Reminder',
  keepJourney: 'Keep my journey summaries',
  keepJourneyDesc: 'A summary of each conversation you confirm. While this is on, your coach remembers them and sees your goals, vision and skills when it replies. Turned off: the summaries are deleted and your coach starts fresh each time.',
  keepConvs: 'Keep my full conversations (encrypted)',
  keepConvsDesc: 'The full text, for you to read and continue. A separate switch: your coach reads only the newest one, and only while your journey summaries are kept too. Turned off: every full conversation is deleted.',
  storedNotRead: 'Right now: kept for you, and not read by your coach, because journey summaries are off.',
  offConfirm: 'Right now we found {n}. When you confirm, everything kept at that moment is deleted, and it cannot be undone.', offSummaries: '{n} summaries', offConversations: '{n} conversations',
  offDo: 'Delete and turn off', offKeep: 'Keep it on',
  settings: 'Settings', more: 'Help, links and about',
  counting: 'Checking how much would be deleted…', countFailed: 'Couldn’t check how much would be deleted, so nothing was changed.', deleting: 'Deleting…', offFailed: 'Couldn’t turn it off. The switch shows what is saved now.', atLeast: 'at least {n}', andSelf: ' and your «I’m becoming» sentence', saveFailed: 'Couldn’t save that change. The switch shows what is saved now.', loadFailed: 'Couldn’t load your privacy settings. Nothing has changed — try again.', retry: 'Try again',
  countsFailed: 'Couldn’t count what is kept.', skillsFailed: 'Couldn’t load your skills.',
};

const ar: MeCopy = {
  manage: 'إدارة', noSkills: 'لا توجد مهارات بعد.',
  journey: 'رحلتي', counts: '{s} ملخصات · {c} محادثات', openJourney: 'افتح رحلتي',
  gKeep: 'ما يحتفظ به Life', gHub: 'ما يمكن لـ TEC AI في الـ Hub قراءته',
  gHubNote: 'كل نوع يبقى مغلقًا حتى تشغّله بنفسك. هذا خاص بـ TEC AI في الـ Hub، وليس بمدرب Life.',
  gReminder: 'تذكير',
  keepJourney: 'احتفظ بملخصات رحلتي',
  keepJourneyDesc: 'ملخص كل محادثة توافق عليه. ما دام هذا مفعّلًا يتذكرها مدربك ويرى أهدافك ورؤيتك ومهاراتك عندما يرد. إذا أوقفته: تُحذف الملخصات ويبدأ مدربك من جديد كل مرة.',
  keepConvs: 'احتفظ بمحادثاتي كاملة (مشفّرة)',
  keepConvsDesc: 'النص الكامل لتقرأه وتكمله. مفتاح مستقل: يقرأ مدربك أحدث محادثة فقط، وفقط عندما تكون ملخصات رحلتك محفوظة أيضًا. إذا أوقفته: تُحذف كل المحادثات الكاملة.',
  storedNotRead: 'الآن: محفوظة لك، ولا يقرؤها مدربك لأن ملخصات الرحلة متوقفة.',
  offConfirm: 'عثرنا حاليًا على {n}. عند التأكيد سيُحذف كل ما هو محفوظ وقت تنفيذ العملية، ولا يمكن التراجع.', offSummaries: '{n} ملخصات', offConversations: '{n} محادثات',
  offDo: 'احذف وأوقف', offKeep: 'أبقِه مفعّلًا',
  settings: 'الإعدادات', more: 'المساعدة والروابط وعن التطبيق',
  counting: 'جارٍ التحقق مما سيُحذف…', countFailed: 'تعذّر معرفة ما سيُحذف، لذلك لم يتغير شيء.', deleting: 'جارٍ الحذف…', offFailed: 'تعذّر الإيقاف. المفتاح يعرض الآن ما هو محفوظ فعلًا.', atLeast: '{n} على الأقل', andSelf: ' وجملة «أنا ببقى…»', saveFailed: 'تعذّر حفظ هذا التغيير. المفتاح يعرض الآن ما هو محفوظ فعلًا.', loadFailed: 'تعذّر تحميل إعدادات الخصوصية. لم يتغير شيء — حاول مرة أخرى.', retry: 'حاول مرة أخرى',
  countsFailed: 'تعذّر عدّ ما هو محفوظ.', skillsFailed: 'تعذّر تحميل مهاراتك.',
};

const es: MeCopy = {
  manage: 'Gestionar', noSkills: 'Aún no hay habilidades.',
  journey: 'Mi recorrido', counts: '{s} resúmenes · {c} conversaciones', openJourney: 'Abrir mi recorrido',
  gKeep: 'Lo que Life guarda', gHub: 'Lo que TEC AI en el Hub puede leer',
  gHubNote: 'Cada tipo queda apagado hasta que lo enciendas. Es para TEC AI en el Hub, no para el coach de Life.',
  gReminder: 'Recordatorio',
  keepJourney: 'Guardar los resúmenes de mi recorrido',
  keepJourneyDesc: 'Un resumen de cada conversación que confirmas. Mientras esté activo, tu coach los recuerda y ve tus metas, tu visión y tus habilidades al responder. Si lo apagas: se borran los resúmenes y tu coach empieza de cero cada vez.',
  keepConvs: 'Guardar mis conversaciones completas (cifradas)',
  keepConvsDesc: 'El texto completo, para leerlo y continuarlo. Es otro interruptor: tu coach lee solo la más reciente, y solo si también se guardan los resúmenes. Si lo apagas: se borran todas las conversaciones completas.',
  storedNotRead: 'Ahora: guardadas para ti y tu coach no las lee, porque los resúmenes están apagados.',
  offConfirm: 'Ahora mismo encontramos {n}. Al confirmar se borra todo lo guardado en ese momento, y no se puede deshacer.', offSummaries: '{n} resúmenes', offConversations: '{n} conversaciones',
  offDo: 'Borrar y apagar', offKeep: 'Dejarlo activo',
  settings: 'Ajustes', more: 'Ayuda, enlaces e información',
  counting: 'Comprobando cuánto se borraría…', countFailed: 'No se pudo comprobar cuánto se borraría, así que no se cambió nada.', deleting: 'Borrando…', offFailed: 'No se pudo apagar. El interruptor muestra lo que está guardado ahora.', atLeast: 'al menos {n}', andSelf: ' y tu frase «Me estoy convirtiendo en…»', saveFailed: 'No se pudo guardar ese cambio. El interruptor muestra lo que está guardado ahora.', loadFailed: 'No se pudieron cargar tus ajustes de privacidad. No cambió nada; inténtalo de nuevo.', retry: 'Reintentar',
  countsFailed: 'No se pudo contar lo que se guarda.', skillsFailed: 'No se pudieron cargar tus habilidades.',
};

const fr: MeCopy = {
  manage: 'Gérer', noSkills: 'Pas encore de compétences.',
  journey: 'Mon parcours', counts: '{s} résumés · {c} conversations', openJourney: 'Ouvrir mon parcours',
  gKeep: 'Ce que Life conserve', gHub: 'Ce que TEC AI dans le Hub peut lire',
  gHubNote: 'Chaque type reste désactivé jusqu’à ce que vous l’activiez. C’est pour TEC AI dans le Hub, pas pour le coach de Life.',
  gReminder: 'Rappel',
  keepJourney: 'Conserver les résumés de mon parcours',
  keepJourneyDesc: 'Un résumé de chaque conversation que vous confirmez. Tant que c’est activé, votre coach s’en souvient et voit vos objectifs, votre vision et vos compétences quand il répond. Désactivé : les résumés sont supprimés et votre coach repart de zéro.',
  keepConvs: 'Conserver mes conversations complètes (chiffrées)',
  keepConvsDesc: 'Le texte complet, à relire et poursuivre. Interrupteur séparé : votre coach ne lit que la plus récente, et seulement si les résumés sont aussi conservés. Désactivé : toutes les conversations complètes sont supprimées.',
  storedNotRead: 'Pour l’instant : conservées pour vous, et non lues par votre coach, car les résumés sont désactivés.',
  offConfirm: 'Nous trouvons actuellement {n}. En confirmant, tout ce qui est conservé à ce moment-là est supprimé, sans retour possible.', offSummaries: '{n} résumés', offConversations: '{n} conversations',
  offDo: 'Supprimer et désactiver', offKeep: 'Laisser activé',
  settings: 'Réglages', more: 'Aide, liens et à propos',
  counting: 'Vérification de ce qui serait supprimé…', countFailed: 'Impossible de vérifier ce qui serait supprimé ; rien n’a été modifié.', deleting: 'Suppression…', offFailed: 'Impossible de désactiver. L’interrupteur montre ce qui est enregistré.', atLeast: 'au moins {n}', andSelf: ' et votre phrase « Je deviens… »', saveFailed: 'Impossible d’enregistrer ce changement. L’interrupteur montre ce qui est enregistré.', loadFailed: 'Impossible de charger vos réglages de confidentialité. Rien n’a changé — réessayez.', retry: 'Réessayer',
  countsFailed: 'Impossible de compter ce qui est conservé.', skillsFailed: 'Impossible de charger vos compétences.',
};

const pt: MeCopy = {
  manage: 'Gerenciar', noSkills: 'Ainda não há habilidades.',
  journey: 'Minha jornada', counts: '{s} resumos · {c} conversas', openJourney: 'Abrir minha jornada',
  gKeep: 'O que o Life guarda', gHub: 'O que o TEC AI no Hub pode ler',
  gHubNote: 'Cada tipo fica desligado até você ligar. Isto é para o TEC AI no Hub, não para o coach do Life.',
  gReminder: 'Lembrete',
  keepJourney: 'Guardar os resumos da minha jornada',
  keepJourneyDesc: 'Um resumo de cada conversa que você confirma. Enquanto estiver ligado, seu coach se lembra deles e vê suas metas, visão e habilidades ao responder. Desligado: os resumos são apagados e seu coach recomeça do zero.',
  keepConvs: 'Guardar minhas conversas completas (criptografadas)',
  keepConvsDesc: 'O texto completo, para você ler e continuar. É outro interruptor: seu coach lê só a mais recente, e só se os resumos também estiverem guardados. Desligado: todas as conversas completas são apagadas.',
  storedNotRead: 'Agora: guardadas para você, e seu coach não as lê, porque os resumos estão desligados.',
  offConfirm: 'Agora encontramos {n}. Ao confirmar, tudo o que estiver guardado naquele momento é apagado, e não pode ser desfeito.', offSummaries: '{n} resumos', offConversations: '{n} conversas',
  offDo: 'Apagar e desligar', offKeep: 'Manter ligado',
  settings: 'Ajustes', more: 'Ajuda, links e sobre',
  counting: 'Verificando quanto seria apagado…', countFailed: 'Não foi possível verificar quanto seria apagado, então nada mudou.', deleting: 'Apagando…', offFailed: 'Não foi possível desligar. O interruptor mostra o que está salvo agora.', atLeast: 'pelo menos {n}', andSelf: ' e sua frase «Estou me tornando…»', saveFailed: 'Não foi possível salvar essa mudança. O interruptor mostra o que está salvo agora.', loadFailed: 'Não foi possível carregar suas configurações de privacidade. Nada mudou — tente de novo.', retry: 'Tentar de novo',
  countsFailed: 'Não foi possível contar o que está guardado.', skillsFailed: 'Não foi possível carregar suas habilidades.',
};

const tr: MeCopy = {
  manage: 'Yönet', noSkills: 'Henüz beceri yok.',
  journey: 'Yolculuğum', counts: '{s} özet · {c} konuşma', openJourney: 'Yolculuğumu aç',
  gKeep: 'Life’ın sakladıkları', gHub: 'Hub’daki TEC AI’ın okuyabildikleri',
  gHubNote: 'Her tür, sen açana kadar kapalı kalır. Bu Hub’daki TEC AI içindir, Life koçu için değil.',
  gReminder: 'Hatırlatma',
  keepJourney: 'Yolculuk özetlerimi sakla',
  keepJourneyDesc: 'Onayladığın her konuşmanın özeti. Bu açıkken koçun bunları hatırlar ve yanıt verirken hedeflerini, vizyonunu ve becerilerini görür. Kapatırsan: özetler silinir ve koçun her seferinde baştan başlar.',
  keepConvs: 'Konuşmalarımın tamamını sakla (şifreli)',
  keepConvsDesc: 'Okuman ve sürdürmen için tam metin. Ayrı bir anahtar: koçun yalnızca en yenisini okur, o da yalnızca özetler de saklanıyorsa. Kapatırsan: tüm tam konuşmalar silinir.',
  storedNotRead: 'Şu an: senin için saklanıyor, koçun okumuyor, çünkü özetler kapalı.',
  offConfirm: 'Şu an {n} bulduk. Onayladığında o anda kayıtlı olan her şey silinir ve geri alınamaz.', offSummaries: '{n} özet', offConversations: '{n} konuşma',
  offDo: 'Sil ve kapat', offKeep: 'Açık kalsın',
  settings: 'Ayarlar', more: 'Yardım, bağlantılar ve hakkında',
  counting: 'Nelerin silineceği kontrol ediliyor…', countFailed: 'Nelerin silineceği kontrol edilemedi, bu yüzden hiçbir şey değişmedi.', deleting: 'Siliniyor…', offFailed: 'Kapatılamadı. Anahtar şu an kayıtlı olanı gösteriyor.', atLeast: 'en az {n}', andSelf: ' ve «Dönüştüğüm kişi…» cümlen', saveFailed: 'Bu değişiklik kaydedilemedi. Anahtar şu an kayıtlı olanı gösteriyor.', loadFailed: 'Gizlilik ayarların yüklenemedi. Hiçbir şey değişmedi — tekrar dene.', retry: 'Tekrar dene',
  countsFailed: 'Saklananlar sayılamadı.', skillsFailed: 'Becerilerin yüklenemedi.',
};

const ru: MeCopy = {
  manage: 'Управлять', noSkills: 'Навыков пока нет.',
  journey: 'Мой путь', counts: 'резюме: {s} · разговоров: {c}', openJourney: 'Открыть мой путь',
  gKeep: 'Что хранит Life', gHub: 'Что может читать TEC AI в Hub',
  gHubNote: 'Каждый вид выключен, пока вы его не включите. Это для TEC AI в Hub, а не для коуча Life.',
  gReminder: 'Напоминание',
  keepJourney: 'Хранить резюме моего пути',
  keepJourneyDesc: 'Резюме каждого разговора, который вы подтвердили. Пока это включено, коуч их помнит и видит ваши цели, видение и навыки, когда отвечает. Выключите — резюме удалятся, и коуч будет начинать с нуля.',
  keepConvs: 'Хранить разговоры полностью (зашифровано)',
  keepConvsDesc: 'Полный текст, чтобы перечитать и продолжить. Отдельный переключатель: коуч читает только последний разговор, и только если резюме тоже хранятся. Выключите — все полные разговоры удалятся.',
  storedNotRead: 'Сейчас: хранятся для вас, коуч их не читает, потому что резюме выключены.',
  offConfirm: 'Сейчас найдено: {n}. После подтверждения будет удалено всё, что сохранено на момент удаления. Отменить нельзя.', offSummaries: 'резюме — {n}', offConversations: 'разговоров — {n}',
  offDo: 'Удалить и выключить', offKeep: 'Оставить включённым',
  settings: 'Настройки', more: 'Помощь, ссылки и о приложении',
  counting: 'Проверяем, что будет удалено…', countFailed: 'Не удалось проверить, что будет удалено, поэтому ничего не изменилось.', deleting: 'Удаляем…', offFailed: 'Не удалось выключить. Переключатель показывает сохранённое состояние.', atLeast: 'не менее {n}', andSelf: ' и ваша фраза «Я становлюсь…»', saveFailed: 'Не удалось сохранить изменение. Переключатель показывает сохранённое состояние.', loadFailed: 'Не удалось загрузить настройки конфиденциальности. Ничего не изменилось — попробуйте снова.', retry: 'Повторить',
  countsFailed: 'Не удалось посчитать сохранённое.', skillsFailed: 'Не удалось загрузить ваши навыки.',
};

const hi: MeCopy = {
  manage: 'प्रबंधित करें', noSkills: 'अभी कोई कौशल नहीं।',
  journey: 'मेरी यात्रा', counts: '{s} सारांश · {c} बातचीत', openJourney: 'मेरी यात्रा खोलें',
  gKeep: 'Life क्या रखता है', gHub: 'Hub में TEC AI क्या पढ़ सकता है',
  gHubNote: 'हर प्रकार तब तक बंद रहता है जब तक आप उसे चालू न करें। यह Hub में TEC AI के लिए है, Life के कोच के लिए नहीं।',
  gReminder: 'याद दिलाना',
  keepJourney: 'मेरी यात्रा के सारांश रखें',
  keepJourneyDesc: 'आपकी पुष्टि की हुई हर बातचीत का सारांश। जब तक यह चालू है, आपका कोच इन्हें याद रखता है और जवाब देते समय आपके लक्ष्य, दृष्टि और कौशल देखता है। बंद करने पर: सारांश मिट जाते हैं और कोच हर बार नए सिरे से शुरू करता है।',
  keepConvs: 'मेरी पूरी बातचीत रखें (एन्क्रिप्टेड)',
  keepConvsDesc: 'पूरा पाठ, पढ़ने और आगे बढ़ाने के लिए। अलग स्विच: कोच सिर्फ़ सबसे नई बातचीत पढ़ता है, और वह भी तभी जब सारांश भी रखे जा रहे हों। बंद करने पर: सारी पूरी बातचीत मिट जाती है।',
  storedNotRead: 'अभी: आपके लिए रखी गई हैं, कोच इन्हें नहीं पढ़ता क्योंकि सारांश बंद हैं।',
  offConfirm: 'अभी हमें {n} मिले। पुष्टि करने पर उस समय तक सहेजा गया सब कुछ मिट जाएगा, और यह वापस नहीं होगा।', offSummaries: '{n} सारांश', offConversations: '{n} बातचीत',
  offDo: 'मिटाएँ और बंद करें', offKeep: 'चालू रहने दें',
  settings: 'सेटिंग्स', more: 'मदद, लिंक और जानकारी',
  counting: 'जाँच रहे हैं कि क्या मिटेगा…', countFailed: 'यह जाँचा नहीं जा सका कि क्या मिटेगा, इसलिए कुछ नहीं बदला।', deleting: 'मिटाया जा रहा है…', offFailed: 'बंद नहीं हो सका। स्विच अभी वही दिखा रहा है जो सहेजा गया है।', atLeast: 'कम से कम {n}', andSelf: ' और आपका «मैं बन रहा हूँ…» वाक्य', saveFailed: 'यह बदलाव सहेजा नहीं जा सका। स्विच अभी वही दिखा रहा है जो सहेजा गया है।', loadFailed: 'आपकी गोपनीयता सेटिंग्स लोड नहीं हो सकीं। कुछ नहीं बदला — फिर कोशिश करें।', retry: 'फिर से कोशिश करें',
  countsFailed: 'जो सहेजा गया है उसे गिना नहीं जा सका।', skillsFailed: 'आपके कौशल लोड नहीं हो सके।',
};

const id: MeCopy = {
  manage: 'Kelola', noSkills: 'Belum ada keterampilan.',
  journey: 'Perjalananku', counts: '{s} ringkasan · {c} percakapan', openJourney: 'Buka perjalananku',
  gKeep: 'Yang disimpan Life', gHub: 'Yang boleh dibaca TEC AI di Hub',
  gHubNote: 'Setiap jenis tetap mati sampai kamu menyalakannya. Ini untuk TEC AI di Hub, bukan untuk coach Life.',
  gReminder: 'Pengingat',
  keepJourney: 'Simpan ringkasan perjalananku',
  keepJourneyDesc: 'Ringkasan setiap percakapan yang kamu setujui. Selama ini menyala, coach mengingatnya dan melihat tujuan, visi, dan keterampilanmu saat menjawab. Dimatikan: ringkasan dihapus dan coach mulai dari awal setiap kali.',
  keepConvs: 'Simpan percakapanku utuh (terenkripsi)',
  keepConvsDesc: 'Teks lengkap, untuk kamu baca dan lanjutkan. Sakelar terpisah: coach hanya membaca yang terbaru, dan hanya jika ringkasan juga disimpan. Dimatikan: semua percakapan utuh dihapus.',
  storedNotRead: 'Saat ini: disimpan untukmu, dan tidak dibaca coach karena ringkasan dimatikan.',
  offConfirm: 'Saat ini kami menemukan {n}. Saat dikonfirmasi, semua yang tersimpan pada saat itu dihapus dan tidak bisa dibatalkan.', offSummaries: '{n} ringkasan', offConversations: '{n} percakapan',
  offDo: 'Hapus dan matikan', offKeep: 'Biarkan menyala',
  settings: 'Pengaturan', more: 'Bantuan, tautan, dan tentang',
  counting: 'Memeriksa apa yang akan dihapus…', countFailed: 'Tidak bisa memeriksa apa yang akan dihapus, jadi tidak ada yang diubah.', deleting: 'Menghapus…', offFailed: 'Tidak bisa dimatikan. Sakelar menunjukkan yang tersimpan sekarang.', atLeast: 'setidaknya {n}', andSelf: ' dan kalimat «Aku sedang menjadi…»', saveFailed: 'Perubahan itu tidak bisa disimpan. Sakelar menunjukkan yang tersimpan sekarang.', loadFailed: 'Pengaturan privasimu tidak bisa dimuat. Tidak ada yang berubah — coba lagi.', retry: 'Coba lagi',
  countsFailed: 'Tidak bisa menghitung yang disimpan.', skillsFailed: 'Keahlianmu tidak bisa dimuat.',
};

const vi: MeCopy = {
  manage: 'Quản lý', noSkills: 'Chưa có kỹ năng nào.',
  journey: 'Hành trình', counts: '{s} bản tóm tắt · {c} cuộc trò chuyện', openJourney: 'Mở hành trình',
  gKeep: 'Những gì Life lưu', gHub: 'Những gì TEC AI trong Hub được đọc',
  gHubNote: 'Mỗi loại vẫn tắt cho đến khi bạn bật. Mục này dành cho TEC AI trong Hub, không phải coach của Life.',
  gReminder: 'Nhắc nhở',
  keepJourney: 'Lưu bản tóm tắt hành trình',
  keepJourneyDesc: 'Bản tóm tắt mỗi cuộc trò chuyện bạn xác nhận. Khi bật, coach nhớ chúng và thấy mục tiêu, tầm nhìn, kỹ năng của bạn khi trả lời. Khi tắt: các bản tóm tắt bị xóa và coach bắt đầu lại mỗi lần.',
  keepConvs: 'Lưu toàn bộ cuộc trò chuyện (đã mã hóa)',
  keepConvsDesc: 'Toàn văn để bạn đọc và tiếp tục. Đây là công tắc riêng: coach chỉ đọc cuộc gần nhất, và chỉ khi bản tóm tắt cũng được lưu. Khi tắt: mọi cuộc trò chuyện đầy đủ bị xóa.',
  storedNotRead: 'Hiện tại: được lưu cho bạn, coach không đọc vì bản tóm tắt đang tắt.',
  offConfirm: 'Hiện chúng tôi tìm thấy {n}. Khi bạn xác nhận, mọi thứ đang được lưu tại thời điểm đó sẽ bị xóa và không thể hoàn tác.', offSummaries: '{n} bản tóm tắt', offConversations: '{n} cuộc trò chuyện',
  offDo: 'Xóa và tắt', offKeep: 'Giữ bật',
  settings: 'Cài đặt', more: 'Trợ giúp, liên kết và giới thiệu',
  counting: 'Đang kiểm tra những gì sẽ bị xóa…', countFailed: 'Không kiểm tra được những gì sẽ bị xóa, nên chưa có gì thay đổi.', deleting: 'Đang xóa…', offFailed: 'Không tắt được. Công tắc đang hiển thị trạng thái đã lưu.', atLeast: 'ít nhất {n}', andSelf: ' và câu «Tôi đang trở thành…» của bạn', saveFailed: 'Không lưu được thay đổi. Công tắc đang hiển thị trạng thái đã lưu.', loadFailed: 'Không tải được cài đặt quyền riêng tư. Chưa có gì thay đổi — hãy thử lại.', retry: 'Thử lại',
  countsFailed: 'Không đếm được những gì đang lưu.', skillsFailed: 'Không tải được kỹ năng của bạn.',
};

const ko: MeCopy = {
  manage: '관리', noSkills: '아직 기술이 없어요.',
  journey: '나의 여정', counts: '요약 {s}개 · 대화 {c}개', openJourney: '나의 여정 열기',
  gKeep: 'Life가 보관하는 것', gHub: 'Hub의 TEC AI가 읽을 수 있는 것',
  gHubNote: '각 항목은 직접 켜기 전까지 꺼져 있어요. Hub의 TEC AI용이며, Life 코치용이 아니에요.',
  gReminder: '알림',
  keepJourney: '여정 요약 보관',
  keepJourneyDesc: '확인한 대화마다의 요약이에요. 켜 두면 코치가 이를 기억하고, 답할 때 목표·비전·기술을 봐요. 끄면: 요약이 삭제되고 코치는 매번 처음부터 시작해요.',
  keepConvs: '전체 대화 보관 (암호화)',
  keepConvsDesc: '다시 읽고 이어 가기 위한 전체 내용이에요. 별도 스위치: 코치는 가장 최근 대화만, 그것도 요약을 함께 보관할 때만 읽어요. 끄면: 모든 전체 대화가 삭제돼요.',
  storedNotRead: '지금: 나를 위해 보관 중이며, 요약이 꺼져 있어 코치는 읽지 않아요.',
  offConfirm: '지금 {n}을(를) 찾았어요. 확인하면 그 시점에 저장된 모든 항목이 삭제되며 되돌릴 수 없어요.', offSummaries: '요약 {n}개', offConversations: '대화 {n}개',
  offDo: '삭제하고 끄기', offKeep: '켜 두기',
  settings: '설정', more: '도움말, 링크, 앱 정보',
  counting: '삭제될 항목을 확인하는 중…', countFailed: '삭제될 항목을 확인하지 못해 아무것도 바꾸지 않았어요.', deleting: '삭제하는 중…', offFailed: '끄지 못했어요. 스위치는 지금 저장된 상태를 보여 줘요.', atLeast: '최소 {n}', andSelf: ' 그리고 «나는 ~이 되어 가요» 문장', saveFailed: '변경을 저장하지 못했어요. 스위치는 지금 저장된 상태를 보여 줘요.', loadFailed: '개인정보 설정을 불러오지 못했어요. 바뀐 건 없어요 — 다시 시도해 주세요.', retry: '다시 시도',
  countsFailed: '저장된 항목을 세지 못했어요.', skillsFailed: '기술 목록을 불러오지 못했어요.',
};

const zh: MeCopy = {
  manage: '管理', noSkills: '还没有技能。',
  journey: '我的历程', counts: '{s} 条摘要 · {c} 次对话', openJourney: '打开我的历程',
  gKeep: 'Life 保存的内容', gHub: 'Hub 中的 TEC AI 可以读取的内容',
  gHubNote: '每一类在你打开前都保持关闭。这是给 Hub 中的 TEC AI 的，不是给 Life 教练的。',
  gReminder: '提醒',
  keepJourney: '保存我的历程摘要',
  keepJourneyDesc: '你确认的每次对话的摘要。开启时，教练会记住它们，并在回复时看到你的目标、愿景和技能。关闭后：摘要会被删除，教练每次都从头开始。',
  keepConvs: '保存完整对话（加密）',
  keepConvsDesc: '完整内容，供你重读和继续。这是单独的开关：教练只读取最近一次，而且只在摘要也保存时才读。关闭后：所有完整对话都会被删除。',
  storedNotRead: '目前：为你保存，但教练不读取，因为摘要已关闭。',
  offConfirm: '目前找到 {n}。确认后，将删除执行时保存的全部内容，且无法撤销。', offSummaries: '{n} 条摘要', offConversations: '{n} 次对话',
  offDo: '删除并关闭', offKeep: '保持开启',
  settings: '设置', more: '帮助、链接与关于',
  counting: '正在核对将删除的内容…', countFailed: '无法核对将删除的内容，所以没有做任何更改。', deleting: '正在删除…', offFailed: '无法关闭。开关显示的是当前已保存的状态。', atLeast: '至少 {n}', andSelf: ' 以及你的「我正在成为……」这句话', saveFailed: '无法保存这项更改。开关显示的是当前已保存的状态。', loadFailed: '无法加载你的隐私设置。没有任何更改——请重试。', retry: '重试',
  countsFailed: '无法统计已保存的内容。', skillsFailed: '无法加载你的技能。',
};

const COPY: Partial<Record<Locale, MeCopy>> = { en, ar, es, fr, pt, tr, ru, hi, id, vi, ko, zh };
export const meCopy = (locale: Locale): MeCopy => COPY[locale] ?? en;
