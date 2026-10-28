const fs = require('fs');
const path = require('path');

const OWNER = 'Owner: to be confirmed (Tech Arch 4).';

function readme(folder, title, lines) {
  const file = path.join(folder, 'README.md');
  if (fs.existsSync(file)) {
    console.log('skipped (already exists)', file);
    return;
  }
  fs.mkdirSync(folder, { recursive: true });
  const text = ['# ' + title, '', ...lines, '', OWNER, ''].join('\n');
  fs.writeFileSync(file, text);
  console.log('created', file);
}

readme('src/components', 'components', [
  'Shared screen pieces used in many places, such as the offline banner, empty state, inline error box, loading indicator, confirm sheet and toast.',
]);

readme('src/features', 'features', [
  'Code for each app feature, for example sign-in, onboarding, sources, tags and transactions.',
  'Exact structure: to confirm in Tech Arch 4.',
]);

readme('src/data', 'data', [
  'Code that reads and writes data in the Supabase backend.',
  'Exact structure: to confirm in Tech Arch 4.',
]);

readme('src/lib', 'lib', [
  'Shared helper code, for example the session and routing helpers.',
]);

readme('src/i18n', 'i18n', [
  'The shared text file, en.json. All words the user sees must come from this file, never typed directly into screens (PRD G-UI-10).',
]);

readme('src/theme', 'theme', [
  'Colours, fonts and spacing for light and dark mode. Brand colours: teal #0F6E56 and gold #854F0B (PRD G-UI-02).',
]);

readme('supabase', 'supabase', [
  'Database scripts: tables, row-level security, the balance trigger, default tags and the delete-account function (BRD 19.3).',
]);

readme('plugins', 'plugins', [
  'Custom Expo plugins, if the project needs any.',
  'Purpose: to confirm in Tech Arch 4.',
]);

readme('.github', '.github', [
  'GitHub settings for the repository, such as pull request templates and automatic checks.',
  'Purpose: to confirm in Tech Arch 4.',
]);

readme('docs', 'docs', [
  'Project documents: setup guide, handover guide and notes (BRD 19.3).',
]);

const en = 'src/i18n/en.json';
if (!fs.existsSync(en)) {
  fs.writeFileSync(en, '{}\n');
  console.log('created', en);
}

console.log('DONE');