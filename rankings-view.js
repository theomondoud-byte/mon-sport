// Mon Sport V14.5 · Cinq classements de tennis live FR (top 150), autres sports inchangés.
// Tennis de table WTT : relevé daté, distinct du tennis ATP/WTA.
// Football/NBA : accès direct aux tableaux ESPN, en cache pour 20 min.
const ESPN='https://site.api.espn.com/apis/v2/sports/';
export const RANKING_DATE='2026-11-09';
export const RANKINGS=[
 {id:'atp',title:'ATP live',sport:'Tennis',url:'https://live-tennis.eu/fr/classement-atp-live',source:'Live Tennis',mode:'tennis-live',file:'atp-live.json'},
 {id:'wta',title:'WTA live',sport:'Tennis',url:'https://live-tennis.eu/fr/classement-wta-live',source:'Live Tennis',mode:'tennis-live',file:'wta-live.json'},
 {id:'atprace',title:'Race ATP live',sport:'Tennis',url:'https://live-tennis.eu/fr/classement-atp-race',source:'Live Tennis',mode:'tennis-live',file:'atprace-live.json'},
 {id:'wtarace',title:'Race WTA live',sport:'Tennis',url:'https://live-tennis.eu/fr/classement-wta-race',source:'Live Tennis',mode:'tennis-live',file:'wtarace-live.json'},
 {id:'nextgen',title:'Next Gen live',sport:'Tennis',url:'https://live-tennis.eu/fr/classement-atp-race-next-gen',source:'Live Tennis',mode:'tennis-live',file:'nextgen-live.json'},
 {id:'ligue1',title:'Ligue 1',sport:'Football',url:'https://www.espn.com/soccer/standings/_/league/fra.1',source:'ESPN',mode:'espn',path:'soccer/fra.1'},
 {id:'liga',title:'Liga',sport:'Football',url:'https://www.espn.com/soccer/standings/_/league/esp.1',source:'ESPN',mode:'espn',path:'soccer/esp.1'},
 {id:'ucl',title:'Ligue des champions',sport:'Football',url:'https://www.uefa.com/uefachampionsleague/standings/',source:'ESPN · UEFA',mode:'espn',path:'soccer/uefa.champions'},
 {id:'wtt',title:'WTT / ITTF',sport:'Tennis de table',url:'https://www.ittf.com/ittf-table-tennis-world-ranking/',source:'ITTF · semaine 46',mode:'snapshot'},
 {id:'nbaouest',title:'NBA Ouest',sport:'Basketball',url:'https://www.nba.com/standings',source:'ESPN · NBA',mode:'espn',path:'basketball/nba',west:true}
];
const fromTuple=(list)=>list.map(([name,rank,points])=>({name,rank,points:points==null?'':String(points)}));
const WTT=fromTuple([
 ['Sora Matsushima',1,7598],['Tomokazu Harimoto',2,6963],['Félix Lebrun',3,6859],
 ['Wang Chuqin',4,6297],['Lin Yun-Ju',5,5870],['Truls Möregårdh',6,5630],
 ['Hugo Calderano',7,4830],['Jang Woojin',8,4236],['Alexis Lebrun',9,3750],
 ['Lin Shidong',10,3686],['Flavien Coton',23,1864]
]);
export const SNAPSHOTS={wtt:WTT};
const TENNIS_API='https://site.api.espn.com/apis/site/v2/sports/tennis/';
const cache=new Map();
// Le classement consulté peut être relu hors connexion, toujours accompagné de sa date.
function savedRanking(id){
 try{
  const v=JSON.parse(localStorage.getItem('monsport-ranking-v14-'+id)||'null');
  return v&&Array.isArray(v.rows)&&v.rows.length&&Number.isFinite(Date.parse(v.asOf))?v:null;
 }catch{return null;}
}
function storeRanking(id,value){
 try{localStorage.setItem('monsport-ranking-v14-'+id,JSON.stringify(value));}catch{}
}
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
 .replace(/[^a-z0-9]/g,' ').trim().replace(/\s+/g,' ');
const knownTeams={
 'FC Barcelone':['barcelona','barca','fc barcelona'],PSG:['psg','paris saint germain','paris sg'],
 'Real Madrid':['real madrid'],'San Antonio Spurs':['san antonio spurs','spurs']
};
export function matchRankingFavorite(name,favorites=[]){
 const key=norm(name);
 for(const f of favorites){
  const aliases=[norm(f.name),...(knownTeams[f.name]||[])];
  if(aliases.some(a=>a===key))return f.name;
 }
 return null;
}
export function rankingForFavorite(favorite){
 const name=typeof favorite==='string'?favorite:favorite?.name||'';
 const sport=typeof favorite==='string'?'':favorite?.sport||'';
 if(name==='Mirra Andreeva')return 'wta';
 if(['Rafael Jódar','Moïse Kouamé'].includes(name))return 'nextgen';
 if(sport==='Tennis'||['Arthur Fils','Jannik Sinner','Carlos Alcaraz'].includes(name))return 'atp';
 if(['Félix Lebrun','Alexis Lebrun','Flavien Coton'].includes(name)||sport==='Tennis de table')return 'wtt';
 if(name==='San Antonio Spurs'||name==='Victor Wembanyama')return 'nbaouest';
 if(name==='PSG')return 'ligue1';
 if(name==='FC Barcelone'||name==='Real Madrid'||name==='Kylian Mbappé')return 'liga';
 return null;
}
export function rankingsForFavorite(favorite){
 const name=typeof favorite==='string'?favorite:favorite?.name;
 if(name==='Mirra Andreeva')return ['wta','wtarace'];
 if(name==='Rafael Jódar'||name==='Moïse Kouamé')return ['atp','atprace','nextgen'];
 if(['Arthur Fils','Jannik Sinner','Carlos Alcaraz'].includes(name))return ['atp','atprace'];
 if(['Félix Lebrun','Alexis Lebrun','Flavien Coton'].includes(name))return ['wtt'];
 if(name==='PSG')return ['ligue1','ucl'];
 if(name==='FC Barcelone'||name==='Real Madrid')return ['liga','ucl'];
 if(name==='San Antonio Spurs'||name==='Victor Wembanyama')return ['nbaouest'];
 if(name==='Kylian Mbappé')return ['liga','ucl'];
 return [];
}
const displayStat=(list,keys)=>{
 for(const key of keys){
  const k=norm(key);
  const row=(list||[]).find(s=>[s.name,s.abbreviation,s.displayName,s.shortDisplayName,s.label].some(q=>norm(q)===k));
  const v=row?.displayValue??row?.value;
  if(v!==undefined&&v!==null)return String(v);
 }
 return '';
};
function extractGroups(node,out=[],seen=new Set(),parent=''){
 if(!node||typeof node!=='object')return out;
 if(seen.has(node))return out;seen.add(node);
 const name=node.name||node.displayName||node.abbreviation||parent;
 const standings=node.standings;
 const rows=Array.isArray(standings?.entries)?standings.entries:Array.isArray(node.entries)?node.entries:[];
 if(rows.length)out.push({name,rows});
 for(const child of [...(node.children||[]),...(node.groups||[])])extractGroups(child,out,seen,name);
 return out;
}
// ESPN classements hebdomadaires : 150 entrées dans les flux ATP/WTA.
export function parseESPNTennisRankings(body){
 const entries=(body?.rankings||[]).flatMap(group=>Array.isArray(group?.ranks)?group.ranks:[]);
 const used=new Set();
 return entries.map(row=>{
  const athlete=row.athlete||{},rank=Number(row.current),previous=Number(row.previous);
  const points=Number(row.points);
  const name=athlete.displayName||[athlete.firstName,athlete.lastName].filter(Boolean).join(' ');
  if(!name||!Number.isFinite(rank)||rank<1||rank>150||!Number.isFinite(points)||used.has(norm(name)))return null;
  used.add(norm(name));
  return {
   name,rank,points:String(points),previousRank:Number.isFinite(previous)&&previous>0?previous:null,
   movement:Number.isFinite(previous)&&previous>0?previous-rank:null,
   age:Number.isFinite(Number(athlete.age))&&athlete.age!=null?Number(athlete.age):null,
   country:String(athlete.citizenshipCountry||''),flag:String(athlete.flag||''),
   image:String(athlete.headshot||''),source:'ESPN · classement publié',
   officialPoints:points,livePoints:null,nextPoints:null,maxPoints:null,tournament:'',
   earnedPoints:null,droppingPoints:null
  };
 }).filter(Boolean).sort((a,b)=>a.rank-b.rank).slice(0,150);
}
export function parseESPNStandings(body,{west=false}={}){
 const groups=extractGroups(body);
 const picked=west?groups.filter(g=>/western|(?:^|\b)west(?:ern)?(?:\b|$)/i.test(String(g.name))):groups;
 if(west&&!picked.length)return [];
 const raw=(picked.length?picked:groups).flatMap(g=>g.rows);
 const used=new Set(),out=[];
 for(const item of raw){
  const team=item.team||item.athlete||{};
  const name=team.displayName||team.name||item.displayName||'';
  if(!name||used.has(norm(name)))continue;used.add(norm(name));
  const stats=item.stats||item.statistics||[];
  const rank=Number(displayStat(stats,['rank','playoffSeed','seed'])||item.rank||item.rankDisplayValue||'');
  // Ne jamais inventer un rang quand ESPN ne le fournit pas.
  const displayed=Number.isFinite(rank)&&rank>0?rank:null;
  const wins=displayStat(stats,['wins','W','win']),draws=displayStat(stats,['ties','draws','draw','D']),
  losses=displayStat(stats,['losses','L','loss']);
  const points=west?(wins&&losses?wins+' V · '+losses+' D':'')
   :displayStat(stats,['points','PTS','totalPoints']);
  const played=displayStat(stats,['gamesPlayed','GP','played','matchesPlayed','MP']);
  const goalsFor=displayStat(stats,['pointsFor','goalsFor','GF','goalsScored']);
  const goalsAgainst=displayStat(stats,['pointsAgainst','goalsAgainst','GA','goalsConceded']);
  const diff=displayStat(stats,['pointDifferential','goalDifference','goalDifferential','goalDiff','GD']);
  out.push({name,rank:displayed,points:points.trim(),played,diff,wins,draws,losses,goalsFor,goalsAgainst,
   detail:(west?[played?played+' MJ':'']:[
    played?played+' J':'',wins!==''?wins+' V':'',draws!==''?draws+' N':'',losses!==''?losses+' D':'',
    goalsFor!==''?'BP '+goalsFor:'',goalsAgainst!==''?'BC '+goalsAgainst:'',diff?'Diff. '+diff:''
   ]).filter(Boolean).join(' · '),
   source:'ESPN'});
 }
 return out.sort((a,b)=>(a.rank??Infinity)-(b.rank??Infinity));
}
export async function fetchRankings({fetchFn=fetch,force=false}={}){
 const result={};
 await Promise.all(RANKINGS.filter(x=>x.mode==='espn'||x.mode==='tennis-espn').map(async spec=>{
  const saved=cache.get(spec.id);
  if(!force&&saved&&Date.now()-saved.at<20*60000){result[spec.id]=saved.result;return;}
  try{
   const url=spec.mode==='tennis-espn'?TENNIS_API+spec.tour+'/rankings':ESPN+spec.path+'/standings';
   const res=await fetchFn(url,{cache:'no-store',signal:AbortSignal.timeout(10000)});
   if(!res.ok)throw Error('ESPN '+res.status);
   const body=await res.json();
   const data=spec.mode==='tennis-espn'?parseESPNTennisRankings(body):parseESPNStandings(body,{west:!!spec.west});
   if(!data.length)throw Error('Tableau vide');
   const value={rows:data,asOf:new Date().toISOString(),live:true,
    kind:spec.mode==='tennis-espn'?'published':'standings'};
   cache.set(spec.id,{result:value,at:Date.now()});storeRanking(spec.id,value);result[spec.id]=value;
  }catch(e){
   const saved=savedRanking(spec.id);
   result[spec.id]=saved?{...saved,live:false,stale:true,error:'Dernière copie enregistrée · mise à jour indisponible'}
    :{rows:[],error:'Classement indisponible depuis ESPN.',live:false};
  }
 }));
 // Les cinq tableaux tennis proviennent directement des relevés live français.
 await Promise.all(RANKINGS.filter(spec=>spec.mode==='tennis-live').map(async spec=>{
  const saved=cache.get(spec.id);
  if(!force&&saved&&Date.now()-saved.at<20*60000){result[spec.id]=saved.result;return;}
  try{
   const response=await fetchFn('./data/'+spec.file,{cache:'no-store',signal:AbortSignal.timeout(7000)});
   if(!response.ok)throw Error('Relevé '+spec.id+' HTTP '+response.status);
   const payload=await response.json();
   const rows=parseATPLiveSnapshot(payload);
   if(!rows)throw Error('Relevé '+spec.id+' incomplet ou périmé');
   const value={rows,asOf:payload.fetchedAt,live:true,kind:'tennis-live',source:payload.source};
   cache.set(spec.id,{result:value,at:Date.now()});
   storeRanking(spec.id,value);result[spec.id]=value;
  }catch{
   const saved=savedRanking(spec.id);
   const age=saved?.asOf?Date.now()-Date.parse(saved.asOf):Infinity;
   const fresh=saved?.kind==='tennis-live'&&age>=0&&age<=36*3600000;
   result[spec.id]=fresh?{...saved,live:false,stale:true,error:'Dernier relevé enregistré localement'}
    :{rows:[],live:false,kind:'tennis-live',error:'Classement '+spec.id+' live indisponible'};
  }
 }));

 return result;
}
// Compatibilité avec les vues historiques ; les cinq tableaux actuels sont entièrement live.
export function mergeATPLiveRows(officialRows,payload,now=new Date()){
 const asOf=Date.parse(payload?.fetchedAt||''),age=now.getTime()-asOf;
 if(!Number.isFinite(asOf)||age<0||age>36*3600000||!Array.isArray(payload?.rows)||payload.rows.length<140)
  return {rows:officialRows,asOf:null,matched:0};
 const lookup=new Map();
 for(const r of payload.rows)if(r.name&&Number.isInteger(r.livePoints)&&r.livePoints>=0&&Number.isInteger(r.rank)&&r.rank>0)
  lookup.set(norm(r.name),r);
 let matched=0;
 const rows=officialRows.map(row=>{
  const other=lookup.get(norm(row.name));
  if(!other)return row;
  matched++;
  const projected=v=>Number.isInteger(v)&&v>=0?v:null;
  return {...row,liveRank:other.rank,livePoints:other.livePoints,
   movementLive:Number.isInteger(other.movement)?other.movement:null,
   pointsChange:Number.isInteger(other.pointsChange)?other.pointsChange:null,
   tournament:String(other.tournament||'').slice(0,120),
   nextPoints:projected(other.nextPoints),maxPoints:projected(other.maxPoints)};
 });
 return {rows,asOf:payload.fetchedAt,matched};
}
// Schéma commun aux cinq classements live (jamais de rangs inventés ou de données ESPN).
export function parseATPLiveSnapshot(payload,now=new Date()){
 const at=Date.parse(payload?.fetchedAt||''),age=now.getTime()-at;
 if(!Number.isFinite(at)||age<0||age>36*3600000||!Array.isArray(payload?.rows)||payload.rows.length!==150)
  return null;
 const seen=new Set(),rows=[];
 for(const raw of payload.rows){
  if(!Number.isInteger(raw?.rank)||raw.rank<1||raw.rank>150||seen.has(raw.rank)||
    !raw.name||!Number.isInteger(raw.livePoints)||raw.livePoints<0)return null;
  seen.add(raw.rank);
  const positive=value=>Number.isInteger(value)&&value>=0?value:null;
  rows.push({
   rank:raw.rank,name:String(raw.name).slice(0,120),points:String(raw.livePoints),
   livePoints:raw.livePoints,age:positive(raw.age),country:String(raw.country||'').slice(0,6),
   careerHigh:String(raw.careerHigh||'').slice(0,35),
   movement:Number.isInteger(raw.movement)?raw.movement:null,
   pointsChange:Number.isInteger(raw.pointsChange)?raw.pointsChange:null,
   tournament:String(raw.tournament||'').slice(0,160),
   tournamentHistory:(Array.isArray(raw.tournamentHistory)?raw.tournamentHistory:[])
    .filter(e=>e&&typeof e.text==='string'&&e.text.trim()&&
      Number.isFinite(Date.parse(e.lastSeen||''))&&now.getTime()>=Date.parse(e.lastSeen)&&
      now.getTime()-Date.parse(e.lastSeen)<14*86400000)
    .slice(0,10).map(e=>({text:e.text.slice(0,160),lastSeen:e.lastSeen})),
   previousTournaments:String(raw.previousTournaments||'').slice(0,240),
   tournamentStatus:['defaite','en_lice','non_communique'].includes(raw.tournamentStatus)
    ?raw.tournamentStatus:'non_communique',
   nextPoints:positive(raw.nextPoints),maxPoints:positive(raw.maxPoints),source:'Live Tennis'
  });
 }
 return rows.sort((x,y)=>x.rank-y.rank);
}
// Filtres communs aux tableaux ATP live et WTA. L'âge est strictement inférieur.
export function filterTennisRankingRows(rows,{ageMax='',country=''}={}){
 const max=ageMax!==''&&ageMax!==null&&Number.isInteger(Number(ageMax))?Number(ageMax):null;
 const nation=String(country||'').trim().toUpperCase();
 return (Array.isArray(rows)?rows:[]).filter(r=>
  (max===null||(Number.isFinite(Number(r.age))&&r.age!==null&&r.age!==undefined&&Number(r.age)<max))&&
  (!nation||String(r.country||'').trim().toUpperCase()===nation));
}
const COUNTRY_FR={
 FRA:'France',GER:'Allemagne',ITA:'Italie',ESP:'Espagne',USA:'États-Unis',GBR:'Royaume-Uni',
 AUS:'Australie',ARG:'Argentine',AUT:'Autriche',BEL:'Belgique',BIH:'Bosnie-Herzégovine',
 BOL:'Bolivie',BRA:'Brésil',BUL:'Bulgarie',CAN:'Canada',CHI:'Chili',CHN:'Chine',
 COL:'Colombie',CRO:'Croatie',CZE:'Tchéquie',DEN:'Danemark',FIN:'Finlande',
 GEO:'Géorgie',GRE:'Grèce',HKG:'Hong Kong',HUN:'Hongrie',JPN:'Japon',
 KAZ:'Kazakhstan',LTU:'Lituanie',MON:'Monaco',NED:'Pays-Bas',NOR:'Norvège',
 PAR:'Paraguay',PER:'Pérou',POL:'Pologne',POR:'Portugal',RSA:'Afrique du Sud',
 RUS:'Russie',SRB:'Serbie',SUI:'Suisse',SVK:'Slovaquie',TUR:'Turquie',
 UKR:'Ukraine',ROU:'Roumanie',IND:'Inde',MEX:'Mexique',URU:'Uruguay',
 SLO:'Slovénie',SWE:'Suède',TPE:'Taïwan',TUN:'Tunisie'
};
export function rankingRows(id,live={}){
 const data=live?.[id];
 if(data?.rows?.length)return data.rows;
 return SNAPSHOTS[id]||[];
}
export function rankingEntry(id,name,live={}){
 return rankingRows(id,live).find(x=>norm(x.name)===norm(name)||
  (knownTeams[name]||[]).some(alias=>norm(x.name)===norm(alias)))||null;
}
export function renderRankingsView({selected='atp',live={},favorites=[],loading=false,ageMax='',country='',esc,safeUrl}){
 const spec=RANKINGS.find(r=>r.id===selected)||RANKINGS[0];
 const rows=rankingRows(spec.id,live);
 const filterEnabled=spec.mode==='tennis-live'||spec.mode==='tennis-espn';
 const displayedRows=filterEnabled?filterTennisRankingRows(rows,{ageMax,country}):rows;
 const tennisColumns=spec.mode==='tennis-espn';
 const atpLive=spec.mode==='tennis-live';
 const saved=live[spec.id];
 const asOf=saved?.asOf?new Date(saved.asOf).toLocaleString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'';
 const label=spec.mode==='snapshot'?'Relevé du 9 novembre 2026 · pas en direct'
  :saved?.stale?'Dernier relevé ATP live sauvegardé le '+asOf+' · accès réseau indisponible'
  :saved?.live?(atpLive?'Relevé ATP live du '+asOf+' · actualisation périodique':spec.mode==='tennis-espn'?'Classement WTA ESPN consulté le '+asOf+' · non live':'Classement ESPN consulté le '+asOf)
  :'Classement non disponible depuis la source';
 const nav='<div class="rank-tabs" role="group" aria-label="Types de classements">'+RANKINGS.map(r=>
  '<button type="button" data-rank-select="'+esc(r.id)+'" class="'+(r.id===spec.id?'selected':'')+'" aria-pressed="'+(r.id===spec.id?'true':'false')+'">'+esc(r.title)+'</button>').join('')+'</div>';
 const localeCompare=(a,b)=>a.localeCompare(b,'fr',{sensitivity:'base'});
 const nations=filterEnabled?[...new Set(rows.map(r=>String(r.country||'').toUpperCase()).filter(Boolean))]
  .sort((a,b)=>a==='FRA'?-1:b==='FRA'?1:localeCompare(COUNTRY_FR[a]||a,COUNTRY_FR[b]||b)):[];
 const ages=Array.from({length:36},(_,i)=>i+16);
 const filterPanel=filterEnabled?'<div class="atp-filters" aria-label="Filtres des classements tennis">'
  +'<label for="rankAgeMax">Âge maximum <select id="rankAgeMax"><option value="">Tous les âges</option>'
  +ages.map(n=>'<option value="'+n+'" '+(String(ageMax)===String(n)?'selected':'')+'>Moins de '+n+' ans</option>').join('')
  +'</select></label>'
  +'<label for="rankCountry">Nationalité <select id="rankCountry"><option value="">Toutes les nationalités</option>'
  +nations.map(code=>'<option value="'+esc(code)+'" '+(country===code?'selected':'')+'>'
    +(code==='FRA'?'🇫🇷 ':'')+esc(COUNTRY_FR[code]||code)+'</option>').join('')
  +'</select></label>'
  +'<button type="button" class="atp-filter-clear" id="rankFilterReset" '+(!ageMax&&!country?'disabled':'')+'>Effacer</button>'
  +'<span class="atp-filter-count" role="status" aria-live="polite">'+displayedRows.length+' joueur'
  +(displayedRows.length!==1?'s':'')+' sur '+rows.length+'</span></div>':'';
 const cards=displayedRows.map(r=>{
  const fav=matchRankingFavorite(r.name,favorites);
  const clickable=!!fav;
  const attrs=clickable?' data-rank-favorite="'+esc(fav)+'" title="Ouvrir '+esc(fav)+' dans Un favori"':'';
  const name=clickable?'<button type="button" class="rank-favorite-link"'+attrs+'>'+esc(r.name)+' <span aria-hidden="true">↗</span></button>':'<span>'+esc(r.name)+'</span>';
  const portrait=spec.mode==='tennis-espn'&&/^https:\/\//.test(r.image||'')
   ?'<img class="rank-player-photo" src="'+esc(safeUrl(r.image))+'" loading="lazy" decoding="async" alt="" />':'';
  const number=r.rank!==null&&r.rank!==undefined&&Number.isFinite(Number(r.rank))?String(r.rank):'—';
  const movement=typeof r.movement==='number'
   ?'<span class="rank-movement '+(r.movement>0?'up':r.movement<0?'down':'flat')+'" aria-label="'+
    esc(r.movement>0?r.movement+' places gagnées':r.movement<0?Math.abs(r.movement)+' places perdues':'Classement stable')+'">'+
    (r.movement>0?'▲ '+r.movement:r.movement<0?'▼ '+Math.abs(r.movement):'▬')+'</span>':'';
  const isTennis=spec.mode==='tennis-espn';
  const tennisDetail=isTennis?'<span class="rank-extras">'
   +(r.country?'<span>'+esc(r.country)+'</span>':'')
   +(r.age!=null?'<span>'+esc(r.age)+' ans</span>':'')
   +(r.previousRank?'<span>Rang préc. : '+esc(r.previousRank)+'</span>':'')
   +'</span>':'';
  if(atpLive){
   const asText=value=>value===null||value===undefined||value===''?'—':String(value);
   const signed=value=>value==null?'—':value>0?'+'+value:String(value);
   const cell=(value,klass='',hint='')=>'<span class="rank-data '+klass+'" title="'+esc(hint)+'">'+esc(asText(value))+'</span>';
   const move=r.movement;
   const rankMove=typeof move==='number'?'<span class="rank-movement '+(move>0?'up':move<0?'down':'flat')+'" aria-label="'+esc(move>0?'Gain de '+move+' places':move<0?'Perte de '+Math.abs(move)+' places':'Classement inchangé')+'">'+(move>0?'▲ '+move:move<0?'▼ '+Math.abs(move):'▬')+'</span>':cell(null,'rank-missing','Mouvement non communiqué');
   const status=r.tournamentStatus==='defaite'
    ?'<span class="atp-status lost">Défaite</span>'
    :r.tournamentStatus==='en_lice'?'<span class="atp-status playing">En lice / prévu</span>'
    :'<span class="atp-status unknown">Non indiqué</span>';
   const ch=r.careerHigh||'';
   const career=ch?'<span class="atp-career '+(/^(NMC|MC|NCH|CH)/i.test(ch)?'best':'')+'">'+esc(ch)+'</span>':'—';
   const countryFlag=({'GER':'🇩🇪','ITA':'🇮🇹','ESP':'🇪🇸','USA':'🇺🇸','FRA':'🇫🇷','RUS':'🇷🇺','AUS':'🇦🇺','SRB':'🇷🇸','GBR':'🇬🇧','NOR':'🇳🇴','MON':'🇲🇨','CAN':'🇨🇦','CHN':'🇨🇳','BRA':'🇧🇷','ARG':'🇦🇷','CZE':'🇨🇿','NED':'🇳🇱','POL':'🇵🇱','BEL':'🇧🇪','SUI':'🇨🇭','CHI':'🇨🇱','POR':'🇵🇹','KAZ':'🇰🇿','JPN':'🇯🇵','HUN':'🇭🇺','CRO':'🇭🇷','AUT':'🇦🇹','COL':'🇨🇴','GRE':'🇬🇷','RSA':'🇿🇦','SVK':'🇸🇰','UKR':'🇺🇦','ROU':'🇷🇴','TUR':'🇹🇷','BIH':'🇧🇦','GEO':'🇬🇪','IND':'🇮🇳'}[r.country]||'');
   return '<div class="rank-row atp-live-row '+(clickable?'rank-tracked':'')+'">'
    +'<span class="rank-place">'+esc(r.rank)+'</span>'
    +'<span class="rank-career">'+career+'</span>'
    +'<span class="rank-person">'+name+'</span>'
    +cell(r.age,'rank-number','Âge selon le relevé')
    +'<span class="rank-country">'+countryFlag+' '+esc(r.country||'—')+'</span>'
    +cell(r.livePoints,'rank-number','Points ATP live')
    +'<span class="rank-data atp-movement">'+rankMove+'</span>'
    +cell(r.pointsChange==null?null:signed(r.pointsChange),'rank-number '+(r.pointsChange<0?'negative':r.pointsChange>0?'positive':''),'Variation nette des points par rapport au classement officiel précédent')
    +'<span class="rank-data rank-tournament atp-tourneys">'
    +(r.tournament?'<span class="atp-tourneys-item current"><small>Actuel</small>'+esc(r.tournament)+'</span>':'')
    +(Array.isArray(r.tournamentHistory)?r.tournamentHistory.filter(item=>item.text?.trim()&&
      item.text.trim()!==String(r.tournament||'').trim()).map(item=>
      '<span class="atp-tourneys-item recent" title="Tournoi observé le '+esc(new Date(item.lastSeen).toLocaleDateString('fr-FR'))+'">'
      +'<small>Observé</small>'+esc(item.text)+'</span>').join(''):'')
    +(!r.tournament&&!(r.tournamentHistory||[]).length?'—':'')+'</span>'
    +cell(r.previousTournaments||null,'rank-tournament','Épreuves déjà terminées ou résultats enregistrés par la source')
    +'<span class="rank-data">'+status+'</span>'
    +cell(r.nextPoints,'rank-number','Total des points après une victoire au prochain match')
    +cell(r.maxPoints,'rank-number','Maximum de points possible dans le tournoi')
    +'</div>';
  }
  if(tennisColumns){
   const activeFeed=spec.id==='atp'&&r.livePoints!==null&&r.livePoints!==undefined;
   const movementValue=activeFeed?r.movementLive:r.movement;
   const movementLabel=typeof movementValue==='number'
    ?'<span class="rank-movement '+(movementValue>0?'up':movementValue<0?'down':'flat')+'">'+
     (movementValue>0?'▲ '+movementValue:movementValue<0?'▼ '+Math.abs(movementValue):'▬')+'</span>':'';
   const playerMeta=[r.country,r.age!=null?r.age+' ans':''].filter(Boolean).join(' · ');
   const numeric=value=>value===null||value===undefined||value===''?'—':String(value);
   const signed=value=>value==null?'—':value>0?'+'+value:String(value);
   const cell=(value,klass='',hint='')=>'<span class="rank-data '+klass+'" title="'+esc(hint)+'">'+esc(numeric(value))+'</span>';
   return '<div class="rank-row tennis-rank-row '+(clickable?'rank-tracked':'')+'">'
    +'<span class="rank-place">'+esc(number)
    +(activeFeed&&r.liveRank!==r.rank?'<small>Live '+esc(r.liveRank)+'</small>':'')+'</span>'
    +'<span class="rank-person">'+portrait+name+movementLabel
    +(playerMeta?'<small>'+esc(playerMeta)+'</small>':'')+'</span>'
    +cell(r.points,'rank-number','Points officiels du dernier classement ESPN')
    +cell(activeFeed?r.livePoints:null,'rank-number','Points ATP live issus du dernier relevé')
    +cell(activeFeed&&r.pointsChange!=null?signed(r.pointsChange):null,'rank-number','Écart net de points par rapport au classement officiel, non uniquement les gains')
    +cell(activeFeed?r.tournament||null:null,'rank-tournament','Tournoi et tour actuel')
    +cell(activeFeed?r.nextPoints:null,'rank-number','Total de points après une victoire au prochain match')
    +cell(activeFeed?r.maxPoints:null,'rank-number','Total possible en cas de titre')
    +'</div>';
  }
  return '<div class="rank-row '+(clickable?'rank-tracked':'')+'"><span class="rank-place">'+esc(number)+'</span>'
   +'<span class="rank-person">'+portrait+name+movement+(r.detail?'<small>'+esc(r.detail)+'</small>':'')+tennisDetail+'</span>'
   +'<b class="rank-points">'+esc(r.points||'—')+'</b></div>';
 }).join('');
 const tracked=spec.mode==='snapshot'?favorites.map(f=>({name:f.name,entry:rankingEntry(spec.id,f.name)}))
  .filter(x=>x.entry&&!rows.some(r=>norm(r.name)===norm(x.name))):[];
 return '<section class="rankings-shell"><div class="rankings-heading"><h2>🏆 Classements</h2>'
  +'<p>Le nom d’un favori reste cliquable. Un tiret signifie que la source ne communique pas la valeur.</p></div>'
  +nav+filterPanel+'<div class="rankings-source"><span>'+esc(label)+'</span>'
  +'<a href="'+esc(safeUrl(spec.url))+'" target="_blank" rel="noopener noreferrer">Voir le classement complet ↗</a></div>'
  +(loading?'<p class="agenda-progress">Actualisation des classements…</p>':'')
  +(cards?(atpLive
   ?'<p class="rank-horizontal-hint">↔ Défilement horizontal : classement live, évolution, tournois, résultat et projections.</p>'
    +'<div class="rank-table-scroll" tabindex="0" role="region" aria-label="Classement ATP live : tableau défilant">'
    +'<div class="rank-table atp-live-table"><div class="rank-table-head atp-live-row">'
    +'<span>#</span><span>MC</span><span>Joueur</span><span>Âge</span><span>Pays</span><span>Pts live</span><span>Δ rang</span><span>Δ pts</span>'
    +'<span>Tournois · 14 j</span><span>Tournois précédents</span><span>Résultat</span><span>Suiv.</span><span>Max</span>'
    +'</div>'+cards+'</div></div>'
   :tennisColumns
   ?'<p class="rank-horizontal-hint">↔ Fais défiler le tableau vers la droite pour voir les projections.</p><div class="rank-table-scroll" tabindex="0" role="region" aria-label="Classement '+esc(spec.title)+' : défilement horizontal"><div class="rank-table tennis-rank-table"><div class="rank-table-head tennis-rank-row"><span>Rang</span><span>Joueur · variation</span><span>Officiels</span><span>Live</span><span>Δ pts</span><span>Tournoi en cours</span><span>Prochain</span><span>Maximum</span></div>'+cards+'</div></div>'
   :'<div class="rank-table"><div class="rank-table-head"><span>#</span><span>Club / joueur</span><span>'+esc(spec.west?'Bilan':'Points')+'</span></div>'+cards+'</div>')
  :rows.length&&filterEnabled?'<div class="agenda-empty"><h3>Aucun joueur ne correspond aux filtres</h3><p>Choisis un autre âge ou une autre nationalité, ou efface les filtres.</p></div>'
   :'<div class="agenda-empty"><h3>Source non accessible</h3><p>Consulte le tableau officiel avec le lien ci-dessus. Aucun rang fictif n’est affiché.</p></div>')
  +(atpLive?'<p class="agenda-footnote">ATP live : relevé du '+esc(asOf||'non communiqué')
    +' · les tournois affichés sur 14 jours sont ceux observés dans les relevés successifs de Mon Sport ; il ne s’agit pas de dates officielles de matchs. L’historique se construit progressivement. '
    +'Classement uniquement live-tennis.eu, sans points officiels ajoutés. '
    +'Δ rang = variation depuis le dernier classement officiel ; Δ pts = variation nette des points. '
    +'La mention Défaite vient de la source, dans les tournois déjà disputés. En lice / prévu signifie que le tournoi figure dans la colonne en cours ; aucun résultat n’est supposé. '
    +'Suiv. et Max ne sont affichés que si le fournisseur les publie. '
    +'<a href="https://live-tennis.eu/fr/classement-atp-live" target="_blank" rel="noopener noreferrer">Consulter le classement ATP live original ↗</a>.</p>':'')
  +'<p class="agenda-footnote">WTA : top 150 publié depuis ESPN, projections live non intégrées. Race/Next Gen/WTT : instantanés partiels. Football : J, V, N, D, BP et BC selon ESPN.</p></section>';
}
