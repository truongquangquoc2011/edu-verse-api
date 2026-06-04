const fs = require('fs');
const path = require('path');

const root = process.cwd();
const exts = ['.ts', '.tsx', '.js'];
const excludeDirs = new Set(['node_modules','dist','.git','coverage','build','out']);
const aliases = ['src/', 'emails/'];

function walk(dir, cb) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (excludeDirs.has(e.name)) continue;
      walk(p, cb);
    } else if (e.isFile() && exts.includes(path.extname(e.name))) {
      cb(p);
    }
  }
}

function replaceInFile(filePath) {
  let text = fs.readFileSync(filePath, 'utf8');
  const original = text;
  // handle ES imports
  text = text.replace(/(from\s+['"])(src\/[^'"\n]+)(['"])/g, (m,prefix,target,suf)=>{
    for(const a of aliases){ if(target.startsWith(a)){ const t = target.slice(a.length); const targetAbs = path.join(root, a.replace(/\/$/, ''), t); let rel = path.relative(path.dirname(filePath), targetAbs); if(!rel.startsWith('.')) rel = './'+rel; rel = rel.replace(/\\/g, '/'); return prefix+rel+suf; }} return m;
  });
  // handle double quoted stray
  text = text.replace(/(from\s+['"])(emails\/[^'"\n]+)(['"])/g, (m,prefix,target,suf)=>{
    for(const a of aliases){ if(target.startsWith(a)){ const t = target.slice(a.length); const targetAbs = path.join(root, a.replace(/\/$/, ''), t); let rel = path.relative(path.dirname(filePath), targetAbs); if(!rel.startsWith('.')) rel = './'+rel; rel = rel.replace(/\\/g, '/'); return prefix+rel+suf; }} return m;
  });
  // handle require()
  text = text.replace(/(require\(\s*['"])(src\/[^'"\n]+)(['"]\s*\))/g, (m,prefix,target,suf)=>{
    for(const a of aliases){ if(target.startsWith(a)){ const t = target.slice(a.length); const targetAbs = path.join(root, a.replace(/\/$/, ''), t); let rel = path.relative(path.dirname(filePath), targetAbs); if(!rel.startsWith('.')) rel = './'+rel; rel = rel.replace(/\\/g, '/'); return prefix+rel+suf; }} return m;
  });

  if(text !== original){
    // backup
    const bak = filePath + '.bak';
    fs.writeFileSync(bak, original, 'utf8');
    fs.writeFileSync(filePath, text, 'utf8');
    return { file: path.relative(root, filePath), bak };
  }
  return null;
}

const changed = [];
walk(root, (file)=>{
  // skip our script
  if(path.relative(root,file) === 'fix-imports.js') return;
  try{
    const res = replaceInFile(file);
    if(res) changed.push(res);
  }catch(e){ console.error('ERR', file, e.message); }
});

console.log('Changed files:', changed.length);
for(const c of changed) console.log(c.file);

// produce simple diffs
function simpleDiff(a,b){
  const la = a.split('\n');
  const lb = b.split('\n');
  const max = Math.max(la.length, lb.length);
  const lines = [];
  for(let i=0;i<max;i++){
    const aa = la[i] ?? '';
    const bb = lb[i] ?? '';
    if(aa===bb) lines.push('  '+aa);
    else{ if(aa!=='') lines.push('- '+aa); if(bb!=='') lines.push('+ '+bb); }
  }
  return lines.join('\n');
}

for(const c of changed){
  const f = path.join(root, c.file);
  const bak = c.bak;
  const orig = fs.readFileSync(bak,'utf8');
  const now = fs.readFileSync(f,'utf8');
  console.log('\n--- DIFF', c.file, '---');
  console.log(simpleDiff(orig, now));
}

// write a JSON summary
fs.writeFileSync(path.join(root,'fix-imports-summary.json'), JSON.stringify({changed}, null, 2), 'utf8');

process.exit(0);
