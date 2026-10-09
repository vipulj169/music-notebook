(function(){
const SHARP=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const FLAT =['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
const NI={C:0,'B#':0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,Fb:4,F:5,'E#':5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11,Cb:11};
const ROMAN=['I','♭II','II','♭III','III','IV','♯IV','V','♭VI','VI','♭VII','VII'];
const SECTIONS=[['prelude','Prelude'],['mukhda','Mukhda'],['antara','Antara'],['interlude','Interlude'],['outro','Outro'],['other','Other']];
const SECNAME=Object.fromEntries(SECTIONS);
const STORE='musicNotebook.v1';
const uid=()=>Math.random().toString(36).slice(2,10);

// ---------- music helpers ----------
const mod=n=>((n%12)+12)%12;
function parseChord(s){const m=/^([A-G])([#b]?)([^/]*)(?:\/([A-G])([#b]?))?$/.exec(s.trim());if(!m)return null;
  return{root:NI[m[1]+m[2]],q:m[3],bass:m[4]!=null?NI[m[4]+m[5]]:null};}
function useFlats(root,minor){const r=minor?mod(root+3):root;return [5,10,3,8,1,6].includes(r);}
function nameOf(i,flats){return (flats?FLAT:SHARP)[mod(i)];}
function transposeChord(s,n,flats){const c=parseChord(s);if(!c)return s;
  return nameOf(c.root+n,flats)+c.q+(c.bass!=null?'/'+nameOf(c.bass+n,flats):'');}
function roman(s,tonic){const c=parseChord(s);if(!c)return '';
  let r=ROMAN[mod(c.root-tonic)],q=c.q;
  const dim=/^(dim|°)/.test(q), min=/^m(?!aj)/.test(q);
  if(dim){r=r.toLowerCase();q=q.replace(/^(dim|°)/,'°');}
  else if(min){r=r.toLowerCase();q=q.slice(1);}
  return r+q+(c.bass!=null?'/'+ROMAN[mod(c.bass-tonic)]:'');}
function palette(tonic,minor){
  const d=minor?[[0,'m'],[2,'dim'],[3,''],[5,'m'],[7,'m'],[7,''],[8,''],[10,'']]
               :[[0,''],[2,'m'],[4,'m'],[5,''],[7,''],[9,'m'],[7,'7'],[2,'7']];
  const b=minor?[[5,''],[1,''],[0,''],[11,'dim']]:[[8,''],[10,''],[5,'m'],[4,'']];
  const f=useFlats(tonic,minor);
  return d.map(x=>({c:nameOf(tonic+x[0],f)+x[1],b:false})).concat(b.map(x=>({c:nameOf(tonic+x[0],f)+x[1],b:true})));}
function guessSection(label){const l=(label||'').toLowerCase();
  if(/mukh|chorus|hook/.test(l))return'mukhda'; if(/antar|verse/.test(l))return'antara';
  if(/inter|break|solo|bridge/.test(l))return'interlude'; if(/prel|intro/.test(l))return'prelude';
  if(/outro|end|coda/.test(l))return'outro'; return'other';}

// ---------- data ----------
function wordsFrom(text){return text.split(/\n/).map(l=>l.trim().split(/\s+/).filter(Boolean).map(t=>({t,c:''})));}
function lyricBlock(text,section,label){return{id:uid(),kind:'lyr',section:section||'other',label:label||'',time:'',lines:wordsFrom(text)};}
function instBlock(section,bars){return{id:uid(),kind:'inst',section:section||'interlude',label:'',time:'',bars:bars||''};}
function exampleSong(){
  const L=(text,chords,section,label,time)=>{const b=lyricBlock(text,section,label);b.time=time;
    chords.forEach(([li,wi,c])=>{b.lines[li][wi].c=c;});return b;};
  const m=L("Khidki pe boondein gaati hain\nBhooli si yaadein aati hain",[[0,0,'F'],[0,2,'Dm'],[1,0,'Bb'],[1,3,'C']],'mukhda','','0:14');
  const m2=JSON.parse(JSON.stringify(m));m2.id=uid();m2.label='repeat';m2.time='0:28';
  const m3=JSON.parse(JSON.stringify(m));m3.id=uid();m3.time='1:20';
  const p=instBlock('prelude','F | Dm | Bb | C');p.time='0:00';
  const i=instBlock('interlude','Bb | C | F | F');i.time='0:42';
  const a=L("Bheegi si raahon pe chalte rahe\nChupke se sapne palte rahe\nKoi to bataaye kahaan jaana hai",
    [[0,0,'F'],[0,3,'Bb'],[1,0,'C'],[1,3,'F'],[2,0,'Ab'],[2,3,'Bb'],[2,5,'C']],'antara','1','0:56');
  return{id:uid(),title:'Example song',example:true,key:{root:5,minor:false},transpose:0,blocks:[p,m,m2,i,a,m3]};}

let state={songs:[],current:null,view:'name'};
let songFilter='';
try{const s=JSON.parse(localStorage.getItem(STORE)||'null');if(s&&Array.isArray(s.songs)&&s.songs.length)state=Object.assign(state,s);}catch(e){}
if(!state.songs.length){const e=exampleSong();state.songs=[e];state.current=e.id;}
if(!state.songs.find(s=>s.id===state.current))state.current=state.songs[0].id;

// Track state before changes for undo
let pendingSnapshot=JSON.parse(JSON.stringify(state));

function pushUndo(){
  if(pendingSnapshot){
    undoStack.push(pendingSnapshot);
    if(undoStack.length>maxHistory)undoStack.shift();
    redoStack=[];
  }
}
function save(){
  pushUndo();
  pendingSnapshot=JSON.parse(JSON.stringify(state));
  try{localStorage.setItem(STORE,JSON.stringify(state));}catch(e){}
}
function undo(){
  if(undoStack.length===0)return;
  redoStack.push(JSON.parse(JSON.stringify(state)));
  state=undoStack.pop();
  pendingSnapshot=JSON.parse(JSON.stringify(state));
  try{localStorage.setItem(STORE,JSON.stringify(state));}catch(e){}
  render();
  toast('Undone');
}
function redo(){
  if(redoStack.length===0)return;
  undoStack.push(JSON.parse(JSON.stringify(state)));
  state=redoStack.pop();
  pendingSnapshot=JSON.parse(JSON.stringify(state));
  try{localStorage.setItem(STORE,JSON.stringify(state));}catch(e){}
  render();
  toast('Redone');
}
const song=()=>state.songs.find(s=>s.id===state.current);
const playTonic=()=>mod(song().key.root+song().transpose);
const playFlats=()=>useFlats(playTonic(),song().key.minor);
const shown=c=>transposeChord(c,song().transpose,playFlats());

// ---------- render ----------
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function chordHTML(c){if(!c)return'';const d=shown(c),rn=roman(d,playTonic());
  if(state.view==='roman')return esc(rn||d);
  if(state.view==='both')return esc(d)+(rn?'<span class="rn">'+esc(rn)+'</span>':'');
  return esc(d);}
function barsHTML(bars){if(!bars.trim())return'<span class="hint">No chords yet. Click Edit to add them.</span>';
  return bars.split(/\s+/).filter(Boolean).map(t=>{if(t==='|')return'<span class="bar">|</span>';
    if(!parseChord(t))return'<span class="bar">'+esc(t)+'</span>';
    const d=shown(t),rn=roman(d,playTonic());
    if(state.view==='roman')return'<span class="cell">'+esc(rn)+'</span>';
    return'<span class="cell">'+esc(d)+(state.view==='both'?'<span class="rn">'+esc(rn)+'</span>':'')+'</span>';}).join('');}
function render(){
  const s=song();
  const filtered=songFilter?state.songs.filter(x=>(x.title||'').toLowerCase().includes(songFilter.toLowerCase())):state.songs;
  $('songSel').innerHTML=filtered.map(x=>'<option value="'+x.id+'"'+(x.id===s.id?' selected':'')+'>'+esc(x.title||'Untitled')+'</option>').join('');
  $('title').value=s.title; $('exampleNote').hidden=!s.example;
  $('keyRoot').innerHTML=FLAT.map((n,i)=>'<option value="'+i+'"'+(i===s.key.root?' selected':'')+'>'+(SHARP[i]===n?n:n+' / '+SHARP[i])+'</option>').join('');
  $('keyQual').value=s.key.minor?'min':'maj';
  $('tVal').textContent=(s.transpose>0?'+':'')+s.transpose;
  $('keyShow').textContent=nameOf(playTonic(),playFlats())+(s.key.minor?'m':'');
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===state.view));
  // outline
  $('outline').innerHTML=s.blocks.map(b=>'<a class="chip" data-s="'+b.section+'" href="#b-'+b.id+'">'+esc(SECNAME[b.section]+(b.label?' '+b.label:''))+'</a>').join('');
  // blocks
  const root=$('blocks');
  if(!s.blocks.length){root.innerHTML='<div class="empty"><b>No sections yet</b><span>Paste the lyrics from a lyrics site. Each paragraph becomes a section you can label as mukhda, antara and so on.</span><button class="btn primary" data-act="paste">Paste lyrics</button></div>';return;}
  root.innerHTML=s.blocks.map((b,bi)=>{
    const head='<div class="bhead">'+
      '<select class="sec" data-f="section" aria-label="Section type">'+SECTIONS.map(([k,v])=>'<option value="'+k+'"'+(k===b.section?' selected':'')+'>'+v+'</option>').join('')+'</select>'+
      '<input type="text" class="lab" data-f="label" id="lab-'+b.id+'" placeholder="Label, e.g. 1 or repeat" value="'+esc(b.label)+'">'+
      '<input type="text" class="time" data-f="time" id="time-'+b.id+'" placeholder="0:00" title="Start time in your recording" value="'+esc(b.time||'')+'">'+
      '<div class="bactions">'+
        '<button class="btn icon" data-act="up" aria-label="Move up"'+(bi===0?' disabled':'')+'>↑</button>'+
        '<button class="btn icon" data-act="down" aria-label="Move down"'+(bi===s.blocks.length-1?' disabled':'')+'>↓</button>'+
        '<button class="btn" data-act="dup">Duplicate</button>'+
        '<button class="btn" data-act="edit">Edit</button>'+
        '<button class="btn danger" data-act="del">Delete</button></div></div>';
    let body;
    if(editing===b.id){
      const val=b.kind==='inst'?b.bars:b.lines.map(l=>l.map(w=>w.t).join(' ')).join('\n');
      body=(b.kind==='inst'
        ?'<input type="text" id="ed-'+b.id+'" class="mono" style="font-family:var(--f-chord)" value="'+esc(val)+'" placeholder="F | Dm | Bb | C">'
        :'<textarea id="ed-'+b.id+'" rows="'+Math.max(3,b.lines.length+1)+'">'+esc(val)+'</textarea><span class="hint">Chords stay on the same word positions. If you add or remove words, check them afterwards.</span>')+
        '<div class="addrow"><button class="btn primary" data-act="saveEdit">Save</button><button class="btn" data-act="cancelEdit">Cancel</button></div>';
    } else if(b.kind==='inst'){ body='<div class="bars">'+barsHTML(b.bars)+'</div>'; }
    else {
      body='<div class="lyrics">'+b.lines.map((l,li)=>'<div class="line">'+l.map((w,wi)=>
        '<button class="w'+(w.t?'':' slot')+(sel&&sel.b===b.id&&sel.l===li&&sel.w===wi?' sel':'')+'" data-l="'+li+'" data-w="'+wi+'" aria-label="'+esc((w.t||'chord slot')+(w.c?', chord '+shown(w.c):', add chord'))+'"><span class="ch">'+chordHTML(w.c)+'</span><span class="tx">'+esc(w.t||'·')+'</span></button>').join('')+
        '<span class="line-actions"><button class="btn icon line-btn" data-act="copyLine" data-b="'+b.id+'" data-l="'+li+'" title="Copy chords" aria-label="Copy line chords">📋</button>'+
        '<button class="btn icon line-btn" data-act="pasteLine" data-b="'+b.id+'" data-l="'+li+'" title="Paste chords" aria-label="Paste line chords"'+(clipboard.chords?'':' disabled')+'>📥</button></span>'+
        '</div>').join('')+'</div>';
    }
    if(confirmDel===b.id) body+='<div class="addrow"><span>Delete this section?</span><button class="btn danger" data-act="delYes">Delete</button><button class="btn" data-act="delNo">Keep</button></div>';
    return '<section class="block" id="b-'+b.id+'" data-id="'+b.id+'" data-s="'+b.section+'">'+head+body+'</section>';
  }).join('');
}
let editing=null,confirmDel=null,sel=null,confirmSong=false;
let clipboard={chords:null,wordCount:null,lineText:null};
let undoStack=[],redoStack=[],maxHistory=50;

// ---------- block events ----------
$('blocks').addEventListener('click',e=>{
  const s=song();const btn=e.target.closest('button');if(!btn)return;
  if(btn.dataset.act==='paste'){openPaste();return;}
  const el=btn.closest('.block');if(!el)return;const b=s.blocks.find(x=>x.id===el.dataset.id);const i=s.blocks.indexOf(b);
  if(btn.classList.contains('w')){openPop(b,+btn.dataset.l,+btn.dataset.w,btn);return;}
  const a=btn.dataset.act;
  if(a==='up'&&i>0){[s.blocks[i-1],s.blocks[i]]=[s.blocks[i],s.blocks[i-1]];}
  else if(a==='down'&&i<s.blocks.length-1){[s.blocks[i+1],s.blocks[i]]=[s.blocks[i],s.blocks[i+1]];}
  else if(a==='dup'){const c=JSON.parse(JSON.stringify(b));c.id=uid();c.label=b.label?b.label+' repeat':'repeat';c.time='';s.blocks.splice(i+1,0,c);}
  else if(a==='edit'){editing=b.id;render();const t=$('ed-'+b.id);t&&t.focus();return;}
  else if(a==='cancelEdit'){editing=null;}
  else if(a==='saveEdit'){const v=$('ed-'+b.id).value;
    if(b.kind==='inst')b.bars=v.replace(/\s*\|\s*/g,' | ').trim();
    else{const old=b.lines;b.lines=wordsFrom(v);b.lines.forEach((l,li)=>l.forEach((w,wi)=>{if(old[li]&&old[li][wi])w.c=old[li][wi].c;}));}
    editing=null;}
  else if(a==='del'){confirmDel=b.id;}
  else if(a==='delNo'){confirmDel=null;}
  else if(a==='delYes'){s.blocks.splice(i,1);confirmDel=null;}
  else if(a==='copyLine'){
    const blockId=btn.dataset.b;const lineIdx=+btn.dataset.l;
    const block=s.blocks.find(x=>x.id===blockId);
    if(block&&block.kind==='lyr'&&block.lines[lineIdx]){
      copyLineChordsByIndex(block,lineIdx);
    }
    return;
  }
  else if(a==='pasteLine'){
    const blockId=btn.dataset.b;const lineIdx=+btn.dataset.l;
    const block=s.blocks.find(x=>x.id===blockId);
    if(block&&block.kind==='lyr'&&block.lines[lineIdx]){
      pasteLineChordsByIndex(block,lineIdx);
    }
    return;
  }
  else return;
  s.example=false;save();render();
});
$('blocks').addEventListener('change',e=>{const f=e.target.dataset.f;if(!f)return;
  const b=song().blocks.find(x=>x.id===e.target.closest('.block').dataset.id);b[f]=e.target.value;save();render();});

// ---------- chord popover ----------
let pop=null;
function closePop(){if(pop){pop.remove();pop=null;}if(sel){sel=null;render();}}
function openPop(b,li,wi,anchor){
  closePop();sel={b:b.id,l:li,w:wi};render();
  const s=song(),w=b.lines[li][wi];
  const tonic=playTonic(),pal=palette(tonic,s.key.minor);
  pop=document.createElement('div');pop.className='pop';pop.setAttribute('role','dialog');pop.setAttribute('aria-label','Set chord');
  pop.innerHTML='<div class="poprow"><b>'+esc(w.t||'Chord slot')+'</b><span class="hint">Key of '+esc($('keyShow').textContent)+'</span></div>'+
    '<input type="text" id="chordIn" placeholder="e.g. F, Dm7, Bb/D" value="'+esc(w.c?shown(w.c):'')+'" autocomplete="off" spellcheck="false">'+
    '<div class="pal">'+pal.map(p=>'<button class="'+(p.b?'borrow':'')+'" data-c="'+esc(p.c)+'" title="'+(p.b?'Borrowed from outside the key':'In the key')+'"><b>'+esc(p.c)+'</b><small>'+esc(roman(p.c,tonic))+'</small></button>').join('')+'</div>'+
    '<span class="hint">Solid: in the key. Dashed: common borrowed chords.</span>'+
    '<div class="poprow"><button class="btn danger" data-p="clear">Remove chord</button><span style="display:flex;gap:6px"><button class="btn" data-p="slot">Add slot after</button><button class="btn primary" data-p="ok">Done</button></span></div>';
  document.body.appendChild(pop);
  const r=anchor.getBoundingClientRect(),pw=pop.offsetWidth;
  let left=r.left+window.scrollX;left=Math.max(16,Math.min(left,document.documentElement.clientWidth-pw-16));
  pop.style.left=left+'px';pop.style.top=(r.bottom+window.scrollY+6)+'px';
  const inp=pop.querySelector('#chordIn');inp.focus();inp.select();
  const commit=v=>{v=v.trim();
    if(v&&!parseChord(v)){inp.setCustomValidity('Use a chord name like F, Dm, Bb7 or C/E');inp.reportValidity();return false;}
    w.c=v?transposeChord(v,-s.transpose,useFlats(s.key.root,s.key.minor)):'';s.example=false;save();return true;};
  inp.addEventListener('input',()=>inp.setCustomValidity(''));
  inp.addEventListener('keydown',ev=>{if(ev.key==='Enter'){ev.preventDefault();if(commit(inp.value))closePop();}else if(ev.key==='Escape'){closePop();}});
  pop.addEventListener('click',ev=>{const t=ev.target.closest('button');if(!t)return;
    if(t.dataset.c){if(commit(t.dataset.c))closePop();}
    else if(t.dataset.p==='clear'){commit('');closePop();}
    else if(t.dataset.p==='ok'){if(commit(inp.value))closePop();}
    else if(t.dataset.p==='slot'){if(!commit(inp.value))return;b.lines[li].splice(wi+1,0,{t:'',c:''});save();closePop();}});
}
document.addEventListener('mousedown',e=>{if(pop&&!pop.contains(e.target)&&!e.target.closest('.w'))closePop();});

// ---------- copy/paste chords ----------
function mapChordsProportionally(sourceChords,sourceLen,targetLen){
  if(sourceLen===targetLen)return[...sourceChords];
  const result=new Array(targetLen).fill('');
  const chordPositions=[];
  sourceChords.forEach((chord,idx)=>{if(chord)chordPositions.push({idx,chord});});
  if(chordPositions.length===0)return result;
  chordPositions.forEach(({idx,chord})=>{
    const targetIdx=Math.round((idx/sourceLen)*targetLen);
    const clampedIdx=Math.min(targetIdx,targetLen-1);
    result[clampedIdx]=chord;
  });
  return result;
}
function copyLineChordsByIndex(block,lineIdx){
  const line=block.lines[lineIdx];
  if(!line)return;
  clipboard.chords=line.map(w=>w.c);
  clipboard.wordCount=line.length;
  clipboard.lineText=line.map(w=>w.t).filter(Boolean).slice(0,5).join(' ')+(line.length>5?'...':'');
  const chordCount=clipboard.chords.filter(c=>c).length;
  toast(`Copied ${chordCount} chord${chordCount!==1?'s':''} from "${clipboard.lineText}"`);
  song().example=false;save();render();
}
function pasteLineChordsByIndex(block,lineIdx){
  if(!clipboard.chords)return;
  const targetLine=block.lines[lineIdx];
  if(!targetLine)return;
  const sourceLen=clipboard.wordCount;
  const targetLen=targetLine.length;
  const mapped=mapChordsProportionally(clipboard.chords,sourceLen,targetLen);
  targetLine.forEach((word,idx)=>{if(idx<mapped.length)word.c=mapped[idx];});
  song().example=false;save();render();
  setTimeout(()=>{
    const s=song();
    targetLine.forEach((word,idx)=>{
      if(mapped[idx]){
        const el=document.querySelector(`.block[data-id="${block.id}"] .w[data-l="${lineIdx}"][data-w="${idx}"]`);
        if(el){el.classList.add('pasted');setTimeout(()=>el.classList.remove('pasted'),400);}
      }
    });
  },10);
  const chordCount=mapped.filter(c=>c).length;
  toast(`Pasted ${chordCount} chord${chordCount!==1?'s':''} to current line`);
}
function copyLineChords(){
  if(!sel)return;
  const s=song();
  const block=s.blocks.find(b=>b.id===sel.b);
  if(!block||block.kind!=='lyr')return;
  copyLineChordsByIndex(block,sel.l);
}
function pasteLineChords(){
  if(!sel||!clipboard.chords)return;
  const s=song();
  const block=s.blocks.find(b=>b.id===sel.b);
  if(!block||block.kind!=='lyr')return;
  pasteLineChordsByIndex(block,sel.l);
}

// ---------- toolbar ----------
$('songSearch').addEventListener('input',e=>{songFilter=e.target.value;render();});
$('title').addEventListener('input',e=>{song().title=e.target.value;song().example=false;save();
  const o=$('songSel').selectedOptions[0];if(o)o.textContent=e.target.value||'Untitled';});
$('keyRoot').addEventListener('change',e=>{song().key.root=+e.target.value;save();render();});
$('keyQual').addEventListener('change',e=>{song().key.minor=e.target.value==='min';save();render();});
$('tUp').onclick=()=>{song().transpose=Math.min(11,song().transpose+1);save();render();};
$('tDown').onclick=()=>{song().transpose=Math.max(-11,song().transpose-1);save();render();};
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{state.view=b.dataset.view;save();render();});
$('songSel').addEventListener('change',e=>{state.current=e.target.value;editing=confirmDel=null;resetSongDel();save();render();});
$('newSong').onclick=()=>{const n={id:uid(),title:'Untitled song',key:{root:0,minor:false},transpose:0,blocks:[]};
  state.songs.push(n);state.current=n.id;save();render();$('title').focus();$('title').select();};
function resetSongDel(){confirmSong=false;$('delSong').textContent='Delete song';}
$('delSong').onclick=()=>{
  if(!confirmSong){confirmSong=true;$('delSong').textContent='Click again to delete';setTimeout(resetSongDel,3000);return;}
  state.songs=state.songs.filter(x=>x.id!==state.current);
  if(!state.songs.length)state.songs=[exampleSong()];
  state.current=state.songs[0].id;resetSongDel();save();render();};
$('addInst').onclick=()=>{const b=instBlock('interlude','');song().blocks.push(b);editing=b.id;save();render();const t=$('ed-'+b.id);t&&t.focus();};
$('pasteBtn').onclick=openPaste;

// ---------- modals ----------
function modal(html){const m=document.createElement('div');m.className='modal';m.innerHTML='<div class="sheet" role="dialog" aria-modal="true">'+html+'</div>';
  document.body.appendChild(m);m.addEventListener('mousedown',e=>{if(e.target===m)m.remove();});
  m.addEventListener('keydown',e=>{if(e.key==='Escape')m.remove();});return m;}
function openPaste(){
  const m=modal('<h2>Paste lyrics</h2><p>Leave a blank line between sections. You can label each section afterwards. Lyrics in Hindi script or Roman script both work.</p>'+
    '<textarea id="pasteIn" placeholder="First section…\n\nSecond section…"></textarea>'+
    '<div class="row"><button class="btn" data-x="cancel">Cancel</button><button class="btn primary" data-x="add">Add sections</button></div>');
  const ta=m.querySelector('textarea');ta.focus();
  m.addEventListener('click',e=>{const x=e.target.dataset.x;if(x==='cancel')m.remove();
    if(x==='add'){const parts=ta.value.replace(/\r/g,'').split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean);
      const s=song();parts.forEach(p=>s.blocks.push(lyricBlock(p,'other','')));s.example=false;save();m.remove();render();
      if(parts.length)toast(parts.length+' section'+(parts.length>1?'s':'')+' added. Set each section type from its menu.');}});
}
function toChordPro(){const s=song(),f=useFlats(s.key.root,s.key.minor),out=['{title: '+s.title+'}','{key: '+nameOf(s.key.root,f)+(s.key.minor?'m':'')+'}',''];
  s.blocks.forEach(b=>{out.push('{comment: '+SECNAME[b.section]+(b.label?' '+b.label:'')+(b.time?' @ '+b.time:'')+'}');
    if(b.kind==='inst')out.push(b.bars.split(/\s+/).filter(Boolean).map(t=>parseChord(t)?'['+t+']':t).join(' '));
    else b.lines.forEach(l=>out.push(l.map(w=>(w.c?'['+w.c+']':'')+w.t).join(' ')));
    out.push('');});
  return out.join('\n');}
function fromChordPro(text){
  const song={id:uid(),title:'Imported song',key:{root:0,minor:false},transpose:0,blocks:[]};let cur=null;
  const close=()=>{if(cur&&cur.rows.length){
      const allChordOnly=cur.rows.every(r=>r.every(w=>!w.t));
      if(allChordOnly){const b=instBlock(cur.sec,cur.rows.map(r=>r.map(w=>w.c).join(' | ')).join(' | '));b.label=cur.label;b.time=cur.time;song.blocks.push(b);}
      else song.blocks.push({id:uid(),kind:'lyr',section:cur.sec,label:cur.label,time:cur.time,lines:cur.rows});}
    cur=null;};
  const start=(label)=>{close();let time='';const tm=/\s*@\s*(\d+:\d{2})\s*$/.exec(label||'');if(tm){time=tm[1];label=label.slice(0,tm.index);}
    const sec=guessSection(label);const rest=(label||'').replace(new RegExp('^\\s*'+(SECNAME[sec]||'')+'\\s*','i'),'');
    cur={sec,label:sec==='other'?(label||'').trim():rest.trim(),time,rows:[]};};
  text.replace(/\r/g,'').split('\n').forEach(raw=>{const line=raw.trim();
    let m;
    if((m=/^\{\s*(?:title|t)\s*:\s*(.*)\}$/i.exec(line))){song.title=m[1].trim();return;}
    if((m=/^\{\s*key\s*:\s*([A-G][#b]?)(m?)\s*\}$/i.exec(line))){song.key={root:NI[m[1]]??0,minor:!!m[2]};return;}
    if((m=/^\{\s*(?:comment|c|ci)\s*:\s*(.*)\}$/i.exec(line))){start(m[1]);return;}
    if((m=/^\{\s*(?:start_of_|so)(\w+?)(?:\s*:\s*(.*))?\}$/i.exec(line))){start(m[2]||m[1]);return;}
    if(/^\{\s*(?:end_of_|eo)\w+\s*\}$/i.test(line)){close();return;}
    if(/^\{.*\}$/.test(line))return;
    if(!line){close();return;}
    if(!cur)start('');
    const row=[];line.split(/\s+/).forEach(tok=>{
      if(tok==='|')return;
      const chords=[...tok.matchAll(/\[([^\]]+)\]/g)].map(x=>x[1]);const t=tok.replace(/\[[^\]]*\]/g,'');
      row.push({t,c:chords[0]||''});
      chords.slice(1).forEach(c=>row.push({t:'',c}));});
    cur.rows.push(row);});
  close();return song;}
$('exportBtn').onclick=()=>{
  const m=modal('<h2>Export as ChordPro</h2><p>ChordPro is plain text that apps like SongbookPro and OnSong can open. Chords are saved in the original key.</p>'+
    '<textarea class="mono" id="exportOut" readonly></textarea>'+
    '<div class="row"><button class="btn" data-x="close">Close</button><button class="btn primary" data-x="copy">Copy text</button></div>');
  const ta=m.querySelector('textarea');ta.value=toChordPro();
  m.addEventListener('click',e=>{const x=e.target.dataset.x;if(x==='close')m.remove();
    if(x==='copy'){const p=navigator.clipboard&&navigator.clipboard.writeText(ta.value);
      if(p)p.then(()=>toast('Copied')).catch(()=>{ta.focus();ta.select();toast('Text selected. Press Ctrl+C or ⌘C to copy.');});
      else{ta.focus();ta.select();toast('Text selected. Press Ctrl+C or ⌘C to copy.');}}});
};
$('importBtn').onclick=()=>{
  const m=modal('<h2>Import a ChordPro song</h2><p>Paste ChordPro text, like one exported from here. Chords go in brackets before a word, such as <code>[F]word</code>. It is added as a new song.</p>'+
    '<textarea class="mono" id="importIn" placeholder="{title: My song}\n{key: F}\n{comment: Mukhda}\n[F]Some [Dm]words here"></textarea>'+
    '<div class="row"><button class="btn" data-x="cancel">Cancel</button><button class="btn primary" data-x="go">Import</button></div>');
  const ta=m.querySelector('textarea');ta.focus();
  m.addEventListener('click',e=>{const x=e.target.dataset.x;if(x==='cancel')m.remove();
    if(x==='go'){if(!ta.value.trim()){toast('Paste some ChordPro text first.');return;}
      const n=fromChordPro(ta.value);state.songs.push(n);state.current=n.id;save();m.remove();render();toast('Imported "'+n.title+'"');}});
};

// ---------- backup/restore ----------
$('backupBtn').onclick=()=>{
  const backup={version:1,songs:state.songs,exportedAt:new Date().toISOString()};
  const json=JSON.stringify(backup,null,2);
  const m=modal('<h2>Backup all songs</h2><p>Save this JSON file somewhere safe. You can restore it later from any browser.</p>'+
    '<textarea class="mono" id="backupOut" readonly></textarea>'+
    '<div class="row"><button class="btn" data-x="close">Close</button><button class="btn" data-x="download">Download file</button><button class="btn primary" data-x="copy">Copy text</button></div>');
  const ta=m.querySelector('textarea');ta.value=json;
  m.addEventListener('click',e=>{const x=e.target.dataset.x;if(x==='close')m.remove();
    if(x==='copy'){const p=navigator.clipboard&&navigator.clipboard.writeText(json);
      if(p)p.then(()=>toast('Copied to clipboard')).catch(()=>{ta.focus();ta.select();toast('Text selected. Press Ctrl+C or ⌘C to copy.');});
      else{ta.focus();ta.select();toast('Text selected. Press Ctrl+C or ⌘C to copy.');}}
    if(x==='download'){
      const blob=new Blob([json],{type:'application/json'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url;a.download='music-notebook-backup-'+new Date().toISOString().slice(0,10)+'.json';
      a.click();URL.revokeObjectURL(url);toast('Downloaded backup file');}});
};
$('restoreBtn').onclick=()=>{
  const m=modal('<h2>Restore from backup</h2><p>Paste the JSON from a backup file. This will <b>add</b> all songs from the backup to your current songs.</p>'+
    '<textarea class="mono" id="restoreIn" placeholder="Paste backup JSON here..."></textarea>'+
    '<div class="row"><button class="btn" data-x="cancel">Cancel</button><button class="btn danger" data-x="replace">Replace all songs</button><button class="btn primary" data-x="add">Add to current songs</button></div>');
  const ta=m.querySelector('textarea');ta.focus();
  m.addEventListener('click',e=>{const x=e.target.dataset.x;if(x==='cancel')m.remove();
    if(x==='add'||x==='replace'){if(!ta.value.trim()){toast('Paste backup JSON first.');return;}
      try{
        const backup=JSON.parse(ta.value);
        if(!backup.songs||!Array.isArray(backup.songs)){toast('Invalid backup format. Expected {songs:[...]}');return;}
        if(x==='replace'){state.songs=backup.songs;}
        else{backup.songs.forEach(s=>{s.id=uid();state.songs.push(s);});}
        if(!state.songs.length){const e=exampleSong();state.songs=[e];state.current=e.id;}
        else{state.current=state.songs[0].id;}
        save();m.remove();render();
        toast(x==='replace'?'Restored '+backup.songs.length+' songs':'Added '+backup.songs.length+' songs');
      }catch(err){toast('Invalid JSON. Check the format and try again.');}}});
};
function toast(msg){const t=document.createElement('div');t.className='toast';t.setAttribute('role','status');t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),2600);}

// ---------- keyboard shortcuts ----------
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key==='c'&&!e.shiftKey&&!e.altKey){
    const isInput=e.target.matches('input, textarea');
    const hasSelection=isInput&&e.target.selectionStart!==e.target.selectionEnd;
    if(sel&&!hasSelection){
      e.preventDefault();copyLineChords();
    }
  }
  if((e.ctrlKey||e.metaKey)&&e.key==='v'&&!e.shiftKey&&!e.altKey){
    const isInput=e.target.matches('input, textarea');
    const hasSelection=isInput&&e.target.selectionStart!==e.target.selectionEnd;
    if(sel&&clipboard.chords&&!hasSelection){
      e.preventDefault();pasteLineChords();
    }
  }
  // Undo with Cmd+Z
  if((e.ctrlKey||e.metaKey)&&e.key==='z'&&!e.shiftKey){
    const isInput=e.target.matches('input, textarea');
    if(!isInput){
      e.preventDefault();undo();
    }
  }
  // Redo with Cmd+Shift+Z
  if((e.ctrlKey||e.metaKey)&&e.key==='z'&&e.shiftKey){
    const isInput=e.target.matches('input, textarea');
    if(!isInput){
      e.preventDefault();redo();
    }
  }
});

render();
})();
