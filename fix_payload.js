import fs from 'fs';
let code = fs.readFileSync('src/components/admin/CMSManager.tsx', 'utf8');

const regexPayload = /const payload = \{\s*\.\.\.formData,\s*price: Number\(formData\.price\),\s*description: formData\.description\.split\('\\n'\)\.filter\(\(d: string\) => d\.trim\(\) !== ''\)\s*\};/;

const newPayload = `const payload = {
        ...formData,
        price: Number(formData.price),
        description: formData.description.split('\\n').filter((d: string) => d.trim() !== ''),
        excludes: formData.excludes.split('\\n').filter((d: string) => d.trim() !== ''),
      };`;

if(regexPayload.test(code)) {
  code = code.replace(regexPayload, newPayload);
  fs.writeFileSync('src/components/admin/CMSManager.tsx', code);
  console.log("Success payload patched");
} else {
  console.log("Regex payload not found");
}
