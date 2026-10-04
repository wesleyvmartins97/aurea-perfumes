/* Shared catalogue pagination: never changes product objects or the source list. */
(function(root){
 // Same breakpoint as the mobile catalogue layout. Keep these limits stable.
 const MOBILE_QUERY='(max-width: 700px)',MOBILE_SIZE=12,DESKTOP_SIZE=24;
 const pageSize=()=>root.matchMedia?.(MOBILE_QUERY).matches?MOBILE_SIZE:DESKTOP_SIZE;
 const adaptPage=(page,oldSize,newSize)=>Math.floor((Math.max(1,page)-1)*oldSize/newSize)+1;
 const paginate=(list,requested=1,size=pageSize())=>{
  const pages=Math.max(1,Math.ceil(list.length/size)),page=Math.max(1,Math.min(pages,Math.trunc(Number(requested))||1)),offset=(page-1)*size;
  return {items:list.slice(offset,offset+size),page,pages,total:list.length,start:list.length?offset+1:0,end:Math.min(offset+size,list.length)};
 };
 const numbers=(page,pages)=>{
  const selected=[...new Set([1,pages,page-1,page,page+1].filter(n=>n>=1&&n<=pages))].sort((a,b)=>a-b),out=[];
  selected.forEach((n,i)=>{if(i&&n-selected[i-1]>1)out.push(null);out.push(n)});return out;
 };
 root.VALENZA_PAGES=Object.freeze({paginate,numbers,pageSize,adaptPage,mobileQuery:MOBILE_QUERY});
})(globalThis);
