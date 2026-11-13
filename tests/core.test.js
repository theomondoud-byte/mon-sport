import {sportInfo,sourceImage} from '../sports-media.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {makeAgenda,agendaMatches,mergeSpursAndWembanyama,shiftedMonths} from '../agenda-model.js';
import {parseESPNStandings,parseESPNTennisRankings,parseWTTRankings,rankingsForFavorite,rankingRows,mergeATPLiveRows,parseATPLiveSnapshot,filterTennisRankingRows,tournamentColumns,tournamentStatusInColumns,renderOtherRankingTable,fetchRankings,renderRankingsView} from '../rankings-view.js';
import {renderFavoriteRankingDetails,renderFavoriteStats} from '../stats-view.js';
import {createOnceLoader} from '../session-loader.js';
import {newsLastWeek,renderNewsView} from '../news-view.js';
import {isSportsArticle,fetchJeuSetMathsNews,readCachedJeuSetMathsNews,readBundledJeuSetMathsNews,readAvailableJeuSetMathsNews,mergeJeuSetMathsNews,parseJeuSetMathsPosts} from '../sports-articles.js';
import {renderAgendaView} from '../agenda-ui.js';
import {loadEventDetails,renderEventDetails} from '../event-details.js';

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
 assert.match(html,/Club/);
 assert.match(html,/>V<\/span>/);
 assert.match(html,/standings-football/);
 assert.match(html,/PSG/);
 assert.match(html,/class="rank-data rank-number">—<\/span>/);
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
  if(['atp','wta'].includes(id))assert.match(html,/<span class="rank-career">MC<\/span>/);
  else assert.doesNotMatch(html,/<span class="rank-career">MC<\/span>/);
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
 assert.doesNotMatch(html,/<span class="rank-career">MC<\/span>/);
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

test('ITTF : 150 hommes et 150 femmes avec pays, points et variation hebdomadaire',async()=>{
 const payload={fetchedAt:new Date().toISOString(),week:46,source:'https://www.eleventabletennis.com/rankings',
  rows:Array.from({length:150},(_,i)=>({rank:i+1,name:'WTT sportif '+(i+1),
   country:i===2?'FRA':'JPN',points:7600-i,movement:i===2?-1:i===1?1:0}))};
 const rows=parseWTTRankings(payload);
 assert.equal(rows.length,150);
 assert.equal(rows[2].country,'FRA');
 assert.equal(rows[2].movement,-1);
 const requested=[];
 const fetchFn=async url=>{
  requested.push(String(url));
  return {ok:String(url).includes('wtt-'),status:200,json:async()=>payload};
 };
 const live=await fetchRankings({fetchFn,force:true});
 for(const id of ['wtt','wttwomen']){
  assert.equal(live[id].rows.length,150);
  assert.equal(live[id].week,46);
  const html=renderRankingsView({selected:id,live,favorites:[],esc:x=>String(x),safeUrl:x=>x});
  assert.match(html,/standings-tabletennis/);
  assert.match(html,/Pays/);
  assert.match(html,/Δ rang/);
  assert.match(html,/WTT sportif 3/);
  assert.match(html,/▼ 1/);
  assert.match(html,/semaine 46/);
 }
 assert.ok(requested.includes('./data/wtt-men.json'));
 assert.ok(requested.includes('./data/wtt-women.json'));
 assert.equal(parseWTTRankings({...payload,rows:payload.rows.slice(0,149)}),null);
});

test('tennis mobile : MC et joueur séparés, drapeau toujours visible',()=>{
 const html=renderRankingsView({selected:'atp',live:{atp:{
  rows:[{rank:3,name:'Félix Exemple',country:'FRA',age:21,careerHigh:'MC',
   livePoints:4200,movement:1,pointsChange:40}],
  live:true,asOf:new Date().toISOString()}},favorites:[],esc:x=>String(x),safeUrl:x=>x});
 assert.match(html,/<span class="rank-career">MC<\/span>/);
 assert.match(html,/class="atp-career best"/);
 assert.match(html,/class="rank-flag-mobile"/);
 assert.match(html,/🇫🇷/);
 assert.match(html,/class="rank-person" title="Félix Exemple"/);
 assert.doesNotMatch(html,/rank-career-inline/);
});

test('toutes les colonnes ATP et Race du favori sont détaillées dans Stats',()=>{
 const date=new Date().toISOString();
 const rankings={
  atp:{rows:[{rank:2,name:'Jannik Sinner',careerHigh:'MC',age:25,country:'ITA',
   livePoints:11020,movement:1,pointsChange:500,tournament:'Finales ATP RR',
   previousTournaments:'Défaite Paris SF',tournamentStatus:'en_lice',
   nextPoints:11200,maxPoints:11500}],asOf:date,live:true},
  atprace:{rows:[{rank:1,name:'Jannik Sinner',age:25,country:'ITA',livePoints:9820,
   movement:3,pointsChange:240,tournament:'Finales ATP RR',
   previousTournaments:'Paris DF',nextPoints:9990,maxPoints:10400}],asOf:date,live:true}
 };
 const esc=s=>String(s).replaceAll('<','&lt;');
 const html=renderFavoriteStats({favorite:'Jannik Sinner',favoriteData:{name:'Jannik Sinner',sport:'Tennis'},
  now:new Date(),rankings,esc,safeUrl:x=>x});
 assert.match(html,/Classements et statistiques/);
 assert.match(html,/ATP live/);
 assert.match(html,/Race ATP live/);
 for(const text of ['11020','11200','11500','9820','9990','10400','Finales ATP RR','Défaite Paris SF',
 'Meilleur classement','Pays','Variation du rang','Variation des points','Tournoi précédent'])
  assert.ok(html.includes(text),text);
 assert.match(html,/data-view-ranking="atp"/);
 assert.match(html,/data-view-ranking="atprace"/);
 assert.doesNotMatch(html,/ATP, WTA, Next Gen, Race et ITTF : relevés du/);
});

test('Stats d’un club : intégrer tous les champs de football ESPN',()=>{
 const html=renderFavoriteRankingDetails({favorite:'PSG',rankingId:'ligue1',
  rankings:{ligue1:{rows:[{name:'Paris Saint-Germain',rank:1,group:'Ligue 1',
   points:'24',played:'12',wins:'8',draws:'0',losses:'4',goalsFor:'27',goalsAgainst:'11',
   diff:'+16',rankChange:'2'}],live:true,asOf:new Date().toISOString()}},
  esc:x=>String(x),safeUrl:x=>x});
 for(const value of ['Points','Matchs joués','Victoires','Matchs nuls','Défaites',
  'Buts marqués','Buts encaissés','Différence de buts','Variation du rang','+2','27','11'])
  assert.ok(html.includes(value),value);
 assert.match(html,/data-view-ranking="ligue1"/);
 assert.match(html,/Source/);
});

test('Stats d’un sportif NBA/football : préciser le classement collectif',()=>{
 const rankings={
  nbaouest:{rows:[{name:'San Antonio Spurs',rank:5,wins:'9',losses:'4',pct:'.692',
   gamesBehind:'2.5',streak:'W3',lastTen:'7-3',home:'5-2',away:'4-2',
   avgPointsFor:'118.5',avgPointsAgainst:'113.1',avgDiff:'+5.4'}],asOf:new Date().toISOString()},
  liga:{rows:[{name:'Real Madrid',rank:3,points:'28',wins:'9',draws:'1',losses:'2'}],asOf:new Date().toISOString()}
 };
 const w=renderFavoriteRankingDetails({favorite:'Victor Wembanyama',rankingId:'nbaouest',
  rankings,esc:x=>String(x),safeUrl:x=>x});
 assert.match(w,/Classement de son équipe : San Antonio Spurs/);
 for(const value of ['69,2','2.5','10 derniers matchs','5-2','4-2','118.5','113.1','Différence moyenne'])
  assert.ok(w.includes(value),value);
 const m=renderFavoriteRankingDetails({favorite:'Kylian Mbappé',rankingId:'liga',
  rankings,esc:x=>String(x),safeUrl:x=>x});
 assert.match(m,/Classement de son équipe : Real Madrid/);
 assert.match(m,/>28<\/b>/);
});

test('ITTF : le rang et les variations hebdomadaires alimentent Stats',()=>{
 const html=renderFavoriteRankingDetails({favorite:'Félix Lebrun',rankingId:'wtt',
  rankings:{wtt:{rows:[{name:'Félix Lebrun',rank:3,country:'FRA',points:'6859',movement:-1}],
   week:46,asOf:new Date().toISOString(),live:true}},
  esc:x=>String(x),safeUrl:x=>x});
 assert.match(html,/Classement ITTF hebdomadaire/);
 assert.match(html,/semaine 46/);
 assert.match(html,/6859/);
 assert.match(html,/Évolution hebdomadaire/);
 assert.match(html,/>-1<\/b>/);
});

test('Stats : absence de données classées n’affiche pas de faux rangs',()=>{
 const html=renderFavoriteRankingDetails({favorite:'PSG',rankingId:'ucl',rankings:{},
  esc:x=>String(x),safeUrl:x=>x});
 assert.match(html,/Données du classement indisponibles/);
 assert.doesNotMatch(html,/Rang.*#0/);
});

test('un favori personnalisé retrouve ses classements exacts, y compris ITTF femmes',()=>{
 const live={
  wttwomen:{rows:[{name:'Wang Manyu',rank:1,points:'9265',country:'CHN',movement:0}],
   week:46,asOf:new Date().toISOString(),live:true},
  liga:{rows:[{name:'Club ajouté',rank:10,wins:'3',points:'15'}],asOf:new Date().toISOString(),live:true}
 };
 assert.deepEqual(rankingsForFavorite({name:'Wang Manyu',sport:'Tennis de table'},live),['wttwomen']);
 assert.deepEqual(rankingsForFavorite({name:'Club ajouté',sport:'Football'},live),['liga']);
 const rendered=renderFavoriteStats({favorite:'Wang Manyu',favoriteData:{name:'Wang Manyu',sport:'Tennis de table'},
  rankings:live,now:new Date(),esc:x=>String(x),safeUrl:x=>x});
 assert.match(rendered,/WTT femmes/);
 assert.match(rendered,/9265/);
 assert.match(rendered,/data-view-ranking="wttwomen"/);
});

test('Stats : une ancienne liste WTT non chargée ne se substitue pas au classement hebdomadaire',()=>{
 const html=renderFavoriteRankingDetails({favorite:'Félix Lebrun',rankingId:'wtt',
  rankings:{},esc:x=>String(x),safeUrl:x=>x});
 assert.match(html,/Données du classement indisponibles/);
 assert.doesNotMatch(html,/6859/);
});

test('chargement de session : une seule requête pour plusieurs ouvertures d’onglets',async()=>{
 let calls=0;
 const loader=createOnceLoader(async force=>{
  calls++;
  await Promise.resolve();
  return force?'actualisé':'chargé';
 });
 const results=await Promise.all([loader(),loader(),loader()]);
 assert.deepEqual(results,['chargé','chargé','chargé']);
 assert.equal(calls,1);
 await loader();await loader();
 assert.equal(calls,1,'Aucun nouveau chargement lors de la navigation');
 assert.equal(await loader(true),'actualisé','Actualisation manuelle disponible');
 assert.equal(calls,2);
 await loader();
 assert.equal(calls,2);
});

test('échec réseau : ne pas boucler au changement d’onglet, rafraîchissement manuel possible',async()=>{
 let tries=0;
 const loader=createOnceLoader(async()=>{tries++;throw Error('réseau');});
 await assert.rejects(loader(),/réseau/);
 await loader();assert.equal(tries,1);
 await assert.rejects(loader(true),/réseau/);
 assert.equal(tries,2);
});

test('Stats ATP/Race : profil et tournoi communs affichés une seule fois',()=>{
 const snapshot=new Date().toISOString();
 const primary={name:'Jannik Sinner',age:25,country:'ITA',rank:1,livePoints:10500,
  careerHigh:'MC',movement:2,pointsChange:230,
  tournament:'Finales ATP RR',previousTournaments:'Défaite Paris SF',
  nextPoints:10600,maxPoints:11000};
 const html=renderFavoriteStats({favorite:'Jannik Sinner',favoriteData:{name:'Jannik Sinner',sport:'Tennis'},
  rankings:{atp:{rows:[primary],asOf:snapshot,live:true},
   atprace:{rows:[{...primary,rank:2,livePoints:9200,nextPoints:9300,maxPoints:9750}],
     asOf:snapshot,live:true}},
  now:new Date(),esc:x=>String(x),safeUrl:x=>x});
 const count=part=>html.split(part).length-1;
 assert.equal(count('<span>Tournoi en cours</span>'),1);
 assert.equal(count('<span>Tournoi précédent</span>'),1);
 assert.equal(count('<span>Âge</span>'),1);
 assert.equal(count('<span>Pays</span>'),1);
 assert.equal(count('Finales ATP RR'),1);
 assert.ok(html.includes('10500')&&html.includes('9200'));
 assert.ok(html.includes('10600')&&html.includes('9300'));
 assert.equal(count('<span>Points live</span>'),2,'Points propres à chaque classement conservés');
 assert.doesNotMatch(html,/<b>—<\/b>/,'Ne pas multiplier les cases vides');
});

test('Stats football : ne plus répéter le nom de club dans une tuile Équipe',()=>{
 const html=renderFavoriteRankingDetails({favorite:'PSG',rankingId:'ligue1',
  rankings:{ligue1:{rows:[{name:'Paris Saint-Germain',rank:1,points:'25',played:'12',wins:'8'}],
    asOf:new Date().toISOString(),live:true}},esc:x=>String(x),safeUrl:x=>x});
 assert.doesNotMatch(html,/<span>Équipe<\/span>/);
 assert.match(html,/<span>Victoires \(V\)<\/span>/);
 assert.doesNotMatch(html,/<b>—<\/b>/);
});

test('Spurs et Wembanyama : un seul événement par identifiant ESPN, statistiques conservées',()=>{
 const team={
  id:'espn-401999001',espnEventId:'401999001',leaguePath:'basketball/nba',
  favorite:'San Antonio Spurs',home:'San Antonio Spurs',away:'Chicago Bulls',
  date:'2026-11-11T22:00:00Z',homeScore:124,awayScore:119,
  status:'Terminé',competition:'NBA',source:'ESPN NBA'
 };
 const player={
  type:'nba',id:'wemby-espn-401999001',espnEventId:'401999001',leaguePath:'basketball/nba',
  favorite:'Victor Wembanyama',title:'San Antonio Spurs — Chicago Bulls',
  date:team.date,status:'Terminé',stats:{pts:'32',reb:'13',ast:'6',blk:'4'}
 };
 const combined=mergeSpursAndWembanyama([team],[player],'Victor Wembanyama');
 assert.equal(combined.length,1);
 assert.equal(combined[0].stats.pts,'32');
 assert.ok(combined[0].additionalFavorites.includes('Victor Wembanyama'));
 const events=makeAgenda({teams:combined,individuals:[player]});
 assert.equal(events.length,1,'La même rencontre est fusionnée, pas répétée');
 assert.equal(events[0].type,'team');
 assert.equal(events[0].score,'124 – 119');
 assert.equal(events[0].stats.pts,'32');
 assert.ok(events[0].favorites.includes('San Antonio Spurs'));
 assert.ok(events[0].favorites.includes('Victor Wembanyama'));
 assert.equal(agendaMatches(events,{view:'favori',phase:'past',favorite:'Victor Wembanyama',
  now:new Date('2026-11-13T12:00:00Z')}).length,1);
 const html=renderAgendaView({view:'favori',phase:'past',favorite:'Victor Wembanyama',
  favorites:[{name:'San Antonio Spurs',sport:'Basketball'},{name:'Victor Wembanyama',sport:'Basketball'}],
  items:events,photos:{},rankings:{},esc:x=>String(x),safeUrl:x=>x,now:new Date('2026-11-13T12:00:00Z')});
 assert.match(html,/124 – 119/);
 assert.match(html,/32/);
 assert.match(html,/13/);
 assert.equal((html.match(/data-event-detail=/g)||[]).length,1);
});

test('Wembanyama : présence non confirmée lorsque le match Spurs n’a pas de feuille individuelle',()=>{
 const team={id:'espn-401999002',espnEventId:'401999002',leaguePath:'basketball/nba',
  favorite:'San Antonio Spurs',home:'San Antonio Spurs',away:'Utah Jazz',
  date:'2026-11-15T18:00:00Z',status:'À venir',competition:'NBA'};
 const row=mergeSpursAndWembanyama([team],[],'Victor Wembanyama')[0];
 assert.equal(row.wembanyamaUnconfirmed,true);
 const events=makeAgenda({teams:[row]});
 const html=renderAgendaView({view:'favori',phase:'future',favorite:'Victor Wembanyama',
  favorites:[{name:'Victor Wembanyama',sport:'Basketball'}],items:events,photos:{},rankings:{},
  esc:x=>String(x),safeUrl:x=>x,now:new Date('2026-11-13T12:00:00Z')});
 assert.match(html,/participation de Wembanyama n’est pas confirmée/);
 assert.equal((html.match(/data-event-detail=/g)||[]).length,1);
});

test('Jeu Set et Maths : uniquement les posts vérifiés et datés dans les articles',async()=>{
 const date=new Date('2026-11-13T10:00:00Z').toISOString();
 const raw={source:'https://x.com/JeuSetMaths',posts:[
  {title:'📊 Statistique du jour en tennis et classement ATP',
   date,link:'https://x.com/JeuSetMaths/status/2120668453770305629',image:null},
  {title:'Ceci ne provient pas du compte',
   date,link:'https://x.com/Imposteur/status/2120668453770305629'},
  {title:'📊 Annonce vieille de la semaine dernière',
   date:'2026-10-30T10:00:00Z',link:'https://x.com/JeuSetMaths/status/2120068453770305629'}
 ]};
 const posts=await fetchJeuSetMathsNews({
  fetchFn:async()=>({ok:true,json:async()=>raw}),
  now:new Date('2026-11-13T12:00:00Z')
 });
 assert.ok(posts.length>=20,'Le relevé intégré complète le post fourni');
 assert.ok(posts.every(p=>p.source==='Jeu, set et maths'));
 assert.ok(posts.every(p=>/^https:\/\/x\.com\/JeuSetMaths\/status\//.test(p.link)));
 assert.ok(posts.some(p=>p.link===raw.posts[0].link));
 assert.ok(posts.every(p=>!p.link.includes('Imposteur')));
 const feed=newsLastWeek(posts,new Date('2026-11-13T12:00:00Z'));
 assert.ok(feed.length>=20);
});

test('aucun rechargement spontané de page lors du remplacement du service worker',async()=>{
 const {readFile}=await import('node:fs/promises');
 const source=await readFile(new URL('../src.js',import.meta.url),'utf8');
 assert.doesNotMatch(source,/controllerchange[\s\S]{0,150}location\.reload\(/);
 assert.match(source,/async function forceUpdate\(/,'Rechargement volontaire reste accessible');
 assert.match(source,/location\.replace\(url\.href\)/);
});

test('détail NBA fusionné : les chiffres individuels portent le nom de Wembanyama',async()=>{
 const event={
  favorite:'San Antonio Spurs',type:'team',title:'San Antonio Spurs — Chicago Bulls',
  leaguePath:'basketball/nba',espnEventId:'401998881',
  origin:{leaguePath:'basketball/nba',espnEventId:'401998881',
   favorite:'San Antonio Spurs',wembanyamaName:'Victor Wembanyama',
   stats:{pts:'29',reb:'12',ast:'5',blk:'4'}}
 };
 const details=await loadEventDetails(event,{fetchFn:async()=>({ok:true,json:async()=>({
  boxscore:{teams:[],players:[]},header:{competitions:[]}
 })})});
 const html=renderEventDetails(details,x=>String(x));
 assert.match(html,/Victor Wembanyama/);
 assert.match(html,/Points/);
 assert.match(html,/>29<\/b>/);
 assert.match(html,/>12<\/b>/);
 assert.doesNotMatch(html,/San Antonio Spurs<\/b><div class="detail-metrics">/);
});

test('service worker : mise à jour différée sans prise de contrôle de la page ouverte',async()=>{
 const {readFile}=await import('node:fs/promises');
 const source=await readFile(new URL('../sw.js',import.meta.url),'utf8');
 assert.doesNotMatch(source,/await self\.clients\.claim\(/);
 assert.match(source,/skipWaiting\(/);
});

test('détail d’un ancien match : Wembanyama est recherché dans la feuille, sans attribuer les chiffres d’autrui',async()=>{
 const event={
  type:'team',favorite:'San Antonio Spurs',favorites:['San Antonio Spurs','Victor Wembanyama'],
  origin:{leaguePath:'basketball/nba',espnEventId:'401999888'},
  leaguePath:'basketball/nba',espnEventId:'401999888'
 };
 const body={boxscore:{teams:[],players:[{statistics:[{labels:['PTS','REB','AST','BLK'],
  athletes:[
   {athlete:{displayName:'Autre joueur'},stats:['37','12','6','2']},
   {athlete:{displayName:'Victor Wembanyama'},stats:['27','11','3','5']}
  ]}]}]}};
 const details=await loadEventDetails(event,{fetchFn:async()=>({ok:true,json:async()=>body})});
 assert.deepEqual(details.players.map(x=>x.name),['Victor Wembanyama']);
 const html=renderEventDetails(details,x=>String(x));
 assert.match(html,/Victor Wembanyama/);
 assert.match(html,/>27<\/b>/);
 assert.doesNotMatch(html,/Autre joueur/);
});

test('Jeu, set et maths : texte complet et toutes les images sans fenêtre X ni Voir plus',()=>{
 const post={title:'📊 Statistiques tennis : un bref titre…',
  text:'📊 Tableau des performances au Masters\n2001 : Serena Williams\n2008 : Venus Williams\n2026 : Mirra Andreeva',
  date:'2026-11-12T13:00:00Z',link:'https://x.com/JeuSetMaths/status/2120668453770305629',
  source:'Jeu, set et maths',favorite:'Jeu, set et maths',sport:'Tennis',
  images:['https://pbs.twimg.com/media/a.jpg?name=orig','https://pbs.twimg.com/media/b.png?name=orig'],
  video:'https://video.twimg.com/amplify_video/2120297845689638912/vid/avc1/1080x598/example.mp4?tag=29'};
 const html=renderNewsView({news:[post],now:new Date('2026-11-13T12:00:00Z'),
  esc:x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),
  safeUrl:x=>x,photos:{}});
 assert.match(html,/<article class="news-card jsm-native-card">/);
 assert.match(html,/class="jsm-native-text"/);
 assert.match(html,/2001 : Serena Williams/);
 assert.match(html,/2008 : Venus Williams/);
 assert.match(html,/2026 : Mirra Andreeva/);
 assert.equal((html.match(/class="jsm-native-image"/g)||[]).length,2);
 assert.match(html,/class="jsm-native-video" controls playsinline/);
 assert.match(html,/Source originale/);
 assert.doesNotMatch(html,/Voir plus|Voir moins|<details|<iframe|news-x-viewport|data-x-expand/);
 assert.doesNotMatch(html,/class="news-plain-link"[^>]*href="https:\/\/x\.com/);
});

test('Ancien relevé X : affiche le titre sans inventer de contenu manquant',()=>{
 const post={title:'📊 Une statistique ATP vérifiée',date:'2026-11-12T13:00:00Z',
  link:'https://x.com/JeuSetMaths/status/2120668453770305629',source:'Jeu, set et maths',sport:'Tennis'};
 const html=renderNewsView({news:[post],now:new Date('2026-11-13T12:00:00Z'),
  esc:x=>String(x),safeUrl:x=>x,photos:{}});
 assert.match(html,/Seul le court extrait est actuellement disponible/);
 assert.doesNotMatch(html,/Voir plus|<iframe/);
});

test('Autres médias : conserver la carte de lien éditeur classique',()=>{
 const post={title:'Article sportif PSG et Ligue 1',
  date:'2026-11-12T13:00:00Z',link:'https://www.espn.com/soccer/',
  source:'ESPN',favorite:'PSG',sport:'Football'};
 const html=renderNewsView({news:[post],now:new Date('2026-11-13T12:00:00Z'),
  esc:x=>String(x),safeUrl:x=>x,photos:{}});
 assert.match(html,/class="news-card news-link-card"/);
 assert.match(html,/Lire l’article chez l’éditeur/);
 assert.doesNotMatch(html,/class="news-post-card"/);
});

test('Aucun widget X ni bouton qui ouvre la plateforme dans les posts',async()=>{
 const {readFile}=await import('node:fs/promises');
 const source=await readFile(new URL('../news-view.js',import.meta.url),'utf8');
 assert.doesNotMatch(source,/platform\.twitter\.com|createTweet|IntersectionObserver|data-x-expand|news-x-viewport/);
 assert.match(source,/jsm-native-gallery/);
 assert.match(source,/jsm-native-video/);
 const app=await readFile(new URL('../src.js',import.meta.url),'utf8');
 assert.doesNotMatch(app,/mountNewsFrames/);
});

test('Mobile : posts Jeu Set Maths conservés si le réseau se coupe, dans les 7 jours',async()=>{
 const now=new Date('2026-11-13T12:00:00Z');
 const raw={source:'https://x.com/JeuSetMaths',posts:[{
  title:'📊 Classement ATP et statistiques de tennis',
  text:'📊 Tableau tennis\\n\\n▪️ 2001 : Serena Williams\\n↪️ Finale',
  date:'2026-11-12T11:00:00Z',link:'https://x.com/JeuSetMaths/status/2120668453770305629',
  images:['https://pbs.twimg.com/media/graph.jpg?name=orig']
 }]};
 const values=new Map(),storage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};
 const online=await fetchJeuSetMathsNews({now,storage,fetchFn:async()=>({ok:true,json:async()=>raw})});
 assert.ok(online.length>=20,'Le module embarqué contient déjà les posts réels');
 assert.ok(online.some(p=>p.link===raw.posts[0].link));
 assert.equal(readCachedJeuSetMathsNews({now,storage}).length,1);
 const offline=await fetchJeuSetMathsNews({now,storage,fetchFn:async()=>{throw Error('hors ligne');}});
 assert.deepEqual(offline,online);
 const httpFailed=await fetchJeuSetMathsNews({now,storage,fetchFn:async()=>({ok:false,status:503})});
 assert.deepEqual(httpFailed,online);
 assert.deepEqual(readCachedJeuSetMathsNews({now:new Date('2026-12-01'),storage}),[]);
 assert.deepEqual(parseJeuSetMathsPosts({...raw,source:'https://x.com/Imposteur'},now),[]);
});

test('Mobile : les posts statistiques restent visibles même avec 90 actualités de favoris',()=>{
 const now=new Date('2026-11-13T12:00:00Z');
 const others=Array.from({length:90},(_,i)=>({
  title:'Le PSG marque un but numéro '+i,link:'https://espn.com/story/'+i,
  date:new Date(now.getTime()-i*60*1000).toISOString(),
  source:'ESPN',favorite:'PSG',sport:'Football'
 }));
 const maths=Array.from({length:15},(_,i)=>({
  title:'📊 Tennis : classement officiel numéro '+i,
  link:'https://x.com/JeuSetMaths/status/'+String(2120668453770305629n-BigInt(i)),
  date:new Date(now.getTime()-(i+100)*60000).toISOString(),
  source:'Jeu, set et maths',sport:'Tennis'
 }));
 const feed=newsLastWeek([...others,...maths],now);
 assert.equal(feed.filter(x=>x.source==='Jeu, set et maths').length,15);
 assert.ok(feed.length<=85);
});

test('Android : les posts se chargent indépendamment des scores ESPN',async()=>{
 const {readFile}=await import('node:fs/promises');
 const app=await readFile(new URL('../src.js',import.meta.url),'utf8');
 assert.match(app,/let jeuSetMathsPosts=readAvailableJeuSetMathsNews\(\)/);
 assert.match(app,/function loadJeuSetMathsPosts\(\)/);
 assert.match(app,/news:\[\.\.\.news,\.\.\.jeuSetMathsPosts\]/);
 assert.match(app,/refresh\(\),\s*loadJeuSetMathsPosts\(\),\s*refreshHistory\(\)/);
 const sw=await readFile(new URL('../sw.js',import.meta.url),'utf8');
 assert.match(sw,/\.\/data\/jeu-set-et-maths\.json/);
 assert.match(sw,/\.\/data\/jeu-set-et-maths-bundle\.js\?v=15\.6\.0/);
 const css=await readFile(new URL('../style.css',import.meta.url),'utf8');
 assert.match(css,/\.jsm-native-text\{white-space:pre-line/);
});

test('Android : les publications réelles sont visibles immédiatement sans appel réseau ni stockage',async()=>{
 const now=new Date('2026-11-13T15:00:00Z');
 const snapshot=readBundledJeuSetMathsNews({now});
 assert.ok(snapshot.length>=15,'Relevé vérifié de 20 posts intégré dans le JS');
 assert.ok(snapshot.every(p=>p.source==='Jeu, set et maths'&&p.text));
 const offline=readAvailableJeuSetMathsNews({now,storage:{getItem(){throw Error('stockage interdit')}}});
 assert.equal(offline.length,snapshot.length);
 const viaFetch=await fetchJeuSetMathsNews({
  now,storage:null,fetchFn:async()=>{throw Error('réseau mobile indisponible')}
 });
 assert.deepEqual(viaFetch,snapshot);
 const html=renderNewsView({news:snapshot,now,loading:false,esc:x=>String(x),safeUrl:x=>x,photos:{}});
 assert.match(html,/Jeu, set et maths : <b>20 publications<\/b>/);
 assert.ok((html.match(/class="news-card jsm-native-card"/g)||[]).length>=15);
 assert.match(html,/id="jsmRefresh"/);
 assert.doesNotMatch(html,/<iframe/);
});

test('Mobile : même avec d’autres articles, 3 posts X apparaissent immédiatement en premier',()=>{
 const now=new Date('2026-11-13T15:00:00Z');
 const articles=Array.from({length:35},(_,i)=>({
  title:'Le PSG gagne un match de championnat '+i,
  link:'https://espn.com/soccer/story/'+i,date:new Date(now.getTime()-i*60000).toISOString(),
  source:'ESPN',sport:'Football',favorite:'PSG'
 }));
 const posts=readBundledJeuSetMathsNews({now});
 const html=renderNewsView({news:[...articles,...posts],now,esc:x=>String(x),safeUrl:x=>x,photos:{}});
 const posJsm=html.indexOf('class="news-card jsm-native-card"');
 const posArticle=html.indexOf('class="news-card news-link-card"');
 assert.ok(posJsm>=0&&posArticle>posJsm);
 assert.ok((html.match(/class="news-card jsm-native-card"/g)||[]).length>=15);
});

test('Source intégrée : les valeurs obsolètes ne sont pas présentées comme récentes',()=>{
 const data=readBundledJeuSetMathsNews({now:new Date('2027-01-01T12:00:00Z')});
 assert.deepEqual(data,[]);
 assert.deepEqual(mergeJeuSetMathsNews([],[]),[]);
});

test('Workflow maintient à jour le module de secours des publications',async()=>{
 const {readFile}=await import('node:fs/promises');
 const workflow=await readFile(new URL('../.github/workflows/atp-live.yml',import.meta.url),'utf8');
 assert.match(workflow,/scripts\/build_jeu_set_maths_bundle\.py/);
 assert.match(workflow,/data\/jeu-set-et-maths-bundle\.js/);
 const source=await readFile(new URL('../sports-articles.js',import.meta.url),'utf8');
 assert.match(source,/import \{jeuSetMathsBundledData\}/);
});
