import {NextRequest,NextResponse} from 'next/server';
export const runtime='nodejs';
const usage=new Map<string,{count:number,reset:number}>();
const sections=['Fruits & Vegetables','Meat & Seafood','Other Frozen Foods','Pantry & Dry Goods','Condiments & Soup Bases','Refrigerated Essentials'];
const rules=`You power a home cooking app. Return ONLY a JSON object, no markdown. Never invent package-label facts: use null or empty values when unreadable. Quantities in grams when known; use pcs for countable items. For a variable-weight range use its midpoint, and preserve the original min/max in rangeMin/rangeMax. Classify items into exactly one of ${sections.join(', ')}. Nutrition numbers must be per 100g and zero if unavailable, with nutritionVerified=false when unknown. Never assert that visually estimated produce weights are exact. No safety guarantees.`;
export async function POST(req:NextRequest){
 try{
  if(!process.env.OPENAI_API_KEY)return NextResponse.json({error:'AI is not configured. Add OPENAI_API_KEY to Vercel environment variables.'},{status:503});
  // Verify the caller's Supabase session before spending API credits.
  const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishable=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!supabaseUrl||!publishable)return NextResponse.json({error:'Supabase auth is not configured.'},{status:503});
  const bearer=req.headers.get('authorization')||'';
  if(!bearer.startsWith('Bearer '))return NextResponse.json({error:'Sign in to Kitchen to use AI.'},{status:401});
  const authResponse=await fetch(`${supabaseUrl}/auth/v1/user`,{headers:{apikey:publishable,authorization:bearer},cache:'no-store'});
  if(!authResponse.ok)return NextResponse.json({error:'Your session has expired. Sign in again.'},{status:401});
  const {id:userId}=await authResponse.json();
  if(typeof userId!=='string')return NextResponse.json({error:'Invalid session.'},{status:401});
  const membershipUrl=new URL('/rest/v1/household_members',supabaseUrl);
  membershipUrl.search=new URLSearchParams({select:'household_id',user_id:`eq.${userId}`,limit:'1'}).toString();
  const membership=await fetch(membershipUrl,{headers:{apikey:publishable,authorization:bearer},cache:'no-store'});
  if(!membership.ok)return NextResponse.json({error:'Unable to verify household access.'},{status:503});
  const households=await membership.json();
  if(!Array.isArray(households)||!households.length)return NextResponse.json({error:'Kitchen household membership is required.'},{status:403});
  const now=Date.now();
  for(const [id,entry] of usage)if(entry.reset<=now)usage.delete(id);
  const entry=usage.get(userId);
  if(entry&&entry.count>=80)return NextResponse.json({error:'AI request limit reached for this hour. Please try later.'},{status:429});
  usage.set(userId,{count:(entry?.count??0)+1,reset:entry?.reset??now+3600000});
  const body=await req.json();
  if(JSON.stringify(body).length>10_000_000)return NextResponse.json({error:'Request too large. Try fewer or smaller photos.'},{status:413});
  const mode=body.mode;
  if(!['scan','chat','review','recipe'].includes(mode))return NextResponse.json({error:'Invalid mode'},{status:400});
  const userContent:any[]=[];
  if(mode==='scan'){
   const pics=Array.isArray(body.images)?body.images.slice(0,3):[];
   if(!pics.length)return NextResponse.json({error:'Select at least one image'},{status:400});
   userContent.push({type:'text',text:`Task: ${body.kind==='recount'?'recount the selected inventory section '+body.section:body.kind==='receipt'?'extract all purchased/ordered groceries from the receipt or order confirmation':'identify grocery items, package weights, nutrition labels and printed dates'}. ${body.grouped===true?'These are different views of the SAME physical package. Combine the front, date and nutrition views into ONE item without adding their quantities. Merge only legible facts.':'Identify each distinct product without duplicating it.'} Output JSON: {"items":[{"name":"...","brand":"...","originalName":"...","photoIndex":number,"reviewReason":"...","packageQty":number,"qty":number,"unit":"g|pcs|ml|packs","section":"...","location":"Fridge|Freezer|Pantry","date":"YYYY-MM-DD or empty","dateType":"Best by|Use by|Expiration|Unknown","rangeMin":number|null,"rangeMax":number|null,"kcal100":number,"protein100":number,"carb100":number,"fat100":number,"nutritionVerified":boolean,"confidence":"high|medium|low","notes":"..."}],"summary":"..."}. Double-check each character against the image, including lookalikes such as 豉 and 鼓. Flag uncertain characters for review. Preserve the exact original product name and script (Chinese/Japanese/etc.), product variant and brand; never collapse different brands into generic English labels. Include brand, originalName, photoIndex, reviewReason, and packageQty for each item. The name should be the most specific product name visible. When uncertain state why in reviewReason. For packaged goods use total package weight, not serving size; for multiple units multiply. If only a range exists, use midpoint. Do not infer expiration dates. Return empty items if nothing legible.`});
   for(const img of pics){if(typeof img!=='string'||!/^data:image\/(jpeg|png|webp);base64,/.test(img))continue;userContent.push({type:'image_url',image_url:{url:img,detail:'high'}})}
  }else if(mode==='review'){
   userContent.push({type:'text',text:`Correct this DRAFT grocery scan based on the user's instructions. Do not alter unrelated items. Keep IDs unchanged for existing items, preserve original-language product names and brands. You may merge duplicates when explicitly requested. Do not invent label values. User instructions: ${String(body.message||'').slice(0,3000)}\nCurrent draft items: ${JSON.stringify(body.items||[]).slice(0,45000)}\nRecent messages: ${JSON.stringify(body.history||[]).slice(-6000)}\nReturn JSON {"reply":"what was changed and what still needs review","items":[complete revised items with all original fields including id]}.`});
  }else if(mode==='recipe'){
   userContent.push({type:'text',text:`Convert this user-provided recipe text into structured cooking instructions and ingredients. Keep the recipe's identity and instructions; do not invent precise nutrition from the text. Use 0 for unknown nutrition and note uncertainty. Recipe: ${String(body.text||'').slice(0,12000)}\nReturn JSON {"recipe":{"name":"...","servings":2,"ingredients":[{"name":"...","qty":0,"unit":"original recipe unit","kcal100":0,"protein100":0,"carb100":0,"fat100":0}],"steps":["..."],"notes":"Nutrition requires verification"}}. Preserve the numeric quantity and original unit from the source (5 ml oil stays qty 5, unit ml). Never convert volume, count, or spoon measures into mass. When absent use qty 0 and unit empty. Use standard unit symbols where unambiguous.`});
  }else{
   userContent.push({type:'text',text:`You are the Kitchen meal-planning assistant. User's message: ${String(body.message||'').slice(0,3000)}\nContext: ${JSON.stringify(body.context||{}).slice(0,30000)}\nRecent chat: ${JSON.stringify(body.history||[]).slice(-12000)}\nReturn JSON {"reply":"friendly concise response", "recipes":[{"id":"unique short id","name":"...","servings":2,"ingredients":[{"name":"...","qty":number,"unit":"g|kg|ml|l|pcs|packs","kcal100":number,"protein100":number,"carb100":number,"fat100":number}],"steps":["..."],"notes":"..."}],"plan":{"Monday-Lunch":"recipe id","Monday-Dinner":"recipe id",...},"shopping":["..."]}. Generate a full proposed Mon-Fri lunch/dinner plan when asked to plan a week, with 10 complete recipes. For modifications, preserve unchanged proposed recipes and plan by returning ONLY changed/new recipes and changed plan keys. For a conversational question with no changes, return empty recipes and plan. Make recipes high-protein and vegetable-forward, Japanese/Thai/Chinese inspired as requested. Lunches quick, dinners warm where requested. Prioritize expiring items and inventory. Nutrition values are rough estimates unless verified from packaging; explicitly note this. Never claim that the plan has been saved: approval is separate. Use unique ids, and match recipe ingredient names to inventory where possible. Don't invent available inventory.`});
  }
  const response=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Authorization':`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-4o-mini',max_tokens:4500,temperature:0.3,response_format:{type:'json_object'},messages:[{role:'system',content:rules},{role:'user',content:userContent}]})});
  const result=await response.json();if(!response.ok)return NextResponse.json({error:result?.error?.message||'AI request failed'},{status:502});
  const output=JSON.parse(result.choices?.[0]?.message?.content||'{}');return NextResponse.json(output);
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unexpected error'},{status:500})}
}
