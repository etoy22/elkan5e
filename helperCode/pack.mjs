import { compilePack, extractPack } from '@foundryvtt/foundryvtt-cli';
import fs from 'fs';

let packs = [
    'elkan5e-ancestries', 
    'elkan5e-backgrounds', 
    'elkan5e-class', 
    'elkan5e-class-features', 
    'elkan5e-creature-features', 
    'elkan5e-equipment', 
    'elkan5e-feats', 
    'elkan5e-lore', 
    'elkan5e-macros', 
    'elkan5e-magic-items', 
    'elkan5e-roll-tables', 
    'elkan5e-rules', 
    'elkan5e-spells', 
    'elkan5e-subclass'
];
let actorPacks = ['elkan5e-creatures','elkan5e-summoned-creatures'];

for (let i of packs) {
  let path = './src/packs/' + i;
  if (fs.existsSync(path)) {
    await compilePack(path, './packs/' + i, { log: true });
  } else {
    console.warn(`Directory ${path} does not exist.`);
  }
}

for (let i of actorPacks) {
  let path = './src/packs/' + i;
  if (fs.existsSync(path)) {
    await compilePack(path, './packs/' + i, { log: true });
  } else {
    console.warn(`Directory ${path} does not exist.`);
  }
}