"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type SupportedLanguage = "English" | "Hindi" | "Hinglish" | "Tamil" | "Bengali";

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
}

const translations: Record<SupportedLanguage, Record<string, string>> = {
  English: {
    // Nav & Brand
    "app.title": "Bharat Academix",
    "app.subtitle": "AI Gurukul",
    "nav.dashboard": "Dashboard",
    "nav.learning_paths": "Learning Paths",
    "nav.new_lesson": "New Lesson",
    "nav.history": "Learning History",
    "nav.settings": "Settings",
    "user.student": "Student",
    "user.role": "Standard Learner",

    // Dashboard
    "dash.welcome": "Welcome back",
    "dash.mastered": "Mastered",
    "dash.to_revise": "Revise",
    "dash.completed_lessons": "completed lessons",
    "dash.ai_ready": "AI Teacher ready for today's goals",
    "dash.ai_standby": "Personalized AI Teacher ready for today's session",
    "dash.search_placeholder": "What would you like to master today? (e.g. Linear Regression, Ohm's Law, Binary Search...)",
    "dash.start_lesson": "Start Lesson",
    "dash.quick_topics": "Quick Topics:",
    "dash.upload_notes": "Upload Notes / Document",
    "dash.in_progress": "In Progress",
    "dash.concepts_planned": "concepts planned",
    "dash.min_session": "min session",
    "dash.resume_lesson": "Resume Lesson",
    "dash.recommended": "Recommended",
    "dash.next_milestone": "Next milestone in your personalized curriculum path",
    "dash.start_milestone": "Start Milestone",
    "dash.active_pathway": "Active Pathway",
    "dash.view_pathway": "View Full Pathway",
    "dash.recent_lessons": "Recent Lessons",
    "dash.total": "total",
    "dash.view_plan": "View Plan",
    "dash.locked": "Locked",
    "dash.no_lessons": "No lessons completed yet.",
    "dash.create_first": "Create your first lesson →",
    "dash.cta_badge": "Autonomous Adaptive Teacher",

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
    "app.subtitle": "एआई गुरुकुल",
    "nav.dashboard": "डैशबोर्ड",
    "nav.learning_paths": "शिक्षण मार्ग",
    "nav.new_lesson": "नया पाठ शुरू करें",
    "nav.history": "सीखने का इतिहास",
    "nav.settings": "सेटिंग्स",
    "user.student": "विद्यार्थी",
    "user.role": "विद्यार्थी",

    // Dashboard
    "dash.welcome": "वापसी पर स्वागत है",
    "dash.mastered": "पूर्ण सीखा",
    "dash.to_revise": "दोहराएं",
    "dash.completed_lessons": "पूर्ण पाठ",
    "dash.ai_ready": "एआई शिक्षक आज के लक्ष्यों के लिए तैयार",
    "dash.ai_standby": "व्यक्तिगत एआई शिक्षक आज के सत्र के लिए तैयार",
    "dash.search_placeholder": "आज आप क्या सीखना चाहते हैं? (जैसे: ओम का नियम, लीनियर रिग्रेशन, बाइनरी सर्च...)",
    "dash.start_lesson": "पाठ शुरू करें",
    "dash.quick_topics": "त्वरित विषय:",
    "dash.upload_notes": "नोट्स / दस्तावेज़ अपलोड करें",
    "dash.in_progress": "प्रगति पर",
    "dash.concepts_planned": "नियोजित अवधारणाएं",
    "dash.min_session": "मिनट का सत्र",
    "dash.resume_lesson": "पाठ फिर से शुरू करें",
    "dash.recommended": "अनुशंसित",
    "dash.next_milestone": "आपकी व्यक्तिगत शिक्षण राह का अगला चरण",
    "dash.start_milestone": "चरण शुरू करें",
    "dash.active_pathway": "सक्रिय शिक्षण राह",
    "dash.view_pathway": "पूरी शिक्षण राह देखें",
    "dash.recent_lessons": "हाल के पाठ",
    "dash.total": "कुल",
    "dash.view_plan": "योजना देखें",
    "dash.locked": "लॉक किया गया",
    "dash.no_lessons": "अभी तक कोई पाठ पूरा नहीं हुआ है।",
    "dash.create_first": "अपना पहला पाठ बनाएं →",
    "dash.cta_badge": "स्वायत्त अनुकूली एआई शिक्षक",

    // Create Lesson
    "create.step": "चरण 1 / 3",
    "create.title": "आज आप क्या सीखना चाहते हैं?",
    "create.subtitle": "दस्तावेज़ अपलोड करें या सीधे कोई विषय दर्ज करें।",
    "create.upload_title": "अध्ययन सामग्री अपलोड करें",
    "create.upload_desc": "PDF, Word (DOCX), PowerPoint (PPTX) या नोट्स अपलोड करें।",
    "create.topic_title": "विषय दर्ज करें",
    "create.topic_desc": "एआई शिक्षक को बताएं कि आप क्या सीखना चाहते हैं।",
    "create.drag_drop": "फ़ाइल यहाँ खींचें और छोड़ें, या",
    "create.browse": "फ़ाइलें चुनें",
    "create.supported_formats": "समर्थित: PDF, DOCX, PPTX, TXT, MD (Max 25 MB)",
    "create.topic_label": "विषय या पाठ",
    "create.topic_placeholder": "जैसे: ओम का नियम, मशीन लर्निंग, न्यूटन के नियम...",
    "create.popular_topics": "या लोकप्रिय विषय चुनें:",
    "create.continue_btn": "आगे बढ़ें",

    // Profile Form
    "profile.step": "चरण 2 / 3",
    "profile.title": "अपने बारे में बताएं",
    "profile.mastery_level": "वर्तमान स्तर",
    "profile.time_budget": "उपलब्ध समय",
    "profile.teaching_lang": "पढ़ाने की भाषा",
    "profile.customize_style": "पढ़ाने की शैली अनुकूलित करें",
    "profile.start_lesson_btn": "पाठ शुरू करें",
    "profile.planning": "पाठ योजना तैयार की जा रही है...",

    // Lesson Plan Preview
    "plan.structure": "पाठ संरचना",
    "plan.subtitle": "कक्षा शुरू करने से पहले पाठ योजना की समीक्षा करें।",
    "plan.total_budget": "कुल",
    "plan.requested": "मिनट",
    "plan.ready_prompt": "एआई कक्षा में प्रवेश के लिए तैयार?",
    "plan.ready_desc": "शिक्षक अवतार, आवाज़ और लाइव व्हाइटबोर्ड तैयार हैं।",
    "plan.start_class_btn": "कक्षा शुरू करें",

    // Classroom
    "class.concept": "अवधारणा",
    "class.of": "में से",
    "class.speaking_script": "शिक्षक का वक्तव्य",
    "class.listening": "सुन रहा है",
    "class.explaining": "अवधारणा समझा रहे हैं...",
    "class.analyzing": "उत्तर का विश्लेषण किया जा रहा है...",
    "class.checking_answer": "उत्तर जांच रहे हैं...",
    "class.submit_answer": "उत्तर सबमिट करें",
    "class.not_sure": "मुझे पक्का नहीं पता",
    "class.correct_title": "शाबाश! आपकी समझ बिल्कुल सही है।",
    "class.continue_lesson": "पाठ जारी रखें",
    "class.misconception_title": "आइए इसे दूसरे तरीके से समझें",
    "class.analogy_title": "वैकल्पिक उदाहरण / सादृश्य",
    "class.explain_again": "नए उदाहरण के साथ फिर से समझाएं",
    "class.try_followup": "अगला प्रश्न हल करें",
    "class.exit_confirm": "कक्षा से बाहर निकलें?",
    "class.exit_desc": "आपकी सीखने की प्रगति सुरक्षित रूप से सहेजी गई है।",
    "class.cancel": "रद्द करें",
    "class.exit_dashboard": "डैशबोर्ड पर जाएं",

    // Assessment & Report
    "exam.title": "अंतिम मूल्यांकन",
    "exam.question": "प्रश्न",
    "exam.previous": "पिछला",
    "exam.next": "अगला प्रश्न",
    "exam.review": "उत्तर देखें",
    "exam.submit": "मूल्यांकन सबमिट करें",
    "report.title": "शिक्षण रिपोर्ट",
    "report.mastered_concepts": "सीखी गई अवधारणाएं",
    "report.needs_improvement": "सुधार के क्षेत्र",
    "report.next_step": "सुझाई गई अगली राह",
    "report.start_topic": "यह विषय शुरू करें",
    "report.full_breakdown": "विस्तृत विवरण",
    "report.back_dashboard": "डैशबोर्ड पर लौटें",
    "report.retake": "पुनः परीक्षा दें",

    // Settings
    "settings.title": "सेटिंग्स",
    "settings.subtitle": "प्रोफ़ाइल और प्राथमिकताएं प्रबंधित करें।",
    "settings.student_profile": "विद्यार्थी प्रोफ़ाइल",
    "settings.display_name": "नाम",
    "settings.default_lang": "डिफ़ॉल्ट भाषा",
    "settings.default_level": "डिफ़ॉल्ट स्तर",
    "settings.model_tiers": "सक्रिय एआई मॉडल",
    "settings.save": "सुरक्षित करें",
    "settings.danger_zone": "डेटा रीसेट",
    "settings.clear_data": "इतिहास साफ़ करें"
  },

  Hinglish: {
    // Nav & Brand
    "app.title": "Bharat Academix",
    "app.subtitle": "AI Gurukul",
    "nav.dashboard": "Dashboard",
    "nav.learning_paths": "Learning Paths",
    "nav.new_lesson": "Naya Lesson",
    "nav.history": "Learning History",
    "nav.settings": "Settings",
    "user.student": "Student",
    "user.role": "Learner",

    // Dashboard
    "dash.welcome": "Welcome back",
    "dash.mastered": "Mastered",
    "dash.to_revise": "Revise",
    "dash.completed_lessons": "completed lessons",
    "dash.ai_ready": "AI Teacher ready hai aaj ke goals ke liye",
    "dash.ai_standby": "Personalized AI Teacher ready hai aaj ke session ke liye",
    "dash.search_placeholder": "Aaj aap kya master karna chahte hain? (e.g. Linear Regression, Ohm's Law, Binary Search...)",
    "dash.start_lesson": "Lesson Shuru Karein",
    "dash.quick_topics": "Quick Topics:",
    "dash.upload_notes": "Notes / Document Upload Karein",
    "dash.in_progress": "In Progress",
    "dash.concepts_planned": "concepts planned",
    "dash.min_session": "min session",
    "dash.resume_lesson": "Lesson Resume Karein",
    "dash.recommended": "Recommended",
    "dash.next_milestone": "Aapke personalized curriculum path ka next milestone",
    "dash.start_milestone": "Milestone Shuru Karein",
    "dash.active_pathway": "Active Pathway",
    "dash.view_pathway": "Full Pathway Dekhein",
    "dash.recent_lessons": "Recent Lessons",
    "dash.total": "total",
    "dash.view_plan": "Plan Dekhein",
    "dash.locked": "Locked",
    "dash.no_lessons": "Abhi tak koi lesson complete nahi hua.",
    "dash.create_first": "Apna pehla lesson banayein →",
    "dash.cta_badge": "Autonomous Adaptive Teacher",

    // Create Lesson
    "create.step": "Step 1 of 3",
    "create.title": "Aaj aap kya sikhna chahte hain?",
    "create.subtitle": "Study material upload karein ya direct topic type karein.",
    "create.upload_title": "Material Upload Karein",
    "create.upload_desc": "PDF, DOCX, PPTX ya Notes upload karein.",
    "create.topic_title": "Topic Enter Karein",
    "create.topic_desc": "AI Teacher ko batayein jo topic aap master karna chahte hain.",
    "create.drag_drop": "File drag karein ya",
    "create.browse": "browse karein",
    "create.supported_formats": "Supported: PDF, DOCX, PPTX, TXT, MD (Max 25 MB)",
    "create.topic_label": "Topic ya Subject",
    "create.topic_placeholder": "e.g. Ohm's Law, Machine Learning, Newton's Laws...",
    "create.popular_topics": "Ya popular topic choose karein:",
    "create.continue_btn": "Aage Badhein",

    // Profile Form
    "profile.step": "Step 2 of 3",
    "profile.title": "Apne bare mein batayein",
    "profile.mastery_level": "Current Level",
    "profile.time_budget": "Available Time",
    "profile.teaching_lang": "Teaching Language",
    "profile.customize_style": "Teaching Style Customize Karein",
    "profile.start_lesson_btn": "Lesson Shuru Karein",
    "profile.planning": "Lesson Plan Ban Raha Hai...",

    // Lesson Plan Preview
    "plan.structure": "Lesson Structure",
    "plan.subtitle": "Class start karne se pehle curriculum review karein.",
    "plan.total_budget": "Total",
    "plan.requested": "min requested",
    "plan.ready_prompt": "AI Classroom mein chalne ke liye ready?",
    "plan.ready_desc": "Teacher avatar, voice aur live whiteboard taiyar hain.",
    "plan.start_class_btn": "Class Shuru Karein",

    // Classroom
    "class.concept": "Concept",
    "class.of": "of",
    "class.speaking_script": "Teacher Script",
    "class.listening": "Listening",
    "class.explaining": "Concept explain ho raha hai...",
    "class.analyzing": "Answer analyze ho raha hai...",
    "class.checking_answer": "Answer check ho raha hai...",
    "class.submit_answer": "Answer Submit Karein",
    "class.not_sure": "Mujhe sure nahi pata",
    "class.correct_title": "Shabash! Concept bilkul sahi hai.",
    "class.continue_lesson": "Next Concept Par Chalein",
    "class.misconception_title": "Chaliye isko dusre tarike se samajhte hain",
    "class.analogy_title": "Alternative Real-Life Analogy",
    "class.explain_again": "New Analogy Ke Saath Re-Explain Karein",
    "class.try_followup": "Follow-up Question Try Karein",
    "class.exit_confirm": "Classroom se exit karein?",
    "class.exit_desc": "Aapki progress saved hai.",
    "class.cancel": "Cancel",
    "class.exit_dashboard": "Dashboard Par Jayein",

    // Assessment & Report
    "exam.title": "Final Check Assessment",
    "exam.question": "Question",
    "exam.previous": "Previous",
    "exam.next": "Next Question",
    "exam.review": "Answers Review Karein",
    "exam.submit": "Assessment Submit Karein",
    "report.title": "Learning Diagnostic Report",
    "report.mastered_concepts": "Mastered Concepts",
    "report.needs_improvement": "Revision Focus Areas",
    "report.next_step": "Recommended Next Pathway",
    "report.start_topic": "Start This Topic",
    "report.full_breakdown": "Full Question Breakdown",
    "report.back_dashboard": "Back to Dashboard",
    "report.retake": "Retake Exam",

    // Settings
    "settings.title": "Settings",
    "settings.subtitle": "Profile aur preferences manage karein.",
    "settings.student_profile": "Student Profile",
    "settings.display_name": "Name",
    "settings.default_lang": "Default Language",
    "settings.default_level": "Default Level",
    "settings.model_tiers": "AI Models",
    "settings.save": "Save Karein",
    "settings.danger_zone": "Danger Zone",
    "settings.clear_data": "History Clear Karein"
  },

  Tamil: {
    // Nav & Brand
    "app.title": "பாரத் அகாடமிக்ஸ்",
    "app.subtitle": "AI குருகுலம்",
    "nav.dashboard": "முகப்புப்பலகை",
    "nav.learning_paths": "கற்றல் பாதைகள்",
    "nav.new_lesson": "புதிய பாடம்",
    "nav.history": "கற்றல் வரலாறு",
    "nav.settings": "அமைப்புகள்",
    "user.student": "மாணவர்",
    "user.role": "மாணவர்",

    // Dashboard
    "dash.welcome": "மீண்டும் நல்வரவு",
    "dash.mastered": "தேர்ச்சி பெற்றது",
    "dash.to_revise": "மீள்பார்வை",
    "dash.completed_lessons": "முடித்த பாடங்கள்",
    "dash.ai_ready": "இன்றைய இலக்குகளுக்கு AI ஆசிரியர் தயார்",
    "dash.ai_standby": "இன்றைய அமர்வுக்கு AI ஆசிரியர் தயார்",
    "dash.search_placeholder": "இன்று நீங்கள் எதைக் கற்க விரும்புகிறீர்கள்? (எ.கா. ஓம் விதி, இயந்திரக் கற்றல்...)",
    "dash.start_lesson": "பாடத்தைத் தொடங்கு",
    "dash.quick_topics": "விரைவுத் தலைப்புகள்:",
    "dash.upload_notes": "ஆவணத்தைப் பதிவேற்றவும்",
    "dash.in_progress": "செயல்பாட்டில்",
    "dash.concepts_planned": "திட்டமிடப்பட்ட கருத்துகள்",
    "dash.min_session": "நிமிட அமர்வு",
    "dash.resume_lesson": "பாடத்தை மீண்டும் தொடரவும்",
    "dash.recommended": "பரிந்துரைக்கப்பட்டது",
    "dash.next_milestone": "உங்கள் பாடத்திட்டத்தின் அடுத்த மைல்கல்",
    "dash.start_milestone": "மைல்கல்லைத் தொடங்கு",
    "dash.active_pathway": "தற்போதைய கற்றல் பாதை",
    "dash.view_pathway": "முழுப் பாதையைப் பார்க்கவும்",
    "dash.recent_lessons": "சமீபத்திய பாடங்கள்",
    "dash.total": "மொத்தம்",
    "dash.view_plan": "திட்டத்தைப் பார்க்கவும்",
    "dash.locked": "பூட்டப்பட்டது",
    "dash.no_lessons": "பாடங்கள் எதுவும் இன்னும் முடிக்கப்படவில்லை.",
    "dash.create_first": "உங்கள் முதல் பாடத்தை உருவாக்குங்கள் →",
    "dash.cta_badge": "தன்னாட்சி அடாப்டிவ் AI ஆசிரியர்",

    // Create Lesson
    "create.step": "படி 1 / 3",
    "create.title": "இன்று என்ன கற்க விரும்புகிறீர்கள்?",
    "create.subtitle": "ஆவணங்களைப் பதிவேற்றவும் அல்லது தலைப்பை நேரடியாக உள்ளிடவும்.",
    "create.upload_title": "பாடப்பொருளைப் பதிவேற்றவும்",
    "create.upload_desc": "PDF, DOCX, PPTX அல்லது குறிப்புகளைப் பதிவேற்றவும்.",
    "create.topic_title": "தலைப்பை உள்ளிடவும்",
    "create.topic_desc": "நீங்கள் கற்றுக்கொள்ள விரும்பும் எந்தவொரு தலைப்பையும் AI ஆசிரியரிடம் கூறவும்.",
    "create.drag_drop": "கோப்பை இங்கே இழுத்துப் போடவும், அல்லது",
    "create.browse": "கோப்புகளைத் தேர்ந்தெடுக்கவும்",
    "create.supported_formats": "ஆதரிக்கப்படும் வடிவங்கள்: PDF, DOCX, PPTX, TXT, MD (Max 25 MB)",
    "create.topic_label": "தலைப்பு அல்லது பாடம்",
    "create.topic_placeholder": "எ.கா. ஓம் விதி, இயந்திரக் கற்றல், நியூட்டன் விதிகள்...",
    "create.popular_topics": "அல்லது பிரபலமான தலைப்பைத் தேர்ந்தெடுக்கவும்:",
    "create.continue_btn": "தொடரவும்",

    // Profile Form
    "profile.step": "படி 2 / 3",
    "profile.title": "உங்கள் விவரங்கள்",
    "profile.mastery_level": "தற்போதைய நிலை",
    "profile.time_budget": "கிடைக்கும் நேரம்",
    "profile.teaching_lang": "கற்பிக்கும் மொழி",
    "profile.customize_style": "கற்பித்தல் பாணியைத் தனிப்பயனாக்குங்கள்",
    "profile.start_lesson_btn": "பாடத்தைத் தொடங்கு",
    "profile.planning": "பாடம் திட்டமிடப்படுகிறது...",

    // Lesson Plan Preview
    "plan.structure": "பாடத் திட்டம்",
    "plan.subtitle": "வகுப்பைத் தொடங்குவதற்கு முன் பாடத்திட்டத்தை மதிப்பாய்வு செய்யவும்.",
    "plan.total_budget": "மொத்த நேரம்",
    "plan.requested": "நிமிடங்கள்",
    "plan.ready_prompt": "AI வகுப்பறையில் நுழைய தயாரா?",
    "plan.ready_desc": "ஆசிரியர் அவதார், குரல் மற்றும் வைட்போர்டு தயாராக உள்ளன.",
    "plan.start_class_btn": "வகுப்பைத் தொடங்கு",

    // Classroom
    "class.concept": "கருத்து",
    "class.of": "இல்",
    "class.speaking_script": "ஆசிரியரின் உரை",
    "class.listening": "கேட்கிறது",
    "class.explaining": "விளக்குகிறது...",
    "class.analyzing": "பதிலை ஆய்வு செய்கிறது...",
    "class.checking_answer": "பதிலைச் சரிபார்க்கிறது...",
    "class.submit_answer": "பதிலைச் சமர்ப்பிக்கவும்",
    "class.not_sure": "எனக்குத் தெரியவில்லை",
    "class.correct_title": "அருமை! உங்கள் கருத்து சரியானது.",
    "class.continue_lesson": "பாடத்தைத் தொடரவும்",
    "class.misconception_title": "இதை வேறு விதமாகப் பார்ப்போம்",
    "class.analogy_title": "மாற்று உதாரணம் / ஒப்பீடு",
    "class.explain_again": "புதிய உதாரணத்துடன் மீண்டும் விளக்குக",
    "class.try_followup": "அடுத்த கேள்வியை முயற்சிக்கவும்",
    "class.exit_confirm": "வகுப்பறையிலிருந்து வெளியேறவா?",
    "class.exit_desc": "உங்கள் முன்னேற்றம் பாதுகாப்பாகச் சேமிக்கப்பட்டுள்ளது.",
    "class.cancel": "ரத்துசெய்",
    "class.exit_dashboard": "முகப்புப்பலகைக்குச் செல்",

    // Assessment & Report
    "exam.title": "இறுதி மதிப்பீடு",
    "exam.question": "கேள்வி",
    "exam.previous": "முந்தைய",
    "exam.next": "அடுத்த கேள்வி",
    "exam.review": "பதில்களை மதிப்பாய்வு செய்க",
    "exam.submit": "மதிப்பீட்டைச் சமர்ப்பிக்கவும்",
    "report.title": "கற்றல் அறிக்கை",
    "report.mastered_concepts": "தேர்ச்சி பெற்ற கருத்துக்கள்",
    "report.needs_improvement": "மேம்படுத்த வேண்டியவை",
    "report.next_step": "பரிந்துரைக்கப்பட்ட அடுத்த தலைப்பு",
    "report.start_topic": "இந்தத் தலைப்பைத் தொடங்கு",
    "report.full_breakdown": "முழுமையான விளக்கம்",
    "report.back_dashboard": "முகப்புப்பலகைக்குத் திரும்பு",
    "report.retake": "மீண்டும் தேர்வு எழுது",

    // Settings
    "settings.title": "அமைப்புகள்",
    "settings.subtitle": "சுயவிவரம் மற்றும் அமைப்புகளை நிர்வகிக்கவும்.",
    "settings.student_profile": "மாணவர் சுயவிவரம்",
    "settings.display_name": "பெயர்",
    "settings.default_lang": "இயல்புநிலை மொழி",
    "settings.default_level": "இயல்புநிலை நிலை",
    "settings.model_tiers": "AI மாதிரி நிலைகள்",
    "settings.save": "சேமி",
    "settings.danger_zone": "தரவு மீட்டமைப்பு",
    "settings.clear_data": "வரலாற்றை அழிக்கவும்"
  },

  Bengali: {
    // Nav & Brand
    "app.title": "ভারত অ্যাকাডেমিক্স",
    "app.subtitle": "AI গুরুকুল",
    "nav.dashboard": "ড্যাশবোর্ড",
    "nav.learning_paths": "শিক্ষণ পথ",
    "nav.new_lesson": "নতুন পাঠ",
    "nav.history": "শেখার ইতিহাস",
    "nav.settings": "সেটিংস",
    "user.student": "শিক্ষার্থী",
    "user.role": "শিক্ষার্থী",

    // Dashboard
    "dash.welcome": "স্বাগতম",
    "dash.mastered": "দক্ষতা অর্জন",
    "dash.to_revise": "পুনরাবৃত্তি",
    "dash.completed_lessons": "সম্পন্ন পাঠ",
    "dash.ai_ready": "আজকের লক্ষ্যের জন্য AI শিক্ষক প্রস্তুত",
    "dash.ai_standby": "আজকের সেশনের জন্য ব্যক্তিগত AI শিক্ষক প্রস্তুত",
    "dash.search_placeholder": "আজ আপনি কী শিখতে চান? (যেমন: ওহমের সূত্র, মেশিন লার্নিং, নিউটনের সূত্র...)",
    "dash.start_lesson": "পাঠ শুরু করুন",
    "dash.quick_topics": "দ্রুত বিষয়সমূহ:",
    "dash.upload_notes": "নোট বা নথি আপলোড করুন",
    "dash.in_progress": "চলমান",
    "dash.concepts_planned": "পরিকল্পিত ধারণা",
    "dash.min_session": "মিনিটের সেশন",
    "dash.resume_lesson": "পাঠ পুনরায় শুরু করুন",
    "dash.recommended": "প্রস্তাবিত",
    "dash.next_milestone": "আপনার পাঠ্যক্রমের পরবর্তী মাইলফলক",
    "dash.start_milestone": "মাইলফলক শুরু করুন",
    "dash.active_pathway": "সক্রিয় শিক্ষণ পথ",
    "dash.view_pathway": "সম্পূর্ণ পথ দেখুন",
    "dash.recent_lessons": "সাম্প্রতিক পাঠ",
    "dash.total": "মোট",
    "dash.view_plan": "পরিকল্পনা দেখুন",
    "dash.locked": "লক করা",
    "dash.no_lessons": "এখনও কোনো পাঠ সম্পন্ন হয়নি।",
    "dash.create_first": "আপনার প্রথম পাঠ তৈরি করুন →",
    "dash.cta_badge": "স্বায়ত্তশাসিত অ্যাডাপ্টিভ AI শিক্ষক",

    // Create Lesson
    "create.step": "পদক্ষেপ ১ / ৩",
    "create.title": "আজ আপনি কী শিখতে চান?",
    "create.subtitle": "নথি আপলোড করুন অথবা সরাসরি একটি বিষয় লিখুন।",
    "create.upload_title": "উপাদান আপলোড করুন",
    "create.upload_desc": "PDF, DOCX, PPTX বা নোট আপলোড করুন।",
    "create.topic_title": "বিষয় লিখুন",
    "create.topic_desc": "আপনি যা শিখতে চান তা AI শিক্ষককে বলুন।",
    "create.drag_drop": "ফাইল এখানে টেনে আনুন, অথবা",
    "create.browse": "ফাইল ব্রাউজ করুন",
    "create.supported_formats": "সমর্থিত ফরম্যাট: PDF, DOCX, PPTX, TXT, MD (Max 25 MB)",
    "create.topic_label": "বিষয়",
    "create.topic_placeholder": "যেমন: ওহমের সূত্র, মেশিন লার্নিং, নিউটনের সূত্র...",
    "create.popular_topics": "অথবা জনপ্রিয় বিষয় নির্বাচন করুন:",
    "create.continue_btn": "এগিয়ে যান",

    // Profile Form
    "profile.step": "পদক্ষেপ ২ / ৩",
    "profile.title": "আপনার বিবরণ",
    "profile.mastery_level": "বর্তমান স্তর",
    "profile.time_budget": "উপলব্ধ সময়",
    "profile.teaching_lang": "শিক্ষাদানের ভাষা",
    "profile.customize_style": "শিক্ষাদান শৈলী কাস্টমাইজ করুন",
    "profile.start_lesson_btn": "পাঠ শুরু করুন",
    "profile.planning": "পাঠ পরিকল্পনা করা হচ্ছে...",

    // Lesson Plan Preview
    "plan.structure": "পাঠের কাঠামো",
    "plan.subtitle": "ক্লাস শুরু করার আগে পাঠ্যক্রম পর্যালোচনা করুন।",
    "plan.total_budget": "মোট সময়",
    "plan.requested": "মিনিট",
    "plan.ready_prompt": "AI ক্লাসরুমে প্রবেশ করতে প্রস্তুত?",
    "plan.ready_desc": "শিক্ষক অবতার, কণ্ঠস্বর এবং হোয়াইটবোর্ড প্রস্তুত।",
    "plan.start_class_btn": "ক্লাস শুরু করুন",

    // Classroom
    "class.concept": "ধারণা",
    "class.of": "এর মধ্যে",
    "class.speaking_script": "শিক্ষকের কথ্য স্ক্রিপ্ট",
    "class.listening": "শুনছে",
    "class.explaining": "ব্যাখ্যা করছে...",
    "class.analyzing": "উত্তর বিশ্লেষণ করছে...",
    "class.checking_answer": "উত্তর যাচাই করছে...",
    "class.submit_answer": "উত্তর জমা দিন",
    "class.not_sure": "আমি নিশ্চিত নই",
    "class.correct_title": "চমৎকার! আপনার ধারণা সঠিক।",
    "class.continue_lesson": "পাঠ চালিয়ে যান",
    "class.misconception_title": "চলুন এটি ভিন্নভাবে দেখি",
    "class.analogy_title": "বিকল্প উদাহরণ / সাদৃশ্য",
    "class.explain_again": "নতুন উদাহরণ সহ পুনরায় ব্যাখ্যা করুন",
    "class.try_followup": "পরবর্তী প্রশ্ন চেষ্টা করুন",
    "class.exit_confirm": "ক্লাসরুম থেকে বের হবেন?",
    "class.exit_desc": "আপনার অগ্রগতির বিবরণ নিরাপদে সংরক্ষিত আছে।",
    "class.cancel": "বাতিল",
    "class.exit_dashboard": "ড্যাশবোর্ডে ফিরে যান",

    // Assessment & Report
    "exam.title": "চূড়ান্ত মূল্যায়ন",
    "exam.question": "প্রশ্ন",
    "exam.previous": "পূর্ববর্তী",
    "exam.next": "পরবর্তী প্রশ্ন",
    "exam.review": "উত্তর পর্যালোচনা করুন",
    "exam.submit": "মূল্যায়ন জমা দিন",
    "report.title": "শিক্ষণ রোগ নির্ণয় রিপোর্ট",
    "report.mastered_concepts": "অর্জিত দক্ষতাসমূহ",
    "report.needs_improvement": "উন্নতির ক্ষেত্রসমূহ",
    "report.next_step": "প্রস্তাবিত পরবর্তী বিষয়",
    "report.start_topic": "এই বিষয় শুরু করুন",
    "report.full_breakdown": "সম্পূর্ণ বিবরণ",
    "report.back_dashboard": "ড্যাশবোর্ডে ফিরে যান",
    "report.retake": "পুনরায় পরীক্ষা দিন",

    // Settings
    "settings.title": "সেটিংস",
    "settings.subtitle": "প্রোফাইল এবং পছন্দসমূহ পরিচালনা করুন।",
    "settings.student_profile": "শিক্ষার্থীর প্রোফাইল",
    "settings.display_name": "নাম",
    "settings.default_lang": "ডিফল্ট ভাষা",
    "settings.default_level": "ডিফল্ট স্তর",
    "settings.model_tiers": "AI মডেল স্তর",
    "settings.save": "সংরক্ষণ করুন",
    "settings.danger_zone": "ডেটা রিসেট",
    "settings.clear_data": "ইতিহাস মুছুন"
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
    if (saved && ["English", "Hindi", "Hinglish", "Tamil", "Bengali"].includes(saved)) {
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
