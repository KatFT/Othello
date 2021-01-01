// a implementação ficará hospedada em twserver.alunos.dcc.fc.up.pt
// portanto, será q documentRoot tem de ter esse valor ???
module.exports.documentRoot = './'; //isto vai buscar diretamente o teu diretorio para qql maquina
module.exports.defaultIndex = 'index.html';
module.exports.port = 8102;
module.exports.mediaTypes = {
    'txt':      'text/plain',
    'html':     'text/html',
    'css':      'text/css',
    'js':       'application/javascript',
    'json':     'application/json',
    'png':      'image/png',
    'jpeg':     'image/jpeg',
    'jpg':      'image/jpeg',
    'gif':      'image/gif'
}
