import {sportInfo,sourceImage} from '../sports-media.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {makeAgenda,agendaMatches,mergeSpursAndWembanyama,shiftedMonths} from '../agenda-model.js';
import {parseESPNStandings,parseESPNTennisRankings,parseWTTRankings,rankingsForFavorite,rankingRows,mergeATPLiveRows,parseATPLiveSnapshot,filterTennisRankingRows,tournamentColumns,tournamentStatusInColumns,renderOtherRankingTable,fetchRankings,renderRankingsView} from '../rankings-view.js';
import {renderFavoriteRankingDetails,renderFavoriteStats} from '../stats-view.js';
import {createOnceLoader} from '../session-loader.js';
import {renderBlocks as renderBlocksForTest} from '../news-view.js';
import {newsLastWeek,renderNewsView,safeExcerpt,decodeEntities,articleParagraphs,findFavorite,relevantFavoriteNews,htmlToText,htmlToBlocks,matchSummaryArticle,limitPerMatch} from '../news-view.js';
import {isSportsArticle,fetchJeuSetMathsNews,readCachedJeuSetMathsNews,readBundledJeuSetMathsNews,readAvailableJeuSetMathsNews,mergeJeuSetMathsNews,parseJeuSetMathsPosts} from '../sports-articles.js';
import {renderAgendaView} from '../agenda-ui.js';
import {jeuSetMathsBundledData} from '../data/jeu-set-et-maths-bundle.js';
// Le relevé embarqué est rafraîchi par la collecte automatique : les tests qui
// le lisent se placent une heure après sa publication la plus récente.
const BUNDLE_NOW=new Date(Math.max(...(jeuSetMathsBundledData.posts||[]).map(p=>Date.parse(p.date)).filter(Number.isFinite))+3600000);
const BUNDLE_COUNT=readBundledJeuSetMathsNews({now:BUNDLE_NOW}).length;
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
 const now=BUNDLE_NOW;
 const date=new Date(now.getTime()-2*3600000).toISOString();
 const raw={source:'https://x.com/JeuSetMaths',posts:[
  {title:'📊 Statistique du jour en tennis et classement ATP',
   date,link:'https://x.com/JeuSetMaths/status/2120668453770305629',image:null},
  {title:'Ceci ne provient pas du compte',
   date,link:'https://x.com/Imposteur/status/2120668453770305629'},
  {title:'📊 Annonce vieille de deux semaines',
   date:new Date(now.getTime()-14*86400000).toISOString(),link:'https://x.com/JeuSetMaths/status/2120068453770305629'}
 ]};
 const posts=await fetchJeuSetMathsNews({fetchFn:async()=>({ok:true,json:async()=>raw}),now});
 assert.ok(BUNDLE_COUNT>=5,'Le relevé embarqué contient des posts récents');
 assert.ok(posts.length>=BUNDLE_COUNT,'Le relevé intégré complète le post fourni');
 assert.ok(posts.every(p=>p.source==='Jeu, set et maths'));
 assert.ok(posts.every(p=>/^https:\/\/x\.com\/JeuSetMaths\/status\//.test(p.link)));
 assert.ok(posts.some(p=>p.link===raw.posts[0].link));
 assert.ok(posts.every(p=>!p.link.includes('Imposteur')));
 const feed=newsLastWeek(posts,now);
 assert.equal(feed.length,Math.min(25,posts.length));
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
 assert.match(html,/referrerpolicy="no-referrer"/);
 assert.match(html,/<source src="https:\/\/video\.twimg\.com\/amplify_video\/2120297845689638912\/vid\/avc1\/1080x598\/example\.mp4\?tag=29" type="video\/mp4"/);
 assert.match(html,/<source src="https:\/\/video\.twimg\.com\/amplify_video\/2120297845689638912\/vid\/avc1\/1080x598\/example\.mp4" type="video\/mp4"/);
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
 const post={title:'Ligue 1 : le PSG s’impose 2-0 face à Lens',
  date:'2026-11-12T13:00:00Z',link:'https://www.espn.com/soccer/',
  source:'ESPN',favorite:'PSG',sport:'Football'};
 const html=renderNewsView({news:[post],now:new Date('2026-11-13T12:00:00Z'),
  esc:x=>String(x),safeUrl:x=>x,photos:{},favorites:[{name:'PSG',sport:'Football'}]});
 assert.match(html,/class="news-read-inline"|Lire dans Mon Sport/);
 assert.match(html,/Lire dans Mon Sport/);
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
 const now=BUNDLE_NOW;
 const raw={source:'https://x.com/JeuSetMaths',posts:[{
  title:'📊 Classement ATP et statistiques de tennis',
  text:'📊 Tableau tennis\\n\\n▪️ 2001 : Serena Williams\\n↪️ Finale',
  date:new Date(now.getTime()-24*3600000).toISOString(),link:'https://x.com/JeuSetMaths/status/2120668453770305629',
  images:['https://pbs.twimg.com/media/graph.jpg?name=orig']
 }]};
 const values=new Map(),storage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};
 const online=await fetchJeuSetMathsNews({now,storage,fetchFn:async()=>({ok:true,json:async()=>raw})});
 assert.ok(online.length>=BUNDLE_COUNT,'Le module embarqué contient déjà les posts réels');
 assert.ok(online.some(p=>p.link===raw.posts[0].link));
 assert.equal(readCachedJeuSetMathsNews({now,storage}).length,1);
 const offline=await fetchJeuSetMathsNews({now,storage,fetchFn:async()=>{throw Error('hors ligne');}});
 assert.deepEqual(offline,online);
 const httpFailed=await fetchJeuSetMathsNews({now,storage,fetchFn:async()=>({ok:false,status:503})});
 assert.deepEqual(httpFailed,online);
 assert.deepEqual(readCachedJeuSetMathsNews({now:new Date(now.getTime()+20*86400000),storage}),[]);
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
 assert.ok(feed.length<=100);
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
 assert.match(sw,/\.\/data\/jeu-set-et-maths-bundle\.js\?v=/);
 const css=await readFile(new URL('../style.css',import.meta.url),'utf8');
 assert.match(css,/\.jsm-native-text\{white-space:pre-line/);
});

test('Android : les publications réelles sont visibles immédiatement sans appel réseau ni stockage',async()=>{
 const now=BUNDLE_NOW;
 const snapshot=readBundledJeuSetMathsNews({now});
 assert.ok(snapshot.length>=5,'Relevé vérifié intégré dans le JS');
 assert.ok(snapshot.every(p=>p.source==='Jeu, set et maths'&&p.text));
 const offline=readAvailableJeuSetMathsNews({now,storage:{getItem(){throw Error('stockage interdit')}}});
 assert.equal(offline.length,snapshot.length);
 const viaFetch=await fetchJeuSetMathsNews({
  now,storage:null,fetchFn:async()=>{throw Error('réseau mobile indisponible')}
 });
 assert.deepEqual(viaFetch,snapshot);
 const html=renderNewsView({news:snapshot,now,loading:false,esc:x=>String(x),safeUrl:x=>x,photos:{}});
 assert.ok(html.includes('Jeu, set et maths : <b>'+snapshot.length+' publications</b>'));
 assert.equal((html.match(/class="news-card jsm-native-card"/g)||[]).length,BUNDLE_COUNT);
 assert.match(html,/id="jsmRefresh"/);
 assert.doesNotMatch(html,/<iframe/);
});

test('Mobile : même avec d’autres articles, 3 posts X apparaissent immédiatement en premier',()=>{
 const now=BUNDLE_NOW;
 const articles=Array.from({length:35},(_,i)=>({
  title:'Le PSG gagne un match de championnat '+i,
  link:'https://espn.com/soccer/story/'+i,date:new Date(now.getTime()-i*60000).toISOString(),
  source:'ESPN',sport:'Football',favorite:'PSG'
 }));
 const posts=readBundledJeuSetMathsNews({now});
 const html=renderNewsView({news:[...articles,...posts],now,esc:x=>String(x),safeUrl:x=>x,photos:{},favorites:[{name:'PSG',sport:'Football'}]});
 const posJsm=html.indexOf('class="news-card jsm-native-card"');
 const posArticle=html.indexOf('class="news-card news-link-card');
 assert.ok(posJsm>=0&&posArticle>=0);
 assert.equal((html.match(/class="news-card jsm-native-card"/g)||[]).length,BUNDLE_COUNT);
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

test('V15.7 : un même sujet publié par deux médias ne remplit qu’une carte',()=>{
 const now=new Date('2026-11-13T12:00:00Z');
 const items=[
  {title:'Victor Wembanyama inscrit 40 points face aux Lakers',
   date:'2026-11-13T10:00:00Z',link:'https://espn.com/story/wemby-40',
   source:'ESPN',favorite:'Victor Wembanyama',sport:'Basketball',excerpt:'Résumé court.'},
  {title:'Victor Wembanyama marque 40 points contre les Lakers',
   date:'2026-11-13T10:20:00Z',link:'https://basketusa.com/article/wemby-40',
   source:'Basket USA',favorite:'Victor Wembanyama',sport:'Basketball',
   excerpt:'Compte rendu complet de la même rencontre, avec un résumé détaillé et les statistiques.'},
  {title:'Le PSG prépare son prochain match de Ligue 1',
   date:'2026-11-13T09:00:00Z',link:'https://fflose.com/psg-match',
   source:'FFL',favorite:'FFL',sport:'Football'}
 ];
 const result=newsLastWeek(items,now);
 assert.equal(result.length,2);
 assert.ok(result.some(n=>n.source==='Basket USA'));
 assert.ok(result.some(n=>n.source==='FFL'));
});

test('V15.7 : Tous les médias réunis, puis filtre exclusif par média',()=>{
 const now=new Date('2026-11-13T12:00:00Z');
 const posts=[
  {title:'📊 Mirra Andreeva et les statistiques du Masters WTA',
   text:'Mirra Andreeva améliore ses statistiques au tennis.',
   date:'2026-11-13T10:00:00Z',link:'https://x.com/JeuSetMaths/status/2120668453770305629',
   source:'Jeu, set et maths',favorite:'Jeu, set et maths',sport:'Tennis'},
  {title:'Le PSG prépare son prochain match de Ligue 1',
   date:'2026-11-13T09:00:00Z',link:'https://fflose.com/psg-match',
   source:'FFL',favorite:'FFL',sport:'Football'},
  {title:'Victor Wembanyama marque 34 points avec les Spurs',
   date:'2026-11-13T08:00:00Z',link:'https://espn.com/nba/wemby',
   source:'ESPN',favorite:'Victor Wembanyama',sport:'Basketball'}
 ];
 const args={news:posts,now,esc:x=>String(x),safeUrl:x=>x,photos:{},
  favorites:[{name:'Mirra Andreeva',sport:'Tennis',apiName:'Mirra Andreeva'},
   {name:'PSG',sport:'Football',apiName:'Paris Saint Germain'},
   {name:'Victor Wembanyama',sport:'Basketball',apiName:'Victor Wembanyama'}]};
 const all=renderNewsView(args);
 assert.match(all,/data-news-source="FFL"/);
 assert.match(all,/data-news-source="ESPN"/);
 assert.match(all,/data-news-source="Jeu, set et maths"/);
 assert.match(all,/Le PSG prépare/);
 assert.match(all,/Victor Wembanyama marque 34 points/);
 assert.match(all,/Mirra Andreeva améliore ses statistiques/);
 const ffl=renderNewsView({...args,selectedSources:['FFL']});
 assert.match(ffl,/Le PSG prépare/);
 assert.doesNotMatch(ffl,/Victor Wembanyama marque 34 points/);
 assert.doesNotMatch(ffl,/class="news-card jsm-native-card"/);
 const espn=renderNewsView({...args,selectedSources:['ESPN']});
 assert.match(espn,/Victor Wembanyama marque 34 points/);
 assert.doesNotMatch(espn,/Le PSG prépare/);
 assert.doesNotMatch(espn,/class="news-card jsm-native-card"/);
 assert.doesNotMatch(all,/newsSportFilter|newsFavoriteFilter/);
 assert.match(all,/Tri chronologique/);
});

test('V15.8 : la PWA charge les sources RSS et conserve la lecture vidéo X',async()=>{
 const {readFile}=await import('node:fs/promises');
 const index=await readFile(new URL('../index.html',import.meta.url),'utf8');
 assert.match(index,/<meta name="referrer" content="no-referrer"\/>/);
 const sw=await readFile(new URL('../sw.js',import.meta.url),'utf8');
 assert.match(sw,/mon-sport-v\d+-\d+/);
 assert.match(sw,/news-view\.js\?v=/);
 assert.match(sw,/jeu-set-et-maths-bundle\.js\?v=/);
 const app=await readFile(new URL('../src.js',import.meta.url),'utf8');
 assert.match(app,/newsSelectedSources=\[\]/);
 assert.match(app,/data-news-source/);
 assert.match(app,/data-read-article/);
 assert.match(app,/api\/article/);
});

test('V15.8 : les extraits des médias RSS sont lisibles directement dans les cartes',()=>{
 const html=renderNewsView({news:[{
  title:'Paul Seixas remporte le chrono et bat le record de l’épreuve',
  link:'https://www.cyclismactu.net/test',
  date:'2026-11-13T10:00:00.000Z',
  source:"Cyclism'Actu",sport:'Cyclisme',favorite:'Paul Seixas',
  excerpt:'Le jeune coureur français revient sur sa préparation et ses objectifs.'
 }],now:new Date('2026-11-13T12:00:00Z'),
  esc:x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),
  safeUrl:x=>x,photos:{},favorites:[{name:'Paul Seixas',sport:'Cyclisme'}]});
 assert.match(html,/Le jeune coureur français revient sur sa préparation et ses objectifs\./);
 assert.match(html,/Lire dans Mon Sport/);
 assert.match(html,/Cyclism'Actu/);
});

test('V16.1 : une seule version pour tous les fichiers de la PWA',async()=>{
 const {readFile,readdir}=await import('node:fs/promises');
 const root=new URL('../',import.meta.url);
 const {APP_VERSION}=await import('../version.js');
 const sw=await readFile(new URL('sw.js',root),'utf8');
 const index=await readFile(new URL('index.html',root),'utf8');
 const [major,minor]=APP_VERSION.split('.');
 assert.match(sw,new RegExp(`const CACHE = 'mon-sport-v${major}-${minor}'`));
 const modules=(await readdir(root)).filter(f=>f.endsWith('.js')&&f!=='sw.js');
 const requested=new Set();
 for(const file of [...modules,'index.html','sw.js']){
  const text=file==='index.html'?index:file==='sw.js'?sw:await readFile(new URL(file,root),'utf8');
  for(const [,ref,version] of text.matchAll(/\.\/([\w./-]+\.(?:js|css))\?v=(\d+\.\d+\.\d+)/g)){
   assert.equal(version,APP_VERSION,`${file} référence ${ref} en v${version}`);
   if(file!=='sw.js')requested.add(ref);
  }
 }
 // Chaque fichier réellement demandé doit être disponible hors connexion.
 for(const ref of requested)assert.ok(sw.includes(`'./${ref}?v=${APP_VERSION}'`),`${ref} absent du précache`);
});

test('V16.1 : les extraits décodent les entités numériques et compactent les espaces',()=>{
 assert.equal(safeExcerpt('L&#39;équipe   de&#x20;France\n\n gagne'),"L'équipe de France gagne");
});

test('V16.2 : ouverture immédiate avec les dernières données et actualisation en arrière-plan',async()=>{
 const {readFile}=await import('node:fs/promises');
 const app=await readFile(new URL('../src.js',import.meta.url),'utf8');
 assert.match(app,/SNAPSHOT_KEY='monsport-snapshot-v1'/);
 assert.match(app,/lastUpdated=Date\.now\(\);writeSnapshot\(\);/);
 assert.match(app,/setTimeout\(resolve,starting\?4000:0\)/);
 assert.doesNotMatch(app,/setTimeout\(resolve,22000\)/);
 // Pas de rendu en arrière-plan pendant une saisie dans un formulaire.
 assert.match(app,/function softRender\(\)/);
 assert.match(app,/pendingRender=true;return;/);
});

test('V16.3 : entités HTML décodées, même encodées deux fois, côté client et côté Worker',async()=>{
 assert.equal(decodeEntities('L&amp;eacute;quipe r&eacute;ussit &agrave; &amp;#39;x&amp;#39; n&deg;7 &euro;'),"L'équipe réussit à 'x' n°7 €".replace("L'équipe","Léquipe"));
 assert.equal(safeExcerpt('<p>Cl&eacute;ment &agrave; Knoxville … lire la suite</p>'),'Clément à Knoxville');
 const {readFile}=await import('node:fs/promises');
 const worker=await readFile(new URL('../worker/index.js',import.meta.url),'utf8');
 assert.match(worker,/function toBlocks\(html,base\)/);
 assert.match(worker,/"eacute":"é"/);
});

test('V16.3 : le texte intégral est découpé en paragraphes sans la rubrique « À lire aussi »',()=>{
 const text='L&#39;Am&eacute;rique r&eacute;ussit.\n\nEn quart, Draxl (n&deg;7).\nA lire aussi...\nWTA FINALS\nMladenovic joue';
 assert.deepEqual(articleParagraphs(text),["L'Amérique réussit.",'En quart, Draxl (n°7).']);
});

test('V16.3 : un article de tennis n’est jamais lié à l’équipe de France de football',()=>{
 const favorites=[{name:'Équipe de France de football',sport:'Football',apiName:'France'},
  {name:'Arthur Fils',sport:'Tennis',apiName:'Arthur Fils'},{name:'Jannik Sinner',sport:'Tennis',apiName:'Jannik Sinner'}];
 const chidekh={title:'Chidekh peut venger l’équipe de France de Coupe Davis',sport:'Tennis',source:'Tennis Actu',link:'https://www.tennisactu.net/a',date:'2026-11-13T10:00:00Z'};
 assert.equal(findFavorite(chidekh,favorites),null);
 assert.equal(findFavorite({title:'Sinner s’impose à Turin',sport:'Tennis'},favorites)?.name,'Jannik Sinner');
 assert.equal(findFavorite({title:'Les Bleus affrontent l’Ukraine',sport:'Football'},favorites)?.name,'Équipe de France de football');
 // Un favori mal attribué par une ancienne version du relais est ignoré si le sport ne correspond pas.
 assert.equal(findFavorite({...chidekh,favorite:'Équipe de France de football'},favorites),null);
 const html=renderNewsView({news:[chidekh,{title:'Sinner s’impose à Turin',sport:'Tennis',source:'Tennis Actu',link:'https://www.tennisactu.net/b',date:'2026-11-13T09:00:00Z'}],
  now:new Date('2026-11-13T12:00:00Z'),esc:x=>String(x),safeUrl:x=>x,photos:{},favorites});
 assert.doesNotMatch(html,/Chidekh/);
 assert.match(html,/news-favorite[^>]*>⭐ Jannik Sinner/);
});

test('V16.4 : les accents dont le flux a supprimé le « & » sont réparés',()=>{
 assert.equal(safeExcerpt('Cobolli a apporteacute; son soutien agrave; Zverev, reacute;cemment propulseacute; nrsquo;est ndeg;7'),
  'Cobolli a apporté son soutien à Zverev, récemment propulsé n’est n°7');
 assert.equal(decodeEntities('Chidekh &amp;eacute;limine'),'Chidekh élimine');
});

test('V16.4 : seuls les résultats de matchs et les records des favoris sont gardés',()=>{
 const favs=[{name:'Jannik Sinner',sport:'Tennis'},{name:'Victor Wembanyama',sport:'Basketball'},
  {name:'PSG',sport:'Football',apiName:'Paris Saint Germain'},{name:'Léon Marchand',sport:'Natation'}];
 const keep=(title,sport,excerpt='')=>!!relevantFavoriteNews({title,sport,excerpt},favs);
 assert.equal(keep('ATP Finals : Cobolli : "Alcaraz et Sinner restent plus forts que Zverev mais..."','Tennis'),false);
 assert.equal(keep('Sinner affrontera Alcaraz en finale : horaire et chaîne TV','Tennis'),false);
 assert.equal(keep('Wembanyama blessé, forfait contre les Lakers','Basketball'),false);
 assert.equal(keep('Mercato : le PSG prépare une offre pour un attaquant','Football'),false);
 assert.equal(keep('Wembanyama: what to watch tonight vs Lakers','Basketball'),false);
 assert.equal(keep('ATP Finals : Sinner s’impose face à Zverev (6-4, 6-3)','Tennis'),true);
 assert.equal(keep('Victor Wembanyama signe un triple-double historique','Basketball'),true);
 assert.equal(keep('Léon Marchand bat le record du monde du 400 m 4 nages','Natation'),true);
 assert.equal(keep('Ligue 1 : le PSG écrase Lyon (4-0)','Football'),true);
 assert.equal(keep('Spurs beat Lakers as Wembanyama scores 35 points','Basketball'),true);
});

test('V16.4 : articles écartés signalés et affichables, FFL et JSM jamais filtrés',()=>{
 const now=new Date('2026-11-13T12:00:00Z');
 const news=[
  {title:'Sinner affrontera Alcaraz : horaire et chaîne TV',sport:'Tennis',source:'Tennis Actu',link:'https://www.tennisactu.net/a',date:'2026-11-13T10:00:00Z'},
  {title:'Sinner s’impose 6-4 6-3',sport:'Tennis',source:'Tennis Actu',link:'https://www.tennisactu.net/b',date:'2026-11-13T09:00:00Z'},
  {title:'Un joueur rate tout ce qu’il entreprend',source:'FFL',favorite:'FFL',link:'https://fflose.com/x',date:'2026-11-13T08:00:00Z',text:'Premier paragraphe.\nSecond paragraphe.'}];
 const args={news,now,esc:x=>String(x),safeUrl:x=>x,photos:{},favorites:[{name:'Jannik Sinner',sport:'Tennis'}]};
 const html=renderNewsView(args);
 assert.doesNotMatch(html,/horaire et chaîne TV/);
 assert.match(html,/Sinner s’impose/);
 assert.match(html,/1 article sur tes favoris écarté/);
 assert.match(html,/id="newsShowAll"/);
 // FFL : texte complet embarqué, lisible sans le Worker.
 assert.match(html,/data-local-text="1"/);
 assert.match(html,/<p>Premier paragraphe\.<\/p><p>Second paragraphe\.<\/p>/);
 assert.match(renderNewsView({...args,showAllRelated:true}),/horaire et chaîne TV/);
});

test('V16.4 : contenu WordPress converti en paragraphes',()=>{
 assert.equal(htmlToText('<p>Il a rat&eacute; <strong>tout</strong>.</p><figure><img src="x"><figcaption>Légende</figcaption></figure><p>Encore.</p>'),'Il a raté tout.\nLégende\nEncore.');
});

test('V16.4 : pas d’espace parasite avant la ponctuation dans le texte intégral',()=>{
 assert.deepEqual(articleParagraphs('Avant de jouer ses premiers ATP Finals , Flavio Cobolli a soutenu Alexander Zverev .'),
  ['Avant de jouer ses premiers ATP Finals, Flavio Cobolli a soutenu Alexander Zverev.']);
});

test('V16.5 : un article parle d’un favori seulement si son nom est dans le titre',()=>{
 const favs=[{name:'Jannik Sinner',sport:'Tennis'},{name:'PSG',sport:'Football',apiName:'Paris Saint Germain'}];
 assert.equal(findFavorite({title:'Zverev file en demi-finale',excerpt:'Il a battu Sinner en deux sets',sport:'Tennis'},favs),null);
 assert.equal(findFavorite({title:'Zverev file en demi-finale',favorite:'Jannik Sinner',sport:'Tennis'},favs),null);
 assert.equal(findFavorite({title:'Sinner file en demi-finale',sport:'Tennis'},favs)?.name,'Jannik Sinner');
 assert.equal(findFavorite({title:'Le Paris Saint-Germain gagne 3-0',sport:'Football'},favs)?.name,'PSG');
});

test('V16.5 : texte complet FFL avec tweets intégrés et images',()=>{
 const blocks=htmlToBlocks('<p>Début.</p><figure class="wp-block-embed"><blockquote class="twitter-tweet"><p>Le tweet <a href="#">@compte</a></p>— Nom (@compte)</blockquote></figure><p><img src="/wp-content/uploads/a.jpg" width="900"><img src="https://secure.gravatar.com/x.png"></p><p>Partager</p><p>Fin.</p>','https://fflose.com/article/');
 assert.deepEqual(blocks,[{type:'p',text:'Début.'},{type:'p',text:'Le tweet @compte'},{type:'p',text:'— Nom (@compte)'},{type:'img',src:'https://fflose.com/wp-content/uploads/a.jpg'},{type:'p',text:'Fin.'}]);
});

test('V16.5 : chaque carte d’article a un visuel, image ou illustration du sport',()=>{
 const html=renderNewsView({news:[{title:'Sinner s’impose 6-4 6-3',sport:'Tennis',source:'Tennis Actu',link:'https://www.tennisactu.net/b',date:'2026-11-13T09:00:00Z'},
  {title:'Rien ne va plus',source:'FFL',favorite:'FFL',link:'https://fflose.com/x',date:'2026-11-13T08:00:00Z',blocks:[{type:'p',text:'Texte.'},{type:'img',src:'https://fflose.com/wp-content/uploads/b.jpg'}]}],
  now:new Date('2026-11-13T12:00:00Z'),esc:x=>String(x),safeUrl:x=>x,photos:{'Jannik Sinner':{src:'https://example.org/sinner.jpg'}},favorites:[{name:'Jannik Sinner',sport:'Tennis'}]});
 assert.match(html,/src="https:\/\/example\.org\/sinner\.jpg"/);
 assert.match(html,/class="article-thumb-image"[^>]*src="https:\/\/fflose\.com\/wp-content\/uploads\/b\.jpg"/);
 assert.match(html,/<figure class="news-body-figure"><img class="news-body-image"/);
});

test('V16.5 : résumé d’article associé à un résultat de match',()=>{
 const item={title:'Paris Saint-Germain — Olympique Lyonnais',date:'2026-11-09T20:00:00Z',favorite:'PSG',favorites:['PSG']};
 const favorites=[{name:'PSG',sport:'Football',apiName:'Paris Saint Germain'}];
 const news=[
  {title:'Le PSG prépare la réception de Lyon',sport:'Football',source:'Franceinfo',link:'https://x/1',date:'2026-11-08T10:00:00Z',excerpt:'Avant-match.'},
  {title:'Ligue 1 : le PSG écrase Lyonnais et Lyon (4-0)',sport:'Football',source:'Franceinfo',link:'https://x/2',date:'2026-11-09T22:30:00Z',excerpt:'Les Parisiens ont dominé de bout en bout.'},
  {title:'La lose du PSG',source:'FFL',link:'https://fflose.com/y',date:'2026-11-10T08:00:00Z'}];
 const found=matchSummaryArticle(item,news,favorites);
 assert.equal(found.link,'https://x/2');
 assert.equal(found.excerpt,'Les Parisiens ont dominé de bout en bout.');
 assert.equal(matchSummaryArticle({...item,date:'2026-10-01T20:00:00Z'},news,favorites),null);
});

test('V16.6 : l’encart « À lire aussi : … » de FFL ne coupe plus l’article',()=>{
 const html='<p><strong>Introduction de l’article.</strong></p><div><a href="https://fflose.com/x"><style>.u{color:red}</style><div><span class="ctaText">À lire aussi :</span>&nbsp; <span class="postTitle">Football | Un autre article</span></div></a></div><h2>« Un intertitre »</h2><p>Suite de l’article.</p><p>Fin.</p>';
 assert.deepEqual(htmlToBlocks(html,'https://fflose.com/a/').map(b=>b.text),['Introduction de l’article.','« Un intertitre »','Suite de l’article.','Fin.']);
 // La liste de liens en fin d'article (Tennis Actu) reste coupée.
 assert.deepEqual(articleParagraphs('Texte.\nA lire aussi...\nWTA FINALS\nAutre titre'),['Texte.']);
 assert.deepEqual(articleParagraphs('Début.\nÀ lire aussi : Autre article\nSuite.'),['Début.','Suite.']);
});

test('V16.6 : un résultat ne reçoit que l’article de CE match (cas réels)',()=>{
 const favorites=[{name:'San Antonio Spurs',sport:'Basketball'},{name:'Carlos Alcaraz',sport:'Tennis'},{name:'Équipe de France de football',sport:'Football',apiName:'France'}];
 const news=[
  {title:'Warriors visit Spurs Friday in NBA Cup group stage',excerpt:'Golden State Warriors (8-4, sixth in the Western Conference) vs. San Antonio Spurs (9-3)',sport:'Basketball',source:'ESPN',link:'https://espn.com/1',date:'2026-11-12T10:00:00Z'},
  {title:'Carlos Alcaraz beats Ben Shelton to win his fifth title of the year',excerpt:'He will face Casper Ruud next week.',sport:'Tennis',source:'ESPN',link:'https://espn.com/2',date:'2026-11-09T18:00:00Z'},
  {title:'L’équipe de France battue par l’Italie en Ligue des nations',excerpt:'Les Bleus ont manqué de précision à Milan.',sport:'Football',source:'Franceinfo',link:'https://franceinfo.fr/3',date:'2026-11-12T22:30:00Z'}];
 const at=(title,date,fav)=>matchSummaryArticle({title,date,favorites:[fav]},news,favorites)?.link||null;
 assert.equal(at('Chicago Bulls — San Antonio Spurs','2026-11-12T01:00:00Z','San Antonio Spurs'),null);
 assert.equal(at('Carlos Alcaraz — Ben Shelton','2026-11-09T15:00:00Z','Carlos Alcaraz'),'https://espn.com/2');
 assert.equal(at('Carlos Alcaraz — Casper Ruud','2026-11-08T15:00:00Z','Carlos Alcaraz'),null);
 assert.equal(at('Italy — France','2026-11-12T19:45:00Z','Équipe de France de football'),'https://franceinfo.fr/3');
 assert.equal(relevantFavoriteNews(news[0],favorites),null);
});

test('V16.6 : le compte rendu ESPN ignore les articles génériques de la ligue',async()=>{
 const {recapArticleFromESPN}=await import('../event-details.js');
 const header={competitions:[{competitors:[{team:{displayName:'Paris Saint-Germain',shortDisplayName:'PSG'}},{team:{displayName:'Troyes'}}]}]};
 const generic={headline:'Who is the best soccer player in the world?',links:{web:{href:'https://www.espn.com/soccer/story/1'}}};
 assert.equal(recapArticleFromESPN({header,news:{articles:[generic]}}),null);
 assert.equal(recapArticleFromESPN({header,news:{articles:[generic,{headline:'PSG edge Troyes 1-0',description:'A late goal.',links:{web:{href:'https://www.espn.com/soccer/report/2'}}}]}})?.title,'PSG edge Troyes 1-0');
});

test('V16.6 : compte rendu NBA (lien http) accepté, article sur un seul club refusé',async()=>{
 const {recapArticleFromESPN}=await import('../event-details.js');
 const nba={header:{competitions:[{competitors:[{team:{displayName:'Chicago Bulls'}},{team:{displayName:'San Antonio Spurs'}}]}]},
  article:{gameId:'401909969',headline:'Wembanyama, Harper lead Spurs to 10th straight win, 124-119 over Bulls',description:'Victor Wembanyama scored 32 points.',story:'<p>CHICAGO -- — Victor Wembanyama scored 32 points and the San Antonio Spurs won their 10th straight game.</p><p>The Bulls have lost eight in a row to fall to 1-9. They are 0-4 at home.</p>',links:{web:{href:'http://www.espn.com/nba/recap?gameId=401909969'}}}};
 const recap=recapArticleFromESPN(nba,'401909969');
 assert.equal(recap?.link,'https://www.espn.com/nba/recap?gameId=401909969');
 assert.deepEqual(recap.paragraphs,['Victor Wembanyama scored 32 points and the San Antonio Spurs won their 10th straight game.','The Bulls have lost eight in a row to fall to 1-9. They are 0-4 at home.']);
 // Article d'un autre match du tournoi (autre gameId, un seul camp cité) : refusé.
 assert.equal(recapArticleFromESPN({...nba,article:{...nba.article,gameId:'1',headline:'Spurs win again',description:''}},'401909969'),null);
 const liga={header:{competitions:[{competitors:[{team:{displayName:'Valencia'}},{team:{displayName:'Real Madrid'}}]}]},
  news:{articles:[{headline:"Trent Alexander-Arnold's dream move to Real Madrid is turning sour",links:{web:{href:'https://www.espn.com/soccer/story/9'}}}]}};
 assert.equal(recapArticleFromESPN(liga),null);
});

test('V16.8 : chaque source a son icône, dans les cartes et les filtres',async()=>{
 const {sourceStyle}=await import('../source-icons.js');
 for(const name of ['FFL','Jeu, set et maths','ESPN','Tennis Actu','Franceinfo','Basket USA','TrashTalk',"Cyclism'Actu"])
  assert.ok(sourceStyle(name).label&&sourceStyle(name).bg.startsWith('#'),name);
 assert.equal(sourceStyle('lequipe.fr').label,'LF');
 const html=renderNewsView({news:[{title:'Sinner s’impose 6-4 6-3',sport:'Tennis',source:'Tennis Actu',link:'https://www.tennisactu.net/b',date:'2026-11-13T09:00:00Z'}],
  now:new Date('2026-11-13T12:00:00Z'),esc:x=>String(x),safeUrl:x=>x,photos:{},favorites:[{name:'Jannik Sinner',sport:'Tennis'}]});
 assert.match(html,/news-source-chip[^>]*><span class="source-icon small"[^>]*>TA<\/span>Tennis Actu/);
 assert.match(html,/<span class="news-source"><span class="source-icon"[^>]*>TA<\/span>Tennis Actu/);
});

test('V16.8 : les émoticônes WordPress restent dans le texte et ne servent jamais d’image',()=>{
 const blocks=htmlToBlocks('<p>Quelle soirée <img draggable="false" role="img" class="emoji" alt="🌭" src="https://s.w.org/images/core/emoji/17.0.2/72x72/1f32d.png"> !</p>','https://fflose.com/a/');
 assert.deepEqual(blocks,[{type:'p',text:'Quelle soirée 🌭 !'}]);
});

test('V16.9 : résumé vidéo YouTube intégré quand ESPN n’en publie pas',async()=>{
 const {renderAgendaView}=await import('../agenda-ui.js');
 const item={key:'k1',title:'Italy — France',date:'2026-11-12T19:45:00Z',day:'2026-11-12',finished:true,favorite:'Équipe de France de football',favorites:['Équipe de France de football'],score:'3 – 1',competition:'Ligue des nations',type:'football'};
 const html=renderAgendaView({view:'semaine',phase:'past',favorites:[{name:'Équipe de France de football',sport:'Football'}],items:[item],esc:x=>String(x),safeUrl:x=>x,now:new Date('2026-11-13T12:00:00Z'),
  mediaFor:()=>({videos:[],youtube:{id:'CpkujKwL7d4',title:'Italy vs France Highlights',channel:'FOX Sports',official:true,duration:'15:39'}})});
 assert.match(html,/data-youtube-id="CpkujKwL7d4"/);
 assert.match(html,/FOX Sports · 15:39/);
 const unofficial=renderAgendaView({view:'semaine',phase:'past',favorites:[{name:'Équipe de France de football',sport:'Football'}],items:[item],esc:x=>String(x),safeUrl:x=>x,now:new Date('2026-11-13T12:00:00Z'),
  mediaFor:()=>({videos:[],youtube:{id:'Peb6zQmKS78',channel:'CHEFON FF',official:false}})});
 assert.match(unofficial,/chaîne non officielle/);
 const {readFile}=await import('node:fs/promises');
 const app=await readFile(new URL('../src.js',import.meta.url),'utf8');
 assert.match(app,/youtube-nocookie\.com\/embed\//);
 assert.match(app,/strict-origin-when-cross-origin/);
});

test('V17.0 : rugby international en direct via World Rugby et actualisation pendant les matchs',async()=>{
 const {readFile}=await import('node:fs/promises');
 const app=await readFile(new URL('../src.js',import.meta.url),'utf8');
 assert.match(app,/request\('\/api\/rugby-live'/);
 assert.match(app,/'South Africa':'Afrique du Sud'/);
 assert.match(app,/function scheduleLiveRefresh\(\)/);
 const worker=await readFile(new URL('../worker/index.js',import.meta.url),'utf8');
 assert.match(worker,/api\.wr-rims-prod\.pulselive\.com\/rugby\/v3\/match/);
 // Le match World Rugby remplace la fiche manuelle du même jour (mêmes équipes).
 const {makeAgenda}=await import('../agenda-model.js');
 const items=makeAgenda({teams:[{id:'wr-1',home:'France',away:'Afrique du Sud',homeScore:'21',awayScore:'19',date:'2026-11-13T20:10:00.000Z',status:'Terminé',favorite:'XV de France',competition:'Championnat des Nations 2026',source:'World Rugby (direct)'}],
  individuals:[],history:[],verified:[],expanded:[{id:'v10-rugby-sa-13',favorite:'XV de France',date:'2026-11-13T21:10:00+01:00',title:'France — Afrique du Sud',competition:'Championnat des Nations 2026',status:'À venir',type:'rugby',home:'France',away:'Afrique du Sud',score:''}]});
 const rugby=items.filter(i=>i.favorites.includes('XV de France'));
 assert.equal(rugby.length,1);
 assert.equal(rugby[0].finished,true);
 assert.match(rugby[0].score,/21/);
});

test('V17.0 : articles À lire / Lus',()=>{
 const now=new Date('2026-11-13T12:00:00Z');
 const news=[{title:'Sinner s’impose 6-4 6-3',sport:'Tennis',source:'Tennis Actu',link:'https://www.tennisactu.net/a',date:'2026-11-13T09:00:00Z'},
  {title:'La lose du jour',source:'FFL',favorite:'FFL',link:'https://fflose.com/b',date:'2026-11-13T08:00:00Z'}];
 const args={news,now,esc:x=>String(x),safeUrl:x=>x,photos:{},favorites:[{name:'Jannik Sinner',sport:'Tennis'}]};
 const readKeys=new Set(['fflose.com/b']);
 const unread=renderNewsView({...args,readKeys});
 assert.match(unread,/data-news-view="unread"[^>]*>À lire <span>1<\/span>/);
 assert.match(unread,/data-news-view="read"[^>]*>Lus <span>1<\/span>/);
 assert.match(unread,/Sinner s’impose/);
 assert.doesNotMatch(unread,/La lose du jour/);
 assert.match(unread,/class="news-swipe" data-article-key="tennisactu\.net\/a"/);
 assert.match(unread,/data-mark-read="tennisactu\.net\/a"/);
 const read=renderNewsView({...args,readKeys,readView:'read'});
 assert.match(read,/La lose du jour/);
 assert.doesNotMatch(read,/Sinner s’impose/);
 // Article ouvert pendant la visite : reste dans « À lire » jusqu'au changement d'onglet.
 const keep=renderNewsView({...args,readKeys:new Set(['fflose.com/b','tennisactu.net/a']),keepVisible:new Set(['tennisactu.net/a'])});
 assert.match(keep,/Sinner s’impose/);
 const done=renderNewsView({...args,readKeys:new Set(['fflose.com/b','tennisactu.net/a'])});
 assert.match(done,/Tout est lu/);
});

test('V17.1 : l’essentiel du match en français à partir de la feuille ESPN',async()=>{
 const {keyFactsFromESPN}=await import('../event-details.js');
 const team=(id,name,home)=>({homeAway:home?'home':'away',team:{id,displayName:name,shortDisplayName:name}});
 const soccer={header:{competitions:[{competitors:[team('1','Atlético Madrid',true),team('2','Barcelona',false)]}]},
  keyEvents:[{scoringPlay:true,type:{text:'Goal'},clock:{displayValue:"10'"},team:{displayName:'Atlético Madrid'},participants:[{athlete:{displayName:'Giuliano Simeone'}}]},
   {scoringPlay:true,type:{text:'Goal'},clock:{displayValue:"45'"},team:{displayName:'Barcelona'},participants:[{athlete:{displayName:'Fermín López'}}]},
   {scoringPlay:true,type:{text:'Penalty - Scored'},clock:{displayValue:"66'"},team:{displayName:'Barcelona'},participants:[{athlete:{displayName:'Fermín López'}}]},
   {type:{text:'Yellow Card'},clock:{displayValue:"70'"},team:{displayName:'Barcelona'},participants:[{athlete:{displayName:'Marc Bernal'}}]}],
  boxscore:{teams:[{team:{id:'1'},statistics:[{name:'possessionPct',displayValue:'37'},{name:'totalShots',displayValue:'9'}]},{team:{id:'2'},statistics:[{name:'possessionPct',displayValue:'63'},{name:'totalShots',displayValue:'19'}]}]}};
 const facts=keyFactsFromESPN(soccer,'football');
 assert.deepEqual(facts[0],{label:'Buts Atlético Madrid',text:"Giuliano Simeone 10'"});
 assert.deepEqual(facts[1],{label:'Buts Barcelona',text:"Fermín López 45', 66' (pen.)"});
 assert.equal(facts[2].text,'Possession 37 % – 63 % · Tirs 9 – 19');
 const nba={header:{competitions:[{competitors:[team('1','Bulls',true),team('2','Spurs',false)]}]},
  boxscore:{players:[{team:{id:'2',shortDisplayName:'Spurs'},statistics:[{labels:['MIN','PTS','FG','REB','AST','STL','BLK'],athletes:[
   {athlete:{displayName:'Victor Wembanyama'},stats:['32','32','13-18','9','1','2','5']},{athlete:{displayName:'Dylan Harper'},stats:['36','18','7-18','6','10','4','1']}]}]}]}};
 const basket=keyFactsFromESPN(nba,'basketball','Victor Wembanyama');
 assert.deepEqual(basket[0],{label:'Victor Wembanyama',text:'32 pts · 9 reb · 1 pd · 5 ctr · 2 int · 13-18 aux tirs · 32 min'});
 assert.deepEqual(basket[1],{label:'Marqueurs Spurs',text:'Victor Wembanyama 32 · Dylan Harper 18'});
});

test('V17.1 : un extrait qui cite le prochain adversaire ne rattache pas l’article à ce match',()=>{
 const favorites=[{name:'Mirra Andreeva',sport:'Tennis'}];
 const news=[{title:'Mirra Andreeva beats Elina Svitolina to open WTA Finals',excerpt:'She will face Diana Shnaider on Friday.',sport:'Tennis',source:'ESPN',link:'https://espn.com/a',date:'2026-11-13T08:00:00Z'}];
 assert.equal(matchSummaryArticle({title:'Diana Shnaider — Mirra Andreeva',date:'2026-11-13T03:00:00Z',favorites:['Mirra Andreeva']},news,favorites),null);
 assert.equal(matchSummaryArticle({title:'Elina Svitolina — Mirra Andreeva',date:'2026-11-13T03:00:00Z',favorites:['Mirra Andreeva']},news,favorites)?.link,'https://espn.com/a');
});

test('V17.1 : les mots-dièse d’un titre ne comptent pas pour rattacher un article',()=>{
 const favorites=[{name:'Mirra Andreeva',sport:'Tennis'}];
 const article={title:'WTA Finals : Elina Svitolina renverse Aryna Sabalenka et se qualifie en demi-finale #WTAFinals #WTA #Andreeva #Shnaider #Muchova',excerpt:'Elina Svitolina poursuit l’aventure.',sport:'Tennis',source:'Tennis Actu',link:'https://www.tennisactu.net/s',date:'2026-11-13T23:26:00Z'};
 assert.equal(findFavorite(article,favorites),null);
 assert.equal(matchSummaryArticle({title:'Diana Shnaider — Mirra Andreeva',date:'2026-11-13T20:00:00Z',favorites:['Mirra Andreeva']},[article],favorites),null);
 const html=renderNewsView({news:[{...article,title:'Masters : Andreeva bat Shnaider 6-2 6-1 #WTAFinals #Andreeva'}],now:new Date('2026-11-14T08:00:00Z'),esc:x=>String(x),safeUrl:x=>x,photos:{},favorites});
 assert.match(html,/<h3>Masters : Andreeva bat Shnaider 6-2 6-1<\/h3>/);
});

test('V17.1 : thème clair généré à partir du thème sombre et à jour',async()=>{
 const {readFile}=await import('node:fs/promises');
 const {lightTheme,lightness}=await import('../scripts/build-light-theme.mjs');
 const root=new URL('../',import.meta.url);
 const dark=await readFile(new URL('style.css',root),'utf8');
 const light=await readFile(new URL('style-light.css',root),'utf8');
 assert.ok(light.includes(lightTheme(dark)),'style-light.css n’est pas à jour : lancer node scripts/build-light-theme.mjs');
 // Fond sombre → très clair ; texte clair → foncé ; noir pur (ombres, vidéo) inchangé.
 assert.ok(lightness(0.08)>0.94&&lightness(0.96)<0.2);
 assert.equal(lightTheme('a{color:white;background:#000;border:1px solid #071321}'),'a{color:#1a1a1a;background:#000;border:1px solid '+lightTheme('#071321')+'}');
 const index=await readFile(new URL('index.html',root),'utf8');
 assert.match(index,/id="themeCss" rel="stylesheet" href="\.\/style-light\.css\?v=/);
 assert.match(index,/monsport-theme-v1/);
});

test('V17.2 : tweet intégré affiché en carte, avec auteur, texte et médias',()=>{
 const blocks=[{type:'p',text:'Texte.'},{type:'tweet',id:'2121348677637685461',lines:['Quelle action !','21-7'],author:'TF1+',handle:'@tf1plus'}];
 const esc=x=>String(x);
 const waiting=renderBlocksForTest(blocks,esc);
 assert.match(waiting,/<figure class="news-tweet">.*<b>TF1\+<\/b><span>@tf1plus<\/span>.*<p>Quelle action !<\/p><p>21-7<\/p><div class="news-tweet-media" data-tweet-id="2121348677637685461"><\/div>/);
 assert.match(waiting,/href="https:\/\/x\.com\/i\/status\/2121348677637685461"/);
 const known=new Map([['2121348677637685461',{media:[{type:'video',src:'https://video.twimg.com/amplify_video/1/vid/avc1/1280x720/a.mp4?tag=21',poster:'https://pbs.twimg.com/amplify_video_thumb/1/img/x.jpg'},{type:'img',src:'https://pbs.twimg.com/media/A.jpg'}]}]]);
 const html=renderBlocksForTest(blocks,esc,known);
 assert.match(html,/<video class="news-body-video"[^>]*poster="https:\/\/pbs\.twimg\.com\/amplify_video_thumb\/1\/img\/x\.jpg"[^>]*src="https:\/\/video\.twimg\.com\/amplify_video\/1\/vid\/avc1\/1280x720\/a\.mp4\?tag=21"/);
 assert.match(html,/<img class="news-body-image"[^>]*src="https:\/\/pbs\.twimg\.com\/media\/A\.jpg"/);
 // Une vidéo d'un autre domaine n'est jamais insérée.
 assert.doesNotMatch(renderBlocksForTest([{type:'video',src:'https://evil.example/a.mp4'}],esc),/<video/);
});

test('V17.2 : deux articles au plus par rencontre d’un favori (hors FFL et JSM)',()=>{
 const favorites=[{name:'Équipe de France de football',sport:'Football',apiName:'France'}];
 const matches=[{title:'Italy — France',date:'2026-11-12T19:45:00Z',favorites:['Équipe de France de football']}];
 const a=(n,title,date,excerpt='Extrait.')=>({title,sport:'Football',source:'Franceinfo',link:'https://www.franceinfo.fr/'+n,date,excerpt});
 const news=[a(1,'Italie-France : revivez la défaite des Bleus (3-1)','2026-11-12T22:35:00Z'),
  a(2,'L’équipe de France battue par l’Italie en Ligue des nations','2026-11-12T22:10:00Z'),
  a(3,'Les Bleus s’inclinent : les notes des joueurs','2026-11-13T07:00:00Z',''),
  a(4,'Les Bleus s’imposent 2-0 face à la Turquie','2026-11-15T22:00:00Z'),
  {title:'La lose des Bleus',source:'FFL',favorite:'FFL',link:'https://fflose.com/l',date:'2026-11-12T23:00:00Z'}];
 const kept=limitPerMatch(news.slice(0,4),favorites,matches,2);
 assert.deepEqual([...kept].map(x=>x.link).sort(),['https://www.franceinfo.fr/1','https://www.franceinfo.fr/2','https://www.franceinfo.fr/4']);
 const html=renderNewsView({news,now:new Date('2026-11-16T08:00:00Z'),esc:x=>String(x),safeUrl:x=>x,photos:{},favorites,matches});
 assert.doesNotMatch(html,/les notes des joueurs/);
 assert.match(html,/La lose des Bleus/);
 assert.match(html,/1 article sur tes favoris écarté/);
});

test('V17.2 : vrais logos pour FFL et Jeu, set et maths',async()=>{
 const {sourceIcon}=await import('../source-icons.js');
 const {access}=await import('node:fs/promises');
 for(const [name,file] of [['FFL','ffl.png'],['Jeu, set et maths','jsm.png']]){
  assert.match(sourceIcon(name,x=>String(x)),new RegExp('class="source-icon has-logo"[^>]*><img src="\\./icons/sources/'+file.replace('.','\\.')+'"'));
  await access(new URL('../icons/sources/'+file,import.meta.url));
 }
 assert.match(sourceIcon('Tennis Actu',x=>String(x)),/>TA<\/span>/);
});

test('V17.2 : carte de résultat — cadre selon le verdict, grande photo, détails sans texte superflu',async()=>{
 const {renderAgendaView}=await import('../agenda-ui.js');
 const favorites=[{name:'PSG',sport:'Football',apiName:'Paris Saint Germain'}];
 const base={key:'k',date:'2026-11-12T19:45:00Z',day:'2026-11-12',finished:true,favorite:'PSG',favorites:['PSG'],competition:'Ligue 1',type:'team',source:'ESPN (Ligue 1)'};
 const render=(item,media)=>renderAgendaView({view:'semaine',phase:'past',favorites,items:[item],esc:x=>String(x),safeUrl:x=>x,now:new Date('2026-11-13T12:00:00Z'),mediaFor:()=>media||{}});
 const win=render({...base,title:'Paris Saint-Germain — Troyes',score:'1 – 0',origin:{home:'Paris Saint-Germain',away:'Troyes',homeScore:'1',awayScore:'0'}},
  {youtube:{id:'CpkujKwL7d4',channel:'Ligue 1',official:true,duration:'5:02'}});
 assert.match(win,/<details class="agenda-event verdict-win"/);
 assert.match(win,/<div class="result-hero"><button type="button" class="result-hero-play" data-youtube-id="CpkujKwL7d4"[^>]*><img class="result-hero-image"[^>]*src="https:\/\/i\.ytimg\.com\/vi\/CpkujKwL7d4\/hqdefault\.jpg"/);
 const loss=render({...base,title:'Paris Saint-Germain — Lens',score:'0 – 2',origin:{home:'Paris Saint-Germain',away:'Lens',homeScore:'0',awayScore:'2'}},
  {recap:{title:'Lens stun PSG',excerpt:'Lens won.',link:'https://www.espn.com/x',image:'https://a.espncdn.com/photo/x.jpg',paragraphs:[]}});
 assert.match(loss,/class="agenda-event verdict-loss"/);
 assert.match(loss,/<div class="result-hero"><img class="result-hero-image"[^>]*src="https:\/\/a\.espncdn\.com\/photo\/x\.jpg"/);
 assert.match(render({...base,title:'Paris Saint-Germain — Nice',score:'1 – 1',origin:{home:'Paris Saint-Germain',away:'Nice',homeScore:'1',awayScore:'1'}}),/class="agenda-event verdict-draw"/);
 // Textes génériques retirés des résultats joués.
 for(const html of [win,loss])assert.doesNotMatch(html,/Résumé du résultat|La rencontre .* est terminée|Résumé factuel construit|Articles sur cette rencontre|Compte rendu sportif/);
 const {readFile}=await import('node:fs/promises');
 const app=await readFile(new URL('../src.js',import.meta.url),'utf8');
 assert.doesNotMatch(app,/Articles sur cette rencontre|Résultat et statistiques issus des sources/);
});

test('V17.2 : Spurs et Wembanyama — une seule rencontre, deux articles au plus',()=>{
 const favorites=[{name:'San Antonio Spurs',sport:'Basketball'},{name:'Victor Wembanyama',sport:'Basketball'}];
 const matches=[{title:'San Antonio Spurs — Golden State Warriors',date:'2026-11-14T01:00:00Z',favorites:['San Antonio Spurs','Victor Wembanyama']}];
 const a=(n,source,title)=>({title,sport:'Basketball',source,link:'https://x.example/'+n,date:'2026-11-14T06:00:00Z',excerpt:'Extrait.'});
 const kept=limitPerMatch([a(1,'TrashTalk','Victor Wembanyama tranquille : 31 points face aux Warriors'),a(2,'ESPN','Victor Wembanyama, Spurs rout Warriors 120-98'),a(3,'Basket USA','Les Spurs ne font qu’une bouchée des Warriors')],favorites,matches,2);
 assert.equal(kept.size,2);
});
