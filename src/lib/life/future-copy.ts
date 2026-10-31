// The words of «مستقبلي» — my future (owner, 2026-10-31), in all twelve languages: the one-year
// vision, the life areas the person chooses, and the area a goal serves. The six areas are the
// owner's list (KB audits/LIFE_MEMORY_AND_HUMAN_BUILDING_2026-10-23.md §2). A missing key can only
// fall back to English.
import type { Locale } from '@/lib/i18n/locales';

export const LIFE_AREAS = ['HEALTH', 'WORK', 'FAMILY', 'FAITH', 'MONEY', 'LEARNING'] as const;
export type LifeArea = (typeof LIFE_AREAS)[number];

export interface FutureCopy {
  title: string; hint: string;
  visionLabel: string; visionPh: string; visionEmpty: string;
  areasLabel: string; areasHint: string; notePh: string;
  edit: string; save: string; cancel: string; failed: string;
  goalArea: string; noArea: string;
  area: Record<LifeArea, string>;
}

const en: FutureCopy = {
  title: 'My future', hint: 'Where you are heading — in your words. Life uses it only to connect what you say to where you want to go.',
  visionLabel: 'A year from now, who do you want to be?', visionPh: 'A year from now I want to be…', visionEmpty: 'Not written yet. One sentence is enough.',
  areasLabel: 'The areas of your life you want to grow in', areasHint: 'Choose the ones that matter to you now. A line for each is optional.', notePh: 'Where you want to be in it, in a year',
  edit: 'Edit', save: 'Save', cancel: 'Cancel', failed: 'Could not save — try again.',
  goalArea: 'Area', noArea: 'No area',
  area: { HEALTH: 'Health', WORK: 'Work', FAMILY: 'Family', FAITH: 'Faith', MONEY: 'Money', LEARNING: 'Learning' },
};

const ar: FutureCopy = {
  title: 'مستقبلي', hint: 'إلى أين تتجه — بكلماتك. يستعمله Life فقط ليربط ما تقوله بما تريد الوصول إليه.',
  visionLabel: 'بعد سنة من الآن، من تريد أن تكون؟', visionPh: 'بعد سنة أريد أن أكون…', visionEmpty: 'لم تُكتب بعد. جملة واحدة تكفي.',
  areasLabel: 'مجالات حياتك التي تريد أن تنمو فيها', areasHint: 'اختر ما يهمّك الآن. سطر لكل مجال اختياري.', notePh: 'أين تريد أن تكون فيه بعد سنة',
  edit: 'تعديل', save: 'حفظ', cancel: 'إلغاء', failed: 'تعذّر الحفظ — حاول مرة أخرى.',
  goalArea: 'المجال', noArea: 'بلا مجال',
  area: { HEALTH: 'الصحة', WORK: 'العمل', FAMILY: 'الأسرة', FAITH: 'الدين', MONEY: 'المال', LEARNING: 'التعلّم' },
};

const es: FutureCopy = {
  title: 'Mi futuro', hint: 'Hacia dónde vas — con tus palabras. Life lo usa solo para unir lo que dices con adonde quieres llegar.',
  visionLabel: 'Dentro de un año, ¿quién quieres ser?', visionPh: 'Dentro de un año quiero ser…', visionEmpty: 'Aún no escrito. Basta una frase.',
  areasLabel: 'Las áreas de tu vida en las que quieres crecer', areasHint: 'Elige las que te importan ahora. Una línea para cada una es opcional.', notePh: 'Dónde quieres estar en ella dentro de un año',
  edit: 'Editar', save: 'Guardar', cancel: 'Cancelar', failed: 'No se pudo guardar — inténtalo de nuevo.',
  goalArea: 'Área', noArea: 'Sin área',
  area: { HEALTH: 'Salud', WORK: 'Trabajo', FAMILY: 'Familia', FAITH: 'Fe', MONEY: 'Dinero', LEARNING: 'Aprendizaje' },
};

const fr: FutureCopy = {
  title: 'Mon avenir', hint: 'Où vous allez — avec vos mots. Life s’en sert seulement pour relier ce que vous dites à là où vous voulez aller.',
  visionLabel: 'Dans un an, qui voulez-vous être ?', visionPh: 'Dans un an, je veux être…', visionEmpty: 'Pas encore écrit. Une phrase suffit.',
  areasLabel: 'Les domaines de votre vie où vous voulez grandir', areasHint: 'Choisissez ceux qui comptent pour vous maintenant. Une ligne pour chacun est facultative.', notePh: 'Où vous voulez en être dans un an',
  edit: 'Modifier', save: 'Enregistrer', cancel: 'Annuler', failed: 'Échec de l’enregistrement — réessayez.',
  goalArea: 'Domaine', noArea: 'Aucun domaine',
  area: { HEALTH: 'Santé', WORK: 'Travail', FAMILY: 'Famille', FAITH: 'Foi', MONEY: 'Argent', LEARNING: 'Apprentissage' },
};

const pt: FutureCopy = {
  title: 'Meu futuro', hint: 'Para onde você vai — com suas palavras. O Life usa isso só para ligar o que você diz a onde quer chegar.',
  visionLabel: 'Daqui a um ano, quem você quer ser?', visionPh: 'Daqui a um ano quero ser…', visionEmpty: 'Ainda não escrito. Uma frase basta.',
  areasLabel: 'As áreas da sua vida em que você quer crescer', areasHint: 'Escolha as que importam para você agora. Uma linha para cada é opcional.', notePh: 'Onde você quer estar nela daqui a um ano',
  edit: 'Editar', save: 'Salvar', cancel: 'Cancelar', failed: 'Não foi possível salvar — tente de novo.',
  goalArea: 'Área', noArea: 'Sem área',
  area: { HEALTH: 'Saúde', WORK: 'Trabalho', FAMILY: 'Família', FAITH: 'Fé', MONEY: 'Dinheiro', LEARNING: 'Aprendizado' },
};

const tr: FutureCopy = {
  title: 'Geleceğim', hint: 'Nereye gittiğin — kendi sözlerinle. Life bunu yalnızca söylediklerini varmak istediğin yere bağlamak için kullanır.',
  visionLabel: 'Bir yıl sonra kim olmak istiyorsun?', visionPh: 'Bir yıl sonra … olmak istiyorum', visionEmpty: 'Henüz yazılmadı. Bir cümle yeter.',
  areasLabel: 'Hayatında büyümek istediğin alanlar', areasHint: 'Şu an senin için önemli olanları seç. Her biri için bir satır isteğe bağlı.', notePh: 'Bir yıl sonra bu alanda nerede olmak istiyorsun',
  edit: 'Düzenle', save: 'Kaydet', cancel: 'Vazgeç', failed: 'Kaydedilemedi — tekrar dene.',
  goalArea: 'Alan', noArea: 'Alan yok',
  area: { HEALTH: 'Sağlık', WORK: 'İş', FAMILY: 'Aile', FAITH: 'İnanç', MONEY: 'Para', LEARNING: 'Öğrenme' },
};

const ru: FutureCopy = {
  title: 'Моё будущее', hint: 'Куда вы идёте — вашими словами. Life использует это только чтобы связать сказанное с тем, куда вы хотите прийти.',
  visionLabel: 'Кем вы хотите быть через год?', visionPh: 'Через год я хочу быть…', visionEmpty: 'Пока не написано. Достаточно одного предложения.',
  areasLabel: 'Сферы жизни, в которых вы хотите расти', areasHint: 'Выберите то, что важно для вас сейчас. Строка для каждой — по желанию.', notePh: 'Где вы хотите быть в ней через год',
  edit: 'Изменить', save: 'Сохранить', cancel: 'Отмена', failed: 'Не удалось сохранить — попробуйте ещё раз.',
  goalArea: 'Сфера', noArea: 'Без сферы',
  area: { HEALTH: 'Здоровье', WORK: 'Работа', FAMILY: 'Семья', FAITH: 'Вера', MONEY: 'Деньги', LEARNING: 'Учёба' },
};

const hi: FutureCopy = {
  title: 'मेरा भविष्य', hint: 'आप कहाँ जा रहे हैं — आपके शब्दों में। Life इसे सिर्फ़ आपकी बात को आपकी मंज़िल से जोड़ने के लिए इस्तेमाल करता है।',
  visionLabel: 'एक साल बाद आप कौन बनना चाहते हैं?', visionPh: 'एक साल बाद मैं बनना चाहता/चाहती हूँ…', visionEmpty: 'अभी लिखा नहीं गया। एक वाक्य काफ़ी है।',
  areasLabel: 'जीवन के वे क्षेत्र जिनमें आप बढ़ना चाहते हैं', areasHint: 'जो अभी आपके लिए मायने रखते हैं, उन्हें चुनें। हर एक के लिए एक पंक्ति वैकल्पिक है।', notePh: 'एक साल बाद आप इसमें कहाँ होना चाहते हैं',
  edit: 'बदलें', save: 'सहेजें', cancel: 'रद्द करें', failed: 'सहेजा नहीं जा सका — फिर कोशिश करें।',
  goalArea: 'क्षेत्र', noArea: 'कोई क्षेत्र नहीं',
  area: { HEALTH: 'स्वास्थ्य', WORK: 'काम', FAMILY: 'परिवार', FAITH: 'आस्था', MONEY: 'पैसा', LEARNING: 'सीखना' },
};

const id: FutureCopy = {
  title: 'Masa depanku', hint: 'Ke mana kamu menuju — dengan kata-katamu. Life memakainya hanya untuk menghubungkan ucapanmu dengan tujuanmu.',
  visionLabel: 'Setahun dari sekarang, kamu ingin menjadi siapa?', visionPh: 'Setahun lagi aku ingin menjadi…', visionEmpty: 'Belum ditulis. Satu kalimat cukup.',
  areasLabel: 'Bidang hidupmu yang ingin kamu kembangkan', areasHint: 'Pilih yang penting bagimu sekarang. Satu baris untuk masing-masing boleh dikosongkan.', notePh: 'Di mana kamu ingin berada setahun lagi',
  edit: 'Ubah', save: 'Simpan', cancel: 'Batal', failed: 'Gagal menyimpan — coba lagi.',
  goalArea: 'Bidang', noArea: 'Tanpa bidang',
  area: { HEALTH: 'Kesehatan', WORK: 'Pekerjaan', FAMILY: 'Keluarga', FAITH: 'Iman', MONEY: 'Keuangan', LEARNING: 'Belajar' },
};

const vi: FutureCopy = {
  title: 'Tương lai của tôi', hint: 'Bạn đang hướng tới đâu — bằng lời của bạn. Life chỉ dùng nó để nối điều bạn nói với nơi bạn muốn đến.',
  visionLabel: 'Một năm nữa, bạn muốn trở thành người thế nào?', visionPh: 'Một năm nữa tôi muốn trở thành…', visionEmpty: 'Chưa viết. Một câu là đủ.',
  areasLabel: 'Những lĩnh vực trong đời bạn muốn phát triển', areasHint: 'Chọn những gì quan trọng với bạn lúc này. Mỗi lĩnh vực một dòng, không bắt buộc.', notePh: 'Một năm nữa bạn muốn ở đâu trong lĩnh vực này',
  edit: 'Sửa', save: 'Lưu', cancel: 'Hủy', failed: 'Không lưu được — thử lại.',
  goalArea: 'Lĩnh vực', noArea: 'Không có',
  area: { HEALTH: 'Sức khỏe', WORK: 'Công việc', FAMILY: 'Gia đình', FAITH: 'Đức tin', MONEY: 'Tiền bạc', LEARNING: 'Học tập' },
};

const ko: FutureCopy = {
  title: '나의 미래', hint: '어디로 가고 있는지 — 당신의 말로. Life는 당신의 말을 가고 싶은 곳과 잇는 데에만 이것을 씁니다.',
  visionLabel: '1년 뒤, 어떤 사람이 되고 싶나요?', visionPh: '1년 뒤 나는 … 사람이 되고 싶다', visionEmpty: '아직 쓰지 않았어요. 한 문장이면 충분해요.',
  areasLabel: '성장하고 싶은 삶의 영역', areasHint: '지금 중요한 것을 고르세요. 영역마다 한 줄은 선택 사항입니다.', notePh: '1년 뒤 이 영역에서 어디에 있고 싶은지',
  edit: '수정', save: '저장', cancel: '취소', failed: '저장하지 못했어요 — 다시 시도하세요.',
  goalArea: '영역', noArea: '영역 없음',
  area: { HEALTH: '건강', WORK: '일', FAMILY: '가족', FAITH: '신앙', MONEY: '돈', LEARNING: '배움' },
};

const zh: FutureCopy = {
  title: '我的未来', hint: '你要去往哪里——用你自己的话。Life 只用它把你说的话和你想去的地方联系起来。',
  visionLabel: '一年后，你想成为怎样的人？', visionPh: '一年后我想成为……', visionEmpty: '还没写。一句话就够了。',
  areasLabel: '你想成长的生活领域', areasHint: '选出现在对你重要的领域。每个领域写一行，可选。', notePh: '一年后你想在这个领域达到哪里',
  edit: '编辑', save: '保存', cancel: '取消', failed: '保存失败——请重试。',
  goalArea: '领域', noArea: '无领域',
  area: { HEALTH: '健康', WORK: '工作', FAMILY: '家庭', FAITH: '信仰', MONEY: '金钱', LEARNING: '学习' },
};

const COPY: Record<Locale, FutureCopy> = { en, ar, es, fr, pt, tr, ru, hi, id, vi, ko, zh };

export const futureCopy = (locale: Locale): FutureCopy => COPY[locale] ?? en;
