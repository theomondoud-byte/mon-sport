// V8 — statistiques calculées sur les événements réellement chargés.
// La mention « recensés » est volontaire : elle ne décrit PAS une saison
// officielle complète lorsque la source ne couvre pas tous les matchs.
import {agendaMatches,agendaWindow} from './agenda-model.js?v=8.0.0';
import {matchVerdict} from './match-details.js?v=8.0.0';
export function computeFavoriteStats(items,favorite,now=new Date()){
 const matches=agendaMatches(items,{view:'favori',phase:'past',favorite,now});
 const decisions=matches.map(m=>({event:m,verdict:matchVerdict(m,favorite)}));
 const wins=decisions.filter(m=>m.verdict==='V').length;
 const losses=decisions.filter(m=>m.verdict==='D').length;
 const draws=decisions.filter(m=>m.verdict==='N').length;
 const known=wins+losses+draws;
 const competitions=new Map;
 for(const m of matches)competitions.set(m.competition,(competitions.get(m.competition)||0)+1);
 const competitionList=[...competitions].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,5);
 const nbas=matches.map(m=>m.stats).filter(stats=>stats&&stats.pts!==null&&stats.pts!==undefined);
 const averages={};
 for(const [k,label] of [['pts','Points'],['reb','Rebonds'],['ast','Passes'],['blk','Contres']]){
  const nums=nbas.map(s=>Number(s[k])).filter(n=>Number.isFinite(n));
  if(nums.length)averages[label]={value:Math.round(10*nums.reduce((a,b)=>a+b,0)/nums.length)/10,samples:nums.length};
 }
 return {
  events:matches.length,known,wins,losses,draws,
  winRate:known?Math.round(100*wins/known):null,
  nbas:nbas.length,averages,competitions:competitionList,
  mostRecent:matches[0]||null,
  from:agendaWindow('favori','past',now).from,
  to:agendaWindow('favori','past',now).to
 };
}
export function renderFavoriteStats({items=[],favorite='',now=new Date(),loading=false,esc}){
 const s=computeFavoriteStats(items,favorite,now);
 const fmt=x=>x.toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'});
 const counter=(label,value,desc='')=>'<div class="stat-tile"><b>'+esc(value)+'</b><span>'+esc(label)+'</span>'
  +(desc?'<small>'+esc(desc)+'</small>':'')+'</div>';
 const groups=s.competitions.map(([name,count])=>
  '<div class="stat-competition"><span>'+esc(name)+'</span><b>'+count+'</b></div>').join('');
 const averages=Object.entries(s.averages).map(([name,a])=>counter(name,''+a.value,'Moyenne sur '+a.samples+' feuille(s) NBA')).join('');
 const recap=s.known
  ?'<p class="sub">Bilan V/D/N calculé sur '+s.known+' rencontre(s) dont le verdict est établi par les données. '
   +'Les matchs sans vainqueur identifié ne sont pas comptés comme défaites.</p>'
  :'<p class="sub">Pas assez de résultats avec vainqueur identifié pour calculer un bilan de victoires/défaites fiable.</p>';
 const note=s.mostRecent?'<div class="stat-latest"><span>Dernier événement recensé</span><b>'+esc(s.mostRecent.title)+'</b>'
  +'<small>'+esc(fmt(new Date(s.mostRecent.date)))+' · '+esc(s.mostRecent.competition)+'</small></div>':'';
 return '<section class="favorite-stats"><div class="stat-intro">'
  +'<h3>Statistiques de '+esc(favorite)+'</h3>'
  +'<p>Sur les 12 derniers mois : '+esc(fmt(s.from))+' – '+esc(fmt(s.to))+'.</p>'
  +'</div>'
  +(loading?'<p class="agenda-progress" role="status">Actualisation des résultats de cette période…</p>':'')
  +'<div class="stat-grid">'
  +counter('Événements recensés',String(s.events),'Couverture partielle possible')
  +counter('Victoires (V)',String(s.wins))
  +counter('Défaites (D)',String(s.losses))
  +counter('Nuls (N)',String(s.draws))
  +(s.winRate!==null?counter('Taux de victoire',s.winRate+' %','Parmi les résultats avec verdict'):'')
  +'</div>'+recap
  +(averages?'<h3 class="stat-heading">🏀 Statistiques individuelles NBA</h3><div class="stat-grid">'+averages+'</div>':'')
  +(groups?'<h3 class="stat-heading">Compétitions retrouvées</h3><div class="stat-competitions">'+groups+'</div>':'')
  +note
  +'<div class="agenda-footnote">Ces statistiques sont calculées uniquement à partir des résultats présents dans Mon Sport. '
  +'Les tournois ITF/Challenger, la natation, le cyclisme, le tennis de table et certaines rencontres peuvent ne pas être couverts intégralement. '
  +'Une absence de données ne signifie pas zéro match disputé.</div></section>';
}
