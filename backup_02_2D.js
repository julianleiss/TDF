let sliderBehavior, sliderConnectivity;
let container;
// State for smooth interpolation
let jitterX = [];
let jitterY = [];
let currSpeed = [];
const SLIDER_LEN = 200;

function setup() {
  pixelDensity(1);
  frameRate(30);

  // Create a container div for canvas and sliders
  container = createDiv();
  container.id('kaleidoContainer');
  container.style('position', 'relative');
  
  // Create canvas inside the container
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent('kaleidoContainer');
  noFill();
  strokeWeight(1);
  colorMode(HSB, 360, 100, 100, 1);

  // Eje 1: opacidad progresiva de kaleidoscopios (8 en total)
  sliderBehavior = createSlider(0, 1, 0, 0.01);
  sliderBehavior.style('width', `${SLIDER_LEN}px`);
  sliderBehavior.style('transform', 'rotate(-90deg)');
  sliderBehavior.style('transform-origin', 'center center');
  sliderBehavior.position(20, height/2 + SLIDER_LEN/2);
  sliderBehavior.parent('kaleidoContainer');

  // Eje 2: de 1 punto a 30 puntos y conexiones dinámicas
  sliderConnectivity = createSlider(0, 100, 0, 1);
  sliderConnectivity.style('width', `${SLIDER_LEN}px`);
  sliderConnectivity.style('transform', 'rotate(-90deg)');
  sliderConnectivity.style('transform-origin', 'center center');
  sliderConnectivity.position(windowWidth - 20, height/2 - SLIDER_LEN/2);
  sliderConnectivity.parent('kaleidoContainer');

  // Initialize state arrays for 8 kaleidoscopios
  for (let i = 0; i < 8; i++) {
    jitterX[i] = 0;
    jitterY[i] = 0;
    currSpeed[i] = 0;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  sliderBehavior.position(20, height/2 + SLIDER_LEN/2);
  sliderConnectivity.position(windowWidth - 20, height/2 - SLIDER_LEN/2);
}

function draw() {
  background(255);
  translate(width/2, height/2);
  blendMode(MULTIPLY);

  // Lectura de ejes
  let b = sliderBehavior.value();           // controla opacidad de kaleidos
  let c = sliderConnectivity.value() / 100; // controla puntos y conexiones

  // Parámetros básicos
  const R = min(width, height) * 0.3;
  const A = R * 0.2;
  const B = R;
  const tNoise = frameCount * 0.01;

  // Fracción de puntos móviles según Eje 1
  let P_move = 0.8 * (1 - b);

  // Eje 1: siempre 8 kaleidoscopios, con opacidad según b
  const thresholds = [0.10, 0.25, 0.50, 0.50, 0.70, 0.70, 1.00, 1.00];
  const L = thresholds.length;

  // Eased connectivity: smoothstep-style curve
  let pRaw;
  if (c <= 0.5) {
    let t = c / 0.5;
    let t2 = t * t;
    pRaw = lerp(0, 0.3, t2);
  } else {
    let t = (c - 0.5) / 0.5;
    let t2 = 1 - (1 - t) * (1 - t);
    pRaw = lerp(0.3, 1, t2);
  }
  let pConn = pRaw;

  for (let l = 0; l < L; l++) {
    push();

    // Semillas deterministas por capa
    noiseSeed(l + 1);
    randomSeed(l + 1);

    // Cálculo de alpha con fade-in easing
    const fadeRange = 0.05;
    let start = thresholds[l] - fadeRange;
    let end   = thresholds[l] + fadeRange;
    let tAlpha = constrain((b - start) / (end - start), 0, 1);
    let alpha = tAlpha * tAlpha * (3 - 2 * tAlpha);

    // Autonomía de caos
    let autonomy = 1 - b;
    let randScale = random(0.5, 1.5);
    let scaleVal = lerp(1, randScale, autonomy);

    // Suavizado de jitter
    let jitterAmt = autonomy * R * 0.1;
    let targetJx = random(-jitterAmt, jitterAmt);
    let targetJy = random(-jitterAmt, jitterAmt);
    jitterX[l] = lerp(jitterX[l], targetJx, 0.1);
    jitterY[l] = lerp(jitterY[l], targetJy, 0.1);

    // Suavizado de rotación
    let randRot = random(-0.005, 0.005);
    const baseSpeed = 0.002;
    let targetSpeed = lerp(randRot, baseSpeed, b);
    currSpeed[l] = lerp(currSpeed[l], targetSpeed, 0.1);

    // Transformaciones suaves
    rotate(frameCount * currSpeed[l]);
    translate(jitterX[l], jitterY[l]);
    scale(scaleVal);

    // Dibujar líneas en negro con alpha total
    stroke(0, 0, 0, alpha);

    // Generar puntos y posible movimiento puntual
    let Npts = max(1, round(map(c, 0, 1, 1, 30)));
    let pts = [];
    for (let i = 0; i < Npts; i++) {
      let ang = TWO_PI * i / Npts;
      let ampOsc = A * autonomy;
      let ampNoise = B * autonomy;
      let baseR = R + ampOsc * sin(TWO_PI * frameCount / (5 * 60) + i)
                    + ampNoise * (2 * noise(i * 0.1, tNoise) - 1);

      let isMoving = random() < P_move;
      let x = cos(ang) * baseR;
      let y = sin(ang) * baseR;
      if (isMoving) {
        let radiusOffset = map(noise(i * 0.1), 0, 1, -R*0.1, R*0.1);
        let speed = map(noise(i * 0.1, 1), 0, 1, 0.005, 0.02);
        let phase = frameCount * speed;
        x += cos(phase) * radiusOffset;
        y += sin(phase) * radiusOffset;
      }
      pts.push({x, y});
    }

    // Dibujar conexiones según pConn
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        if (random() < pConn) {
          line(pts[i].x, pts[i].y, pts[j].x, pts[j].y);
        }
      }
    }

    // Dibujar puntos en negro con alpha total
    noStroke();
    fill(0, alpha);
    for (let p of pts) {
      ellipse(p.x, p.y, 7, 7);
    }

    pop();
  }

  blendMode(BLEND);
}