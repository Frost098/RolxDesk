/* RolxDesk extras-fix v6.3 — Kimi/GLM NVIDIA-only, no persona Kimi */
(function(){
  if(window.__RD_EXTRAS_FIX63__)return;
  window.__RD_EXTRAS_FIX63__=true;
  var RD_VERSION="6.3.0";
  var DEAD={"nex-agi/nex-n2.5-mini:free":"qwen/qwen3.8-27b:free","nex-agi/nex-n2.5-mini":"qwen/qwen3.8-27b:free","nex-agi/nex-n2.5-pro:free":"qwen/qwen3.8-27b:free","z-ai/glm-5.2":"z-ai/glm-5.3","z-ai/glm-4.7":"z-ai/glm-5.3-flash","z-ai/glm-5-3":"z-ai/glm-5.3","z-ai/glm-5-3-flash":"z-ai/glm-5.3-flash"};
  function remap(id){var s=String(id||"");if(DEAD[s])return DEAD[s];if(/nex-agi\/nex-n2/i.test(s))return"qwen/qwen3.8-27b:free";return s;}
  function nvKey(){try{var k=(window.state&&state.keys&&state.keys.nvidia)||"";if(k)return k;var r=JSON.parse(localStorage.getItem("rd_keys")||"{}");return r.nvidia||""}catch(e){return""}}
  function needsNv(m,f){m=String(m||"");f=String(f||"");if(f==="kimi"||f==="glm"||f==="deepseek"||f==="qwen_nv")return true;if(f==="nvidia"&&m.indexOf(":free")<0)return true;if(/^moonshotai\//i.test(m)||/^z-ai\//i.test(m)||/^deepseek-ai\//i.test(m))return true;if(/^nvidia\//i.test(m)&&m.indexOf(":free")<0)return true;return false}
  async function callNv(messages,modelId,key,temp,maxTok){
    var mid=remap(String(modelId||"").replace(/^nv:/,""));
    if(!mid||mid==="custom")mid="moonshotai/kimi-k3";
    var mt=Math.min(parseInt(maxTok,10)||1024,1024);
    var r=await fetch("https://integrate.api.nvidia.com/v1/chat/completions",{method:"POST",headers:{Authorization:"Bearer "+key,"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({model:mid,messages:(messages||[]).slice(-20).map(function(m){return{role:m.role,content:typeof m.content==="string"?m.content:JSON.stringify(m.content)}}),temperature:temp!=null?temp:0.7,max_tokens:mt,stream:false})});
    var data=await r.json().catch(function(){return{}});
    if(!r.ok)throw new Error(String((data.error&&(data.error.message||data.error))||data.message||("NVIDIA HTTP "+r.status)));
    return data;
  }
  function patchCatalog(){
    try{
      if(typeof MODELS==="undefined")return;
      MODELS.persona=[
        {id:"nvidia/nemotron-3-super-120b-a12b:free",name:"Claude Sonnet",persona:"claude-sonnet"},
        {id:"cohere/north-mini-code:free",name:"Claude Haiku",persona:"claude-haiku"},
        {id:"cohere/north-mini-code:free",name:"GPT-4o",persona:"gpt-4o"},
        {id:"liquid/lfm-2.5-2.6b:free",name:"GPT-4o mini",persona:"gpt-4o-mini"},
        {id:"qwen/qwen3.8-27b:free",name:"Grok 4",persona:"grok-4"}
      ];
      MODELS.kimi=[{id:"moonshotai/kimi-k3",name:"Kimi K3 (NVIDIA key)"}];
      MODELS.glm=[{id:"z-ai/glm-5.3",name:"GLM 5.3 (NVIDIA key)"},{id:"z-ai/glm-5.3-flash",name:"GLM 5.3 Flash (NVIDIA key)"}];
      MODELS.gpt=[{id:"cohere/north-mini-code:free",name:"North Mini Code"},{id:"qwen/qwen3.8-27b:free",name:"Qwen3.8 27B"},{id:"liquid/lfm-2.5-2.6b:free",name:"LFM2.5 2.6B"},{id:"openrouter/free",name:"OpenRouter Free Router"}];
      MODELS.deepseek=[{id:"deepseek-ai/deepseek-v4.1-flash",name:"DeepSeek V4.1 Flash (NVIDIA)"},{id:"deepseek-ai/deepseek-v3.2",name:"DeepSeek V3.2 (NVIDIA)"}];
    }catch(e){}
  }
  function injectFam(){
    var fam=document.getElementById("familySelect");if(!fam)return;
    function add(v,l){if(fam.querySelector('option[value="'+v+'"]'))return;var o=document.createElement("option");o.value=v;o.textContent=l;var c=fam.querySelector('option[value="custom"]');if(c)fam.insertBefore(o,c);else fam.appendChild(o)}
    add("kimi","Kimi (NVIDIA key)");add("glm","GLM (NVIDIA key)");
  }
  function patchFetch(){
    if(window.__rdFetch63)return;window.__rdFetch63=true;
    var orig=window.fetch;
    window.fetch=function(input,init){
      try{
        var url=typeof input==="string"?input:(input&&input.url)||"";
        if(/openrouter\.ai/i.test(url)&&init&&init.body&&typeof init.body==="string"){
          var body=JSON.parse(init.body);
          if(body&&body.model){
            var m=String(body.model);
            if(/^moonshotai\/|^z-ai\/|^deepseek-ai\//i.test(m)){
              return Promise.reject(new Error("Model "+m+" harus lewat NVIDIA (Settings → NVIDIA API Key + family Kimi/GLM). Bukan OpenRouter."));
            }
            var m2=remap(m);if(m2!==m){body.model=m2;init=Object.assign({},init,{body:JSON.stringify(body)})}
          }
        }
      }catch(e){if(e&&/harus lewat NVIDIA/i.test(String(e.message||e)))return Promise.reject(e)}
      return orig.apply(this,arguments);
    };
  }
  function patchCall(){
    if(typeof window.callModel!=="function"||window.callModel.__rdFix63)return;
    var prev=window.callModel;
    window.callModel=async function(messages){
      var fam=(document.getElementById("familySelect")||{}).value||"";
      var model=(document.getElementById("modelSelect")||{}).value||"";
      if(window.state&&state.selectedModel)model=state.selectedModel||model;
      model=remap(model);
      var key=nvKey();
      if(needsNv(model,fam)){
        if(!key)throw new Error("Model ini butuh NVIDIA API Key di Settings (build.nvidia.com). Bukan OpenRouter.");
        var temp=0.7,maxTok=1024;
        try{temp=parseFloat((state.settings&&state.settings.temperature)||0.7);maxTok=parseInt((state.settings&&state.settings.maxTokens)||1024,10)}catch(e0){}
        if(typeof injectPersona==="function"){try{messages=injectPersona(typeof normalizeMessages==="function"?normalizeMessages(messages):messages)}catch(e1){}}
        return await callNv(messages,model,key,temp,maxTok);
      }
      try{var ms=document.getElementById("modelSelect");if(ms&&ms.value){var fx=remap(ms.value);if(fx!==ms.value){ms.value=fx;if(window.state)state.selectedModel=fx}}}catch(e2){}
      return prev.apply(this,arguments);
    };
    window.callModel.__rdFix63=true;
  }
  function injectVer(){
    var body=document.querySelector("#settingsModal .modal-body");if(!body)return;
    var el=document.getElementById("rd-version-badge");
    if(!el){el=document.createElement("div");el.id="rd-version-badge";el.style.cssText="font-size:11px;color:#888;margin-top:8px;padding:6px 0;border-top:1px solid #2a2a34";body.appendChild(el)}
    el.innerHTML="RolxDesk <b style=\"color:#a89cff\">v"+RD_VERSION+"</b> · Kimi/GLM → NVIDIA only";
  }
  function boot(){patchCatalog();injectFam();patchFetch();patchCall();injectVer();try{if(typeof populateModels==="function")populateModels()}catch(e){}}
  setTimeout(boot,200);setTimeout(boot,800);setTimeout(boot,2000);setTimeout(boot,4000);
  var modal=document.getElementById("settingsModal");
  if(modal&&!modal.__rdVer63){modal.__rdVer63=true;new MutationObserver(function(){if(modal.classList.contains("open"))injectVer()}).observe(modal,{attributes:true,attributeFilter:["class"]})}
})();
