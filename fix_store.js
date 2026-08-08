import fs from 'fs';
let content = fs.readFileSync('src/store.tsx', 'utf-8');

const safeStorage = `
const safeGetItem = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
};
const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {}
};
`;

content = content.replace(/import \{ umrohPackages, hajjPackages \} from '\.\/data\/homeData';/, "import { umrohPackages, hajjPackages } from './data/homeData';\n" + safeStorage);

content = content.replace(/localStorage\.getItem/g, 'safeGetItem');
content = content.replace(/localStorage\.setItem/g, 'safeSetItem');

fs.writeFileSync('src/store.tsx', content);
