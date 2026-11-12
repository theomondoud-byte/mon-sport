// Mon Sport V7 — présentation mobile des deux agendas.
// Aucune date fictive ni supposition de participation d'un sportif à un match.
import {agendaMatches,agendaWindow,groupAgenda,agendaCoverage} from './agenda-model.js?v=7.0.0';
import {auditInfo} from './audit-2026.js?v=7.0.0';
const df=(iso,opts)=>new Date(iso).toLocaleDateString('fr-FR',opts);
const formatDate=(iso,precision)=>{
 const parsed=Date.parse(iso);
 if(!Number.isFinite(parsed))return 'Date indisponible';
 const day=df(iso,{weekday:'short',day:'numeric',month:'short'});
 return precision==='heure'?day+' · '+new Date(iso).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}):day;
};
function headingDay(day,esc){
 const time=Date.parse(day+'T12:00:00');
 const label=Number.isFinite(time)?new Date(time).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'}):day;
 return '<h3 class="agenda-day">'+esc(label)+'</h3>';
}
function eventHtml(item,esc,safeUrl){
 const isFuture=!item.finished;
 const state=item.live?'En cours':isFuture?'À venir':'Terminé';
 const sourceLink=item.sourceUrl&&safeUrl(item.sourceUrl)!=='#'
  ?'<a class="agenda-source" href="'+esc(safeUrl(item.sourceUrl))+'" target="_blank" rel="noopener noreferrer">Source ↗</a>':'';
 const flags=(item.approximate?'<span class="agenda-caution">Date approximative · semaine du tournoi</span>':'')
  +(item.uncertainParticipation?'<span class="agenda-caution">Match de son équipe · présence du sportif non confirmée</span>':'');
 const playerTags=item.favorites.map(name=>'<span class="agenda-favorite">'+esc(name)+'</span>').join('');
 const stats=item.stats?' · '+Object.entries(item.stats).filter(([,v])=>v!==null).map(([k,v])=>k.toUpperCase()+' '+v).join(' · '):'';
 return '<article class="agenda-event">'
  +'<div class="agenda-event-top"><div class="agenda-tags">'+playerTags+'</div><span class="agenda-status '+(item.finished?'done':item.live?'live':'upcoming')+'">'+esc(state)+'</span></div>'
  +'<h3>'+esc(item.title)+'</h3>'
  +'<div class="agenda-scoreline"><strong>'+esc(item.score||(!item.finished?'Horaire et score à confirmer':'Résultat sans score détaillé'))+'</strong>'
  +'<span>'+esc(formatDate(item.date,item.datePrecision))+'</span></div>'
  +'<div class="agenda-detail">'+esc([item.competition,item.round,item.source].filter(Boolean).join(' · ')+stats)+'</div>'
  +(flags||sourceLink?'<div class="agenda-meta">'+flags+sourceLink+'</div>':'')
  +'</article>';
}
function placeholderMissing(missing,esc,safeUrl){
 if(!missing.length)return '';
 return '<details class="agenda-missing"><summary>'+missing.length+' favori(s) sans événement confirmé dans cette période</summary>'
   +'<p>Une absence ici ne signifie pas qu’ils ne jouent pas. Les données de tennis de table, natation, cyclisme, Challenger/ITF ou certaines équipes sont partielles, notamment pour les prochains événements.</p>'
   +'<div class="agenda-missing-links">'+missing.map(f=>{
     const source=auditInfo(f.name);
     return '<a href="'+esc(safeUrl(source.url))+'" target="_blank" rel="noopener noreferrer">'+esc(f.name)+' ↗</a>';
   }).join('')+'</div></details>';
}
export function renderAgendaView({
 view='semaine',phase='future',favorite='',favorites=[],items=[],loading=false,
 extendedLoading=false,extendedError='',notes=[],esc,safeUrl,now=new Date()
}){
 const single=view==='favori';
 const which=single?favorites.find(f=>f.name===favorite)||favorites[0]:null;
 const chosen=which?.name||'';
 const window=agendaWindow(view,phase,now);
 const cards=agendaMatches(items,{view,phase,favorite:single?chosen:null,now});
 const title=single?'Un favori':'Tous mes favoris';
 const duration=single?'2 mois':'7 jours';
 const period=(phase==='future'?'Du ':'Du ')+df(window.from,{day:'numeric',month:'short',year:'numeric'})
  +' au '+df(window.to,{day:'numeric',month:'short',year:'numeric'});
 const selectedName=single?'<label class="agenda-label" for="agendaFavorite">Choisir mon favori</label>'
   +'<select id="agendaFavorite" class="agenda-select">'+favorites.map(f=>
     '<option value="'+esc(f.name)+'" '+(f.name===chosen?'selected':'')+'>'+esc(f.name)+' · '+esc(f.sport)+'</option>').join('')+'</select>':'';
 const segments='<div class="agenda-segments" role="group" aria-label="Période des événements">'
  +'<button type="button" data-agenda-phase="future" aria-pressed="'+(phase==='future')+'" class="'+(phase==='future'?'selected':'')+'">À venir <small>'+duration+'</small></button>'
  +'<button type="button" data-agenda-phase="past" aria-pressed="'+(phase==='past')+'" class="'+(phase==='past'?'selected':'')+'">Passés <small>'+duration+'</small></button></div>';
 const count=cards.length+' événement'+(cards.length>1?'s':'')+' trouvé'+(cards.length>1?'s':'');
 const missing=single?[]:agendaCoverage(favorites,cards).missing;
 const all=groupAgenda(cards).map(g=>'<section class="agenda-day-group">'+headingDay(g.day,esc)+g.items.map(e=>eventHtml(e,esc,safeUrl)).join('')+'</section>').join('');
 const progress=(loading||extendedLoading)?'<div class="agenda-progress" role="status"><span class="agenda-spinner"></span>'
  +esc(single?'Vérification des calendriers des deux mois…':'Actualisation des événements…')+'</div>':'';
 const note=extendedError?'<div class="agenda-caution-note">'+esc(extendedError)+'</div>':'';
 const empty=!cards.length&&!loading&&!extendedLoading
  ?'<div class="agenda-empty"><div class="agenda-empty-icon">📅</div><h3>Aucun événement confirmé trouvé</h3>'
  +'<p>La source ne renvoie aucun match pour la période choisie. Ce n’est pas une preuve que les sportifs ne jouent pas.</p>'
  +(single?'<a href="'+esc(safeUrl(auditInfo(chosen).url))+'" rel="noopener noreferrer" target="_blank">Consulter le calendrier du favori ↗</a>':'')+'</div>':'';
 const recentNotes=notes.length?'<details class="agenda-missing"><summary>Fiabilité et sources des résultats</summary><p>'
  +notes.slice(0,8).map(esc).join('<br>')+'</p></details>':'';
 return '<section class="agenda-shell"><div class="agenda-head">'
  +'<span class="agenda-eyebrow">MON SPORT · AGENDA</span><h2>'+esc(title)+'</h2>'
  +'<p>'+(single?'Les événements de ce favori':'Les rencontres confirmées parmi tes favoris')+' sur une période glissante.</p>'
  +'</div>'
  +(single?'<div class="agenda-controls">'+selectedName+'</div>':'')
  +segments
  +'<div class="agenda-countbar"><strong>'+esc(count)+'</strong><span>'+esc(period)+'</span></div>'
  +progress+note
  +(all||empty)
  +placeholderMissing(missing,esc,safeUrl)
  +recentNotes
  +'<div class="agenda-footnote">Les rencontres à venir ne sont affichées que si la source fournit une date et des participants. Les scores historiques portent parfois une date approximative. '
  +'Pour certains sportifs (dont Mbappé et Wembanyama), un match de leur équipe ne garantit pas leur participation.</div>'
  +'</section>';
}
