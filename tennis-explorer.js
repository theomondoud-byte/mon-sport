// Mon Sport V18 — matchs de tennis absents d'ESPN (Challenger, ITF, Coupe Davis,
// qualifications), lus par le relais sur la fiche Tennis Explorer du joueur.
// Le vainqueur y est cité en premier ; le score est donné de son point de vue.
const plain=v=>String(v||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const TOURNAMENTS=[
 [/^masters cup atp$/i,'ATP Finals'],[/^masters cup wta$/i,'WTA Finals'],[/^davis cup$/i,'Coupe Davis'],
 [/^billie jean king cup$/i,'Billie Jean King Cup'],[/^french open$/i,'Roland-Garros'],
 [/^australian open$/i,'Open d’Australie'],[/^laver cup$/i,'Laver Cup'],[/^united cup$/i,'United Cup']
];
const ROUNDS={'1R':'1er tour','2R':'2e tour','3R':'3e tour','4R':'4e tour',R128:'1er tour',R64:'2e tour',R32:'3e tour',
 R16:'8e de finale',QF:'Quart de finale',SF:'Demi-finale',F:'Finale',RR:'Phase de groupes'};
export function tournamentLabel(name){
 const n=String(name||'').trim();
 for(const [re,label] of TOURNAMENTS)if(re.test(n))return label;
 const ch=n.match(/^(.*?)\s*(\d+)?\s+challenger$/i);
 if(ch)return 'Challenger de '+ch[1]+(ch[2]?' '+ch[2]:'');
 return n;
}
export function roundLabel(round){
 const r=String(round||'').trim();
 if(!r)return '';
 const q=r.startsWith('Q-');
 const base=ROUNDS[q?r.slice(2):r]||r;
 return q?'Qualifications · '+base:base;
}
// « Kouame M. » correspond à « Moïse Kouamé » (nom + initiale du prénom).
export function abbreviatedMatches(full,abbr){
 const f=plain(full).split(' '),a=plain(abbr).split(' ');
 if(!f.length||!a.length)return false;
 const initial=a.at(-1).length===1?a.at(-1):'';
 const surname=(initial?a.slice(0,-1):a).join(' ');
 const fullSurname=f.slice(1).join(' ')||f[0];
 return (surname===fullSurname||surname===f.at(-1))&&(!initial||f[0].startsWith(initial));
}
const displayName=abbr=>{
 const m=String(abbr||'').trim().match(/^(.*\S)\s+([A-Z])\.$/);
 return m?m[2]+'. '+m[1]:String(abbr||'').trim();
};
export function tennisExplorerItems(payloads=[],favorites=[],existing=[],{now=new Date(),days=45}={}){
 const lo=now.getTime()-days*86400000,hi=now.getTime()+86400000;
 const items=[];
 for(const payload of payloads){
  const favorite=favorites.find(f=>f.name===payload?.player);
  if(!favorite)continue;
  for(const m of payload.matches||[]){
   const time=Date.parse(m.date+'T12:00:00+01:00');
   if(!Number.isFinite(time)||time<lo||time>hi||!m.score)continue;
   const won=abbreviatedMatches(favorite.name,m.winner),lost=abbreviatedMatches(favorite.name,m.loser);
   if(won===lost)continue;
   const opponent=displayName(won?m.loser:m.winner);
   const oppSurname=plain(opponent.replace(/^[A-Z]\.\s+/,'')).split(' ').at(-1);
   // Déjà livré par ESPN ou par les archives : même favori, même adversaire, ±2 jours.
   const duplicate=existing.some(e=>(e.favorite===favorite.name||(e.favorites||[]).includes(favorite.name))
    &&Math.abs(Date.parse(e.date)-time)<=2*86400000&&plain(e.title||e.opponent||'').split(' ').includes(oppSurname));
   if(duplicate)continue;
   const title=won?favorite.name+' — '+opponent:opponent+' — '+favorite.name;
   const competition=tournamentLabel(m.tournament);
   items.push({id:'te|'+favorite.name+'|'+m.date+'|'+oppSurname,type:'tennis',favorite:favorite.name,sport:'Tennis',
    date:m.date+'T12:00:00+01:00',timeUnknown:true,title,competition,round:roundLabel(m.round),
    score:m.score,status:'Terminé',outcome:won?'Victoire':'Défaite',
    source:'Tennis Explorer',sourceUrl:payload.url||'https://www.tennisexplorer.com/'});
  }
 }
 return items;
}
