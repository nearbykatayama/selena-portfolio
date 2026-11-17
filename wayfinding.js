/* Mapa de orientação e demonstração de localização. Nenhuma coordenada real é coletada. */
(() => {
  'use strict';
  if (window.__SELENA_WAYFINDING_R3__) return;
  window.__SELENA_WAYFINDING_R3__ = true;
  const data=window.SelenaMapData;
  if (!data) {
    console.error('[Selena R3] Dados do mapa não foram carregados.');
    return;
  }
  const NS='http://www.w3.org/2000/svg';
  const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;};
  const svgEl=(tag,attrs={})=>{const e=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));return e;};
  const dialog=el('dialog','wayfinding-dialog');
  dialog.id='journey-map-dialog';dialog.setAttribute('aria-labelledby','wayfinding-title');
  dialog.innerHTML=`<header class="wayfinding-header"><div><p class="section-kicker">Selena · orientação no escritório</p><h2 id="wayfinding-title">Como chegar à sala</h2><p class="wayfinding-address"></p></div><button class="button button-outline" type="button" data-wf-close aria-label="Fechar mapa e orientações">Fechar ×</button></header>
    <div class="wayfinding-selectors"><div role="group" aria-label="Unidade do mapa"><button type="button" data-wf-unit="londrina" aria-pressed="true">Londrina</button><button type="button" data-wf-unit="sao-paulo" aria-pressed="false">São Paulo</button></div><div role="group" aria-label="Destino"><button type="button" data-wf-dest="massage" aria-pressed="true">Massoterapia</button><button type="button" data-wf-dest="health" aria-pressed="false">Espaço Saúde</button></div></div>
    <div class="wayfinding-pending" hidden><h3>São Paulo · localização em confirmação</h3><p>O mapa dessa unidade será incluído após a confirmação da sala e do percurso. Consulte a recepção.</p></div>
    <div class="wayfinding-content"><div class="wayfinding-map-column"><div class="wayfinding-mode"><span class="wf-mode-label">Percurso de referência</span><span>Planta completa · arraste para explorar</span></div><div class="wayfinding-canvas" role="group" aria-label="Mapa interativo da unidade Londrina"><svg tabindex="0" role="img" aria-labelledby="wf-svg-title wf-svg-desc"><title id="wf-svg-title">Planta de Londrina com o percurso selecionado</title><desc id="wf-svg-desc">Use os botões de zoom ou as teclas mais e menos. Use as setas para mover o mapa. No celular, arraste e use dois dedos para ampliar. A lista de orientações descreve o mesmo percurso.</desc></svg><div class="wayfinding-map-tools"><button type="button" data-wf-zoom="1" aria-label="Ampliar mapa">＋</button><button type="button" data-wf-zoom="-1" aria-label="Reduzir mapa">−</button><button type="button" data-wf-focus>Focar sala</button><button type="button" data-wf-fit>Planta inteira</button></div><div class="wayfinding-legend"><span><i class="wf-route-key"></i>Percurso</span><span><i class="wf-destination-key"></i>Destino</span><span class="wf-sim-key" hidden><i></i>Posição simulada</span></div></div><p class="wayfinding-map-help">Arraste para mover · dois dedos ou +/− para ampliar. Banheiro com acesso somente por dentro da massoterapia.</p></div>
    <aside class="wayfinding-guide"><div class="wayfinding-selena"><img src="assets/selena-mascote-joinha-sem-pernas.png" alt="" onerror="this.hidden=true"><div><span>Selena te acompanha</span><strong class="wf-destination-name"></strong></div></div><p class="wayfinding-demo-disclaimer">Protótipo: o modo demonstrativo usa uma posição simulada. Não acessa GPS, Wi-Fi ou localização do aparelho.</p><label class="wayfinding-voice"><input type="checkbox" id="wf-voice"> Ouvir a Selena</label><button type="button" class="button button-primary" data-wf-demo>Demonstrar percurso</button><div class="wayfinding-progress" hidden><div class="wf-progress-track"><span></span></div><p class="wf-progress-label"></p><div class="wayfinding-play-controls"><button type="button" class="button button-outline" data-wf-pause>Pausar</button><button type="button" class="button button-outline" data-wf-next>Próxima etapa</button><button type="button" class="button button-outline" data-wf-reset>Reiniciar</button></div></div><p class="wayfinding-live-instruction" role="status" aria-live="polite"></p><details class="wayfinding-directions"><summary>Ver todas as orientações em texto</summary><ol></ol></details><p class="wayfinding-validation">Percurso ilustrativo baseado na planta enviada. Precisa de validação presencial de acesso, obstáculos e acessibilidade antes do uso para orientação real.</p></aside></div>`;
  document.body.append(dialog);
  const $=(s)=>dialog.querySelector(s);
  // Reutiliza um mascote existente sem alterar os arquivos ou proporções das logos.
  const mascot=document.querySelector('.site-help-launcher img, #site-help-launcher img, .selena-avatar img, .selena-mark img');
  if(mascot) $('.wayfinding-selena img').src=mascot.getAttribute('src');
  const svg=$('svg');
  const plan=svgEl('image',{href:data.image,width:1496,height:433,transform:'translate(433 0) rotate(90)',class:'wf-plan-image'});svg.append(plan);
  const zones=svgEl('g',{class:'wf-zones'});
  data.rooms.forEach((room)=>zones.append(svgEl('rect',{x:room.x,y:room.y,width:room.w,height:room.h,rx:2,fill:room.color,'data-room':room.id})));svg.append(zones);
  const fullPath=svgEl('polyline',{class:'wf-route-base',fill:'none'}), donePath=svgEl('polyline',{class:'wf-route-done',fill:'none'});
  svg.append(fullPath,donePath);
  const start=svgEl('g',{class:'wf-start'});start.append(svgEl('circle',{r:4}),svgEl('text',{x:-5,y:-10,'text-anchor':'end'}));start.lastChild.textContent='Recepção · partida';svg.append(start);
  const destination=svgEl('g',{class:'wf-dest-marker'});destination.append(svgEl('circle',{r:5}),svgEl('circle',{r:2,fill:'#fff'}));svg.append(destination);
  const destLabel=svgEl('text',{class:'wf-place-label',x:100,y:1207});svg.append(destLabel);
  const marker=svgEl('g',{class:'wf-you-marker',visibility:'hidden'});
  marker.append(svgEl('circle',{r:9,class:'wf-you-halo'}),svgEl('circle',{r:4,class:'wf-you-dot'}),svgEl('text',{x:12,y:-10}));marker.lastChild.textContent='Você está aqui · simulação';svg.append(marker);
  let routeKey='massage',unit='londrina',route=data.routes.massage;
  let view={x:0,y:0,w:433,h:1496}, sim=false,playing=false,step=0,segment=0,frame=0,run=0,returnFocus=null;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointText=(points)=>points.map((p)=>p.join(',')).join(' ');
  const interpolate=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
  function applyView(){svg.setAttribute('viewBox',[view.x,view.y,view.w,view.h].join(' '));}
  function setView(cx,cy,height){
    const rect=svg.getBoundingClientRect(), ratio=(rect.width||600)/(rect.height||540);
    const h=Math.min(1750,Math.max(130,height)),w=h*ratio;
    view={x:Math.max(-w*.4,Math.min(433-w*.6,cx-w/2)),y:Math.max(-80,Math.min(1496-h+80,cy-h/2)),w,h};applyView();
  }
  function focusDestination(){
    const [cx,cy,h]=route.focus,last=route.points.at(-1);
    if(svg.clientWidth<500)setView(last[0]+34,last[1]+12,240);
    else setView(cx,cy,h);
  }
  function fit(){setView(216.5,748,Math.max(1496,433/Math.max(.3,svg.clientWidth/svg.clientHeight)));}
  function stopVoice(){window.SelenaVoice?.stop();}
  function stop(){playing=false;run++;cancelAnimationFrame(frame);stopVoice();}
  function moveMarker(point){
    marker.setAttribute('transform','translate('+point.join(' ')+')');
    if(sim && playing && svg.clientWidth<500)setView(point[0],point[1],260);
  }
  function updateProgress(){
    const pct=Math.min(100,Math.round((step+segment)/(route.points.length-1)*100));
    $('.wf-progress-track span').style.width=pct+'%';
    $('.wf-progress-label').textContent=(pct===100?'Destino alcançado':('Etapa '+Math.min(step+1,route.steps.length)+' de '+route.steps.length))+' · localização simulada';
    donePath.setAttribute('points',pointText([...route.points.slice(0,step+1),interpolate(route.points[step],route.points[Math.min(step+1,route.points.length-1)],segment)]));
  }
  function say(text,onEnd){
    if(!$('#wf-voice').checked){onEnd?.();return;}
    if(window.SelenaVoice) window.SelenaVoice.speak(text,onEnd); else onEnd?.();
  }
  function instruction(text){$('.wayfinding-live-instruction').textContent=text;}
  function renderRoute(){
    stop();sim=false;step=0;segment=0;route=data.routes[routeKey];
    fullPath.setAttribute('points',pointText(route.points));donePath.setAttribute('points','');
    const first=route.points[0],last=route.points.at(-1);
    start.setAttribute('transform','translate('+first.join(' ')+')');
    destination.setAttribute('transform','translate('+last.join(' ')+')');
    destLabel.setAttribute('y',last[1]-14);destLabel.setAttribute('x',last[0]+4);destLabel.textContent=route.short;
    marker.setAttribute('visibility','hidden');
    dialog.classList.remove('wf-simulation');
    $('.wf-mode-label').textContent='Percurso de referência';$('.wf-sim-key').hidden=true;
    $('.wayfinding-progress').hidden=true;$('[data-wf-demo]').textContent='Demonstrar percurso';
    $('.wf-destination-name').textContent=route.title;
    $('.wayfinding-address').textContent=unit==='londrina'?data.address:'Unidade São Paulo · mapa em confirmação';
    $('[data-wf-pause]').textContent='Pausar';
    const list=$('.wayfinding-directions ol');list.replaceChildren();
    route.steps.forEach((text)=>list.append(el('li','',text)));
    instruction('Percurso de referência a partir da recepção. Ative a demonstração para visualizar a proposta de localização interna.');
    dialog.querySelectorAll('[data-wf-dest]').forEach((b)=>b.setAttribute('aria-pressed',String(b.dataset.wfDest===routeKey)));
    dialog.querySelectorAll('[data-wf-unit]').forEach((b)=>b.setAttribute('aria-pressed',String(b.dataset.wfUnit===unit)));
    $('.wayfinding-pending').hidden=unit!=='sao-paulo';$('.wayfinding-content').hidden=unit==='sao-paulo';
    if(unit==='londrina' && dialog.open)requestAnimationFrame(focusDestination);
  }
  function playSegment(){
    if(!playing || !sim)return;
    const token=++run;let audioDone=!$('#wf-voice').checked,moveDone=false;
    instruction(route.steps[step]);
    function advance(){if(token!==run || !playing || !moveDone || !audioDone)return;
      step++;segment=0;updateProgress();
      if(step>=route.points.length-1){playing=false;instruction('Você chegou ao destino · demonstração concluída. Este marcador não representa sua posição real.');$('[data-wf-pause]').textContent='Concluído';say('Demonstração concluída. Você chegou ao destino.');return;}
      playSegment();
    }
    say(route.steps[step],()=>{audioDone=true;advance();});
    const begin=performance.now(),from=segment;
    const duration=reduced.matches?0:Math.max(400,3200*(1-from));
    function animate(now){
      if(token!==run || !playing)return;
      const t=duration?Math.min(1,(now-begin)/duration):1;segment=from+(1-from)*t;
      const point=interpolate(route.points[step],route.points[step+1],segment);moveMarker(point);updateProgress();
      if(t===1){moveDone=true;advance();}else frame=requestAnimationFrame(animate);
    }
    frame=requestAnimationFrame(animate);
  }
  function beginDemo(){
    stop();sim=true;playing=true;step=0;segment=0;
    marker.setAttribute('visibility','visible');moveMarker(route.points[0]);dialog.classList.add('wf-simulation');
    $('.wf-mode-label').textContent='Demonstração · localização simulada';$('.wf-sim-key').hidden=false;
    $('.wayfinding-progress').hidden=false;$('[data-wf-demo]').textContent='Começar de novo';$('[data-wf-pause]').textContent='Pausar';
    setView(218,1280,420);playSegment();
  }
  function open({destination:target='massage',unit:targetUnit='londrina'}={}){
    if(location.hash.split('?')[0]==='#/massoterapeuta')return;
    returnFocus=document.activeElement;routeKey=target==='health'?'health':'massage';unit=targetUnit==='sao-paulo'?'sao-paulo':'londrina';
    renderRoute();if(!dialog.open)dialog.showModal();requestAnimationFrame(focusDestination);$('[data-wf-close]').focus();
  }
  $('[data-wf-close]').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{stop();returnFocus?.focus?.();});
  window.addEventListener('hashchange',()=>{if(dialog.open)dialog.close();});
  dialog.querySelectorAll('[data-wf-dest]').forEach((b)=>b.addEventListener('click',()=>{routeKey=b.dataset.wfDest;renderRoute();}));
  dialog.querySelectorAll('[data-wf-unit]').forEach((b)=>b.addEventListener('click',()=>{unit=b.dataset.wfUnit;renderRoute();}));
  $('[data-wf-demo]').addEventListener('click',beginDemo);
  $('[data-wf-reset]').addEventListener('click',beginDemo);
  $('[data-wf-pause]').addEventListener('click',()=>{
    if(step>=route.points.length-1)return;
    if(playing){stop();$('[data-wf-pause]').textContent='Continuar';}
    else{playing=true;$('[data-wf-pause]').textContent='Pausar';playSegment();}
  });
  $('[data-wf-next]').addEventListener('click',()=>{
    stop();if(step<route.points.length-1)step++;segment=0;moveMarker(route.points[step]);updateProgress();
    if(step<route.steps.length){instruction(route.steps[step]);$('[data-wf-pause]').textContent='Continuar';say(route.steps[step]);}
    else{instruction('Destino alcançado · posição simulada.');$('[data-wf-pause]').textContent='Concluído';}
  });
  $('#wf-voice').addEventListener('change',()=>{if(!$('#wf-voice').checked){stopVoice();if(playing){stop();playing=true;playSegment();}}else if(!playing)say($('.wayfinding-live-instruction').textContent);});
  $('[data-wf-focus]').addEventListener('click',focusDestination);$('[data-wf-fit]').addEventListener('click',fit);
  function zoom(factor,client){
    if(playing){stop();$('[data-wf-pause]').textContent='Continuar';}
    const rect=svg.getBoundingClientRect(),nx=client?(client[0]-rect.left)/rect.width:.5,ny=client?(client[1]-rect.top)/rect.height:.5;
    const anchor=[view.x+view.w*nx,view.y+view.h*ny],h=Math.min(1750,Math.max(130,view.h*factor)),w=h*rect.width/rect.height;
    setView(anchor[0]+w*(.5-nx),anchor[1]+h*(.5-ny),h);
  }
  dialog.querySelectorAll('[data-wf-zoom]').forEach((b)=>b.addEventListener('click',()=>zoom(b.dataset.wfZoom==='1'?.78:1.28)));
  svg.addEventListener('wheel',(e)=>{e.preventDefault();zoom(e.deltaY<0?.88:1.14,[e.clientX,e.clientY]);},{passive:false});
  const pointers=new Map();let pinch=0;
  svg.addEventListener('pointerdown',(e)=>{if(playing){stop();$('[data-wf-pause]').textContent='Continuar';}pointers.set(e.pointerId,[e.clientX,e.clientY]);svg.setPointerCapture(e.pointerId);svg.classList.add('dragging');pinch=0;});
  svg.addEventListener('pointermove',(e)=>{
    const previous=pointers.get(e.pointerId);if(!previous)return;
    pointers.set(e.pointerId,[e.clientX,e.clientY]);const points=[...pointers.values()];
    if(points.length===2){const distance=Math.hypot(points[0][0]-points[1][0],points[0][1]-points[1][1]);if(pinch)zoom(pinch/distance,[(points[0][0]+points[1][0])/2,(points[0][1]+points[1][1])/2]);pinch=distance;}
    else{const rect=svg.getBoundingClientRect();setView(view.x+view.w/2-(e.clientX-previous[0])*view.w/rect.width,view.y+view.h/2-(e.clientY-previous[1])*view.h/rect.height,view.h);}
  });
  function release(e){pointers.delete(e.pointerId);pinch=0;if(!pointers.size)svg.classList.remove('dragging');}
  svg.addEventListener('pointerup',release);svg.addEventListener('pointercancel',release);svg.addEventListener('lostpointercapture',release);
  svg.addEventListener('keydown',(e)=>{
    if(['+','=','-'].includes(e.key)){e.preventDefault();zoom(e.key==='-'?1.28:.78);return;}
    const delta={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[e.key];
    if(delta){e.preventDefault();setView(view.x+view.w/2+delta[0]*view.w*.12,view.y+view.h/2+delta[1]*view.h*.12,view.h);}
  });
  window.addEventListener('resize',()=>{if(dialog.open)setView(view.x+view.w/2,view.y+view.h/2,view.h);});
  document.addEventListener('click',(e)=>{const b=e.target.closest('[data-open-wayfinding]');if(b)open({unit:b.dataset.openWayfinding,destination:b.dataset.wayfindingDestination});});
  // Ponto de acesso preservado para botões das reservas existentes.
  window.SelenaJourney={openMap:(unit='londrina')=>open({unit})};
  window.SelenaWayfinding={open};
})();
