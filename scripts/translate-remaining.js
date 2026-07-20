/**
 * Script to translate all remaining English keys across 9 non-English locales.
 * Keys handled: navigation labels, form fields, meta titles, dashboard,
 * calendar, booking (non-brand), etc.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs");

const LOCALES = ["ar", "de", "es", "fr", "it", "ja", "ko", "pt", "zh"];

// Load all locale files
const allData = {};
for (const loc of ["en", ...LOCALES]) {
  allData[loc] = JSON.parse(fs.readFileSync(`src/messages/${loc}.json`, "utf8"));
}

/**
 * Set a nested key in an object.
 * e.g. setNested(obj, "navigation.home", "Startseite")
 */
function setNested(obj, keyPath, value) {
  const parts = keyPath.split(".");
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) current[parts[i]] = {};
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

/**
 * Get a nested value from an object.
 */
function getNested(obj, keyPath) {
  const parts = keyPath.split(".");
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return current;
}

// ─── Translations map: key -> { locale: translated_value }
// Only keys that are genuinely translatable (not brand names, URLs, etc.)
const TRANSLATIONS = {
  // ── navigation ──
  "navigation.home": { it: "Home" },
  "navigation.services": { fr: "Services" },
  "navigation.portfolio": { de: "Portfolio", fr: "Portfolio", it: "Portfolio" },
  "navigation.contact": { fr: "Contact" },
  "navigation.blog": { de: "Blog", es: "Blog", fr: "Blog", it: "Blog", pt: "Blog" },
  "navigation.admin": { de: "Admin", es: "Admin", fr: "Admin", it: "Admin", pt: "Admin" },
  "navigation.resume": { de: "Lebenslauf", es: "Currículum", fr: "CV", it: "Curriculum", pt: "Currículo" },
  "navigation.search": { de: "Suche", es: "Buscar", fr: "Rechercher", it: "Cerca", pt: "Pesquisar" },
  "navigation.dashboard": { de: "Dashboard", es: "Panel", fr: "Tableau de bord", it: "Dashboard", pt: "Painel" },
  "navigation.signOut": { de: "Abmelden", es: "Cerrar sesión", fr: "Déconnexion", it: "Esci", pt: "Sair" },
  "navigation.signIn": { de: "Anmelden", es: "Iniciar sesión", fr: "Connexion", it: "Accedi", pt: "Entrar" },
  "navigation.toggleMenu": { de: "Menü umschalten", es: "Abrir menú", fr: "Ouvrir le menu", it: "Apri menu", pt: "Abrir menu" },

  // ── services meta & form ──
  "services.meta.title": { de: "Dienstleistungen | Emmett Anthony", fr: "Services | Emmett Anthony" },
  "services.title": { de: "Dienstleistungen", fr: "Services", it: "Servizi" },
  "services.form.email": { de: "E-Mail", es: "Correo electrónico", fr: "E-mail", it: "Email", pt: "E-mail" },
  "services.form.phone": { de: "Telefon", es: "Teléfono", fr: "Téléphone", it: "Telefono", pt: "Telefone" },
  "services.form.company": { de: "Unternehmen", es: "Empresa", fr: "Entreprise", it: "Azienda", pt: "Empresa" },
  "services.form.budget": { de: "Budget", es: "Presupuesto", fr: "Budget", it: "Budget", pt: "Orçamento" },
  "services.form.details": { de: "Projektdetails", es: "Detalles del proyecto", fr: "Détails du projet", it: "Dettagli del progetto", pt: "Detalhes do projeto" },
  "services.form.submit": { de: "Anfrage senden", es: "Enviar consulta", fr: "Envoyer la demande", it: "Invia richiesta", pt: "Enviar consulta" },
  "services.form.successTitle": { de: "Vielen Dank!", es: "¡Gracias!", fr: "Merci !", it: "Grazie!", pt: "Obrigado!" },
  "services.form.error": { de: "Fehler beim Senden. Bitte versuchen Sie es erneut.", es: "Error al enviar. Intente de nuevo.", fr: "Échec de l'envoi. Veuillez réessayer.", it: "Invio fallito. Riprova.", pt: "Falha ao enviar. Tente novamente." },

  // ── contact form ──
  "contact.form.fullName": { ar: "الاسم الكامل", ja: "フルネーム", zh: "全名" },
  "contact.form.email": { ar: "البريد الإلكتروني", ja: "メールアドレス", zh: "电子邮件" },
  "contact.form.phone": { ar: "الهاتف (اختياري)", ja: "電話番号（任意）", zh: "电话（选填）" },
  "contact.form.company": { ar: "الشركة (اختياري)", ja: "会社名（任意）", zh: "公司（选填）" },
  "contact.form.subject": { ar: "الموضوع", ja: "件名", zh: "主题" },
  "contact.form.message": { ar: "الرسالة", ja: "メッセージ", zh: "消息" },
  "contact.form.submit": { ar: "إرسال الرسالة", ja: "送信", zh: "发送消息" },
  "contact.form.success": { ar: "تم إرسال الرسالة!", ja: "送信しました！", zh: "消息已发送！" },
  "contact.form.error": { ar: "حدث خطأ ما. يرجى المحاولة مرة أخرى.", ja: "エラーが発生しました。もう一度お試しください。", zh: "出错了。请重试。" },
  "contact.form.namePlaceholder": { ar: "John Doe", ja: "山田 太郎", zh: "张三" },
  "contact.form.emailPlaceholder": { ar: "john@example.com", ja: "john@example.com", zh: "john@example.com" },
  "contact.form.phonePlaceholder": { ar: "+1 (555) 000-0000", ja: "+1 (555) 000-0000", zh: "+1 (555) 000-0000" },
  "contact.form.companyPlaceholder": { ar: "Acme Inc.", ja: "株式会社A社", zh: "某公司" },
  "contact.form.subjectPlaceholder": { ar: "استفسار عن مشروع", ja: "プロジェクトに関するお問い合わせ", zh: "项目咨询" },
  "contact.form.messagePlaceholder": { ar: "أخبرني عن مشروعك...", ja: "プロジェクトについて教えてください...", zh: "请告诉我您的项目详情..." },
  "contact.heroDescription": {
    ar: "هل لديك مشروع في ذهنك أو تريد فقط إلقاء التحية؟ يسعدني التواصل معك. املأ النموذج أدناه وسأرد عليك في أقرب وقت ممكن.",
    ja: "プロジェクトのアイデアがありますか？それとも単にご挨拶したいだけですか？お気軽にご連絡ください。以下のフォームにご記入いただければ、できるだけ早くご返信いたします。",
    zh: "有项目想法或只是想打个招呼？我很乐意收到您的来信。请填写下面的表格，我会尽快回复您。"
  },

  // ── about page ──
  "about.title": { de: "Über mich", it: "Chi sono", pt: "Sobre mim" },
  "about.technologies": { de: "Technologien", it: "Tecnologie", pt: "Tecnologias" },
  "about.experience": { de: "Erfahrung", it: "Esperienza", pt: "Experiência" },
  "about.cta": { de: "Lass uns zusammenarbeiten", it: "Collaboriamo", pt: "Vamos trabalhar juntos" },
  "about.techStack.categories.devops": { es: "DevOps y Herramientas", fr: "DevOps et Outils", it: "DevOps e Strumenti" },

  // ── booking (non-brand) ──
  "booking.message": { ar: "رسالة", ja: "メッセージ", zh: "留言", de: "Nachricht", it: "Messaggio", pt: "Mensagem" },
  "booking.name": { ar: "الاسم *", ja: "お名前 *", zh: "姓名 *", de: "Name *", it: "Nome *", pt: "Nome *" },
  "booking.namePlaceholder": { ar: "اسمك", ja: "あなたの名前", zh: "您的姓名", de: "Ihr Name", it: "Il tuo nome", pt: "Seu nome" },
  "booking.phone": { ar: "الهاتف", ja: "電話番号", zh: "电话", de: "Telefon", it: "Telefono", pt: "Telefone" },
  "booking.phonePlaceholder": { ar: "+1 (555) 000-0000", ja: "+1 (555) 000-0000", zh: "+1 (555) 000-0000", de: "+1 (555) 000-0000", it: "+1 (555) 000-0000", pt: "+1 (555) 000-0000" },
  "booking.consultation.availability2": { es: "9:00 a. m. – 6:00 p. m." },
  "booking.am": { de: "AM", es: "a. m.", fr: "AM", it: "AM", pt: "AM" },
  "booking.pm": { de: "PM", es: "p. m.", fr: "PM", it: "PM", pt: "PM" },
  "booking.faq": { de: "FAQ", es: "FAQ", fr: "FAQ", it: "FAQ", ko: "FAQ", pt: "FAQ" },
  "booking.form.budget": { de: "Budget", fr: "Budget", it: "Budget" },
  "booking.form.timeline": { de: "Zeitplan", fr: "Calendrier", it: "Cronologia" },
  "booking.form.projectType": { ar: "نوع المشروع", de: "Projekttyp", it: "Tipo di progetto", ja: "プロジェクトの種類", ko: "프로젝트 유형", zh: "项目类型" },
  "booking.form.country": { ar: "البلد", de: "Land", it: "Paese", ja: "国", ko: "국가", zh: "国家" },
  "booking.form.company": { ar: "الشركة", de: "Unternehmen", it: "Azienda", ja: "会社名", ko: "회사", zh: "公司" },
  "booking.form.email": { ar: "البريد الإلكتروني", de: "E-Mail", it: "Email", ja: "メールアドレス", ko: "이메일", zh: "电子邮件" },
  "booking.form.phone": { ar: "رقم الهاتف", de: "Telefonnummer", it: "Numero di telefono", ja: "電話番号", ko: "전화번호", zh: "电话号码" },
  "booking.form.booking": { ar: "حجز", de: "Buchung", it: "Prenotazione", ja: "予約", ko: "예약", zh: "预订" },
  "booking.form.termsAgreement": { ar: "بإرسال هذا النموذج، فإنك توافق على الشروط وسياسة الخصوصية.", de: "Mit dem Absenden stimmen Sie den Allgemeinen Geschäftsbedingungen und der Datenschutzerklärung zu.", fr: "En soumettant ce formulaire, vous acceptez les conditions générales et la politique de confidentialité.", it: "Inviando, accetti i termini e l'informativa sulla privacy.", ja: "送信することで、利用規約とプライバシーポリシーに同意したことになります。", ko: "제출함으로써 이용약관 및 개인정보처리방침에 동의합니다.", pt: "Ao enviar, você concorda com os termos e a política de privacidade.", zh: "提交即表示您同意条款和隐私政策。" },
  "booking.form.monthApril": { ar: "أبريل", de: "April", it: "Aprile", ja: "4月", ko: "4월", zh: "四月" },
  "booking.form.monthMay": { ar: "مايو", de: "Mai", it: "Maggio", ja: "5月", ko: "5월", zh: "五月" },
  "booking.form.monthJune": { ar: "يونيو", de: "Juni", it: "Giugno", ja: "6月", ko: "6월", zh: "六月" },
  "booking.form.monthJuly": { ar: "يوليو", de: "Juli", it: "Luglio", ja: "7月", ko: "7월", zh: "七月" },
  "booking.form.monthAugust": { ar: "أغسطس", de: "August", it: "Agosto", ja: "8月", ko: "8월", zh: "八月" },
  "booking.form.dayShortMon": { ar: "إثن", de: "Mo", it: "Lun", ja: "月", ko: "월", zh: "周一" },
  "booking.form.dayShortTue": { ar: "ثلاثاء", de: "Di", it: "Mar", ja: "火", ko: "화", zh: "周二" },
  "booking.form.dayShortWed": { ar: "أربعاء", de: "Mi", it: "Mer", ja: "水", ko: "수", zh: "周三" },
  "booking.form.dayShortThu": { ar: "خميس", de: "Do", it: "Gio", ja: "木", ko: "목", zh: "周四" },
  "booking.form.dayShortFri": { ar: "جمعة", de: "Fr", it: "Ven", ja: "金", ko: "금", zh: "周五" },
  "booking.form.dayShortSat": { ar: "سبت", de: "Sa", it: "Sab", ja: "土", ko: "토", zh: "周六" },
  "booking.form.dayShortSun": { ar: "أحد", de: "So", it: "Dom", ja: "日", ko: "일", zh: "周日" },

  // ── calendar ──
  "calendar.eventForm.type": { ar: "النوع", de: "Typ", it: "Tipo", ja: "種類", ko: "유형", zh: "类型" },
  "calendar.eventForm.status": { ar: "الحالة", de: "Status", it: "Stato", ja: "ステータス", ko: "상태", zh: "状态" },
  "calendar.eventForm.priority": { ar: "الأولوية", de: "Priorität", it: "Priorità", ja: "優先度", ko: "우선순위", zh: "优先级" },
  "calendar.eventForm.color": { ar: "اللون", de: "Farbe", it: "Colore", ja: "色", ko: "색상", zh: "颜色" },
  "calendar.eventForm.location": { ar: "الموقع", de: "Ort", it: "Luogo", ja: "場所", ko: "장소", zh: "地点" },
  "calendar.eventForm.description": { ar: "الوصف", de: "Beschreibung", it: "Descrizione", ja: "説明", ko: "설명", zh: "描述" },
  "calendar.eventForm.notes": { ar: "ملاحظات", de: "Notizen", it: "Note", ja: "メモ", ko: "메모", zh: "备注" },
  "calendar.eventForm.createEvent": { ar: "إنشاء حدث", de: "Ereignis erstellen", it: "Crea evento", ja: "イベントを作成", ko: "이벤트 만들기", zh: "创建事件" },
  "calendar.eventForm.editEvent": { ar: "تعديل الحدث", de: "Ereignis bearbeiten", it: "Modifica evento", ja: "イベントを編集", ko: "이벤트 수정", zh: "编辑事件" },
  "calendar.sync.google": { ar: "تقويم Google", de: "Google Kalender", it: "Google Calendar", ja: "Googleカレンダー", ko: "Google 캘린더", zh: "Google日历" },
  "calendar.sync.outlook": { ar: "تقويم Outlook", de: "Outlook Kalender", it: "Outlook Calendar", ja: "Outlookカレンダー", ko: "Outlook 캘린더", zh: "Outlook日历" },
  "calendar.sync.apple": { ar: "تقويم Apple", de: "Apple Kalender", it: "Apple Calendar", ja: "Appleカレンダー", ko: "Apple 캘린더", zh: "Apple日历" },

  // ── dashboard ──
  "dashboard.title": { de: "Dashboard", es: "Panel de control", fr: "Tableau de bord", it: "Dashboard", pt: "Painel" },
  "dashboard.languages": { de: "Sprachen", es: "Idiomas", fr: "Langues", it: "Lingue", pt: "Idiomas" },
  "dashboard.translations": { de: "Übersetzungen", es: "Traducciones", fr: "Traductions", it: "Traduzioni", pt: "Traduções" },
  "dashboard.settings": { de: "Einstellungen", es: "Configuración", fr: "Paramètres", it: "Impostazioni", pt: "Configurações" },
  "dashboard.header.dashboard": { de: "Dashboard", es: "Panel", fr: "Tableau de bord", it: "Dashboard", pt: "Painel" },
  "dashboard.header.admin": { de: "Admin", es: "Admin", fr: "Admin", it: "Admin", pt: "Admin" },
  "dashboard.homePage.blog": { de: "Blog", es: "Blog", fr: "Blog", it: "Blog", pt: "Blog" },
  "dashboard.homePage.services": { de: "Dienstleistungen", es: "Servicios", fr: "Services", it: "Servizi", pt: "Serviços" },
  "dashboard.homePage.portfolio": { de: "Portfolio", es: "Portafolio", fr: "Portfolio", it: "Portfolio", pt: "Portfólio" },
  "dashboard.homePage.testimonials": { de: "Testimonials", es: "Testimonios", fr: "Témoignages", it: "Testimonianze", pt: "Depoimentos" },
  "dashboard.homePage.technologies": { de: "Technologien", es: "Tecnologías", fr: "Technologies", it: "Tecnologie", pt: "Tecnologias" },
  "dashboard.homePage.faqs": { de: "FAQs", es: "PUF", fr: "FAQ", it: "FAQ", pt: "FAQs" },
  "dashboard.homePage.ctaNewsletter": { de: "CTA & Newsletter", es: "CTA y boletín", fr: "CTA et newsletter", it: "CTA e Newsletter", pt: "CTA e newsletter" },
  "dashboard.homePage.settingsSeo": { de: "Einstellungen & SEO", es: "Configuración y SEO", fr: "Paramètres et SEO", it: "Impostazioni e SEO", pt: "Configurações e SEO" },

  // ── admin login ──
  "admin.login.title": { de: "Admin-Login", it: "Accesso amministratore" },
  "admin.login.subtitle": { de: "Melden Sie sich an, um Ihr Portfolio zu verwalten", it: "Accedi per gestire il tuo portfolio" },
  "admin.login.username": { de: "Benutzername", it: "Nome utente" },
  "admin.login.password": { de: "Passwort", it: "Password" },
  "admin.login.signIn": { de: "Anmelden", it: "Accedi" },
  "admin.login.signingIn": { de: "Wird angemeldet...", it: "Accesso in corso..." },
  "admin.login.invalidCredentials": { de: "Ungültiger Benutzername oder Passwort", it: "Nome utente o password non validi" },
  "admin.login.errorOccurred": { de: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.", it: "Si è verificato un errore. Riprova." },

  // ── footer ──
  "footer.pages": { de: "Seiten", es: "Páginas", fr: "Pages", it: "Pagine", pt: "Páginas" },
  "footer.services": { de: "Dienstleistungen", fr: "Services", it: "Servizi" },
  "footer.contact": { de: "Kontakt", fr: "Contact", it: "Contatti" },

  // ── chat ──
  "chat.online": { ar: "متصل", de: "Online", ja: "オンライン", ko: "온라인", zh: "在线" },
  "chat.typing": { ar: "يكتب...", de: "Schreibt...", ja: "入力中...", ko: "입력 중...", zh: "正在输入..." },
  "chat.close": { ar: "إغلاق", de: "Schließen", it: "Chiudi", ja: "閉じる", ko: "닫기", zh: "关闭" },
  "chat.dismiss": { ar: "رفض", de: "Ablehnen", it: "Ignora", ja: "閉じる", ko: "닫기", zh: "关闭" },
  "chat.minimize": { ar: "تصغير", de: "Minimieren", it: "Riduci a icona", ja: "最小化", ko: "최소화", zh: "最小化" },
  "chat.maximize": { ar: "تكبير", de: "Maximieren", it: "Ingrandisci", ja: "最大化", ko: "최대화", zh: "最大化" },
  "chat.closeChat": { ar: "إغلاق المحادثة", de: "Chat schließen", it: "Chiudi chat", ja: "チャットを閉じる", ko: "채팅 닫기", zh: "关闭聊天" },
  "chat.openChat": { ar: "فتح المحادثة", de: "Chat öffnen", it: "Apri chat", ja: "チャットを開く", ko: "채팅 열기", zh: "打开聊天" },

  // ── newsletter ──
  "newsletter.badge": { ar: "النشرة البريدية", de: "Newsletter", it: "Newsletter", ja: "ニュースレター", ko: "뉴스레터", zh: "新闻通讯" },
  "newsletter.close": { ar: "إغلاق", de: "Schließen", it: "Chiudi", ja: "閉じる", ko: "닫기", zh: "关闭" },

  // ── testimonials ──
  "testimonials.analytics.total": { ar: "الإجمالي", de: "Gesamt", it: "Totale", ja: "合計", ko: "합계", zh: "总计" },
  "testimonials.analytics.approved": { ar: "معتمد", de: "Genehmigt", it: "Approvato", ja: "承認済み", ko: "승인됨", zh: "已批准" },
  "testimonials.analytics.featured": { ar: "مميز", de: "Hervorgehoben", it: "In primo piano", ja: "注目", ko: "추천", zh: "精选" },
  "testimonials.analytics.archived": { ar: "مؤرشف", de: "Archiviert", it: "Archiviato", ja: "アーカイブ", ko: "보관됨", zh: "已归档" },
  "testimonials.searchTestimonials": { ar: "البحث في الشهادات...", de: "Testimonials durchsuchen...", it: "Cerca testimonianze...", ja: "お客様の声を検索...", ko: "추천사 검색...", zh: "搜索推荐..." },

  // ── resume ──
  "resume.certifications": { ar: "الشهادات", de: "Zertifizierungen", it: "Certificazioni", ja: "認定資格", ko: "자격증", zh: "认证" },
  "resume.title": { de: "Lebenslauf", it: "Curriculum", pt: "Currículo" },
  "resume.download": { ar: "تحميل السيرة الذاتية", de: "Lebenslauf herunterladen", it: "Scarica CV", ja: "履歴書をダウンロード", ko: "이력서 다운로드", zh: "下载简历" },
  "resume.experience": { ar: "الخبرة", de: "Erfahrung", it: "Esperienza", ja: "経験", ko: "경력", zh: "经验" },
  "resume.skills": { ar: "المهارات", de: "Fähigkeiten", it: "Competenze", ja: "スキル", ko: "기술", zh: "技能" },
  "resume.education": { ar: "التعليم", de: "Bildung", it: "Istruzione", ja: "学歴", ko: "교육", zh: "教育" },
  "resume.gpa": { ar: "المعدل:", de: "Notendurchschnitt:", it: "Media:", ja: "GPA:", ko: "학점:", zh: "GPA：" },
  "resume.present": { ar: "حتى الآن", de: "Heute", it: "Presente", ja: "現在", ko: "현재", zh: "至今" },
  "resume.contact": { ar: "معلومات الاتصال", de: "Kontaktinformationen", it: "Informazioni di contatto", ja: "連絡先", ko: "연락처", zh: "联系方式" },

  // ── language switcher ──
  "languageSwitcher.search": { ar: "بحث...", de: "Suche...", it: "Cerca...", ja: "検索...", ko: "검색...", zh: "搜索..." },
  "languageSwitcher.noResults": { ar: "لم يتم العثور على لغات", de: "Keine Sprachen gefunden", it: "Nessuna lingua trovata", ja: "言語が見つかりません", ko: "언어를 찾을 수 없습니다", zh: "未找到语言" },
  "languageSwitcher.ariaLabel": { ar: "تغيير اللغة", de: "Sprache wechseln", it: "Cambia lingua", ja: "言語を切り替え", ko: "언어 전환", zh: "切换语言" },

  // ── back to top ──
  "backToTop.ariaLabel": { ar: "العودة إلى الأعلى", de: "Nach oben", it: "Torna su", ja: "トップに戻る", ko: "맨 위로", zh: "回到顶部" },

  // ── common ──
  "common.loading": { ar: "جارٍ التحميل...", de: "Laden...", it: "Caricamento...", ja: "読み込み中...", ko: "로딩 중...", zh: "加载中..." },
  "common.error": { ar: "حدث خطأ ما", de: "Etwas ist schiefgelaufen", it: "Qualcosa è andato storto", ja: "エラーが発生しました", ko: "문제가 발생했습니다", zh: "出了点问题" },
  "common.retry": { ar: "إعادة المحاولة", de: "Wiederholen", it: "Riprova", ja: "再試行", ko: "재시도", zh: "重试" },
  "common.save": { ar: "حفظ", de: "Speichern", it: "Salva", ja: "保存", ko: "저장", zh: "保存" },
  "common.cancel": { ar: "إلغاء", de: "Abbrechen", it: "Annulla", ja: "キャンセル", ko: "취소", zh: "取消" },
  "common.delete": { ar: "حذف", de: "Löschen", it: "Elimina", ja: "削除", ko: "삭제", zh: "删除" },
  "common.edit": { ar: "تعديل", de: "Bearbeiten", it: "Modifica", ja: "編集", ko: "수정", zh: "编辑" },
  "common.create": { ar: "إنشاء", de: "Erstellen", it: "Crea", ja: "作成", ko: "만들기", zh: "创建" },
  "common.search": { ar: "بحث", de: "Suche", it: "Cerca", ja: "検索", ko: "검색", zh: "搜索" },
  "common.back": { ar: "رجوع", de: "Zurück", it: "Indietro", ja: "戻る", ko: "뒤로", zh: "返回" },
  "common.next": { ar: "التالي", de: "Weiter", it: "Avanti", ja: "次へ", ko: "다음", zh: "下一步" },
  "common.previous": { ar: "السابق", de: "Zurück", it: "Precedente", ja: "前へ", ko: "이전", zh: "上一步" },
  "common.close": { ar: "إغلاق", de: "Schließen", it: "Chiudi", ja: "閉じる", ko: "닫기", zh: "关闭" },
  "common.confirm": { ar: "تأكيد", de: "Bestätigen", it: "Conferma", ja: "確認", ko: "확인", zh: "确认" },
  "common.yes": { ar: "نعم", de: "Ja", it: "Sì", ja: "はい", ko: "예", zh: "是" },
  "common.no": { ar: "لا", de: "Nein", it: "No", ja: "いいえ", ko: "아니오", zh: "否" },
  "common.showMore": { ar: "عرض المزيد", de: "Mehr anzeigen", it: "Mostra altro", ja: "もっと見る", ko: "더보기", zh: "显示更多" },
  "common.showLess": { ar: "عرض أقل", de: "Weniger anzeigen", it: "Mostra meno", ja: "折りたたむ", ko: "접기", zh: "收起" },
  "common.viewAll": { ar: "عرض الكل", de: "Alle anzeigen", it: "Mostra tutto", ja: "すべて表示", ko: "모두 보기", zh: "查看全部" },
  "common.learnMore": { ar: "اعرف المزيد", de: "Mehr erfahren", it: "Scopri di più", ja: "もっと詳しく", ko: "자세히 알아보기", zh: "了解更多" },
  "common.darkMode": { ar: "الوضع الداكن", de: "Dunkelmodus", it: "Modalità scura", ja: "ダークモード", ko: "다크 모드", zh: "深色模式" },
  "common.lightMode": { ar: "الوضع الفاتح", de: "Hellmodus", it: "Modalità chiara", ja: "ライトモード", ko: "라이트 모드", zh: "浅色模式" },
  "common.language": { ar: "اللغة", de: "Sprache", it: "Lingua", ja: "言語", ko: "언어", zh: "语言" },
  "common.share": { ar: "مشاركة", de: "Teilen", it: "Condividi", ja: "シェア", ko: "공유", zh: "分享" },
  "common.upload": { ar: "رفع", de: "Hochladen", it: "Carica", ja: "アップロード", ko: "업로드", zh: "上传" },
};

console.log("=== Translating remaining keys... ===\n");

let totalKeysUpdated = 0;
let totalLocalesUpdated = 0;

for (const [key, localeValues] of Object.entries(TRANSLATIONS)) {
  for (const [locale, value] of Object.entries(localeValues)) {
    const currentVal = getNested(allData[locale], key);
    if (currentVal !== undefined && currentVal !== value) {
      setNested(allData[locale], key, value);
      totalKeysUpdated++;
      totalLocalesUpdated++;
      console.log(`  ${key} [${locale}]: "${currentVal}" → "${value}"`);
    }
  }
}

console.log(`\nTotal keys updated: ${totalKeysUpdated}`);
console.log(`Total locale-file writes: ${totalLocalesUpdated}`);

// Write all locale files
for (const loc of LOCALES) {
  fs.writeFileSync(
    `src/messages/${loc}.json`,
    JSON.stringify(allData[loc], null, 2) + "\n",
    "utf8"
  );
}

console.log("\n✓ All locale files written successfully!");
console.log("\nDone!");
