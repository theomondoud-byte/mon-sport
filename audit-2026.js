// Mon Sport V6 - Bilan des 18 favoris pour la seule année civile 2026.
// Attention : les nombres "recensés" ne sont PAS des totaux garantis de carrière/saison.
// Données de référence vérifiées au 12 novembre 2026 (pages liées dans SOURCES).
export const AUDIT_AS_OF='2026-11-12';
export const AUDIT_YEAR=2026;
const FIFA='https://www.fifa.com/fr/tournaments/mens/worldcup/canadamexicousa2026/articles/calendrier-resultats-france-coupe-du-monde-2026';
const RUGBY='https://www.lequipe.fr/Rugby/RugbyFicheSelection26.html';
const RUGBY_FIJI='https://amp.www.ffr.fr/actualites/championnat-des-nations-france-fidji-54-17';
const FFTT_EURO='https://www.fftt.com/actualites/equipe-de-france/championnats-deurope-2026-programme-resultats/';
const FFTT_YOK='https://www.fftt.com/actualites/wtt/suivre-le-wtt-champions-de-yokohama-2/';
const AQUA='https://www.worldaquatics.com/athletes/1188005/ws';
const PCS='https://www.procyclingstats.com/rider/paul-seixas/results';
const TT_COTON='https://tabletennisapi.com/players/coton-flavien/matches/2026';
export const SOURCES_2026={
 'Real Madrid':{kind:'équipe',unit:'matchs terminés',source:'ESPN · LaLiga, C1, Coupe du Roi',url:'https://www.realmadrid.com/fr-FR/calendrier?filter-football=primer-equipo-masculino'},
 PSG:{kind:'équipe',unit:'matchs terminés',source:'ESPN · Ligue 1, C1, Coupe de France',url:'https://www.psg.fr/football-masculin/calendrier'},
 'San Antonio Spurs':{kind:'équipe',unit:'matchs NBA terminés',source:'ESPN NBA',url:'https://www.nba.com/spurs/schedule'},
 'Victor Wembanyama':{kind:'joueur',unit:'matchs joués',source:'NBA · match log',url:'https://www.nba.com/player/1641705/victor-wembanyama'},
 'Léon Marchand':{kind:'nageur',unit:'courses individuelles',source:'World Aquatics · fiches et résultats',url:AQUA},
 'Félix Lebrun':{kind:'pongiste',unit:'matchs (simples + doubles)',source:'FFTT / WTT · résultats sélectionnés',url:'https://www.fftt.com/felixlebrun/'},
 'Alexis Lebrun':{kind:'pongiste',unit:'matchs (simples + doubles)',source:'FFTT / WTT · résultats sélectionnés',url:FFTT_EURO},
 'Flavien Coton':{kind:'pongiste',unit:'matchs (simples + doubles)',source:'Table Tennis API · 2026',url:TT_COTON,referenceCount:44,referenceUnit:'44 matchs officiels, dont 31 simples et 13 doubles',referenceAsOf:AUDIT_AS_OF},
 'Paul Seixas':{kind:'cycliste',unit:'épreuves / courses',source:'CyclingDB / ProCyclingStats · 2026',url:PCS,referenceCount:12,referenceUnit:'12 épreuves distinctes selon CyclingDB (ne pas compter étapes et général deux fois)',referenceAsOf:AUDIT_AS_OF},
 'Kylian Mbappé':{kind:'joueur',unit:'apparitions (club + sélection)',source:'FIFA / Real Madrid · participation à confirmer sur feuilles de match',url:'https://www.fifa.com/fr/tournaments/mens/worldcup/canadamexicousa2026'},
 'Équipe de France de football':{kind:'équipe',unit:'matchs internationaux',source:'FIFA · Coupe du monde 2026',url:FIFA,referenceCount:8,referenceUnit:'8 matchs de Coupe du monde vérifiés; autres compétitions non incluses',referenceAsOf:AUDIT_AS_OF},
 'XV de France':{kind:'équipe',unit:'tests internationaux terminés',source:'L’Équipe / FFR · calendrier 2026',url:RUGBY,referenceCount:9,referenceUnit:'9 tests terminés au 12 novembre; 2 matchs de novembre à venir',referenceAsOf:AUDIT_AS_OF},
 'Arthur Fils':{kind:'tennis',unit:'simples 2026 recensés',source:'ATP archive + source hebdomadaire',url:'https://fr.tennistemple.com/player/arthur-fils/results'},
 'Jannik Sinner':{kind:'tennis',unit:'simples 2026 recensés',source:'ATP archive + source hebdomadaire',url:'https://fr.tennistemple.com/player/jannik-sinner/results'},
 'Carlos Alcaraz':{kind:'tennis',unit:'simples 2026 recensés',source:'ATP archive + source hebdomadaire',url:'https://fr.tennistemple.com/player/carlos-alcaraz/results'},
 'Rafael Jódar':{kind:'tennis',unit:'simples 2026 recensés',source:'ATP / Challenger · vérification manuelle',url:'https://fr.tennistemple.com/player/rafael-jodar/results'},
 'Moïse Kouamé':{kind:'tennis',unit:'simples 2026 recensés',source:'ATP / Challenger / ITF · relevé daté',url:'https://fr.tennistemple.com/player/moise-kouame/results'},
 'Mirra Andreeva':{kind:'tennis',unit:'simples 2026 recensés',source:'WTA / ITF · sources croisées',url:'https://fr.tennistemple.com/player/mirra-andreeva/results'}
};
const row=(day,favorite,opponent,score,competition,url,win=true,type='match',round='')=>({
 id:'verified26-'+day+'-'+favorite.toLowerCase().replaceAll(' ','-')+'-'+opponent.toLowerCase().replaceAll(' ','-'),
 date:day+'T12:00:00Z',favorite,opponent,score,competition,round,
 status:'Terminé',sourceUrl:url,type,
 outcome:win?'Victoire':'Défaite',
 source:'Résultat 2026 vérifié · source citée'
});
// Matchs de la Coupe du monde 2026 sur le site officiel FIFA.
// Il ne s'agit PAS de tous les matchs de l'équipe de France en 2026.
const WC=[
 ['2026-06-16','Sénégal','3-1',true,'Groupes'],
 ['2026-06-22','Irak','3-0',true,'Groupes'],
 ['2026-06-26','Norvège','4-1',true,'Groupes (France à l’extérieur)'],
 ['2026-06-30','Suède','3-0',true,'16es'],
 ['2026-07-04','Paraguay','1-0',true,'8es (France à l’extérieur)'],
 ['2026-07-09','Maroc','2-0',true,'Quarts'],
 ['2026-07-14','Espagne','0-2',false,'Demi-finales'],
 ['2026-07-18','Angleterre','4-6',false,'3e place']
];
const RUGBY_ROWS=[
 ['2026-02-05','Irlande','36-14',true,'Six Nations'],
 ['2026-02-15','Pays de Galles','54-12',true,'Six Nations (extérieur)'],
 ['2026-02-22','Italie','33-8',true,'Six Nations'],
 ['2026-03-07','Écosse','40-50',false,'Six Nations (extérieur)'],
 ['2026-03-14','Angleterre','48-46',true,'Six Nations'],
 ['2026-07-04','Nouvelle-Zélande','32-34',false,'Nations Championship (extérieur)'],
 ['2026-07-11','Australie','42-26',true,'Nations Championship (extérieur)'],
 ['2026-07-18','Japon','42-15',true,'Nations Championship (extérieur)'],
 ['2026-11-07','Fidji','54-17',true,'Nations Championship']
];
const PING=[
 ['2026-10-14','Félix Lebrun','Maciej Kubik','4-0',FFTT_EURO,true],
 ['2026-10-15','Félix Lebrun','Ivor Ban','4-0',FFTT_EURO,true],
 ['2026-10-16','Félix Lebrun','Elias Ranefur','4-2',FFTT_EURO,true],
 ['2026-10-14','Alexis Lebrun','Tiago Apolonia','4-0',FFTT_EURO,true],
 ['2026-10-15','Alexis Lebrun','Vladislav Ursu','4-2',FFTT_EURO,true],
 ['2026-10-16','Alexis Lebrun','Kristian Karlsson','4-2',FFTT_EURO,true],
 ['2026-10-14','Flavien Coton','Connor Green','4-2',FFTT_EURO,true],
 ['2026-10-15','Flavien Coton','Simon Gauzy','2-4',FFTT_EURO,false],
 ['2026-08-04','Félix Lebrun','Flavien Coton','3-0',FFTT_YOK,true],
 ['2026-08-06','Félix Lebrun','Benedikt Duda','3-0',FFTT_YOK,true],
 ['2026-08-08','Félix Lebrun','Hiroto Shinozuka','2-4',FFTT_YOK,false],
 ['2026-08-05','Alexis Lebrun','Manush Shah','3-0',FFTT_YOK,true],
 ['2026-08-07','Alexis Lebrun','Darko Jorgic','3-1',FFTT_YOK,true],
 ['2026-08-08','Alexis Lebrun','Tomokazu Harimoto','0-4',FFTT_YOK,false]
];
// World Aquatics "Personal Best Results": ne reflète pas toute la saison.
const SWIMS=[
 ['2026-08-10','Léon Marchand','200 m nage libre','1:43.76','Championnats d’Europe 2026 · argent'],
 ['2026-08-16','Léon Marchand','400 m nage libre','3:43.14','Championnats d’Europe 2026 · or'],
 ['2026-03-04','Léon Marchand','200 m dos','1:57.56','TYR Pro Swim Series Westmont · or']
];
const RIDES=[
 ['2026-10-10','Paul Seixas','Il Lombardia','1er','Course d’un jour'],
 ['2026-07-26','Paul Seixas','Tour de France','4e','Classement général'],
 ['2026-04-22','Paul Seixas','La Flèche Wallonne','1er','Course d’un jour']
];
export function verified2026For(favorite,now=new Date()){
 const cutoff=Math.min(now.getTime(),Date.parse('2026-12-31T23:59:59Z'));
 const ok=x=>Date.parse(x.date)<=cutoff;
 const items=[];
 if(favorite==='Équipe de France de football')for(const [day,opp,score,win,round] of WC)items.push(row(day,favorite,opp,score,'Coupe du monde 2026',FIFA,win,'football',round));
 if(favorite==='XV de France')for(const [day,opp,score,win,competition] of RUGBY_ROWS)items.push(row(day,favorite,opp,score,competition,day==='2026-11-07'?RUGBY_FIJI:RUGBY,win,'rugby'));
 if(['Félix Lebrun','Alexis Lebrun','Flavien Coton'].includes(favorite))for(const [day,name,opp,score,url,win] of PING)if(name===favorite)items.push(row(day,name,opp,score,url===FFTT_EURO?'Championnats d’Europe':'WTT Champions Yokohama',url,win,'ping'));
 if(favorite==='Léon Marchand')for(const [day,name,opp,score,competition] of SWIMS)items.push(row(day,name,opp,score,competition,AQUA,true,'swim'));
 if(favorite==='Paul Seixas')for(const [day,name,opp,score,competition] of RIDES)items.push(row(day,name,opp,score,competition,PCS,true,'cycling'));
 return items.filter(ok).sort((a,b)=>b.date.localeCompare(a.date));
}
export function auditInfo(name){return SOURCES_2026[name]||{kind:'autre',unit:'événements',source:'Source non configurée',url:'https://www.google.com/search?q='+encodeURIComponent(name+' résultats 2026')};}
export function safeScoreCount(name,tennisItems,teamAudit){
 const info=auditInfo(name);
 if(info.kind==='tennis')return {count:tennisItems.filter(x=>x.favorite===name&&x.date.startsWith('2026-')).length,label:'simples recensés, non exhaustif',verified:false};
 if(['Real Madrid','PSG','San Antonio Spurs'].includes(name)&&teamAudit?.byFavorite?.[name])return {count:teamAudit.byFavorite[name].count,label:'matchs retrouvés par ESPN (couverture à vérifier)',verified:false};
 if(info.referenceCount!==undefined)return {count:info.referenceCount,label:info.referenceUnit||'résultats recensés',verified:true};
 const selected=verified2026For(name);
 if(selected.length)return {count:selected.length,label:'résultats de référence (sélection seulement)',verified:false};
 return {count:null,label:'total 2026 non vérifié',verified:false};
}
