/*
  Dezembro de 2020
  Catarina Teixeira, up201805042
  Cheila Alves, up201805089 
*/

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var startTime = Date.now();
var cycleTime = 120000;
var doAnim;

// dirá se a animação da contagem do tempo de jogada poderá ocorrer
// reinicia a contagem do tempo de jogada
function canAnimate(val) {
    doAnim = val;
    startTime = Date.now();
    animate();
}

function animate() {

    if (doAnim == true) {

	// chama recursivamente a animação
	requestAnimationFrame(animate);
	
	var elapsed = Date.now() - startTime;

	var elapsedCycle = elapsed % cycleTime;

	var elapsedPercent = elapsedCycle / cycleTime;

	var radianRotation = Math.PI * 2 * elapsedPercent;

	ctx = canvas.getContext("2d"); // retorna um contexto de desenho no canvas
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.beginPath(); // começa um caminho ou reinicia-o
	ctx.arc(40, 40, 30, -Math.PI / 2, -Math.PI / 2 + radianRotation, false);
	ctx.strokeStyle = "orange";
	ctx.lineWidth = 11.0;
	ctx.stroke(); // desenha o caminho definido pelo lineWidth()
	
    } else {

	// se a animação não poder ocorrer limpa a animação
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	return;
	
    }

}
