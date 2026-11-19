// Arquivo: middlewares/auth.js
module.exports = {
    verificarAuth: (req, res, next) => {
        if (req.session && req.session.usuario) {
            return next();
        }
        res.redirect('/login');
    },
    verificarAdmin: (req, res, next) => {
        if (req.session && req.session.usuario && req.session.usuario.perfil === 'admin') {
            return next();
        }
        res.status(403).send('Acesso negado. Apenas administradores podem realizar esta ação.');
    }
};