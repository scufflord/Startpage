// ---------------- Clock & Greeting ----------------
function updateClock(){
  const el = document.getElementById("clock");
  if(el) el.textContent = new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
}
setInterval(updateClock,1000); updateClock();

function updateGreeting(){
  const el = document.getElementById("greeting");
  if(!el) return;
  const h=new Date().getHours(); let msg="Welcome";
  if(h<12) msg="Good morning, sir 🌅"; else if(h<18) msg="Good afternoon, sir ☀️"; else msg="Good evening, sir 🌙";
  el.textContent=msg;
}
updateGreeting();

// ---------------- Weather ----------------
async function loadWeather(){
  try{
    const res=await fetch("https://api.open-meteo.com/v1/forecast?latitude=35.1401&longitude=-93.9216&hourly=temperature_2m,weather_code,precipitation_probability");
    const data=await res.json();
    const temp=data.hourly.temperature_2m[0]; const precip=data.hourly.precipitation_probability[0]; const code=data.hourly.weather_code[0];
    const descs={0:"Clear sky",1:"Mostly clear",2:"Partly cloudy",3:"Overcast",45:"Foggy",48:"Rime fog",51:"Light drizzle",53:"Drizzle",55:"Heavy drizzle",61:"Light rain",63:"Rain",65:"Heavy rain",71:"Light snow",73:"Snow",75:"Heavy snow",95:"Thunderstorm"};
    const wEl = document.getElementById("weather");
    if(wEl) wEl.textContent = `${descs[code]||"Weather"} • ${Math.round((temp*9/5)+32)}°F (${Math.round(temp)}°C) • ${precip}% rain`;
  } catch(e){ const wEl = document.getElementById("weather"); if(wEl) wEl.textContent="Weather unavailable"; }
}
loadWeather();

// ---------------- Themes ----------------
const colorSchemes={gruvbox:{'--bg':'#282828','--fg':'#ebdbb2','--accent':'#d79921','--secondary':'#504945','--bookmark-bg':'rgba(235,219,178,0.08)','--bookmark-hover-bg':'rgba(235,219,178,0.18)'},
darkOcean:{'--bg':'#0f2027','--fg':'#a7c7e7','--accent':'#00bcd4','--secondary':'#1c3b50','--bookmark-bg':'rgba(167,199,231,0.08)','--bookmark-hover-bg':'rgba(167,199,231,0.18)'},
solarized:{'--bg':'#002b36','--fg':'#839496','--accent':'#b58900','--secondary':'#073642','--bookmark-bg':'rgba(131,148,150,0.08)','--bookmark-hover-bg':'rgba(131,148,150,0.18)'},
catppuccinMocha:{'--bg':'#1e1e2e','--fg':'#cdd6f4','--accent':'#f5c2e7','--secondary':'#313244','--bookmark-bg':'rgba(205,214,244,0.08)','--bookmark-hover-bg':'rgba(205,214,244,0.18)'},
catppuccinLatte:{'--bg':'#fbf1c7','--fg':'#575268','--accent':'#d7827e','--secondary':'#f2d5cf','--bookmark-bg':'rgba(87,82,104,0.08)','--bookmark-hover-bg':'rgba(87,82,104,0.18)'},
catppuccinFrappe:{'--bg':'#303446','--fg':'#c6d0f5','--accent':'#f2cdcd','--secondary':'#5b6078','--bookmark-bg':'rgba(198,208,245,0.08)','--bookmark-hover-bg':'rgba(198,208,245,0.18)'}};
const themeSelector=document.getElementById('themeSelector');
const savedTheme=localStorage.getItem('selectedTheme');
if(themeSelector){
  if(savedTheme && colorSchemes[savedTheme]){
    for(let v in colorSchemes[savedTheme]) document.documentElement.style.setProperty(v,colorSchemes[savedTheme][v]);
    themeSelector.value=savedTheme;
  }
  themeSelector.addEventListener('change', e=>{
    const s=e.target.value;
    if(colorSchemes[s]){
      for(let v in colorSchemes[s]) document.documentElement.style.setProperty(v,colorSchemes[s][v]);
      localStorage.setItem('selectedTheme', s);
      updateDynamicTextColors();
    }
  });
}

// ---------------- Bookmarks ----------------
let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [
  {name:"YouTube", url:"https://www.youtube.com"},
  {name:"Reddit", url:"https://www.reddit.com"},
  {name:"GitHub", url:"https://github.com"},
  {name:"Twitter", url:"https://twitter.com"},
  {name:"Twitch", url:"https://www.twitch.tv"},
  {name:"OpenAI", url:"https://openai.com"},
  {name:"Gmail", url:"https://gmail.com"}
];
function getFavicon(url){try{const domain=new URL(url).origin; return `https://www.google.com/s2/favicons?sz=64&domain_url=${domain}`;}catch(e){return '';} }

const bookmarksGrid=document.querySelector('.bookmarks-grid');
const bookmarkEditor=document.getElementById('bookmarkEditor');
const configModal=document.getElementById('configModal');
const configButton=document.getElementById('configButton');
const addBookmark=document.getElementById('addBookmark');
const saveBookmarks=document.getElementById('saveBookmarks');
const closeConfig=document.getElementById('closeConfig');
const previewGrid=document.getElementById('previewGrid');
const bgInput=document.getElementById('backgroundInput');
const saveBg=document.getElementById('saveBackground');

function normalizeUrl(input){
  if(!input) return null;
  const trimmed = input.trim();
  try{ new URL(trimmed); return trimmed; }catch(e){
    try{ const withProto = 'https://' + trimmed; new URL(withProto); return withProto; }catch(e){ return null; }
  }
}

function renderBookmarks(){
  if(!bookmarksGrid) return;
  bookmarksGrid.innerHTML='';
  bookmarks.forEach(b=>{
    const a=document.createElement('a');
    a.href=b.url; a.className='bm'; a.setAttribute('target','_blank'); a.setAttribute('rel','noopener noreferrer');
    const img = document.createElement('img'); img.src = getFavicon(b.url); img.alt = b.name;
    a.appendChild(img);
    a.appendChild(document.createTextNode(b.name));
    bookmarksGrid.appendChild(a);
  });
  updateDynamicTextColors();
}

function renderEditor(){
  if(!bookmarkEditor) return;
  bookmarkEditor.innerHTML='';
  bookmarks.forEach((b,i)=>{
    const row=document.createElement('div');
    const nameInput = document.createElement('input');
    nameInput.type='text'; nameInput.value = b.name; nameInput.placeholder='Name'; nameInput.dataset.index = i; nameInput.className='edit-name';

    const urlInput = document.createElement('input');
    urlInput.type='text'; urlInput.value = b.url; urlInput.placeholder='URL'; urlInput.dataset.index = i; urlInput.className='edit-url';

    const select = document.createElement('select'); select.dataset.index = i; select.className='positionSelect';
    for(let idx=0; idx<bookmarks.length; idx++){
      const opt = document.createElement('option'); opt.value = String(idx); opt.textContent = String(idx+1);
      if(idx===i) opt.selected = true; select.appendChild(opt);
    }

    const del = document.createElement('button'); del.dataset.index = i; del.className='deleteBookmark'; del.type = 'button'; del.textContent = 'Delete';

    row.appendChild(nameInput); row.appendChild(urlInput); row.appendChild(select); row.appendChild(del);
    bookmarkEditor.appendChild(row);
  });
  renderPreview();
}

function renderPreview(){
  if(!previewGrid) return;
  previewGrid.innerHTML='';
  bookmarks.forEach((b,i)=>{
    const a=document.createElement('div');
    a.className='bm';
    const img = document.createElement('img'); img.src = getFavicon(b.url); img.alt = b.name;
    a.appendChild(img); a.appendChild(document.createTextNode(b.name));
    previewGrid.appendChild(a);
  });
}

// ---------------- Modal + Accessibility (focus trap, Esc to close) ----------------
let _previouslyFocused = null;
const _focusableSelectors = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function _getFocusable(el){
  return Array.from(el.querySelectorAll(_focusableSelectors)).filter(e => e.offsetParent !== null);
}

function openConfigModal(){
  renderEditor();
  if(!configModal) return;
  _previouslyFocused = document.activeElement;
  configModal.classList.add('show');
  configModal.setAttribute('aria-hidden','false');
  if(configButton) configButton.setAttribute('aria-expanded','true');

  const focusables = _getFocusable(configModal);
  if(focusables.length) focusables[0].focus();

  document.addEventListener('keydown', _handleKeydown);
}

function closeConfigModal(){
  if(!configModal) return;
  configModal.classList.remove('show');
  configModal.setAttribute('aria-hidden','true');
  if(configButton) configButton.setAttribute('aria-expanded','false');
  document.removeEventListener('keydown', _handleKeydown);
  if(_previouslyFocused && typeof _previouslyFocused.focus === 'function') _previouslyFocused.focus();
}

function _handleKeydown(e){
  if(!configModal || !configModal.classList.contains('show')) return;
  if(e.key === 'Escape'){
    e.preventDefault();
    closeConfigModal();
    return;
  }
  if(e.key === 'Tab'){
    const focusables = _getFocusable(configModal);
    if(!focusables.length) return;
    const idx = focusables.indexOf(document.activeElement);
    if(e.shiftKey){
      if(idx === 0){ focusables[focusables.length-1].focus(); e.preventDefault(); }
    } else {
      if(idx === focusables.length-1){ focusables[0].focus(); e.preventDefault(); }
    }
  }
}

if(configButton){
  configButton.addEventListener('click',()=>{ openConfigModal(); });
}
if(closeConfig){
  closeConfig.addEventListener('click',()=>{ closeConfigModal(); });
}

// ---------------- Bookmark actions ----------------
if(addBookmark){ addBookmark.addEventListener('click',()=>{bookmarks.push({name:"New", url:"https://"}); renderEditor();}); }
if(saveBookmarks){ saveBookmarks.addEventListener('click',()=>{
  const names=document.querySelectorAll('.edit-name');
  const urls=document.querySelectorAll('.edit-url');
  const positions=document.querySelectorAll('.positionSelect');
  const newArr=Array.from({length:bookmarks.length},()=>null);
  const invalids = [];
  for(let i=0;i<bookmarks.length;i++){
    const rawName = names[i].value.trim();
    const rawUrl = urls[i].value.trim();
    const normalized = normalizeUrl(rawUrl);
    if(rawUrl && !normalized){ invalids.push(i+1); }
    const b={name: rawName || `Bookmark ${i+1}`, url: normalized || ''}; const pos=parseInt(positions[i].value);
    newArr[pos]=b;
  }
  if(invalids.length){ alert('Invalid URL for bookmark positions: ' + invalids.join(', ') + '. Please fix before saving.'); return; }
  bookmarks=newArr.filter(Boolean);
  localStorage.setItem('bookmarks',JSON.stringify(bookmarks));
  renderBookmarks(); renderEditor();
}); }

if(bookmarkEditor){
  bookmarkEditor.addEventListener('click', e=>{
    if(e.target.classList.contains('deleteBookmark')){
      bookmarks.splice(e.target.dataset.index,1); renderEditor();
    }
  });
  bookmarkEditor.addEventListener('change', e=>{if(e.target.classList.contains('positionSelect')) renderPreview();});
}

// ---------------- Background ----------------
const savedBg=localStorage.getItem('backgroundURL');
if(savedBg) document.body.style.backgroundImage=`url('${savedBg}')`;
if(saveBg){ saveBg.addEventListener('click',()=>{
  const urlRaw = bgInput.value.trim();
  if(!urlRaw){ document.body.style.backgroundImage=''; localStorage.removeItem('backgroundURL'); updateDynamicTextColors(); return; }
  const normalized = normalizeUrl(urlRaw);
  if(!normalized){ alert('Background URL appears invalid. Please provide a valid URL.'); return; }
  document.body.style.backgroundImage = `url('${normalized}')`; localStorage.setItem('backgroundURL', normalized); updateDynamicTextColors();
}); }

// ---------------- Custom theme editor ----------------
document.querySelectorAll('#themeEditor input').forEach(input=>{
  input.addEventListener('input',e=>{
    const v=e.target.dataset.var; document.documentElement.style.setProperty(v,e.target.value);
    localStorage.setItem('customTheme',JSON.stringify({...JSON.parse(localStorage.getItem('customTheme')||'{}'),[v]:e.target.value}));
    updateDynamicTextColors();
  });
});
const savedCustom=JSON.parse(localStorage.getItem('customTheme')||'{}'); for(let v in savedCustom) document.documentElement.style.setProperty(v,savedCustom[v]);

// ---------------- Dynamic Text Color ----------------
function getLuminance(r,g,b){
  const a=[r,g,b].map(v=>{
    v/=255;
    return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4);
  });
  return 0.2126*a[0]+0.7152*a[1]+0.0722*a[2];
}

function updateDynamicTextColors(){
  let bgColor = getComputedStyle(document.body).backgroundColor;
  if(document.body.style.backgroundImage && document.body.style.backgroundImage!=='none'){
    const tc = document.querySelector('.translucent-container');
    if(tc) bgColor = getComputedStyle(tc).backgroundColor;
  }
  const rgb = bgColor.match(/\d+/g)?.map(Number) || [40,40,40];
  const lum = getLuminance(rgb[0], rgb[1], rgb[2]);
  const color = lum>0.5 ? '#1a1a1a' : '#ebdbb2';
  
  document.body.style.color = color;
  document.querySelectorAll('.bm').forEach(b=>b.style.color=color);
  document.querySelectorAll('input, select, button').forEach(el=>el.style.color=color);
}

// Initial render
renderBookmarks();
updateDynamicTextColors();
