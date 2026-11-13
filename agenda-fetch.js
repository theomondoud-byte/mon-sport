// Mon Sport V8 : recherche élargie uniquement lors de l'ouverture « Un favori ».
// Les rencontres ne sont créées que si ESPN retourne date, adversaires et état.
import {shiftedMonths} from './agenda-model.js?v=16.4.0';
const humanSource=s=>s.startsWith('soccer/')?'https://www.espn.com/soccer/scoreboard'
  :s.startsWith('basketball/')?'https://www.espn.com/nba/scoreboard'
  :'https://www.espn.com/scores';
export async function fetchAgendaFavorite(selected,deps,progress=()=>{},now=new Date(),phase='future'){
 const from=phase==='past'?shiftedMonths(now,-12):new Date(now),to=phase==='past'?new Date(now):shiftedMonths(now,2);
 const months=deps.monthsInRange(from,to);
 // Un joueur ne doit jamais être présenté comme titulaire sur la seule
 // foi du calendrier de son club. Ces rencontres sont marquées incertaines.
 const proxyMap={'Victor Wembanyama':'San Antonio Spurs','Kylian Mbappé':'Real Madrid'};
 const linkedTeam=selected.type==='équipe'?selected.name:proxyMap[selected.name]||null;
 const proxy=selected.type!=='équipe'&&!!linkedTeam;
 const leagues=linkedTeam&&!(proxy&&phase==='past')?deps.leagues.filter(l=>l.teams.some(([n])=>n===linkedTeam)):[];
 const tennisLeague=phase==='future'&&selected.type==='sportif'&&selected.sport==='Tennis'
  ?(/andreeva|sabalenka|swiatek|gauff|rybakina|paolini/i.test(selected.name)?'wta':'atp'):null;
 const jobs=[
  ...leagues.flatMap(league=>months.map(month=>({kind:'team',league,month}))),
  ...(tennisLeague?months.map(month=>({kind:'tennis',code:tennisLeague,month})):[])
 ];
 const collected=[],failures=[];
 const ms0=from.getTime(),ms1=to.getTime();
 async function fetchJob(job){
  if(job.kind==='tennis'){
   const url=deps.base+'tennis/'+job.code+'/scoreboard?dates='+job.month;
   let tournaments;
   try{tournaments=await deps.espnFetch(url+'&limit=500');}
   catch(e){if(String(e.message||e).includes('HTTP 400'))tournaments=await deps.espnFetch(url);else throw e;}
   return deps.getTennisMatches(tournaments,job.code,ms0,ms1,[selected]);
  }
  const events=await deps.espnMonth(deps.base+job.league.url+'/scoreboard',job.month);
  const pairing=job.league.teams.find(([name])=>name===linkedTeam);
  if(!pairing)return [];
  const [teamName,pattern]=pairing,result=[];
  for(const event of events){
   const c=event?.competitions?.[0],people=c?.competitors;
   if(!Array.isArray(people)||people.length<2)continue;
   const when=event.date||c.date,time=Date.parse(when||'');
   if(!Number.isFinite(time)||time<ms0||time>ms1)continue;
   const home=people.find(x=>x.homeAway==='home')||people[0];
   const away=people.find(x=>x.homeAway==='away')||people[1];
   const h=deps.espnName(home),a=deps.espnName(away);
   if(!h||!a||![h,a].some(n=>pattern.test(n)))continue;
   const state=c.status?.type||event.status?.type||{};
   const completed=state.completed===true||state.state==='post';
   const playing=state.state==='in'&&!completed;
   if(proxy&&(completed||playing))continue; // aucune feuille de match nominative
   result.push({
    id:'agenda-espn-'+(event.id||job.league.url+'-'+when+'-'+h+'-'+a),
    home:h,away:a,
    homeScore:completed||playing?deps.espnScore(home):null,
    awayScore:completed||playing?deps.espnScore(away):null,
    date:when,favorite:proxy?selected.name:teamName,
    status:completed?'Terminé':playing?'En cours':'À venir',
    competition:job.league.name,
    source:proxy?'ESPN · match du club, présence du joueur non confirmée':'ESPN · '+job.league.name,
    sourceUrl:humanSource(job.league.url),
    leaguePath:job.league.url,espnEventId:String(event.id||''),
    uncertainParticipation:proxy,type:proxy?'team-proxy':'team'
   });
  }
  return result;
 }
 for(let i=0;i<jobs.length;i+=4){
  const responses=await Promise.allSettled(jobs.slice(i,i+4).map(fetchJob));
  for(let j=0;j<responses.length;j++){
   const job=jobs[i+j];
   if(responses[j].status==='fulfilled')collected.push(...responses[j].value);
   else failures.push((job.league?.name||job.code)+' '+job.month);
  }
  progress(Math.min(i+4,jobs.length),jobs.length);
 }
 return {events:collected,failures,total:jobs.length};
}
