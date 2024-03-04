const canvas = document.querySelector("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const sandbox = new GlslCanvas(canvas);
sandbox.load(frag);
sandbox.setUniform("displacement", "displacement.jpeg");