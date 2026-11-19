import {NextRequest,NextResponse} from 'next/server';
export const runtime='nodejs';
const usage=new Map<string,{count:number,reset:number}>();
const sections=['Fruits & Vegetables','Meat & Seafood','Other Frozen Foods','Pantry & Dry Goods','Condiments & Soup Bases','Refrigerated Essentials'];
const rules=`You power a home cooking app. Return ONLY a JSON object, no markdown. Never invent package-label facts: use null or empty values when unreadable. Quantities in grams when known; use pcs for countable items. For a variable-weight range use its midpoint, and preserve the original min/max in rangeMin/rangeMax. Classify items into exactly one of ${sections.join(', ')}. Nutrition numbers must be per 100g and zero if unavailable, with nutritionVerified=false when unknown. Never assert that visually estimated produce weights are exact. No safety guarantees.`;
export async function POST(req:NextRequest){
 try{
  if(!process.env.OPENAI_API_KEY)return NextResponse.json({error:'AI is not configured. Add OPENAI_API_KEY to Vercel environment variables.'},{status:503});
  const ip=(req.headers.get('x-forwarded-for')||'unknown').split(',')[0].trim();
  const now=Date.now();const entry=usage.get(ip);const count=entry&&entry.reset>now?entry.count:0;
  if(count>=20)return NextResponse.json({error:'AI request limit reached for this hour. Please try later.'},{status:429});
  usage.set(ip,{count:count+1,reset:entry&&entry.reset>now?entry.reset:now+3600000});
  const body=await req.json();
  if(JSON.stringify(body).length>10_000_000)return NextResponse.json({error:'Request too large. Try fewer or smaller photos.'},{status:413});
  const mode=body.mode;
  if(!['scan','chat'].includes(mode))return NextResponse.json({error:'Invalid mode'},{status:400});
  const userContent:any[]=[];
  if(mode==='scan'){
   const pics=Array.isArray(body.images)?body.images.slice(0,5):[];
   if(!pics.length)return NextResponse.json({error:'Select at least one image'},{status:400});
   userContent.push({type:'text',text:`Task: ${body.kind==='recount'?'recount the selected inventory section '+body.section:body.kind==='receipt'?'extract all purchased/ordered groceries from the receipt or order confirmation':'identify grocery items, package weights, nutrition labels and printed dates'}. Treat images as a single import; combine different views of the same package without double counting. Output JSON: {"items":[{"name":"...","qty":number,"unit":"g|pcs|ml|packs","section":"...","location":"Fridge|Freezer|Pantry","date":"YYYY-MM-DD or empty","dateType":"Best by|Use by|Expiration|Unknown","rangeMin":number|null,"rangeMax":number|null,"kcal100":number,"protein100":number,"carb100":number,"fat100":number,"nutritionVerified":boolean,"confidence":"high|medium|low","notes":"..."}],"summary":"..."}. For packaged goods use total package weight, not serving size; for multiple units multiply. If only a range exists, use midpoint. Do not infer expiration dates. Return empty items if nothing legible.`});
   for(const img of pics){if(typeof img!=='string'||!/^data:image\/(jpeg|png|webp);base64,/.test(img))continue;userContent.push({type:'image_url',image_url:{url:img,detail:'high'}})}
  }else{
   userContent.push({type:'text',text:`You are the Kitchen meal-planning assistant. User's message: ${String(body.message||'').slice(0,3000)}\nContext: ${JSON.stringify(body.context||{}).slice(0,30000)}\nRecent chat: ${JSON.stringify(body.history||[]).slice(-12000)}\nReturn JSON {"reply":"friendly concise response", "recipes":[{"id":"unique short id","name":"...","servings":2,"ingredients":[{"name":"...","g":number,"kcal100":number,"protein100":number,"carb100":number,"fat100":number}],"steps":["..."],"notes":"..."}],"plan":{"Monday-Lunch":"recipe id","Monday-Dinner":"recipe id",...},"shopping":["..."]}. Generate a full proposed Mon-Fri lunch/dinner plan when asked to plan a week, with 10 complete recipes. For modifications, preserve unchanged proposed recipes and plan by returning ONLY changed/new recipes and changed plan keys. For a conversational question with no changes, return empty recipes and plan. Make recipes high-protein and vegetable-forward, Japanese/Thai/Chinese inspired as requested. Lunches quick, dinners warm where requested. Prioritize expiring items and inventory. Nutrition values are rough estimates unless verified from packaging; explicitly note this. Never claim that the plan has been saved: approval is separate. Use unique ids, and match recipe ingredient names to inventory where possible. Don't invent available inventory.`});
  }
  const response=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Authorization':`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-4o-mini',max_tokens:4500,temperature:0.3,response_format:{type:'json_object'},messages:[{role:'system',content:rules},{role:'user',content:userContent}]})});
  const result=await response.json();if(!response.ok)return NextResponse.json({error:result?.error?.message||'AI request failed'},{status:502});
  const output=JSON.parse(result.choices?.[0]?.message?.content||'{}');return NextResponse.json(output);
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unexpected error'},{status:500})}
}
