const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');
const scoreEl = document.querySelector('#score')
const HighestEl = document.querySelector('#highest')
let highest = 0;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
class Player{
	constructor(x,y,radius,color) {
		this.x = x
		this.y = y
		this.radius = radius
		this.color = color
	}
	draw() {
		context.beginPath();
		context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
		context.fillStyle = this.color;
		context.fill()
	}
}
class Projectile{
	constructor(x, y, radius, color, velocity) {
		this.x = x
		this.y = y
		this.radius = radius
		this.color = color
		this.velocity = velocity
	}
	draw() {
		context.beginPath();
		context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
		context.fillStyle = this.color;
		context.fill()
	}
	update() {
		this.draw()
		this.x = this.x + this.velocity.x
		this.y = this.y + this.velocity.y
	}
}
class Enemy{
	constructor(x, y, radius, color, velocity) {
		this.x = x
		this.y = y
		this.radius = radius
		this.color = color
		this.velocity = velocity
	}
	draw() {
		context.beginPath();
		context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
		context.fillStyle = this.color;
		context.fill()
	}
	update() {
		this.draw()
		this.x = this.x + this.velocity.x
		this.y = this.y + this.velocity.y
	}
}
const friction = 0.99;
class Particle{
	constructor(x, y, radius, color, velocity) {
		this.x = x
		this.y = y
		this.radius = radius
		this.color = color
		this.velocity = velocity
		this.alpha = 1
	}
	draw() {
		context.save()
		context.globalAlpha = this.alpha;
		context.beginPath();
		context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
		context.fillStyle = this.color;
		context.fill()
		context.restore()
	}
	update() {
		this.draw()
		this.velocity.x *= friction
		this.velocity.y *= friction
		this.x = this.x + this.velocity.x
		this.y = this.y + this.velocity.y
		this.alpha -= 0.01
	}
}
const x = canvas.width / 2;
const y = canvas.height / 2;

const player = new Player(x, y, 10, 'white');
const projectiles = [];
const enemies = [];
const particles = [];
function spawnEnemies() {
	setInterval(
		() => {
			const radius = Math.random() * (30-7)+7;
			let x;
			let y;
			if (Math.random() < 0.5) {
				x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
				y = Math.random() *canvas.height;
			} else {
				x = Math.random() *canvas.width;
				y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
			}
			const color = `hsl(${Math.random()*360},50%,50%)`;
			const angle = Math.atan2(
			canvas.height / 2 - y,
			canvas.width / 2 - x)
			const velocity = {
				x:Math.cos(angle),
				y:Math.sin(angle)}
			enemies.push(new Enemy(x,y,radius,color,velocity))
		}, 1000)
}
let animationId
let score = 0
// var fun = window.location.reload(true);
function restartGame() {
    // Reset all game variables
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    projectiles.length = 0;
    enemies.length = 0;
    particles.length = 0;
    score = 0;
	scoreEl.innerHTML = score;
	HighestEl.innerHTML = highest;
    // Start the animation loop again
    animate();
}

function animate() {
	animationId = requestAnimationFrame(animate);
	context.fillStyle = 'rgba(0,0,0,0.3)'
	context.fillRect(0, 0, canvas.width, canvas.height)
	player.draw();
	particles.forEach((particle, index) => {
		if (particle.alpha <= 0) {
			particles.splice(index, 1)
		}
		else {
			particle.update()
		}
	});
	projectiles.forEach((projectile, index) => {
		projectile.update()
		if (projectile.x + projectile.radius < 0 || projectile.x - projectile.radius> canvas.width || projectile.y + projectile.radius<0 ||projectile.y - projectile.radius> canvas.height) {
			setTimeout(() => {
				projectiles.splice(index,1)
			},0)
		}
	})
	enemies.forEach((enemy, index) => {
		enemy.update()
		const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y)
		//end game
		if (dist - enemy.radius - player.radius < 1) {
			if (score > highest) {highest = score}
			cancelAnimationFrame(animationId);
			restartGame()
		}

		projectiles.forEach((projectile, projectileIndex) => {
			const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y)
			if (dist - enemy.radius - projectile.radius < 1) {

				for (let i = 0; i < enemy.radius*2; i++){
					particles.push(
						new Particle(
							projectile.x,
							projectile.y,
							Math.random() * 2,
							enemy.color,
							{ x: (Math.random() - 0.5)*(Math.random()*8), y: (Math.random() - 0.5) - (Math.random()* 8) }))
				}
				if (enemy.radius - 10 > 5) {
					//score
					score += 10
					scoreEl.innerHTML = score
					console.log(score)
					gsap.to(enemy, {
						radius: enemy.radius - 10
					})
					setTimeout(() => {
						projectiles.splice(projectileIndex, 1)
					}, 0)
				} else {
					//score
					score += 20
					scoreEl.innerHTML = score
					console.log(score)
					setTimeout(() => {
						enemies.splice(index, 1)
						projectiles.splice(projectileIndex, 1)
					}, 0)
				}
			}
		})
	})
}

// on mouse movement particles
addEventListener('click', (event) => {
	const angle = Math.atan2(
		event.clientY - canvas.height / 2,
		event.clientX - canvas.width / 2)
	const velocity = {
		x:Math.cos(angle) *4,
		y:Math.sin(angle) *4
	}
	projectiles.push(new Projectile(x, y, 5, 'white', velocity));
})


animate();
spawnEnemies();
