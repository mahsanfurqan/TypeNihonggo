import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vocabularyRoot = path.join(projectRoot, 'src', 'data', 'vocabulary');
const catalogRoot = path.join(vocabularyRoot, 'catalog');
const localeRoot = path.join(vocabularyRoot, 'locales');

function parseArgs(argv) {
  const args = {
    from: 'en',
    force: false,
  };
  const positional = [];

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === '--force') {
      args.force = true;
      continue;
    }

    if (value.startsWith('--')) {
      const key = value.slice(2);
      const nextValue = argv[index + 1];

      if (!nextValue || nextValue.startsWith('--')) {
        throw new Error(`Missing value for --${key}`);
      }

      args[key] = nextValue;
      index += 1;
      continue;
    }

    positional.push(value);
  }

  if (!args.locale && positional[0]) {
    args.locale = positional[0];
  }

  if (args.from === 'en' && positional[1]) {
    args.from = positional[1];
  }

  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readJsonDirectory(directoryPath) {
  return fs
    .readdirSync(directoryPath)
    .filter((fileName) => fileName.endsWith('.json'))
    .sort()
    .map((fileName) => readJson(path.join(directoryPath, fileName)));
}

function validateLocaleCode(locale) {
  if (!/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(locale)) {
    throw new Error(
      `Invalid locale "${locale}". Use a short locale code such as fr, es, or pt-BR.`,
    );
  }
}

function getVocabularyIds() {
  return readJsonDirectory(catalogRoot)
    .flatMap((catalog) => catalog.entries ?? [])
    .map((entry) => entry.id)
    .filter(Boolean)
    .sort();
}

function loadLocale(locale) {
  const localePath = path.join(localeRoot, `${locale}.json`);

  if (!fs.existsSync(localePath)) {
    throw new Error(`Template locale was not found: ${localePath}`);
  }

  return readJson(localePath);
}

function createLocaleTranslations(vocabularyIds, templateTranslations) {
  return Object.fromEntries(
    vocabularyIds.map((vocabularyId) => [vocabularyId, templateTranslations[vocabularyId] ?? '']),
  );
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.locale) {
    throw new Error('Usage: npm run locale:create -- fr en');
  }

  validateLocaleCode(args.locale);
  validateLocaleCode(args.from);

  const targetPath = path.join(localeRoot, `${args.locale}.json`);

  if (fs.existsSync(targetPath) && !args.force) {
    throw new Error(`Locale already exists: ${targetPath}. Re-run with --force to overwrite it.`);
  }

  const templateLocale = loadLocale(args.from);
  const vocabularyIds = getVocabularyIds();
  const translations = createLocaleTranslations(vocabularyIds, templateLocale.translations ?? {});
  const localeData = {
    locale: args.locale,
    translations,
  };

  fs.writeFileSync(targetPath, `${JSON.stringify(localeData, null, 2)}\n`);

  const copied = Object.values(translations).filter((translation) => translation.trim().length > 0)
    .length;
  const empty = vocabularyIds.length - copied;

  console.log(
    `Created locale ${args.locale} from ${args.from}: ${copied}/${vocabularyIds.length} copied, ${empty} empty.`,
  );
  console.log(targetPath);
}

main();
