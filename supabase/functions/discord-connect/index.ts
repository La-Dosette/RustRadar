import{createClient}from'npm:@supabase/supabase-js@2';

const jsonHeaders={'content-type':'application/json','access-control-allow-origin':'*','access-control-allow-headers':'authorization, x-client-info, apikey, content-type'};
const safeReturn=(value:string,site:string)=>{try{const url=new URL(value);return url.origin===new URL(site).origin?url.toString():site;}catch{return site;}};

Deno.serve(async request=>{
 if(request.method==='OPTIONS')return new Response('ok',{headers:jsonHeaders});
 const supabaseUrl=Deno.env.get('SUPABASE_URL'),serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),clientId=Deno.env.get('DISCORD_CLIENT_ID'),clientSecret=Deno.env.get('DISCORD_CLIENT_SECRET'),siteUrl=Deno.env.get('SITE_URL')||'https://la-dosette.github.io/RustRadar/';
 if(!supabaseUrl||!serviceKey||!clientId||!clientSecret)return new Response(JSON.stringify({error:'Discord is not configured'}),{status:500,headers:jsonHeaders});
 const db=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false}}),redirectUri=`${supabaseUrl}/functions/v1/discord-connect`,url=new URL(request.url);
 if(request.method==='POST'){
  const token=(request.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');const{data:{user}}=await db.auth.getUser(token);if(!user)return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:jsonHeaders});
  const body=await request.json().catch(()=>({})),state=crypto.randomUUID()+crypto.randomUUID(),returnTo=safeReturn(body.return_to||siteUrl,siteUrl);await db.from('discord_oauth_states').delete().lt('expires_at',new Date().toISOString());await db.from('discord_oauth_states').insert({state,user_id:user.id,return_to:returnTo,expires_at:new Date(Date.now()+10*60000).toISOString()});
  const params=new URLSearchParams({response_type:'code',client_id:clientId,scope:'webhook.incoming',redirect_uri:redirectUri,state});return new Response(JSON.stringify({authorize_url:`https://discord.com/oauth2/authorize?${params}`}),{headers:jsonHeaders});
 }
 if(request.method==='GET'){
  const state=url.searchParams.get('state')||'',code=url.searchParams.get('code')||'';const{data:stored}=await db.from('discord_oauth_states').select('*').eq('state',state).gt('expires_at',new Date().toISOString()).maybeSingle();if(!stored||!code)return Response.redirect(`${siteUrl}?discord=error`,302);await db.from('discord_oauth_states').delete().eq('state',state);
  const response=await fetch('https://discord.com/api/v10/oauth2/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:clientId,client_secret:clientSecret,grant_type:'authorization_code',code,redirect_uri:redirectUri})});const result=await response.json();if(!response.ok||!result.webhook?.id||!result.webhook?.token)return Response.redirect(`${stored.return_to}?discord=error`,302);
  const webhook=result.webhook;const{data:destination}=await db.from('discord_destinations').upsert({user_id:stored.user_id,guild_id:webhook.guild_id||null,channel_id:webhook.channel_id,name:webhook.name||'RustRadar alerts'},{onConflict:'user_id,channel_id'}).select('id').single();if(!destination)return Response.redirect(`${stored.return_to}?discord=error`,302);await db.from('discord_webhook_secrets').upsert({destination_id:destination.id,webhook_id:webhook.id,webhook_token:webhook.token,updated_at:new Date().toISOString()});return Response.redirect(`${stored.return_to}?discord=connected`,302);
 }
 return new Response(JSON.stringify({error:'Method not allowed'}),{status:405,headers:jsonHeaders});
});
