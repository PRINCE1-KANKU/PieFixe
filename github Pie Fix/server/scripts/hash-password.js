// Usage: npm run hash-password -- "your-chosen-passphrase"
// Prints a bcrypt hash to paste into .env as ADMIN_PASSPHRASE_HASH.
const bcrypt = require('bcryptjs');

const passphrase = process.argv[2];

if (!passphrase) {
  console.error('Usage: npm run hash-password -- "your-chosen-passphrase"');
  process.exit(1);
}

const hash = bcrypt.hashSync(passphrase, 12);
console.log('\nAdd this line to server/.env:\n');
console.log(`ADMIN_PASSPHRASE_HASH=${hash}\n`);
