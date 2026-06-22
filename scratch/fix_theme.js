const fs = require('fs');

const files = [
  'c:\\eduAI365\\apps\\web-student\\src\\app\\comms\\social\\page.tsx',
  'c:\\eduAI365\\apps\\web-teacher\\src\\app\\comms\\social\\page.tsx',
  'c:\\eduAI365\\apps\\web-parent\\src\\app\\comms\\social\\page.tsx',
  'c:\\eduAI365\\apps\\web-school\\src\\app\\[locale]\\comms\\social\\page.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Fix flickering/jerking:
  // 1. Suggestion helper height
  content = content.replace(
    'mb-3 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-2 text-left transition-all duration-500',
    'mb-3 px-3 py-2 min-h-[44px] rounded-xl bg-slate-100 border border-slate-200 flex items-center gap-2 text-left transition-all duration-500'
  );
  
  // 2. Alert absolutely positioned to avoid layout shifts
  content = content.replace(
    'px-6 py-4 bg-rose-950/70 border-t border-b border-rose-900/50 flex items-start gap-3.5 text-left text-rose-200 text-body-md animate-in-fade shadow-[inset_0_4px_12px_rgba(0,0,0,0.1)]',
    'absolute bottom-[130px] left-0 right-0 z-10 px-6 py-4 bg-rose-50 border-t border-b border-rose-200 flex items-start gap-3.5 text-left text-rose-800 text-body-md shadow-lg animate-in-fade'
  );
  content = content.replace(
    'px-6 py-3.5 bg-emerald-950/70 border-t border-b border-emerald-900/50 flex items-center gap-2.5 text-left text-emerald-200 text-body-md animate-in-fade',
    'absolute bottom-[130px] left-0 right-0 z-10 px-6 py-3.5 bg-emerald-50 border-t border-b border-emerald-200 flex items-center gap-2.5 text-left text-emerald-800 text-body-md shadow-lg animate-in-fade'
  );

  // Convert theme to Elegant White
  
  // Containers
  content = content.replace(/bg-slate-950\/80 border-slate-800\/60/g, 'bg-white border-slate-200 shadow-sm');
  content = content.replace(/bg-slate-950\/80 border-slate-800/g, 'bg-white border-slate-200 shadow-sm');
  content = content.replace(/bg-slate-950\/50/g, 'bg-white shadow-sm');
  content = content.replace(/bg-slate-950/g, 'bg-slate-50');
  content = content.replace(/bg-slate-900\/40/g, 'bg-white shadow-sm');
  content = content.replace(/bg-slate-900\/60/g, 'bg-slate-100');
  content = content.replace(/bg-slate-900\/80/g, 'bg-white');
  content = content.replace(/bg-slate-900/g, 'bg-slate-100');
  
  // Grid and gradients
  content = content.replace(/bg-grid-slate-900\/\[0.04\]/g, 'bg-grid-slate-200/[0.4]');
  content = content.replace(/from-slate-950\/40 via-slate-900\/20 to-slate-950\/40/g, 'from-slate-50 via-slate-50/50 to-slate-50');
  content = content.replace(/from-slate-950 via-slate-950\/80/g, 'from-slate-50 via-slate-50/80');

  // Text colors
  content = content.replace(/text-slate-100/g, 'text-slate-900');
  content = content.replace(/text-slate-200/g, 'text-slate-800');
  content = content.replace(/text-slate-300/g, 'text-slate-600');
  content = content.replace(/text-slate-400/g, 'text-slate-500');
  
  // Borders
  content = content.replace(/border-slate-800\/80/g, 'border-slate-200');
  content = content.replace(/border-slate-800\/60/g, 'border-slate-200');
  content = content.replace(/border-slate-800/g, 'border-slate-200');
  content = content.replace(/border-slate-700\/60/g, 'border-slate-300');
  content = content.replace(/border-slate-900/g, 'border-slate-100');

  // Specific accent text
  content = content.replace(/text-indigo-300/g, 'text-indigo-700');
  content = content.replace(/bg-indigo-950\/40 border-indigo-800\/50/g, 'bg-indigo-50 border-indigo-200');
  content = content.replace(/bg-indigo-400\/20/g, 'bg-indigo-100');
  content = content.replace(/text-rose-300/g, 'text-rose-700');
  content = content.replace(/text-emerald-300/g, 'text-emerald-700');
  content = content.replace(/text-rose-200/g, 'text-rose-800');
  content = content.replace(/text-emerald-200/g, 'text-emerald-800');
  
  // Layout fixes
  // Change input container relative
  content = content.replace('<div className="p-4 bg-slate-50 border-t border-slate-200">', '<div className="p-4 bg-slate-50 border-t border-slate-200 relative">');

  fs.writeFileSync(file, content);
}
console.log('Theme applied successfully.');
