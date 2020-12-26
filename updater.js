let responses = [];

module.exports.remember = function(response) {
    responses.push(response);
}

module.exports.forget = function(response) {
    let pos = responses.findIndex((resp) => resp === response);
    if (pos > -1)
	responses.splice(pos, 1);
}

// sends update to all users
module.exports.update = function(message) {
    for(let response of responses) {
	response.write(message + '\n\n');
    }
}
