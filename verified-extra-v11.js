// V11 : compléments factuels 2026 tirés de calendriers fédéraux/club.
// Instantané : 12 novembre 2026. Un classement de série n'est pas un podium
// de finale, une participation non confirmée n'est pas un départ officiel.
export const VERIFIED_AS_OF='2026-11-12';
const BARCA='https://www.fcbarcelona.com/en/football/first-team/results';
const BARCA_SCHEDULE='https://www.fcbarcelona.com/en/football/first-team/schedule';
const AQUA='https://www.lequipe.fr/fiche/sauveur-cristofini/97076';
const FFIN='https://www.ffnatation.fr/actualites/actu-grand-public/championnats-deurope-de-paris-2026-sauveur-cristofini-en-grande-forme';
const FFN_ARCHIVE='https://ffn.extranat.fr/webffn/resultats.php?go=res&idact=&idban=43306&idcpt=92037&idres=23738113';
const FFN_RECORDS='https://ffn.extranat.fr/webffn/nat_records.php?day=&idact=nat&idbas=&idcat=&idniv=4&idsex=&idzon=1581&month=&year=';
const FFN_RESULTS='https://www.liveffn.com/cgi-bin/resultats.php?competition=94430&epreuve=91&go=epreuve&langue=gbr';
const FFTT='https://www.fftt.com/actualites/equipe-de-france/championnats-deurope-2026-programme-resultats/';
const FFTT_MONT='https://www.fftt.com/actualites/wtt/suivre-le-wtt-champions-de-montpellier-2026/';
const date=(day,hour='12:00')=>day+'T'+hour+':00+01:00';
const football=(day,home,away,a,b,comp)=>({
 id:'v11-barca-'+day+'-'+home.replace(/\W/g,''),date:date(day),home,away,
 homeScore:a,awayScore:b,favorite:'FC Barcelone',status:'Terminé',
 source:'FC Barcelona · résultats officiels',sourceUrl:BARCA,competition:comp,
 type:'team',snapshot:true
});
const upcoming=(day,hour,home,away,competition,exact=true)=>({
 id:'v11-barca-next-'+day+'-'+home.replace(/\W/g,''),date:date(day,hour||'12:00'),
 home,away,homeScore:null,awayScore:null,favorite:'FC Barcelone',status:'À venir',
 competition,source:'FC Barcelona · calendrier officiel',sourceUrl:BARCA_SCHEDULE,
 type:'team',snapshot:!exact,exactTime:exact
});
const result=(name,day,event,score,rank,link,comp,extra={})=>({
 id:'v11-'+name.replace(/\W/g,'')+'-'+day+'-'+event.replace(/\W/g,'').slice(0,24),
 favorite:name,date:date(day),title:name+' — '+event,score:rank?score+' · '+rank:score,
 competition:comp,source:extra.source||'Résultat fédéral 2026',sourceUrl:link,
 status:'Terminé',type:extra.type||'swim',snapshot:true,
 rank:rank||'',round:extra.round||'',outcome:extra.outcome||null,
 notes:extra.notes||'',sport:extra.sport||'Natation'
});
const tt=(day,name,opp,forSets,againstSets,comp='Championnats d’Europe 2026',link=FFTT)=>result(
 name,day,opp,forSets+'–'+againstSets,forSets>againstSets?'V':'D',link,comp,
 {type:'ping',sport:'Tennis de table',outcome:forSets>againstSets?'Victoire':'Défaite',
 source:link===FFTT?'FFTT · résultats officiels':'FFTT · WTT Montpellier'}
);
const BARCA_RESULTS=[
 ['2026-08-16','FC Basel','FC Barcelona',2,5,'Amical'],
 ['2026-08-19','FC Barcelona','Al Ahly',2,1,'Amical'],
 ['2026-08-23','Elche','FC Barcelona',0,5,'LaLiga'],
 ['2026-08-27','FC Barcelona','Athletic Club',2,0,'LaLiga'],
 ['2026-08-31','FC Barcelona','Rayo Vallecano',5,2,'LaLiga'],
 ['2026-09-06','Valencia CF','FC Barcelona',0,5,'LaLiga'],
 ['2026-09-09','FC Barcelona','Feyenoord',5,1,'Ligue des champions'],
 ['2026-09-13','Levante','FC Barcelona',2,4,'LaLiga'],
 ['2026-09-16','FC Barcelona','Racing de Santander',7,2,'LaLiga'],
 ['2026-09-19','Sevilla','FC Barcelona',1,3,'LaLiga'],
 ['2026-10-10','FC Barcelona','Getafe',3,0,'LaLiga'],
 ['2026-10-13','Galatasaray','FC Barcelona',1,4,'Ligue des champions'],
 ['2026-10-17','Real Betis','FC Barcelona',2,5,'LaLiga'],
 ['2026-10-20','PSG','FC Barcelona',4,2,'Ligue des champions'],
 ['2026-10-25','FC Barcelona','Real Madrid',1,2,'LaLiga'],
 ['2026-10-31','FC Barcelona','Alavés',6,1,'LaLiga'],
 ['2026-11-03','FC Barcelona','Aston Villa',3,0,'Ligue des champions'],
 ['2026-11-08','Atlético Madrid','FC Barcelona',1,2,'LaLiga']
].map(x=>football(...x));
const BARCA_FUTURE=[
 ['2026-11-22','14:00','FC Barcelona','Villarreal','LaLiga',true],
 ['2026-11-25','18:45','Sabah','FC Barcelona','Ligue des champions',true],
 ['2026-11-29','16:15','Deportivo de La Coruña','FC Barcelona','LaLiga',true],
 ['2026-12-02','21:30','FC Barcelona','Atlético Madrid','LaLiga',true],
 ['2026-12-06',null,'FC Barcelona','Celta de Vigo','LaLiga',false],
 ['2026-12-08','21:00','FC Barcelona','Manchester City','Ligue des champions',true],
 ['2026-12-13',null,'Málaga','FC Barcelona','LaLiga',false],
 ['2026-12-20',null,'FC Barcelona','Real Sociedad','LaLiga',false],
 ['2027-01-03',null,'Espanyol','FC Barcelona','LaLiga',false],
 ['2027-01-10',null,'Osasuna','FC Barcelona','LaLiga',false]
].map(x=>upcoming(...x));
const CRISTOFINI=[
 result('Sauveur Cristofini','2025-12-02','Championnats d’Europe petit bassin · 400 m nage libre (séries)','3:41.72','17e des séries',FFN_ARCHIVE,'400 m nage libre (25 m)'),
 result('Sauveur Cristofini','2025-12-13','France juniors · 400 m quatre nages','4:12.90','record national U17','https://www.lequipe.fr/Natation/Actualites/Sauveur-cristofini-bat-le-record-de-france-des-16-ans-sur-400-m-4-nages-que-detenait-leon-marchand/1616666','400 m 4 nages (25 m)'),
 result('Sauveur Cristofini','2026-03-20','Meeting de Saint-Denis · 400 m nage libre','3:48.29','3e',AQUA,'400 m nage libre'),
 result('Sauveur Cristofini','2026-03-21','Meeting de Saint-Denis · 200 m nage libre','1:47.56','3e',AQUA,'200 m nage libre'),
 result('Sauveur Cristofini','2026-05-23','Meeting de Monaco · 400 m nage libre','3:48.27','2e',AQUA,'400 m nage libre'),
 result('Sauveur Cristofini','2026-06-28','Championnats de France · 100 m nage libre','48.99','3e',AQUA,'100 m nage libre'),
 result('Sauveur Cristofini','2026-06-30','Championnats de France · 200 m nage libre','1:46.86','1er',AQUA,'200 m nage libre'),
 result('Sauveur Cristofini','2026-07-02','Championnats de France · 400 m nage libre','3:47.99','1er',AQUA,'400 m nage libre'),
 result('Sauveur Cristofini','2026-08-10','Championnats d’Europe · relais masculin 4 × 200 m nage libre','7:02.23','2e',AQUA,'4 × 200 m relais'),
 result('Sauveur Cristofini','2026-08-13','Championnats d’Europe · 200 m nage libre (séries)','1:45.93','3e des séries',FFIN,'200 m nage libre',{notes:'3e chrono de séries ; pas un classement de finale'}),
 result('Sauveur Cristofini','2026-08-13','Championnats d’Europe · 200 m nage libre (demi-finale)','1:45.74','hors finale',FFN_RECORDS,'200 m nage libre',{notes:'Record personnel en demi-finale ; pas qualifié pour la finale'}),
 result('Sauveur Cristofini','2026-08-15','Championnats d’Europe · relais mixte 4 × 200 m nage libre','7:30.70','5e',AQUA,'4 × 200 m relais mixte'),
 result('Sauveur Cristofini','2026-08-16','Championnats d’Europe · 400 m nage libre (séries)','3:46.98','hors finale',FFN_RECORDS,'400 m nage libre',{notes:'Record personnel de séries ; aucune finale'}),
 result('Sauveur Cristofini','2026-11-01','Championnats de France petit bassin · 200 m 4 nages (finale B)','1:57.52','1er de finale B',FFN_RESULTS,'200 m quatre nages',{notes:'1er de la finale B : ne pas confondre avec le titre national'})
];
const PING=[
 tt('2026-10-14','Félix Lebrun','Maciej Kubik',4,0),
 tt('2026-10-15','Félix Lebrun','Ivor Ban',4,0),
 tt('2026-10-16','Félix Lebrun','Elias Ranefur',4,2),
 tt('2026-10-17','Félix Lebrun','Patrick Franziska',4,0),
 tt('2026-10-18','Félix Lebrun','Léo de Nodrest',4,2),
 tt('2026-10-18','Félix Lebrun','Anton Källberg',4,3),
 tt('2026-10-14','Alexis Lebrun','Tiago Apolonia',4,0),
 tt('2026-10-15','Alexis Lebrun','Vladislav Ursu',4,2),
 tt('2026-10-16','Alexis Lebrun','Kristian Karlsson',4,2),
 tt('2026-10-17','Alexis Lebrun','Dang Qiu',1,4),
 tt('2026-10-14','Flavien Coton','Connor Green',4,2),
 tt('2026-10-15','Flavien Coton','Simon Gauzy',2,4),
 tt('2026-10-27','Félix Lebrun','Anders Lind',3,0,'WTT Montpellier',FFTT_MONT),
 tt('2026-10-30','Félix Lebrun','Zhou Qihao',1,3,'WTT Montpellier',FFTT_MONT),
 tt('2026-10-28','Alexis Lebrun','Patrick Franziska',2,3,'WTT Montpellier',FFTT_MONT),
 tt('2026-10-28','Flavien Coton','Jang Woojin',2,3,'WTT Montpellier',FFTT_MONT)
];
export const EXTRA_2026_PAST=[...BARCA_RESULTS,...CRISTOFINI,...PING];
export const EXTRA_2026_FUTURE=BARCA_FUTURE;
export function verifiedExtraFor(favorites,now=new Date()){
 const names=new Set(favorites.map(f=>f.name)),ms=now.getTime();
 const cutoff=ms-4*3600000;
 return {
  past:EXTRA_2026_PAST.filter(e=>names.has(e.favorite)&&Date.parse(e.date)<=ms),
  future:EXTRA_2026_FUTURE.filter(e=>names.has(e.favorite)&&Date.parse(e.date)>=cutoff),
  pending:EXTRA_2026_FUTURE.filter(e=>names.has(e.favorite)&&Date.parse(e.date)<cutoff).map(e=>({
   ...e,status:'Résultat à vérifier',pendingResult:true,
   notes:'Score non encore confirmé par les sources connectées.'
  }))
 };
}
