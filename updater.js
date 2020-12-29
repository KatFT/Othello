let users = [];

module.exports.remember = function(user) {
    users.push(user);
}

module.exports.forget = function(user) {
    let pos = users.findIndex(usr => usr.id === user.id);
    if (pos > -1)
	users.splice(pos, 1);
}

// difundir a mensagem para todos os clientes que têm uma conexão aberta
module.exports.update = function(message) {
    for(let u of users) {
        u.response.write('data: '+ message + '\n\n');
    }
}
