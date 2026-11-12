// Audit de couverture V11 · 12 novembre 2026.
// Chaque favori a une source externe de référence et un degré de couverture.
// « Partiel » est explicite : jamais une certification de tous les matchs.
export const COVERAGE_CHECKED='2026-11-12';
export const COVERAGE={
 'FC Barcelone':{level:'automatique + vérifié',source:'FC Barcelone · résultats + calendrier',url:'https://www.fcbarcelona.com/en/football/first-team/results',scope:'LaLiga, Ligue des champions et amicaux ; 18 résultats officiels complétés, ESPN par mois'},
 'Real Madrid':{level:'automatique',source:'Real Madrid · programme',url:'https://www.realmadrid.com/fr-FR/calendrier?filter-football=primer-equipo-masculino',scope:'LaLiga, C1, Coupe du Roi ; calendrier ESPN revérifiable sur 12 mois'},
 PSG:{level:'automatique',source:'PSG · calendrier',url:'https://www.psg.fr/football-masculin/calendrier',scope:'Ligue 1, C1, Coupe de France ; calendrier ESPN revérifiable sur 12 mois'},
 'San Antonio Spurs':{level:'automatique',source:'NBA · Spurs',url:'https://www.nba.com/spurs/schedule',scope:'Rencontres NBA ; match log individuel Wembanyama séparé'},
 'Victor Wembanyama':{level:'partielle',source:'NBA · feuille du joueur',url:'https://www.nba.com/player/1641705/victor-wembanyama',scope:'Présence effective vérifiée par feuille individuelle lorsque disponible'},
 'Kylian Mbappé':{level:'partielle',source:'FFF et Real Madrid',url:'https://www.fff.fr/equipe-nationale/joueur/8566-mbappe-kylian/fiche.html',scope:'Une rencontre du Real Madrid ne garantit pas sa participation'},
 'Équipe de France de football':{level:'vérifiée sur sélection',source:'FFF · matchs',url:'https://www.fff.fr/',scope:'Coupe du monde FIFA 2026 et matchs ESPN ; autres amicaux parfois absents'},
 'XV de France':{level:'vérifiée sur sélection',source:'FFR · programme',url:'https://presse.ffr.fr/categories/equipes-de-france/saison-26-27-programme-des-equipes-de-france-a-xv',scope:'Six Nations, été, Nations Championship : 2026 et matchs de novembre à venir'},
 'Félix Lebrun':{level:'vérifiée sur sélection',source:'FFTT · Europe + WTT',url:'https://www.fftt.com/actualites/equipe-de-france/championnats-deurope-2026-programme-resultats/',scope:'Simples d’Europe, Montpellier, tournoi mixte à venir ; doubles et autres WTT incomplets'},
 'Alexis Lebrun':{level:'vérifiée sur sélection',source:'FFTT · Europe + WTT',url:'https://www.fftt.com/actualites/equipe-de-france/championnats-deurope-2026-programme-resultats/',scope:'Simples d’Europe, Montpellier, Pro A et mixte ; autres tableaux incomplets'},
 'Flavien Coton':{level:'vérifiée sur sélection',source:'FFTT · Europe + WTT',url:'https://www.fftt.com/actualites/wtt/suivre-le-wtt-champions-de-montpellier-2026/',scope:'Europe, Montpellier, Coupe du monde mixte ; les 44 matchs officiels ne sont pas tous détaillés'},
 'Paul Seixas':{level:'courses + étapes',source:'CyclingDB · résultats',url:'https://cyclingdb.com/rider/paul-seixas',scope:'12 classements de courses + 40 résultats d’étapes + critérium Singapour ; hors flux complet UCI'},
 'Léon Marchand':{level:'partielle',source:'World Aquatics · athlète',url:'https://www.worldaquatics.com/athletes/1188005/ws',scope:'Sélection de courses, chronos et relais ; recherche manuelle pour résultats complets'},
 'Sauveur Cristofini':{level:'vérifiée sur sélection',source:'L’Équipe + FFN',url:'https://www.lequipe.fr/fiche/sauveur-cristofini/97076',scope:'10 résultats de 2026 vérifiés, championnats de France, Europe, meetings, petit bassin'},
 'Arthur Fils':{level:'automatique partielle',source:'ATP · résultats',url:'https://www.atptour.com/en/players',scope:'ATP 2026 et ATP Finals ; sources hebdomadaires, Challenger incomplet'},
 'Jannik Sinner':{level:'automatique partielle',source:'ATP · résultats',url:'https://www.atptour.com/en/players',scope:'ATP/Wimbledon/ATP Finals et archives ; tableaux et doubles incomplets'},
 'Carlos Alcaraz':{level:'automatique partielle',source:'ATP · résultats',url:'https://www.atptour.com/en/players',scope:'ATP 2026 et Finals ; sources hebdomadaires, doubles incomplets'},
 'Rafael Jódar':{level:'automatique partielle',source:'ATP · Challenger',url:'https://www.atptour.com/en/players',scope:'ATP 2026 et Challenger selon disponibilité ; ATP Finals'},
 'Moïse Kouamé':{level:'automatique partielle',source:'FFT · tennis et Challenger',url:'https://www.fft.fr/',scope:'ITF/Challenger, Open de Metz annoncé ; matches récents sans tirage parfois non publics'},
 'Mirra Andreeva':{level:'automatique partielle',source:'WTA · résultats',url:'https://www.wtatennis.com/players',scope:'WTA 2026 et Finals ; tableaux et doubles incomplets'}
};
export function coverageFor(name){
 return COVERAGE[name]||{level:'source à configurer',source:'Calendrier officiel du sport',url:'https://www.google.com/search?q='+encodeURIComponent(name+' calendrier résultats 2026'),scope:'Couverture à confirmer'};
}
export function coverageSummary(favorites,events=[]){
 const unique=new Set(favorites.map(f=>f.name));
 const represented=new Set(events.flatMap(e=>e.favorites||[e.favorite]));
 return {tracked:unique.size,withEvents:[...unique].filter(x=>represented.has(x)).length,
  noEvents:[...unique].filter(x=>!represented.has(x)),
  fullyVerified:0}; // Le total officiel n'est connu pour aucun des 20 favoris.
}
