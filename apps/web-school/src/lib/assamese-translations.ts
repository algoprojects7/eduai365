export const ASSAMESE_TRANSLATIONS: Record<string, string> = {
  // Subjects
  'English': 'ইংৰাজী',
  'Mathematics': 'গণিত',
  'Science': 'বিজ্ঞান',
  'Social Science': 'সমাজ বিজ্ঞান',
  'Assamese': 'অসমীয়া',
  'Hindi': 'হিন্দী',
  'Computer Science': 'কম্পিউটাৰ বিজ্ঞান',
  'General Knowledge': 'সাধাৰণ জ্ঞান',
  'Art': 'কলা',
  'Physical Education': 'শাৰীৰিক শিক্ষা',
  
  // Report Card Labels
  'Progress Report': 'প্ৰগতি প্ৰতিবেদন',
  'Term': 'ষাণ্মাসিক',
  'Name': 'নাম',
  'Admission No': 'ভৰ্তি নং',
  'Class': 'শ্ৰেণী',
  'Section': 'শাখা',
  'Roll No': 'ৰোল নং',
  'Attendance': 'উপস্থিতি',
  'Subject': 'বিষয়',
  'Marks': 'নম্বৰ',
  'Max': 'সৰ্বোচ্চ নম্বৰ',
  'Grade': 'গ্ৰেড',
  'Total': 'মুঠ',
  'Teacher Remarks': 'শিক্ষকৰ মন্তব্য',
  'Overall': 'সামগ্ৰিক',
  'PASS': 'উত্তীৰ্ণ',
  'FAIL': 'অনুত্তীৰ্ণ',
  'Term 1': 'প্ৰথম ষাণ্মাসিক',
  'Term 2': 'দ্বিতীয় ষাণ্মাসিক',
  'Half Yearly': 'অৰ্ধ বাৰ্ষিক',
  'Annual': 'বাৰ্ষিক',
};

export function translateToAssamese(text: string): string {
  if (!text) return text;
  return ASSAMESE_TRANSLATIONS[text.trim()] || text;
}
