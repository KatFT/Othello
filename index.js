"use strict";

const http = require('http');
const url = require('url');
const fs = require('fs');
const conf = require('./conf.js');
const crypto = require('crypto');

let updater = require('./updater.js');

// guardará os efeitos dos pedidos POST feitos
let nests = [];

let cont = [ ["empty","empty","empty","empty","empty","empty","empty", "empty"],
	     ["empty","empty","empty","empty","empty","empty","empty", "empty"],
	     ["empty","empty","empty","empty","empty","empty","empty", "empty"],
	     ["empty","empty","empty","light","dark","empty","empty", "empty"],
	     ["empty","empty","empty","dark","light","empty","empty", "empty"],
	     ["empty","empty","empty","empty","empty","empty","empty", "empty"],
	     ["empty","empty","empty","empty","empty","empty","empty", "empty"],
	     ["empty","empty","empty","empty","empty","empty","empty", "empty"]
	   ];

var time = ""; // guarda o jogador que tem a vez
var oponente = ""; // guarda o nick do oponente
var p1 = "";
var p2 = "";
var corP1 = "";
var corP2 = "";
var corPlayer; // cor do jogador
var pecasJogadorB = []; 
var pecasJogadorP = []; 
var fimJogada = false;

const headers = {
    plain: {
        "Content-Type": "application/javascript",
        "Cache-Control": "no-cache",
	"Access-Control-Allow-Origin": "*"
    },
    sse: {    
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
	"Access-Control-Allow-Origin": "*",
        "Connection": "keep-alive"
    }
};

http.createServer((request, response) => {
    let answer = {};
    let urlStr = 'http://' + request.headers.host + request.url;
    const parsedUrl = url.parse(urlStr,true);
    const pathname = parsedUrl.pathname;
    const host = parsedUrl.host;

    switch(request.method) {
    case "GET":
	answer = doGet(parsedUrl, request, response);
	break;
	
    case "POST":
	
	var body = "";
	
	request.on("data", function(data) {
	    body += data;
	    console.log("DATA: " + body);
	    
	}).on("end", async function() {
	    // espera a promessa de uma resposta, ou seja, o tratamento do "body"
	    let data = JSON.parse(body);
	    await doPost(data, response, pathname)
		.then(res => { answer = res; })
		.catch(console.log);

	    // pedidos que são afetados pelo update
	    if (pathname != "/register" && pathname != "/ranking") {
		nests.push(answer.data);
		updater.update(answer.data);
	    }

	    handleRequest(answer, response);
	    
	})

	break;
	
    default:
	answer.status = 404; // pedido desconhecido
	break;
    }

}).listen(conf.port);

// escrita da resposta para o cliente
function handleRequest(request, response) {
    
    // se tudo correu bem
    if(request.status === undefined)
	request.status = 200;
    // se não for um pedido do tipo GET (SSE)
    if(request.style === undefined)
	request.style = "plain";

    response.writeHead(request.status, headers[request.style]);
    // método POST sem corpo de resposta
    if(request.style === "plain")
	response.end(JSON.stringify(request.body));
    
}

// tratamento do pedido com método GET
function doGet(parsedUrl, request, response) {
    let answer = {};
    let pathname = parsedUrl.pathname;
    let query = parsedUrl.query;
    let nick = query.nick;
    let game = query.game;

    switch(pathname) {
    case "/update":

	response.writeHead(200, headers["sse"]);
	let data = JSON.stringify(JSON.parse(nests.pop())); // vai tratando dos pedidos por ordem
	let connId = Date.now(); // identificador da conexão
	let newConn = { id: connId, response }; // objeto que representa o cliente
	updater.remember(newConn); // início de uma conexão
	request.on("close", () => { updater.forget(newConn); }); // fechar conexão no fim da ligação
	setImmediate(() => updater.update(data));
	break;
	
    default:
	 //para ver se e uma request vazia
    if(pathname==='/'){
    pathname = conf.defaultIndex;
    }


    response.setHeader('Content-Type', getTypes(pathname));

    
    fs.readFile(conf.documentRoot + pathname, function(error, data){
    	
        if(error){
        response.writeHead(404);
        response.end('404 - File Not Found');
        }

        else{
        response.writeHead(200);
        response.end(data);

        }

    });
    
    
	break;
    }

    return answer;
}

//verificar tipo de ficheiro a ser transmitido
function getTypes(pathname){
    let typeContent= 'application/octet-stream'; //isto e o nosso caso de erro(nunca vai acontecer na vida real)

    let type = conf.mediaTypes; //buscar os tipos
    for(let key in type){
        if(type.hasOwnProperty(key)){ //existe o tipo
            if(pathname.indexOf(key) > -1) //se existir o index
                typeContent= type[key]; //return do q deu
        }
    }
    return typeContent;
}


// tratamento do pedido com método POST
async function doPost(data, response, pathname) {    
    let answer = {};

    switch(pathname) {
    case "/register":
	// se foi efetuado um pedido com o formato incorreto, devolve erro
	if (!(data.hasOwnProperty("nick") && data.hasOwnProperty("pass")
	      && Object.keys(data).length == 2)) {
	    answer.status = 400;
	    return answer;
	}
	
	let nickname = data.nick;
	let password = data.pass;

	// a password deve ser cifrada antes de ser guardada
	// e também antes de ser comparada uma vez que as passwords
	// que já se encontram guardadas estão cifradas
	const passHash = crypto
	      .createHash("md5")
	      .update(password)
	      .digest("hex");

	// espera pela promessa que vem da verificação do login
	// e o resultado dessa promessa ficará no "answer"
	await login(answer, nickname, passHash)
	    .then(res => { answer = res; })
	    .catch(console.log);
	
	break;
	
    case "/ranking":
	
	// como um pedido com o pathname /ranking não tem corpo
	if(Object.keys(data).length > 0){
	    answer.status = 400;
	    return answer;
	}
	
	// aguarda a promessa da devolução dos valores no ranking
	await rank(answer)
	    .then(res => { answer = res; })
	    .catch(console.log);

	break;

    case "/join":

	// se o corpor do pedido não estiver no formato correto então aborta
	if (!(data.hasOwnProperty("group") && data.hasOwnProperty("nick")
	      && data.hasOwnProperty("pass") && Object.keys(data).length == 3)) {
	    answer.status = 400;
	    return answer;
	}

	let group = (data.group).toString();

	const groupHash = crypto
	      .createHash("md5")
	      .update(group)
	      .digest("hex");

	await joinGame(answer, data.nick, groupHash)
	    .then(res => { answer = res; })
	    .catch(console.log);

	//console.log(answer.body);
	break;
	
    case "/leave":

	// se foi efetuado um pedido com o formato incorreto, devolve erro
	if (!(data.hasOwnProperty("nick") && data.hasOwnProperty("pass")
	      && data.hasOwnProperty("game") && Object.keys(data).length == 3)) {
	    answer.status = 400;
	    return answer;
	}

	answer.body = "{}";
	
	// verificar se fez um leave sem o jogo ter começado
	// se sim, é retornado um winner null
	// se não, é retornado como winner o oponente
	await endGame(answer, data.nick, data.game, true)
	    .then(res => { answer = res; })
	    .catch(console.log);
	
	// reset de variáveis depois do fim de um jogo
	cont = [ ["empty","empty","empty","empty","empty","empty","empty", "empty"],
		 ["empty","empty","empty","empty","empty","empty","empty", "empty"],
		 ["empty","empty","empty","empty","empty","empty","empty", "empty"],
		 ["empty","empty","empty","light","dark","empty","empty", "empty"],
		 ["empty","empty","empty","dark","light","empty","empty", "empty"],
		 ["empty","empty","empty","empty","empty","empty","empty", "empty"],
		 ["empty","empty","empty","empty","empty","empty","empty", "empty"],
		 ["empty","empty","empty","empty","empty","empty","empty", "empty"]
	       ];

	time = ""; // guarda o jogador que tem a vez
	oponente = ""; // guarda o nick do oponente
	p1 = "";
	p2 = "";
	corP1 = "";
	corP2 = "";
	corPlayer; // cor do jogador
	pecasJogadorB = []; 
	pecasJogadorP = [];
	pecasJogadorB.push(27, 36); // (3,3) -> 27 ; (4,4) -> 36
	pecasJogadorP.push(28, 35); // (3,4) -> 35 ; (4,3) -> 28

	console.log("LEAVE: " + answer.data);
	
	break;
	
    case "/notify":

	if(!(data.hasOwnProperty("nick") && data.hasOwnProperty("pass") && data.hasOwnProperty("game")
    	     && data.hasOwnProperty("move") && Object.keys(data).length == 4)) {
    	    answer.status = 400;
    	    return answer;
	}

	if((data.turn == "") || (time != data.nick)) {
	    answer.body = JSON.stringify({error: "Not your turn to play"});
	    answer.status = 400;
	    return answer;
	}
	
	// quando falta apenas o campo "row"
	if (!data.move.hasOwnProperty("row") && data.move.hasOwnProperty("column")){
	    answer.body = JSON.stringify({error: "Move lacks property row"});
	    answer.status = 400;
	    return answer;
	}
	
	// quando falta apenas o campo "column"
	if (!data.move.hasOwnProperty("column") && data.move.hasOwnProperty("row")){
	    answer.body = JSON.stringify({error: "Move lacks property column"});
	    answer.status = 400;
	    return answer;
	}

	// quando não tem nem o campo "row" nem o campo "column"
	if (!data.move.hasOwnProperty("column") && !data.move.hasOwnProperty("row")){
	    answer.body = JSON.stringify({error: "Move must be an object"});
	    answer.status = 400;
	    return answer;
	}

	// quando row não está entre 0 e 7 
	if (data.move.row < 0 || data.move.row >= 8 ){
	    answer.body = JSON.stringify({error: "row should be an integer between 0 and 7"});
	    answer.status = 400;
	    return answer;
	}

	// quando column não esta entre 0 e 7
	if (data.move.column < 0 || data.move.column >= 8 ){
	    answer.body = JSON.stringify({error: "column should be an integer between 0 and 7"});
	    answer.status = 400;
	    return answer;
	}

	if (data.move == null) {
	    
	    let num_dark = pecasJogadorP.length;
	    let num_light = pecasJogadorB.length;
	    let num_empty = 64 - num_dark - num_light;

	    if (data.nick == p1) { time = p2; corPlayer = corP2; }
	    else { time = p1; corPlayer = corP1; }
	    answer.data = JSON.stringify({turn: oponente, board: cont, count: {dark: num_dark, light: num_light, empty: num_empty}});
	    return answer;
	    
	}

	// verifica se foi feita uma jogada dentro das possiveis
	let jogadasPossiveis = possiveisJogadas(corPlayer);
	let found = false; // flag que indicará se a jogada é válida
	let pos = data.move.row + data.move.column * 8; // conversão de coordenadas dimensionais para unidimensionais
	for (let i=0; i<jogadasPossiveis.length; i++)
	    if (jogadasPossiveis[i][0] == pos)
		found = true;

	// se o move não corresponder a uma das jogadas impossiveis
	if (found == false) {
	    answer.status = 400;
	    return answer;
	}
	
	// processa a jogada do player que tem a vez
	await processarJogada(data.move.row, data.move.column)
    	    .then(res => { answer = res; })
    	    .catch(console.log);
	
	break;

    default:
	answer.status = 400;
	break;
    }
    
    return answer;    
}

/* movimentos horizontais possíveis */
function verificarJogadasHor(player) {
    
    let jogadas = [];
    let pecasJogador = pecasJogadorB;
    let pecaAdversario = "dark";
    if(player == "dark") {
	pecasJogador = pecasJogadorP;
	pecaAdversario = "light";
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
function verificarJogadasVer(player) {
    
    let jogadas = [];
    let pecasJogador = pecasJogadorB;
    let pecaAdversario = "dark";
    if(player == "dark") {
	pecasJogador = pecasJogadorP;
	pecaAdversario = "light";
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
function verificarJogadasDiag(player) {
    
    let jogadas = [];

    let pecasJogador = pecasJogadorB;
    let pecaAdversario = "dark";
    if(player == "dark") {
	pecasJogador = pecasJogadorP;
	pecaAdversario = "light";
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
function possiveisJogadas(player) {

    let hor = verificarJogadasHor(player);
    let ver = verificarJogadasVer(player);
    let diag = verificarJogadasDiag(player);

    return hor.concat(ver, diag);
    
}

async function processarJogada(x_pos, y_pos) {

    let jogadasPossiveis = possiveisJogadas(corPlayer);
    
    let dir = []; //perguntar a cheila se isto ainda se aplica
    
    // obter as direções da propagação da jogada na posição pos
    for(let i=0; i<jogadasPossiveis.length; i++) {
	//aqui meti para verificar tanto para o x_pos tanto para o y_pos em vez de pos!!
	if(jogadasPossiveis[i][0] === x_pos+y_pos*8) { //<- ALTEREI AQUI
	    dir.push(jogadasPossiveis[i][1]);
	}
    }
    //no trocar peça n sei se altero por causa de em baixo ter o ind -> confirmar com a cheila
    trocarPeca(x_pos+y_pos*8); // coloca a peça na casa selecionada pelo jogador na jogada
    for(let i=0; i<dir.length; i++) {
	switch(dir[i]) {
	case "HE": // propagação na HORIZONTAL ANTES da peça colocada
	    for(let j=y_pos-1; j>=0; j--) {
		let ind = x_pos + j * 8;
		trocarPeca(ind);
		if (fimJogada) { break; }
	    }
	    break;
	case "HD": // propagação na HORIZONTAL DEPOIS da peça colocada
	    for(let j=y_pos+1; j<8; j++) {
		let ind = x_pos + j * 8;
		trocarPeca(ind);
		if (fimJogada) { break; }
	    }
	    break;
	case "VC": // propagação na VERTICAL para CIMA da peça colocada
	    for(let j=x_pos-1; j>=0; j--) {
		let ind = j + y_pos * 8;
		trocarPeca(ind);
		if (fimJogada) { break; }
	    }
	    break;
	case "VB": // propagação na VERTICAL para BAIXO da peça colocada
	    for(let j=x_pos+1; j<8; j++) {
		let ind = j + y_pos * 8;
		trocarPeca(ind);
		if (fimJogada) { break; }
	    }
	    break;
	case "IE": // propagação na DIAGONAL INFERIOR ESQUERDA da peça colocada
	    for(let j=x_pos+1, k=y_pos-1; j<8 && k>=0; j++, k--) {
		let ind = j + k * 8;
		trocarPeca(ind);
		if (fimJogada) { break; }
	    }
	    break;
	case "ID": // propagação na DIAGONAL INFERIOR DIREITA da peça colocada
	    for(let j=x_pos+1, k=y_pos+1; j<8 && k<8; j++, k++) {
		let ind = j + k * 8;
		trocarPeca(ind);
		if (fimJogada) { break; }
	    }
	    break;
	case "SE": // propagação na DIAGONAL SUPERIOR ESQUERDA da peça
	    for(let j=x_pos-1, k=y_pos-1; j>=0 && k>=0; j--, k--) {
		let ind = j + k * 8;
		trocarPeca(ind);
		if (fimJogada) { break; }
	    }
	    break;
	case "SD": // propagação na DIAGONAL SUPERIOR DIREITA da peça
	    for(let j=x_pos-1, k=y_pos+1; j>=0 && k<8; j--, k++) {
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

    let answer = {};

    answer.body = {};

    let adversario = "dark";
    if (corPlayer == "dark") adversario = "light";

    let num_dark = pecasJogadorP.length;
    let num_light = pecasJogadorB.length;
    let num_empty = 64 - num_dark - num_light;

    // se o adversario não tiver jogadas possiveis, a vez do jogador não muda
    if (possiveisJogadas(adversario) == [] && possiveisJogadas(corPlayer) == []) {
	
	if (num_dark == num_light) // empate
	    answer.data = JSON.stringify({winner: null, board: cont, count: {dark: num_dark, light: num_light, empty: num_empty}});
	else {

	    let w;
	    if (num_dark > num_light && corP1 == "dark") w = p1;
	    else w = p2;
	    await endGame(answer, w, game, false)
		.then(res => function() {
		    let win = res.data.winner;
		    answer.data = JSON.stringify({winner: win, board: cont, count: {dark: num_dark, light: num_light, empty: num_empty}});
		})
		.catch(console.log);
	}
	
    } if (possiveisJogadas(adversario) == []) {
	answer.data = JSON.stringify({turn: nickname, board: cont, count: {dark: num_dark, light: num_light, empty: num_empty}, skip: true});
    } else {
	// troca de jogador
	if (time == p1) { time = p2; corPlayer = corP2; }
	else { time = p1; corPlayer = corP1; }
	answer.data = JSON.stringify({turn: time, board: cont, count: {dark: num_dark, light: num_light, empty: num_empty}});
    }

    return answer;
    
}

//aqui queria verificar por causa do ind na funçao em cima
function trocarPeca(pos) {

    // conversão da coordenada unidimensional pos para coordenadas bidimensionais
    let x = Math.floor(pos % 8);
    let y = Math.floor(pos / 8);
    
    // quando se encontrar o outro extremo da peça jogada então cessa a troca de peças do adversário para o jogador
    if (cont[x][y] == corPlayer) { fimJogada = true; return; }

    // regista a jogada do jogador no array da disposição das peças
    cont[x][y] = corPlayer;
    
    // visualização da jogada do jogador
    
    if (corPlayer == "light") {
	
	//peca.setAttribute("class", "peca pecaBRANCA");
	pecasJogadorB.push(pos);
	for(let i=0; i<pecasJogadorP.length; i++) { // retira a peça do adversário que estava na posição pos
	    if (pecasJogadorP[i] == pos) { pecasJogadorP.splice(i, 1); }
	}
	
    } else {

	//peca.setAttribute("class", "peca pecaPRETA");
	pecasJogadorP.push(pos);
	for(let i=0; i<pecasJogadorB.length; i++) { // retira a peça do adversário que estava na posição pos
	    if (pecasJogadorB[i] == pos) { pecasJogadorB.splice(i, 1); }
	}
	
    }
    
}

function updateScores(player, won) {
    return new Promise(resolve => {
	fs.readFile("scores.json", async function(err, scores) {
	    if (!err) {
		let players = JSON.parse(scores.toString());

		for (let i=0; i<players.length; i++) {
		    let p = players[i];
		    if (p.nick == player) {
			let vics = p.victories;
			let g = p.games;
			g++;
			if (won) vics++;
			players.splice(i, 1);
			players.push({nick: player, victories: vics, games: g});
			await writeResult(players);
			break;
		    }
		}
		
	    } else {
		
		let vics = 0;
		if (won) vics = 1;
		let g = 1;
		let players = [{nick: player, victories: vics, games: g}];
		await writeResult(players);
		
	    }

	    resolve();
	    
	});
    });
}

// regista um novo jogo no ficheiro activeGames.json
function writeResult(scores) {
    return new Promise(resolve => {
	fs.writeFile("scores.json",
		     JSON.stringify(scores),
		     function(err) {
			 if (err) throw err;
			 console.log("Scores updated in file.");
		     });
	resolve();
    });
}

function endGame(answer, nick, game, desistencia) {
    return new Promise((resolve,reject) => {
	fs.readFile("activeGames.json", async function(err, games) {
	    let win = "";
	    if (!err) {
		
		let active = JSON.parse(games.toString());
		if (!Array.isArray(active))
		    active = [active];

		for (let i=0; i<active.length; i++) {
		    let a = active[i];
		    if (a.game == game) {
			// só tem os campos game e o player1
			// ou seja, ainda não houve nenhum emparelhamento (jogo ainda não começou)
			if (Object.keys(a).length == 2) {
			    win = "null";
			    answer.data = JSON.stringify({winner: win});
			} else {
			    
			    let loser;
			    if (desistencia) {
				
				if (a.player1 == nick) {				    
				    win =  a.player2;
				    loser = a.player1;				    
				} else if (a.player2 == nick) {
				    win = a.player1;
				    loser = a.player2; 
				}

				await updateScores(nick, true);
				await updateScores(nick, false);
				answer.data = JSON.stringify({winner: win});
				
			    } else {
				
				if (nick == a.player1) {
				    win = a.player1;
				    loser = a.player2;
				} else {
				    win = a.player1;
				    loser = a.player2;
				}

				await updateScores(win, true);
				await updateScores(loser, false);

				answer.data = JSON.stringify({winner: win});
				
			    }
			    
			}


			// remoção do jogo que acabou
			active.splice(i, 1);
			// atualiza o ficheiro activeGames.json
			await newGame(active);
			
			break;
			
		    }
		}
		
	    } else reject();

	    resolve(answer);
	    
	});
    });
}

async function joinGame(answer, nickname, hash) {
    return new Promise(resolve => {
	fs.readFile("activeGames.json", async function(err, games) {
	    
	    if(!err) { // se ficheiro existe

		// lista de jogos ativos
		let active = JSON.parse(games.toString());
		// flag que indicará se o jogador encontrou outro jogador
		// no mesmo game à espera de emparelhamento
		let found = false; 

		if(!Array.isArray(active))
		    active = [active];

		for (let i=0; i<active.length; i++) {
		    let a = active[i];
		    // se já houver um jogador há espera de emparelhamento com o meu hash
		    // o jogador que entrar agora tem a cor "light"
		    // e insere-se o novo jogador no jogo que já está então ativo
		    if (a.game == hash && Object.keys(a).length == 2) {
			
			answer.body = JSON.stringify({game: hash, color: "light"});
			oponente = a.player1;
			p2 = nickname;
			corP2 = "light";
			active.splice(i, 1);
			active.push({game: hash, player1: oponente, player2: nickname});
			await newGame(active);
			// estado inicial do jogo
			answer.data = JSON.stringify({board: cont, turn: oponente, count: {dark: 2, light: 2, empty: 60}});
			pecasJogadorB.push(27, 36); // (3,3) -> 27 ; (4,4) -> 36
			pecasJogadorP.push(28, 35); // (3,4) -> 35 ; (4,3) -> 28
			found = true;
			break;
			
		    } else if (a.game == hash) { // já há um jogo a decorrer então jogador aguarda novo emparelhamento
			
			answer.body = JSON.stringify({game: hash, color: "dark"});
			active.push({game: hash, player1: nickname});
			await newGame(active);
			answer.data = JSON.stringify({});
			found = true;
			
		    }
		}

		if (found == false) {
		    
		    // inserção do user na lista dos users existentes
		    active.push({game: hash, player1: nickname});
		    // espera da promessa que efetuará a inserção do novo game no ficheiro dos jogos ativos
		    await newGame(active);
		    p1 = time = nickname;
		    corPlayer = corP1 = "dark";
		    answer.data = JSON.stringify({});
		    answer.body = JSON.stringify({game: hash, color: "dark"});
		    
		}

	    } else { // ficheiro ainda não existe

		var active = [{game: hash, player1: nickname}];
		// espera da promessa que efetuará a inserção do novo game no ficheiro dos jogos ativos
		await newGame(active);
		p1 = time = nickname;
		corPlayer = corP1 = "dark";
		answer.data = JSON.stringify({});
		answer.body = JSON.stringify({game: hash, color: "dark"});
		
	    }
	    
	    resolve(answer); 

	});
	
    });
}

// atualiza o ficheiro activeGames.json de acordo:
// se há jogos novos ou se um jogo acabou
function newGame(games) {
    return new Promise(resolve => {
	fs.writeFile("activeGames.json",
		     JSON.stringify(games),
		     function(err) {
			 if (err) throw err;
			 console.log("Game written in file.");
		     });
	resolve();
    });
}

//retorna a promessa do ranking
function rank(answer) {
    return new Promise(resolve => {
	
	//leitura do ficheiro que contem os dados do ranking
	fs.readFile("scores.json", async function(err, ranks){
	    
	    if(!err) { //ficheiro existe
		
		let d = JSON.parse(ranks.toString());
		
		//vai ordenar por ordem decerescente do nr de vitorias
		d.sort(function (a,b) {
		    
		    if(a.victories > b.victories) //maior para o inicio
			return -1;
		    
		    if(a.victories < b.victories) //menor para o fim
			return 1;
		    
		    return 0;
		    
		}); 
		
		let r = [];
		let tam;
		if(d.length >10)
		    tam = 10;
		else tam = d.length;
		
		for(let i=0; i<tam; i++)
		    r.push(d[i]);

		answer.body = JSON.stringify({ranking: r});

	    } else // ainda não houveram jogos
		answer.body = JSON.stringify({ranking: []});

	    //devolvido com sucesso a promessa
	    resolve(answer);
	    
	});
	
    });
}

// retorna a promessa da verificação do login
async function login(answer, nickname, hash) {
    return new Promise((resolve, reject) => {
	// leitura do ficheiro que contém os dados de autenticação dos vários utilizadores
	fs.readFile("credentials.json", async function(err, creds) {
	    
	    if (!err) { // ficheiro existe
		// flag utilizada para indicar se o user já alguma vez efetuou o login
		var found = false;
		// lista de users que já fizeram login alguma vez
		let users = JSON.parse(creds.toString());
		// se os dados contidos no ficheiro não estiverem em formato de array
		// então o ficheiro só contém os dados de um só user e portanto
		// convertemos esses dados para um array para que possamos de seguida
		// acrescentar o user atual
		if (!Array.isArray(users))
		    users = [users];
		
		// procura se o user com o nickname "nickname" já foi utilizado
		for (let i=0; i<users.length; i++) {

		    let user = users[i];
		    
		    if (user.nick == nickname) { // se user existe no ficheiro
			
			if (user.pass == hash) { // dados introduzidos corretos
			    
			    answer.body = "{}";
			    console.log("Successful login.");
			    
			} else { // dados introduzidos incorretos
			    
			    answer.body = JSON.stringify({error: "User registered with a different password"});
			    answer.status = 401;
			    console.log("Bad login.");
			    // rejeita a promessa (é devolvido erro)
			    reject(answer);
			    
			}

			found = true; // o user foi encontrado
			break;
		    }
		    
		}

		// novo user
		if (found == false) {

		    // inserção do user na lista dos users existentes
		    users.push({nick: nickname, pass: hash});
		    // espera da promessa que efetuará a inserção do novo user no ficheiro das credenciais
		    await newLogin(users);
		    answer.body = "{}";
		    console.log("Successful login.");
		    
		}
		
	    } else { // se o ficheiro ainda não foi criado

		var users = [{nick: nickname, pass: hash}];
		// espera da promessa que efetuará a inserção do novo user no ficheiro das credenciais
		await newLogin(users);
		answer.body = "{}";
		console.log("Successful login.");
	    }

	    // é devolvida, com sucesso, a promessa
	    resolve(answer);
	    
	});
    });
}

// função que retorna a promessa da inserção dum novo usuário
// no ficheiro das credenciais
function newLogin(users) {
    return new Promise(resolve => {
	fs.writeFile("credentials.json",
		     JSON.stringify(users),
		     function(err) {
			 if (err) throw err;
			 console.log("Written in file.");
		     });
	resolve();
    });
}
