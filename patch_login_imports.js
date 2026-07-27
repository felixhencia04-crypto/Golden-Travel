import { readFileSync, writeFileSync } from 'fs';
let content = readFileSync('src/pages/LoginAdmin.tsx', 'utf8');
content = content.replace(/import \{ auth \} from '\.\.\/lib\/firebase';\n/, '');
content = content.replace(/import \{ signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider \} from 'firebase\/auth';\n/, '');
writeFileSync('src/pages/LoginAdmin.tsx', content);
