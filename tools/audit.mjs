import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { root } from './build.mjs';

export async function audit(directory = root) {
  const issues = [];
  async function visit(folder) {
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      if (entry.name === '.git' || entry.name === 'node_modules') continue;
      const full = path.join(folder, entry.name);
      const relative = path.relative(directory, full);
      if (entry.isDirectory()) { await visit(full); continue; }
      if (/\.(p12|pfx|pem|key|har|log)$/i.test(entry.name) || entry.name === '.env') issues.push(`Private file: ${relative}`);
      if (!/\.(js|mjs|json|md|module|conf)$/.test(entry.name)) continue;
      const source = await readFile(full, 'utf8');
      if (/^\s*ca-p12\s*=\s*\S+/m.test(source)) issues.push(`Certificate in ${relative}`);
      if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(source)) issues.push(`Private key in ${relative}`);
      if (/\b(?:ghp|gho|github_pat)_[A-Za-z0-9_]{20,}/.test(source)) issues.push(`GitHub credential in ${relative}`);
      if (relative.startsWith(`scripts${path.sep}`)) {
        if (/\$(?:httpClient|task)\b|\bfetch\s*\((?!\?)|\bXMLHttpRequest\b/.test(source)) issues.push(`Unexpected outbound client in ${relative}`);
        if (/raw\.githubusercontent\.com|workers\.dev|postimg\.cc|i\.ibb\.co|uplocket\.io\.vn/.test(source)) issues.push(`Third-party runtime asset/script in ${relative}`);
      }
      if (entry.name === 'LocketZim.module') {
        for (const match of source.matchAll(/script-path=([^,\s]+)/g)) {
          if (!/^https:\/\/raw\.githubusercontent\.com\/zim1st\/locketzim\/[^/]+\/scripts\/[a-z0-9-]+\.js$/.test(match[1])) issues.push(`Unexpected runtime script URL: ${match[1]}`);
        }
      }
    }
  }
  await visit(directory);
  if (issues.length) throw new Error(issues.join('\n'));
  return 'Audit passed: no private certificates/tokens; active scripts use only this repository and the original service endpoints.';
}

if (process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname) console.log(await audit());
