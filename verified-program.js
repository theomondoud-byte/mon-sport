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
const SAITAMA_RESULT='https://www.cyclingnews.com/pro-cycling/racing/paul-seixas-chases-down-world-champion-brandon-mcnulty-at-tour-de-france-saitama-criterium-to-close-out-2026-season-with-a-win/';
const ROUEN_RESULT='https://www.tendanceouest.com/actualite-444513-photos-tennis-de-table-l-alliance-nimes-montpellier-des-freres-lebrun-s-impose-face-au-spo-de-rouen';
const DAVIS='https://www.daviscup.com/en/draws-results/2026/finals';
const PEKIN='https://www.equipe-france.fr/natation/championnats-du-monde-en-petit-bassin-2026-leon-marchand-emmene-18-bleus-aux-mondiaux-en-petit-bassin-de-pekin';
const MARCHAND_PROGRAM='https://www.ouest-france.fr/sport/natation/natation-mondiaux-en-petit-bassin-six-epreuves-et-autant-de-chances-de-medailles-le-programme-de-leon-marchand-4beac378-e785-11f1-bd4e-6f30b8f49e21';
const NEXTGEN='https://www.tennisworlditalia.com/en/tennis/news/Atp_Tennis/108604/next-gen-atp-finals-jodar-and-fonseca-withdraw-the-qualifiers-and-wild-card/';
const DAVIS_SEMIS='https://www.universtennis.com/2026/11/26/coupe-davis-programme-des-demi-finales-compositions-probables-horaires-et-diffusion-tv/';
const WTT_FINALS='https://tennis2table.com/actualite/internationale/wtt-world-table-tennis/wtt-finals-hong-kong-2026-felix-et-alexis-lebrun-parmi-les-16-meilleurs-de-la-saison.html';
const AO='https://www.redbull.com/fr-fr/open-australie-guide';
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
 fixture('XV de France','rugby-final-29','2026-11-29T17:40:00+01:00','France — Afrique du Sud','Championnat des Nations 2026','https://www.ffr.fr/actualites/xv-de-france/championnat-des-nations-le-programme-des-finales',{sport:'Rugby',type:'rugby',exactTime:true,organizer:'FFR',home:'France',away:'Afrique du Sud',round:'Finale',notes:'Finale à Twickenham (Londres), coup d’envoi 17 h 40, en clair sur TF1. Les Bleus ont fini premiers de la poule Nord, les Springboks de la poule Sud.'}),
 fixture('XV de France','rugby-arg-21','2026-11-21T21:10:00+01:00','France — Argentine','Championnat des Nations 2026',RUGBY_TICKET,{sport:'Rugby',type:'rugby',exactTime:true,organizer:'FFR',home:'France',away:'Argentine'}),
 fixture('Félix Lebrun','rouen-proa-2026','2026-11-24T19:30:00+01:00','SPO Rouen — Alliance Nîmes–Montpellier','Pro A messieurs · Journée 7',ROUEN,{sport:'Tennis de table',type:'ping',exactTime:true,organizer:'Ville de Rouen',participationLevel:'engagé',notes:'Présence annoncée des frères Lebrun ; adversaire du simple à déterminer.'}),
 fixture('Alexis Lebrun','rouen-proa-2026','2026-11-24T19:30:00+01:00','SPO Rouen — Alliance Nîmes–Montpellier','Pro A messieurs · Journée 7',ROUEN,{sport:'Tennis de table',type:'ping',exactTime:true,organizer:'Ville de Rouen',participationLevel:'engagé',notes:'Présence annoncée des frères Lebrun ; adversaire du simple à déterminer.'}),
 ...['Félix Lebrun','Alexis Lebrun','Flavien Coton'].map(name=>
  fixture(name,'world-mixed-2026','2026-11-29T12:00:00+01:00','Coupe du monde mixte — Chengdu','Tennis de table · 29 nov. – 6 déc.',MIXED,{sport:'Tennis de table',type:'ping-competition',scheduledCompetition:true,endDate:'2026-12-06T23:59:00+01:00',participationLevel:'engagé',organizer:'FFTT',notes:'Sélection officielle de l’équipe de France ; horaires et oppositions à venir.'})),
 // Coupe Davis, phase finale à huit (Bologne, 24–29 novembre) : l'Espagne
 // joue son quart contre l'Autriche le 26 ; Alcaraz est réservé au double.
 ...['Carlos Alcaraz','Rafael Jódar'].map(name=>
  fixture(name,'davis-final8-2026','2026-11-26T10:00:00+01:00','Espagne — Coupe Davis','Coupe Davis · phase finale · Bologne · 24–29 nov.',DAVIS,{sport:'Tennis',type:'tennis-competition',scheduledCompetition:true,endDate:'2026-11-29T23:59:00+01:00',participationLevel:'engagé',organizer:'ITF',notes:'Quart de finale Espagne — Autriche le 26 novembre (Mérida et Jódar en simple, Alcaraz réservé au double) ; demi-finale contre la Grande-Bretagne le 28, finale le 29.'})),
 // Coupe Davis : demi-finale de l'Espagne (finale le dimanche 29 à 15 h si qualifiée).
 ...['Carlos Alcaraz','Rafael Jódar'].map(name=>
  fixture(name,'davis-sf-2026','2026-11-28T12:00:00+01:00','Grande-Bretagne — Espagne','Coupe Davis · demi-finale · Bologne',DAVIS_SEMIS,{sport:'Tennis',type:'tennis-tie',exactTime:true,organizer:'ITF',home:'Grande-Bretagne',away:'Espagne',participationLevel:'engagé',notes:'Deux simples puis un double si nécessaire ; finale dimanche 29 novembre à 15 h contre l’Italie ou la Tchéquie.'})),
 // Mondiaux en petit bassin (Pékin, 1er–6 décembre) : 18 Bleus sélectionnés.
 ...['Léon Marchand','Sauveur Cristofini'].map(name=>
  fixture(name,'pekin-sc-2026','2026-12-01T03:00:00+01:00','Mondiaux en petit bassin — Pékin','Championnats du monde 25 m · 1er–6 décembre',PEKIN,{sport:'Natation',type:'swim-competition',scheduledCompetition:true,endDate:'2026-12-06T13:00:00+01:00',participationLevel:'engagé',organizer:'FFN / World Aquatics',notes:'Séries la nuit (heure de Paris), finales à 12 h (11 h le dimanche).'})),
 ...[['2026-12-01','200 m 4 nages'],['2026-12-03','200 m papillon'],['2026-12-04','200 m brasse'],['2026-12-04','Relais 4 × 200 m nage libre'],['2026-12-05','400 m 4 nages'],['2026-12-06','Relais 4 × 100 m 4 nages']].map(([day,event])=>
  fixture('Léon Marchand','pekin-'+day+'-'+event.replace(/\W/g,''),day+(day==='2026-12-06'?'T11:00:00+01:00':'T12:00:00+01:00'),'Léon Marchand — '+event,'Mondiaux en petit bassin · Pékin · heure de la finale',MARCHAND_PROGRAM,{sport:'Natation',type:'swim-event',exactTime:true,organizer:'FFN',participationLevel:'engagé',notes:'Heure indiquée : celle de la finale (heure de Paris) ; les séries ont lieu le matin à Pékin, dans la nuit en France.'})),
 // Next Gen ATP Finals (Reggio de Calabre) : Kouamé qualifié, 2e tête de série.
 fixture('Moïse Kouamé','nextgen-2026','2026-12-09T12:00:00+01:00','Moïse Kouamé — Next Gen ATP Finals','Next Gen ATP Finals · Reggio de Calabre · 9–13 déc.',NEXTGEN,{sport:'Tennis',type:'tennis-competition',scheduledCompetition:true,endDate:'2026-12-13T23:59:00+01:00',participationLevel:'engagé',organizer:'ATP',notes:'Qualifié directement, 2e tête de série derrière Martín Landaluce ; plus jeune qualifié de l’histoire du tournoi. Poules puis demi-finales et finale.'}),
 // WTT Finals (Hong Kong) : les deux frères parmi les 16 meilleurs de la saison.
 ...['Félix Lebrun','Alexis Lebrun'].map(name=>
  fixture(name,'wtt-finals-2026','2026-12-09T08:00:00+01:00','WTT Finals — Hong Kong','Tennis de table · Kai Tak Arena · 9–13 déc.',WTT_FINALS,{sport:'Tennis de table',type:'ping-competition',scheduledCompetition:true,endDate:'2026-12-13T16:00:00+01:00',participationLevel:'engagé',organizer:'WTT',notes:'Tournoi de fin de saison des 16 meilleurs joueurs.'})),
 // Open d'Australie 2027 : entrée selon le classement, inscriptions pas encore publiées.
 ...['Carlos Alcaraz','Rafael Jódar','Arthur Fils','Mirra Andreeva'].map(name=>
  fixture(name,'ao-2027','2027-01-17T01:00:00+01:00','Open d’Australie 2027','Grand Chelem · Melbourne · 17–31 janv.',AO,{sport:'Tennis',type:'tennis-competition',scheduledCompetition:true,endDate:'2027-01-31T13:00:00+01:00',participationLevel:'calendrier',organizer:'Tennis Australia',notes:'Entrée directe grâce au classement ; liste officielle des engagés pas encore publiée.'})),
 fixture('Moïse Kouamé','ao-2027-q','2027-01-11T01:00:00+01:00','Moïse Kouamé — Open d’Australie 2027','Grand Chelem · Melbourne · qualifications 11–16 janv.',AO,{sport:'Tennis',type:'tennis-competition',scheduledCompetition:true,endDate:'2027-01-31T13:00:00+01:00',participationLevel:'calendrier',organizer:'Tennis Australia',notes:'Classé autour de la 130e place : qualifications probables ; liste officielle pas encore publiée.'}),
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
 {id:'v10-criterium-saitama',date:'2026-11-15T12:00:00+09:00',favorite:'Paul Seixas',
  title:'Paul Seixas — Critérium de Saitama',score:'1er',competition:'Critérium ASO · exhibition',
  source:'Cyclingnews · 15 novembre 2026',sourceUrl:SAITAMA_RESULT,status:'Terminé',
  type:'cycling-criterium',snapshot:true,cycleUnit:'critérium',sport:'Cyclisme',
  notes:'Seixas rejoint puis lâche le champion du monde Brandon McNulty à 3 km de l’arrivée ; Torstein Træen 3e.'},
 {id:'v10-proa-rouen-result',date:'2026-11-24T19:30:00+01:00',favorite:'Félix Lebrun',additionalFavorites:['Alexis Lebrun'],
  home:'SPO Rouen',away:'Alliance Nîmes–Montpellier',homeScore:0,awayScore:3,winner:true,exactTime:true,
  competition:'Pro A messieurs · Journée 7',source:'Tendance Ouest · 24 novembre 2026',sourceUrl:ROUEN_RESULT,
  status:'Terminé',type:'ping',sport:'Tennis de table',
  notes:'Victoire 3–0 de l’Alliance des frères Lebrun devant 5 276 spectateurs, record d’affluence en Pro A.'},
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
 const cutoff=now.getTime()-4*3600000;
 const future=UPCOMING.filter(x=>available.has(x.favorite)&&Date.parse(x.endDate||x.date)>=cutoff);
 const pending=UPCOMING.filter(x=>available.has(x.favorite)&&Date.parse(x.endDate||x.date)<cutoff).map(x=>({
  ...x,status:'Résultat à vérifier',pendingResult:true,
  notes:[x.notes,'Résultat non encore trouvé dans les sources connectées.'].filter(Boolean).join(' ')
 }));
 const past=PAST.filter(x=>available.has(x.favorite)&&Date.parse(x.date)<=now.getTime());
 return {future,past,pending};
}
// Prochaine échéance connue de chaque favori (vérifiée le 27 novembre 2026),
// affichée quand aucun événement n'est programmé dans la période choisie.
// Chaque favori DOIT avoir une entrée (test de couverture).
export const NEXT_CHECKED='2026-11-27';
const ESPN_AUTO={text:'Prochains matchs ajoutés automatiquement depuis ESPN dès leur programmation.',url:'https://www.espn.com/soccer/'};
export const NEXT_NOTES={
 'Real Madrid':ESPN_AUTO,'FC Barcelone':ESPN_AUTO,'PSG':ESPN_AUTO,
 'Kylian Mbappé':{text:'Matchs du Real Madrid (voir sa fiche) : il est rattaché à une rencontre une fois sa présence confirmée par la feuille de match ESPN.',url:'https://www.espn.com/soccer/team/fixtures/_/id/86/real-madrid'},
 'San Antonio Spurs':{...ESPN_AUTO,url:'https://www.espn.com/nba/team/schedule/_/name/sa'},'Victor Wembanyama':{...ESPN_AUTO,url:'https://www.espn.com/nba/team/schedule/_/name/sa'},
 'Équipe de France de football':{text:'Quarts de finale de la Ligue des nations entre le 25 et le 30 mars 2027 (adversaire après le tirage).',url:'https://www.fff.fr/article/16250-les-bleus-fixes-pour-l-automne.html'},
 'XV de France':{text:'Après la finale du Championnat des Nations (29 novembre) : Tournoi des Six Nations 2027, à partir de février. Les matchs sont ajoutés automatiquement depuis World Rugby.',url:'https://www.ffr.fr/equipe-de-france/rugby-a-xv/xv-de-france-masculin'},
 'Léon Marchand':{text:'Mondiaux en petit bassin à Pékin du 1er au 6 décembre ; aucune compétition annoncée ensuite.',url:MARCHAND_PROGRAM},
 'Sauveur Cristofini':{text:'Mondiaux en petit bassin à Pékin du 1er au 6 décembre (programme individuel non publié).',url:PEKIN},
 'Félix Lebrun':{text:'Coupe du monde mixte (Chengdu, 29 nov.–6 déc.) puis WTT Finals (Hong Kong, 9–13 déc.). Dates des prochaines journées de Pro A non publiées.',url:WTT_FINALS},
 'Alexis Lebrun':{text:'Coupe du monde mixte (Chengdu, 29 nov.–6 déc.) puis WTT Finals (Hong Kong, 9–13 déc.). Dates des prochaines journées de Pro A non publiées.',url:WTT_FINALS},
 'Flavien Coton':{text:'Coupe du monde mixte (Chengdu, 29 nov.–6 déc.) ; calendrier 2027 non publié.',url:MIXED},
 'Paul Seixas':{text:'Saison 2026 terminée (victoire au Critérium de Saitama). Programme 2027 non annoncé ; il reste chez Decathlon CMA CGM.',url:'https://www.cyclingnews.com/pro-cycling/transfers/paul-seixas-draws-a-line-under-intense-transfer-speculation-with-confirmation-he-will-remain-with-decathlon-cma-in-2027/'},
 'Arthur Fils':{text:'Open d’Australie du 17 au 31 janvier 2027 (inscriptions non publiées).',url:AO},
 'Carlos Alcaraz':{text:'Coupe Davis jusqu’au 29 novembre, puis Open d’Australie du 17 au 31 janvier 2027.',url:AO},
 'Rafael Jódar':{text:'Coupe Davis jusqu’au 29 novembre, puis Open d’Australie du 17 au 31 janvier 2027.',url:AO},
 'Jannik Sinner':{text:'Saison terminée (genou) ; forfait annoncé pour l’Open d’Australie 2027 (ESPN, 26 novembre).',url:'https://www.espn.com/tennis/'},
 'Moïse Kouamé':{text:'Next Gen ATP Finals (Reggio de Calabre, 9–13 déc.), puis Open d’Australie 2027 (qualifications dès le 11 janvier).',url:NEXTGEN},
 'Mirra Andreeva':{text:'Open d’Australie du 17 au 31 janvier 2027 (inscriptions non publiées).',url:AO}
};
export function nextCompetitionNote(name,now=new Date()){
 const list=UPCOMING.filter(x=>x.favorite===name&&Date.parse(x.endDate||x.date)>=now.getTime())
  .sort((a,b)=>Date.parse(a.date)-Date.parse(b.date));
 if(list.length){
  const day=new Date(list[0].date).toLocaleDateString('fr-FR',{day:'numeric',month:'long',timeZone:'Europe/Paris'});
  const label=list[0].title.replace(name+' — ','');
  const detail=list[0].competition.startsWith(label)?list[0].competition:label+' · '+list[0].competition;
  return {text:'Prochain événement : '+detail+' (à partir du '+day+')',url:list[0].sourceUrl};
 }
 return NEXT_NOTES[name]||null;
}
