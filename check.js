const fs = require('fs');
const content = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

let depth = 0;
for(let i=0; i<content.length; i++) {
    if(content.substr(i, 4) === '<div') depth++;
    else if(content.substr(i, 5) === '</div') depth--;
}
console.log('Final depth:', depth);
