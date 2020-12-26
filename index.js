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
	// força a cache a submeter a requisição ao servidor origem para
	// validação antes de libertar a cópia em memória
        'Cache-Control': 'no-cache',
	// uma resposta que diz ao browser para permitir o pedido da origem
	// twserver.alunos.dcc.fc.up.pt o acesso a um recurso
        'Access-Control-Allow-Origin': 'twserver.alunos.dcc.fc.up.pt'        
    },
    sse: {    
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': 'twserver.alunos.dcc.fc.up.pt',
        'Connection': 'keep-alive'
    }
};

http.createServer((request, response) => {

    switch(request.method) {
    case 'GET': // DPS TRATAR DESTE CASO PARA O UPDATE !!!
	answer = doGet(request, response);
	break;
    case 'POST':
	answer = doPost(request, response);
	break;
    default:
	answer.status = 400;
    }

    if(answer.status === undefined)
        answer.status = 200;
    if(answer.style === undefined)
        answer.style = 'plain';

    response.writeHead(answer.status, headers[answer.style]);
    // método POST sem corpo de resposta
    if(answer.style === 'plain')
        response.end();
    
}).listen(conf.port);

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

function doPost(request, response) {
    let data = JSON.parse(request);
    let pathname = getPathname(request);
    let answer = '';

    switch(pathname) {
    case '/register':
	// se foi efetuado um pedido com o formato incorreto, devolve erro
	if (!(data.hasOwnProperty("nick") && data.hasOwnProperty("pass")
	      && Object.keys(data).length == 2)) {
	    answer.status = 400;
	    break;
	}

	let nickname = data.nick;
	let password = data.pass;
	let found = false;

	// a password deve ser cifrada antes de ser guardada
	// e também antes de ser comparada uma vez que as passwords
	// que já se encontram guardadas estão cifradas
	const hash = crypto
	      .createHash('md5')
	      .update(password)
	      .digest('hex');

	// se, anteriormente, já foi inserido um nickname 'nickname'
	// verificar se a pass corresponde à password associada a 'nickname'
	fs.readFile('credentials.json', function(err, creds) {
	    if (!err) { // ficheiro existe
		
		let users = JSON.parse(creds.toString());
		// procura se o user com o nickname 'nickname' já foi utilizado
		for (let user in users) {
		    
		    if (user.nick == nickname) {
			
			if (user.pass == password) {
			    answer.body = '{}';
			    console.log('Successful login.');
			} else {
			    answer.body = JSON.stringfy({error: "User registered with a different password"});
			    answer.status = 401;
			    console.log('Bad login.');
			}
			
			found = true;
			break;
			
		    }
		}

		// novo user
		if (found == false) {
		    
		    users.push({nick: nickname, pass: password});
		    
		    fs.writeFile('credentials.json',
				 [{nick: nickname, pass: password}],
				 function(err) {
				     if (err) throw err;
				     console.log('New user added.');
				 });
		    
		    answer.body = '{}';
		    console.log('Successful login.');
		    
		}
		
	    } else { // se o ficheiro ainda não foi criado
		
		fs.writeFile('credentials.json',
			     [{nick: nickname, pass: password}],
			     function(err) {
				 if (err) throw err;
				 console.log('Credentials file created.');
			     });
		answer.body = '{}';
		console.log('Successful login.');
	    }

	    updater.update(answer);
	    
	});
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
    
}
