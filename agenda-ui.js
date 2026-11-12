// Mon Sport V8 — deux agendas, portrait des sportifs, verdicts et résumés.
import {agendaMatches,agendaWindow,groupAgenda,agendaCoverage} from './agenda-model.js?v=13.0.0';
import {auditInfo} from './audit-2026.js?v=13.0.0';
import {matchVerdict,summaryForMatch} from './match-details.js?v=13.0.0';
import {renderFavoriteStats} from './stats-view.js?v=13.0.0';
import {photoInitials} from './photos.js?v=13.0.0';
import {nextCompetitionNote} from './verified-program.js?v=13.0.0';
import {coverageFor} from './coverage-v11.js?v=13.0.0';
const dateLabel=(date,opts)=>new Date(date).toLocaleDateString('fr-FR',opts);
const readableDate=(item)=>{
 return item.datePrecision==='heure'?new Date(item.date).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}):'';
};
const fullDay=(day)=>new Date(day+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
function avatar(name,photos,esc,safeUrl,size='tiny'){
 const image=photos?.[name];
 if(image?.src&&safeUrl(image.src)!=='#'){
  return '<span class="portrait-wrap '+size+'" data-photo-owner="'+esc(name)+'"><img class="athlete-photo" data-photo-name="'+esc(name)+'" loading="lazy" decoding="async" alt="Photo ou logo de '+esc(name)+'" src="'+esc(safeUrl(image.src))+'"/><span class="portrait-error-initials">'+esc(photoInitials(name))+'</span></span>';
 }
 return '<span class="portrait-placeholder '+size+'" data-photo-owner="'+esc(name)+'" aria-hidden="true">'+esc(photoInitials(name))+'</span>';
}
function verdictChip(item,name,esc){
 const result=matchVerdict(item,name);
 if(!result)return '';
 const className=result==='V'?'win':result==='D'?'loss':'draw';
 return '<span class="agenda-verdict '+className+'" aria-label="'+esc(result==='V'?'Victoire':result==='D'?'Défaite':'Match nul')+'">'+result+'</span>';
}
function eventHtml(item,esc,safeUrl,photos,chosen){
 const isFuture=!item.finished;
 const state=item.pendingResult?'À vérifier':item.isCompetition?'Compétition':item.live?'En cours':isFuture?'À venir':'Terminé';
 const people=item.favorites.map(name=>
  '<span class="agenda-person-tag">'+avatar(name,photos,esc,safeUrl)
  +'<span>'+esc(name)+'</span>'+verdictChip(item,name,esc)+'</span>').join('');
 const primary=chosen&&item.favorites.includes(chosen)?chosen:item.favorites[0];
 const recap=summaryForMatch(item,primary);
 const stats=recap.stats.length?'<div class="agenda-recap-stats">'+recap.stats.map(st=>
   '<span><strong>'+esc(st.value)+'</strong> '+esc(st.name)+'</span>').join('')+'</div>':'';
 const flags=(item.approximate?'<span class="agenda-caution">Date approximative · semaine du tournoi</span>':'')
   +(item.uncertainParticipation?'<span class="agenda-caution">Match de son équipe · présence du sportif non confirmée</span>':'');
 const sourceLink=recap.url&&safeUrl(recap.url)!=='#'
  ?'<a href="'+esc(safeUrl(recap.url))+'" target="_blank" rel="noopener noreferrer">Consulter la source ↗</a>':'';
 const scoreText=item.pendingResult?'Résultat non disponible':item.isCompetition?(/cycling|cyclisme/i.test(item.type)?'Horaire et résultat à confirmer':'Tableau et horaires à confirmer')
  :item.score||(!item.finished?'Score à venir':'Score indisponible');
 const timing=item.isCompetition&&item.endDate
  ?'Du '+dateLabel(item.date,{day:'numeric',month:'short'})+' au '+dateLabel(item.endDate,{day:'numeric',month:'short',year:'numeric'})
  :readableDate(item);
 return '<details class="agenda-event" data-event-detail="'+esc(item.key)+'">'
   +'<summary class="agenda-event-clickable">'
   +'<div class="agenda-event-top"><div class="agenda-people">'+people+'</div>'
   +(item.finished?'':'<span class="agenda-status '+(item.pendingResult?'pending':item.live?'live':'upcoming')+'">'+esc(state)+'</span>')+'</div>'
   +'<h3>'+esc(item.title)+'</h3>'
   +'<div class="agenda-scoreline"><strong>'+esc(scoreText)+'</strong>'+(timing?'<span>'+esc(timing)+'</span>':'')+'</div>'
   +'<div class="agenda-detail">'+esc([item.competition,item.round].filter(Boolean).join(' · '))+'</div>'
   +'<div class="agenda-open-hint"><span>'+(item.pendingResult?'Voir la source':item.isCompetition?'Voir le programme':'Résumé')+'</span><span aria-hidden="true">⌄</span></div>'
   +'</summary>'
   +'<div class="agenda-recap"><h4>'+esc(recap.title)+'</h4><p>'+esc(recap.text)+'</p>'
   +stats
   +(flags?'<div class="agenda-meta">'+flags+'</div>':'')
   +'<p class="agenda-recap-note">'+esc(recap.caveat)+'</p>'
   +'<div class="agenda-recap-source">Source : '+esc(recap.source)+' '+sourceLink+'</div>'
   +'<div class="detail-live-slot" aria-live="polite"></div></div>'
   +'</details>';
}
function placeholderMissing(missing,esc,safeUrl){
 if(!missing.length)return '';
 return '<details class="agenda-missing"><summary>'+missing.length+' favori(s) sans événement confirmé dans cette période</summary>'
   +'<p>Certains calendriers restent incomplets.</p>'
   +'<div class="agenda-missing-links">'+missing.map(f=>{
    const info=auditInfo(f.name);
    return '<a href="'+esc(safeUrl(info.url))+'" target="_blank" rel="noopener noreferrer">'+esc(f.name)+' ↗</a>';
   }).join('')+'</div></details>';
}
export function renderAgendaView({
 view='semaine',phase='future',favorite='',favorites=[],items=[],loading=false,
 extendedLoading=false,extendedError='',notes=[],photos={},rankings={},esc,safeUrl,now=new Date()
}){
 const single=view==='favori';
 const which=single?(favorites.find(f=>f.name===favorite)||favorites[0]):null;
 const chosen=which?.name||'';
 const stats=single&&phase==='stats';
 const periodPhase=stats?'past':phase;
 const periodWindow=agendaWindow(view,periodPhase,now);
 const cards=stats?[]:agendaMatches(items,{view,phase:periodPhase,favorite:single?chosen:null,now});
 const period=dateLabel(periodWindow.from,{day:'numeric',month:'short',year:'numeric'})
  +' — '+dateLabel(periodWindow.to,{day:'numeric',month:'short',year:'numeric'});
 const header='<div class="agenda-head"><h2>'+(single?'Un favori':'Tous mes favoris')+'</h2></div>';
 const select=single?'<div class="agenda-controls"><label class="agenda-label" for="agendaFavorite">Choisir mon favori</label>'
  +'<select id="agendaFavorite" class="agenda-select">'+favorites.map(f=>
   '<option value="'+esc(f.name)+'" '+(f.name===chosen?'selected':'')+'>'+esc(f.name)+' · '+esc(f.sport)+'</option>').join('')+'</select></div>':'';
 const image=photos[chosen];
 const picture=single?'<div class="favorite-profile">'
   +avatar(chosen,photos,esc,safeUrl,'large')
   +'<div class="favorite-profile-name"><h3>'+esc(chosen)+'</h3>'
   +'<p>'+esc(which?.sport||'Sport')+'</p>'
   +(image?.creditUrl?'<a href="'+esc(safeUrl(image.creditUrl))+'" target="_blank" rel="noopener noreferrer">Image · crédit ↗</a>':'')
   +'</div></div>':'';
 const duration=(single&&phase==='past')?'12 mois':single?'2 mois':'7 jours';
 const segments='<div class="agenda-segments '+(single?'three':'')+'" role="group" aria-label="Afficher les matchs ou les statistiques">'
  +'<button type="button" data-agenda-phase="past" aria-pressed="'+(phase==='past')+'" class="'+(phase==='past'?'selected':'')+'">Passés <small>'+(single?'12 mois':'7 jours')+'</small></button>'
  +'<button type="button" data-agenda-phase="future" aria-pressed="'+(phase==='future')+'" class="'+(phase==='future'?'selected':'')+'">À venir <small>'+(single?'2 mois':'7 jours')+'</small></button>'
  +(single?'<button type="button" data-agenda-phase="stats" aria-pressed="'+stats+'" class="'+(stats?'selected':'')+'">Statistiques <small>sources</small></button>':'')
  +'</div>';
 const progress=(loading||extendedLoading)?'<div class="agenda-progress" role="status"><span class="agenda-spinner"></span>'
  +esc(single?'Vérification des résultats du favori…':'Actualisation des rencontres…')+'</div>':'';
 const error=extendedError?'<div class="agenda-caution-note">'+esc(extendedError)+'</div>':'';
 const count='<div class="agenda-countbar"><strong>'+cards.length+' événement'+(cards.length!==1?'s':'')+' retrouvé'+(cards.length!==1?'s':'')+'</strong>'
  +'<span>'+esc(period)+'</span></div>';
 const missing=single||loading?[]:agendaCoverage(favorites,cards).missing;
 const details=groupAgenda(cards).map(g=>'<section class="agenda-day-group"><h3 class="agenda-day">'+esc(fullDay(g.day))+'</h3>'
  +g.items.map(e=>eventHtml(e,esc,safeUrl,photos,single?chosen:null)).join('')+'</section>').join('');
 const empty=!cards.length&&!loading&&!extendedLoading?'<div class="agenda-empty"><div class="agenda-empty-icon">📅</div>'
  +'<h3>Aucun événement trouvé</h3><p>Les sources peuvent être incomplètes.</p>'
  +(single?'<a href="'+esc(safeUrl(auditInfo(chosen).url))+'" target="_blank" rel="noopener noreferrer">Vérifier le calendrier source ↗</a>':'')+'</div>':'';
 const reliability=notes.length?'<details class="agenda-missing"><summary>État des sources</summary>'
  +'<p>'+notes.slice(0,5).map(esc).join('<br>')+'</p></details>':'';
 const upcomingSource=single&&phase==='future'?nextCompetitionNote(chosen,now):null;
 const extraNext=upcomingSource?'<div class="agenda-next"><b>📌 Information du calendrier</b><span>'+esc(upcomingSource.text)+'</span>'
  +'<a target="_blank" rel="noopener noreferrer" href="'+esc(safeUrl(upcomingSource.url))+'">Vérifier la source ↗</a></div>':'';
 const verification=single?coverageFor(chosen):null;
 const sources=verification?'<details class="agenda-missing"><summary>Sources · '+esc(verification.level)+'</summary>'
  +'<p>'+esc(verification.scope)+'</p><a href="'+esc(safeUrl(verification.url))+'" target="_blank" rel="noopener noreferrer">'
  +esc(verification.source)+' ↗</a></details>':'';
 return '<section class="agenda-shell">'+header+select+picture+segments+extraNext
  +(stats?progress+error+renderFavoriteStats({favorite:chosen,favoriteData:which,now,rankings,esc,safeUrl}):
    count+progress+error+(details||empty)+placeholderMissing(missing,esc,safeUrl)+reliability)
  +sources
  +'</section>';
}
