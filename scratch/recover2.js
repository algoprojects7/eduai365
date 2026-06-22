const fs = require('fs');

const files = [
  'c:\\eduAI365\\apps\\web-student\\src\\app\\comms\\social\\page.tsx',
  'c:\\eduAI365\\apps\\web-teacher\\src\\app\\comms\\social\\page.tsx',
  'c:\\eduAI365\\apps\\web-parent\\src\\app\\comms\\social\\page.tsx',
  'c:\\eduAI365\\apps\\web-school\\src\\app\\[locale]\\comms\\social\\page.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  const firstLine = "'use client';";
  const firstIndex = content.indexOf(firstLine);
  const secondIndex = content.indexOf(firstLine, firstIndex + 1);
  
  if (secondIndex !== -1) {
    console.log(`Found start of entire_file at index ${secondIndex} for ${file}`);
    
    const rightPanelIndex = content.indexOf('          {/* Right panel - AI Monitor */}');
    
    if (rightPanelIndex !== -1) {
      let shellClose = '';
      if (file.includes('web-student')) shellClose = '    </StudentShell>\n  );\n}\n';
      if (file.includes('web-teacher')) shellClose = '    </TeacherShell>\n  );\n}\n';
      if (file.includes('web-parent')) shellClose = '    </ParentShell>\n  );\n}\n';
      if (file.includes('web-school')) shellClose = '    </SchoolShell>\n  );\n}\n';
      
      const recoveredContent = content.substring(secondIndex, rightPanelIndex) + '        </div>\n\n      </div>\n' + shellClose;
      fs.writeFileSync(file, recoveredContent);
      console.log(`Recovered ${file}`);
    }
  } else {
    // If we already recovered, it won't have a second "'use client';"
    console.log(`No duplicate found in ${file}`);
  }
}
