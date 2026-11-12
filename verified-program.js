// Mon Sport V10 — calendrier sourcé des événements que les API gratuites omettent.
// Références consultées le 12 novembre 2026. Les affiches confirmées sont
// distinguées des compétitions dont le tirage/horaire reste à annoncer.
// Ne jamais inventer un adversaire, une heure ou une présence individuelle.
export const PROGRAM_CHECKED='2026-11-12';
const RUGBY='https://presse.ffr.fr/categories/equipes-de-france/saison-26-27-programme-des-equipes-de-france-a-xv';
const RUGBY_TICKET='https://billetterie.ffr.fr/fr/XV-masculin';
const MIXED='https://www.fftt.com/actualites/equipe-de-france/la-selection-pour-la-coupe-du-monde-mixte-2026-est-connue/';
const ROUEN='https://rouen.fr/index.php/fr/evenement/20261102/tennis-de-table-les-lebrun-contre-le-spo-rouen-et-pour-un-record';
const METZ='https://www.tennisactu.net/news-metz-ch-moutet-kouame-bonzi-mannarino-un-joli-plateau-devoile-127949.html';
const FFTT_CALENDAR='https://www.fftt.com/calendrier-international/';
const ATP='https://www.nittoatpfinals.com/en/news/nitto-atp-finals-2026-schedule-sunday-monday';
const WTA='https://www.wtatennis.com/news/4599683';
const CYCLING='https://cyclingdb.com/rider/paul-seixas';
const PCS='https://www.procyclingstats.com/rider/paul-seixas/calendar';
const SAITAMA='https://www.saitamacriterium.com/fr/actus/2025/seixas-et-un-arc-en-ciel-au-pays-du-soleil-levant/204';
const SINGAPORE='https://www.straitstimes.com/sport/mexican-young-star-isaac-del-toro-wins-tour-de-france-singapore-criterium';
// Niveau de vérification : "affiche" pour une rencontre et un adversaire annoncés ;
// "engagé" pour une participation annoncée à une compétition sans tableau précis ;
// "calendrier" pour un événement général sans engagement nominatif confirmé.
const fixture=(name,id,date,title,competition,sourceUrl,opts={})=>({
 id:'v10-'+id,favorite:name,date,title,competition,source:'Calendrier vérifié · '+(opts.organizer||'organisateur'),
 sourceUrl,status:'À venir',type:opts.type||'program',snapshot:!opts.exactTime,
 scheduledCompetition:!!opts.scheduledCompetition,
 endDate:opts.endDate||null,
 participationLevel:opts.participationLevel||'affiche',
 round:opts.round||'',score:'',home:opts.home||null,away:opts.away||null,
 sport:opts.sport||'',notes:opts.notes||''
});
const UPCOMING=[
 fixture('Paul Seixas','saitama-2026','2026-11-15T12:00:00+09:00','Paul Seixas — Critérium de Saitama','Critérium ASO d’exhibition · Saitama (Japon)',SAITAMA,{sport:'Cyclisme',type:'cycling-competition',scheduledCompetition:true,endDate:'2026-11-15T23:59:00+09:00',participationLevel:'engagé',organizer:'ASO / Saitama',notes:'Participation confirmée, heure de la course à vérifier ; hors calendrier UCI WorldTour.'}),
 fixture('XV de France','rugby-sa-13','2026-11-13T21:10:00+01:00','France — Afrique du Sud','Championnat des Nations 2026',RUGBY,{sport:'Rugby',type:'rugby',exactTime:true,organizer:'FFR',home:'France',away:'Afrique du Sud'}),
 fixture('XV de France','rugby-arg-21','2026-11-21T21:10:00+01:00','France — Argentine','Championnat des Nations 2026',RUGBY_TICKET,{sport:'Rugby',type:'rugby',exactTime:true,organizer:'FFR',home:'France',away:'Argentine'}),
 fixture('Moïse Kouamé','metz-ch-2026','2026-11-15T12:00:00+01:00','Moïse Kouamé — Open Metz–Grand Est','Challenger 125 · 15–22 novembre',METZ,{sport:'Tennis',type:'tennis-competition',scheduledCompetition:true,endDate:'2026-11-22T23:59:00+01:00',participationLevel:'engagé',organizer:'Organisation / TennisActu',notes:'Inscription annoncée ; heure du premier match et adversaire non publiés.'}),
 fixture('Félix Lebrun','rouen-proa-2026','2026-11-24T19:30:00+01:00','SPO Rouen — Alliance Nîmes–Montpellier','Pro A messieurs · Journée 7',ROUEN,{sport:'Tennis de table',type:'ping',exactTime:true,organizer:'Ville de Rouen',participationLevel:'engagé',notes:'Présence annoncée des frères Lebrun ; adversaire du simple à déterminer.'}),
 fixture('Alexis Lebrun','rouen-proa-2026','2026-11-24T19:30:00+01:00','SPO Rouen — Alliance Nîmes–Montpellier','Pro A messieurs · Journée 7',ROUEN,{sport:'Tennis de table',type:'ping',exactTime:true,organizer:'Ville de Rouen',participationLevel:'engagé',notes:'Présence annoncée des frères Lebrun ; adversaire du simple à déterminer.'}),
 ...['Félix Lebrun','Alexis Lebrun','Flavien Coton'].map(name=>
  fixture(name,'world-mixed-2026','2026-11-29T12:00:00+01:00','Coupe du monde mixte — Chengdu','Tennis de table · 29 nov. – 6 déc.',MIXED,{sport:'Tennis de table',type:'ping-competition',scheduledCompetition:true,endDate:'2026-12-06T23:59:00+01:00',participationLevel:'engagé',organizer:'FFTT',notes:'Sélection officielle de l’équipe de France ; horaires et oppositions à venir.'})),
 fixture('Rafael Jódar','atp-finals-jodar-15','2026-11-15T14:00:00+01:00','Alexander Zverev — Rafael Jódar','ATP Finals · Turin · Phase de groupes',ATP,{sport:'Tennis',type:'tennis',exactTime:true,organizer:'ATP',round:'Round robin',notes:'Pas avant 14 h 00'}),
 fixture('Arthur Fils','atp-finals-fils-15','2026-11-15T20:30:00+01:00','Ben Shelton — Arthur Fils','ATP Finals · Turin · Phase de groupes',ATP,{sport:'Tennis',type:'tennis',exactTime:true,organizer:'ATP',round:'Round robin',notes:'Pas avant 20 h 30'}),
 fixture('Carlos Alcaraz','atp-finals-alcaraz-16','2026-11-16T14:00:00+01:00','Carlos Alcaraz — Frances Tiafoe','ATP Finals · Turin · Phase de groupes',ATP,{sport:'Tennis',type:'tennis',exactTime:true,organizer:'ATP',round:'Round robin',notes:'Pas avant 14 h 00'}),
 fixture('Mirra Andreeva','wta-finals-mirra-13','2026-11-13T01:00:00+01:00','Mirra Andreeva — Karolína Muchová','WTA Finals · Indian Wells · Phase de groupes','https://www.eurosport.fr/tennis/wta-finals/2026/live-mirra-andreeva-karolina-muchova_mtc22044018/live.shtml',{sport:'Tennis',type:'tennis',exactTime:true,organizer:'WTA / Eurosport',round:'Round robin',notes:'Horaire indiqué en France : 01 h 00 le 13 novembre.'})
];
// Tous les résultats ci-dessous proviennent du relevé 2026 de CyclingDB
// recoupé avec le calendrier ProCyclingStats. Les courses à étapes et leurs
// étapes n'ont PAS la même unité.
const RACES=[
 ['2026-02-22','Volta ao Algarve (classement général)','2e'],
 ['2026-02-28','Faun-Ardèche Classic','1er'],
 ['2026-03-07','Strade Bianche','2e'],
 ['2026-04-11','Itzulia · Tour du Pays basque (général)','1er'],
 ['2026-04-22','La Flèche Wallonne','1er'],
 ['2026-04-26','Liège–Bastogne–Liège','2e'],
 ['2026-06-14','Tour Auvergne–Rhône-Alpes','Abandon (étape 8)'],
 ['2026-07-26','Tour de France (classement général)','4e'],
 ['2026-09-11','Grand Prix cycliste de Québec','17e'],
 ['2026-09-13','Grand Prix cycliste de Montréal','2e'],
 ['2026-09-27','Championnats du monde sur route','15e'],
 ['2026-10-10','Tour de Lombardie','1er']
];
const TDF=[
// Date, numéro d'étape, classement à l'arrivée (source CyclingDB).
 ['2026-07-04',1,6],['2026-07-05',2,9],['2026-07-06',3,4],
 ['2026-07-07',4,50],['2026-07-08',5,23],['2026-07-09',6,5],
 ['2026-07-10',7,41],['2026-07-11',8,33],['2026-07-12',9,15],
 ['2026-07-14',10,3],['2026-07-15',11,63],['2026-07-16',12,35],
 ['2026-07-17',13,51],['2026-07-18',14,3],['2026-07-19',15,4],
 ['2026-07-21',16,4],['2026-07-22',17,59],['2026-07-23',18,16],
 ['2026-07-24',19,9],['2026-07-25',20,10],['2026-07-26',21,47]
];
const BASQUE=[
 ['2026-04-06',1,1],['2026-04-07',2,1],['2026-04-08',3,12],
 ['2026-04-09',4,8],['2026-04-10',5,1],['2026-04-11',6,21]
];
const ALGARVE=[
 ['2026-02-18',1,110],['2026-02-19',2,1],['2026-02-20',3,4],
 ['2026-02-21',4,62],['2026-02-22',5,3]
];
const AURA=[
 ['2026-06-07',1,17],['2026-06-08',2,30],['2026-06-09',3,6],
 ['2026-06-10',4,78],['2026-06-11',5,58],['2026-06-12',6,21],
 ['2026-06-13',7,7],['2026-06-14',8,'Abandon']
];
const place=x=>typeof x==='number'?x+(x===1?'er':'e'):x;
const result=(id,date,title,score,category,type='cycling')=>({
 id:'v10-cycling-'+id,date:date+'T12:00:00+02:00',favorite:'Paul Seixas',
 title:'Paul Seixas — '+title,score,competition:category,
 source:'CyclingDB · résultats 2026',sourceUrl:CYCLING,
 status:'Terminé',type,snapshot:true,cycleUnit:type==='cycling-stage'?'étape':'course',
 sport:'Cyclisme'
});
const PAST=[
 {id:'v10-criterium-singapore',date:'2026-11-08T12:00:00+08:00',favorite:'Paul Seixas',
  title:'Paul Seixas — Critérium de Singapour',score:'2e',competition:'Critérium ASO · exhibition',
  source:'The Straits Times · 8 novembre 2026',sourceUrl:SINGAPORE,status:'Terminé',
  type:'cycling-criterium',snapshot:true,cycleUnit:'critérium',sport:'Cyclisme'},
 ...RACES.map(([date,title,rank],i)=>result('race'+i,date,title,rank,'Cyclisme · résultat de course')),
 ...TDF.map(([date,no,rank])=>result('tdf'+no,date,'Tour de France · Étape '+no,place(rank),'Tour de France · étapes','cycling-stage')),
 ...BASQUE.map(([date,no,rank])=>result('basque'+no,date,'Tour du Pays basque · Étape '+no,place(rank),'Itzulia · étapes','cycling-stage')),
 ...ALGARVE.map(([date,no,rank])=>result('algarve'+no,date,'Tour d’Algarve · Étape '+no,place(rank),'Algarve · étapes','cycling-stage')),
 ...AURA.map(([date,no,rank])=>result('aura'+no,date,'Tour Auvergne–Rhône-Alpes · Étape '+no,place(rank),'Tour AURA · étapes','cycling-stage'))
];
export const PROGRAM_2026={future:UPCOMING,past:PAST};
export function extraProgramFor(favorites,now=new Date()){
 const available=new Set(favorites.map(x=>x.name));
 // Retirer les fixtures qui sont définitivement dans le passé, sans les
 // considérer comme un score terminé. Les résultats manuels restent passés.
 const future=UPCOMING.filter(x=>available.has(x.favorite)&&Date.parse(x.endDate||x.date)>=now.getTime()-4*3600000);
 const past=PAST.filter(x=>available.has(x.favorite)&&Date.parse(x.date)<=now.getTime());
 return {future,past};
}
export function nextCompetitionNote(name,now=new Date()){
 const list=UPCOMING.filter(x=>x.favorite===name&&Date.parse(x.endDate||x.date)>=now.getTime())
  .sort((a,b)=>Date.parse(a.date)-Date.parse(b.date));
 if(list.length)return {text:'Prochain événement annoncé : '+list[0].competition,url:list[0].sourceUrl};
 if(name==='Paul Seixas')return {text:'Aucune nouvelle course UCI 2026 annoncée après le Tour de Lombardie ; le critérium d’exhibition de Saitama du 15 novembre est suivi séparément.',url:SAITAMA};
 if(name==='Jannik Sinner')return {text:'Aucune prochaine compétition confirmée dans le calendrier vérifié. Consulte le calendrier ATP pour les nouvelles annonces.',url:'https://www.atptour.com/en/tournaments'};
 return null;
}
