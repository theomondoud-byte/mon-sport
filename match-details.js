// Mon Sport V8 : verdicts et résumés calculés uniquement à partir des scores connus.
const normalized=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
function teamMatch(favorite,actual){
 const name=normalized(favorite),other=normalized(actual);
 if(!name||!other)return false;
 if(name==='psg')return other==='psg'||/paris saint germain|paris sg/.test(other);
 if(name==='xv de france'||name==='equipe de france de football')return other==='france'||other==='france rugby';
 if(name==='san antonio spurs')return other.includes('san antonio spurs');
 return other===name||other.includes(name+' ');
}
const parseScore=v=>{
 if(v===null||v===undefined||v==='')return null;
 const str=String(typeof v==='object'?v.displayValue??v.value??'':v).trim();
 if(!/^\d+(?:[.,]\d+)?$/.test(str))return null;
 return Number(str.replace(',','.'));
};
export function matchVerdict(match,favorite){
 if(!match?.finished||match.uncertainParticipation)return null;
 const orig=match.origin||{};
 const isEvent=match.type==='team'||match.type==='verified'||match.type==='tennis'
  ||['football','rugby','ping'].includes(match.type);
 // Pas de V/D inventé pour un chrono de natation, une course où le
 // sportif termine quatrième ou un match NBA sans feuille nominative.
 if(!isEvent)return null;
 if(orig.outcome==='Victoire'||orig.outcome==='Défaite'||orig.outcome==='Nul'){
  // Si deux favoris se sont affrontés, le relevé est généralement rédigé
  // du point de vue du premier. Le verdict du second doit être inversé.
  let verdict=orig.outcome==='Victoire'?'V':orig.outcome==='Défaite'?'D':'N';
  if(verdict!=='N'&&orig.favorite&&orig.favorite!==favorite&&match.favorites?.includes(favorite))
   verdict=verdict==='V'?'D':'V';
  return verdict;
 }
 if(typeof orig.winner==='boolean')return orig.winner?'V':'D';
 const home=String(orig.home||''),away=String(orig.away||'');
 if(!home||!away)return null;
 const homeSide=teamMatch(favorite,home),awaySide=teamMatch(favorite,away);
 if(homeSide===awaySide)return null;
 const x=parseScore(orig.homeScore),y=parseScore(orig.awayScore);
 if(x===null||y===null)return null;
 if(x===y)return 'N';
 return homeSide?(x>y?'V':'D'):(y>x?'V':'D');
}
export function summaryForMatch(match,favorite){
 const selected=favorite||match.favorites?.[0]||match.favorite||'';
 const label=String(match.title||'La rencontre');
 const competition=String(match.competition||'compétition non précisée');
 const round=match.round?' ('+match.round+')':'';
 const verdict=matchVerdict(match,selected);
 const score=match.score&&match.score!=='Match à venir'?String(match.score):null;
 const past=!!match.finished;
 const scoreText=score?' Score indiqué : '+score+'.':'';
 const stage=match.live?'est en cours':past?'est terminée':'est programmée';
 let result;
 if(match.isCompetition){
  result='Compétition annoncée pour '+selected+' : '+label+' ('+competition+').';
  result+=' Les adversaires, le tableau et les horaires des rencontres individuelles seront précisés par l’organisateur.';
 }else if(/cyclisme|cycling/i.test(match.type||'')){
  result='Résultat de cyclisme de '+selected+' : '+label+', '+competition+'.'+scoreText;
 }else{
  result='La rencontre '+label+' '+stage+' en '+competition+round+'.'+scoreText;
 }
 if(verdict==='V')result+=' Victoire de '+selected+'.';
 else if(verdict==='D')result+=' Défaite de '+selected+'.';
 else if(verdict==='N')result+=' Match nul pour '+selected+'.';
 if(match.notes)result+=' '+String(match.notes);
 if(match.uncertainParticipation)result+=' Il s’agit du calendrier de son équipe : la participation du sportif n’est pas confirmée.';
 if(match.approximate)result+=' La date est celle de la semaine du tournoi, pas nécessairement celle du match.';
 const stats=match.stats&&typeof match.stats==='object'?Object.entries(match.stats)
  .filter(([,v])=>v!==null&&v!==undefined&&v!=='')
  .map(([k,v])=>({name:({pts:'Points',reb:'Rebonds',ast:'Passes',blk:'Contres'})[k]||k.toUpperCase(),value:String(v)})):[];
 return {
  title:match.isCompetition?'Présentation de la compétition':past?'Résumé du résultat':'Présentation de la rencontre',
  text:result,
  stats,
  caveat:past
   ?'Résumé factuel construit à partir du score et des données disponibles. Les faits de jeu détaillés ne sont pas fournis.'
   :'Programme prévisionnel, sous réserve des changements annoncés par l’organisateur.',
  source:match.source||'Source sportive',
  url:match.sourceUrl||''
 };
}
