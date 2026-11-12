// Mon Sport V8 — modèle indépendant de la navigation et des sources.
// Les fenêtres sont glissantes : 7 jours, 2 mois futurs et 12 mois passés par favori.
// Seules les rencontres réellement renvoyées par les sources sont affichées.
export const agendaNow=()=>new Date();
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
 .replace(/[^a-z0-9]+/g,' ').trim();
export function shiftedMonths(date,delta){
 const d=new Date(date),day=d.getDate();
 d.setDate(1);d.setMonth(d.getMonth()+delta);
 const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();
 d.setDate(Math.min(day,last));return d;
}
export function agendaWindow(view,phase,now=new Date()){
 const t=now instanceof Date?new Date(now):new Date(now);
 const past=phase==='past';
 const interval=view==='favori'
  ?shiftedMonths(t,past?-12:2)
  :new Date(t.getTime()+(past?-7:7)*86400000);
 return past?{from:interval,to:t,days:view==='favori'?null:7}
  :{from:t,to:interval,days:view==='favori'?null:7};
}
const precise=x=>!x.approxDate&&!x.snapshot&&!String(x.id||'').startsWith('verified26-')&&x.type!=='manual2026'&&x.type!=='tennis-history'&&x.type!=='verified2026';
const selected=x=>Array.isArray(x)?x:[];
export function makeAgenda({teams=[],individuals=[],history=[],verified=[],expanded=[]}={}){
 const all=[];
 for(const item of [...selected(teams),...selected(individuals),...selected(history),...selected(verified),...selected(expanded)]){
  const ms=Date.parse(item.date||'');
  if(!Number.isFinite(ms)||!item.favorite)continue;
  const status=item.status||((item.type==='tennis-history'||item.type==='verified2026'||item.type==='manual2026')?'Terminé':'');
  const finished=status==='Terminé'||item.type==='tennis-history'||item.type==='verified2026'||item.type==='manual2026';
  const live=status==='En cours';
  if(!finished&&!live&&status!=='À venir')continue;
  const title=String(item.title||(item.home&&item.away?item.home+' — '+item.away:item.opponent?item.favorite+' — '+item.opponent:'Événement sportif'));
  const score=item.score||(item.homeScore!==undefined&&item.homeScore!==null&&item.awayScore!==undefined&&item.awayScore!==null?item.homeScore+' – '+item.awayScore:'');
  const source=String(item.source||'Source sportive');
  const competition=String(item.competition||source.replace(/^ESPN \(/,'').replace(/\)$/,''));
  const originalDate=item.date;
  const day=originalDate.slice(0,10);
  const type=item.type==='nba'?'nba':item.type==='tennis'||item.type==='tennis-history'?'tennis':item.type==='verified2026'||item.type==='manual2026'?'verified':item.home?'team':item.type||'other';
  const noExactHour=!precise(item);
  // L'heure fictive de midi des relevés manuels n'est JAMAIS montrée.
  const personKey=name=>{
   const tokens=norm(name).split(' ').filter(Boolean);
   if(tokens.length<2)return tokens[0]||'';
   return tokens.at(-1).length===1?tokens[0]+'-'+tokens.at(-1):tokens.at(-1)+'-'+tokens[0][0];
  };
  const names=title.split(' — ').map(type==='tennis'?personKey:norm).sort().join('|');
  const eventKey=item.id?.startsWith('agenda-espn-')?'event:'+item.id.replace(/^agenda-espn-/,'')
    :item.id?.startsWith('espn-')?'event:'+item.id.replace(/^espn-/,''):null;
  // En simple, une même rencontre ATP peut être livrée à la fois par ESPN,
  // les archives et le relevé manuel avec des noms abrégés.
  const key=eventKey&&type!=='tennis'?eventKey
   :type==='tennis'?'tennis:'+day+':'+names
   :type+':'+day+':'+names+':'+norm(competition);
  all.push({
   key,id:item.id||key,date:originalDate,day,favorite:item.favorite,title,score,
   competition,round:item.round||'',status:finished?'Terminé':status,finished,live,
   datePrecision:noExactHour?'jour':'heure',approximate:!!item.approxDate,
   uncertainParticipation:!!item.uncertainParticipation,
   source,sourceUrl:item.sourceUrl||'',type,stats:item.stats||null,
   favorites:[item.favorite],origin:item
  });
 }
 // Préférence pour un résultat exact ou une source directe, mais jamais
 // pour une date approximative de tournoi lorsque la rencontre précise existe.
 all.sort((a,b)=>Number(a.approximate)-Number(b.approximate)||Number(b.datePrecision==='heure')-Number(a.datePrecision==='heure'));
 const seen=new Map;
 for(const row of all){
  if(seen.has(row.key)){
   const existing=seen.get(row.key);
   existing.favorites=[...new Set([...existing.favorites,...row.favorites])];
   continue;
  }
  seen.set(row.key,row);
 }
 return [...seen.values()];
}
export function agendaMatches(events,{view='semaine',phase='future',favorite=null,now=new Date()}={}){
 const w=agendaWindow(view,phase,now),lo=w.from.getTime(),hi=w.to.getTime();
 const wanted=events.filter(e=>{
  if(favorite&&!e.favorites.includes(favorite))return false;
  const dt=Date.parse(e.date);
  if(!Number.isFinite(dt))return false;
  // Pour une archive datée seulement à la semaine, présenter sa semaine
  // plutôt que laisser croire au jour exact de la rencontre.
  const uncertain=!!e.approximate;
  if(phase==='past'){
   if(!e.finished)return false;
   return uncertain?(dt+6*86400000>=lo&&dt<=hi):(dt>=lo&&dt<=hi);
  }
  // Les rencontres en cours restent visibles pendant 4 h après le début.
  if(!(e.status==='À venir'||e.live))return false;
  return dt>=lo&&dt<hi||(e.live&&dt>=lo-4*3600000&&dt<=hi);
 });
 // Prochains matchs chronologiques ; résultats passés du plus récent au plus ancien.
 return wanted.sort((a,b)=>phase==='past'
  ?Date.parse(b.date)-Date.parse(a.date)
  :Date.parse(a.date)-Date.parse(b.date));
}
export function groupAgenda(events){
 const map=new Map;
 for(const e of events){
  const k=e.day;
  if(!map.has(k))map.set(k,[]);
  map.get(k).push(e);
 }
 return [...map.entries()].map(([day,items])=>({day,items}));
}
export function agendaCoverage(favorites,events){
 const present=new Set(events.flatMap(e=>e.favorites));
 return {
  present:[...present],
  missing:favorites.filter(f=>!present.has(f.name))
 };
}
