const fs = require('fs');

const code = fs.readFileSync('src/components/HomeView.tsx', 'utf-8');
const lines = code.split('\n');

// We'll only analyze the lines inside the return statement: 379 to 2235
const targetCode = lines.slice(378, 2235).join('\n');

let pos = 0;
const len = targetCode.length;
const tagStack = [];

// Self-closing tags in our JSX
const selfClosingList = [
  'img', 'input', 'br', 'hr', 'link', 'meta', 'source',
  // Lucide icons
  'Search', 'Shield', 'Layers', 'Users', 'Star', 'ArrowRight', 'Phone', 'MessageSquare',
  'ChevronLeft', 'ChevronRight', 'FileText', 'Download', 'Play', 'CheckCircle',
  'HelpCircle', 'Calendar', 'Award', 'CheckSquare', 'Zap', 'ExternalLink', 'Heart',
  'User', 'MapPin', 'Sparkles', 'Globe', 'TrendingUp', 'Gauge', 'Eye', 'BookOpen', 'ThumbsUp', 'Code', 'Copy',
  'Info', 'Settings', 'Check', 'AlertCircle', 'Lock', 'Mail', 'Briefcase', 'Menu', 'X',
  'Clock', 'ChevronDown', 'ChevronUp', 'Filter', 'Activity', 'Trash2', 'Plus', 'Edit', 'Save',
  'LogOut', 'UserCheck', 'Settings2', 'FileSpreadsheet', 'Send', 'EyeOff', 'Camera', 'Paperclip', 'Video',
  'Database', 'DatabaseZap', 'Fingerprint', 'Bot', 'Cpu', 'Terminal', 'Maximize2', 'Minimize2'
];
const selfClosing = new Set(selfClosingList);

function getLineNumber(targetPos) {
  const sub = targetCode.substring(0, targetPos);
  return 379 + sub.split('\n').length - 1;
}

while (pos < len) {
  const char = targetCode[pos];
  
  // Strip comments
  if (targetCode.substring(pos, pos + 2) === '//') {
    pos = targetCode.indexOf('\n', pos);
    if (pos === -1) pos = len;
    continue;
  }
  if (targetCode.substring(pos, pos + 2) === '/*') {
    pos = targetCode.indexOf('*/', pos) + 2;
    if (pos === 1) pos = len;
    continue;
  }
  
  // Ignore strings
  if (char === '"' || char === '`') {
    const quote = char;
    pos++;
    while (pos < len && targetCode[pos] !== quote) {
      if (targetCode[pos] === '\\') pos += 2;
      else pos++;
    }
    pos++;
    continue;
  }
  
  // Check for JSX tag
  if (char === '<') {
    const nextChar = targetCode[pos + 1];
    // Check if it's a JSX tag or closing tag or fragment
    if (nextChar === '/' || nextChar === '>' || /[a-zA-Z]/.test(nextChar)) {
      const isClosing = nextChar === '/';
      let tagStart = pos;
      pos++;
      if (isClosing) pos++;
      
      let tagName = '';
      // Support React fragment <> and </>
      if (targetCode[pos] === '>') {
        tagName = 'Fragment';
      } else {
        while (pos < len && /[a-zA-Z0-9.:-]/.test(targetCode[pos])) {
          tagName += targetCode[pos];
          pos++;
        }
      }
      
      // Find the end of this tag
      let isSelfClosing = false;
      while (pos < len && targetCode[pos] !== '>') {
        if (targetCode[pos] === '/' && targetCode[pos + 1] === '>') {
          isSelfClosing = true;
          pos++;
          break;
        }
        pos++;
      }
      pos++; // consume '>'
      
      const line = getLineNumber(tagStart);
      
      if (isClosing) {
        if (tagStack.length === 0) {
          console.log(`Error: Closed tag </${tagName}> at line ${line} with no matching open tag`);
        } else {
          const last = tagStack.pop();
          if (last.name !== tagName) {
            console.log(`Error: Mismatch! Closed </${tagName}> at line ${line}, but last open tag was <${last.name}> at line ${last.line}`);
            // Push it back to keep checking
            tagStack.push(last);
          }
        }
      } else if (!isSelfClosing && !selfClosing.has(tagName)) {
        tagStack.push({ name: tagName, line });
      }
      continue;
    }
  }
  
  pos++;
}

console.log("Unclosed tags in range 379-2235:", tagStack);
