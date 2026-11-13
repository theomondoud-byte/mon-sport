import {sportInfo,sourceImage} from '../sports-media.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {makeAgenda,agendaMatches,shiftedMonths} from '../agenda-model.js';
import {parseESPNStandings,parseESPNTennisRankings,rankingRows} from '../rankings-view.js';
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
