// The store buys each perfume after payment; administrative inventory is not
// physical ready-to-ship stock. Keep the feed and landing page on one estimate.
const fixedHolidays = new Set(['01-01','04-21','05-01','09-07','10-12','11-02','11-15','11-20','12-25']);
function easter(year) {
 const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),v=h+l-7*m+114;
 return new Date(Date.UTC(year,Math.floor(v/31)-1,v%31+1,12));
}
function businessDay(date) {
 if([0,6].includes(date.getUTCDay())||fixedHolidays.has(date.toISOString().slice(5,10)))return false;
 const goodFriday=easter(date.getUTCFullYear());goodFriday.setUTCDate(goodFriday.getUTCDate()-2);
 return date.toISOString().slice(0,10)!==goodFriday.toISOString().slice(0,10);
}
export function merchantFulfillment(now=new Date()) {
 const local=new Date(now.getTime()-3*60*60*1000);
 const day=new Date(Date.UTC(local.getUTCFullYear(),local.getUTCMonth(),local.getUTCDate(),12));
 // After the account's 14:00 cutoff, processing starts the next business day.
 if(local.getUTCHours()>=14&&businessDay(day))do{day.setUTCDate(day.getUTCDate()+1)}while(!businessDay(day));
 for(let count=0;count<10;){day.setUTCDate(day.getUTCDate()+1);if(businessDay(day))count++;}
 const iso=day.toISOString().slice(0,10);
 return {availability:'backorder',schemaAvailability:'https://schema.org/BackOrder',date:iso+'T18:00:00-03:00',label:iso.slice(8,10)+'/'+iso.slice(5,7)+'/'+iso.slice(0,4)};
}

// Stable build templates; the Worker resolves these per request in both feeds and pages.
export const merchantTemplateFulfillment={schemaAvailability:'https://schema.org/BackOrder',date:'__VALENZA_DISPATCH_DATE__',label:'__VALENZA_DISPATCH_LABEL__'};
