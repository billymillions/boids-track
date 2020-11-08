const cvs = document.querySelector('canvas');
const c = cvs.getContext('2d');

let model = null;
let detecting = false;

let cursor = {
  x: undefined,
  y: undefined
};

let cursorTarget = {
  x: undefined,
  y: undefined,
}

class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  clone = () => {
    return new Vector(this.x, this.y)
  }

  op = (fn, v) => {
    let x = fn(this.x, v.x);
    let y = fn(this.x, v.y);
    return new Vector(x, y);
  }

  mult = (a) => {
    return new Vector(this.x * a, this.y * a);
  }

  div = (a) => {
    return this.mult(1 / a);
  }

  add = (v) => {
    return new Vector(this.x + v.x, this.y + v.y);
  }

  sub = (v) => {
    return new Vector(this.x - v.x, this.y - v.y)
  }
  magnitude = () => {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize = () => {
    let m = this.magnitude();
    if (m > 0) {
      this.x /= m;
      this.y /= m;
    }
    return this;
  }
}


let visualRange = 100;
let maxSpeed = 100;
let attraction = 30;
let avoidance = 10;
let alignment = 5;
let noise = .5;
let bounding = 5;
let handling = 2;
let minDistance = 20;

let scattering = 50;
let scatterRange = 100;

function distance(v1, v2) {
  return Math.sqrt((v1.x - v2.x) * (v1.x - v2.x) + (v1.y - v2.y) * (v1.y - v2.y));
}



class Boid {
  constructor(position, velocity) {
    this.position = position;
    this.velocity = velocity;
  }

  update = (boids, delta) => {
    let newV = this.velocity.clone();
    let attractV = this.attract(boids, delta).mult(attraction);
    let avoidV = this.avoid(boids, delta).mult(avoidance);
    let alignV = this.align(boids, delta).mult(alignment);
    let noiseV = this.addNoise().mult(noise);
    let boundsV = this.keepInBounds().mult(bounding);
    let scatterV = this.scatter().mult(scattering);
    let deltaV = attractV.add(avoidV).add(alignV).add(noiseV).add(boundsV).add(scatterV);
    deltaV = deltaV.mult(delta * handling)

    this.velocity = this.velocity.add(deltaV);
    this.limit();

    this.position.x += this.velocity.x * delta;
    this.position.y += this.velocity.y * delta;
  }

  attract = (boids, delta) => {
    let centerX = 0;
    let centerY = 0;
    let numNeighbors = 0;
    let center = new Vector(0, 0);
  
    for (let otherBoid of boids) {
      let d = distance(this.position, otherBoid.position)
      if (d < visualRange) {
        // let weight = d / visualRange;
        // center = center.add(otherBoid.position);
        // numNeighbors += 1;
        let weight = Math.pow(1 - d / visualRange, 1  );
        center = center.add(otherBoid.position.sub(this.position).normalize().mult(weight));
        numNeighbors += weight;
      }
    }
  
    return center.div(numNeighbors);
    // return center;
  }

  avoid = (boids, delta) => {
    let avoidV = new Vector(0, 0);
    for (let otherBoid of boids) {
      if (otherBoid !== this) {
        if (distance(this.position, otherBoid.position) < minDistance) {
          let v = this.position.sub(otherBoid.position);
          v = v.normalize().mult(minDistance - v.magnitude());
          avoidV = avoidV.add(v);
        }
      }
    }
    return avoidV;
  }

  scatter = () => {
    let pos = new Vector(cursor.x, cursor.y);
    let d = distance(this.position, cursor);
    if (d < scatterRange) {
      let weight = Math.pow(1 - d / visualRange, 2);
      return this.position.sub(cursor).mult(weight);
    }
    return new Vector(0, 0);
  }

  align = (boids, delta) => {
    let avgVX = 0;
    let avgVY = 0;
    let numNeighbors = 0;

    let meanV = new Vector(0, 0);
    var deltaV = new Vector(0, 0);
  
    for (let otherBoid of boids) {
      let d = distance(this.position, otherBoid.position);
      if (d < visualRange) {
        let weight = Math.pow((visualRange - d) / visualRange, 2);
        meanV = meanV.add(otherBoid.velocity.mult(weight));
        numNeighbors += weight;
      }
    }
  
    if (numNeighbors) {
      return meanV.div(numNeighbors).sub(this.velocity);
    }
    return new Vector(0,0);
  }

  addNoise = () => {
    let v = new Vector(Math.random() - .5, Math.random() - .5);
    return v.normalize().mult(this.velocity.magnitude());
  }

  keepInBounds = (delta) => {
    // TODO:
    let vx = 0;
    let vy = 0;
    if (this.position.x > cvs.width) {
      vx = (cvs.width - this.position.x);
    }
    if (this.position.y > cvs.height) {
      vy = (cvs.height - this.position.y);
    }
    if (this.position.x < 0) {
      vx = -this.position.x;
    }
    if (this.position.y < 0) {
      vy = - this.position.y;
    }
    return new Vector(vx, vy);
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

  var v = new Vector((Math.random() - .5), (Math.random() - .5)).normalize().mult(maxSpeed);

  boidsArray.push(
    new Boid(
      new Vector(Math.random() * cvs.width, Math.random()* cvs.height),
      v
    )
  );
};

let lastTimestamp = null;

// ze Render Loop
function animate(timestamp) {
  let delta = (lastTimestamp) ? (timestamp - lastTimestamp)/1000 : 0;
  lastTimestamp = timestamp;
  requestAnimationFrame(animate);
  c.clearRect(0, 0, window.innerWidth, window.innerHeight);


  // update and draw cursor
  cursor.x = ((cursor.x || 0) + cursorTarget.x) / 2;
  cursor.y = ((cursor.y || 0) + cursorTarget.y) / 2;

  context.beginPath();
  context.arc(cursor.x, cursor.y, 5, 0, 2 * Math.PI);
  context.fill();

  // kick off hand detection in the render loop i suppose
  if (model && !detecting) {
    detecting = true;
    model.detect(video).then(predictions => {
      let score = 0;
      predictions.forEach((p) =>  {
          context.beginPath();
          if (p.score > score) {
            score = p.score;
            cursorTarget.x = p.bbox[0] + p.bbox[2] / 2;
            cursorTarget.y = p.bbox[1] + p.bbox[3] / 2;
          }
      });
      detecting = false;
    });
  }

  // update and draw boids
  boidsArray.forEach(boid => {
    boid.update(boidsArray, delta);
    boid.draw(c);
  })

};


var video = document.querySelector("video");
var canvas = document.querySelector("canvas");
var context = canvas.getContext("2d");

const img = document.getElementById('img');

const modelParams = {
    flipHorizontal: false,  
    maxNumBoxes: 20,
    iouThreshold: 0.5,
    scoreThreshold: 0.6,
}


Promise.all([handTrack.startVideo(video), handTrack.load(modelParams)]).then((values) => {
    model = values[1];
})


requestAnimationFrame(animate);
