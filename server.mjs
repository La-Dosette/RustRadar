import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
const production=process.argv.includes('--production');
const vite=production?null:await (await import('vite')).createServer({server:{middlewareMode:true},appType:'spa'});
const feeds={wiped:'https://wipeboard.net/api/v1/just-wiped',upcoming:'https://wipeboard.net/api/v1/wipes'};
const cache=new Map();
const pending=new Map();
async function getData(url){
 const old=cache.get(url);
 if(old&&Date.now()-old.time<60000)return old.body;
 if(pending.has(url))return pending.get(url);
 const request=(async()=>{const response=await fetch(url,{headers:{'User-Agent':'RustRadar/1.0 (Rust wipe discovery; credits wipeboard.net)'},signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('Source unavailable');const body=await response.json();if(!body||typeof body!=='object')throw Error('Invalid source');if(cache.size>300)cache.delete(cache.keys().next().value);cache.set(url,{body,time:Date.now()});return body;})();
 pending.set(url,request);try{return await request;}finally{pending.delete(url);}
}
const textCache=new Map();
async function getText(url){
 const old=textCache.get(url);
 if(old&&Date.now()-old.time<900000)return old.body;
 const response=await fetch(url,{headers:{'User-Agent':'RustRadar/1.0 (Rust wipe discovery; credits wipeboard.net)'},signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error('Source unavailable');
 const body=await response.text();
 if(textCache.size>100)textCache.delete(textCache.keys().next().value);
 textCache.set(url,{body,time:Date.now()});
 return body;
}
function decodeText(value){
 return value.replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&middot;/g,'·').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
}
function observedWipes(html){
 const table=html.match(/Observed wipes[^<]*<\/div><div[^>]*><table[^>]*class="wt"[^>]*>([\s\S]*?)<\/table>/i)?.[1];
 if(!table)return [];
 return [...table.matchAll(/<tr>([\s\S]*?)<\/tr>/gi)].slice(1,11).map(match=>{
  const cells=[...match[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(cell=>decodeText(cell[1]));
  if(cells.length<4)return null;
  const cleanDate=value=>value.replace(/,\s*\d{1,2}$/,'');
  return {started:cleanDate(cells[0]),scheduled:cells[1]==='none'?'':cleanDate(cells[1]),offset:cells[2],source:cells[3]};
 }).filter(Boolean);
}
const sendJson=(res,body)=>{res.writeHead(200,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(body));};
const sendFail=(res)=>{res.writeHead(502,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Wipe Board is unavailable. Try again in a moment.'}));};
http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/api/servers'){
  const feed=feeds[url.searchParams.get('feed')]||feeds.wiped;
  const q=new URLSearchParams({limit:'100'});for(const k of ['hours','region','team','type','cycle','min_players','sort']){const v=url.searchParams.get(k);if(v&&v.length<30)q.set(k,v);}
 try{const data=await getData(feed+'?'+q);if(!Array.isArray(data.servers||data.wipes))throw Error('Invalid source');sendJson(res,data);}catch{sendFail(res);}return;
 }
 if(url.pathname==='/api/search'){
  const query=(url.searchParams.get('q')||'').trim().slice(0,100);
  if(query.length<2){res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Type at least 2 characters.'}));return;}
  try{sendJson(res,await getData('https://wipeboard.net/api/v1/server?'+new URLSearchParams({q:query,limit:'25'})));}catch{sendFail(res);}return;
 }
 if(url.pathname==='/api/server'){
  const id=(url.searchParams.get('id')||'').trim().slice(0,80);
  if(!/^[a-zA-Z0-9_-]+$/.test(id)){res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Invalid server id.'}));return;}
  try{
   const data=await getData('https://wipeboard.net/api/v1/server?'+new URLSearchParams({id,limit:'1'}));
   const server=data.servers?.find(item=>String(item.id)===id)||data.servers?.[0];
   if(!server){res.writeHead(404,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Server not found.'}));return;}
   let history=[];
   try{history=observedWipes(await getText(server.page));}catch{}
   sendJson(res,{server:{...server,observed_wipes:history}});
  }catch{sendFail(res);}return;
 }
 if(url.pathname==='/api/force-wipe'){
  try{sendJson(res,await getData('https://wipeboard.net/api/v1/force-wipe'));}catch{sendFail(res);}return;
 }
 if(vite)return vite.middlewares(req,res);
 try{const root=resolve('dist');let file=resolve(root,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(root+'/')&&!file.startsWith(root+'\\')&&file!==root){res.writeHead(403);res.end();return;}if(!extname(file))file=resolve(root,'index.html');const body=await readFile(file);res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'})[extname(file)]||'application/octet-stream');res.end(body);}catch{res.writeHead(404);res.end('Not found');}
}).listen(Number(process.env.PORT)||5173,process.env.HOST||'127.0.0.1',()=>console.log('RustRadar: http://localhost:'+(process.env.PORT||5173)));
