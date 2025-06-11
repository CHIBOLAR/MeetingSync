import { v4 as uuidv4 } from 'uuid';

// Generate a proper app ID
const appId = uuidv4();
console.log(`Generated App ID: ${appId}`);
console.log(`Use in manifest: ari:cloud:ecosystem::app/${appId}`);
