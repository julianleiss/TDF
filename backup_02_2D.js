let sliderBehavior, sliderConnectivity;
let container;
// State for smooth interpolation
let jitterX = [];
let jitterY = [];
let currSpeed = [];
const SLIDER_LEN = 200;
const SIDEBAR_WIDTH = 100; // Define width for sidebars

function setup() {
  pixelDensity(1);
  frameRate(30);

  // Create a container div for the entire layout
  container = createDiv();
  container.id('kaleidoContainer');
  container.style('position', 'relative');
  container.style('width', '100vw');
  container.style('height', '100vh');
  container.style('overflow', 'hidden');

  // Create left sidebar for sliderBehavior
  let leftSidebar = createDiv();
  leftSidebar.id('leftSidebar');
  leftSidebar.parent('kaleidoContainer');
  leftSidebar.style('position', 'absolute');
  leftSidebar.style('left', '0px');
  leftSidebar.style('top', '0px');
  leftSidebar.style('width', `${SIDEBAR_WIDTH}px`);
  leftSidebar.style('height', '100%');
  leftSidebar.style('display', 'flex');
  leftSidebar.style('justify-content', 'center');
  leftSidebar.style('align-items', 'center');

  // Create right sidebar for sliderConnectivity
  let rightSidebar = createDiv();
  rightSidebar.id('rightSidebar');
  rightSidebar.parent('kaleidoContainer');
  rightSidebar.style('position', 'absolute');
  rightSidebar.style('right', '0px');
  rightSidebar.style('top', '0px');
  rightSidebar.style('width', `${SIDEBAR_WIDTH}px`);
  rightSidebar.style('height', '100%');
  rightSidebar.style('display', 'flex');
  rightSidebar.style('justify-content', 'center');
  rightSidebar.style('align-items', 'center');

  // Create central content area for canvas and future forms
  let centralContent = createDiv();
  centralContent.id('centralContent');
  centralContent.parent('kaleidoContainer');
  centralContent.style('position', 'absolute');
  centralContent.style('left', `${SIDEBAR_WIDTH}px`);
  centralContent.style('top', '0px');
  centralContent.style('width', `${windowWidth - 2 * SIDEBAR_WIDTH}px`);
  centralContent.style('height', '100%');
  centralContent.style('display', 'flex');
  centralContent.style('justify-content', 'center');
  centralContent.style('align-items', 'center');
  
  // Create canvas inside the central content area
  let cnv = createCanvas(windowWidth - 2 * SIDEBAR_WIDTH, windowHeight);
  cnv.parent('centralContent');
  cnv.style('display', 'block'); // Remove extra space below canvas
  noFill();
  strokeWeight(1);
  colorMode(HSB, 360, 100, 100, 1);

  // Placeholder for forms (can be expanded later)
  let formsContainer = createDiv('');
  formsContainer.parent('centralContent');
  formsContainer.style('position', 'absolute');
  formsContainer.style('top', '10px'); // Adjust as needed
  formsContainer.style('left', '10px'); // Adjust as needed
  formsContainer.style('color', 'white'); // For visibility if background is dark
  formsContainer.style('z-index', '10'); // Ensure it's above canvas
  formsContainer.style('background-color', 'rgba(0,0,0,0.5)');
  formsContainer.style('padding', '10px');
  formsContainer.style('border-radius', '5px');

  // Eje 1: opacidad progresiva de kaleidoscopios (8 en total)
  sliderBehavior = createSlider(0, 1, 0, 0.01);
  sliderBehavior.style('width', `${SLIDER_LEN}px`);
  sliderBehavior.style('transform', 'rotate(-90deg)');
  sliderBehavior.style('transform-origin', 'center center');
  sliderBehavior.parent('leftSidebar');

  // Eje 2: de 1 punto a 30 puntos y conexiones dinámicas
  sliderConnectivity = createSlider(0, 100, 0, 1);
  sliderConnectivity.style('width', `${SLIDER_LEN}px`);
  sliderConnectivity.style('transform', 'rotate(-90deg)');
  sliderConnectivity.style('transform-origin', 'center center');
  sliderConnectivity.parent('rightSidebar');

  // Initialize state arrays for 8 kaleidoscopios
  for (let i = 0; i < 8; i++) {
    jitterX[i] = 0;
    jitterY[i] = 0;
    currSpeed[i] = 0;
  }
}

function windowResized() {
  let newCanvasWidth = windowWidth - 2 * SIDEBAR_WIDTH;
  let newCanvasHeight = windowHeight;

  // Update centralContent width and position
  let centralContentDiv = select('#centralContent');
  centralContentDiv.style('width', `${newCanvasWidth}px`);
  centralContentDiv.style('height', `${newCanvasHeight}px`);
  centralContentDiv.style('left', `${SIDEBAR_WIDTH}px`);

  // Resize canvas
  resizeCanvas(newCanvasWidth, newCanvasHeight);
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
