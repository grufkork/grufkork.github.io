const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = 1200;
canvas.height = 600;
ctx.width = 1200;
ctx.height = 600;

// vociferous turgid incumbent

function sort(a){
	if(a.length <2) return a;
	let x = 0;
	let allgood = true;
	while(true){
		if(a[x].score > a[x+1].score){
			let b = a[x];
			a[x] = a[x+1];
			a[x+1] = b;
			allgood = false;
		}else{
			x++;
		}
		if( x == a.length - 1){
			if(allgood){
				break;
			}else{
				x = 0;
				allgood = true;
			}
		}
	}
	return a;
}

function deleteScore(title, name){
	let s = JSON.parse(localStorage[title]);
	for(let i = 0; i < s.length; i++){
		if(s[i].name.toLowerCase() == name.toLowerCase()){
			s.splice(i, 1);
			localStorage[title] = JSON.stringify(s);
			return;
		}
	}
}

function renameScore(title, name, newname){
	let s = JSON.parse(localStorage[title]);
	for(let i = 0; i < s.length; i++){
		if(s[i].name.toLowerCase() == name.toLowerCase()){
			s[i].name = newname;
			localStorage[title] = JSON.stringify(s);
			return;
		}
	}
}

function saveScore(title, name, score, data){
	if(localStorage[title] == undefined){
		localStorage[title] = JSON.stringify([]);
	}
	let s = JSON.parse(localStorage[title]);

	let found = false;
	for(let i = 0; i < s.length; i++){
		if(s[i].name.toLowerCase() == name.toLowerCase()){
			if(score < s[i].score){
				s[i].score = score;
				s[i].data = data;
			}
			found = true;
			break;
		}
	}
	
	if(!found){
		s.push({name: name, score: score, data: data});
	}
	sort(s);
	
	localStorage[title] = JSON.stringify(s);
	
	
	/*if(score >= s.score){
		localStorage[title] = JSON.stringify({name: name, score: score, data: data});
		return true;
	}*/
	//return false;
}

function getScores(title){
	if(localStorage[title] == undefined){
		localStorage[title] = JSON.stringify([]);
	}
	
	return JSON.parse(localStorage[title]);
}




let select = document.getElementById("levelSelect");
let levelNames = Object.keys(levels);
for(let i = 0; i < levelNames.length; i++){
	let opt = document.createElement("option");
	opt.value = levelNames[i];
	opt.innerHTML = levelNames[i];
	select.appendChild(opt);
}

select.onchange = ()=>{
	setupLevel(levelSrc, levels[select.value]);
	resetGame();
};

const hstable = document.getElementById("hiscores");
function updateHighscore(){
	let scoreDisp = document.getElementById("scoredisplay");
	let s = getScores("racing" + levelSelect.value);
	
	while(hstable.childElementCount > 1){
		hstable.children[1].remove();
	}
	
	game.ghosts = [];
	for(let i = 0; i < s.length; i++){
		let tr = document.createElement("tr");
		
		let td = document.createElement("td");
		td.innerHTML = (i+1);
		tr.appendChild(td);
		
		td = document.createElement("td");
		td.innerHTML = s[i].name;
		tr.appendChild(td);
		
		td = document.createElement("td");
		td.innerHTML = s[i].score;
		tr.appendChild(td);
		
		hstable.appendChild(tr);
		
		s[i].data.name = s[i].name;
		game.ghosts.push(s[i].data);
	}
	
	//scoreDisp.innerHTML = "HIGHSCORE: " + hs.score + " by " + hs.name;
	
	
	game.inputIndex = 0;
}

// startx,starty,[x,y,size,type]

let levelSrc = `
20,20,0,
`;

function parseLevel(src){
	src = src.split(",");
	let level = {objs: []};
	level.startX = parseInt(src.splice(0, 1)[0]);
	level.startY = parseInt(src.splice(0, 1)[0]);
	level.startR = parseFloat(src.splice(0, 1)[0]);
	for(let i = 0; i < src.length; i+=4){
		level.objs.push({
			x: parseInt(src[i]),
			y: parseInt(src[i+1]),
			size: parseInt(src[i+2]),
			type: parseInt(src[i+3])
		});
	}
	return level;
}

function setupLevel(textsrc, grid){
	const level = parseLevel(textsrc);

	for(let i = 0; i < grid.length; i++){
		if(grid[i] != 0){
			let size = 20;
			if(grid[i] >= 2){
				size = grid[i]*20 - 20;
			}
			level.objs.push({
				x: (i%30)*40,
				y: Math.floor(i/30) * 40,
				size: size,
				type: grid[i]==1?0:1
			});
		}
	}
	
	game.asteroids = [];
	game.numCheckpoints=0;
	for(let i = 0; i < level.objs.length; i++){
		game.asteroids.push({
			x: level.objs[i].x,
			y: level.objs[i].y,
			vx: 0,
			vy: 0,
			size: level.objs[i].size,
			type: level.objs[i].type
		});
		
		if(level.objs[i].type ==1)game.numCheckpoints ++;
	}
	game.level = level;
}

let conf = {
	rv: 0.09,
	acc: 0.09,
	drag: 0.99,
	asize: 1,
	recoil: 0
};

let keys = {
	w: false,
	a: false,
	s: false,
	d: false,
	" ": false
};

let game = {
	player: {
		x: 0,
		y: 0,
		vx: 0,
		vy: 0,
		r: 0,
		cooldown: 0,
		points: []
	},
	ghosts: [],
	inputIndex: 0,
	replay: {
		x: 0,
		y: 0,
		vx: 0,
		vy: 0,
		r: 0,
		input: []
	},
	bullets: [],
	asteroids: [],
	particles: [],
	wave: 0,
	score: 0,
	numCheckpoints: 0,
	checkpointsTaken: 0,
	t: 0
};

function d(x1, y1, x2, y2){
	return Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
}

function spawnParticle(x, y, vx, vy, life, type){
	game.particles.push({
		x: x,
		y: y,
		vx: vx,
		vy: vy,
		life: life,
		type: type
	});
}

function resetGame(){
	game.player.x = game.level.startX;
	game.player.y = game.level.startY;
	game.player.vx = 0;
	game.player.vy = 0;
	game.player.r = game.level.startR;
	game.checkpointsTaken = 0;
	game.t=0;
	game.replay.input = [];
	game.player.points = [];
	text = "";
	for(let x = 0; x < game.asteroids.length; x++){
		if(game.asteroids[x].type == 2)
			game.asteroids[x].type = 1;
	}
	updateHighscore();
}

	let nameIndex = 0;
document.addEventListener("keydown", (e)=>{
	keys[e.code] = true;
	if(e.code == "KeyB"){
		speechSynthesis.speak(new SpeechSynthesisUtterance(a[nameIndex]));
		nameIndex++;
	}else if(e.code == "Backslash"){
		say();
	}
});
document.addEventListener("keyup", (e)=>{
	keys[e.code] = false;
});


//setupLevel(levelSrc, levelGrid);
let dead = false;
let text = "";
function main(){
	if(dead) return;
	if(game.checkpointsTaken > 0) game.t+= 1/60;
	ctx.fillStyle = "#000000ff";
	ctx.fillRect(0, 0, 1200, 600);
	ctx.beginPath();
	ctx.rect(0, 0, 1200, 600);
	ctx.stroke();
	
	let input = {
		left: keys.KeyA || keys.ArrowLeft,
		right: keys.KeyD || keys.ArrowRight,
		up: keys.KeyW || keys.Space
	};
	
	if(input.left) game.player.r -= conf.rv;
	if(input.right) game.player.r += conf.rv;
	
	if(game.checkpointsTaken > 0){
		if(game.checkpointsTaken < game.numCheckpoints){
			game.player.points.push([game.player.x, game.player.y]);
			game.replay.input.push(
				(input.left * 1) |
				(input.right * 2) | 
				(input.up * 4)
			);
		}
		
		for(let i = 0; i < game.ghosts.length; i++){
			if(game.inputIndex < game.ghosts[i].input.length){
				if(game.ghosts[i].input[game.inputIndex] & 1){
					game.ghosts[i].r -= conf.rv;
				}
				if(game.ghosts[i].input[game.inputIndex] & 2){
					game.ghosts[i].r += conf.rv;
				}
				if(game.ghosts[i].input[game.inputIndex] & 4){
					game.ghosts[i].vx += Math.cos(game.ghosts[i].r) * conf.acc;
					game.ghosts[i].vy += Math.sin(game.ghosts[i].r) * conf.acc;
				}
			}
			
			if(game.checkpointsTaken > 0){
				game.ghosts[i].vx *= conf.drag;
				game.ghosts[i].vy *= conf.drag;
			
				game.ghosts[i].x += game.ghosts[i].vx;
				game.ghosts[i].y += game.ghosts[i].vy;
				
				if(game.ghosts[i].x > 1200 || game.ghosts[i].x < 0){
					game.ghosts[i].vx *= -1;
				}
				if(game.ghosts[i].y > 600 || game.ghosts[i].y < 0){
					game.ghosts[i].vy *= -1;
				}
			}
		}
		game.inputIndex ++;
		
		
	}
	
	
	
	if(input.up){
		game.player.vx += Math.cos(game.player.r) * conf.acc;
		game.player.vy += Math.sin(game.player.r) * conf.acc;
		
		if(Math.random() > 0.6){
			spawnParticle(
				game.player.x - Math.cos(game.player.r) * 15, 
				game.player.y - Math.sin(game.player.r) * 15,
				-Math.cos(game.player.r) * 2 + game.player.vx + Math.random() -0.5,
				-Math.sin(game.player.r) * 2 + game.player.vy + Math.random()-0.5,
				20 + Math.random()*20,
				0
			);
			
		}
		spawnParticle(
			game.player.x - Math.cos(game.player.r) * 15, 
			game.player.y - Math.sin(game.player.r) * 15,
			(Math.random() - 0.5)*0.2 - Math.cos(game.player.r) * 0.5,
			(Math.random() - 0.5)*0.2 -Math.sin(game.player.r) * 0.5,
			30,
			1
		);
	}
	game.player.vx *= conf.drag;
	game.player.vy *= conf.drag;
	
	game.player.x += game.player.vx;
	game.player.y += game.player.vy;
	
	if(game.player.x > 1200 || game.player.x < 0){
		game.player.vx *= -1;
	}
	if(game.player.y > 600 || game.player.y < 0){
		game.player.vy *= -1;
	}
	
	game.player.cooldown --;
	
	if(keys[" "] && false){
		if(game.player.cooldown <= 0){
			game.bullets.push({
				x: game.player.x, 
				y: game.player.y, 
				vx: Math.cos(game.player.r) * 4 + game.player.vx, 
				vy: Math.sin(game.player.r) * 4 + game.player.vy
			});
			game.player.cooldown = 20;
			game.player.vx -= Math.cos(game.player.r) * conf.recoil;
			game.player.vy -= Math.sin(game.player.r) * conf.recoil;
		}
	}
	
	/*if(game.asteroids.length == 0){
		game.wave++;
		for(let n = 0; n < game.wave; n++){
			let x;
			let y;
			while(true){
				x = Math.random() * 600;
				y = Math.random() * 600;
				if(d(x, y, game.player.x, game.player.y) > 80){
					break;
				}
			}
			game.asteroids.push({
				x: x,
				y: y,
				vx: (Math.random() - 0.5) * 2,
				vy: (Math.random() - 0.5) * 2,
				size: Math.ceil(Math.random() * 3)
			});
		}
	}*/
	
	ctx.fillStyle="#ffffff";
	ctx.lineWidth = 1;
	for(let i = 0; i < game.particles.length; i++){
		game.particles[i].life--;
		if(game.particles[i].life <= 0){
			game.particles.splice(i, 1);
			i--;
			continue;
		}
		game.particles[i].x += game.particles[i].vx;
		game.particles[i].y += game.particles[i].vy;
		
		if(game.particles[i].type == 0){
			ctx.beginPath();
			ctx.moveTo(game.particles[i].x, game.particles[i].y);
			ctx.lineTo(game.particles[i].x + Math.cos(game.particles[i].vx*31929)*8, game.particles[i].y + Math.sin(game.particles[i].vx*31929)*8);
			ctx.stroke();
		}else if(game.particles[i].type == 1){
			ctx.beginPath();
			ctx.arc(game.particles[i].x, game.particles[i].y, Math.random() + game.particles[i].life/15, 0, Math.PI * 2);
			ctx.stroke();
		}
	}
	ctx.lineWidth = 2;
	
	for(let i = 0; i < game.bullets.length; i++){
		
		if(Math.abs(game.bullets[i].x) > 600 || Math.abs(game.bullets[i].y) > 600){
			game.bullets.splice(i, 1);
			i--;
			continue;
		}
		
		game.bullets[i].x += game.bullets[i].vx;
		game.bullets[i].y += game.bullets[i].vy;
		ctx.beginPath();
		ctx.arc(game.bullets[i].x, game.bullets[i].y, 3, 0, Math.PI*2);
		ctx.fill();
		
		for(let n = 0; n < game.asteroids.length; n++){
			if(d(game.bullets[i].x, game.bullets[i].y, game.asteroids[n].x, game.asteroids[n].y) < game.asteroids[n].size * conf.asize){
				game.bullets.splice(i, 1);
				i--;
				if(game.asteroids[n].size > 1){
					for(let m = 0; m < 2; m++){
						game.asteroids.push({
							x: game.asteroids[n].x,
							y: game.asteroids[n].y,
							vx: (Math.random() - 0.5) * 2 + game.asteroids[n].vx,
							vy: (Math.random() - 0.5) * 2 + game.asteroids[n].vx,
							size: game.asteroids[n].size - 1
						});
					}
				}
				for(let p = 0; p < 20; p++){
					spawnParticle(
						game.asteroids[n].x,
						game.asteroids[n].y,
						(Math.random()-0.5)*2 + game.asteroids[n].vx,
						(Math.random()-0.5)*2 + game.asteroids[n].vy,
						Math.random() * 20 + 20,
						0
					);
				}
				game.asteroids.splice(n, 1);
				n--;
				game.score++;
				break;
			}
		}
	}
	
	for(let n = 0; n < game.asteroids.length; n++){
		game.asteroids[n].x += game.asteroids[n].vx;
		game.asteroids[n].y += game.asteroids[n].vy;
		
		/*if(game.asteroids[n].x > 600){
			game.asteroids[n].x -= 600;
		}else if(game.asteroids[n].x < 0){
			game.asteroids[n].x += 600;
		}
		if(game.asteroids[n].y > 600){
			game.asteroids[n].y -= 600;
		}else if(game.asteroids[n].y < 0){
			game.asteroids[n].y += 600;
		}*/
		
		switch(game.asteroids[n].type){
			case 0:
				ctx.strokeStyle = "#ff0000";
				break;
			case 1:
				ctx.strokeStyle = "#ffffff";
				break;
			case 2:
				ctx.strokeStyle = "#00ff00";
				break;
		}
		ctx.beginPath();
		ctx.arc(game.asteroids[n].x, game.asteroids[n].y, game.asteroids[n].size * conf.asize, 0, Math.PI*2);
		ctx.stroke();
		
		if(d(game.player.x, game.player.y, game.asteroids[n].x, game.asteroids[n].y) < game.asteroids[n].size * conf.asize){
			if(game.asteroids[n].type == 0){
				for(let p = 0; p < 40; p++){
					spawnParticle(
						game.player.x,
						game.player.y,
						(Math.random()-0.5)*2 + game.player.vx,
						(Math.random()-0.5)*2 + game.player.vy,
						Math.random() * 40,
						0
					);
				}
				for(let p = 0; p < 20; p++){
					spawnParticle(
						game.player.x,
						game.player.y,
						(Math.random()-0.5)*2,
						(Math.random()-0.5)*2,
						Math.random() * 20 + 20,
						0
					);
				}
				resetGame();
			}else if(game.asteroids[n].type == 1){
				game.asteroids[n].type = 2;
				game.checkpointsTaken++;
				if(game.checkpointsTaken == 1){
					game.t = 0;
					game.replay.x = game.player.x;
					game.replay.y = game.player.y;
					game.replay.vx = game.player.vx;
					game.replay.vy = game.player.vy;
					game.replay.r = game.player.r;
				}
				if(game.checkpointsTaken == game.numCheckpoints){
					text = "T: " + game.t;
					if(saveScore("racing" + levelSelect.value, scoreIn.value, Math.round(game.t*1000)/1000, game.replay)){
						text += "\nNEW HIGHSCORE";
					}
					setTimeout(resetGame, 3000);
				}
			}
			/*ctx.font = "30px consolas";
			ctx.fillText("YOU DIED", 200, 200);
			ctx.fillText("Score: " + game.score, 200, 240);
			if(saveScore("asteroids", scoreIn.value, game.score)){
				ctx.fillText("NEW HIGHSCORE!!!", 210, 280);
			}
			setTimeout(()=>{location.reload()}, 2000);
			dead=true;*/
		}
	}
	
	
	
	ctx.save();
	ctx.translate(game.player.x, game.player.y);
	
	/*ctx.strokeStyle = "#0000ff";
	ctx.beginPath();
	ctx.moveTo(game.player.vx * 5, game.player.vy * 5);
	ctx.lineTo(game.player.vx * 15, game.player.vy * 15);
	ctx.stroke();*/
	
	ctx.rotate(game.player.r);
	
	ctx.strokeStyle = "#ffffff";
	ctx.lineWidth = 2;
	/*ctx.beginPath();
	ctx.moveTo(15, 0);
	ctx.lineTo(-5, 5);
	ctx.lineTo(-5, -5);
	ctx.lineTo(15, 0);
	ctx.stroke();*/
	
	ctx.beginPath();
	//ctx.moveTo(15, 0);
	ctx.moveTo(15, 2);
	ctx.lineTo(3, 2);
	ctx.lineTo(1, 4);
	ctx.lineTo(-7, 4);
	ctx.lineTo(-9, 2);
	ctx.lineTo(-11, 2);
	ctx.lineTo(-12, 4);
	ctx.lineTo(-15, 4);
	ctx.lineTo(-15, 0);	
	
	ctx.lineTo(-15, 0);
	ctx.lineTo(-15, -4);
	ctx.lineTo(-12, -4);
	ctx.lineTo(-11, -2);
	ctx.lineTo(-9, -2);
	ctx.lineTo(-7, -4);
	ctx.lineTo(1, -4);
	ctx.lineTo(3, -2);
	ctx.lineTo(15, -2);
	//ctx.lineTo(15, 0);
	
	ctx.arc(15, 0, 2, -Math.PI/2, Math.PI/2);

	ctx.stroke();
	
	if(keys.w){
		ctx.beginPath();
		ctx.moveTo(-7, 3);
		ctx.lineTo(-7, -3);
		ctx.lineTo(-14, 0);
		ctx.closePath();
		ctx.stroke();
	}
	
	ctx.lineWidth = 1;
	if(keys.a){
		ctx.beginPath();
		ctx.moveTo(12, 3);
		ctx.lineTo(9, 4);
		ctx.lineTo(11, 8);
		ctx.closePath();
		ctx.stroke();
	}
	if(keys.d){
		ctx.beginPath();
		ctx.moveTo(12, -3);
		ctx.lineTo(9, -4);
		ctx.lineTo(11, -8);
		ctx.closePath();
		ctx.stroke();
	}
	
	if(keys.KeyF || keys.KeyR){
		resetGame();
	}
	
	ctx.restore();
	
	ctx.lineWidth = 0.5;
	ctx.strokeStyle = "#ffffff";
	
	ctx.beginPath();
	if(game.player.points.length > 0)
	ctx.moveTo(game.player.points[0][0], game.player.points[0][1]);
	for(let i = 0; i < game.player.points.length; i++){
		ctx.lineTo(game.player.points[i][0], game.player.points[i][1]);
	}
	ctx.stroke();
	
	for(let i = 0; i < game.ghosts.length; i++){
		drawGhost(game.ghosts[i]	);
	}
	
	ctx.strokeStyle = "#ffffff";
	
	ctx.fillText("T: " + Math.floor((game.t)*100)/100, 20, 20);
	ctx.font = "30px Consolas";
	ctx.fillText(text, 200, 200);
	ctx.font = "20px Consolas";
	
	requestAnimationFrame(main);
}

function drawGhost(g){
	ctx.save();
	ctx.translate(g.x, g.y);
	
	/*ctx.strokeStyle = "#0000ff";
	ctx.beginPath();
	ctx.moveTo(game.player.vx * 5, game.player.vy * 5);
	ctx.lineTo(game.player.vx * 15, game.player.vy * 15);
	ctx.stroke();*/
	ctx.strokeStyle = "#aaaaaa";
	ctx.fillStyle =   "#aaaaaa";
	ctx.textAlign = "center";
	ctx.font = "9px Consolas";
	ctx.fillText(g.name, 0, 20);
	
	
	ctx.rotate(g.r);
	
	ctx.lineWidth = 1;
	/*ctx.beginPath();
	ctx.moveTo(15, 0);
	ctx.lineTo(-5, 5);
	ctx.lineTo(-5, -5);
	ctx.lineTo(15, 0);
	ctx.stroke();*/
	
	ctx.beginPath();
	//ctx.moveTo(15, 0);
	ctx.moveTo(15, 2);
	ctx.lineTo(3, 2);
	ctx.lineTo(1, 4);
	ctx.lineTo(-7, 4);
	ctx.lineTo(-9, 2);
	ctx.lineTo(-11, 2);
	ctx.lineTo(-12, 4);
	ctx.lineTo(-15, 4);
	ctx.lineTo(-15, 0);	
	
	ctx.lineTo(-15, 0);
	ctx.lineTo(-15, -4);
	ctx.lineTo(-12, -4);
	ctx.lineTo(-11, -2);
	ctx.lineTo(-9, -2);
	ctx.lineTo(-7, -4);
	ctx.lineTo(1, -4);
	ctx.lineTo(3, -2);
	ctx.lineTo(15, -2);
	//ctx.lineTo(15, 0);
	
	ctx.arc(15, 0, 2, -Math.PI/2, Math.PI/2);

	ctx.stroke();
	
	ctx.restore();
}

select.onchange();
//setInterval(main, 1000/60); 
requestAnimationFrame(main);

let scoreIn = document.getElementById("score");
scoreIn.value = localStorage.playerName;
scoreIn.onchange = ()=>{
	localStorage.playerName = scoreIn.value;
};



nameIndex = 0;
let src = `Strömblad	Navarro	Persson	Hiscoke	Lindstam	Månsson
Hammargren	Figas	Strömblad	Navarro	Heber	Månsson
Larking	Heber	Hammargren	Figas	Sjöblom	Persson
Navarro	Strömblad	Larking	Genberg	Månsson	Persson
Sjöblom	Hammargren	Navarro	Strömblad	Figas	Heber
Enqvist	Larking	Sjöblom	Hammargren	Revenhäll	Heber
Hörtewall	Figas	Enqvist	Larking	Navarro	Månsson
Revenhäll	Sjöblom	Hörtewall	Lundgren	Figas	Månsson
Nilsson	Enqvist	Revenhäll	Sjöblom	Larking	Wessbo
Aurell	Hörtewall	Nilsson	Enqvist	Hammargren	Wessbo
Hiscoke	Revenhäll	Aurell	Hörtewall	Heber	Boel
Lindstam	Nilsson	Hiscoke	Revenhäll	Lundgren	Boel
Lundgren	Aurell	Lindstam	Nilsson	Genberg	Wessbo
Genberg	Hiscoke	Persson	Aurell	Hörtewall	Wessbo
Lundgren	Lindstam	Strömblad	Hiscoke	Nilsson	Boel
Aurell	Genberg	Lundgren	Lindstam	Persson	Boel
`.split("\n");

let a = [];
for(let row in src){
	let split = src[row].split("\t");
	for(let name in split){
		a.push(split[name]);
	}
}

function say(){
	setInterval(()=>{
		speechSynthesis.speak(new SpeechSynthesisUtterance(a[nameIndex]));
		nameIndex++;
	}, 4000);
}