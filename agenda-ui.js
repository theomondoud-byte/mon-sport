// Mon Sport V8 — deux agendas, portrait des sportifs, verdicts et résumés.
import {agendaMatches,agendaWindow,groupAgenda,agendaCoverage} from './agenda-model.js?v=8.0.0';
import {auditInfo} from './audit-2026.js?v=8.0.0';
import {matchVerdict,summaryForMatch} from './match-details.js?v=8.0.0';
import {renderFavoriteStats} from './stats-view.js?v=8.0.0';
import {photoInitials} from './photos.js?v=8.0.0';
const dateLabel=(date,opts)=>new Date(date).toLocaleDateString('fr-FR',opts);
const readableDate=(item)=>{
 const day=dateLabel(item.date,{weekday:'short',day:'numeric',month:'short',year:'numeric'});
 return item.datePrecision==='heure'
  ?day+' · '+new Date(item.date).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})
  :day;
};
const fullDay=(day)=>new Date(day+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
function avatar(name,photos,esc,safeUrl,size='tiny'){
 const image=photos?.[name];
 if(image?.src&&safeUrl(image.src)!=='#'){
  return '<span class="portrait-wrap '+size+'"><img loading="lazy" decoding="async" alt="Photo de '+esc(name)+'" src="'+esc(safeUrl(image.src))+'"/></span>';
 }
 return '<span class="portrait-placeholder '+size+'" aria-hidden="true">'+esc(photoInitials(name))+'</span>';
}
function verdictChip(item,name,esc){
 const result=matchVerdict(item,name);
 if(!result)return '';
 const className=result==='V'?'win':result==='D'?'loss':'draw';
 return '<span class="agenda-verdict '+className+'" aria-label="'+esc(result==='V'?'Victoire':result==='D'?'Défaite':'Match nul')+'">'+result+'</span>';
}
function eventHtml(item,esc,safeUrl,photos,chosen){
 const isFuture=!item.finished;
 const state=item.live?'En cours':isFuture?'À venir':'Terminé';
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
 const scoreText=item.score||(!item.finished?'Score à venir':'Score indisponible');
 return '<details class="agenda-event">'
   +'<summary class="agenda-event-clickable">'
   +'<div class="agenda-event-top"><div class="agenda-people">'+people+'</div>'
   +'<span class="agenda-status '+(item.finished?'done':item.live?'live':'upcoming')+'">'+esc(state)+'</span></div>'
   +'<h3>'+esc(item.title)+'</h3>'
   +'<div class="agenda-scoreline"><strong>'+esc(scoreText)+'</strong><span>'+esc(readableDate(item))+'</span></div>'
   +'<div class="agenda-detail">'+esc([item.competition,item.round].filter(Boolean).join(' · '))+'</div>'
   +'<div class="agenda-open-hint"><span>Voir le résumé du match</span><span aria-hidden="true">⌄</span></div>'
   +'</summary>'
   +'<div class="agenda-recap"><h4>'+esc(recap.title)+'</h4><p>'+esc(recap.text)+'</p>'
   +stats
   +(flags?'<div class="agenda-meta">'+flags+'</div>':'')
   +'<p class="agenda-recap-note">'+esc(recap.caveat)+'</p>'
   +'<div class="agenda-recap-source">Source : '+esc(recap.source)+' '+sourceLink+'</div></div>'
   +'</details>';
}
function placeholderMissing(missing,esc,safeUrl){
 if(!missing.length)return '';
 return '<details class="agenda-missing"><summary>'+missing.length+' favori(s) sans événement confirmé dans cette période</summary>'
   +'<p>Une absence ici ne signifie pas qu’ils ne jouent pas. Certains sports et tournois ne disposent pas encore de calendrier complet.</p>'
   +'<div class="agenda-missing-links">'+missing.map(f=>{
    const info=auditInfo(f.name);
    return '<a href="'+esc(safeUrl(info.url))+'" target="_blank" rel="noopener noreferrer">'+esc(f.name)+' ↗</a>';
   }).join('')+'</div></details>';
}
export function renderAgendaView({
 view='semaine',phase='future',favorite='',favorites=[],items=[],loading=false,
 extendedLoading=false,extendedError='',notes=[],photos={},esc,safeUrl,now=new Date()
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
 const header='<div class="agenda-head"><span class="agenda-eyebrow">MON SPORT · AGENDA</span>'
  +'<h2>'+(single?'Un favori':'Tous mes favoris')+'</h2>'
  +'<p>'+(single?'Sélectionne ton favori, puis consulte ses rencontres et ses statistiques.':'Les résultats et les rencontres programmées de tous tes favoris.')+'</p></div>';
 const select=single?'<div class="agenda-controls"><label class="agenda-label" for="agendaFavorite">Choisir mon favori</label>'
  +'<select id="agendaFavorite" class="agenda-select">'+favorites.map(f=>
   '<option value="'+esc(f.name)+'" '+(f.name===chosen?'selected':'')+'>'+esc(f.name)+' · '+esc(f.sport)+'</option>').join('')+'</select></div>':'';
 const image=photos[chosen];
 const picture=single?'<div class="favorite-profile">'
   +avatar(chosen,photos,esc,safeUrl,'large')
   +'<div class="favorite-profile-name"><span>FAVORI SÉLECTIONNÉ</span><h3>'+esc(chosen)+'</h3>'
   +'<p>'+esc(which?.sport||'Sport')+'</p>'
   +(image?.creditUrl?'<a href="'+esc(safeUrl(image.creditUrl))+'" target="_blank" rel="noopener noreferrer">Photo : Wikimedia Commons · licence ↗</a>':'')
   +'</div></div>':'';
 const duration=(single&&phase==='past')?'12 mois':single?'2 mois':'7 jours';
 const segments='<div class="agenda-segments '+(single?'three':'')+'" role="group" aria-label="Afficher les matchs ou les statistiques">'
  +'<button type="button" data-agenda-phase="future" aria-pressed="'+(phase==='future')+'" class="'+(phase==='future'?'selected':'')+'">À venir <small>'+(single?'2 mois':'7 jours')+'</small></button>'
  +'<button type="button" data-agenda-phase="past" aria-pressed="'+(phase==='past')+'" class="'+(phase==='past'?'selected':'')+'">Passés <small>'+(single?'12 mois':'7 jours')+'</small></button>'
  +(single?'<button type="button" data-agenda-phase="stats" aria-pressed="'+stats+'" class="'+(stats?'selected':'')+'">Statistiques <small>12 mois</small></button>':'')
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
  +'<h3>Aucun match confirmé dans cette période</h3><p>Les sources ne renvoient pas de rencontre disponible. Cela ne signifie pas que le favori n’a pas joué ou ne jouera pas.</p>'
  +(single?'<a href="'+esc(safeUrl(auditInfo(chosen).url))+'" target="_blank" rel="noopener noreferrer">Vérifier le calendrier source ↗</a>':'')+'</div>':'';
 const reliability=notes.length?'<details class="agenda-missing"><summary>Couverture et fiabilité des sources</summary>'
  +'<p>'+notes.slice(0,8).map(esc).join('<br>')+'</p></details>':'';
 return '<section class="agenda-shell">'+header+select+picture+segments
  +(stats?progress+error+renderFavoriteStats({items,favorite:chosen,now,loading:extendedLoading||loading,esc}):
    count+progress+error+(details||empty)+placeholderMissing(missing,esc,safeUrl)+reliability)
  +'<div class="agenda-footnote">Un résultat n’est affiché que si une source le fournit. Les pastilles V/D signalent uniquement les victoires et défaites identifiables. '
  +'Appuie sur une carte pour ouvrir son résumé factuel. Les statistiques peuvent être partielles pour certaines disciplines.</div>'
  +'</section>';
}
