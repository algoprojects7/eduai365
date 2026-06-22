const fs = require('fs');

const files = [
  'c:\\eduAI365\\apps\\web-student\\src\\app\\comms\\social\\page.tsx',
  'c:\\eduAI365\\apps\\web-teacher\\src\\app\\comms\\social\\page.tsx',
  'c:\\eduAI365\\apps\\web-parent\\src\\app\\comms\\social\\page.tsx',
  'c:\\eduAI365\\apps\\web-school\\src\\app\\[locale]\\comms\\social\\page.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Change grid to 5 columns
  content = content.replace('grid-cols-1 lg:grid-cols-4 gap-6', 'grid-cols-1 lg:grid-cols-5 gap-6');

  // Extract AI Stream Inspector
  const aiStartMarker = '{/* AI Real-time Inspector Panel */}';
  const nextSectionMarker = '{/* Online Members Panel */}'; // Actually, in the current file, we reordered it.
  
  // Wait, in my previous script, I reordered them as:
  // 1. School Channels
  // 2. Online Members Panel
  // 3. AI Real-time Inspector Panel
  
  // Let's verify the order by finding the indices.
  const aiIndex = content.indexOf(aiStartMarker);
  const leftPanelEndMarker = '</div>\n\n          {/* Right panel - Chat board */}';
  const chatBoardEndMarker = '            </div>\n\n          </div>\n\n        </div>\n\n      </div>\n    </';
  
  // Wait, looking at the file structure:
  // <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
  //   <div className="lg:col-span-1 ...">
  //      ...
  //      {/* AI Real-time Inspector Panel */}
  //      <div className="bg-gradient-to-b ...">...</div>
  //   </div>
  //   {/* Right panel - Chat board */}
  //   <div className="lg:col-span-3 ...">
  //      ...
  //   </div>
  // </div>
  
  // The AI block ends before the `</div>` that closes the left panel.
  // Actually, let's just find the `</div>` that closes the AI block.
  // The AI block starts at `aiStartMarker`.
  
  if (aiIndex !== -1) {
    // To safely extract the block, I'll use simple string matching since it's consistently formatted.
    // The block starts at `aiStartMarker` and ends before `</div>\n\n          {/* Right panel - Chat board */}` if it's the last item in left panel.
    // Let's find the left panel end.
    const leftPanelEndIndex = content.indexOf('</div>\n\n          {/* Right panel - Chat board */}');
    
    // Check if AI is after Online Members
    const onlineIndex = content.indexOf('{/* Online Members Panel */}');
    
    let aiBlock = '';
    let beforeAI = '';
    let afterAI = '';
    
    if (aiIndex > onlineIndex) {
      // AI is the last block
      aiBlock = content.substring(aiIndex, leftPanelEndIndex);
      beforeAI = content.substring(0, aiIndex);
      afterAI = content.substring(leftPanelEndIndex);
    } else {
      // AI is not the last block? This shouldn't happen based on the previous script, but just in case.
      aiBlock = content.substring(aiIndex, onlineIndex);
      beforeAI = content.substring(0, aiIndex);
      afterAI = content.substring(onlineIndex);
    }
    
    // Remove aiBlock from the left panel content
    const withoutAI = beforeAI + afterAI;
    
    // Now we need to insert the AI block AFTER the Chat board panel.
    // The chat board is closed by `          </div>\n\n        </div>\n\n      </div>`
    // Let's find the closing of the chat board.
    // It's the `</div>` before `        </div>\n\n      </div>\n    </StudentShell>` or similar.
    
    // We can just find the end of the grid:
    // The grid is closed by `        </div>\n\n      </div>`
    
    const gridEndIndex = withoutAI.lastIndexOf('        </div>\n\n      </div>\n    </');
    
    if (gridEndIndex !== -1) {
      // We will wrap the aiBlock in a new right panel column
      const rightPanel = `          {/* Right panel - AI Monitor */}\n          <div className="lg:col-span-1 flex flex-col gap-6 lg:h-[800px]">\n            ` + aiBlock.trim() + `\n          </div>\n\n`;
      
      const finalContent = withoutAI.substring(0, gridEndIndex) + rightPanel + withoutAI.substring(gridEndIndex);
      fs.writeFileSync(file, finalContent);
    }
  }

}
console.log('Layout updated to 3 columns successfully.');
