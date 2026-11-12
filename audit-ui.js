import {AUDIT_AS_OF,auditInfo,safeScoreCount,verified2026For} from './audit-2026.js?v=10.0.0';

// Un compteur = nombre réellement trouvé, pas un total garanti de saison.
// Le détail affiché est borné à 25 entrées pour rester lisible sur Android.
export function renderAudit2026({favorites,historyResults,yearAudit,yearLoading,yearMessage,auditSelected,esc,safeUrl,date}){
 const rows=favorites.map(f=>{
  const info=auditInfo(f.name);
  const stat=safeScoreCount(f.name,historyResults,yearAudit);
  const number=stat.count===null?'—':String(stat.count);
  const match=historyResults.filter(x=>x.favorite===f.name&&x.date.startsWith('2026-')).sort((a,b)=>b.date.localeCompare(a.date))[0];
  const last=match?' · Dernier recensé : '+date(match.date)+(match.approxDate?' (date du tournoi)':''):'';
  const asOf=info.referenceAsOf?' · relevé du '+info.referenceAsOf:'';
  return '<div class="fav audit-fav"><div class="details"><b>'+esc(f.name)+'</b><br><small>'+esc(f.sport+' · '+info.unit)+'</small><br>'
    +'<strong>'+esc(number)+'</strong> <small>'+esc(stat.label+last+asOf)+'</small><br>'
    +'<small>Source : '+esc(info.source)+'</small></div>'
    +'<a href="'+esc(safeUrl(info.url))+'" rel="noopener noreferrer" target="_blank">Vérifier ↗</a></div>';
 }).join('');
 const selected=favorites.some(f=>f.name===auditSelected)?auditSelected:favorites[0]?.name||'';
 const info=auditInfo(selected);
 const tennis=favorites.find(f=>f.name===selected)?.sport==='Tennis';
 const details=tennis?historyResults.filter(x=>x.favorite===selected&&x.date.startsWith('2026-'))
  :yearAudit?.byFavorite?.[selected]?.events||verified2026For(selected);
 const ordered=[...details].sort((a,b)=>b.date.localeCompare(a.date));
 const detailCards=ordered.slice(0,25).map(x=>
  '<article class="card"><div class="row wraprow"><b>'+esc(x.opponent||x.title||'Résultat')+'</b><small>'+esc(date(x.date))+'</small></div>'
  +'<div class="tennis-score">'+esc(x.score||'Score indisponible')+'</div>'
  +'<small>'+esc([x.competition,x.round,x.outcome,x.source].filter(Boolean).join(' · '))+'</small>'
  +(x.sourceUrl?'<p class="sub"><a href="'+esc(safeUrl(x.sourceUrl))+'" rel="noopener noreferrer" target="_blank">Source du résultat ↗</a></p>':'')+'</article>'
 ).join('');
 const select='<select id="auditChoice" aria-label="Sportif ou équipe">'+favorites.map(f=>
   '<option value="'+esc(f.name)+'" '+(f.name===selected?'selected':'')+'>'+esc(f.name)+'</option>').join('')+'</select>';
 const months=yearAudit?.completeMonths||{};
 const monthSummary=Object.entries(months).map(([n,v])=>n+' '+v.ok+'/'+v.total).join(' · ');
 const note=yearAudit?
  '<p class="sub">ESPN : '+esc(yearAudit.successfulQueries+'/'+yearAudit.totalQueries+' requêtes réussies. '+monthSummary)+'. Même si tous les mois répondent, certains matchs peuvent être absents des compétitions indexées.</p>'
  :'<p class="sub">PSG, Real Madrid et Spurs : appuie sur « Calculer » pour rechercher les rencontres de toute l’année 2026 (les scores ordinaires de l’accueil ne couvrent que quelques semaines).</p>';
 return '<section class="panel"><h2>📊 Bilan 2026 — '+favorites.length+' favoris</h2>'
  +'<p class="sub">Du 1er janvier 2026 au jour courant, sans historique plus ancien. Les nombres sont ceux des sources mentionnées, <b>pas une garantie de calendrier complet</b>. « — » signifie non vérifié, jamais zéro.</p>'
  +'<p class="sub">Vérification des pages de référence le '+esc(AUDIT_AS_OF)+'. Les matchs, apparitions, étapes cyclistes et courses de natation sont des unités différentes.</p>'
  +rows+'</section>'
  +'<section class="panel"><h2>🔎 Calculer les matchs d’équipes sur 2026</h2>'
  +'<p class="sub">Recherche ESPN à la demande : plusieurs compétitions sur 11 mois, jusqu’à une centaine de requêtes. Le résultat est conservé 24 heures sur l’appareil.</p>'
  +'<button id="auditRun" class="button" '+(yearLoading?'disabled':'')+'>'+(yearLoading?'Calcul en cours…':'Calculer les matchs 2026 (ESPN)')+'</button>'
  +'<p id="yearProgress" class="sub" role="status">'+esc(yearMessage)+'</p>'+note+'</section>'
  +'<section class="panel"><h2>📋 Détail du favori</h2>'+select
  +'<p class="sub">'+esc(info.source)+' · '+ordered.length+' résultat(s) visibles dans la source intégrée, dont les 25 premiers affichés. Un résumé ne remplace pas le calendrier officiel.</p>'
  +(detailCards||'<p class="muted">Aucun détail intégré pour ce favori. Utilise le lien « Vérifier » sur sa ligne pour consulter sa source.</p>')
  +'</section>';
}
