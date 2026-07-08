import * as fs from 'fs';

const content = fs.readFileSync('src/components/HomeView.tsx', 'utf-8');
const lines = content.split('\n');
const targetCode = lines.slice(379, 2235).join('\n');

const IGNORE_TAGS = new Set([
  'string', 'number', 'boolean', 'any', 'void', 'unknown', 'never',
  'Product', 'Vendor', 'Blog', 'Banner', 'Testimonial', 'Category', 
  'TrustedVendor', 'User', 'HTMLDivElement', 'HTMLButtonElement', 'HTMLElement',
  'T', 'U', 'K', 'V'
]);

let pos = 0;
const len = targetCode.length;
const stack: { tag: string; line: number; col: number; text: string }[] = [];
let contextStack: ('JSX' | 'JS_EXPR' | 'TAG_ATTR')[] = ['JSX'];
let jsBraceCount = 0;

function getLineCol(p: number) {
  const sub = content.substring(0, p + content.indexOf(targetCode));
  const lines = sub.split('\n');
  return { line: lines.length, col: lines[lines.length - 1].length + 1 };
}

while (pos < len) {
  const c = targetCode[pos];
  const lc = getLineCol(pos);

  const isTarget = lc.line === 799 && lc.col === 19;

  if (isTarget) {
    console.log(`[Line 799 Col 19] c: "${c}", contextStack: ${JSON.stringify(contextStack)}, jsBraceCount: ${jsBraceCount}`);
  }

  // Handle comments
  if (targetCode.startsWith('//', pos)) {
    pos = targetCode.indexOf('\n', pos);
    if (pos === -1) break;
    continue;
  }
  if (targetCode.startsWith('/*', pos)) {
    pos = targetCode.indexOf('*/', pos);
    if (pos === -1) break;
    pos += 2;
    continue;
  }
  if (targetCode.startsWith('{/*', pos)) {
    pos = targetCode.indexOf('*/}', pos);
    if (pos === -1) break;
    pos += 3;
    continue;
  }

  const currentContext = contextStack[contextStack.length - 1];

  if (isTarget) {
    console.log(`[Line 799 Col 19] currentContext: ${currentContext}`);
  }

  if (currentContext === 'JS_EXPR' || currentContext === 'TAG_ATTR') {
    if (c === '"') {
      pos++;
      while (pos < len && targetCode[pos] !== '"') {
        if (targetCode[pos] === '\\') pos += 2;
        else pos++;
      }
      pos++;
      continue;
    }
    if (c === "'") {
      pos++;
      while (pos < len && targetCode[pos] !== "'") {
        if (targetCode[pos] === '\\') pos += 2;
        else pos++;
      }
      pos++;
      continue;
    }
    if (c === '`') {
      pos++;
      while (pos < len && targetCode[pos] !== '`') {
        if (targetCode[pos] === '\\') pos += 2;
        else pos++;
      }
      pos++;
      continue;
    }
  }

  if (currentContext === 'JSX') {
    if (c === '{') {
      contextStack.push('JS_EXPR');
      jsBraceCount = 1;
      pos++;
      continue;
    }
  } else if (currentContext === 'JS_EXPR') {
    if (c === '{') {
      jsBraceCount++;
      pos++;
      continue;
    }
    if (c === '}') {
      jsBraceCount--;
      if (jsBraceCount === 0) {
        contextStack.pop();
      }
      pos++;
      continue;
    }
  } else if (currentContext === 'TAG_ATTR') {
    if (c === '{') {
      contextStack.push('JS_EXPR');
      jsBraceCount = 1;
      pos++;
      continue;
    }
    if (c === '/' && targetCode[pos + 1] === '>') {
      contextStack.pop();
      const popped = stack.pop();
      pos += 2;
      continue;
    }
    if (c === '>') {
      contextStack.pop();
      pos++;
      continue;
    }
  }

  if (isTarget) {
    console.log(`[Line 799 Col 19] checking if JSX/JS_EXPR tag...`);
  }

  // JSX Tags
  if (currentContext === 'JSX' || currentContext === 'JS_EXPR') {
    if (c === '<') {
      if (isTarget) {
        console.log(`[Line 799 Col 19] yes, is '<'!`);
      }
      const nextChar = targetCode[pos + 1];
      if (nextChar === '!' || nextChar === '?' || nextChar === '=' || /\d/.test(nextChar) || nextChar === ' ' || nextChar === '+') {
        pos++;
        continue;
      }
      
      const isClosing = nextChar === '/';
      const startTag = pos;
      pos++;
      if (isClosing) pos++;
      
      let tagName = '';
      while (pos < len && /[a-zA-Z0-9.:-]/.test(targetCode[pos])) {
        tagName += targetCode[pos];
        pos++;
      }
      
      if (isTarget) {
        console.log(`[Line 799 Col 19] tagName: "${tagName}", isIgnored: ${IGNORE_TAGS.has(tagName)}`);
      }

      if (!tagName || IGNORE_TAGS.has(tagName)) {
        continue;
      }
      
      const tagLc = getLineCol(startTag);
      
      if (isClosing) {
        let matchedIndex = -1;
        for (let i = stack.length - 1; i >= 0; i--) {
          if (stack[i].tag === tagName) {
            matchedIndex = i;
            break;
          }
        }
        if (matchedIndex !== -1) {
          stack.splice(matchedIndex);
        }
        while (pos < len && targetCode[pos] !== '>') {
          pos++;
        }
        pos++;
      } else {
        if (isTarget) {
          console.log(`[Line 799 Col 19] pushing tag "${tagName}" to stack!`);
        }
        stack.push({ tag: tagName, line: tagLc.line, col: tagLc.col, text: tagName });
        contextStack.push('TAG_ATTR');
      }
      continue;
    }
  }

  pos++;
}

console.log("Unmatched tags left in stack:", stack);
