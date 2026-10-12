import {loadCases,allCompositions} from './lib/factory.mjs';
const rows=process.argv.includes('--all')?allCompositions():loadCases();
console.table(rows.map(c=>({ID:c.id,key:c.key,subject:c.subject,stage:c.stage,seconds:Number(c.seconds.toFixed(2)),title:c.title||c.status})));
