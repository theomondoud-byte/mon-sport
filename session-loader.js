// Un seul chargement par session : appels concurrents regroupés, actualisation explicite possible.
export function createOnceLoader(load){
 let complete=false,pending=null;
 return (force=false)=>{
  if(pending)return pending;
  if(complete&&!force)return Promise.resolve();
  pending=Promise.resolve().then(()=>load(force))
   .then(result=>{complete=true;return result;},error=>{complete=true;throw error;})
   .finally(()=>{pending=null});
  return pending;
 };
}
