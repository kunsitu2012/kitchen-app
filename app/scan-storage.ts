function openStorage(): Promise<IDBDatabase> {
 return new Promise((resolve,reject)=>{
  const request=indexedDB.open('kitchen-imports',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('drafts');
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error);
 });
}

export async function readScanDraft<T>(key:string):Promise<T|undefined> {
 const db=await openStorage();
 try {
  return await new Promise((resolve,reject)=>{
   const request=db.transaction('drafts').objectStore('drafts').get(key);
   request.onsuccess=()=>resolve(request.result as T|undefined);
   request.onerror=()=>reject(request.error);
  });
 } finally {db.close();}
}

export async function saveScanDraft(key:string,value:unknown):Promise<void> {
 const db=await openStorage();
 try {
  await new Promise<void>((resolve,reject)=>{
   const transaction=db.transaction('drafts','readwrite');
   transaction.oncomplete=()=>resolve();
   transaction.onabort=()=>reject(transaction.error);
   if(value)transaction.objectStore('drafts').put(value,key);
   else transaction.objectStore('drafts').delete(key);
  });
 } finally {db.close();}
}
