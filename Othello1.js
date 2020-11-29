/*
  Outubro de 2020
  Catarina Teixeira, up201805042
  Cheila Alves, up201805089 
*/

/*
  mostra inicialmente o bloco de autenticação e depois da inserção dos dados pedidos (identificador, password)
  e o posterior clique do botão 'LOGIN', esse mesmo bloco desaparece, é mostrado as opçoes de jogo
*/
var humano;
var computador;
var dificuldade;

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var successfulLog;
async function areaAutenticacao() {

    computador = undefined;
    
    let user = document.getElementById("username");
    let pass = document.getElementById("password");

    // verifica se ambos os campos USERNAME e PASSWORD estão preenchidos para prosseguir com o registo/login
    if (user.value.length != 0 && pass.value.length != 0) {
	
	// regista o registo/login no servidor
	await register(user.value, pass.value);

	// se foi efetuado um registo inválido, o registo só prossegue quando tal deixa de acontecer
	if (successfulLog == true) {
	    
	    document.getElementById("form").style.display="none";
	    document.getElementById("login").style.display="none";
	    twoPlayers(user.value, pass.value);
	    await ranking();
	    document.getElementById("ranking").style.display="block";
	    area_de_jogo();
	    
	}
	
    }
    
}

function area_de_jogo() {

    document.body.style.backgroundImage = "url('Cu1aLQb.gif')";
    document.getElementById("area-logotipo").style.display="block";
    document.getElementById("area-de-jogo").style.display="block";
    document.getElementById("container").style.display="block";
    document.getElementById("pontuacao").style.display="block";
    document.getElementById("passar").style.display="block";
    document.getElementById("desistir").style.display="block";
    document.getElementById("logout").style.display="block";
    document.getElementById("vezJogada").style.display="block";
    jogadorAtual = 'dark';
    vezJogada();
    
    criar_tabuleiro(); // depois das escolhas o jogo começa
    
}

// função que expõe as opções de jogo (cor e nivel de dificuldade) para o jogador escolher
function mostrarOps() {

    document.getElementById("form").style.display="none";
    document.getElementById("login").style.display="none";
    document.getElementById("op-jogo").style.display="block";
    document.getElementById("continue").style.display="block";
    
}

/*
  quando se clica no botao continuar nas op de jogo, essa pagina fecha e é mostrado o tabuleiro,
  accordion, botoes de passar, novo jogo, logout, pontuaçao e o nosso logo e ai começa se a jogar
*/
function escolhaOp() {

    // só prossegue se forem selecionadas as escolhas
    if ((document.getElementById("preto").checked || document.getElementById("branco").checked)
	&& (document.getElementById("facil").checked || document.getElementById("medio").checked
	    || document.getElementById("dificil").checked)) {
	
	document.getElementById("op-jogo").style.display="none";
	document.getElementById("continue").style.display="none";

	if (document.getElementById("preto").checked) {
	    humano = 'dark';
	    computador = 'light';
	} 

	if (document.getElementById("medio").checked) {
	    dificuldade = 2;
	} else if (document.getElementById("dificil").checked) {
	    dificuldade = 3;
	}
	
	area_de_jogo();
	
    }
    
}

/* Para a animaçao do menu accordion */
var accordions = document.getElementsByClassName("accordion");
for(var i=0;i<accordions.length;i++){
    
    accordions[i].onclick = function() {
	
	this.classList.toggle('is-open');
	var content= this.nextElementSibling;

	if(content.style.maxHeight){
	    //accordion está aberto, temos de fechar
	    content.style.maxHeight = null;
	} else {
	    //está fechado
	    content.style.maxHeight=content.scrollHeight + "px";
	}
	
    }
    
}

var areaDeJogo;
var areaLogotipo;
var logo;
var conteudo;
var tabuleiro;
var molduraTabuleiro;
var pecasJogadorB;
var pecasJogadorP;
var jogadorAtual; // jogador que inicia o jogo

var fimJogada; // variável global que indicará o fim da propagação de cada jogada

window.onload = function() {
    init();
}

function init() {

    // possivel jogo anterior
    document.getElementById("msgFimJogo").style.display = "none";
    document.getElementById("ranking").style.display="none";
    document.getElementById("ranking").innerHTML='';
    document.getElementById("area-logotipo").style.display="none";
    document.getElementById("area-de-jogo").style.display="none";
    document.getElementById("container").style.display="none";
    document.getElementById("pontuacao").style.display="none";
    document.getElementById('ppreto').innerHTML = 'Preto: 2';
    document.getElementById('pbranco').innerHTML = 'Branco: 2';
    document.getElementById('clivre').innerHTML = 'Livres: 60';
    document.getElementById("passar").style.display="none";
    document.getElementById("desistir").style.display="none";
    document.getElementById("logout").style.display="none";
    document.getElementById("vezJogada").style.display="none";
    document.getElementById("vezJogada").innerHTML="Vez do preto";

    // remove toda a área de jogo do jogo anterior, se houve
    areaDeJogo = document.getElementById('area-de-jogo');
    while (areaDeJogo.firstChild) { areaDeJogo.removeChild(areaDeJogo.lastChild); }
    areaLogotipo = document.getElementById('area-logotipo');
    while (areaLogotipo.firstChild) { areaLogotipo.removeChild(areaLogotipo.lastChild); }

    // inicialização de variáveis
    humano = 'light';
    computador = 'dark';
    dificuldade = 1;

    // reset das escolhas feitas anteriormente
    document.getElementById("preto").checked = false;
    document.getElementById("branco").checked = false;
    document.getElementById("facil").checked = false;
    document.getElementById("medio").checked = false;
    document.getElementById("dificil").checked = false;

    // retorno do formulário
    document.body.style.backgroundImage = "url('giphy.gif')";
    document.getElementById("form").style.display="block";
    document.getElementById("login").style.display="block";
    document.getElementById("op-jogo").style.display="none";
    document.getElementById("continue").style.display="none";
    
    conteudo = [ ['empty','empty','empty','empty','empty','empty','empty', 'empty'],
		 ['empty','empty','empty','empty','empty','empty','empty', 'empty'],
		 ['empty','empty','empty','empty','empty','empty','empty', 'empty'],
		 ['empty','empty','empty','light','dark','empty','empty', 'empty'],
		 ['empty','empty','empty','dark','light','empty','empty', 'empty'],
		 ['empty','empty','empty','empty','empty','empty','empty', 'empty'],
		 ['empty','empty','empty','empty','empty','empty','empty', 'empty'],
		 ['empty','empty','empty','empty','empty','empty','empty', 'empty']
	       ];
    pecasJogadorB = [];
    pecasJogadorP = [];
    jogadorAtual = 'dark'; 
    fimJogada = false;

    logo = document.createElement('div');
    logo.setAttribute('id','logotipo');
    molduraTabuleiro = document.createElement('div');
    molduraTabuleiro.setAttribute('class','molduraTabuleiro');
    tabuleiro = document.createElement('div');
    tabuleiro.className = 'tabuleiro';
    document.getElementById("desistir").addEventListener("click", desistir);
    
}

function criar_tabuleiro() {

    areaLogotipo.appendChild(logo);
    areaDeJogo.appendChild(molduraTabuleiro);
    molduraTabuleiro.appendChild(tabuleiro);
    
    var hor_escala = 64.8;
    var ver_escala = 64.4;
    for(let i=0; i<64; i++) {
	// Math.floor irá arredondar as coordenadas para baixo para o inteiro mais próximo
	let x = Math.floor(i % 8);
	let y = Math.floor(i / 8);
	let casaNova = document.createElement('div');
	casaNova.setAttribute('id', 'casa' + x + '_' + y);
	var TOP = Math.round(x * hor_escala);
	var ESQ = Math.round(y * ver_escala +2);
 	casaNova.setAttribute('style', 'left:' + ESQ + 'px; top:' + TOP + 'px;');
	casaNova.setAttribute("onclick", "processarJogada(" + i + ")");
	/*
	  o método appendChild associará cada casa com as coordenadas (x,y) à sua respetiva 
	  posição no tabuleiro que foi obtida através dos cálculos das variáveis TOP e ESQ
	*/
	tabuleiro.appendChild(casaNova);

	// distribuição inicial do jogo
	if ((x == 3 && y == 3) || (x == 4 && y == 4)) {

	    let peca = document.createElement("div");
	    peca.setAttribute('class', 'peca pecaBRANCA');
	    casaNova.appendChild(peca); // a peça fica associada à casaNova
	    pecasJogadorB.push(i); // armazena a posição da peça inicial
	    
	} else if ((x == 4 && y == 3) || (x == 3 && y == 4)) {

	    let peca = document.createElement("div");
	    peca.setAttribute('class', 'peca pecaPRETA');
	    casaNova.appendChild(peca); // a peça fica associada à casaNova
	    pecasJogadorP.push(i); // armazena a posição da peça inicial
	    
	}
    }

    if(computador != undefined && jogadorAtual == computador) {

	let pos = melhorJogada();
	setTimeout(processarJogada, 3000, pos);
	updatePont();
	
    }
}

/* movimentos horizontais possíveis */
function verificarJogadasHor(player, cont) {
    
    let jogadas = [];
    let pecasJogador = pecasJogadorB;
    let pecaAdversario = 'dark';
    if(player == 'dark') {
	pecasJogador = pecasJogadorP;
	pecaAdversario = 'light';
    }

    for(let i=0; i<pecasJogador.length; i++) {
	let pos = pecasJogador[i];
	// conversão dos indices unidimensionais para bidimensionais
	let x_pos = Math.floor(pos % 8);
	let y_pos = Math.floor(pos / 8);	    

	// Horizontal DEPOIS da peça do jogador que se encontra na posição i
	for (let y = y_pos+1; y < 8; y++) {

	    // conversão indice bidimensional para unidimensional
	    // como estamos a tratar da variante horizontal, o único elemento que varia é o y
	    // sendo, portanto, o x_pos constante
	    let j = x_pos + y * 8; 
	    
	    if (cont[x_pos][y] == player) { // se o jogador se der com uma peça sua então a jogada j não é possível
		
		break;
		
	    } else if (cont[x_pos][y] == pecaAdversario) { // ciclo continua enquanto forem encontradas peças do adversário

		continue;
		
	    } else { // quando é encontrada uma casa livre

		// se ficar garantido que a casa anterior contém uma peça do adversário
		if (y >= y_pos + 2 && cont[x_pos][y-1] == pecaAdversario) {
		    // HE -> a jogada é propagada na HORIZONTAL para a ESQUERDA até ir de encontro a outra peça do jogador
		   jogadas.push([j, "HE"]); 
		}
		break;
	    }
	}

	// Horizontal ANTES da peça do jogador que se encontra na posição i
	for (let y = y_pos-1; y >= 0; y--) {

	    // conversão indice bidimensional para unidimensional
	    // como estamos a tratar da variante horizontal, o único elemento que varia é o y
	    // sendo, portanto, o x_pos constante
	    let j = x_pos + y * 8; 
	    
	    if (cont[x_pos][y] == player) { // se o jogador se der com uma peça sua então a jogada j não é possível
		
		break;
		
	    } else if (cont[x_pos][y] == pecaAdversario) { // ciclo continua enquanto forem encontradas peças do adversário
		
		continue;
		
	    } else { // quando é encontrada uma casa livre

		// se ficar garantido que a casa anterior contém uma peça do adversário
		if (y <= y_pos - 2 && cont[x_pos][y+1] == pecaAdversario) {
		    // HD -> a jogada é propagada na HORIZONTAL para a DIREITA até ir de encontro a outra peça do jogador
		    jogadas.push([j, "HD"]);	
		}
		break;
	    }
	}
	
    }

    return jogadas;
    
}

/* jogadas verticais possiveis */
function verificarJogadasVer(player, cont) {
    
    let jogadas = [];
    let pecasJogador = pecasJogadorB;
    let pecaAdversario = 'dark';
    if(player == 'dark') {
	pecasJogador = pecasJogadorP;
	pecaAdversario = 'light';
    }
    
    for(let i=0; i<pecasJogador.length; i++) {
	
	let pos = pecasJogador[i];
	// conversão dos indices unidimensionais para bidimensionais
	let x_pos = Math.floor(pos % 8);
	let y_pos = Math.floor(pos / 8);	    

	// Vertical DEPOIS da peça do jogador que se encontra na posição i
	for (let x = x_pos+1; x < 8; x++) {

	    // conversão indice bidimensional para unidimensional
	    // como estamos a tratar da variante vertical, o único elemento que varia é o x
	    // sendo, portanto, o y_pos constante
	    let j = x + y_pos * 8;
	    
	    if (cont[x][y_pos] == player) { // se o jogador se der com uma peça sua então a jogada j não é possível
		
		break;
		
	    } else if (cont[x][y_pos] == pecaAdversario) { // ciclo continua enquanto forem encontradas peças do adversário
		
		continue;
		
	    } else { // quando é encontrada uma casa livre

		// se ficar garantido que a casa anterior contém uma peça do adversário
		if (x >= x_pos + 2 && cont[x-1][y_pos] == pecaAdversario) {
		    // VC -> a jogada é propagada na VERTICAL para CIMA até ir de encontro a outra peça do jogador
		     jogadas.push([j, "VC"]);
		}
		break;
	    }
	}

	// Vertical ANTES da peça do jogador que se encontra na posição i
	for (let x = x_pos-1; x >= 0; x--) {

	    // conversão indice bidimensional para unidimensional
	    // como estamos a tratar da variante vertical, o único elemento que varia é o x
	    // sendo, portanto, o y_pos constante
	    let j = x + y_pos * 8;
	    
	    if (cont[x][y_pos] == player) { // se o jogador se der com uma peça sua então a jogada j não é possível
		
		break;
		
	    } else if (cont[x][y_pos] == pecaAdversario) { // ciclo continua enquanto forem encontradas peças do adversário
		
		continue;
		
	    } else { // quando é encontrada uma casa livre

		// se ficar garantido que a casa anterior contém uma peça do adversário
		if (x <= x_pos - 2 && cont[x+1][y_pos] == pecaAdversario) {
		    // VB -> a jogada é propagada na VERTICAL para BAIXO até ir de encontro a outra peça do jogador
		    jogadas.push([j, "VB"]);
		}
		break;		
	    }
	}
	
    }
    
    return jogadas;
    
}

/* jogadas possiveis na diagonal */
function verificarJogadasDiag(player, cont) {
    
    let jogadas = [];

    let pecasJogador = pecasJogadorB;
    let pecaAdversario = 'dark';
    if(player == 'dark') {
	pecasJogador = pecasJogadorP;
	pecaAdversario = 'light';
    }

    for(let i=0; i<pecasJogador.length; i++) {
	let pos = pecasJogador[i];
	// conversão dos indices unidimensionais para bidimensionais
	let x_pos = Math.floor(pos % 8);
	let y_pos = Math.floor(pos / 8);

	// parte inferior direita
	for(let x=x_pos+1, y=y_pos+1; x<8 && y<8; x++, y++) {

	    // conversão indice bidimensional para unidimensional
	    // na diagonal, tanto o x como o y variam 
	    let j = x + y * 8;
	    
	    if (cont[x][y] == player) { // se o jogador se der com uma peça sua então a jogada j não é possível
		
		break;
		
	    } else if (cont[x][y] == pecaAdversario) { // ciclo continua enquanto forem encontradas peças do adversário
		
		continue;
		
	    } else { // quando é encontrada uma casa livre

		// se ficar garantido que a casa anterior contém uma peça do adversário
		if (x >= x_pos + 2 && y >= y_pos + 2 && cont[x-1][y-1] == pecaAdversario) {
		    // SE -> a jogada é propagada na diagonal SUPERIOR ESQUERDA da peça colocada
		    // até a outro extremo que contenha outra peça do jogador
		    jogadas.push([j, "SE"]);
		} 

		break;
		
	    } 
	}

	// parte inferior esquerda
	for(let x=x_pos+1, y=y_pos-1; x<8 && y>=0; x++, y--) {

	    // conversão indice bidimensional para unidimensional
	    // na diagonal, tanto o x como o y variam 
	    let j = x + y * 8;
	    
	    if (cont[x][y] == player) { // se o jogador se der com uma peça sua então a jogada j não é possível
		
		break;
		
	    } else if (cont[x][y] == pecaAdversario) {  // ciclo continua enquanto forem encontradas peças do adversário
		
		continue;
		
	    } else { // quando é encontrada uma casa livre

		// se ficar garantido que a casa anterior contém uma peça do adversário
		if (x >= x_pos + 2 && y <= y_pos - 2 && cont[x-1][y+1] == pecaAdversario) {
		    // SD -> a jogada é propagada na diagonal SUPERIOR DIREITA da peça colocada
		    // até ao outro extremo que contenha outra peça do jogador
		    jogadas.push([j, "SD"]); 
		} 
		break;
	    }
	}
	
	// parte superior esquerda
	for(let x=x_pos-1, y=y_pos-1; x>=0 && y>=0; x--, y--) {

	    // conversão indice bidimensional para unidimensional
	    // na diagonal, tanto o x como o y variam 
	    let j = x + y * 8;
	    
	    if (cont[x][y] == player) { // se o jogador se der com uma peça sua então a jogada j não é possível
		
		break;
		
	    } else if (cont[x][y] == pecaAdversario) { // ciclo continua enquanto forem encontradas peças do adversário
		
		continue;
		
	    } else { // quando é encontrada uma casa livre

		// se ficar garantido que a casa anterior contém uma peça do adversário
		if (x <= x_pos - 2 && y <= y_pos - 2 && cont[x+1][y+1] == pecaAdversario) {
		    // ID -> a jogada é propagada na diagonal INFERIOR DIREITA da peça colocada
		    // até a outro extremo que contenha outra peça do jogador
		    jogadas.push([j, "ID"]);
		}
		break;
	    }
	}

	// parte superior direita
	for(let x=x_pos-1, y=y_pos+1; x>=0 && y<8; x--, y++) {

	    // conversão indice bidimensional para unidimensional
	    // na diagonal, tanto o x como o y variam 
	    let j = x + y * 8;
	    
	    if (cont[x][y] == player) { // se o jogador se der com uma peça sua então a jogada j não é possível
		
		break;
		
	    } else if (cont[x][y] == pecaAdversario) { // ciclo continua enquanto forem encontradas peças do adversário
		
		continue;
		
	    } else { // quando é encontrada uma casa livre
		
		// se ficar garantido que a casa anterior contém uma peça do adversário
		if (x <= x_pos - 2 && y >= y_pos + 2 && cont[x+1][y-1] == pecaAdversario) {
		    // IE -> a jogada é propagada na diagonal INFERIOR ESQUERDA da peça colocada
		    // até a outro extremo que contenha outra peça do jogador
		    jogadas.push([j, "IE"]);

		} 
		break;
	    }
	}
    }

    return jogadas;
    
}

/*
  -- verificará que posições o jogador pode optar por jogar tendo em conta a sua cor;
  -- retornará um array que contém elementos do tipo [ posição, direção ] em que "direção" refere-se à direção 
  em que são propagadas as viragens das peças do adversário
*/
function possiveisJogadas(player, cont) {

    let hor = verificarJogadasHor(player, cont);
    let ver = verificarJogadasVer(player, cont);
    let diag = verificarJogadasDiag(player, cont);

    return hor.concat(ver, diag);
    
}

/*
  -- se na posição dada, houver uma peça do jogador que esteja na sua vez de jogar então a troca das peças adversárias cessa;
  -- regista a jogada do jogador;
  -- mostra a jogada no tabuleiro
*/
function trocarPeca(pos, cor) {

    let x = Math.floor(pos % 8);
    let y = Math.floor(pos / 8);

    if (computador != undefined) {
	// quando se encontrar o outro extremo da peça jogada então cessa a troca de peças do adversário para o jogador
	if (conteudo[x][y] == cor) { fimJogada = true; return; }

	// regista a jogada do jogador no array da disposição das peças
	conteudo[x][y] = cor;
    }

    // visualização da jogada do jogador
    let peca = document.createElement("div");
    if (cor == 'light') {
	
	peca.setAttribute('class', 'peca pecaBRANCA');
	pecasJogadorB.push(pos);
	for(let i=0; i<pecasJogadorP.length; i++) { // retira a peça do adversário que estava na posição pos
	    if (pecasJogadorP[i] == pos) { pecasJogadorP.splice(i, 1); }
	}
	
    } else {

	peca.setAttribute('class', 'peca pecaPRETA');
	pecasJogadorP.push(pos);
	for(let i=0; i<pecasJogadorB.length; i++) { // retira a peça do adversário que estava na posição pos
	    if (pecasJogadorB[i] == pos) { pecasJogadorB.splice(i, 1); }
	}
	
	
    }

    let casa = document.getElementById('casa' + x + '_' + y);
    // retira a peça que estava na casa para que seja colocada a peça do jogador atual
    if (casa.hasChildNodes()) {
	while (casa.firstChild) {
	    casa.removeChild(casa.lastChild);
	}
    }

    // adiciona peça do jogador atual
    casa.appendChild(peca);
    
}

var buttonPressed = false;
var canProceed = false;
// partindo da peça que foi colocada na posição pos troca-se a cor das peças do adversario que se seguem a essa peça
async function processarJogada(pos) {

    let X = Math.floor(pos % 8);
    let Y = Math.floor(pos / 8);

    buttonPressed = false;

    esconderMsg(); // retira a mensagem "JOGADA IMPOSSIVEL"

    // jogador não pode jogar onde já houver uma peça colocada
    if (conteudo[X][Y] !== 'empty') {
	msgJogImp();
	return;
    }
    
    if (computador != undefined) {
	
	let jogadasPossiveis = possiveisJogadas(jogadorAtual, conteudo);
	console.log(jogadasPossiveis);

	if(!contem(jogadasPossiveis,pos)) {
	    msgJogImp();
	    return;
	}
	
	let jogadasPossiveisAdversario = possiveisJogadas(humano, conteudo);
	if (jogadorAtual == humano) { jogadasPossiveisAdversario = possiveisJogadas(computador, conteudo); }
	
	let dir = [];
	
	// obter as direções da propagação da jogada na posição pos
	for(let i=0; i<jogadasPossiveis.length; i++) {
	    if(jogadasPossiveis[i][0] === pos) {
		dir.push(jogadasPossiveis[i][1]);
	    }
	}

	trocarPeca(pos, jogadorAtual); // coloca a peça na casa selecionada pelo jogador na jogada
	for(let i=0; i<dir.length; i++) {
	    switch(dir[i]) {
	    case 'HE': // propagação na HORIZONTAL ANTES da peça colocada
		for(let j=Y-1; j>=0; j--) {
		    let ind = X + j * 8;
		    trocarPeca(ind, jogadorAtual);
		    if (fimJogada) { break; }
		}
		break;
	    case 'HD': // propagação na HORIZONTAL DEPOIS da peça colocada
		for(let j=Y+1; j<8; j++) {
		    let ind = X + j * 8;
		    trocarPeca(ind, jogadorAtual);
		    if (fimJogada) { break; }
		}
		break;
	    case 'VC': // propagação na VERTICAL para CIMA da peça colocada
		for(let j=X-1; j>=0; j--) {
		    let ind = j + Y * 8;
		    trocarPeca(ind, jogadorAtual);
		    if (fimJogada) { break; }
		}
		break;
	    case 'VB': // propagação na VERTICAL para BAIXO da peça colocada
		for(let j=X+1; j<8; j++) {
		    let ind = j + Y * 8;
		    trocarPeca(ind, jogadorAtual);
		    if (fimJogada) { break; }
		}
		break;
	    case 'IE': // propagação na DIAGONAL INFERIOR ESQUERDA da peça colocada
		for(let j=X+1, k=Y-1; j<8 && k>=0; j++, k--) {
		    let ind = j + k * 8;
		    trocarPeca(ind, jogadorAtual);
		    if (fimJogada) { break; }
		}
		break;
	    case 'ID': // propagação na DIAGONAL INFERIOR DIREITA da peça colocada
		for(let j=X+1, k=Y+1; j<8 && k<8; j++, k++) {
		    let ind = j + k * 8;
		    trocarPeca(ind, jogadorAtual);
		    if (fimJogada) { break; }
		}
		break;
	    case 'SE': // propagação na DIAGONAL SUPERIOR ESQUERDA da peça
		for(let j=X-1, k=Y-1; j>=0 && k>=0; j--, k--) {
		    let ind = j + k * 8;
		    trocarPeca(ind, jogadorAtual);
		    if (fimJogada) { break; }
		}
		break;
	    case 'SD': // propagação na DIAGONAL SUPERIOR DIREITA da peça
		for(let j=X-1, k=Y+1; j>=0 && k<8; j--, k++) {
		    let ind = j + k * 8;
		    trocarPeca(ind, jogadorAtual);
		    if (fimJogada) { break; }
		}
		break;
	    default:
		break;
	    }
	    fimJogada = false; // reset da variável global
	}

	
	if (jogadorAtual == humano) {

	    jogadasPossiveis = possiveisJogadas(humano, conteudo);
	    jogadasPossiveisAdversario = possiveisJogadas(computador, conteudo);

	    if (jogadasPossiveis.length == 0 && jogadasPossiveisAdversario.length == 0) {
		fimJogo();
	    } else if (jogadasPossiveisAdversario.length > 0) {
		// troca de jogador se o adversário tiver jogadas possíveis depois da jogada do jogador
		jogadorAtual = (jogadorAtual == 'light'?'dark':'light');
	    }
	    
	} else {

	    jogadasPossiveis = possiveisJogadas(computador, conteudo);
	    jogadasPossiveisAdversario = possiveisJogadas(humano, conteudo);
	    
	    if (jogadasPossiveis.length == 0 && jogadasPossiveisAdversario.length == 0) {
		fimJogo();
	    } else if (jogadasPossiveisAdversario.length > 0) {
		// troca de jogador se o adversário tiver jogadas possíveis depois da jogada do jogador
		jogadorAtual = (jogadorAtual == 'light'?'dark':'light');
	    } else if (jogadasPossiveisAdversario.length == 0) {
		
		jogadorAtual = (jogadorAtual == 'light'?'dark':'light');
		vezJogada();
		setTimeout(msgSemJogadas,1000);
		passar();
		
	    }
	    
	}

	vezJogada();
	updatePont();
	
	if(jogadorAtual == computador) {

	    let pos = melhorJogada();
	    setTimeout(processarJogada, 2000, pos);
	    
	}
	
    } else {

	// se não for a vez do jogador, não faz nada
	if (jogadorAtual != colorPlayer) return;
	
	let move = '{\"row\": ' + X + ', \"column\": ' + Y + '}';
	let user = document.getElementById("username").value;
	let pass = document.getElementById("password").value;
	await notify(user,pass,gameReference,move); // notifica o jogador da jogada
	if (!canProceed) { // se a jogada não for possivel
	    msgJogImp();
	    return;
	}
    }
    
}

function passar() {
    
    const passar = document.getElementById("passar");
    passar.style.backgroundColor = "#6495ED"; // mudança de cor do botão "Passar"
    
    var listener = function() {
	jogadorAtual = (jogadorAtual == 'light'?'dark':'light'); // troca de jogador
	vezJogada();
	passar.style.backgroundColor = "#DC143C"; // o botão retorna a cor que tinha inicialmente
	esconderMsg(); // msg "sem jogadas possiveis" desaparece
	buttonPressed = true;
	setTimeout(processarJogada, 2000, melhorJogada());
	passar.removeEventListener("click", listener);
    }
    
    passar.addEventListener("click", listener);
    esperar();
    
}

function esperar() {
    if (!buttonPressed)
	setTimeout(esperar, 2500);
}

// atualiza o quadro das pontuações à medida que são feitas as jogadas
function updatePont() {

    let pecasBrancas = document.getElementById("pbranco");
    let pecasPretas = document.getElementById("ppreto");
    let casasLivres = document.getElementById("clivre");
    let pontIA, pontHuman, livres;

    if (computador != undefined) {
	
	if (computador == 'dark') {
	    
	    pontIA = pecasJogadorP.length;
	    pontHuman = pecasJogadorB.length;
	    pecasPretas.innerHTML = 'Preto: ' + pontIA;
	    pecasBrancas.innerHTML = 'Branco: ' + pontHuman;
	    
	} else {
	    
	    pontIA = pecasJogadorB.length;
	    pontHuman = pecasJogadorP.length;
	    pecasPretas.innerHTML = 'Preto: ' + pontHuman;
	    pecasBrancas.innerHTML = 'Branco: ' + pontIA;
	    
	}
	
	livres = 8*8 - pontIA - pontHuman;
	
    } else {

	let dark = data.count.dark;
	let light = data.count.light;
	pecasPretas.innerHTML = 'Preto: ' + dark;
	pecasBrancas.innerHTML = 'Branco: ' + light;
	livres = 8*8 - dark - light;
	
    }
    
    casasLivres.innerHTML = 'Livres: ' + livres;
    
}

// retorna uma cópia do tabuleiro dado como argumento
function copiaTab(cont) {
    
    const tmpCont = [];
    for(let i=0; i<cont.length; i++) {
	tmpCont[i] = [...cont[i]];
    }

    return tmpCont;
    
}

// processa jogadas temporárias para obtenção dos possíveis estados do tabuleiro (efeitos de avaliação para o minimax)
function processarJogadaInterna(vezJogador, cont, pos) {

    let tmpConteudo = copiaTab(cont);

    let X = Math.floor(pos % 8);
    let Y = Math.floor(pos / 8);

    let jogadas = possiveisJogadas(vezJogador, cont);

    let dir = [];
    
    // obter as direções da propagação da jogada na posição pos
    for(let i=0; i<jogadas.length; i++) {
	if(jogadas[i][0] == pos) {
	    dir.push(jogadas[i][1]);
	}
    }

    tmpConteudo[X][Y] = vezJogador; // coloca a peça na posição selecionada pelo jogador atual
    for(let i=0; i<dir.length; i++) {
	switch(dir[i]) {
	case 'HE': // propagação na HORIZONTAL ANTES da peça colocada
	    for(let j=Y-1; j>=0; j--) {
		if (tmpConteudo[X][j] == vezJogador) { break; } // quando encontrar o extremo da jogada (peça igual à do jogador)
		tmpConteudo[X][j] = vezJogador; 
	    }
	    break;
	case 'HD': // propagação na HORIZONTAL DEPOIS da peça colocada
	    for(let j=Y+1; j<8; j++) {
		if (tmpConteudo[X][j] == vezJogador) { break; } // quando encontrar o extremo da jogada (peça igual à do jogador)
		tmpConteudo[X][j] = vezJogador; 
	    }
	    break;
	case 'VC': // propagação na VERTICAL para CIMA da peça colocada
	    for(let j=X-1; j>=0; j--) {
		if (tmpConteudo[j][Y] == vezJogador) { break; } // quando encontrar o extremo da jogada (peça igual à do jogador)
		tmpConteudo[j][Y] = vezJogador; 
	    }
	    break;
	case 'VB': // propagação na VERTICAL para BAIXO da peça colocada
	    for(let j=X+1; j<8; j++) {
		if (tmpConteudo[j][Y] == vezJogador) { break; } // quando encontrar o extremo da jogada (peça igual à do jogador)
		tmpConteudo[j][Y] = vezJogador; 
	    }
	    break;
	case 'IE': // propagação na DIAGONAL INFERIOR ESQUERDA da peça colocada
	    for(let j=X+1, k=Y-1; j<8 && k>=0; j++, k--) {
		if (tmpConteudo[j][k] == vezJogador) { break; } // quando encontrar o extremo da jogada (peça igual à do jogador)
		tmpConteudo[j][k] = vezJogador; 
	    }
	    break;
	case 'ID': // propagação na DIAGONAL INFERIOR DIREITA da peça colocada
	    for(let j=X+1, k=Y+1; j<8 && k<8; j++, k++) {
		if (tmpConteudo[j][k] == vezJogador) { break; } // quando encontrar o extremo da jogada (peça igual à do jogador)
		tmpConteudo[j][k] = vezJogador; 
	    }
	    break;
	case 'SE': // propagação na DIAGONAL SUPERIOR ESQUERDA da peça
	    for(let j=X-1, k=Y-1; j>=0 && k>=0; j--, k--) {
		if (tmpConteudo[j][k] == vezJogador) { break; } // quando encontrar o extremo da jogada (peça igual à do jogador)
		tmpConteudo[j][k] = vezJogador; 
	    }
	    break;
	case 'SD': // propagação na DIAGONAL SUPERIOR DIREITA da peça
	    for(let j=X-1, k=Y+1; j>=0 && k<8; j--, k++) {
		if (tmpConteudo[j][k] == vezJogador) { break; } // quando encontrar o extremo da jogada (peça igual à do jogador)
		tmpConteudo[j][k] = vezJogador; 
	    }
	    break;
	default:
	    break;
	}
    }

    return tmpConteudo;
    
}

// retorna a melhor jogada que o IA (computador) poderá fazer
function melhorJogada() {
    
    let melhorPont = -Infinity;
    let jogadas = possiveisJogadas(computador, conteudo);
    let jogada = jogadas[0][0];
    
    for (let i=0; i<jogadas.length; i++) {

	let pos = jogadas[i][0];
	let tmpCont = processarJogadaInterna(computador, conteudo, pos);
	let pontuacao = minimax(tmpCont, 0, false);
	
	if (pontuacao > melhorPont) {
	    melhorPont = pontuacao;
	    jogada = jogadas[i][0];
	}
	
    }

    console.log(jogada);
    return jogada;
   
}

// heurística para o minimax
function estadoJogo(cont) {

    let pecasComputador = 0;
    let pecasHumano = 0;
    
    for (let x=0; x<8; x++) {
	for (let y=0; y<8; y++) {
	    if (cont[x][y] == computador) { pecasComputador++; }
	    else if (cont[x][y] == humano) { pecasHumano++; }
	}
    }

    return pecasComputador - pecasHumano;
    
}

// algoritmo aplicado para a jogada do jogador IA (computador)
function minimax(cont, profundidade, jogadorMaximizador) {
   
    if (profundidade === dificuldade) {
	return estadoJogo(cont);
    }
    
    if (jogadorMaximizador) {
	
	let melhorPont = -Infinity;
	let jogadas = possiveisJogadas(computador, cont);
	
	for (let i=0; i<jogadas.length; i++) {
	    let tmpCont = processarJogadaInterna(computador, cont, jogadas[i][0]);
	    let pont = minimax(tmpCont, profundidade + 1, false);
	    melhorPont = Math.max(pont, melhorPont);
	}
	
	return melhorPont;
	
    } else {
	
	let melhorPont = Infinity;
	let jogadas = possiveisJogadas(humano, cont);
	
	for (let i=0; i<jogadas.length; i++) {
	    let tmpCont = processarJogadaInterna(humano, cont, jogadas[i][0]);
	    let pont = minimax(tmpCont, profundidade + 1, true);
	    melhorPont = Math.min(pont, melhorPont);
	}
	
	return melhorPont;
	
    }
}

function contem(arr, pos) {

    for(let i=0; i<arr.length; i++) {
	if(arr[i][0] == pos) {
	    return true;
	}
    }
    
    return false;
}

function msgSemJogadas() {
    const msg = document.getElementById("impossivel");
    msg.innerHTML = "Sem jogadas possiveis";
    msg.style.display = "block";
}

// é indicada qual o jogador que terá de jogar
function vezJogada() {
    
    const msg = document.getElementById("vezJogada");
    if (jogadorAtual == 'dark') {
	msg.innerHTML = "Vez do PRETO";
    } else {
	msg.innerHTML = "Vez do BRANCO";
    }
}

// mensagem de fim de jogo por desistência
function desistir() {
    
    const msg = document.getElementById("msgFimJogo");
    
    if (jogadorAtual == 'light') {
	msg.innerHTML = "JOGADOR PRETO GANHOU";
    } else {
	msg.innerHTML = "JOGADOR BRANCO GANHOU";
    }

    if (computador == undefined) {
	    
	var nick = document.getElementById("username").value;
    	var pass = document.getElementById("password").value;
	leave(gameReference, nick, pass);
	    
    }

    let novoJogo = document.createElement('div');
    novoJogo.setAttribute('id', 'novoJogo');
    novoJogo.innerHTML = "Novo Jogo?";
    msg.appendChild(novoJogo);
    msg.style.display = "block";
    novoJogo.addEventListener("click", init);
    
}

// mensagem que indica quem ganhou o jogo
function fimJogo() {

    document.getElementById("desistir").removeEventListener("click", desistir);
    
    let nrPecasJogadorP = pecasJogadorP.length;
    let nrPecasJogadorB = pecasJogadorB.length;

    const msg = document.getElementById("msgFimJogo");

    if (nrPecasJogadorP > nrPecasJogadorB) {
	msg.innerHTML = "JOGADOR PRETO GANHOU";	
    } else if (nrPecasJogadorP < nrPecasJogadorB) {
	msg.innerHTML = "JOGADOR BRANCO GANHOU";
    } else {
	msg.innerHTML = "EMPATE";
    }

    let novoJogo = document.createElement('div');
    novoJogo.setAttribute('id', 'novoJogo');
    novoJogo.innerHTML = "Novo Jogo?";
    msg.appendChild(novoJogo);
    msg.style.display = "block";
    novoJogo.addEventListener("click", init);

}

function msgJogImp() {
    const msg = document.getElementById("impossivel");
    msg.innerHTML = "Jogada impossivel";
    msg.style.display = "block";
}

function esconderMsg() {
    const msg = document.getElementById("impossivel");
    if (msg.style.display == "block") {
	msg.style.display = "none";
    }
}

var gameReference, colorPlayer;

function clear(){
    document. getElementById("username").value='';
    document. getElementById("password").value='';
}

async function twoPlayers(nick, pass) {
    await join(2, nick, pass);
    await update(gameReference, nick);
}

async function register(nickname, password) {

    const msg = document.getElementById("msgPassIncorreta");

    // retira msg caso tenha sido mostrada anteriormente
    msg.style.display = "none";
    
    var info;  
    
    await fetch('http://twserver.alunos.dcc.fc.up.pt:8008/register', {
	method: 'POST',
	headers: {
	    'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
	},
	body: JSON.stringify({nick: nickname, pass: password})
    })
	.then(function(response) {
	    if (!response.ok) { // se o servidor devolver um erro
		// imprimir msg de password incorreta
		msg.innerHTML = "Password incorreta";
		msg.style.display = "block";
		
		// reset do campo "PASSWORD"
		document.getElementById('password').value = '';

		// função retorna erro
		return false;
	    } else { return true; }
	})
	.then(valid => successfulLog = valid)
	.catch(console.log);
    
}

// emparelha 2 jogadores que pretendem jogar um jogo
async function join(grp, nickname, password) {
    
    await fetch('http://twserver.alunos.dcc.fc.up.pt:8008/join', {
	method: 'POST',
	body: JSON.stringify({group: grp, nick: nickname, pass: password})
    })
	.then(response => {
	    return Promise.resolve(response.json())
	})
	.then(info => {
	    gameReference = info.game;
	    colorPlayer = info.color;
	    console.log(gameReference + " - " + colorPlayer);
	})
	.catch(console.log);
    
}

async function ranking(){
    
    await fetch('http://twserver.alunos.dcc.fc.up.pt:8008/ranking', {
	method: 'POST',
	body: '{}'
    })
	.then(response => {
	    return Promise.resolve(response.json())
	})
	.then(info => {
	    
	    const rank = document.getElementById("ranking");
	    
	    let header = rank.insertRow(0);
	    header.innerHTML = "RANKING";
	    header.setAttribute('id','header');
	    

	    for(let i=0; i<info.ranking.length; i++) {
		
		let linha = rank.insertRow(i+1);
		linha.setAttribute('class', 'content');
		let user = linha.insertCell(0);
		let victories = linha.insertCell(1);
		let games = linha.insertCell(2);
		user.innerHTML = "User: " + info.ranking[i].nick;
		victories.innerHTML = "Vitórias: " + info.ranking[i].victories;
		games.innerHTML = "Jogos: " + info.ranking[i].games;
		
	    }
	    
	})
	.catch(console.log);

}

function leave(gameReference, nickname, password) {

    fetch('http://twserver.alunos.dcc.fc.up.pt:8008/leave', {
	method: 'POST',
	body: JSON.stringify({nick: nickname, pass: password, game: gameReference})
    })
	.then(response => console.log(response))
	.catch(console.log);
    
    clear();
    
}

async function notify(nickname, password, game, moveGame) {
    
    await fetch('http://twserver.alunos.dcc.fc.up.pt:8008/notify', {
	method: 'POST',
	body: JSON.stringify({nick: nickname, pass: password, game: gameReference, move: JSON.parse(moveGame)})
    })
	.then(function(response) {
	    if (!response.ok) // se o servidor devolver um erro
		return false;
	    else
		return true;
	})
	.then(valid => { canProceed = valid; })
	.catch(console.log);
    
}

var data, time, doAnim=false, timeOut = false;
async function update(game, nickname) {
    
    const eventSource = new EventSource('http://twserver.alunos.dcc.fc.up.pt:8008/update?nick=' + nickname + '&game=' + game);
    eventSource.onmessage = function(event) {
	// recebe os dados do estado do jogo
	data = JSON.parse(event.data);
	console.log(data);
	
	// copia o tabuleiro que o jogador recebeu para o tabuleiro que o jogador tem
	if (data.hasOwnProperty("board")) {
	    conteudo = copiaTab(data.board);
	    for (let i=0; i<conteudo.length; i++) {
		for (let j=0; j<conteudo[i].length; j++)
		    if (conteudo[i][j] != 'empty') {
			let pos = i + j * 8; 
			trocarPeca(pos, conteudo[i][j]);
		    }
	    }

	    updatePont();
	}
	
	// troca a vez do jogador
	if (data.turn == nickname) {

	    // se ao fim de 2min não for feita uma jogada é feito um leave automático
	    doAnim = true;
	    canAnimate(doAnim);
	    time = setTimeout(function() {
		leave(gameReference, nickname, document.getElementById("password").value);
	    }, 15000);
	    
	    if (colorPlayer == 'dark')
		jogadorAtual = 'dark';
	    else
		jogadorAtual = 'light';

	    vezJogada();

	    
	} else if (data.turn != nickname) {

	    clearTimeout(time);
	    doAnim = false;
	    canAnimate(doAnim);
	    
	    if (colorPlayer == 'dark')
		jogadorAtual = 'light';
	    else
		jogadorAtual = 'dark';

	    vezJogada();
	    
	}
	
	// se o jogador atual não tiver jogadas possiveis e for a vez dele
	if (data.hasOwnProperty("skip") && data.turn == nickname) {
	    
	    const passar = document.getElementById("passar");
	    passar.style.backgroundColor = "#6495ED"; // mudança de cor do botão "Passar"
	    
	    var listener = function() {
		passar.style.backgroundColor = "#DC143C"; // o botão retorna a cor que tinha inicialmente
		esconderMsg(); // msg "sem jogadas possiveis" desaparece
		buttonPressed = true;
		passar.removeEventListener("click", listener);
		let pass = document.getElementById("password").value;
		notify(nickname, value, gameReference, null);
	    }
	    
	    passar.addEventListener("click", listener);
	    esperar();
	    
	} else if (data.hasOwnProperty("winner")) {

	    doAnim = false;
	    canAnimate(doAnim);

	    document.getElementById("desistir").removeEventListener("click", desistir);

	    const msg = document.getElementById("msgFimJogo");
	    console.log(document.getElementById("username").value);
	    
	    if (data.winner == document.getElementById("username").value) {

		if (colorPlayer == 'dark')
		    msg.innerHTML = "JOGADOR PRETO GANHOU";	
		else
		    msg.innerHTML = "JOGADOR BRANCO GANHOU";	

		
		
	    } else if (data.winner != document.getElementById("username").value) {

		if (colorPlayer == 'dark')
		    msg.innerHTML = "JOGADOR BRANCO GANHOU";	
		else
		    msg.innerHTML = "JOGADOR PRETO GANHOU";
		
	    }
		
	    let novoJogo = document.createElement('div');
	    novoJogo.setAttribute('id', 'novoJogo');
	    novoJogo.innerHTML = "Novo Jogo?";
	    msg.appendChild(novoJogo);
	    msg.style.display = "block";
	    novoJogo.addEventListener("click", init);
	    clear();
	    
	    eventSource.close();
	    
	}

    }
}
