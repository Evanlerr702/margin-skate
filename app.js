// Events change state; the animation loop gradually turns state into movement.
const $=id=>document.getElementById(id), canvas=$('scene'),ctx=canvas.getContext('2d');
const state={mood:'cheer',intensity:55,confidence:50,paused:false,time:0};
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const hints={cheer:'A little belief from the sidelines.',quiet:'Room to breathe. Space to try.',boo:'Words have weight. Watch the hesitation.'};
function trickTier(mood,intensity){return mood!=='cheer'?0:intensity>=100?3:intensity>=80?2:intensity>=60?1:0;}
function crowdCount(intensity){return Math.round(intensity*.4);}
let audioContext,master,soundEnabled=false,soundTimer;
function updateCrowd(){const count=crowdCount(state.intensity);$('volume').textContent=state.intensity+'% · '+count+' people';$('intensity').setAttribute('aria-valuetext',count+' people');canvas.setAttribute('aria-label','A skateboarder and '+count+' spectators reacting with '+state.mood);render();}
function soundLabel(){ $('sound').textContent=soundEnabled?'Sound on · mute':'Enable sound';$('sound').setAttribute('aria-pressed',String(soundEnabled));}
async function enableSound(){
 try {const AudioAPI=window.AudioContext||window.webkitAudioContext;if(!AudioAPI){$('sound').textContent='Audio unavailable';return;}
 if(!audioContext){audioContext=new AudioAPI();master=audioContext.createGain();master.connect(audioContext.destination);master.gain.value=.65;}
 await audioContext.resume();soundEnabled=true;soundLabel();if(!soundTimer)soundTimer=setInterval(crowdSound,300);crowdSound();
 }catch(error){$('sound').textContent='Retry sound';}
}
let beat=0;
function tone(frequency,start,duration,level,type='sine',endFrequency=frequency){
 const voice=audioContext.createOscillator(),envelope=audioContext.createGain();voice.type=type;voice.frequency.setValueAtTime(frequency,start);voice.frequency.exponentialRampToValueAtTime(endFrequency,start+duration*.65);envelope.gain.setValueAtTime(0,start);envelope.gain.linearRampToValueAtTime(level,start+.018);envelope.gain.exponentialRampToValueAtTime(.0001,start+duration);voice.connect(envelope);envelope.connect(master);voice.start(start);voice.stop(start+duration+.02);voice.onended=()=>{voice.disconnect();envelope.disconnect();};
}
function clap(start,strength,quiet=false){
 const duration=.14,buffer=audioContext.createBuffer(1,Math.ceil(audioContext.sampleRate*duration),audioContext.sampleRate),data=buffer.getChannelData(0);
 for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/data.length*8);
 const noise=audioContext.createBufferSource(),filter=audioContext.createBiquadFilter(),gain=audioContext.createGain();noise.buffer=buffer;filter.type='bandpass';filter.frequency.value=quiet?500:1300;filter.Q.value=.7;gain.gain.value=strength*(quiet?.025:.22);noise.connect(filter);filter.connect(gain);gain.connect(master);noise.start(start);noise.onended=()=>{noise.disconnect();filter.disconnect();gain.disconnect();};
}
function crowdSound(){
 if(!soundEnabled||state.paused||document.hidden||!audioContext||audioContext.state!=='running')return;
 const strength=state.intensity/100;if(!strength)return;
 const now=audioContext.currentTime,tier=trickTier(state.mood,state.intensity),step=beat++%8;
 if(state.mood==='quiet'){if(step%2===0)clap(now,strength,true);return;}
 if(state.mood==='boo'){if(step%3===0){tone(150,now,.48,.035*strength,'triangle',105);tone(180,now+.08,.4,.02*strength,'sine',120);}return;}
 // A warm pentatonic melody, handclaps and spaced-out rising crowd whoops.
 const melody=[523.25,659.25,783.99,659.25,880,783.99,659.25,587.33];
 tone(melody[step],now,.23,.025*strength,'sine');
 if(step%2===1){clap(now,strength);if(tier>=2)clap(now+.045,strength*.55);}
 if(step%4===0){tone(130.81,now,.25,.035*strength,'sine');tone(390,now+.04,.5,.022*strength,'triangle',640);tone(490,now+.12,.48,.016*strength,'sine',790);}
 if(tier>=1&&step%2===0)tone(melody[step]/2,now,.28,.014*strength,'triangle');
 if(tier===3&&step===6)[1046.5,1318.5,1568].forEach((note,i)=>tone(note,now+i*.07,.24,.014,'sine'));
}
function hush(){if(master&&audioContext){master.gain.cancelScheduledValues(audioContext.currentTime);master.gain.setValueAtTime(soundEnabled&&!state.paused?.65:0,audioContext.currentTime);}}
$('sound').onclick=()=>{if(soundEnabled){soundEnabled=false;hush();soundLabel();}else enableSound().then(hush);};
// Browsers require a real user gesture before allowing audio playback.
document.addEventListener('pointerdown',e=>{if(e.target.id!=='sound'&&!audioContext)enableSound();},{capture:true});
function targetConfidence(mood,intensity){return mood==='cheer'?55+intensity*.4:mood==='boo'?55-intensity*.45:55;}
function setMood(mood){state.mood=mood;document.querySelectorAll('[data-mood]').forEach(b=>{b.classList.toggle('selected',b.dataset.mood===mood);b.setAttribute('aria-pressed',String(b.dataset.mood===mood));});$('moodHint').textContent=hints[mood];render();}
document.querySelectorAll('[data-mood]').forEach(b=>b.addEventListener('click',()=>setMood(b.dataset.mood)));
$('intensity').addEventListener('input',e=>{state.intensity=+e.target.value;if(!audioContext)enableSound();updateCrowd();});
$('pause').onclick=()=>{state.paused=!state.paused;$('pause').textContent=state.paused?'Resume scene':'Pause scene';hush();};
$('reset').onclick=()=>{Object.assign(state,{confidence:50,intensity:55,time:0,paused:false});setMood('cheer');$('intensity').value=55;$('pause').textContent='Pause scene';hush();updateCrowd();};
$('notesButton').onclick=()=>$('notes').showModal();$('closeNotes').onclick=()=>$('notes').close();
document.addEventListener('keydown',e=>{if($('notes').open||/INPUT|TEXTAREA/.test(e.target.tagName))return;const mood={1:'cheer',2:'quiet',3:'boo'}[e.key];if(mood)setMood(mood);});
function line(points,color='#333b32',width=3){ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();}
function circle(x,y,r,fill){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill();}ctx.stroke();}
function bubble(x,y,text){ctx.save();ctx.translate(x,y);ctx.rotate(-.05);ctx.fillStyle='#fffef9';ctx.strokeStyle='#646c59';ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(-35,-21,70,31,9);ctx.fill();ctx.stroke();line([[-8,10],[-13,19],[3,11]],'#646c59',1.5);ctx.font='16px Kalam, cursive';ctx.textAlign='center';ctx.fillStyle='#4d5b3d';ctx.fillText(text,0,1);ctx.restore();}
function render(){const t=state.time,c=state.confidence/100,amp=state.intensity/100;ctx.clearRect(0,0,1100,440);
// Hand-drawn half-pipe, with a second imperfect pencil line and hatched supports.
ctx.fillStyle='#edf0df';ctx.beginPath();ctx.moveTo(270,225);ctx.bezierCurveTo(320,225,320,333,435,333);ctx.lineTo(660,333);ctx.bezierCurveTo(772,333,775,225,830,225);ctx.lineTo(830,361);ctx.lineTo(270,361);ctx.closePath();ctx.fill();
line([[231,225],[270,225]],'#3b4433');ctx.beginPath();ctx.moveTo(270,225);ctx.bezierCurveTo(320,225,320,333,435,333);ctx.lineTo(660,333);ctx.bezierCurveTo(772,333,775,225,830,225);ctx.lineTo(869,225);ctx.stroke();line([[270,225],[270,361],[830,361],[830,225]]);for(let x=288;x<827;x+=18)line([[x,348],[x-7,358]],'#b3bba3',1);line([[196,365],[886,365]],'#929985',1.5);
ctx.fillStyle='#8e987f';ctx.font='15px Kalam, cursive';ctx.fillText('the little ramp',471,387);
// Crowd marks become bigger, faster and more expressive as intensity grows.
for(let person=0;person<crowdCount(state.intensity);person++){const side=person%2,i=Math.floor(person/2);const x=side?875+(i%5)*37:70+(i%5)*37,y=240+Math.floor(i/5)*44;const bounce=reduced?0:Math.abs(Math.sin(t*(state.mood==='quiet'?1:5)+i*2))*amp*(state.mood==='quiet'?2:12);ctx.save();ctx.translate(x,y-bounce);ctx.strokeStyle='#566349';ctx.lineWidth=2.5;circle(0,-17,6,'#fffef9');line([[0,-10],[-1,12]],'#566349',2.5);const arms=state.mood==='cheer'?-20:state.mood==='boo'?0:6;line([[-12,arms],[0,-4],[12,arms-3]],'#566349',2.5);line([[-1,12],[-8,21]],'#566349',2);line([[-1,12],[6,21]],'#566349',2);ctx.restore();}const words=state.mood==='cheer'?['you got this!','wooo!']:state.mood==='boo'?['boo…','really?']:['…','take a breath'];if(crowdCount(state.intensity)>0)bubble(146,184,words[0]);if(crowdCount(state.intensity)>1)bubble(952,181,words[1]);
// Pose and trick selection change ONLY at 60%, 80%, and 100% cheering.
const tier=trickTier(state.mood,state.intensity),phase=reduced?.6:t,travel=Math.sin(phase),x=550+travel*[180,200,220,240][tier],r=Math.max(0,(Math.abs(x-550)-110)/170),rampY=333-r*r*108;
const flight=Math.max(0,Math.sin(phase*2)),jump=reduced?0:Math.pow(flight,2)*[0,38,75,108][tier],y=rampY-jump-15;
const poses=[{head:[0,-62],hip:[0,-28],elbows:[[-20,-35],[14,-34]],hands:[[-29,-43],[28,-43]],knees:[[-16,-18],[9,-13]]},{head:[-6,-52],hip:[0,-23],elbows:[[-21,-34],[15,-31]],hands:[[-35,-40],[30,-40]],knees:[[-22,-16],[20,-15]]},{head:[-12,-55],hip:[0,-25],elbows:[[-26,-40],[20,-19]],hands:[[-38,-62],[25,-2]],knees:[[-20,-15],[18,-17]]},{head:[0,-68],hip:[0,-30],elbows:[[-22,-61],[22,-61]],hands:[[-31,-84],[31,-84]],knees:[[-17,-18],[16,-18]]}];
const pose=poses[tier];ctx.save();ctx.translate(x,y);const direction=Math.cos(phase)>0?1:-1;ctx.scale(direction,1);ctx.rotate(-r*.35*Math.sign(travel)*direction);ctx.strokeStyle='#303a30';ctx.lineWidth=3;circle(...pose.head,11,'#fffef9');line([[pose.head[0]-7,pose.head[1]-8],[pose.head[0]+10,pose.head[1]-10],[pose.head[0]+14,pose.head[1]-4]],'#6d843e',4);
const neck=[pose.head[0],pose.head[1]+12];line([neck,pose.hip]);line([pose.hip,pose.knees[0],[-21,-6]]);line([pose.hip,pose.knees[1],[20,-5]]);line([neck,pose.elbows[0],pose.hands[0]]);line([neck,pose.elbows[1],pose.hands[1]]);
ctx.save();if(tier===3&&jump>8&&!reduced){ctx.translate(0,6);ctx.rotate(flight*Math.PI*2);ctx.translate(0,-6);}line([[-32,-4],[-25,1],[25,1],[34,-6]],'#35402d',4);circle(-19,8,4,'#849b55');circle(21,8,4,'#849b55');ctx.restore();ctx.restore();
const trickNames=['Easy ride','60% · Ollie','80% · Grab','100% · Kickflip!'];ctx.font='18px Kalam, cursive';ctx.fillStyle='#698445';ctx.textAlign='center';ctx.fillText(trickNames[tier],550,105);ctx.textAlign='start';
const feeling=c>.76?'brave':c>.6?'encouraged':c>.42?'finding balance':c>.25?'unsure':'overwhelmed';$('feeling').textContent=feeling;$('sceneCaption').textContent=c>.76?'Okay… I can do this!':c>.6?'Maybe one more try.':c>.42?'Finding my feet…':c>.25?'Are they watching me?':'I need a little space.';$('confidence').style.width=state.confidence+'%';$('percent').textContent=Math.round(state.confidence)+'% confidence';document.querySelector('.meter').setAttribute('aria-valuenow',String(Math.round(state.confidence)));
}
let last=performance.now();function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;if(!state.paused){state.confidence+=(targetConfidence(state.mood,state.intensity)-state.confidence)*(1-Math.exp(-dt*.5));state.time+=dt*[.65,.85,1,1.15][trickTier(state.mood,state.intensity)];render();}requestAnimationFrame(frame);}render();requestAnimationFrame(frame);

updateCrowd();



