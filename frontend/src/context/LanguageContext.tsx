"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type SupportedLanguage = "English" | "Hindi" | "Hinglish";

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
}

const translations: Record<SupportedLanguage, Record<string, string>> = {
  English: {
    // Nav & Brand
    "app.title": "Bharat Academix",
    "app.subtitle": "AI Teacher",
    "nav.dashboard": "Dashboard",
    "nav.new_lesson": "New Lesson",
    "nav.history": "Learning History",
    "nav.settings": "Settings",
    "user.role": "Standard Learner",

    // Dashboard
    "dash.welcome": "Welcome back",
    "dash.mastered": "Mastered",
    "dash.to_revise": "To Revise",
    "dash.cta_badge": "Autonomous Adaptive Teacher",
    "dash.cta_title": "What do you want to master today?",
    "dash.cta_desc": "Upload study material or enter any topic. Our AI Teacher will structure a pacing-conscious lesson, explain with an animated avatar & live whiteboard, and dynamically adapt to your answers.",
    "dash.cta_btn": "Start a New Lesson",
    "dash.continue_learning": "Continue Learning",
    "dash.resume_class": "Resume Class",
    "dash.curriculum_rec": "Curriculum Path Recommendation",
    "dash.recent_lessons": "Recent Lessons",
    "dash.no_lessons": "No lessons completed yet.",
    "dash.create_first": "Create your first lesson →",
    "dash.view": "View",

    // Create Lesson
    "create.step": "Step 1 of 3",
    "create.title": "What do you want to learn today?",
    "create.subtitle": "Choose whether to upload existing documents or enter any topic to explore.",
    "create.upload_title": "Upload Material",
    "create.upload_desc": "Upload PDF, Word (DOCX), PowerPoint (PPTX), or Notes for grounded RAG teaching.",
    "create.topic_title": "Enter a Topic",
    "create.topic_desc": "Tell the AI teacher any concept or subject you want to master from scratch.",
    "create.drag_drop": "Drag and drop your file here, or",
    "create.browse": "browse files",
    "create.supported_formats": "Supported: PDF, DOCX, PPTX, TXT, MD (Max 25 MB)",
    "create.topic_label": "Topic or Subject",
    "create.topic_placeholder": "e.g. Ohm's Law, Machine Learning, Newton's Laws...",
    "create.popular_topics": "Or pick a popular subject topic:",
    "create.continue_btn": "Continue to Personalization",

    // Profile Form
    "profile.step": "Step 2 of 3",
    "profile.title": "Tell me about you",
    "profile.mastery_level": "Current Mastery Level",
    "profile.time_budget": "Available Time Budget",
    "profile.teaching_lang": "Teaching Language",
    "profile.customize_style": "Personalize teaching style & background (Optional)",
    "profile.start_lesson_btn": "Start My Lesson",
    "profile.planning": "Planning Your Lesson...",

    // Lesson Plan Preview
    "plan.structure": "Lesson Structure",
    "plan.subtitle": "Review and customize your curriculum timeline before starting the class.",
    "plan.total_budget": "Total",
    "plan.requested": "min requested",
    "plan.ready_prompt": "Ready to enter your AI Classroom?",
    "plan.ready_desc": "The teacher avatar, voice synthesis, whiteboard visualizer, and adaptive checks are prepared.",
    "plan.start_class_btn": "Looks Good, Start Class",

    // Classroom
    "class.concept": "Concept",
    "class.of": "of",
    "class.speaking_script": "Spoken Teaching Script",
    "class.listening": "Listening",
    "class.explaining": "Explaining concept...",
    "class.analyzing": "Analyzing student answer...",
    "class.checking_answer": "Checking answer...",
    "class.submit_answer": "Submit Answer",
    "class.not_sure": "I'm not sure",
    "class.correct_title": "Excellent! That's conceptually accurate.",
    "class.continue_lesson": "Continue Lesson",
    "class.misconception_title": "Let's look at this differently",
    "class.analogy_title": "Alternative Mental Model / Analogy",
    "class.explain_again": "Explain Again with New Analogy",
    "class.try_followup": "Try Follow-up Question",
    "class.exit_confirm": "Exit AI Classroom?",
    "class.exit_desc": "Your lesson state, answered questions, and concept mastery are saved.",
    "class.cancel": "Cancel",
    "class.exit_dashboard": "Exit to Dashboard",

    // Assessment & Report
    "exam.title": "Final Check",
    "exam.question": "Question",
    "exam.previous": "Previous",
    "exam.next": "Next Question",
    "exam.review": "Review Answers",
    "exam.submit": "Submit Assessment",
    "report.title": "Learning Diagnostic Report",
    "report.mastered_concepts": "Mastered Concepts",
    "report.needs_improvement": "Coaching & Revision Focus",
    "report.next_step": "AI Predicted Learning Pathway",
    "report.start_topic": "Start This Topic",
    "report.full_breakdown": "Full Assessment Question Breakdown",
    "report.back_dashboard": "Back to Dashboard",
    "report.retake": "Retake Assessment",

    // Settings
    "settings.title": "Settings & System Preferences",
    "settings.subtitle": "Configure student profile, AI model tiers, and account data.",
    "settings.student_profile": "Student Profile",
    "settings.display_name": "Display Name",
    "settings.default_lang": "Default Language",
    "settings.default_level": "Default Level",
    "settings.model_tiers": "Active Claude Model Tiers",
    "settings.save": "Save Profile",
    "settings.danger_zone": "Danger Zone",
    "settings.clear_data": "Clear Learning History"
  },

  Hindi: {
    // Nav & Brand
    "app.title": "भारत एकेडेमिक्स",
    "app.subtitle": "एआई शिक्षक",
    "nav.dashboard": "डैशबोर्ड",
    "nav.new_lesson": "नया पाठ शुरू करें",
    "nav.history": "सीखने का इतिहास",
    "nav.settings": "सेटिंग्स",
    "user.role": "विद्यार्थी",

    // Dashboard
    "dash.welcome": "वापसी पर स्वागत है",
    "dash.mastered": "पूर्ण रूप से सीखा",
    "dash.to_revise": "दोहराने योग्य",
    "dash.cta_badge": "स्वायत्त अनुकूली एआई शिक्षक",
    "dash.cta_title": "आज आप क्या सीखना चाहते हैं?",
    "dash.cta_desc": "अपनी अध्ययन सामग्री अपलोड करें या कोई भी विषय दर्ज करें। हमारा एआई शिक्षक एक व्यक्तिगत पाठ तैयार करेगा, एनिमेटेड अवतार और लाइव व्हाइटबोर्ड से समझाएगा और आपके उत्तरों के अनुसार खुद को ढालेगा।",
    "dash.cta_btn": "नया पाठ शुरू करें",
    "dash.continue_learning": "पढ़ाई जारी रखें",
    "dash.resume_class": "कक्षा फिर से शुरू करें",
    "dash.curriculum_rec": "सुझाई गई अगली शिक्षण राह",
    "dash.recent_lessons": "हाल के पाठ",
    "dash.no_lessons": "अभी तक कोई पाठ पूरा नहीं हुआ है।",
    "dash.create_first": "अपना पहला पाठ बनाएं →",
    "dash.view": "देखें",

    // Create Lesson
    "create.step": "चरण 1 / 3",
    "create.title": "आज आप क्या सीखना चाहते हैं?",
    "create.subtitle": "दस्तावेज़ अपलोड करें या सीधे किसी भी विषय का नाम दर्ज करें।",
    "create.upload_title": "सामग्री अपलोड करें",
    "create.upload_desc": "सटीक संदर्भ के लिए PDF, Word (DOCX), PowerPoint (PPTX) या नोट्स अपलोड करें।",
    "create.topic_title": "विषय दर्ज करें",
    "create.topic_desc": "एआई शिक्षक को कोई भी विषय बताएं जिसे आप शुरू से सीखना चाहते हैं।",
    "create.drag_drop": "अपनी फ़ाइल यहाँ खींचें और छोड़ें, या",
    "create.browse": "फ़ाइलें चुनें",
    "create.supported_formats": "समर्थित प्रारूप: PDF, DOCX, PPTX, TXT, MD (अधिकतम 25 MB)",
    "create.topic_label": "विषय का नाम",
    "create.topic_placeholder": "उदा. ओम का नियम, मशीन लर्निंग, न्यूटन के नियम...",
    "create.popular_topics": "या इनमें से कोई लोकप्रिय विषय चुनें:",
    "create.continue_btn": "प्राथमिकताएं सेट करें",

    // Profile Form
    "profile.step": "चरण 2 / 3",
    "profile.title": "अपनी प्राथमिकताओं के बारे में बताएं",
    "profile.mastery_level": "वर्तमान दक्षता स्तर",
    "profile.time_budget": "उपलब्ध समय सीमा",
    "profile.teaching_lang": "पढ़ाने की भाषा",
    "profile.customize_style": "पढ़ाने की शैली और पूर्व ज्ञान चुनें (वैकल्पिक)",
    "profile.start_lesson_btn": "मेरा पाठ शुरू करें",
    "profile.planning": "पाठ की योजना बन रही है...",

    // Lesson Plan Preview
    "plan.structure": "पाठ की रूपरेखा",
    "plan.subtitle": "कक्षा शुरू करने से पहले अपनी समय-सीमा और विषयों की समीक्षा करें।",
    "plan.total_budget": "कुल समय",
    "plan.requested": "मिनट निर्धारित",
    "plan.ready_prompt": "क्या आप अपनी एआई कक्षा में प्रवेश करने के लिए तैयार हैं?",
    "plan.ready_desc": "शिक्षक अवतार, वाक् संश्लेषण, व्हाइटबोर्ड और अनुकूली प्रश्न तैयार हैं।",
    "plan.start_class_btn": "कक्षा शुरू करें",

    // Classroom
    "class.concept": "संकल्पना",
    "class.of": "/",
    "class.speaking_script": "शिक्षक का मौखिक विवरण",
    "class.listening": "सुन रहा है",
    "class.explaining": "संकल्पना समझा रहे हैं...",
    "class.analyzing": "उत्तर का विश्लेषण हो रहा है...",
    "class.checking_answer": "उत्तर जांचा जा रहा है...",
    "class.submit_answer": "उत्तर सबमिट करें",
    "class.not_sure": "मुझे पक्का नहीं पता",
    "class.correct_title": "उत्कृष्ट! आपका उत्तर बिल्कुल सही है।",
    "class.continue_lesson": "पाठ आगे बढ़ाएं",
    "class.misconception_title": "आइए इसे एक अलग दृष्टिकोण से समझें",
    "class.analogy_title": "वैकल्पिक उदाहरण / नया मॉडल",
    "class.explain_again": "नए उदाहरण के साथ पुनः समझाएं",
    "class.try_followup": "अनुवर्ती प्रश्न हल करें",
    "class.exit_confirm": "कक्षा से बाहर निकलें?",
    "class.exit_desc": "आपकी प्रगति और सीखे गए विषय सुरक्षित हैं। आप कभी भी वापस आ सकते हैं।",
    "class.cancel": "रद्द करें",
    "class.exit_dashboard": "डैशबोर्ड पर जाएं",

    // Assessment & Report
    "exam.title": "अंतिम मूल्यांकन",
    "exam.question": "प्रश्न",
    "exam.previous": "पिछला",
    "exam.next": "अगला प्रश्न",
    "exam.review": "उत्तरों की समीक्षा करें",
    "exam.submit": "मूल्यांकन सबमिट करें",
    "report.title": "अधिगम निदान रिपोर्ट",
    "report.mastered_concepts": "पूर्णतः सीखे गए विषय",
    "report.needs_improvement": "पुनरावृत्ति एवं सुधार हेतु",
    "report.next_step": "सुझाया गया अगला विषय",
    "report.start_topic": "यह विषय शुरू करें",
    "report.full_breakdown": "सभी प्रश्नों का विस्तृत विवरण",
    "report.back_dashboard": "डैशबोर्ड पर लौटें",
    "report.retake": "पुनः परीक्षा दें",

    // Settings
    "settings.title": "सेटिंग्स और सिस्टम प्राथमिकताएं",
    "settings.subtitle": "विद्यार्थी प्रोफ़ाइल, एआई मॉडल टियर और डेटा प्रबंधित करें।",
    "settings.student_profile": "विद्यार्थी प्रोफ़ाइल",
    "settings.display_name": "प्रदर्शित नाम",
    "settings.default_lang": "डिफ़ॉल्ट भाषा",
    "settings.default_level": "डिफ़ॉल्ट स्तर",
    "settings.model_tiers": "सक्रिय क्लॉड मॉडल टियर",
    "settings.save": "प्रोफ़ाइल सुरक्षित करें",
    "settings.danger_zone": "डेटा रीसेट क्षेत्र",
    "settings.clear_data": "सीखने का इतिहास साफ़ करें"
  },

  Hinglish: {
    // Nav & Brand
    "app.title": "Bharat Academix",
    "app.subtitle": "AI Teacher",
    "nav.dashboard": "Dashboard",
    "nav.new_lesson": "New Lesson",
    "nav.history": "Learning History",
    "nav.settings": "Settings",
    "user.role": "Student",

    // Dashboard
    "dash.welcome": "Welcome back",
    "dash.mastered": "Mastered",
    "dash.to_revise": "Revise Karna Hai",
    "dash.cta_badge": "Autonomous Adaptive AI Teacher",
    "dash.cta_title": "Aaj aap kya master karna chahte hain?",
    "dash.cta_desc": "Apna study material upload karein ya koi bhi topic enter karein. Humara AI Teacher structured pacing ke sath live whiteboard aur animated avatar se sikhayega.",
    "dash.cta_btn": "Start a New Lesson",
    "dash.continue_learning": "Continue Learning",
    "dash.resume_class": "Class Resume Karein",
    "dash.curriculum_rec": "Recommended Next Learning Path",
    "dash.recent_lessons": "Recent Lessons",
    "dash.no_lessons": "Abhi tak koi lesson complete nahi hua.",
    "dash.create_first": "Apna pehla lesson banayein →",
    "dash.view": "View",

    // Create Lesson
    "create.step": "Step 1 of 3",
    "create.title": "Aaj aap kya sikhna chahte hain?",
    "create.subtitle": "Documents upload karein ya direct kisi topic ka naam enter karein.",
    "create.upload_title": "Upload Material",
    "create.upload_desc": "PDF, DOCX, PPTX ya notes upload karein RAG grounded teaching ke liye.",
    "create.topic_title": "Enter a Topic",
    "create.topic_desc": "AI teacher ko batayein jo bhi concept aap zero se sikhna chahte hain.",
    "create.drag_drop": "File yahan drag & drop karein, ya",
    "create.browse": "browse karein",
    "create.supported_formats": "Supported formats: PDF, DOCX, PPTX, TXT, MD (Max 25 MB)",
    "create.topic_label": "Topic ya Subject",
    "create.topic_placeholder": "e.g. Ohm's Law, Machine Learning, Newton's Laws...",
    "create.popular_topics": "Ya popular topic choose karein:",
    "create.continue_btn": "Preferences Set Karein",

    // Profile Form
    "profile.step": "Step 2 of 3",
    "profile.title": "Apne bare me batayein",
    "profile.mastery_level": "Current Mastery Level",
    "profile.time_budget": "Available Time Budget",
    "profile.teaching_lang": "Teaching Language",
    "profile.customize_style": "Style & Background customize karein (Optional)",
    "profile.start_lesson_btn": "Start My Lesson",
    "profile.planning": "Lesson plan generate ho raha hai...",

    // Lesson Plan Preview
    "plan.structure": "Lesson Plan Preview",
    "plan.subtitle": "Class start karne se pehle curriculum timeline check karein.",
    "plan.total_budget": "Total Time",
    "plan.requested": "min planned",
    "plan.ready_prompt": "AI Classroom enter karne ke liye ready hain?",
    "plan.ready_desc": "Avatar, speech, whiteboard visualizer aur adaptive checks ready hain.",
    "plan.start_class_btn": "Looks Good, Start Class",

    // Classroom
    "class.concept": "Concept",
    "class.of": "of",
    "class.speaking_script": "Teacher Spoken Script",
    "class.listening": "Listening",
    "class.explaining": "Concept explain ho raha hai...",
    "class.analyzing": "Student answer analyze ho raha hai...",
    "class.checking_answer": "Answer check ho raha hai...",
    "class.submit_answer": "Submit Answer",
    "class.not_sure": "Mujhe sure nahi pata",
    "class.correct_title": "Shabash! Aapka concept bilkul accurate hai.",
    "class.continue_lesson": "Next Concept Par Chalein",
    "class.misconception_title": "Chaliye isko dusre tarike se dekhte hain",
    "class.analogy_title": "Alternative Real-Life Analogy",
    "class.explain_again": "New Analogy Ke Saath Re-Explain Karein",
    "class.try_followup": "Follow-up Question Try Karein",
    "class.exit_confirm": "Classroom se exit karein?",
    "class.exit_desc": "Aapki progress and mastered concepts saved hain.",
    "class.cancel": "Cancel",
    "class.exit_dashboard": "Dashboard Par Jayein",

    // Assessment & Report
    "exam.title": "Final Check Assessment",
    "exam.question": "Question",
    "exam.previous": "Previous",
    "exam.next": "Next Question",
    "exam.review": "Answers Review Karein",
    "exam.submit": "Submit Assessment",
    "report.title": "Learning Diagnostic Report",
    "report.mastered_concepts": "Mastered Concepts",
    "report.needs_improvement": "Revision Focus Areas",
    "report.next_step": "Recommended Next Pathway",
    "report.start_topic": "Start This Topic",
    "report.full_breakdown": "Full Question Breakdown",
    "report.back_dashboard": "Back to Dashboard",
    "report.retake": "Retake Exam",

    // Settings
    "settings.title": "Settings & Preferences",
    "settings.subtitle": "Profile aur model tiers manage karein.",
    "settings.student_profile": "Student Profile",
    "settings.display_name": "Display Name",
    "settings.default_lang": "Default Language",
    "settings.default_level": "Default Level",
    "settings.model_tiers": "Active Claude Model Tiers",
    "settings.save": "Profile Save Karein",
    "settings.danger_zone": "Danger Zone",
    "settings.clear_data": "Learning History Clear Karein"
  }
};

const LanguageContext = createContext<LanguageContextType>({
  language: "English",
  setLanguage: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>("English");

  useEffect(() => {
    const saved = localStorage.getItem("app_language") as SupportedLanguage;
    if (saved && (saved === "English" || saved === "Hindi" || saved === "Hinglish")) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("app_language", lang);
    }
  };

  const t = (key: string): string => {
    const currentDict = translations[language] || translations["English"];
    return currentDict[key] || translations["English"][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
