// V9 — deux blocs : identité & palmarès sourcés / forme sur 12 mois.
// Aucun chiffre non daté ne prétend être un classement ou record à jour.
import {agendaMatches,agendaWindow} from './agenda-model.js?v=12.0.0';
import {matchVerdict} from './match-details.js?v=12.0.0';
import {profileFor,keySportStats} from './sports-profiles.js?v=12.0.0';
import {auditInfo} from './audit-2026.js?v=12.0.0';
const fmt=day=>new Date(day).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'});
const tile=(label,value,desc='',esc=x=>x)=>'<div class="stat-tile"><b>'+esc(String(value))+'</b><span>'+esc(label)+'</span>'
 +(desc?'<small>'+esc(desc)+'</small>':'')+'</div>';
export function computeFavoriteStats(items,favorite,now=new Date()){
 const matches=agendaMatches(items,{view:'favori',phase:'past',favorite,now});
 const verdicts=matches.map(m=>matchVerdict(m,favorite));
 const wins=verdicts.filter(x=>x==='V').length,losses=verdicts.filter(x=>x==='D').length;
 const draws=verdicts.filter(x=>x==='N').length,known=wins+losses+draws;
 const categories=new Map;
 for(const m of matches)categories.set(m.competition,(categories.get(m.competition)||0)+1);
 const competitions=[...categories.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6);
 const nba=matches.map(m=>m.stats).filter(s=>s&&s.pts!==null&&s.pts!==undefined);
 const averages={};
 for(const [id,label] of [['pts','Points'],['reb','Rebonds'],['ast','Passes'],['blk','Contres']]){
  const values=nba.map(x=>Number(x[id])).filter(x=>Number.isFinite(x));
  if(values.length)averages[label]={value:Math.round(values.reduce((a,b)=>a+b,0)*10/values.length)/10,samples:values.length};
 }
 return {events:matches.length,known,wins,losses,draws,winRate:known?Math.round(100*wins/known):null,
  nbas:nba.length,averages,competitions,mostRecent:matches[0]||null,
  from:agendaWindow('favori','past',now).from,to:agendaWindow('favori','past',now).to};
}
export function renderFavoriteStats({items=[],favorite='',favoriteData=null,now=new Date(),loading=false,esc}){
 const sports=favoriteData||{name:favorite,sport:'Autre',type:'sportif'};
 const profile=profileFor(favorite,now),recent=computeFavoriteStats(items,favorite,now),audit=auditInfo(favorite);
 const sources=[];
 const source=(url,label)=>{if(/^https:\/\//.test(url||'')&&!sources.some(s=>s.url===url))sources.push({url,label});};
 source(profile.source,'Fiche et palmarès');
 source(profile.rank?.source,'Classement officiel ou daté');
 source(audit.url,'Résultats et calendrier');
 const identity=[
  profile.age!==null?tile('Âge',profile.age+' ans','Calculé au '+fmt(now),esc):'',
  profile.rank?tile(profile.rank.label,profile.rank.value,'Au '+fmt(profile.rank.asOf),esc):'',
  profile.country?tile('Pays',profile.country,'',esc):''
 ].join('');
 const info='<section class="stat-profile-section"><h3>👤 Profil et palmarès</h3>'
  +'<div class="stat-grid">'+(identity||tile('Profil','Source externe','Âge ou rang non disponible',esc))+'</div>'
  +'<div class="stat-sport-identity"><b>'+esc(profile.role||sports.sport)+'</b>'
  +(profile.fact?'<p>'+esc(profile.fact)+'</p>':'')
  +'<small>Repères vérifiés le 12 novembre 2026. Les classements sont des instantanés, pas du direct.</small></div></section>';
 const record=recent.known
  ?'<p class="sub">Bilan limité aux '+recent.known+' rencontres dont une victoire, une défaite ou un nul est identifiable.</p>'
  :'<p class="sub">La source n’a pas fourni assez de décisions de match pour calculer un vrai bilan V/D/N.</p>';
 const numbers=[
  tile('Événements retrouvés',recent.events,'Ce n’est pas le total officiel',esc),
  tile('Victoires',recent.known?recent.wins:'—','Matchs avec issue connue',esc),
  tile('Défaites',recent.known?recent.losses:'—','Matchs avec issue connue',esc),
  tile('Nuls',recent.known?recent.draws:'—','Si la discipline le permet',esc),
  recent.winRate!==null?tile('Taux de victoire',recent.winRate+' %','Sur résultats avec verdict',esc):''
 ].join('');
 const specialty=keySportStats(sports,items,now).map(x=>tile(x.label,x.value,x.detail,esc)).join('');
 const nbas=Object.entries(recent.averages).map(([label,o])=>
  tile('🏀 '+label,o.value,'Moyenne sur '+o.samples+' match(s) NBA vérifiés',esc)).join('');
 const comp=recent.competitions.map(([name,count])=>'<div class="stat-competition"><span>'+esc(name)+'</span><b>'+count+'</b></div>').join('');
 let sportNote='';
 switch(sports.sport){
 case 'Tennis':
  sportNote='Tennis : classement ATP/WTA, âge et forme V/D. Aces, doubles fautes et balles de break figurent dans les fiches de match uniquement lorsque le fournisseur les publie.';break;
 case 'Tennis de table':
  sportNote='Tennis de table : rang ITTF daté et palmarès. Les scores de sets sont conservés ; les points détaillés par set ne sont pas toujours disponibles.';break;
 case 'Natation':
  sportNote='Natation : palmarès, records personnels et chronos sont essentiels ; un résultat de course ne se traduit pas automatiquement par une victoire/défaite.';break;
 case 'Cyclisme':
  sportNote='Cyclisme : victoires, podiums, classements généraux et étapes ne doivent pas être additionnés comme autant de courses distinctes.';break;
 case 'Basketball':
  sportNote='NBA : points, rebonds, passes et contres par match lorsque les feuilles individuelles sont accessibles. Les rencontres des Spurs ne prouvent pas la participation de Wembanyama.';break;
 case 'Rugby':
  sportNote='Rugby : points marqués/encaissés ; les essais et statistiques de plaquages sont consultables lorsque les comptes rendus du match les publient.';break;
 case 'Football':
  sportNote='Football : buts marqués/encaissés, bilan V/N/D, tirs, possession et buteurs sur les feuilles disponibles. Une rencontre du club ne certifie pas la présence d’un joueur.';break;
 default: sportNote='Statistiques adaptées aux données vérifiables publiées pour cette discipline.';
 }
 return '<section class="favorite-stats"><div class="stat-intro"><h3>Statistiques de '+esc(favorite)+'</h3>'
  +'<p>Identité, classement et faits marquants + bilan des matchs retrouvés depuis le '+esc(fmt(recent.from))+'.</p></div>'
  +info
  +'<section class="stat-profile-section"><h3>📊 Forme et résultats · 12 derniers mois</h3>'
  +(loading?'<p class="agenda-progress">Chargement des résultats de cette période…</p>':'')
  +'<div class="stat-grid">'+numbers+(specialty||'')+'</div>'+record
  +(nbas?'<h4 class="stat-heading">🏀 Moyennes individuelles NBA</h4><div class="stat-grid">'+nbas+'</div>':'')
  +(comp?'<h4 class="stat-heading">Compétitions retrouvées</h4><div class="stat-competitions">'+comp+'</div>':'')
  +(recent.mostRecent?'<div class="stat-latest"><span>Dernier événement retrouvé</span><b>'+esc(recent.mostRecent.title)+'</b>'
   +'<small>'+esc(fmt(recent.mostRecent.date))+' · '+esc(recent.mostRecent.competition)+'</small></div>':'')
  +'</section>'
  +'<div class="stat-source-link"><span>Sources et classements</span><div class="stat-reference-list">'
  +sources.map(s=>'<a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.label)+' ↗</a>').join('')
  +'</div></div>'
  +'<div class="agenda-footnote">'+esc(sportNote)+' Les statistiques calculées sont partielles et ne constituent pas un bilan officiel de carrière ou de saison.</div>'
  +'</section>';
}
