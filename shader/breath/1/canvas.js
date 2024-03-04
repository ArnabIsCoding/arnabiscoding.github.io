const canvas = document.querySelector("canvas");
const sandbox = new GlslCanvas(canvas);
sandbox.load(frag);
sandbox.setUniform("displacement", "displacement1.jpg");