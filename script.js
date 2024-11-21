const C={A:new Set(["localhost:8080","http://localhost:8158","http://localhost:8080","localhost:8158"]),B:new Set(["localhost","127.0.0.1","0.0.0.0","::1","fe80::","blocked.example.com"]),D:new Set(["accept","accept-encoding","accept-language","content-type","cache-control","if-match","if-none-match","if-modified-since","if-unmodified-since","range"]),E:new Set(["cf-connecting-ip","x-forwarded-for","x-real-ip","forwarded","via","true-client-ip","x-forwarded-proto","x-forwarded-protocol","x-forwarded-ssl","x-url-scheme","x-http-method-override","x-http-method","x-method-override","x-request-id","x-correlation-id","proxy-connection","proxy-authenticate","proxy-authorization","te","trailer","transfer-encoding","upgrade","cookie","authorization","set-cookie","server","x-powered-by","x-runtime","x-frame-options","x-content-type-options","x-xss-protection"]),F:{'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Strict-Transport-Security':'max-age=63072000; includeSubDomains; preload','X-Frame-Options':'DENY','X-XSS-Protection':'1; mode=block','Cross-Origin-Resource-Policy':'same-origin','Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'require-corp','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'; upgrade-insecure-requests;",'Permissions-Policy':"accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), camera=(), cross-origin-isolated=(), display-capture=(), document-domain=(), encrypted-media=(), execution-while-not-rendered=(), execution-while-out-of-viewport=(), fullscreen=(), geolocation=(), gyroscope=(), keyboard-map=(), magnetometer=(), microphone=(), midi=(), navigation-override=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(), usb=(), web-share=(), xr-spatial-tracking=(), clipboard-read=(), clipboard-write=(), gamepad=(), speaker-selection=(), conversion-measurement=(), focus-without-user-activation=(), hid=(), idle-detection=(), interest-cohort=(), serial=(), trust-token-redemption=(), window-placement=(), vertical-scroll=()"},G:{400:{error:'Bad Request',code:'BAD_REQUEST'},401:{error:'Unauthorized',code:'UNAUTHORIZED'},403:{error:'Forbidden',code:'FORBIDDEN'},404:{error:'Not Found',code:'NOT_FOUND'},413:{error:'Payload Too Large',code:'PAYLOAD_TOO_LARGE'},429:{error:'Too Many Requests',code:'TOO_MANY_REQUESTS'},500:{error:'Internal Server Error',code:'INTERNAL_SERVER_ERROR'},502:{error:'Bad Gateway',code:'BAD_GATEWAY'},504:{error:'Gateway Timeout',code:'GATEWAY_TIMEOUT'},508:{error:'Loop Detected',code:'LOOP_DETECTED'}},H:104857600,I:6e4,J:10,K:'x-target-url',L:'target',M:["0.0.0.0/8","10.0.0.0/8","100.64.0.0/10","127.0.0.0/8","169.254.0.0/16","172.16.0.0/12","192.0.0.0/24","192.0.2.0/24","192.88.99.0/24","192.168.0.0/16","198.18.0.0/15","198.51.100.0/24","203.0.113.0/24","224.0.0.0/4","240.0.0.0/4","255.255.255.255/32","fc00::/7","fe80::/10"]};

  class ProxyError extends Error{constructor(a,b,c=''){super(a);this.name='ProxyError';this.status=b;this.code=c}}

  const N=/^(\d{1,3}\.){3}\d{1,3}$/,O=/^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

  function isPrivateIP(a){return C.M.some(b=>a.startsWith(b.split('/')[0]))}

  function validateIP(a){if(!a)return!1;if(N.test(a)||O.test(a))return!isPrivateIP(a);return!1}

  function isValidUrl(a){try{const b=new URL(a);return['http:','https:'].includes(b.protocol.toLowerCase())&&!isPrivateIP(b.hostname)&&!/^(localhost|127\.0\.0\.1|0\.0\.0\.0|::1)$/i.test(b.hostname)}catch{return!1}}

  function getTargetUrl(a){const b=a.headers.get(C.K);if(b)return b;const c=new URL(a.url);return c.searchParams.get(C.L)}

  function isAllowedOrigin(a){if(!a)return!0;try{const b=new URL(a);return C.A.has(b.host)}catch{return!1}}

  function generateCorsHeaders(a,b=!1){const c=new Headers,d=a.headers.get('Origin');if(d&&isAllowedOrigin(d)){c.set('Access-Control-Allow-Origin',d),c.set('Access-Control-Allow-Credentials','true');if(b){const e=a.headers.get('Access-Control-Request-Method'),f=a.headers.get('Access-Control-Request-Headers');c.set('Access-Control-Allow-Methods',e||'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD'),c.set('Access-Control-Allow-Headers',f||'Content-Type, Accept, Authorization'),c.set('Access-Control-Max-Age','7200')}c.set('Access-Control-Expose-Headers','*'),c.set('Vary','Origin, Access-Control-Request-Headers')}return c}

  function handlePreflight(a){const b=generateCorsHeaders(a,!0);return new Response(null,{status:204,headers:{...Object.fromEntries(b),...C.F}})}

  function filterAndForwardHeaders(a,b){const c=new Headers;for(const[f,g]of a.entries()){const h=f.toLowerCase();C.D.has(h)&&!C.E.has(h)&&c.set(f,g)}return c.set('Host',b),c.set('X-Request-ID',crypto.randomUUID()),c}

  async function forwardRequest(a,b,c,d=0){if(d>C.J)throw new ProxyError('Too many redirects',508,'TOO_MANY_REDIRECTS');const e=filterAndForwardHeaders(a.headers,b.host),f={method:a.method,headers:e,redirect:'manual',cf:{requestTimeout:C.I,cacheTtl:0,cacheEverything:!1}};if(!['GET','HEAD'].includes(a.method)){const g=parseInt(a.headers.get('Content-Length')||'0',10);if(g>C.H)throw new ProxyError('Request body too large',413,'PAYLOAD_TOO_LARGE');f.body=a.body}try{const g=await fetch(b.toString(),f);if(g.status>=300&&g.status<400&&g.headers.has('Location')){const h=g.headers.get('Location');if(!h)throw new ProxyError('Invalid redirect',502,'INVALID_REDIRECT');try{const i=new URL(h,b);if(!isValidUrl(i.toString()))throw new ProxyError('Invalid redirect URL',502,'INVALID_REDIRECT_URL');return await forwardRequest(a,i,c,d+1)}catch(j){throw new ProxyError('Invalid redirect URL',502,'INVALID_REDIRECT_URL')}}return createProxyResponse(g,a)}catch(g){if(g instanceof ProxyError)throw g;if(g.message.includes('network'))throw new ProxyError('Network error',502,'NETWORK_ERROR');if(g.name==='AbortError')throw new ProxyError('Request timeout',504,'TIMEOUT');throw new ProxyError('Gateway error',502,'GATEWAY_ERROR')}}

  function createProxyResponse(a,b){const c=new Headers(a.headers),d=generateCorsHeaders(b);C.E.forEach(e=>c.delete(e));if(b.headers.get('Origin'))for(const[e,f]of d.entries())c.set(e,f);Object.entries(C.F).forEach(([e,f])=>c.set(e,f));a.headers.has('Cache-Control')||(c.set('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate'),c.set('Pragma','no-cache'),c.set('Expires','0'));return c.delete('Via'),c.delete('Server'),c.delete('X-Powered-By'),new Response(a.body,{status:a.status,statusText:a.statusText,headers:c})}

  function handleError(a,b){const c=a instanceof ProxyError?a.status:500,d=a instanceof ProxyError?a.code:'INTERNAL_ERROR',e=C.G[c]||{error:'Internal Server Error',code:'INTERNAL_ERROR'},f=new Headers({'Content-Type':'application/json','Cache-Control':'no-store, no-cache, must-revalidate, proxy-revalidate','Pragma':'no-cache','Expires':'0',...C.F}),g=generateCorsHeaders(b);if(b.headers.get('Origin'))for(const[h,i]of g.entries())f.set(h,i);const j=JSON.stringify({error:e.error,code:d,timestamp:new Date().toISOString(),requestId:crypto.randomUUID()});return new Response(j,{status:c,headers:f})}

  export default{async fetch(a,b,c){try{if(!a.url||!['GET','POST','PUT','DELETE','PATCH','HEAD','OPTIONS'].includes(a.method))throw new ProxyError('Method Not Allowed',405,'METHOD_NOT_ALLOWED');if(a.method==='OPTIONS')return handlePreflight(a);const d=a.headers.get('Origin');if(d&&!isAllowedOrigin(d))throw new ProxyError('Origin not allowed',403,'FORBIDDEN_ORIGIN');return await processRequest(a,c)}catch(d){return handleError(d,a)}}}

  async function processRequest(a,b){const c=new URL(a.url),d=getTargetUrl(a);if(!d)throw new ProxyError('Missing target URL',400,'MISSING_TARGET');if(!isValidUrl(d))throw new ProxyError('Invalid target URL',400,'INVALID_TARGET');const e=new URL(d);if(C.B.has(e.hostname.toLowerCase()))throw new ProxyError('Blocked host',403,'BLOCKED_HOST');return await forwardRequest(a,e,b,0)}
