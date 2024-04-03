function setup() {
  createCanvas(windowWidth, windowHeight);
	colorMode(RGB);
}

function draw(){
	// let myArray = ['rgb(127, 108, 150)', 'rgb(157, 176, 229)','rgb(176, 134, 192)','rgb(239, 221, 74)','rgb(241, 191, 72)','rgb(241, 95, 116)','rgb(231, 81, 106)','rgb(18, 60, 198)','rgb(15, 13, 64)'];
	 let myArray = [color(127, 108, 150),color(157, 176, 229),color(176, 134, 192),color(239, 221, 74),color(241, 191, 72),color(241, 95, 116),color(231, 81, 106),color(18, 60, 198),color(15, 13, 64)
  ];
    var x= 0;
  var y=0;
	for(x = 0; x < width; x += 15){
    for(y = 0; y < height; y += 15){
			let hue = myArray[floor(random(myArray.length))];
		fill(hue);
		// noStroke();
      rect(x,y,15,15);
}
}
}
