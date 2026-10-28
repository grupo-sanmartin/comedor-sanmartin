// Usage: npm run hash-password -- "my-secret"
import { createHash } from 'node:crypto';

const password = process.argv[2];
if (!password) {
  console.error('Usage: npm run hash-password -- "my-secret"');
  process.exit(1);
}
const hash = createHash('sha256').update(password).digest('hex');
console.log(`VITE_ADMIN_PASSWORD_HASH=${hash}`);
