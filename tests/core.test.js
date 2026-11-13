import {sportInfo,sourceImage} from '../sports-media.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {makeAgenda,agendaMatches,shiftedMonths} from '../agenda-model.js';
import {parseESPNStandings,parseESPNTennisRankings,rankingRows,mergeATPLiveRows,parseATPLiveSnapshot,filterTennisRankingRows,tournamentColumns,tournamentStatusInColumns,renderOtherRankingTable,fetchRankings,renderRankingsView} from '../rankings-view.js';
import {newsLastWeek} from '../news-view.js';
import {isSportsArticle} from '../sports-articles.js';

test('décalage de mois en fin de mois',()=>{
 assert.equal(shiftedMonths(new Date(2026,0,31),1).getDate(),28);
});

test('un résultat incertain ne devient jamais une victoire',()=>{
 const rows=makeAgenda({teams:[{id:'a',date:'2026-11-10T12:00:00Z',favorite:'PSG',
  home:'PSG',away:'Lyon',status:'Résultat à vérifier',pendingResult:true,endDate:'2026-11-12'}]});
 assert.equal(rows.length,1);
 assert.equal(rows[0].pendingResult,true);
 assert.equal(rows[0].score,'');
 assert.equal(rows[0].finished,false);
});

test('résultats en attente triés selon la fin réelle de la compétition',()=>{
 const events=[
 {date:'2026-11-01T12:00:00Z',endDate:'2026-11-12',pendingResult:true,finished:false,favorites:['A'],status:'Résultat à vérifier'},
 {date:'2026-11-10T12:00:00Z',pendingResult:false,finished:true,favorites:['A'],status:'Terminé'}
 ];
 const rows=agendaMatches(events,{phase:'past',now:new Date('2026-11-13T12:00:00Z')});
 assert.equal(rows.length,2);
 assert.equal(rows[0].endDate,'2026-11-12');
});

test('ESPN : aucun rang artificiel pour une équipe sans classement',()=>{
 const body={children:[{name:'La Liga',standings:{entries:[
  {team:{displayName:'Club A'},stats:[{name:'points',displayValue:'20'}]},
  {team:{displayName:'Club B'},stats:[{name:'rank',displayValue:'3'},{name:'points',displayValue:'15'}]}
 ]}}]};
 const rows=parseESPNStandings(body);
 assert.equal(rows.find(r=>r.name==='Club A').rank,null);
 assert.equal(rows.find(r=>r.name==='Club B').rank,3);
});

test('ESPN : rangs explicites conservés même si données mélangées',()=>{
 const body={entries:[
  {team:{name:'A'},stats:[{name:'rank',value:2}]},
  {team:{name:'B'},stats:[{name:'rank',value:1}]}
 ]};
 assert.deepEqual(parseESPNStandings(body).map(x=>x.name),['B','A']);
});

test('un classement ESPN indisponible ne reçoit pas de fausses lignes',()=>{
 assert.deepEqual(rankingRows('liga',{liga:{rows:[],error:'source indisponible'}}),[]);
});

test('articles : masquer les titres people',()=>{
 assert.equal(isSportsArticle({title:'La vie privée de la star du football',favorite:'PSG'}),false);
});

test('articles : retirer les actualités trop anciennes',()=>{
 const now=new Date('2026-11-13T12:00:00Z');
 const items=[
 {title:'Match de football',link:'https://example.com/recent',date:'2026-11-12T10:00:00Z',favorite:'PSG'},
 {title:'Match de football',link:'https://example.com/ancien',date:'2026-10-20T10:00:00Z',favorite:'PSG'}
 ];
 assert.equal(newsLastWeek(items,now).length,1);
});

test('ESPN ATP : 150 positions réelles et progression hebdomadaire',()=>{
 const ranks=Array.from({length:155},(_,i)=>({
  current:i+1,previous:i+3,points:5000-i,
  athlete:{displayName:'Joueur '+(i+1),age:20,citizenshipCountry:'FRA'}
 }));
 const rows=parseESPNTennisRankings({rankings:[{ranks}]});
 assert.equal(rows.length,150);
 assert.equal(rows[0].rank,1);
 assert.equal(rows[0].movement,2);
 assert.equal(rows[149].rank,150);
 assert.equal(rows[0].livePoints,null); // ne pas inventer des projections ATP
});

test('ESPN WTA : rang incomplet et doublons exclus',()=>{
 const rows=parseESPNTennisRankings({rankings:[{ranks:[
  {current:1,previous:2,points:3300,athlete:{displayName:'Joueuse A'}},
  {current:2,previous:4,points:3100,athlete:{displayName:'Joueuse A'}},
  {current:null,points:2900,athlete:{displayName:'Joueuse B'}}
 ]}]});
 assert.equal(rows.length,1);
 assert.equal(rows[0].movement,1);
});

test('football : J, V, N, D, BP, BC et différence de buts',()=>{
 const stats=[['rank',1],['points',22],['gamesPlayed',10],['wins',7],
 ['ties',1],['losses',2],['pointsFor',21],['pointsAgainst',9],['goalDifference',12]]
  .map(([name,value])=>({name,value}));
 const rows=parseESPNStandings({entries:[{team:{name:'Club A'},stats}]});
 assert.equal(rows[0].points,'22');
 assert.equal(rows[0].wins,'7');
 assert.equal(rows[0].draws,'1');
 assert.equal(rows[0].losses,'2');
 assert.match(rows[0].detail,/7 V/);
 assert.match(rows[0].detail,/1 N/);
 assert.match(rows[0].detail,/2 D/);
 assert.match(rows[0].detail,/BP 21/);
});

test('sports : une icône cohérente selon la discipline',()=>{
 assert.equal(sportInfo('Tennis de table').icon,'🏓');
 assert.equal(sportInfo('Real Madrid').icon,'⚽');
 assert.equal(sportInfo('Victor Wembanyama').icon,'🏀');
 assert.equal(sportInfo('Natation').icon,'🏊');
});

test('photos : seulement des URL HTTPS externes',()=>{
 assert.equal(sourceImage('javascript:alert(1)'),'');
 assert.equal(sourceImage('http://example.com/image.jpg'),'');
 assert.equal(sourceImage('https://example.com/image.jpg'),'https://example.com/image.jpg');
});

test('ATP live : relier 150 rangs contrôlés et conserver les points officiels',()=>{
 const now=new Date('2026-11-13T10:00:00Z');
 const payload={fetchedAt:'2026-11-13T09:00:00Z',rows:Array.from({length:150},(_,i)=>({
  rank:i+1,name:i===0?'Alexander Zverev':'Joueur '+i,livePoints:9350-i,
  movement:i===0?2:0,pointsChange:i===0?-200:0,
  tournament:i===0?'ATP Finals RR':'',nextPoints:i===0?null:9450-i,maxPoints:i===0?null:9600-i
 }))};
 const joined=mergeATPLiveRows([{rank:1,name:'Alexander Zverev',points:'9550'}],payload,now);
 assert.equal(joined.matched,1);
 assert.equal(joined.rows[0].points,'9550');
 assert.equal(joined.rows[0].livePoints,9350);
 assert.equal(joined.rows[0].pointsChange,-200);
 assert.equal(joined.rows[0].nextPoints,null);
 assert.equal(joined.rows[0].movementLive,2);
 assert.deepEqual(mergeATPLiveRows([{name:'Test'}],payload,new Date('2026-11-17T12:00:00Z')).rows,[{name:'Test'}]);
});

test('classement ATP live : 150 lignes sans points officiels ESPN',()=>{
 const now=new Date('2026-11-13T10:00:00Z');
 const payload={source:'https://live-tennis.eu/fr/classement-atp-live',
  fetchedAt:'2026-11-13T09:00:00Z',
  rows:Array.from({length:150},(_,i)=>({
   rank:i+1,name:'Joueur '+(i+1),livePoints:9350-i,age:29,country:'GER',
   movement:i===0?2:null,pointsChange:i===0?-200:null,
   tournament:i===0?'Finales ATP RR':'',
   previousTournaments:i===1?'Défaite Stockholm 8e':'',
   tournamentStatus:i===0?'en_lice':i===1?'defaite':'non_communique',
   nextPoints:i===0?3215:null,maxPoints:i===0?3300:null,
   careerHigh:i===0?'MC':'1'
  }))};
 const rows=parseATPLiveSnapshot(payload,now);
 assert.equal(rows.length,150);
 assert.equal(rows[0].rank,1);
 assert.equal(rows[0].points,'9350');
 assert.equal(rows[0].movement,2);
 assert.equal(rows[0].tournamentStatus,'en_lice');
 assert.equal(rows[1].tournamentStatus,'defaite');
 assert.equal(rows[1].previousTournaments,'Défaite Stockholm 8e');
 assert.equal(rows[0].careerHigh,'MC');
 assert.equal(rows[0].nextPoints,3215);
 assert.deepEqual(rankingRows('atp',{}),[]);
 assert.equal(parseATPLiveSnapshot({...payload,rows:payload.rows.slice(0,149)},now),null);
 assert.equal(parseATPLiveSnapshot(payload,new Date('2026-11-16T10:00:00Z')),null);
});

test('ATP compact : points live, mouvement de rang et défaite dans la colonne précédente',()=>{
 const now=new Date();
 const html=renderRankingsView({selected:'atp',live:{atp:{
  rows:[{rank:11,name:'Taylor Fritz',points:'3150',livePoints:3150,
   movement:-1,pointsChange:-135,careerHigh:'4',age:29,country:'USA',
   previousTournaments:'',tournamentStatus:'en_lice',tournament:'Stockholm DF',
   nextPoints:3215,maxPoints:3300},
   {rank:18,name:'Casper Ruud',points:'2435',livePoints:2435,
   movement:null,careerHigh:'2',country:'NOR',age:27,
   tournament:'',previousTournaments:'Défaite Stockholm 8e',tournamentStatus:'defaite'}],
  live:true,kind:'tennis-live',asOf:now.toISOString()}},favorites:[],
  esc:x=>String(x),safeUrl:x=>x});
 assert.match(html,/<span>Pts<\/span>/);
 assert.match(html,/Δ rang/);
 assert.match(html,/Tournoi précédent/);
 assert.doesNotMatch(html,/<span>Résultat<\/span>/);
 assert.match(html,/Stockholm DF/);
 assert.match(html,/3215/);
 assert.match(html,/3300/);
 assert.match(html,/Défaite Stockholm 8e/);
 assert.match(html,/class="rank-data rank-tournament tourney-previous is-loss"/);
 assert.match(html,/class="tourney-loss-symbol"/);
 assert.match(html,/▼ 1/);
 assert.match(html,/rank-table-scroll/);
 assert.doesNotMatch(html,/<details class="rank-live-details"/);
 assert.doesNotMatch(html,/Points officiels/);
});

test('les classements football continuent de s’afficher sans données ATP',()=>{
 const html=renderRankingsView({selected:'ligue1',live:{ligue1:{
  rows:[{rank:1,name:'PSG',points:'28',detail:'12 J · 9 V · 1 N · 2 D'}],
  live:true,asOf:new Date().toISOString()}},
  favorites:[],esc:x=>String(x),safeUrl:x=>x});
 assert.match(html,/PSG/);
 assert.match(html,/Équipe/);
 assert.match(html,/>V<\/span>/);
 assert.match(html,/standings-football/);
 assert.match(html,/class="rank-data rank-number">9<\/span>/);
});

test('récupération ATP sans requête au classement officiel ESPN',async()=>{
 const payload={fetchedAt:new Date().toISOString(),
  rows:Array.from({length:150},(_,i)=>({rank:i+1,name:'Joueur '+i,livePoints:5000-i}))};
 const requested=[];
 const fetchFn=async url=>{
  requested.push(String(url));
  const ok=String(url)==='./data/atp-live.json';
  return {ok,status:ok?200:503,json:async()=>payload};
 };
 const data=await fetchRankings({fetchFn,force:true});
 assert.equal(data.atp.rows.length,150);
 assert.equal(data.atp.rows[0].points,'5000');
 assert.ok(requested.includes('./data/atp-live.json'));
 assert.ok(requested.every(url=>!url.includes('tennis/atp/rankings')));
});

test('ATP : l’âge est strictement inférieur et filtre cumulable avec la France',()=>{
 const rows=[
  {rank:1,name:'Français 19',age:19,country:'FRA'},
  {rank:2,name:'Français 20',age:20,country:'FRA'},
  {rank:3,name:'Espagnol 18',age:18,country:'ESP'},
  {rank:4,name:'Âge inconnu',age:null,country:'FRA'}
 ];
 assert.deepEqual(filterTennisRankingRows(rows,{ageMax:20,country:'FRA'}).map(r=>r.rank),[1]);
 assert.deepEqual(filterTennisRankingRows(rows,{ageMax:'',country:'FRA'}).map(r=>r.rank),[1,2,4]);
 assert.deepEqual(filterTennisRankingRows(rows,{ageMax:'20',country:''}).map(r=>r.rank),[1,3]);
 assert.equal(filterTennisRankingRows(rows,{ageMax:18,country:'FRA'}).length,0);
 assert.equal(filterTennisRankingRows(rows).length,4);
});

test('filtres au-dessus du classement et France avant toutes les autres nations',()=>{
 const html=renderRankingsView({selected:'atp',live:{atp:{
  rows:[
   {rank:1,name:'Allemand',age:21,country:'GER',livePoints:2800},
   {rank:2,name:'Français',age:19,country:'FRA',livePoints:2500},
   {rank:3,name:'Italien',age:18,country:'ITA',livePoints:2200}
  ],live:true,asOf:new Date().toISOString()}},ageMax:20,country:'FRA',
  favorites:[],esc:x=>String(x),safeUrl:x=>x});
 assert.ok(html.indexOf('id="rankAgeMax"')<html.indexOf('class="rank-table-scroll"'));
 assert.match(html,/Moins de 20 ans/);
 assert.match(html,/1 joueur sur 3/);
 assert.match(html,/Français/);
 assert.doesNotMatch(html,/>Allemand</);
 assert.ok(html.indexOf('option value="FRA"')<html.indexOf('option value="GER"'));
 assert.match(html,/🇫🇷 France/);
 const empty=renderRankingsView({selected:'atp',live:{atp:{rows:[
   {rank:1,name:'Allemand',age:21,country:'GER',livePoints:2800}
  ],live:true,asOf:new Date().toISOString()}},ageMax:18,country:'FRA',
  favorites:[],esc:x=>String(x),safeUrl:x=>x});
 assert.match(empty,/Aucun joueur ne correspond aux filtres/);
 assert.doesNotMatch(empty,/Source non accessible/);
});

test('tournois ATP observés pendant les 14 derniers jours : aucune date de match inventée',()=>{
 const now=new Date('2026-11-13T12:00:00Z');
 const payload={fetchedAt:'2026-11-13T11:00:00Z',rows:Array.from({length:150},(_,i)=>({
  rank:i+1,name:'Joueur '+i,livePoints:7000-i,country:'FRA',age:22,
  tournament:i===0?'Orléans QF':'',
  tournamentHistory:i===0?[
   {text:'Orléans QF',lastSeen:'2026-11-13T11:00:00Z'},
   {text:'Stockholm 8e',lastSeen:'2026-11-06T11:00:00Z'},
   {text:'Paris R32',lastSeen:'2026-10-21T11:00:00Z'}
  ]:[]
 }))};
 const rows=parseATPLiveSnapshot(payload,now);
 assert.deepEqual(rows[0].tournamentHistory.map(r=>r.text),['Orléans QF','Stockholm 8e']);
 const html=renderRankingsView({selected:'atp',live:{atp:{rows:rows.slice(0,1),
  live:true,asOf:payload.fetchedAt}},favorites:[],esc:x=>String(x),safeUrl:x=>x});
 assert.match(html,/Tournoi en cours/);
 assert.match(html,/Tournoi précédent/);
 assert.doesNotMatch(html,/<span>Résultat<\/span>/);
 assert.match(html,/Stockholm 8e/);
 assert.match(html,/Orléans QF/);
 assert.doesNotMatch(html,/Paris R32/);
 assert.match(html,/Observé/);
});

test('tournoi en cours et précédent : la source est prioritaire sur les anciens relevés',()=>{
 const row={tournament:'Stockholm QF',previousTournaments:'Défaite Bâle R16',
  tournamentHistory:[{text:'Stockholm QF',lastSeen:new Date().toISOString()},
   {text:'Paris R32',lastSeen:new Date().toISOString()}]};
 assert.deepEqual(tournamentColumns(row),{
  current:'Stockholm QF',previous:'Défaite Bâle R16',previousObserved:false
 });
 assert.deepEqual(tournamentColumns({...row,previousTournaments:''}),{
  current:'Stockholm QF',previous:'Paris R32',previousObserved:true
 });
 assert.deepEqual(tournamentColumns({tournament:'',previousTournaments:''}),{
  current:'',previous:'',previousObserved:false
 });
});

test('les cinq classements tennis utilisent un fichier top 150 live distinct, sans tableau statique',async()=>{
 const ids=['atp','wta','atprace','wtarace','nextgen'];
 const files=['atp-live.json','wta-live.json','atprace-live.json','wtarace-live.json','nextgen-live.json'];
 const payload={fetchedAt:new Date().toISOString(),rows:Array.from({length:150},(_,i)=>({
  rank:i+1,name:'Sportif '+(i+1),livePoints:9000-i,age:i===0?17:25,
  country:i===0?'FRA':'ESP',movement:i===0?3:null,pointsChange:10,
  tournament:i===0?'Monastir 8e':'',previousTournaments:i===1?'Défaite Stockholm R16':''
 }))};
 const calls=[];
 const fetchFn=async path=>{
  calls.push(String(path));
  return {ok:files.some(file=>String(path)==='./data/'+file),status:503,json:async()=>payload};
 };
 const live=await fetchRankings({fetchFn,force:true});
 for(let index=0;index<ids.length;index++){
  const id=ids[index];
  assert.ok(calls.includes('./data/'+files[index]));
  assert.equal(live[id].rows.length,150);
  assert.equal(live[id].rows[0].points,'9000');
  assert.deepEqual(rankingRows(id,{}),[]);
  const html=renderRankingsView({selected:id,live,favorites:[],ageMax:20,country:'FRA',
   esc:x=>String(x),safeUrl:x=>x});
  assert.match(html,/Tournoi en cours/);
  assert.match(html,/Tournoi précédent/);
 assert.doesNotMatch(html,/<span>Résultat<\/span>/);
  assert.match(html,/Monastir 8e/);
  assert.match(html,/1 joueur sur 150/);
  assert.ok(html.indexOf('option value="FRA"')<html.indexOf('option value="ESP"'));
  assert.doesNotMatch(html,/Tournois · 14 j/);
  assert.doesNotMatch(html,/Points officiels/);
  if(['atp','wta'].includes(id))assert.match(html,/Joueur · MC/);
  else assert.doesNotMatch(html,/Joueur · MC/);
 }
 assert.ok(!calls.some(url=>url.includes('tennis/wta/rankings')));
});

test('classement Race : tournois précédents et absence de MC fictif',()=>{
 const html=renderRankingsView({selected:'nextgen',live:{nextgen:{
  rows:[{rank:4,name:'Moïse Kouamé',age:17,country:'FRA',livePoints:423,
   previousTournaments:'Défaite Monastir 1 8e',tournamentStatus:'defaite'}],
  live:true,asOf:new Date().toISOString()}},favorites:[],
  esc:x=>String(x),safeUrl:x=>x});
 assert.match(html,/Défaite Monastir 1 8e/);
 assert.match(html,/race-no-career/);
 assert.match(html,/class="rank-data rank-tournament tourney-previous is-loss"/);
 assert.doesNotMatch(html,/Joueur · MC/);
});

test('les résultats sont intégrés aux deux colonnes de tournois',()=>{
 const live={
  atp:{rows:[
   {rank:1,name:'Actif',country:'FRA',age:20,livePoints:1500,
    tournament:'Stockholm DF',previousTournaments:'',tournamentStatus:'en_lice'},
   {rank:2,name:'Éliminé',country:'FRA',age:22,livePoints:1200,
    tournament:'',previousTournaments:'Défaite Bâle 8e',tournamentStatus:'defaite'},
   {rank:3,name:'Défaite sans détail',country:'FRA',age:19,livePoints:990,
    tournament:'',previousTournaments:'',tournamentStatus:'defaite'},
   {rank:4,name:'Inconnu',country:'FRA',age:18,livePoints:800,
    tournament:'',previousTournaments:'',tournamentStatus:'non_communique'}],
   live:true,asOf:new Date().toISOString()}
 };
 const html=renderRankingsView({selected:'atp',live,favorites:[],
  esc:x=>String(x),safeUrl:x=>x});
 assert.match(html,/<span>Tournoi en cours<\/span><span>Tournoi précédent<\/span><span>Suiv\.<\/span>/);
 assert.doesNotMatch(html,/<span>Résultat<\/span>/);
 assert.doesNotMatch(html,/atp-status unknown/);
 assert.match(html,/Stockholm DF<\/span><small class="tourney-status playing"/);
 assert.match(html,/Défaite Bâle 8e/);
 assert.match(html,/class="tourney-loss-symbol"/);
 assert.match(html,/class="tourney-status lost">✕ Défaite<\/small>/);
 assert.match(html,/>Inconnu<\/span>/);
});

test('les résultats source sont classés sans doublon de défaite',()=>{
 const previous=tournamentColumns({previousTournaments:'Défaite Stockholm 8e'});
 assert.deepEqual(tournamentStatusInColumns({tournamentStatus:'defaite'},previous),{
  current:'',previous:'defaite',previousAlreadySaysLoss:true
 });
 const current=tournamentColumns({tournament:'Finales WTA RR',previousTournaments:'Défaite Bâle R16'});
 assert.deepEqual(tournamentStatusInColumns({tournamentStatus:'en_lice'},current),{
  current:'en_lice',previous:'defaite',previousAlreadySaysLoss:true
 });
 assert.deepEqual(tournamentStatusInColumns({tournamentStatus:'non_communique'},{
  current:'',previous:'',previousObserved:false
 }),{current:'',previous:'',previousAlreadySaysLoss:false});
});

test('les cinq classements tennis conservent le tableau compact sans colonne Résultat',()=>{
 const ids=['atp','wta','atprace','wtarace','nextgen'];
 for(const id of ids){
  const html=renderRankingsView({selected:id,live:{[id]:{
   rows:[{rank:3,name:'Joueur suivi',age:20,country:'FRA',livePoints:2100,
    tournament:'Stockholm DF',previousTournaments:'Défaite Metz 16e',
    tournamentStatus:'en_lice'}],live:true,asOf:new Date().toISOString()
  }},favorites:[],esc:x=>String(x),safeUrl:x=>x});
  assert.match(html,/class="rank-data rank-tournament tourney-current"/);
  assert.match(html,/class="rank-data rank-tournament tourney-previous is-loss"/);
  assert.match(html,/class="tourney-status playing"/);
  assert.match(html,/Défaite Metz 16e/);
  assert.doesNotMatch(html,/<span>Résultat<\/span>/);
  assert.match(html,/rank-table-scroll/);
 }
});

test('football : tableau détaillé avec valeurs ESPN réellement fournies',()=>{
 const standings=Array.from({length:2},(_,i)=>({
  team:{displayName:i?'Marseille':'Paris Saint-Germain',logos:[{href:'https://a.espncdn.com/i/teamlogo.png'}]},
  stats:[['rank',i+1],['rankChange',i?0:1],['points',25-i*3],['gamesPlayed',12],
   ['wins',8-i],['ties',1+i],['losses',3],['pointsFor',20-i],['pointsAgainst',10+i],
   ['pointDifferential',10-2*i]].map(([name,value])=>({name,value,displayValue:String(value)}))
 }));
 const rows=parseESPNStandings({children:[{name:'French Ligue 1 2026-27',standings:{entries:standings}}]});
 assert.equal(rows.length,2);
 assert.equal(rows[0].played,'12');
 assert.equal(rows[0].wins,'8');
 assert.equal(rows[0].draws,'1');
 assert.equal(rows[0].losses,'3');
 assert.equal(rows[0].goalsFor,'20');
 assert.equal(rows[0].goalsAgainst,'10');
 assert.equal(rows[0].diff,'10');
 assert.equal(rows[0].rankChange,'1');
 assert.equal(rows[0].logo,'https://a.espncdn.com/i/teamlogo.png');
 const html=renderRankingsView({selected:'ligue1',live:{ligue1:{rows,live:true,asOf:new Date().toISOString()}},
  favorites:[],esc:x=>String(x).replaceAll('<','&lt;'),safeUrl:x=>x});
 for(const h of ['J','V','N','D','BP','BC','Diff.','Pts','Δ rang'])assert.match(html,new RegExp(h));
 assert.match(html,/standings-football/);
 assert.match(html,/Paris Saint-Germain/);
 assert.match(html,/▲ 1/);
});

test('NBA : pourcentage, écart, séries et domicile/extérieur ne sont pas inventés',()=>{
 const entries=(conference)=>[{
  team:{displayName:conference==='Western Conference'?'San Antonio Spurs':'Milwaukee Bucks'},
  stats:[
   {name:'playoffSeed',displayValue:'5'}, {name:'wins',displayValue:'9'},
   {name:'losses',displayValue:'4'},{name:'winPercent',displayValue:'.692'},
   {name:'gamesBehind',displayValue:'2.5'},{name:'streak',displayValue:'W3'},
   {name:'home',displayValue:'5-2'},{name:'road',displayValue:'4-2'},
   {name:'last 10 games',displayValue:'7-3'},
   {name:'avgPointsFor',displayValue:'118.5'},
   {name:'avgPointsAgainst',displayValue:'113.1'},
   {name:'differential',displayValue:'+5.4'}
  ]
 }];
 const body={children:['Eastern Conference','Western Conference'].map(name=>({name,standings:{entries:entries(name)}}))};
 const rows=parseESPNStandings(body,{west:true});
 assert.equal(rows.length,1);assert.equal(rows[0].name,'San Antonio Spurs');
 assert.equal(rows[0].pct,'.692');assert.equal(rows[0].gamesBehind,'2.5');
 assert.equal(rows[0].streak,'W3');assert.equal(rows[0].home,'5-2');
 assert.equal(rows[0].away,'4-2');assert.equal(rows[0].lastTen,'7-3');
 assert.equal(rows[0].avgPointsFor,'118.5');
 const html=renderRankingsView({selected:'nbaouest',live:{nbaouest:{rows,live:true,asOf:new Date().toISOString()}},
  favorites:[{name:'San Antonio Spurs'}],esc:x=>String(x),safeUrl:x=>x});
 assert.match(html,/standings-nba/);
 assert.match(html,/69,2/);
 assert.match(html,/Domicile|Dom\./);
 assert.match(html,/V3/);
 assert.match(html,/7-3/);
 assert.match(html,/San Antonio Spurs/);
 assert.doesNotMatch(html,/Milwaukee Bucks/);
});

test('les colonnes sportives absentes deviennent des tirets, sans chiffres fictifs',()=>{
 const html=renderRankingsView({selected:'liga',live:{liga:{rows:[{
  rank:1,name:'Club incomplet',points:'3',wins:'1',losses:'',draws:'',played:''
 }],live:true,asOf:new Date().toISOString()}},favorites:[],esc:x=>String(x),safeUrl:x=>x});
 assert.match(html,/Club incomplet/);
 assert.match(html,/class="rank-data rank-number">—<\/span>/);
 assert.match(html,/class="rank-data rank-number rank-points-highlight">3<\/span>/);
});
