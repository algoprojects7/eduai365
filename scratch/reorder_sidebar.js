const fs = require('fs');

const files = [
  'c:\\eduAI365\\apps\\web-student\\src\\app\\comms\\social\\page.tsx',
  'c:\\eduAI365\\apps\\web-teacher\\src\\app\\comms\\social\\page.tsx',
  'c:\\eduAI365\\apps\\web-parent\\src\\app\\comms\\social\\page.tsx',
  'c:\\eduAI365\\apps\\web-school\\src\\app\\[locale]\\comms\\social\\page.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Increase height of sidebar container from 650px to 800px to give more vertical space
  content = content.replace('lg:col-span-1 flex flex-col gap-6 lg:h-[650px]', 'lg:col-span-1 flex flex-col gap-6 lg:h-[800px]');
  
  // Extract sections
  const aiStartMarker = '{/* AI Real-time Inspector Panel */}';
  const onlineStartMarker = '{/* Online Members Panel */}';
  
  // They are ordered:
  // 1. School Channels
  // 2. AI Real-time Inspector Panel
  // 3. Online Members Panel
  
  // We need to reorder to:
  // 1. School Channels
  // 2. Online Members Panel
  // 3. AI Real-time Inspector Panel
  
  const aiIndex = content.indexOf(aiStartMarker);
  const onlineIndex = content.indexOf(onlineStartMarker);
  
  if (aiIndex !== -1 && onlineIndex !== -1) {
    const aiBlock = content.substring(aiIndex, onlineIndex);
    // The online block extends until the closing </div> of the left panel.
    // We can find the end of the online block by finding `</div>\n\n            {/* Chat message history stream */}` or similar.
    const chatStartMarker = '{/* Chat message history stream */}';
    const chatIndex = content.indexOf(chatStartMarker);
    
    // We need to carefully split.
    // The left panel ends with `</div>` right before chat stream.
    // Actually, looking at the DOM:
    // <div className="lg:col-span-1 ...">
    //    {/* Active boards */}
    //    {/* AI Panel */}
    //    {/* Online Panel */}
    // </div>
    
    // Let's find the `</div>` that closes the Online Panel. It's the one right before `</div>` that closes left panel.
    // Just split by the markers
    
    const beforeAI = content.substring(0, aiIndex);
    const middleAI = content.substring(aiIndex, onlineIndex);
    const rest = content.substring(onlineIndex);
    
    // Where does the online panel end? It ends before the final `</div>` of the lg:col-span-1 wrapper.
    // `            </div>\n\n            {/* Chat message history stream */}`
    
    const leftPanelEndIndex = content.indexOf('</div>\n\n            {/* Chat message history stream */}');
    const onlineBlock = content.substring(onlineIndex, leftPanelEndIndex);
    const afterLeftPanel = content.substring(leftPanelEndIndex);
    
    // Swap them!
    const newContent = beforeAI + onlineBlock + middleAI + afterLeftPanel;
    
    fs.writeFileSync(file, newContent);
  }
}
console.log('Sidebar reordered successfully.');
