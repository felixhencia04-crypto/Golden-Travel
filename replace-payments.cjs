const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

function replaceFindMany(code, model, helperName) {
  let result = '';
  let i = 0;
  const searchStr = `withRetry(() => db.query.${model}.findMany({`;
  
  while (i < code.length) {
    const idx = code.indexOf(searchStr, i);
    if (idx === -1) {
      result += code.slice(i);
      break;
    }
    
    result += code.slice(i, idx);
    i = idx + searchStr.length - 1; // start at '{'
    
    // find balanced '})'
    let depth = 0;
    let endIdx = -1;
    for (let j = i; j < code.length; j++) {
      if (code[j] === '{') depth++;
      if (code[j] === '}') depth--;
      if (depth === 0) {
        // we found the end of the object!
        // it should be followed by '}))'
        if (code.slice(j, j + 3) === '}))') {
          endIdx = j + 3;
          break;
        }
      }
    }
    
    if (endIdx !== -1) {
      const objStr = code.slice(i, endIdx - 2); // just the object {...}
      result += `${helperName}(${objStr})`;
      i = endIdx;
    } else {
      result += searchStr;
      i += searchStr.length;
    }
  }
  return result;
}

code = replaceFindMany(code, 'payments', 'getPaymentsQuery');
code = replaceFindMany(code, 'certificates', 'getCertificatesQuery');
code = replaceFindMany(code, 'documents', 'getDocumentsQuery');

fs.writeFileSync('server.ts', code);
console.log("Replaced!");
