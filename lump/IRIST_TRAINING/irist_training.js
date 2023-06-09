const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = 1200;
canvas.height = 600;
ctx.width = 1200;
ctx.height = 600;


function updateHighscore(){
	let scoreDisp = document.getElementById("scoredisplay");
	let hs = getScore("racing" + levelSelect.value);
	scoreDisp.innerHTML = "HIGHSCORE: " + hs.score + " by " + hs.name;
}

let conf = {
	rv_aim: 0.08,
	rv_flight: 0.02,
	acc: 0.02,
	drag: 0.998,
	asize: 1,
	recoil: 0,
	predictionInterval: 30
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
		x: 300,
		y: 300,
		vx: 0,
		vy: 0,
		r: 0,
		cooldown: 0,
		launched: false,
		aimX: 1,
		aimY: 0,
		predictionOffset: 0
	},
	bullets: [],
	asteroids: [],
	particles: [],
	wave: 0,
	score: 0,
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
		type: type,
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
	text = "";
	for(let x = 0; x < game.asteroids.length; x++){
		if(game.asteroids[x].type == 2)
			game.asteroids[x].type = 1;
	}
	updateHighscore();
}

	let nameIndex = 0;
document.addEventListener("keydown", (e)=>{
	console.log(e);
	keys[e.code] = true;
	
	if(e.code == "Space"){
		if(game.player.launched){
			for(let i = 0; i < 20; i++){
				game.bullets.push({
					x: game.player.x, 
					y: game.player.y, 
					vx: Math.cos(game.player.r) * 1 + game.player.vx + (Math.random() - 0.5) * 3, 
					vy: Math.sin(game.player.r) * 1 + game.player.vy + (Math.random() - 0.5) * 3,
					life: Math.random() * 10 + 4
				});
			}
			game.player.vx = 0;
			game.player.vy = 0;
			game.player.x = 300;
			game.player.y = 300;
			game.player.launched = false;
		}else{
			game.player.launched = true;
		}
	}
});
document.addEventListener("keyup", (e)=>{
	keys[e.code] = false;
});

function lerp(a, b, x){
	return a*(1-x) + b*x;
}

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
	
	if(Math.random() > 0.995){
		let angle = Math.random() * 2 * Math.PI;
		
		game.asteroids.push({
			x: Math.cos(angle) * 300 + 300,
			y: Math.sin(angle) * 300 + 300,
			vx: -Math.cos(angle + (Math.random() - 0.5) * 0.2),
			vy: -Math.cos(angle + (Math.random() - 0.5) * 0.2),
			size: Math.ceil(Math.random() * 6) + 3
		});
	}
	
	
	game.player.predictionOffset ++;
	if(game.player.launched){
		if(keys.KeyA || keys.ArrowLeft) game.player.r -= conf.rv_flight;
		if(keys.KeyD || keys.ArrowRight) game.player.r += conf.rv_flight;
		
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
	}else{
		/*let x = 0.01;
		let y = 0.01; 
		if(keys.KeyW) y--;
		if(keys.KeyS) y++;
		if(keys.KeyA) x--;
		if(keys.KeyD) x++;
		
		game.player.aimX = lerp(game.player.aimX, x, 0.1);
		game.player.aimY = lerp(game.player.aimY, y, 0.1);
		
		game.player.r = Math.atan2(game.player.aimY, game.player.aimX);*/
		
		
		if(keys.KeyA || keys.ArrowLeft) game.player.r -= conf.rv_aim;
		if(keys.KeyD || keys.ArrowRight) game.player.r += conf.rv_aim;
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
			ctx.arc(game.particles[i].x, game.particles[i].y, Math.random() + game.particles[i].life/40, 0, Math.PI * 2);
			ctx.stroke();
		}
	}
	ctx.lineWidth = 2;
	
	for(let i = 0; i < game.bullets.length; i++){
		
		if(game.bullets[i].life <= 0){
			game.bullets.splice(i, 1);
			i--;
			continue;
		}
		game.bullets[i].life--;
		
		game.bullets[i].x += game.bullets[i].vx;
		game.bullets[i].y += game.bullets[i].vy;
		ctx.beginPath();
		ctx.arc(game.bullets[i].x, game.bullets[i].y, 2, 0, Math.PI*2);
		ctx.fill();
		
		for(let n = 0; n < game.asteroids.length; n++){
			if(d(game.bullets[i].x, game.bullets[i].y, game.asteroids[n].x, game.asteroids[n].y) < game.asteroids[n].size * conf.asize){
				game.bullets.splice(i, 1);
				i--;
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
		
		if(game.asteroids[n].x > 1300 || game.asteroids[n].x < -100 || game.asteroids[n].y > 700 || game.asteroids[n].y < -100){
			game.asteroids.splice(n, 1);
			n--;
			continue;
		}
		
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
		
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.arc(game.asteroids[n].x, game.asteroids[n].y, game.asteroids[n].size * conf.asize, 0, Math.PI*2);
		ctx.stroke();
		
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(game.asteroids[n].x, game.asteroids[n].y);
		ctx.lineTo(game.asteroids[n].x + game.asteroids[n].vx * 10, game.asteroids[n].y + game.asteroids[n].vy * 10);
		ctx.stroke();
		
		let sx = game.asteroids[n].x;
		let sy = game.asteroids[n].y;
		ctx.lineWidth = 0.5;
		sx -= game.asteroids[n].vx * (game.player.predictionOffset%conf.predictionInterval);
		sy -= game.asteroids[n].vy * (game.player.predictionOffset%conf.predictionInterval);
		for(let i = 0; i < 6; i++){
			sx += game.asteroids[n].vx * conf.predictionInterval;
			sy += game.asteroids[n].vy * conf.predictionInterval;
			ctx.beginPath();
			ctx.rect(600 + sx, sy, 3, 3);
			ctx.stroke();
		}
		
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
				}
				if(game.checkpointsTaken == game.numCheckpoints){
					text = "T: " + game.t;
					if(saveScore("racing" + levelSelect.value, scoreIn.value, -game.t)){
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
	
	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.arc(game.player.x + 600, game.player.y, 4, 0, Math.PI*2);
	ctx.fillStyle = "#ffffff";
	ctx.fill();
	ctx.moveTo(game.player.x + 600, game.player.y);
	let px = game.player.x;
	let py = game.player.y;
	let vx = game.player.vx;
	let vy = game.player.vy;
	for(let i = 0; i <= 120; i++){
		vx += Math.cos(game.player.r) * conf.acc;
		vy += Math.sin(game.player.r) * conf.acc;
		vx *= conf.drag;
		vy *= conf.drag;
		px += vx;
		py += vy;
		if((i + game.player.predictionOffset) % conf.predictionInterval == 0){
			ctx.beginPath();
			ctx.arc(600 + px, py, 2, 0, Math.PI*2);
			ctx.stroke();
		}
		
	}
	//ctx.stroke();
	
	ctx.save();
	ctx.translate(game.player.x, game.player.y);
	
	/*ctx.strokeStyle = "#0000ff";
	ctx.beginPath();
	ctx.moveTo(game.player.vx * 5, game.player.vy * 5);
	ctx.lineTo(game.player.vx * 15, game.player.vy * 15);
	ctx.stroke();*/
	
	ctx.rotate(game.player.r);
	ctx.scale(0.5, 0.5);
	
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
	ctx.strokeStyle = "#ffffff";
	
	ctx.fillText("T: " + Math.floor((game.t)*100)/100, 20, 20);
	ctx.font = "30px Consolas";
	ctx.fillText(text, 200, 200);
	ctx.font = "20px Consolas";
}

setInterval(main, 1000/60); 

let scoreIn = document.getElementById("score");
scoreIn.value = localStorage.playerName;
scoreIn.onchange = ()=>{
	localStorage.playerName = scoreIn.value;
};