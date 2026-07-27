import fs from 'fs';
let content = fs.readFileSync('src/components/RegistrationStepper.tsx', 'utf8');

content = content.replace(
  "className={`mt-3 text-center transition-all duration-300 ${index === steps.length - 1 ? 'absolute top-10 w-32 -ml-11' : 'absolute top-10 w-32'}`}",
  "className={`mt-3 text-center transition-all duration-300 absolute top-10 left-1/2 -translate-x-1/2 w-32 flex flex-col items-center`}"
);

fs.writeFileSync('src/components/RegistrationStepper.tsx', content);
