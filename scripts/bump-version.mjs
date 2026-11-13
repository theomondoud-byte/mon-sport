#!/usr/bin/env node
// Aligne la version de tous les fichiers de la PWA sur une seule valeur.
// Usage : node scripts/bump-version.mjs 16.1.0
// Met à jour : version.js, package.json, index.html, sw.js (cache + précache)
// et tous les imports locaux « ./fichier.js?v=… » des modules de l'application.
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const version=process.argv[2];
if(!/^\d+\.\d+\.\d+$/.test(version||'')){
 console.error('Version attendue au format X.Y.Z, par exemple : node scripts/bump-version.mjs 16.1.0');
 process.exit(1);
}
const [major,minor]=version.split('.');
const label=`V${major}.${minor}`;

async function rewrite(file,transform){
 const path=join(root,file);
 const before=await readFile(path,'utf8');
 const after=transform(before);
 if(after!==before){await writeFile(path,after);console.log('✔',file);}
}
const localRefs=text=>text.replace(/(\.\/[\w./-]+\.(?:js|css))\?v=\d+\.\d+\.\d+/g,`$1?v=${version}`);

const modules=(await readdir(root)).filter(f=>f.endsWith('.js')&&f!=='sw.js');
for(const file of [...modules,'data/jeu-set-et-maths-bundle.js'])await rewrite(file,localRefs);
await rewrite('index.html',text=>localRefs(text).replace(/· V\d+\.\d+<\/title>/,`· ${label}</title>`));
await rewrite('sw.js',text=>localRefs(text)
 .replace(/const CACHE = 'mon-sport-v[\d-]+';/,`const CACHE = 'mon-sport-v${major}-${minor}';`)
 .replace(/^\/\/ V\d+\.\d+ :/m,`// ${label} :`));
await rewrite('version.js',text=>text.replace(/APP_VERSION='[\d.]+'/,`APP_VERSION='${version}'`));
await rewrite('package.json',text=>text.replace(/"version": "[\d.]+"/,`"version": "${version}"`));
console.log(`Version ${version} appliquée. Lancer « npm test » pour vérifier la cohérence.`);
