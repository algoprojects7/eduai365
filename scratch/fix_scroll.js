const fs = require('fs');

const files = [
  'c:\\eduAI365\\apps\\web-student\\src\\app\\comms\\social\\page.tsx',
  'c:\\eduAI365\\apps\\web-teacher\\src\\app\\comms\\social\\page.tsx',
  'c:\\eduAI365\\apps\\web-parent\\src\\app\\comms\\social\\page.tsx',
  'c:\\eduAI365\\apps\\web-school\\src\\app\\[locale]\\comms\\social\\page.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Replace scrollIntoView with parentElement.scrollTo to prevent whole window scrolling
  const scrollFind = "chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });";
  const scrollReplace = `if (chatEndRef.current) {
      const parent = chatEndRef.current.parentElement;
      if (parent) {
        parent.scrollTo({ top: parent.scrollHeight, behavior: 'smooth' });
      }
    }`;
  
  content = content.replace(scrollFind, scrollReplace);

  // Also make sure right panel matches the left panel's 800px height if it is 650px
  content = content.replace(/flex flex-col h-\[650px\] lg:h-\[650px\]/, 'flex flex-col h-[800px] lg:h-[800px]');

  fs.writeFileSync(file, content);
}
console.log('Scroll fix applied.');
