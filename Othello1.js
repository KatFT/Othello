/*
Outubro de 2020
Catarina Teixeira, up201805042
Cheila Alves, up201805089 
*/

/*
  mostra inicialmente o bloco de autenticação e depois da inserção dos dados pedidos (identificador, password)
  e o posterior clique do botão 'LOGIN', esse mesmo bloco desaparece, é mostrado as opçoes de jogo
*/
var humano = 'B';
var computador = 'P';
var dificuldade = 1;
function areaAutenticacao() {
    
    document.getElementById("form").style.display="none";
    document.getElementById("button").style.display="none";
    document.getElementById("op-jogo").style.display="block";
    document.getElementById("continue").style.display="block"; 

}

/*quando se clica no botao continuar nas op de jogo, essa pagina fecha e e nostrado o tabuleiro,
accordion, botoes de passar, novo jogo, logout, pontuaçao e o nosso logo e ai começa se a jogar*/
function escolhaOp() {

    document.getElementById("op-jogo").style.display="none";
    document.getElementById("continue").style.display="none";
    document.body.style.backgroundImage = "url('Cu1aLQb.gif')";
    document.getElementById("area-de-jogo").style.display="block";
    document.getElementById("container").style.display="block";
    document.getElementById("pontuacao").style.display="block";
    document.getElementById("passar").style.display="block";
    document.getElementById("desistir").style.display="block";
    document.getElementById("logout").style.display="block";
    if (document.getElementById("preto").checked) {
	humano = 'P';
	computador = 'B';
    }

    if (document.getElementById("medio").checked) {
	dificuldade = 2;
    } else if (document.getElementById("dificil").checked) {
	dificuldade = 3;
    }
    document.getElementById("vezJogada").style.display="block";
    criar_tabuleiro(); // depois das escolhas o jogo começa
    
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
var conteudo = [ [' ',' ',' ',' ',' ',' ',' ', ' '],
		 [' ',' ',' ',' ',' ',' ',' ', ' '],
		 [' ',' ',' ',' ',' ',' ',' ', ' '],
		 [' ',' ',' ','B','P',' ',' ', ' '],
		 [' ',' ',' ','P','B',' ',' ', ' '],
		 [' ',' ',' ',' ',' ',' ',' ', ' '],
		 [' ',' ',' ',' ',' ',' ',' ', ' '],
		 [' ',' ',' ',' ',' ',' ',' ', ' ']
	       ];
var tabuleiro;
var molduraTabuleiro;
var pecasJogadorB = [];
var pecasJogadorP = [];
var jogadorAtual = 'P'; // jogador que inicia o jogo

var fimJogada = false; // variável global que indicará o fim da propagação de cada jogada

window.onload = function() {
    areaDeJogo = document.getElementById('area-de-jogo');
    molduraTabuleiro = document.createElement('div');
    molduraTabuleiro.setAttribute('class','molduraTabuleiro');
    tabuleiro = document.createElement('div');
}

function criar_tabuleiro() {

    areaDeJogo.appendChild(molduraTabuleiro);
    tabuleiro.className = 'tabuleiro';
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

    if(jogadorAtual == computador) {

	let pos = melhorJogada();
	setTimeout(processarJogada, 3000, pos);
	updatePont();
	
    }
}

/* movimentos horizontais possíveis */
function verificarJogadasHor(player, cont) {
    
    let jogadas = [];
    let pecasJogador = pecasJogadorB;
    let pecaAdversario = 'P';
    if(player == 'P') {
	pecasJogador = pecasJogadorP;
	pecaAdversario = 'B';
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
    let pecaAdversario = 'P';
    if(player == 'P') {
	pecasJogador = pecasJogadorP;
	pecaAdversario = 'B';
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
    let pecaAdversario = 'P';
    if(player == 'P') {
	pecasJogador = pecasJogadorP;
	pecaAdversario = 'B';
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
function trocarPeca(pos) {

    let x = Math.floor(pos % 8);
    let y = Math.floor(pos / 8);

    // quando se encontrar o outro extremo da peça jogada então cessa a troca de peças do adversário para o jogador
    if (conteudo[x][y] == jogadorAtual) { fimJogada = true; return; }

    // regista a jogada do jogador no array da disposição das peças
    conteudo[x][y] = jogadorAtual;

    // visualização da jogada do jogador
    let peca = document.createElement("div");
    if (jogadorAtual == 'B') {
	
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

// partindo da peça que foi colocada na posição pos troca-se a cor das peças do adversario que se seguem a essa peça
function processarJogada(pos) {

    let X = Math.floor(pos % 8);
    let Y = Math.floor(pos / 8);

    esconderMsg(); // retira a mensagem "JOGADA IMPOSSIVEL"

    // jogador não pode jogar onde já houver uma peça colocada
    if (conteudo[X][Y] !== ' ') {
	msgJogImp();
	return;
    } 

    let jogadasPossiveis = possiveisJogadas(jogadorAtual, conteudo);
   
    let jogadasPossiveisAdversario = possiveisJogadas(humano, conteudo);
    if (jogadorAtual == humano) { jogadasPossiveisAdversario = possiveisJogadas(computador, conteudo); }

    if(!contem(jogadasPossiveis,pos)) {
	msgJogImp();
	return;
    }
    
    let dir = [];
    
    // obter as direções da propagação da jogada na posição pos
    for(let i=0; i<jogadasPossiveis.length; i++) {
	if(jogadasPossiveis[i][0] === pos) {
	    dir.push(jogadasPossiveis[i][1]);
	}
    }

    trocarPeca(pos); // coloca a peça na casa selecionada pelo jogador na jogada
    for(let i=0; i<dir.length; i++) {
	switch(dir[i]) {
	case 'HE': // propagação na HORIZONTAL ANTES da peça colocada
	    for(let j=Y-1; j>=0; j--) {
		let ind = X + j * 8;
		trocarPeca(ind);
		if (fimJogada) { break; }
	    }
	    break;
	case 'HD': // propagação na HORIZONTAL DEPOIS da peça colocada
	    for(let j=Y+1; j<8; j++) {
		let ind = X + j * 8;
		trocarPeca(ind);
		if (fimJogada) { break; }
	    }
	    break;
	case 'VC': // propagação na VERTICAL para CIMA da peça colocada
	    for(let j=X-1; j>=0; j--) {
		let ind = j + Y * 8;
		trocarPeca(ind);
		if (fimJogada) { break; }
	    }
	    break;
	case 'VB': // propagação na VERTICAL para BAIXO da peça colocada
	    for(let j=X+1; j<8; j++) {
		let ind = j + Y * 8;
		trocarPeca(ind);
		if (fimJogada) { break; }
	    }
	    break;
	case 'IE': // propagação na DIAGONAL INFERIOR ESQUERDA da peça colocada
	    for(let j=X+1, k=Y-1; j<8 && k>=0; j++, k--) {
		let ind = j + k * 8;
		trocarPeca(ind);
		if (fimJogada) { break; }
	    }
	    break;
	case 'ID': // propagação na DIAGONAL INFERIOR DIREITA da peça colocada
	    for(let j=X+1, k=Y+1; j<8 && k<8; j++, k++) {
		let ind = j + k * 8;
		trocarPeca(ind);
		if (fimJogada) { break; }
	    }
	    break;
	case 'SE': // propagação na DIAGONAL SUPERIOR ESQUERDA da peça
	    for(let j=X-1, k=Y-1; j>=0 && k>=0; j--, k--) {
		let ind = j + k * 8;
		trocarPeca(ind);
		if (fimJogada) { break; }
	    }
	    break;
	case 'SD': // propagação na DIAGONAL SUPERIOR DIREITA da peça
	    for(let j=X-1, k=Y+1; j>=0 && k<8; j--, k++) {
		let ind = j + k * 8;
		trocarPeca(ind);
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
	} else if (jogadasPossiveisAdversario.length > 0 && jogadasPossiveis.length > 0) {
	    // troca de jogador se o adversário tiver jogadas possíveis depois da jogada do jogador
	    jogadorAtual = (jogadorAtual == 'B'?'P':'B');
	} else if (jogadasPossiveis.length == 0) {
	    msgSemJogadas();
	    const passar = document.getElementById("passar");
	    passar.style.backgroundColor = "#6495ED";
	    document.getElementById("passar").addEventListener("click", function() {
		jogadorAtual = (jogadorAtual == 'B'?'P':'B');
		passar.style.backgroundColor = "#DC143C";
		esconderMsg();
		vezJogada();
	    });
	    while(jogadorAtual == humano) { return; } // enquanto o jogador não clicar no botão
	}
	
    } else {

	jogadasPossiveis = possiveisJogadas(computador, conteudo);
	jogadasPossiveisAdversario = possiveisJogadas(humano, conteudo);
	
	if (jogadasPossiveis.length == 0 && jogadasPossiveisAdversario.length == 0) {
	    fimJogo();
	} else if (jogadasPossiveisAdversario.length > 0) {
	    // troca de jogador se o adversário tiver jogadas possíveis depois da jogada do jogador
	    jogadorAtual = (jogadorAtual == 'B'?'P':'B');
	} 
	
    }

    vezJogada();
    updatePont();
    
    if(jogadorAtual == computador) {

	let pos = melhorJogada();
	setTimeout(processarJogada, 2000, pos);
	
    }
    
}

// atualiza o quadro das pontuações à medida que são feitas as jogadas
function updatePont() {

    let pecasBrancas = document.getElementById("pbranco");
    let pecasPretas = document.getElementById("ppreto");
    let casasLivres = document.getElementById("clivre");
    let pontIA, pontHuman;

    if (computador == 'P') {
	
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

    let livres = 8*8 - pontIA - pontHuman;
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
    let jogada;
    
    for (let i=0; i<jogadas.length; i++) {
	
	let pos = jogadas[i][0];
	let tmpCont = processarJogadaInterna(computador, conteudo, pos);
	let pontuacao = minimax(tmpCont, 0, false);
	
	if (pontuacao > melhorPont) {
	    melhorPont = pontuacao;
	    jogada = jogadas[i][0];
	}
	
    }
    
    return jogada;
    
}

// heurística para o minimax
function estadoJogo(cont) {

    let pecasComputador = 0;
    
    for (let x=0; x<8; x++) {
	for (let y=0; y<8; y++) {
	    if (cont[x][y] == computador) { pecasComputador++; } 
	}
    }

    return pecasComputador;
    
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
    if (jogadorAtual == 'P') {
	msg.innerHTML = "Vez do PRETO";
    } else {
	msg.innerHTML = "Vez do BRANCO";
    }
}

// mensagem de fim de jogo por desistência
function desistir() {
    
    const msg = document.getElementById("msgFimJogo");
    if (jogadorAtual == 'B') {
	msg.innerHTML = "JOGADOR PRETO GANHOU";
    } else {
	msg.innerHTML = "JOGADOR BRANCO GANHOU";
    }

    msg.style.display = "block"; 
    
}

// mensagem que indica quem ganhou o jogo
function fimJogo() {

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

    msg.style.display = "block"; 

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
