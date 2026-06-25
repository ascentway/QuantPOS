const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'frontend', 'src', 'pages');

const files = [
  'Inventory.jsx',
  'Settings.jsx',
  'Profile.jsx'
];

const replacements = [
  { regex: /text-white\/[3456]0/g, replacement: 'text-text-muted' },
  { regex: /text-white\/[789]0/g, replacement: 'text-text-secondary' },
  { regex: /text-white/g, replacement: 'text-text-primary' },
  { regex: /bg-white\/[0-9.]+/g, replacement: 'bg-card2' },
  { regex: /border-white\/[0-9.]+/g, replacement: 'border-theme' },
  { regex: /bg-sidebar/g, replacement: 'bg-surface' }, // in Inventory form
];

for (const file of files) {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  for (const { regex, replacement } of replacements) {
    content = content.replace(regex, replacement);
  }
  
  // Custom manual fix for bg-[#...] text-text-primary in Settings/Inventory buttons
  // Settings.jsx: bg-accent text-text-primary -> should be text-white since buttons need to stay white
  content = content.replace(/bg-accent text-text-primary/g, 'bg-accent text-white');
  content = content.replace(/bg-accent hover:bg-accent-hover transition-colors text-text-primary/g, 'bg-accent hover:bg-accent-hover transition-colors text-white');
  content = content.replace(/bg-[#10b981] hover:bg-[#059669] transition-colors text-text-primary/g, 'bg-[#10b981] hover:bg-[#059669] transition-colors text-white');
  content = content.replace(/bg-accent\/15 text-\[#a87eff\]/g, 'bg-accent-subtle text-accent');

  // Fix tailwind class parsing edge cases
  content = content.replace(/text-text-primary\/[0-9]+/g, 'text-text-muted');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
