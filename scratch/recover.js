const fs = require('fs');

const files = [
  'c:\\eduAI365\\apps\\web-student\\src\\app\\comms\\social\\page.tsx',
  'c:\\eduAI365\\apps\\web-teacher\\src\\app\\comms\\social\\page.tsx',
  'c:\\eduAI365\\apps\\web-parent\\src\\app\\comms\\social\\page.tsx',
  'c:\\eduAI365\\apps\\web-school\\src\\app\\[locale]\\comms\\social\\page.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // The corrupted file is: beforeAI + entire_file + rightPanel(beforeAI) + end
  const aiStartMarker = '{/* AI Real-time Inspector Panel */}';
  
  // The first occurrence of aiStartMarker in the corrupted file is actually INSIDE entire_file, 
  // because beforeAI ends exactly BEFORE aiStartMarker!
  // Wait, beforeAI = content.substring(0, aiIndex), so it DOES NOT contain aiStartMarker.
  // So the very first occurrence of aiStartMarker in the corrupted file is the beginning of entire_file's AI section.
  
  // Let's find where beforeAI ends.
  // entire_file starts at `beforeAI.length`. 
  // Since beforeAI does not contain aiStartMarker, if we just find the FIRST occurrence of aiStartMarker, 
  // that is exactly where it appeared in entire_file.
  // Wait, if entire_file is literally appended to beforeAI, then the corrupted file is:
  // corrupted = beforeAI + beforeAI + aiStartMarker + ... 
  // So beforeAI is duplicated!
  
  // Let's find the exact middle of the duplicated beforeAI.
  // Since we know beforeAI was duplicated exactly, we can just look for the first line of the file.
  // `import React, { useState, useEffect, useRef } from 'react';`
  
  const firstLine = "import React";
  const firstIndex = content.indexOf(firstLine); // 0
  const secondIndex = content.indexOf(firstLine, firstIndex + 1); // This is where entire_file starts!
  
  if (secondIndex !== -1) {
    console.log(`Found start of entire_file at index ${secondIndex} for ${file}`);
    
    // entire_file starts at secondIndex. 
    // Where does it end?
    // It ends where rightPanel was inserted!
    // rightPanel starts with `          {/* Right panel - AI Monitor */}`
    
    const rightPanelIndex = content.indexOf('          {/* Right panel - AI Monitor */}');
    
    if (rightPanelIndex !== -1) {
      // entire_file is from secondIndex to rightPanelIndex
      // Wait, let's remember gridEndIndex:
      // finalContent = withoutAI.substring(0, gridEndIndex) + rightPanel + withoutAI.substring(gridEndIndex);
      // So rightPanel was inserted at gridEndIndex.
      // And the rest of entire_file is AFTER rightPanel!
      
      const rightPanelEnd = content.indexOf('</div>\n\n', rightPanelIndex + 100);
      // Wait, rightPanel is: `          {/* Right panel - AI Monitor */}\n          <div className="lg:col-span-1 flex flex-col gap-6 lg:h-[800px]">\n            ` + aiBlock.trim() + `\n          </div>\n\n`;
      // Since aiBlock is beforeAI, we can just find the end of rightPanel by looking for the grid closing tags.
      
      // Let's just construct the original entire_file:
      // It is exactly: content.substring(secondIndex, rightPanelIndex) + content.substring(rightPanelIndex + rightPanel length)
      // What is the length of rightPanel?
      // `rightPanel` was inserted before `        </div>\n\n      </div>\n    </`
      // So everything after rightPanel is just `        </div>\n\n      </div>\n    </StudentShell>\n  );\n}\n` or similar.
      
      // Let's just find the end of the file.
      const closingIndex = content.indexOf('        </div>\n\n      </div>\n    </', rightPanelIndex);
      if (closingIndex !== -1) {
        // entire_file = content.substring(secondIndex, rightPanelIndex) + content.substring(closingIndex)
        // Wait! The closing index is AFTER the right panel. But wait, `rightPanel` was inserted exactly AT `gridEndIndex`.
        // So the text after `rightPanel` is EXACTLY the text from `gridEndIndex` to the end of `entire_file`.
        // The text from `gridEndIndex` to the end of `entire_file` is just:
        // `        </div>\n\n      </div>\n    </StudentShell>\n  );\n}\n`
        
        // Let's just extract it and save it!
        // But the closing tags vary by file (StudentShell, TeacherShell, etc).
        // Let's just find the matching Shell tag.
        
        let shellClose = '';
        if (file.includes('web-student')) shellClose = '    </StudentShell>\n  );\n}\n';
        if (file.includes('web-teacher')) shellClose = '    </TeacherShell>\n  );\n}\n';
        if (file.includes('web-parent')) shellClose = '    </ParentShell>\n  );\n}\n';
        if (file.includes('web-school')) shellClose = '    </SchoolShell>\n  );\n}\n';
        
        const recoveredContent = content.substring(secondIndex, rightPanelIndex) + '        </div>\n\n      </div>\n' + shellClose;
        fs.writeFileSync(file, recoveredContent);
        console.log(`Recovered ${file}`);
      }
    }
  }
}
