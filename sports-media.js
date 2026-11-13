// Iconographie des sports, partagée par les articles et les résultats.
const categories=[
 ['Tennis de table','🏓',/tennis de table|ping[ -]?pong|\bwtt\b|\bittf\b|lebrun|coton|schwaerzler/i],
 ['Basketball','🏀',/basket|\bnba\b|spurs|wembanyama/i],
 ['Rugby','🏉',/rugby|six nations|\bxv de france\b|top 14/i],
 ['Cyclisme','🚴',/cyclis|vélo|\buci\b|tour de france|seixas/i],
 ['Natation','🏊',/natation|nageur|natation|swim|marchand|cristofini/i],
 ['Tennis','🎾',/tennis|\batp\b|\bwta\b|roland.garros|wimbledon|sinner|alcaraz|andreeva|kouamé|kouame|jódar|jodar/i],
 ['Football','⚽',/foot|soccer|ligue 1|liga|champions league|psg|barcelon|real madrid|mbappé|mbappe/i],
 ['Athlétisme','🏃',/athlét|marathon|sprint|cross-country/i],
 ['Formule 1','🏎️',/formule 1|grand prix f1|\bf1\b/i],
 ['Handball','🤾',/handball/i]
];
export function sportInfo(...values){
 const text=values.filter(Boolean).join(' ');
 const found=categories.find(([, ,test])=>test.test(text));
 return found?{name:found[0],icon:found[1]}:{name:'Sport',icon:'🏅'};
}
export function sourceImage(src){
 try{const url=new URL(String(src||''));return url.protocol==='https:'?url.href:'';}catch{return '';}
}
