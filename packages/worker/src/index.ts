import { createTdClient } from './td.js';
import { runIngestion } from './ingest.js';

async function main() {
  const td = createTdClient();
  await runIngestion(td);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
