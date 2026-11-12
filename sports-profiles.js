// Mon Sport V9 — fiches sportives vérifiées le 12 novembre 2026.
// Les classements sont des instantanés DATÉS et jamais présentés comme du direct.
const DAY=86400000;
export const PROFILE_CHECKED='2026-11-12';
export const PROFILES={
 'Sauveur Cristofini':{born:'2009-11-29',country:'France',role:'Natation · nage libre / 4 nages',fact:'Champion de France grand bassin 2026 du 200 m et du 400 m libre. Argent aux Championnats d’Europe 2026 avec le relais 4 × 200 m libre.',source:'https://www.lequipe.fr/fiche/sauveur-cristofini/97076'},
 'FC Barcelone':{role:'Football · LaLiga et Ligue des champions',fact:'Résultats de LaLiga et de Ligue des champions, avec calendrier officiel du club et relevés ESPN.',source:'https://www.fcbarcelona.com/en/football/first-team/results'},
 'Arthur Fils':{born:'2004-06-12',country:'France',role:'Tennis · droitier',rank:{label:'ATP simple',value:'#7',asOf:'2026-11-09',source:'https://tennisabstract.com/reports/atpRankings.html'},fact:'Meilleur Français au classement ATP des favoris suivis cette semaine.',source:'https://www.atptour.com/en/players/'},
 'Jannik Sinner':{born:'2001-08-16',country:'Italie',role:'Tennis · droitier',rank:{label:'ATP simple',value:'#2',asOf:'2026-11-09',source:'https://tennisabstract.com/reports/atpRankings.html'},fact:'Vainqueur de Wimbledon 2026 selon les résultats ajoutés à Mon Sport.',source:'https://www.wimbledon.com/'},
 'Carlos Alcaraz':{born:'2003-05-05',country:'Espagne',role:'Tennis · droitier',rank:{label:'ATP simple',value:'#3',asOf:'2026-11-09',source:'https://tennisabstract.com/reports/atpRankings.html'},fact:'Présent dans le trio de tête ATP au 9 novembre 2026.',source:'https://www.atptour.com/en/players/'},
 'Rafael Jódar':{born:'2006-09-17',country:'Espagne',role:'Tennis · droitier',rank:{label:'ATP simple',value:'#11',asOf:'2026-11-09',source:'https://tennisabstract.com/reports/atpRankings.html'},fact:'En progression dans le Top 20 ATP en 2026.',source:'https://www.lequipe.fr/Tennis/TennisFicheJoueur14577.html'},
 'Moïse Kouamé':{born:'2009-03-06',country:'France',role:'Tennis · droitier',rank:{label:'ATP simple',value:'#132',asOf:'2026-11-09',source:'https://fr.tennistemple.com/player/moise-kouame/rankings'},fact:'Troisième tour de Roland-Garros 2026 et deux titres ITF en janvier.',source:'https://www.fft.fr/actualites/roland-garros-moise-kouame-chiffres-anecdotes-tableau'},
 'Mirra Andreeva':{born:'2007-04-29',country:'Russie',role:'Tennis · droitière',rank:{label:'WTA simple',value:'#3',asOf:'2026-11-09',source:'https://www.world.tennis/en/players/mirra-andreeva/800543040/rus/wt/S/overview/'},fact:'Bilan professionnel 2026 ITF/WTA : 51 victoires, 16 défaites (relevé du 12 novembre).',source:'https://www.world.tennis/en/players/mirra-andreeva/800543040/rus/wt/S/overview/'},
 'Félix Lebrun':{born:'2006-09-12',country:'France',role:'Tennis de table · prise porte-plume',rank:{label:'ITTF simple messieurs',value:'#3',asOf:'2026-11-09',source:'https://www.ittf.com/rankings/'},fact:'Deux médailles de bronze olympiques à Paris 2024 (simple et équipes).',source:'https://www.equipedefrance.com/athlete/felix-lebrun'},
 'Alexis Lebrun':{born:'2003-08-27',country:'France',role:'Tennis de table · droitier',rank:{label:'ITTF simple messieurs',value:'#9',asOf:'2026-11-09',source:'https://www.ittf.com/rankings/'},fact:'Champion d’Europe en simple 2024 et champion d’Europe de double avec Félix.',source:'https://www.fftt.com/'},
 'Flavien Coton':{born:'2008-04-07',country:'France',role:'Tennis de table · droitier, jeu offensif',rank:{label:'ITTF simple messieurs',value:'#23',asOf:'2026-11-09',source:'https://www.ittf.com/rankings/'},fact:'Bronze mondial par équipes en 2026 et champion du monde U15 en 2022.',source:'https://www.fftt.com/flavien-coton/'},
 'Victor Wembanyama':{born:'2004-01-04',country:'France',role:'Basket · intérieur (Spurs)',fact:'Taille : 2,24 m · Numéro 1 de la draft NBA 2023. Les statistiques NBA courantes varient selon la saison.',source:'https://www.nba.com/player/1641705/victor-wembanyama'},
 'Kylian Mbappé':{born:'1998-12-20',country:'France',role:'Football · attaquant, Real Madrid',fact:'Meilleur buteur de la Ligue des champions 2025-2026 (15 buts), selon sa fiche FFF.',source:'https://www.fff.fr/equipe-nationale/joueur/8566-mbappe-kylian/fiche.html'},
 'Léon Marchand':{born:'2002-05-17',country:'France',role:'Natation · 4 nages, papillon, brasse',fact:'4 titres olympiques à Paris 2024 · Record du monde 200 m 4 nages en 1 min 52 s 69 (2025).',source:'https://www.worldaquatics.com/athletes/1188005/ws'},
 'Paul Seixas':{born:'2006-09-24',country:'France',role:'Cyclisme · Decathlon CMA CGM',fact:'Victoires 2026 : Tour de Lombardie, Flèche Wallonne et classement général du Tour du Pays basque.',source:'https://decathloncmacgmteam.com/equipe-world-tour/paul-seixas/'},
 'Real Madrid':{role:'Football · LaLiga · Ligue des champions',fact:'Statistiques : bilan V/N/D, buts pour/contre, différence et tirs selon les feuilles ESPN.',source:'https://www.realmadrid.com/fr-FR/calendrier?filter-football=primer-equipo-masculino'},
 PSG:{role:'Football · Ligue 1 · Ligue des champions',fact:'Statistiques : bilan V/N/D, buts pour/contre, différence et tirs selon les feuilles ESPN.',source:'https://www.psg.fr/football-masculin/calendrier'},
 'San Antonio Spurs':{role:'Basket · NBA · Conférence Ouest',fact:'Statistiques : bilan V/D, points par match, rebonds, passes et adresse selon les feuilles NBA.',source:'https://www.nba.com/spurs/schedule'},
 'Équipe de France de football':{role:'Football · sélection nationale',fact:'Statistiques : matchs internationaux, buts marqués/encaissés et résultats de compétitions.',source:'https://www.fff.fr/'},
 'XV de France':{role:'Rugby · sélection nationale',fact:'Statistiques : points pour/contre, essais, transformations, pénalités et plaquages selon les feuilles de match.',source:'https://www.ffr.fr/'}
};
export const ageAt=(born,now=new Date())=>{
 if(!born)return null;
 const [y,m,d]=born.split('-').map(Number),year=now.getFullYear();
 return year-y-((now.getMonth()+1<m||(now.getMonth()+1===m&&now.getDate()<d))?1:0);
};
export function profileFor(name,now=new Date()){
 const info=PROFILES[name]||{role:'Sportif ou équipe suivi(e)',source:''};
 return {...info,age:ageAt(info.born,now)};
}
export function keySportStats(favorite,items=[],now=new Date()){
 const f=typeof favorite==='string'?{name:favorite,sport:'Autre',type:'sportif'}:favorite;
 const selected=items.filter(m=>Array.isArray(m.favorites)&&m.favorites.includes(f.name)&&m.finished);
 const recent=selected.filter(m=>Date.parse(m.date)>=now.getTime()-366*DAY&&Date.parse(m.date)<=now.getTime());
 const numbers=[];
 if(f.sport==='Football'||f.sport==='Rugby'||f.sport==='Basketball'){
  let scoreFor=0,scoreAgainst=0,n=0;
  for(const match of recent){
   const src=match.origin||{};
   let targetHome=false,targetAway=false;
   const name=f.name.toLowerCase();
   const home=String(src.home||'').toLowerCase(),away=String(src.away||'').toLowerCase();
   const exact=(str)=>str.includes(name)||name==='psg'&&(str.includes('paris saint')||str==='psg')||name==='xv de france'&&str==='france'||name.startsWith('équipe de france')&&str==='france';
   targetHome=exact(home);targetAway=exact(away);
   if(targetHome===targetAway)continue;
   const a=Number(src.homeScore),b=Number(src.awayScore);
   if(src.homeScore==null||src.awayScore==null||!Number.isFinite(a)||!Number.isFinite(b))continue;
   scoreFor+=targetHome?a:b;scoreAgainst+=targetHome?b:a;n++;
  }
  if(n){
   numbers.push({label:f.sport==='Basketball'?'Points marqués/match':'Points ou buts marqués',value:f.sport==='Basketball'?(scoreFor/n).toFixed(1):String(scoreFor),detail:'Sur '+n+' rencontres avec scores ESPN'});
   numbers.push({label:f.sport==='Basketball'?'Points encaissés/match':'Points ou buts encaissés',value:f.sport==='Basketball'?(scoreAgainst/n).toFixed(1):String(scoreAgainst),detail:'Source : feuilles de score retrouvées'});
   if(f.sport==='Football')numbers.push({label:'Différence de buts',value:String(scoreFor-scoreAgainst),detail:'Seulement sur les matchs retrouvés'});
  }
 }
 if(f.sport==='Cyclisme'){
  // Une étape du Tour n'est pas une nouvelle épreuve : les compteurs
  // de courses, étapes et critériums d'exhibition sont séparés.
  const main=recent.filter(x=>x.cycleUnit==='course');
  const stages=recent.filter(x=>x.cycleUnit==='étape');
  const crits=recent.filter(x=>x.cycleUnit==='critérium');
  if(main.length)numbers.push({label:'Courses UCI recensées',value:String(main.length),detail:'Ne compte pas les étapes à part'});
  if(stages.length)numbers.push({label:'Résultats d’étapes',value:String(stages.length),detail:'Tour de France, Algarve, Pays basque, Tour AURA'});
  if(crits.length)numbers.push({label:'Critériums d’exhibition',value:String(crits.length),detail:'Événements hors calendrier des courses UCI'});
  const podiums=main.filter(x=>/^(1er|2e|3e|1re|2ème|3ème)$/i.test(String(x.score||'').trim())).length;
  if(podiums)numbers.push({label:'Podiums en courses',value:String(podiums),detail:'Sans compter les podiums des étapes'});
 }
 if(f.sport==='Natation'){
  const races=recent.filter(x=>/natation|swim|nage|aquatics/i.test((x.type||'')+' '+(x.competition||''))).length;
  if(races)numbers.push({label:'Courses recensées',value:String(races),detail:'Épreuves avec résultat disponible'});
 }
 return numbers;
}
