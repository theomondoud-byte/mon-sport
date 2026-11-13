// Mon Sport V14.9 : données de classement par favori, provenant des mêmes relevés que l'onglet Classements.
import {profileFor} from './sports-profiles.js?v=16.8.0';
import {auditInfo} from './audit-2026.js?v=16.8.0';
import {RANKINGS,rankingForFavorite,rankingsForFavorite,rankingEntry,tournamentColumns,tournamentStatusInColumns,RANKING_DATE} from './rankings-view.js?v=16.8.0';
const fmt=s=>new Date(s).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});
const tile=(label,value,subtitle='',esc=s=>s)=>'<div class="stat-tile"><b>'+esc(String(value))+'</b><span>'+esc(label)+'</span>'
 +(subtitle?'<small>'+esc(subtitle)+'</small>':'')+'</div>';
const shown=value=>value===null||value===undefined||value===''||value==='-'?'—':String(value);
const signed=(value)=>value===null||value===undefined||value===''?'—':
 Number.isFinite(Number(value))?(Number(value)>0?'+'+Number(value):String(Number(value))):'—';
const rankAssociation=(id,favorite)=>{
 if(favorite==='Victor Wembanyama'&&id==='nbaouest')return 'San Antonio Spurs';
 if(favorite==='Kylian Mbappé'&&['liga','ucl'].includes(id))return 'Real Madrid';
 return favorite;
};
export function renderFavoriteRankingDetails({favorite,rankingId,rankings={},seen=null,esc,safeUrl=(url)=>url}){
 const spec=RANKINGS.find(r=>r.id===rankingId);
 if(!spec)return '';
 const team=rankAssociation(rankingId,favorite);
 const snapshot=rankings[rankingId],isTeam=team!==favorite,kind=spec.mode;
 // Pas de remplacement par un ancien instantané quand le classement live n'est pas chargé.
 const row=snapshot?.rows?.length?rankingEntry(rankingId,team,rankings):
  spec.mode==='snapshot'?rankingEntry(rankingId,team,rankings):null;
 const date=snapshot?.asOf&&Number.isFinite(Date.parse(snapshot.asOf))
  ?new Date(snapshot.asOf).toLocaleString('fr-FR',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):null;
 const provenance=kind==='tennis-live'?'Classement tennis live · copie actualisée périodiquement':
  kind==='wtt-weekly'?'Classement ITTF hebdomadaire · semaine '+(snapshot?.week||'non précisée'):
  kind==='espn'?'Classement ESPN · consultation datée':'Relevé historique';
 const source=spec.url&&/^https:\/\//.test(spec.url)
  ?'<a href="'+esc(safeUrl(spec.url))+'" target="_blank" rel="noopener noreferrer">Source ↗</a>':'';
 const link='<button class="button ghost" type="button" data-view-ranking="'+esc(spec.id)+'">Voir le classement ↗</button>';
 const heading='<div class="stat-rank-head"><div><b>'+esc(spec.title)+'</b>'
  +(isTeam?'<span>Classement de son équipe : '+esc(team)+' (pas un classement individuel)</span>':'')
  +'<small>'+esc(provenance)+(date?' · '+esc(date):' · relevé non chargé')
  +(snapshot?.stale?' · copie enregistrée, mise à jour indisponible':'')+'</small></div>'
  +'<div class="stat-rank-actions">'+source+link+'</div></div>';
 if(!row)return '<section class="stat-rank-card">'+heading
  +'<p class="stat-help">Données du classement indisponibles pour ce favori. Aucun chiffre n’est estimé.</p></section>';
 const items=[];
 // On masque les champs non communiqués ; ils n'apportent aucune information.
 const add=(label,value,help='',keepEmpty=false)=>{
  const text=shown(value);
  if(!keepEmpty&&text==='—')return;
  items.push(tile(label,text,help,esc));
 };
 const addOnce=(key,label,value,help='')=>{
  const text=shown(value);
  if(text==='—')return;
  const dedupeKey=key+':'+text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  if(seen?.has(dedupeKey))return;
  if(seen)seen.add(dedupeKey);
  add(label,text,help);
 };
 const addRank=(label,value)=>add(label,value===null||value===undefined?'—':'#'+value,'',true);
 addRank('Rang',row.rank);
 if(kind==='tennis-live'){
  const cols=tournamentColumns(row),status=tournamentStatusInColumns(row,cols);
  if(['atp','wta'].includes(rankingId))add('Meilleur classement (MC)',row.careerHigh);
  // Âge et nationalité sont regroupés dans le profil commun, une seule fois.
  add('Points live',row.livePoints);
  add('Variation du rang',signed(row.movement));
  add('Variation des points',signed(row.pointsChange));
  addOnce('tournoi','Tournoi en cours',cols.current,status.current?'En lice / prévu':'');
  addOnce('tournoi','Tournoi précédent',cols.previous,status.previous?'Défaite signalée':cols.previousObserved?'Observé récemment':'');
  add('Points après prochaine victoire',row.nextPoints);
  add('Maximum possible',row.maxPoints);
 }else if(kind==='wtt-weekly'||rankingId==='wtt'){
  add('Points ITTF',row.points);
  add('Évolution hebdomadaire',signed(row.movement));
 }else if(spec.west){
  const pct=Number(row.pct);
  const percent=row.pct===null||row.pct===undefined||row.pct===''||!Number.isFinite(pct)||pct<0||pct>1
   ?'—':new Intl.NumberFormat('fr-FR',{style:'percent',minimumFractionDigits:1,maximumFractionDigits:1}).format(pct);
  // Le nom de l'équipe figure déjà dans l'en-tête du classement.

  add('Victoires',row.wins);
  add('Défaites',row.losses);
  add('Pourcentage de victoires',percent);
  add('Écart au leader',row.gamesBehind);
  add('Série actuelle',/^W\d+$/i.test(row.streak||'')?'V'+row.streak.slice(1):
   /^L\d+$/i.test(row.streak||'')?'D'+row.streak.slice(1):row.streak);
  add('10 derniers matchs',row.lastTen);
  add('Bilan à domicile',row.home);
  add('Bilan à l’extérieur',row.away);
  add('Points marqués / match',row.avgPointsFor);
  add('Points encaissés / match',row.avgPointsAgainst);
  add('Différence moyenne / match',row.avgDiff);
 }else if(kind==='espn'){
  if(row.group&&row.group!==spec.title)add('Groupe / phase',row.group);
  add('Points',row.points);
  add('Matchs joués (J)',row.played);
  add('Victoires (V)',row.wins);
  add('Matchs nuls (N)',row.draws);
  add('Défaites (D)',row.losses);
  add('Buts marqués (BP)',row.goalsFor);
  add('Buts encaissés (BC)',row.goalsAgainst);
  add('Différence de buts',row.diff);
  add('Variation du rang',signed(row.rankChange));
 }else{
  add('Points',row.points);
 }
 return '<section class="stat-rank-card">'+heading
  +'<div class="stat-grid stat-ranking-grid">'+items.join('')+'</div></section>';
}
export function renderFavoriteStats({favorite='',favoriteData=null,now=new Date(),rankings={},esc,safeUrl=(url)=>url}){
 const who=favoriteData||{name:favorite,sport:'Autre'},profile=profileFor(favorite,now),audit=auditInfo(favorite);
 const listed=rankingsForFavorite(who,rankings);
 const sourceLinks=[['Fiche du sportif / club',profile.source],['Résultats officiels',audit.url]];
 // Une identité partagée en haut de page : ne pas répéter âge et pays dans ATP/Race/WTT.
 const primary=listed.map(id=>rankingEntry(id,favorite,rankings))
  .find(entry=>entry&&(entry.age!=null||entry.country))||null;
 const seen=new Set();
 const usable=listed.filter(id=>{
  const entity=rankAssociation(id,favorite);
  return Array.isArray(rankings[id]?.rows)&&rankings[id].rows.length&&
   rankingEntry(id,entity,rankings);
 });
 // Pas trois encarts « classement indisponible » si un joueur est absent de plusieurs top 150.
 const row=usable.map(id=>renderFavoriteRankingDetails({favorite,rankingId:id,rankings,seen,esc,safeUrl})).join('');
 const ageValue=profile.age!=null?profile.age:primary?.age;
 const age=ageValue!=null?tile('Âge',ageValue+' ans',profile.born?'Né(e) le '+fmt(profile.born):'',esc):'';
 const location=profile.country?tile('Pays',profile.country,'',esc):primary?.country?tile('Pays',primary.country,'',esc):'';
 const rankTiles=row||'<p class="stat-help">Aucune entrée correspondante disponible dans les classements chargés (top 150 ou classements d’équipes). Consulte les sources officielles ci-dessous.</p>';
 let officialStats='';
 // Valeurs EXACTEMENT retranscrites des statistiques sources, non calculées.
 if(favorite==='Mirra Andreeva'){
  officialStats='<div class="stat-grid">'+tile('Victoires 2026',50,'WTA · au 12 nov. 2026',esc)
   +tile('Défaites 2026',16,'WTA · 2026',esc)+tile('Titres en simple',3,'WTA · 2026',esc)+'</div>';
  sourceLinks.push(['Stats de saison WTA','https://www.wtatennis.com/players/331809/mirra-andreeva/stats']);
 }
 if(favorite==='Jannik Sinner'){
  officialStats='<div class="stat-grid">'+tile('Victoires 2026',44,'TennisDB · 9 nov. 2026',esc)
   +tile('Défaites 2026',3,'TennisDB · 9 nov. 2026',esc)
   +tile('Titres 2026',6,'TennisDB · 9 nov. 2026',esc)+'</div>';
  sourceLinks.push(['Bilan TennisDB','https://tennis-db.com/seasons-and-rankings?view=race']);
 }
 if(['Léon Marchand','Sauveur Cristofini'].includes(favorite)){
  officialStats='<p class="stat-help">Chronos, records et médailles à consulter sur les résultats officiels de la fédération : pas de moyenne de temps reconstituée.</p>';
 }
 if(favorite==='Victor Wembanyama'){
  officialStats='<div class="stat-grid">'+tile('Points / match',30.3,'NBA · 2026-27 · 12 nov. 2026',esc)
   +tile('Rebonds / match',11.7,'NBA · 2026-27',esc)
   +tile('Passes / match',2.8,'NBA · 2026-27',esc)
   +tile('Contres / match',4.4,'NBA · 2026-27',esc)+'</div>';
  sourceLinks.push(['Statistiques NBA officielles','https://www.nba.com/player/1641705/victor-wembanyama']);
  sourceLinks.push(['Fiche statistiques ESPN','https://www.espn.com/nba/player/stats/_/id/5104157']);
 }
 if(favorite==='Kylian Mbappé'){
  officialStats='<p class="stat-help">Buts, passes décisives et matchs joués sur les fiches officielles du club et de la sélection.</p>';
  sourceLinks.push(['Fiche FFF','https://www.fff.fr/equipe-nationale/joueur/8566-mbappe-kylian/fiche.html']);
 }
 if(favorite==='Paul Seixas'){
  officialStats='<p class="stat-help">Classements de courses, étapes et palmarès dans les résultats du cycliste, sans recompter ni convertir les points UCI.</p>';
  sourceLinks.push(['Palmarès de course', 'https://www.procyclingstats.com/rider/paul-seixas']);
 }
 if(['Félix Lebrun','Alexis Lebrun','Flavien Coton'].includes(favorite)){
  sourceLinks.push(['Classement international ITTF','https://www.ittf.com/ittf-table-tennis-world-ranking/']);
 }
 const links=sourceLinks.filter(([,url],i,a)=>/^https:\/\//.test(String(url||''))&&a.findIndex(x=>x[1]===url)===i)
  .map(([label,url])=>'<a href="'+esc(safeUrl(url))+'" target="_blank" rel="noopener noreferrer">'+esc(label)+' ↗</a>').join('');
 return '<section class="favorite-stats source-native-stats"><h3>📊 '+esc(favorite)+'</h3>'
  +'<div class="stat-profile-section"><h4>Profil · source sportive</h4>'
  +'<div class="stat-grid">'+(age+location||tile('Sport',who.sport,'',esc))+'</div>'
  +'<div class="stat-sport-identity"><b>'+esc(profile.role||who.sport||'Sportif')+'</b>'
  +(profile.fact?'<p>'+esc(profile.fact)+'</p>':'')+'</div></div>'
  +'<section class="stat-profile-section"><h4>Classements et statistiques</h4>'
  +rankTiles+'<small>Valeurs vérifiées des classements, regroupées sans répéter le profil ni les tournois identiques. Chaque classement conserve ses propres points et variations.</small></section>'
  +(officialStats?'<section class="stat-profile-section"><h4>Statistiques publiées</h4>'+officialStats+'</section>':'')
  +'<div class="stat-source-link"><span>Fiches officielles</span><div class="stat-reference-list">'+links+'</div></div>'
  +'<p class="agenda-footnote">Pas de pourcentage ni de moyennes calculées depuis l’historique incomplet de Mon Sport.</p></section>';
}
