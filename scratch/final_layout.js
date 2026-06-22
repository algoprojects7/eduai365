const fs = require('fs');

function repairFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Step 1: Ensure grid-cols-5 is set
  content = content.replace('grid-cols-1 lg:grid-cols-4 gap-6', 'grid-cols-1 lg:grid-cols-5 gap-6');

  // Find the AI Inspector Panel
  const aiStartMarker = '{/* AI Real-time Inspector Panel */}';
  const aiStartIdx = content.indexOf('            ' + aiStartMarker);
  
  if (aiStartIdx === -1) {
    console.log(`Skipping ${filePath}, AI panel not found or already moved.`);
    return;
  }

  // Find where the AI Inspector Panel ends. 
  // In the corrupted state, it is followed by `            </div>\n\n            {/* Chat message history stream */}`
  const aiEndIdx = content.indexOf('            </div>\n\n            {/* Chat message history stream */}', aiStartIdx);
  
  if (aiEndIdx === -1) {
    console.log(`Could not find end of AI panel in ${filePath}`);
    return;
  }
  
  // Extract AI Panel
  const aiBlock = content.substring(aiStartIdx, aiEndIdx);
  
  // Remove the AI Panel from its current location, and insert the missing `</div>` for Header info.
  const beforeAI = content.substring(0, aiStartIdx);
  const afterAI = content.substring(aiEndIdx); // This starts with `            </div>\n\n            {/* Chat message history...`
  
  // Wait, the `</div>` at aiEndIdx is exactly the one that closes `Header info`!
  // Let's verify: `beforeAI` ends with `<span>Text-Only Active</span>\n              </div>\n`.
  // If we just attach `afterAI` directly to `beforeAI`, the `</div>` will properly close `Header info`!
  // Wait, `beforeAI` ends with:
  // `              </div>\n`
  // `afterAI` starts with:
  // `            </div>\n\n            {/* Chat message history stream */}`
  // So yes! The `</div>` at `aiEndIdx` belongs to the Header info.
  // Wait, what if we just stitch them together?
  // `beforeAI + afterAI` will result in:
  // `              </div>\n            </div>\n\n            {/* Chat message history stream */}`
  // Which correctly closes `Header info` (the `px-6 py-4 ...` div).

  const newMiddle = beforeAI + afterAI;

  // Now we need to insert the `aiBlock` into a new right column AT THE END of the grid.
  // We look for the end of the grid: `        </div>\n\n      </div>\n    </`
  const gridEndIdx = newMiddle.lastIndexOf('        </div>\n\n      </div>\n    </');
  
  if (gridEndIdx !== -1) {
    const rightPanel = `          {/* Right panel - AI Monitor */}\n          <div className="lg:col-span-1 flex flex-col gap-6 lg:h-[800px]">\n${aiBlock}          </div>\n\n`;
    
    // Also, make sure chatboard height is updated to h-[800px] lg:h-[800px]
    let finalContent = newMiddle.substring(0, gridEndIdx) + rightPanel + newMiddle.substring(gridEndIdx);
    
    // Fix chatbox height if it's 650px
    finalContent = finalContent.replace('h-[650px] lg:h-[650px]', 'h-[800px] lg:h-[800px]');
    finalContent = finalContent.replace('h-[650px] overflow-hidden', 'h-[800px] lg:h-[800px] overflow-hidden');
    
    fs.writeFileSync(filePath, finalContent);
    console.log(`Successfully repaired and formatted ${filePath}`);
  }
}

const files = [
  'c:\\eduAI365\\scratch\\page.tsx', // Test on scratch first
  'c:\\eduAI365\\apps\\web-student\\src\\app\\comms\\social\\page.tsx',
  'c:\\eduAI365\\apps\\web-teacher\\src\\app\\comms\\social\\page.tsx',
  'c:\\eduAI365\\apps\\web-parent\\src\\app\\comms\\social\\page.tsx',
  'c:\\eduAI365\\apps\\web-school\\src\\app\\[locale]\\comms\\social\\page.tsx'
];

for (const file of files) {
  repairFile(file);
}
