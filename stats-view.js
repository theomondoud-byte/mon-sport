// Mon Sport V13 : statistiques publiées par les fournisseurs, pas de calcul
// à partir de l'historique incomplet. Rangs ATP/WTA/Race/WTT DATÉS.
import {profileFor} from './sports-profiles.js?v=13.0.0';
import {auditInfo} from './audit-2026.js?v=13.0.0';
import {RANKINGS,rankingForFavorite,rankingsForFavorite,rankingEntry,RANKING_DATE} from './rankings-view.js?v=13.0.0';
const fmt=s=>new Date(s).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});
const tile=(label,value,subtitle='',esc=s=>s)=>'<div class="stat-tile"><b>'+esc(String(value))+'</b><span>'+esc(label)+'</span>'
 +(subtitle?'<small>'+esc(subtitle)+'</small>':'')+'</div>';
export function renderFavoriteStats({favorite='',favoriteData=null,now=new Date(),rankings={},esc,safeUrl=(url)=>url}){
 const who=favoriteData||{name:favorite,sport:'Autre'},profile=profileFor(favorite,now),audit=auditInfo(favorite);
 const listed=rankingsForFavorite(who),key=rankingForFavorite(who);
 const sourceLinks=[['Fiche du sportif / club',profile.source],['Résultats officiels',audit.url]];
 const row=listed.map(id=>{
  const spec=RANKINGS.find(x=>x.id===id),entry=rankingEntry(id,favorite,rankings);
  if(!spec)return '';
  return '<div class="stat-rank-link"><div><b>'+esc(spec.title)+'</b><span>'
   +esc(entry?'#'+entry.rank+(entry.points?' · '+entry.points+' points':''):'Rang non disponible dans les données chargées')
   +'</span></div><button class="button ghost" type="button" data-view-ranking="'+esc(spec.id)+'">Voir le classement ↗</button></div>';
 }).join('');
 const age=profile.age!==null?tile('Âge',profile.age+' ans','Né(e) le '+fmt(profile.born),esc):'';
 const location=profile.country?tile('Pays',profile.country,'',esc):'';
 const rankTiles=row||'<p class="stat-help">Pas de tableau international unique pour cette discipline. Consulte les feuilles officielles ci-dessous.</p>';
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
  officialStats='<p class="stat-help">Points, rebonds, passes et contres de saison sur la fiche officielle NBA, actualisée directement par la ligue.</p>';
  sourceLinks.push(['Statistiques NBA officielles','https://www.nba.com/player/1641705/victor-wembanyama']);
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
 if(['FC Barcelone','PSG','Real Madrid','San Antonio Spurs'].includes(favorite)){
  officialStats='<p class="stat-help">Le rang, les points et le bilan affichés dans « Classements » viennent des tableaux ESPN de la ligue.</p>';
 }
 const links=sourceLinks.filter(([,url],i,a)=>/^https:\/\//.test(String(url||''))&&a.findIndex(x=>x[1]===url)===i)
  .map(([label,url])=>'<a href="'+esc(safeUrl(url))+'" target="_blank" rel="noopener noreferrer">'+esc(label)+' ↗</a>').join('');
 return '<section class="favorite-stats source-native-stats"><h3>📊 '+esc(favorite)+'</h3>'
  +'<div class="stat-profile-section"><h4>Profil · source sportive</h4>'
  +'<div class="stat-grid">'+(age+location||tile('Sport',who.sport,'',esc))+'</div>'
  +'<div class="stat-sport-identity"><b>'+esc(profile.role||who.sport||'Sportif')+'</b>'
  +(profile.fact?'<p>'+esc(profile.fact)+'</p>':'')+'</div></div>'
  +'<section class="stat-profile-section"><h4>Classements officiels</h4>'
  +rankTiles+'<small>ATP, WTA, Next Gen, Race et ITTF : relevés du '+esc(fmt(RANKING_DATE))+' (non temps réel). Les classements d’équipe sont chargés depuis ESPN.</small></section>'
  +(officialStats?'<section class="stat-profile-section"><h4>Statistiques publiées</h4>'+officialStats+'</section>':'')
  +'<div class="stat-source-link"><span>Fiches officielles</span><div class="stat-reference-list">'+links+'</div></div>'
  +'<p class="agenda-footnote">Pas de pourcentage ni de moyennes calculées depuis l’historique incomplet de Mon Sport.</p></section>';
}
