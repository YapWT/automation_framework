/**
 * @generated-by AutomationApp
 * @metadata eyJuYW1lIjoiZmluZF9kaWZmZXJlbnQiLCJjb25maWciOnsiZXhjZWxQYXRoIjoiIiwidXNlRXhjZWwiOmZhbHNlLCJoZWFkbGVzcyI6ZmFsc2V9LCJzdGVwcyI6W10sInZlcnNpb24iOiIxLjAifQ==
 */

import path from 'path';

const logTask = (status, id, msg) => console.log(`TASK:${status}:${id}:${msg || ''}`);

async function run() {
  let browser = null;
  try {
    try {

      logTask('DONE', 'FINISH', 'Complete');
    } catch(e: any) { logTask('FAIL', 'EXECUTION', e.message); }
  } catch (e: any) {
    logTask('FAIL', 'EXECUTION', e.message);
  } finally {
  }
}

run().catch(err => console.log("TASK:FAIL:FATAL:" + err.message));