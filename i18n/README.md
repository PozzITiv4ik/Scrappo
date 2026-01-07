Translations live in language folders. Edit JSON directly and keep keys in sync.

Structure:
- i18n/en/ui.json
- i18n/en/characters.json
- i18n/en/weapons.json
- i18n/en/abilities.json
- i18n/ru/ui.json
- i18n/ru/characters.json
- i18n/ru/weapons.json
- i18n/ru/abilities.json

Runtime entry:
- js/data/i18n.js

How to add new keys:
1) Add the key to both languages in the same domain file.
2) Keep the key list identical between en/ru.
3) For weapons/abilities, each entry must have name + description.
