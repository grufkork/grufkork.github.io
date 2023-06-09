const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = 600;
canvas.height = 600;
ctx.width = 600;
ctx.height = 600;

let conf = {
	rv: 0.07,
	acc: 0.06,
	drag: 0.995,
	asize: 20,
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
		x: 200,
		y: 200,
		vx: 0,
		vy: 0,
		r: 0,
		cooldown: 0
	},
	bullets: [],
	asteroids: [],
	particles: [],
	wave: 0,
	score: 0
};

function d(x1, y1, x2, y2){
	return Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
}

function spawnParticle(x, y, vx, vy, life){
	game.particles.push({
		x: x,
		y: y,
		vx: vx,
		vy: vy,
		life: life
	});
}

document.addEventListener("keydown", (e)=>{
	keys[e.key] = true;
});
document.addEventListener("keyup", (e)=>{
	keys[e.key] = false;
});


let dead = false;
function main(){
	if(dead) return;
	ctx.fillStyle = "#000000";
	ctx.fillRect(0, 0, 600, 600);
	ctx.beginPath();
	ctx.rect(0, 0, 600, 600);
	ctx.stroke();
	
	if(keys.a)game.player.r -= conf.rv;
	if(keys.d) game.player.r += conf.rv;
		
	
	if(keys.w){
		game.player.vx += Math.cos(game.player.r) * conf.acc;
		game.player.vy += Math.sin(game.player.r) * conf.acc;
		
		if(Math.random() > 0.6){
			spawnParticle(
				game.player.x - Math.cos(game.player.r) * 7, 
				game.player.y - Math.sin(game.player.r) * 7,
				-Math.cos(game.player.r) * 2 + game.player.vx + Math.random() -0.5,
				-Math.sin(game.player.r) * 2 + game.player.vy + Math.random()-0.5,
				20 + Math.random()*20
			);
		}
	}
	game.player.vx *= conf.drag;
	game.player.vy *= conf.drag;
	
	game.player.x += game.player.vx;
	game.player.y += game.player.vy;
	
	if(game.player.x > 600){
		game.player.x -= 600;
	}else if(game.player.x < 0){
		game.player.x += 600;
	}
	if(game.player.y > 600){
		game.player.y -= 600;
	}else if(game.player.y < 0){
		game.player.y += 600;
	}
	
	game.player.cooldown --;
	
	if(keys[" "]){
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
	
	if(game.asteroids.length == 0){
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
	}
	
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
		
		ctx.beginPath();
		ctx.moveTo(game.particles[i].x, game.particles[i].y);
		ctx.lineTo(game.particles[i].x + Math.cos(game.particles[i].vx*31929)*8, game.particles[i].y + Math.sin(game.particles[i].vx*31929)*8);
		ctx.stroke();
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
						Math.random() * 20 + 20
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
		
		if(game.asteroids[n].x > 600){
			game.asteroids[n].x -= 600;
		}else if(game.asteroids[n].x < 0){
			game.asteroids[n].x += 600;
		}
		if(game.asteroids[n].y > 600){
			game.asteroids[n].y -= 600;
		}else if(game.asteroids[n].y < 0){
			game.asteroids[n].y += 600;
		}
		
		ctx.beginPath();
		ctx.arc(game.asteroids[n].x, game.asteroids[n].y, game.asteroids[n].size * conf.asize, 0, Math.PI*2);
		ctx.stroke();
		
		if(d(game.player.x, game.player.y, game.asteroids[n].x, game.asteroids[n].y) < game.asteroids[n].size * conf.asize){
			ctx.font = "30px consolas";
			ctx.fillText("YOU DIED", 200, 200);
			ctx.fillText("Score: " + game.score, 200, 240);
			if(saveScore("asteroids", scoreIn.value, game.score)){
				ctx.fillText("NEW HIGHSCORE!!!", 210, 280);
			}
			setTimeout(()=>{location.reload()}, 2000);
			dead=true;
		}
	}
	
	ctx.strokeStyle = "#ffffff";
	ctx.lineWidth = 2;
	ctx.save();
	ctx.translate(game.player.x, game.player.y);
	ctx.rotate(game.player.r);
	ctx.beginPath();
	ctx.moveTo(15, 0);
	ctx.lineTo(-5, 5);
	ctx.lineTo(-5, -5);
	ctx.lineTo(15, 0);
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
	
	ctx.restore();
	
	ctx.fillText("Score: " + game.score + "   Wave: " + game.wave, 20, 20);
}

setInterval(main, 1000/60); 

let scoreIn = document.getElementById("score");
scoreIn.value = localStorage.playerName;
scoreIn.onchange = ()=>{
	localStorage.playerName = scoreIn.value;
};

let scoreDisp = document.getElementById("scoredisplay");
let hs = getScore("asteroids");
scoreDisp.innerHTML = "HIGHSCORE: " + hs.score + " by " + hs.name;