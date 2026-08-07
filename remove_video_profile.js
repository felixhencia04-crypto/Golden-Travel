import fs from 'fs';
let code = fs.readFileSync('src/pages/Home.tsx', 'utf8');

code = code.replace("import VideoProfileShowcase from '../components/VideoProfileShowcase';\n", "");

const regex = /\s*\{\/\* Video Profile & Special Documentary Section \*\/\}\s*<VideoProfileShowcase \/>\n/g;
code = code.replace(regex, "");

fs.writeFileSync('src/pages/Home.tsx', code);
console.log("Success removed video profile");
