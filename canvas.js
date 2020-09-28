const cvs = document.querySelector('canvas');
const c = cvs.getContext('2d');

cvs.width = window.innerWidth;
cvs.height = window.innerHeight;

window.addEventListener('resize', function () {
  cvs.width = window.innerWidth;
  cvs.height = window.innerHeight;
});

let mouse = {
  x: undefined,
  y: undefined
};

window.addEventListener('mousemove', function (e) {
  mouse.x = event.x;
  mouse.y = event.y;
});

class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  clone = () => {
    return new Vector(this.x, this.y)
  }

  op = (fn, v) => {
    x = fn(this.x, v.x);
    let y = fn(this.x, v.y);
    return Vector(x, y);
  }

  multiply = (a) => {
    this.x *= a;
    this.y *= a;
    return this;
  }

  normalize = () => {
    var magnitude = Math.sqrt(this.x * this.x + this.y * this.y);
    if (magnitude > 0) {
      this.x /= magnitude;
      this.y /= magnitude;
    }
    return this;
  }
}


const visualRange = 40;
const maxSpeed = 100;
const attraction = 0.05;
const avoidance = 0.5;
const alignment = 0.5;
const bounding = 0.5;
const minDistance = 20;

function distance(v1, v2) {
  return Math.sqrt((v1.x - v2.x) * (v1.x - v2.x) + (v1.y - v2.y) * (v1.y - v2.y));
}



class Boid {
  constructor(position, velocity) {
    this.position = position;
    this.velocity = velocity;
  }

  update = (boids, delta) => {
    var newV = this.velocity.clone();
    this.attract(boids, delta);
    this.avoid(boids, delta);
    this.align(boids, delta);
    this.bounds(delta);
    this.limit();

    this.position.x += this.velocity.x * delta;
    this.position.y += this.velocity.y * delta;
  }

  attract = (boids, delta) => {
    let centerX = 0;
    let centerY = 0;
    let numNeighbors = 0;
  
    for (let otherBoid of boids) {
      if (distance(this.position, otherBoid.position) < visualRange) {
        centerX += otherBoid.position.x;
        centerY += otherBoid.position.y;
        numNeighbors += 1;
      }
    }
  
    if (numNeighbors) {
      centerX = centerX / numNeighbors;
      centerY = centerY / numNeighbors;
  
      this.velocity.x += (centerX - this.position.x) * attraction * delta;
      this.velocity.y += (centerY - this.position.y) * attraction * delta;
    }
  }

  avoid = (boids, delta) => {
    let moveX = 0;
    let moveY = 0;
    for (let otherBoid of boids) {
      if (otherBoid !== this) {
        if (distance(this.position, otherBoid.position) < minDistance) {
          moveX += this.position.x - otherBoid.position.x;
          moveY += this.position.y - otherBoid.position.y;
        }
      }
    }
  
    this.velocity.x += moveX * avoidance * delta;
    this.velocity.y += moveY * avoidance * delta;
  }

  align = (boids, delta) => {
    let avgVX = 0;
    let avgVY = 0;
    let numNeighbors = 0;
  
    for (let otherBoid of boids) {
      if (distance(this.position, otherBoid.position) < visualRange) {
        avgVX += otherBoid.velocity.x;
        avgVY += otherBoid.velocity.y;
        numNeighbors += 1;
      }
    }
  
    if (numNeighbors) {
      avgVX = avgVX / numNeighbors;
      avgVY = avgVY / numNeighbors;
  
      this.velocity.x += (avgVX - this.velocity.x) * alignment * delta;
      this.velocity.y += (avgVY - this.velocity.y) * alignment * delta;
    }
  }

  bounds = (delta) => {
    // TODO:
    if (this.position.x > window.innerWidth) {
      this.velocity.x += (window.innerWidth - this.position.x);
    }
    if (this.position.y > window.innerHeight) {
      this.velocity.y += (window.innerHeight - this.position.y);
    }
    if (this.position.y < 0) {
      this.velocity.y -= this.position.y;
    }

    if (this.position.x < 0) {
      this.velocity.x -= this.position.x;
    }
  }

  limit = () => {
    const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
    if (speed > maxSpeed) {
      this.velocity.x = (this.velocity.x / speed) * maxSpeed;
      this.velocity.y = (this.velocity.y / speed) * maxSpeed;
    }
  }



  draw = (ctx) => {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    let speed = Math.sqrt(Math.pow(this.velocity.x, 2) + Math.pow(this.velocity.y, 2));
    let rotation = (speed > 0) ? Math.acos(this.velocity.x / speed) : 0; 
    rotation = (this.velocity.y > 0) ? rotation : -rotation;
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(rotation);
    ctx.beginPath();
    ctx.moveTo(-6, 5);
    ctx.lineTo(6, 0);
    ctx.lineTo(-6, -5);
    ctx.lineTo(-6, 5);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
    ctx.restore();
  }
}

const boidsArray = [];

for (let i = 0; i < 100; i++) {

  var v = new Vector((Math.random() - .5), (Math.random() - .5)).normalize().multiply(maxSpeed);

  boidsArray.push(
    new Boid(
      new Vector(Math.random() * window.innerWidth, Math.random()* window.innerHeight),
      v
    )
  );
};

let lastTimestamp = null;

function animate(timestamp) {
  let delta = (lastTimestamp) ? (timestamp - lastTimestamp)/1000 : 0;
  lastTimestamp = timestamp;
  requestAnimationFrame(animate);
  c.clearRect(0, 0, window.innerWidth, window.innerHeight);
  boidsArray.forEach(boid => {
    boid.update(boidsArray, delta);
    boid.draw(c);
  })

};

requestAnimationFrame(animate);
