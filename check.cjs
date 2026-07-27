const fs = require('fs');
const content = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

let depth = 0;
let line = 1;
for(let i=0; i<content.length; i++) {
    if(content[i] === '\n') line++;
    if(content.substr(i, 4) === '<div') { depth++; }
    else if(content.substr(i, 5) === '</div') { depth--; }
    if(depth < 0) { console.log('Negative depth at line', line); break; }
}
console.log('Final depth:', depth);
