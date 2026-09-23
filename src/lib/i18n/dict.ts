export type Lang = "mr" | "en";

export const dict = {
  common: {
    save:      { mr: "जतन करा",   en: "Save" },
    cancel:    { mr: "रद्द करा",  en: "Cancel" },
    edit:      { mr: "संपादित करा", en: "Edit" },
    delete:    { mr: "हटवा",     en: "Delete" },
    add:       { mr: "जोडा",     en: "Add" },
    search:    { mr: "शोधा",     en: "Search" },
    loading:   { mr: "लोड होत आहे…", en: "Loading…" },
    logout:    { mr: "लॉगआउट",   en: "Logout" },
    yes:       { mr: "होय",      en: "Yes" },
    no:        { mr: "नाही",     en: "No" },
    active:    { mr: "सक्रिय",   en: "Active" },
    inactive:  { mr: "निष्क्रिय", en: "Inactive" },
    back:      { mr: "मागे",     en: "Back" },
    confirm:   { mr: "पुष्टी करा", en: "Confirm" },
  },
  login: {
    title:    { mr: "लॉगिन",    en: "Login" },
    email:    { mr: "ईमेल",     en: "Email" },
    password: { mr: "पासवर्ड",   en: "Password" },
    submit:   { mr: "लॉगिन",    en: "Login" },
    error:    { mr: "चुकीचा ईमेल किंवा पासवर्ड", en: "Invalid email or password" },
  },
  nav: {
    dashboard: { mr: "डॅशबोर्ड",    en: "Dashboard" },
    classes:   { mr: "वर्ग / तुकड्या",       en: "Standards & Divisions" },
    students:  { mr: "विद्यार्थी",  en: "Students" },
    results:   { mr: "निकाल",      en: "Results" },
    templates: { mr: "टेम्पलेट्स",   en: "Templates" },
    settings:  { mr: "सेटिंग्ज",    en: "Settings" },
  },
  dashboard: {
    classesCount:  { mr: "वर्ग",           en: "Classes" },
    studentsCount: { mr: "विद्यार्थी",      en: "Students" },
    examsCount:    { mr: "अपलोड केलेले निकाल", en: "Exams uploaded" },
    uploadCta:     { mr: "+ नवीन निकाल अपलोड करा", en: "+ Upload New Result" },
  },
  classes: {
    title:        { mr: "वर्ग",           en: "Classes" },
    add:          { mr: "+ वर्ग जोडा",    en: "+ Add class" },
    name:         { mr: "वर्गाचे नाव",     en: "Class name" },
    year:         { mr: "शैक्षणिक वर्ष",   en: "Academic year" },
    active:       { mr: "सक्रिय",         en: "Active" },
    actions:      { mr: "क्रिया",         en: "Actions" },
    empty:        { mr: "अजून एकही वर्ग जोडलेला नाही.", en: "No classes yet." },
    confirmDelete:{ mr: "हा वर्ग आणि त्यातील सर्व विद्यार्थी हटवायचे?", en: "Delete this class and all its students?" },
  },
  students: {
    title:         { mr: "विद्यार्थी",      en: "Students" },
    add:           { mr: "+ विद्यार्थी जोडा", en: "+ Add student" },
    import:        { mr: "Excel वरून आयात करा", en: "Import from Excel" },
    rollNo:        { mr: "हजेरी क्र.",      en: "Roll no" },
    name:          { mr: "नाव",            en: "Name" },
    mobile:        { mr: "पालकाचा मोबाईल",  en: "Parent mobile" },
    dob:           { mr: "जन्मतारीख",       en: "DOB" },
    actions:       { mr: "क्रिया",          en: "Actions" },
    empty:         { mr: "या वर्गात अजून विद्यार्थी नाहीत.", en: "No students in this class yet." },
    confirmDelete: { mr: "हा विद्यार्थी हटवायचा?", en: "Delete this student?" },
    importHelp:    {
      mr: "Excel स्तंभ: roll_no, student_name, parent_mobile, dob (YYYY-MM-DD)",
      en: "Excel columns: roll_no, student_name, parent_mobile, dob (YYYY-MM-DD)",
    },
    importSuccess: { mr: "विद्यार्थी यशस्वीरित्या आयात केले", en: "Students imported successfully" },
  },
  settings: {
    title:   { mr: "शाळेची माहिती", en: "School settings" },
    name:    { mr: "शाळेचे नाव",    en: "School name" },
    address: { mr: "पत्ता",         en: "Address" },
    logo:    { mr: "लोगो",          en: "Logo" },
    saved:   { mr: "जतन केले",      en: "Saved" },
  },
} as const;

export type DictPath = string;

// Small helper: t(dict.classes.title, lang)
export function t<T extends { mr: string; en: string }>(entry: T, lang: Lang): string {
  return entry[lang];
}
