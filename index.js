"use strict";

const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');
const conf = require('./conf.js');
const crypto = require('crypto');

let updater = require('./updater.js');

const headers = {
    plain: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-cache',
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST'
    },
    sse: {    
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
	'Access-Control-Allow-Origin': '*',
        'Connection': 'keep-alive',
	'Access-Control-Allow-Methods': 'GET'
    }
};

http.createServer((request, response) => {
    let answer = {};
    const preq = url.parse(request.url,true);
    const pathname = preq.pathname;
    console.log(pathname);

    switch(request.method) {
    case 'GET': // DPS TRATAR DESTE CASO PARA O UPDATE !!!
	//answer = doGet(request, response);
	break;
    case 'POST':
	
	var body = '';
	
	request.on('data', function(data) {
	    body += data;
	    console.log('Data: ' + body);
	    //console.log(answer);
	}) .on('end', async function() {
	    // espera a promessa de uma resposta, ou seja, o tratamento do 'body'
	    await doPost(body, response, pathname)
		.then(res => { answer = res; })
		.catch(console.log);
	    handleRequest(answer, response);
	    //console.log("HANDLE: " + answer.status);
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
    if(request.style === 'plain')
	response.end();
    
}

// converter nomes caminhos relativos em caminhos absolutos
function getPathname(request) {
    // caminho relativo extraído do pedido
    const purl = url.parse(request.url);
    // nome caminho é normalizado para retirar .. e .
    let pathname = path.normalize(conf.documentRoot + purl.pathname);

    if (!pathname.startsWith(conf.documentRoot))
	pathname = null;

    return pathname;
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
	const hash = crypto
	      .createHash('md5')
	      .update(password)
	      .digest('hex');

	// espera pela promessa que vem da verificação do login
	// e o resultado dessa promessa ficará no 'answer'
	await login(answer, nickname, hash)
	    .then(res => { answer = res; })
	    .catch(console.log);
	
	console.log("ANSWER: " + answer);
	break;
	
    case '/ranking':
    case '/join':
    case '/leave':
	// se foi efetuado um pedido com o formato incorreto, devolve erro
	if (!(data.hasOwnProperty("nick") && data.hasOwnProperty("pass")
	      && data.hasOwnProperty("game") && Object.keys(data).length == 3)) {
	    answer.status = 400;
	    break;
	}

	let users = '';
	fs.readFile('players.json', function(err, games) {
	    if (!err) { // ficheiro existe
		users = JSON.parse(games.toString());
		users = users.filter(u => u.nick !== data.nick);
	    } 
	});

	request.on('close', () => {
	    console.log(data.nick + " closed connection.");
	    fs.writeFile('players.json', users,
			 function(err) {
			     if (err) throw err;
			     console.log('A connection was closed.');
			 });
	});

	answer.body = '{}';
	updater.update(answer);
	
    case '/notify':
    default:
    }
    return answer;    
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
	    
	})
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
