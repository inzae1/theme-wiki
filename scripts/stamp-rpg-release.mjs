import fs from 'node:fs';
const build=process.env.RPG_RELEASE_ID||`${process.env.GITHUB_SHA||'local'}-${process.env.GITHUB_RUN_ID||Date.now()}-${process.env.GITHUB_RUN_ATTEMPT||1}`;
if(!/^[a-zA-Z0-9._-]{1,100}$/.test(build))throw Error('Invalid release id');
for(const file of ['rpg.html','rpg-skill-lab.html']){
 const path='dist/'+file;
 let html=fs.readFileSync(path,'utf8');
 html=html.replace(/((?:src|href)="rpg[^"?]*\.(?:js|css))(?:\?[^" ]*)?"/g,`$1?v=${build}"`);
 fs.writeFileSync(path,html);
}
const updater='dist/rpg-update.js';
fs.writeFileSync(updater,fs.readFileSync(updater,'utf8').replace(/const build='[^']*';/,`const build='${build}';`));
fs.writeFileSync('dist/rpg-release.json',JSON.stringify({build})+'\n');
console.log('Stamped release '+build);
