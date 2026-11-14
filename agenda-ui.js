import {sourceIcon} from './source-icons.js?v=17.2.0';
import {sportInfo} from './sports-media.js?v=17.2.0';
// Mon Sport V8 — deux agendas, portrait des sportifs, verdicts et résumés.
import {agendaMatches,agendaWindow,groupAgenda,agendaCoverage} from './agenda-model.js?v=17.2.0';
import {auditInfo} from './audit-2026.js?v=17.2.0';
import {matchVerdict,summaryForMatch} from './match-details.js?v=17.2.0';
import {renderFavoriteStats} from './stats-view.js?v=17.2.0';
import {photoInitials} from './photos.js?v=17.2.0';
import {nextCompetitionNote} from './verified-program.js?v=17.2.0';
import {coverageFor} from './coverage-v11.js?v=17.2.0';
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
function eventHtml(item,esc,safeUrl,photos,chosen,extras={}){
 const isFuture=!item.finished;
 const state=item.pendingResult?'À vérifier':item.isCompetition?'Compétition':item.live?'En cours':isFuture?'À venir':'Terminé';
 const people=item.favorites.map(name=>{
  const sport=sportInfo(name,item.competition,item.type);
  return '<span class="agenda-person-tag compact" title="'+esc(name)+' · '+esc(sport.name)+'" aria-label="'+esc(name)+' · '+esc(sport.name)+'">'
   +avatar(name,photos,esc,safeUrl)
   +'<span class="event-sport-icon" aria-hidden="true">'+sport.icon+'</span>'
   +verdictChip(item,name,esc)+'</span>';
 }).join('');
 const primary=chosen&&item.favorites.includes(chosen)?chosen:item.favorites[0];
 const recap=summaryForMatch(item,primary);
 const stats=recap.stats.length?'<div class="agenda-recap-stats">'+recap.stats.map(st=>
   '<span><strong>'+esc(st.value)+'</strong> '+esc(st.name)+'</span>').join('')+'</div>':'';
 const flags=(item.approximate?'<span class="agenda-caution">Date approximative · semaine du tournoi</span>':'')
   +(item.uncertainParticipation?'<span class="agenda-caution">Match de son équipe · présence du sportif non confirmée</span>':'')
   +(chosen&&/wemban[yi]ama/i.test(chosen)&&!item.finished&&item.wembanyamaUnconfirmed
    ?'<span class="agenda-caution">Match des Spurs : la participation de Wembanyama n’est pas confirmée pour cette rencontre</span>':'');
 const sourceLink=recap.url&&safeUrl(recap.url)!=='#'
  ?'<a href="'+esc(safeUrl(recap.url))+'" target="_blank" rel="noopener noreferrer">Consulter la source ↗</a>':'';
 const scoreText=item.pendingResult?'Résultat non disponible':item.isCompetition?(/cycling|cyclisme/i.test(item.type)?'Horaire et résultat à confirmer':'Tableau et horaires à confirmer')
  :item.score||(!item.finished?'Score à venir':'Score indisponible');
 const timing=item.isCompetition&&item.endDate
  ?'Du '+dateLabel(item.date,{day:'numeric',month:'short'})+' au '+dateLabel(item.endDate,{day:'numeric',month:'short',year:'numeric'})
  :readableDate(item);
 // Cadre vert / rouge / ambre : uniquement si tous les favoris concernés ont le même verdict.
 const verdicts=[...new Set(item.favorites.map(name=>matchVerdict(item,name)).filter(Boolean))];
 const frame=item.finished&&verdicts.length===1?' verdict-'+({V:'win',D:'loss',N:'draw'})[verdicts[0]]:'';
 const extra=resultExtrasHtml(item,esc,safeUrl,extras);
 const played=item.finished&&!item.pendingResult&&!item.isCompetition;
 // Résultat joué : le score, les faits et les statistiques suffisent ; le texte
 // de présentation n'est gardé que pour les événements à venir ou à vérifier.
 const about=played
  ?(item.notes?'<p>'+esc(item.notes)+'</p>':'')+stats+(flags?'<div class="agenda-meta">'+flags+'</div>':'')
  :'<h4>'+esc(recap.title)+'</h4><p>'+esc(recap.text)+'</p>'+stats+(flags?'<div class="agenda-meta">'+flags+'</div>':'')+'<p class="agenda-recap-note">'+esc(recap.caveat)+'</p>';
 return '<details class="agenda-event'+frame+'" data-event-detail="'+esc(item.key)+'">'
   +'<summary class="agenda-event-clickable">'
   +extra.hero
   +'<div class="agenda-event-top"><div class="agenda-people">'+people+'</div>'
   +(item.finished?'':'<span class="agenda-status '+(item.pendingResult?'pending':item.live?'live':'upcoming')+'">'+esc(state)+'</span>')+'</div>'
   +'<h3>'+esc(item.title)+'</h3>'
   +'<div class="agenda-scoreline"><strong>'+esc(scoreText)+'</strong>'+(timing?'<span>'+esc(timing)+'</span>':'')+'</div>'
   +'<div class="agenda-detail">'+esc([item.competition,item.round].filter(Boolean).join(' · '))+'</div>'
   +extra.html
   +'<div class="agenda-open-hint"><span>'+(item.pendingResult?'Voir la source':item.isCompetition?'Voir le programme':played?'Statistiques':'Détails')+'</span><span aria-hidden="true">⌄</span></div>'
   +'</summary>'
   +'<div class="agenda-recap">'+about
   +'<div class="detail-live-slot" aria-live="polite"></div>'
   +'<div class="agenda-recap-source">'+esc(recap.source)+' '+sourceLink+'</div></div>'
   +'</details>';
}
// Résumé d'article et replay pour un résultat terminé.
function resultExtrasHtml(item,esc,safeUrl,{summaryFor,mediaFor}={}){
 if(!item.finished||item.pendingResult||item.isCompetition)return {hero:'',html:''};
 const article=summaryFor?.(item);
 const media=mediaFor?.(item)||{};
 // 1. L'essentiel, en français, tiré de la feuille de match.
 const facts=(media.facts||[]).filter(f=>f&&f.text);
 let summary=facts.length?'<dl class="result-facts">'+facts.map(f=>'<div><dt>'+esc(f.label)+'</dt><dd>'+esc(f.text)+'</dd></div>').join('')+'</dl>':'';
 // 2. Article de presse sur CE match (français en priorité).
 if(article&&(article.excerpt||article.title)){
  summary+='<div class="result-summary"><p>'+esc(article.excerpt||article.title)+'</p>'
   +'<a class="result-summary-source" href="'+esc(safeUrl(article.link))+'" target="_blank" rel="noopener noreferrer" data-stop>'+sourceIcon(article.source,esc,'small')+esc(article.source)+' · Lire l’article ↗</a></div>';
 }
 // 3. Compte rendu ESPN du match, lisible en entier dans la carte.
 const recap=media.recap;
 if(recap&&(recap.excerpt||recap.paragraphs?.length)){
  const full=(recap.paragraphs||[]).length>1;
  summary+='<div class="result-summary result-recap">'
   +(article?'':'<p lang="en">'+esc(recap.excerpt||recap.paragraphs[0])+'</p>')
   +'<div class="result-recap-actions">'
   +(full?'<button type="button" class="result-recap-toggle" data-toggle-recap data-stop>'+sourceIcon('ESPN',esc,'small')+'<span>Lire le compte rendu complet (en anglais)</span></button>'
    :'<a class="result-summary-source" href="'+esc(safeUrl(recap.link))+'" target="_blank" rel="noopener noreferrer" data-stop>'+sourceIcon('ESPN',esc,'small')+'ESPN (en anglais) ↗</a>')
   +'</div>'
   +(full?'<div class="result-recap-full" lang="en" hidden><h5>'+esc(recap.title)+'</h5>'+recap.paragraphs.map(p=>'<p>'+esc(p)+'</p>').join('')
     +'<a class="result-summary-source" href="'+esc(safeUrl(recap.link))+'" target="_blank" rel="noopener noreferrer" data-stop>Source : ESPN ↗</a></div>':'')
   +'</div>';
 }
 const video=(media.videos||[]).find(v=>v.src);
 const page=(media.videos||[]).find(v=>v.page);
 const q=encodeURIComponent(String(item.title||'').replace(/—/g,' ')+' résumé '+new Date(item.date).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'}));
 const youtube=media.youtube;
 // Grande photo de la rencontre : photo du compte rendu, de l'article, ou
 // vignette du résumé vidéo. Si une vidéo existe, toucher la photo la lance.
 const https=u=>/^https:\/\//.test(String(u||''))?String(u):'';
 const image=https(recap?.image)||https(article?.image)||https(video?.poster)||(youtube?.id?'https://i.ytimg.com/vi/'+youtube.id+'/hqdefault.jpg':'');
 const playAttrs=video
  ?'data-play-video="'+esc(video.src)+'" data-video-page="'+esc(safeUrl(video.page||''))+'" data-poster="'+esc(video.poster||'')+'"'
  :youtube?.id?'data-youtube-id="'+esc(youtube.id)+'"':'';
 const picture=image?'<img class="result-hero-image" loading="lazy" decoding="async" referrerpolicy="no-referrer" src="'+esc(image)+'" alt="" />':'';
 const meta=!video&&youtube?.id?'<small class="result-video-meta">'+esc(youtube.channel||'YouTube')+(youtube.official?'':' · chaîne non officielle')+(youtube.duration?' · '+esc(youtube.duration):'')
   +' · <a href="https://www.youtube.com/watch?v='+esc(youtube.id)+'" target="_blank" rel="noopener noreferrer" data-stop>YouTube ↗</a></small>':'';
 let hero='',replay='';
 if(image&&playAttrs){
  hero='<div class="result-hero"><button type="button" class="result-hero-play" '+playAttrs+' data-stop aria-label="Voir le résumé vidéo">'+picture
   +'<span class="result-hero-badge">▶ Résumé vidéo</span></button><div class="result-video-slot"></div></div>';
  replay=meta;
 }else if(image){
  hero='<div class="result-hero">'+picture+'</div>';
 }else if(playAttrs){
  replay='<button type="button" class="result-replay" '+playAttrs+' data-stop>▶ Résumé vidéo</button>'+meta+'<div class="result-video-slot"></div>';
 }
 if(!playAttrs){
  replay=page?'<a class="result-replay ghost" href="'+esc(safeUrl(page.page))+'" target="_blank" rel="noopener noreferrer" data-stop>▶ Vidéo sur ESPN ↗</a>'
   :'<a class="result-replay ghost" href="https://www.youtube.com/results?search_query='+q+'" target="_blank" rel="noopener noreferrer" data-stop>🔎 Chercher la vidéo ↗</a>';
 }
 return {hero,html:summary+(replay?'<div class="result-replay-row">'+replay+'</div>':'')};
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
 extendedLoading=false,extendedError='',notes=[],photos={},rankings={},esc,safeUrl,now=new Date(),summaryFor=null,mediaFor=null
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
 const header='<div class="agenda-head"><h2>'+(single?'Favoris':'Tous mes favoris')+'</h2></div>';
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
  +g.items.map(e=>eventHtml(e,esc,safeUrl,photos,single?chosen:null,{summaryFor,mediaFor})).join('')+'</section>').join('');
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
