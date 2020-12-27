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

var clear = false;
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
	
	request.on('data', async function(data) {
	    body += data;
	    console.log('Data: ' + body);
	    answer = await doPost(body, response, pathname);
	    clear = true;
	    console.log(answer);
	})

	esperar();
	break;
	
    default:
	answer.status = 400;
	break;
    }

    if(answer.status === undefined)
	answer.status = 200;
    if(answer.style === undefined)
	answer.style = 'plain';

    response.writeHead(answer.status, headers[answer.style]);
    console.log(response);
    // método POST sem corpo de resposta
    if(answer.style === 'plain')
	response.end();

}).listen(conf.port);

function esperar() {
    if (!clear)
	setTimeout(esperar, 2500);
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

async function doPost(request, response, pathname) {    
    let data = JSON.parse(request);
    let answer = {};

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
	try {
	    await fs.readFile('credentials.json', function(err, creds) {
		if (!err) { // ficheiro existe
		    //console.log(creds.toString());
		    let users = JSON.parse(creds.toString());
		    if (!Array.isArray(users))
			users = [users];
		    
		    console.log(users);
		    // procura se o user com o nickname 'nickname' já foi utilizado
		    for (let i=0; i<users.length; i++) {

			let user = users[i];
			
			console.log(user);
			
			if (user.nick == nickname) {
			    
			    if (user.pass == password) {
				answer.body = '{}';
				console.log('Successful login.');
			    } else {
				answer.body = JSON.stringify({error: "User registered with a different password"});
				answer.status = 401;
				console.log('Bad login.');
				console.log(answer);
				return answer;
			    }

			    found = true;
			    break;
			}
			
		    }

		    // novo user
		    if (found == false) {
			
			users.push({nick: nickname, pass: password});
			
			fs.writeFile('credentials.json',
				     JSON.stringify(users),
				     function(err) {
					 if (err) throw err;
					 console.log('New user added.');
				     });
			
			answer.body = '{}';
			console.log('Successful login.');
			
		    }
		    
		} else { // se o ficheiro ainda não foi criado

		    var users = [{nick: nickname, pass: password}];
		    console.log(users);
		    fs.writeFile('credentials.json',
				 JSON.stringify(users),
				 function(err) {
				     if (err) throw err;
				     console.log('Credentials file created.');
				 });
		    answer.body = '{}';
		    console.log('Successful login.');
		}

		updater.update(answer);
		
	    });
	}
	catch(error) {
	    console.error(error.message);
	}
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
