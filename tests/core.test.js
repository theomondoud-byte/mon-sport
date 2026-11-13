import test from 'node:test';
import assert from 'node:assert/strict';
import {makeAgenda,agendaMatches,shiftedMonths} from '../agenda-model.js';
import {parseESPNStandings,rankingRows} from '../rankings-view.js';
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
