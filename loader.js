var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var startTime = Date.now();
var cycleTime = 15000;
var doAnim;

function canAnimate(val) {
    doAnim = val;
    animate();
}

function animate() {

    if (doAnim == true) {
	
	requestAnimationFrame(animate);
	
	var elapsed = Date.now() - startTime;

	var elapsedCycle = elapsed % cycleTime;

	var elapsedPercent = elapsedCycle / cycleTime;

	var radianRotation = Math.PI * 2 * elapsedPercent;

	ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.beginPath();
	ctx.arc(40, 40, 30, -Math.PI / 2, -Math.PI / 2 + radianRotation, false);
	ctx.strokeStyle = "orange";
	ctx.lineWidth = 11.0;
	ctx.stroke();
	
    } else {
	
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	return;
	
    }

}
