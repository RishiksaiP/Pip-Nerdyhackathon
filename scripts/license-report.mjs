import fs from 'node:fs';
import path from 'node:path';
const lock=JSON.parse(fs.readFileSync('package-lock.json','utf8'));
const rows=Object.entries(lock.packages).filter(([name])=>name).map(([name,value])=>({package:name.replace(/^node_modules\//,''),version:value.version,license:value.license??'See package license file',developmentOnly:!!value.dev,optional:!!value.optional}));
fs.mkdirSync('docs',{recursive:true});fs.writeFileSync('docs/DEPENDENCY_LICENSES.json',JSON.stringify(rows,null,2));
const manifest=JSON.parse(fs.readFileSync('package.json'));let notices='# Pip third-party package notices\n\n';for(const name of Object.keys(manifest.dependencies)){const dir=path.join('node_modules',name);if(!fs.existsSync(dir))continue;const filenames=fs.readdirSync(dir).filter(f=>/^(LICENSE|COPYING)(\.|$)/i.test(f));for(const filename of filenames){notices+=`\n\n## ${name}\n\n`+fs.readFileSync(path.join(dir,filename),'utf8');}}
fs.mkdirSync('public/licenses',{recursive:true});fs.writeFileSync('public/licenses/THIRD_PARTY_NOTICES.txt',notices);console.log(`Disclosed ${rows.length} dependency records.`);
