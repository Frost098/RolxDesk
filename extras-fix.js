/* RolxDesk extras-fix v6.4.2 — NVIDIA key persist + openai-compat proxy + SVG */
(function(){
  if(window.__RD_EXTRAS_FIX642__)return;
  window.__RD_EXTRAS_FIX642__=true;
  var RD_VERSION="6.4.2";
  var DEAD={"nex-agi/nex-n2.5-mini:free":"qwen/qwen3.8-27b:free","nex-agi/nex-n2.5-mini":"qwen/qwen3.8-27b:free","nex-agi/nex-n2.5-pro:free":"qwen/qwen3.8-27b:free","z-ai/glm-5.2":"z-ai/glm-5.3","z-ai/glm-4.7":"z-ai/glm-5.3-flash","z-ai/glm-5-3":"z-ai/glm-5.3","z-ai/glm-5-3-flash":"z-ai/glm-5.3-flash"};
  function remap(id){var s=String(id||"");if(DEAD[s])return DEAD[s];if(/nex-agi\/nex-n2/i.test(s))return"qwen/qwen3.8-27b:free";return s}

  function readNvFromStorage(){
    try{
      var solo=localStorage.getItem("rd_nvidia_key")||"";
      if(solo)return solo;
      var all=JSON.parse(localStorage.getItem("rd_keys")||"{}");
      return all.nvidia||all.NVIDIA||all.nvidiaKey||"";
    }catch(e){return""}
  }
  function writeNvToStorage(v){
    v=String(v||"").trim();
    try{localStorage.setItem("rd_nvidia_key",v)}catch(e){}
    try{
      var all=JSON.parse(localStorage.getItem("rd_keys")||"{}");
      all.nvidia=v;
      localStorage.setItem("rd_keys",JSON.stringify(all));
    }catch(e2){}
    try{if(window.state){state.keys=state.keys||{};state.keys.nvidia=v}}catch(e3){}
  }
  function nvKey(){
    try{var k=(window.state&&state.keys&&state.keys.nvidia)||"";if(k)return String(k).trim()}catch(e){}
    var from=readNvFromStorage();
    if(from&&window.state){try{state.keys=state.keys||{};state.keys.nvidia=from}catch(e2){}}
    return from;
  }
  function ensureNvInState(){
    var k=readNvFromStorage();if(!k)return;
    try{if(window.state){state.keys=state.keys||{};if(!state.keys.nvidia)state.keys.nvidia=k}}catch(e){}
  }

  function ensureNvidiaInput(){
    var modal=document.querySelector("#settingsModal .modal-body, #settingsModal, .settings-body");
    if(!modal)return;
    var existing=document.getElementById("rdNvidiaKey")||document.getElementById("keyNvidia");
    if(existing){
      if(!existing.value){var k=readNvFromStorage();if(k)existing.value=k}
      return existing;
    }
    var group=document.getElementById("rd-nvidia-key-group");
    if(!group){
      group=document.createElement("div");
      group.id="rd-nvidia-key-group";
      group.className="form-group";
      group.style.cssText="margin-top:10px;padding-top:10px;border-top:1px solid #2a2a34";
      group.innerHTML='<label>NVIDIA API Key <span style="color:#76B900;font-size:11px">(build.nvidia.com — disimpan terpisah)</span></label><input type="password" id="rdNvidiaKey" placeholder="nvapi-..." autocomplete="off" style="width:100%;margin-top:4px" />';
      modal.appendChild(group);
    }
    var inp=document.getElementById("rdNvidiaKey");
    if(inp){
      var k2=readNvFromStorage();if(k2)inp.value=k2;
      if(!inp.__rdNvBound){
        inp.__rdNvBound=true;
        var save=function(){writeNvToStorage(inp.value)};
        inp.addEventListener("change",save);
        inp.addEventListener("blur",save);
        inp.addEventListener("input",function(){clearTimeout(inp.__rdNvT);inp.__rdNvT=setTimeout(save,400)});
      }
    }
    return inp;
  }

  function patchSaveLoad(){
    if(typeof window.saveSettings==="function"&&!window.saveSettings.__rdNv){
      var prevSave=window.saveSettings;
      window.saveSettings=function(){
        var inp=document.getElementById("rdNvidiaKey")||document.getElementById("keyNvidia");
        var typed=inp?String(inp.value||"").trim():"";
        var before=typed||readNvFromStorage();
        var r=prevSave.apply(this,arguments);
        if(before)writeNvToStorage(before);
        else{
          ensureNvInState();
          try{
            var all=JSON.parse(localStorage.getItem("rd_keys")||"{}");
            if(!all.nvidia){
              var solo=localStorage.getItem("rd_nvidia_key")||"";
              if(solo){all.nvidia=solo;localStorage.setItem("rd_keys",JSON.stringify(all))}
            }
          }catch(e){}
        }
        ensureNvidiaInput();
        return r;
      };
      window.saveSettings.__rdNv=true;
    }
    if(typeof window.loadSettings==="function"&&!window.loadSettings.__rdNv){
      var prevLoad=window.loadSettings;
      window.loadSettings=function(){
        var r=prevLoad.apply(this,arguments);
        ensureNvInState();
        var inp=ensureNvidiaInput();
        var k=readNvFromStorage();
        if(inp&&k)inp.value=k;
        return r;
      };
      window.loadSettings.__rdNv=true;
    }
    if(!window.__rdLsPatch){
      window.__rdLsPatch=true;
      var rawSet=localStorage.setItem.bind(localStorage);
      localStorage.setItem=function(key,val){
        if(key==="rd_keys"){
          try{
            var obj=JSON.parse(val||"{}");
            var keep=obj.nvidia||localStorage.getItem("rd_nvidia_key")||"";
            if(keep&&!obj.nvidia){obj.nvidia=keep;val=JSON.stringify(obj)}
            if(obj.nvidia){try{rawSet("rd_nvidia_key",obj.nvidia)}catch(e0){}}
          }catch(e){}
        }
        return rawSet(key,val);
      };
    }
  }

  function needsNv(m,f){
    m=String(m||"");f=String(f||"");
    if(f==="kimi"||f==="glm"||f==="deepseek"||f==="qwen_nv")return true;
    if(f==="nvidia"&&m.indexOf(":free")<0)return true;
    if(/^moonshotai\//i.test(m)||/^z-ai\//i.test(m)||/^deepseek-ai\//i.test(m))return true;
    if(/^nvidia\//i.test(m)&&m.indexOf(":free")<0)return true;
    return false;
  }

  async function callNv(messages,modelId,key,temp,maxTok){
    var mid=remap(String(modelId||"").replace(/^nv:/,""));
    if(!mid||mid==="custom")mid="moonshotai/kimi-k3";
    var mt=Math.min(parseInt(maxTok,10)||1024,1024);
    var r=await fetch("/api/openai-compat",{
      method:"POST",
      headers:{"Content-Type":"application/json",Accept:"application/json"},
      body:JSON.stringify({
        baseUrl:"https://integrate.api.nvidia.com/v1",
        apiKey:key,
        path:"/chat/completions",
        method:"POST",
        body:{
          model:mid,
          messages:(messages||[]).slice(-20).map(function(m){return{role:m.role,content:typeof m.content==="string"?m.content:JSON.stringify(m.content)}}),
          temperature:temp!=null?temp:0.7,
          max_tokens:mt,
          stream:false
        }
      })
    });
    var data=await r.json().catch(function(){return{}});
    if(!r.ok)throw new Error(String((data.error&&(data.error.message||data.error))||data.message||("NVIDIA proxy HTTP "+r.status)));
    return data;
  }

  var SVG={
    grok:'<svg viewBox="0 0 24 24" width="20" height="20"><rect width="24" height="24" rx="6" fill="#111"/><path fill="#fff" d="M7 7h3.2v4.2L15.5 7H18l-5.6 5.4L18 17h-2.6l-5.2-5V17H7V7z"/></svg>',
    north:'<svg viewBox="0 0 24 24" width="20" height="20"><rect width="24" height="24" rx="6" fill="#39594d"/><circle cx="12" cy="12" r="6.5" fill="none" stroke="#d4f5e2" stroke-width="2"/><path d="M15.2 9.2a4.2 4.2 0 1 0 0 5.6" fill="none" stroke="#d4f5e2" stroke-width="2" stroke-linecap="round"/></svg>',
    gemini:'<svg viewBox="0 0 24 24" width="20" height="20"><rect width="24" height="24" rx="6" fill="#1a1a2e"/><path fill="#8b9cf7" d="M12 3l1.8 5.5L19.5 10l-5.5 1.8L12 17.5l-1.8-5.7L4.5 10l5.7-1.5L12 3z"/></svg>',
    claude:'<svg viewBox="0 0 24 24" width="20" height="20"><rect width="24" height="24" rx="6" fill="#2b2118"/><path fill="#d97757" d="M12 4c-1.2 2.8-3.2 4.8-5.6 5.6 2.4.8 4.4 2.8 5.6 5.6 1.2-2.8 3.2-4.8 5.6-5.6C15.2 8.8 13.2 6.8 12 4z"/></svg>',
    kimi:'<svg viewBox="0 0 24 24" width="20" height="20"><rect width="24" height="24" rx="6" fill="#0f172a"/><path fill="#38bdf8" d="M6 6h4.5v5.2L15.8 6H19l-5.4 6.2L19 18h-3.3l-4.9-5.6V18H6V6z"/></svg>',
    qwen:'<svg viewBox="0 0 24 24" width="20" height="20"><rect width="24" height="24" rx="6" fill="#1e1b4b"/><circle cx="12" cy="12" r="7" fill="none" stroke="#a78bfa" stroke-width="2"/><circle cx="12" cy="12" r="2.5" fill="#a78bfa"/></svg>',
    nvidia:'<svg viewBox="0 0 24 24" width="20" height="20"><rect width="24" height="24" rx="6" fill="#0a0a0a"/><path fill="#76b900" d="M4 14c4-6 8-8 16-9-2 3-4 7-4 11H4v-2zm0 3h12c0 1.5-.5 3-1.5 4H4v-4z"/></svg>',
    gpt:'<svg viewBox="0 0 24 24" width="20" height="20"><rect width="24" height="24" rx="6" fill="#0d0d0d"/><path fill="#10a37f" d="M12 5c2 0 3.5 1 4.2 2.5.8-.3 1.7-.3 2.5.2 1.2.8 1.6 2.3 1.1 3.6.7.7 1.1 1.7 1.1 2.8 0 1.8-1.2 3.3-2.9 3.7-.3 1.3-1.4 2.3-2.8 2.5-1 .2-2-.1-2.7-.8-.7.5-1.6.7-2.5.5-1.4-.3-2.4-1.5-2.6-2.9C5.5 16.4 4.5 15 4.5 13.3c0-1.2.5-2.3 1.4-3 .1-1.4 1-2.6 2.3-3.1.8-.3 1.6-.2 2.3.1C11 6.2 11.5 5 12 5z"/></svg>'
  };
  SVG.cohere=SVG.north;

  function injectCSS(){
    if(document.getElementById("rd-fix642-css"))return;
    var s=document.createElement("style");s.id="rd-fix642-css";
    s.textContent=".msg-avatar,.chip-avatar,.model-avatar{background:transparent!important;overflow:hidden;border-radius:50%!important}.msg-avatar svg,.chip-avatar svg{display:block;width:100%;height:100%}#rd-version-badge{font-size:11px;color:#888;margin-top:8px;padding:6px 0;border-top:1px solid #2a2a34}#rd-version-badge b{color:#a89cff}#rd-nvidia-key-group label span{color:#76B900;font-size:11px}";
    document.head.appendChild(s);
  }

  function recolorAvatars(){
    try{
      document.querySelectorAll(".msg-avatar, .chip-avatar, [class*='avatar']").forEach(function(el){
        var label=(el.getAttribute("title")||el.getAttribute("aria-label")||el.textContent||"").toLowerCase();
        var parentTxt=((el.closest(".msg")||el.parentElement||{}).textContent||"").slice(0,120).toLowerCase();
        var t=label+" "+parentTxt;
        var svg=null;
        if(/grok/.test(t))svg=SVG.grok;
        else if(/north|cohere/.test(t))svg=SVG.north;
        else if(/gemini|gemma/.test(t))svg=SVG.gemini;
        else if(/claude|sonnet|haiku|opus/.test(t))svg=SVG.claude;
        else if(/kimi|moonshot/.test(t))svg=SVG.kimi;
        else if(/qwen/.test(t))svg=SVG.qwen;
        else if(/nvidia|nemotron|glm/.test(t))svg=SVG.nvidia;
        else if(/gpt|openai/.test(t))svg=SVG.gpt;
        if(svg){
          var cur=el.innerHTML||"";
          if(!el.querySelector("svg")||/#1a7f64|#22c55e|currentColor|green/i.test(cur)||cur.length<40)el.innerHTML=svg;
        }
      });
    }catch(e){}
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
    if(window.__rdFetch642)return;window.__rdFetch642=true;
    var orig=window.fetch;
    window.fetch=function(input,init){
      try{
        var url=typeof input==="string"?input:(input&&input.url)||"";
        if(/integrate\.api\.nvidia\.com/i.test(url))
          return Promise.reject(new Error("CORS: pakai proxy. Hard refresh RD."));
        if(/openrouter\.ai/i.test(url)&&init&&init.body&&typeof init.body==="string"){
          var body=JSON.parse(init.body);
          if(body&&body.model){
            var m=String(body.model);
            if(/^moonshotai\/|^z-ai\/|^deepseek-ai\//i.test(m))
              return Promise.reject(new Error("Model "+m+" harus lewat NVIDIA proxy (family Kimi/GLM + key)."));
            var m2=remap(m);if(m2!==m){body.model=m2;init=Object.assign({},init,{body:JSON.stringify(body)})}
          }
        }
      }catch(e){if(e&&/harus lewat NVIDIA|CORS/i.test(String(e.message||e)))return Promise.reject(e)}
      return orig.apply(this,arguments);
    };
  }

  function patchCall(){
    if(typeof window.callModel!=="function"||window.callModel.__rdFix642)return;
    var prev=window.callModel;
    window.callModel=async function(messages){
      ensureNvInState();
      var fam=(document.getElementById("familySelect")||{}).value||"";
      var model=(document.getElementById("modelSelect")||{}).value||"";
      if(window.state&&state.selectedModel)model=state.selectedModel||model;
      model=remap(model);
      var key=nvKey();
      if(needsNv(model,fam)){
        if(!key)throw new Error("NVIDIA API Key kosong — isi di Settings (disimpan di rd_nvidia_key).");
        var temp=0.7,maxTok=1024;
        try{temp=parseFloat((state.settings&&state.settings.temperature)||0.7);maxTok=parseInt((state.settings&&state.settings.maxTokens)||1024,10)}catch(e0){}
        if(typeof injectPersona==="function"){try{messages=injectPersona(typeof normalizeMessages==="function"?normalizeMessages(messages):messages)}catch(e1){}}
        return await callNv(messages,model,key,temp,maxTok);
      }
      try{var ms=document.getElementById("modelSelect");if(ms&&ms.value){var fx=remap(ms.value);if(fx!==ms.value){ms.value=fx;if(window.state)state.selectedModel=fx}}}catch(e2){}
      return prev.apply(this,arguments);
    };
    window.callModel.__rdFix642=true;
  }

  function injectVer(){
    var body=document.querySelector("#settingsModal .modal-body");if(!body)return;
    var el=document.getElementById("rd-version-badge");
    if(!el){el=document.createElement("div");el.id="rd-version-badge";body.appendChild(el)}
    el.innerHTML="RolxDesk <b>v"+RD_VERSION+"</b> · NVIDIA key persistent · proxy openai-compat";
  }

  function boot(){
    injectCSS();patchSaveLoad();ensureNvInState();ensureNvidiaInput();
    patchCatalog();injectFam();patchFetch();patchCall();injectVer();recolorAvatars();
    try{if(typeof populateModels==="function")populateModels()}catch(e){}
  }

  setTimeout(boot,200);setTimeout(boot,800);
  setTimeout(function(){boot();recolorAvatars()},2000);
  setTimeout(function(){boot();recolorAvatars()},4000);

  try{
    var chat=document.querySelector("#chatBox,.chat-messages,#messages");
    if(chat)new MutationObserver(function(){recolorAvatars()}).observe(chat,{childList:true,subtree:true});
  }catch(e){}

  var modal=document.getElementById("settingsModal");
  if(modal&&!modal.__rdVer642){
    modal.__rdVer642=true;
    new MutationObserver(function(){
      if(modal.classList.contains("open")){injectVer();ensureNvidiaInput();ensureNvInState()}
    }).observe(modal,{attributes:true,attributeFilter:["class"]});
  }
})();
