"use strict";

const http = require('http');
const url = require('url');
const fs = require('fs');
const conf = require('./conf.js');
const crypto = require('crypto');

let updater = require('./updater.js');

// guardará os efeitos dos pedidos POST feitos
let nests = [];

let conteudo = [ ['empty','empty','empty','empty','empty','empty','empty', 'empty'],
		 ['empty','empty','empty','empty','empty','empty','empty', 'empty'],
		 ['empty','empty','empty','empty','empty','empty','empty', 'empty'],
		 ['empty','empty','empty','light','dark','empty','empty', 'empty'],
		 ['empty','empty','empty','dark','light','empty','empty', 'empty'],
		 ['empty','empty','empty','empty','empty','empty','empty', 'empty'],
		 ['empty','empty','empty','empty','empty','empty','empty', 'empty'],
		 ['empty','empty','empty','empty','empty','empty','empty', 'empty']
	       ];

const headers = {
    plain: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-cache',
	'Access-Control-Allow-Origin': '*'
    },
    sse: {    
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
	'Access-Control-Allow-Origin': '*',
        'Connection': 'keep-alive'
    }
};

http.createServer((request, response) => {
    let answer = {};
    const parsedUrl = url.parse(request.url,true);
    const pathname = parsedUrl.pathname;
    console.log(pathname);

    switch(request.method) {
    case 'GET':
	answer = doGet(parsedUrl, request, response);
	break;
	
    case 'POST':
	
	var body = '';
	
	request.on('data', function(data) {
	    body += data;
	    console.log('Data: ' + body);
	    
	}) .on('end', async function() {
	    // espera a promessa de uma resposta, ou seja, o tratamento do 'body'
	    await doPost(body, response, pathname)
		.then(res => { answer = res; })
		.catch(console.log);

	    // pedidos que são afetados pelo update
	    if (pathname != '/register' && pathname != '/ranking')
		nests.push(answer.data);

	    //console.log("POST: " + answer.body);
	    handleRequest(answer, response);
	})

	break;
	
    default:
	answer.status = 400;
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
	request.style = 'plain';

    response.writeHead(request.status, headers[request.style]);
    // método POST sem corpo de resposta
    if(request.style === 'plain') {
	response.write(request.body);
	response.end();
    }
    
}

// tratamento do pedido com método GET
function doGet(parsedUrl, request, response) {
    let answer = {};
    let pathname = parsedUrl.pathname;
    let query = parsedUrl.query;
    let nick = query.nick;
    let game = query.game;

    switch(pathname) {
    case '/update':

	response.writeHead(200, headers['sse']);
	let data = JSON.stringify(nests.shift()); // vai tratando dos pedidos por ordem
	//console.log(data);
	let connId = Date.now(); // identificador da conexão
	let newConn = { id: connId, response }; // objeto que representa o cliente
	updater.remember(newConn); // início de uma conexão
	request.on('close', () => updater.forget(newConn)); // fechar conexão no fim da ligação
	setImmediate(() => updater.update(data));
	break;
	
    default:
	answer.status = 400;
	break;
    }

    return answer;
}

// tratamento do pedido com método POST
async function doPost(request, response, pathname) {    
    let data = JSON.parse(request);
    let answer = {};

    switch(pathname) {
    case '/register':
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
	      .createHash('md5')
	      .update(password)
	      .digest('hex');

	// espera pela promessa que vem da verificação do login
	// e o resultado dessa promessa ficará no 'answer'
	await login(answer, nickname, passHash)
	    .then(res => { answer = res; })
	    .catch(console.log);
	
	break;
	
    case '/ranking':
	
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

    case '/join':

	// se o corpor do pedido não estiver no formato correto então aborta
	if (!(data.hasOwnProperty("group") && data.hasOwnProperty("nick")
	      && data.hasOwnProperty("pass") && Object.keys(data).length == 3)) {
	    answer.status = 400;
	    return answer;
	}

	let group = (data.group).toString();

	const groupHash = crypto
	      .createHash('md5')
	      .update(group)
	      .digest('hex');

	await joinGame(answer, data.nick, groupHash)
	    .then(res => { answer = res; })
	    .catch(console.log);

	//console.log(answer.body);
	break;
	
    case '/leave':
	
	// se foi efetuado um pedido com o formato incorreto, devolve erro
	if (!(data.hasOwnProperty("nick") && data.hasOwnProperty("pass")
	      && data.hasOwnProperty("game") && Object.keys(data).length == 3)) {
	    answer.status = 400;
	    return answer;
	}

	await logout(data.nick);

	answer.body = '{}';
	
	// verificar se fez um leave sem o jogo ter começado
	// se sim, é retornado um winner null
	// se não, é retornado como winner o oponente
	await inGame(game)
	    .then(win => async function() {
		let msg = JSON.stringify({winner: win})
		
		if (win == data.nick) await updateScores(data.nick, true);
		else await updateScores(data.nick, false);
	    })
	    .catch(console.log);
	
	break;
	
    case '/notify':
    default:
    }
    return answer;    
}

function updateScores(player, won) {
    return new Promise(resolve => {
	fs.readFile('scores.json', async function(err, scores) {
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
	fs.writeFile('scores.json',
		     JSON.stringify(scores),
		     function(err) {
			 if (err) throw err;
			 console.log('Scores updated in file.');
		     });
	resolve();
    });
}

function inGame(nick, game) {
    return new Promise((resolve,reject) => {
	fs.readFile('activeGames.json', function(err, games) {
	    if (!err) {
		
		let active = JSON.parse(games.toString());
		if (!Array.isArray(active))
		    active = [active];

		let winner = '';

		for (let i=0; i<active.length; i++) {
		    let a = active[i];
		    if (a.game == game) {
			// só tem os campos game e o player1
			if (Object.keys(a).length == 2)
			    winner = "null";
			else {
			    
			    if (a.player1 == nick)
				winner =  a.player2;
			    else if (a.player2 == nick)
				winner = a.player1;
			    
			}
			
			break;
			
		    }
		}
		
	    } else reject();

	    resolve(winner);
	    
	});
    });
}

async function joinGame(answer, nickname, hash) {
    return new Promise(resolve => {
	fs.readFile('activeGames.json', async function(err, games) {
	    
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
		    // o jogador que entrar agora tem a cor 'light'
		    // e insere-se o novo jogador no jogo que já está então ativo
		    if (a.game == hash && Object.keys(a).length == 2) {
			answer.body = JSON.stringify({game: hash, color: "light"});
			let opponent = a.player1;
			active.splice(i, 1);
			active.push({game: hash, player1: opponent, player2: nickname});
			await newGame(active);
			// estado inicial do jogo
			answer.data = JSON.stringify({board: conteudo, turn: opponent, count: {dark: 2, light: 2, empty: 60}});
			found = true;
			break;
		    }
		}

		if (found == false) {
		    
		    // inserção do user na lista dos users existentes
		    active.push({game: hash, player1: nickname});
		    // espera da promessa que efetuará a inserção do novo game no ficheiro dos jogos ativos
		    await newGame(active);
		    answer.data = JSON.stringify({});
		    answer.body = JSON.stringify({game: hash, color: "dark"});
		    
		}

	    } else { // ficheiro ainda não existe

		var active = [{game: hash, player1: nickname}];
		// espera da promessa que efetuará a inserção do novo game no ficheiro dos jogos ativos
		await newGame(active);
		answer.data = JSON.stringify({});
		answer.body = JSON.stringify({game: hash, color: "dark"});
		
	    }
	    
	    resolve(answer); 

	});
	
    });
}

// regista um novo jogo no ficheiro activeGames.json
function newGame(games) {
    return new Promise(resolve => {
	fs.writeFile('activeGames.json',
		     JSON.stringify(games),
		     function(err) {
			 if (err) throw err;
			 console.log('Game written in file.');
		     });
	resolve();
    });
}

//retorna a promessa do ranking
function rank(answer) {
    return new Promise(resolve => {
	
	//leitura do ficheiro que contem os dados do ranking
	fs.readFile('scores.json', async function(err, ranks){
	    
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
	fs.readFile('credentials.json', async function(err, creds) {
	    
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
		
		// procura se o user com o nickname 'nickname' já foi utilizado
		for (let i=0; i<users.length; i++) {

		    let user = users[i];
		    
		    if (user.nick == nickname) { // se user existe no ficheiro
			
			if (user.pass == hash) { // dados introduzidos corretos
			    
			    answer.body = '{}';
			    console.log('Successful login.');
			    
			} else { // dados introduzidos incorretos
			    
			    answer.body = JSON.stringify({error: "User registered with a different password"});
			    answer.status = 401;
			    console.log('Bad login.');
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
		    answer.body = '{}';
		    console.log('Successful login.');
		    
		}
		
	    } else { // se o ficheiro ainda não foi criado

		var users = [{nick: nickname, pass: hash}];
		// espera da promessa que efetuará a inserção do novo user no ficheiro das credenciais
		await newLogin(users);
		answer.body = '{}';
		console.log('Successful login.');
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
		fs.writeFile('credentials.json',
			     JSON.stringify(users),
			     function(err) {
				 if (err) throw err;
				 console.log('Written in file.');
			     });
		resolve();
    });
}

function logout(nick) {
    return new Promise((resolve, reject) => {
	let active = [];
	
	fs.readFile('activeGames.json', async function(err, games) {
	    
	    if (!err) { // ficheiro existe
		// jogos que estão ativos de momento
		active = JSON.parse(games.toString());

		// se só tiversos um só jogo ativo
		if(!Array.isArray(active))
		    active = [active];

		for (let i=0; i<active.length; i++) {
		    let a = active[i];
		    // se o jogador q tem o nickname 'nick' estiver num jogo ativo
		    // então retira-o desse jogo ativo
		    if (a.player1 == nick || a.player2 == nick) {
			active.splice(i, 1);
			await newGame(active);
			break;
		    }
		}
		
	    } else reject();
	    
	});
	
	resolve();
    });
}
