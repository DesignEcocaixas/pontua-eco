// Arquivo: views/login.js
module.exports = function renderLogin(msg = null, tipoMsg = 'danger') {
    const initialToastJson = msg
        ? JSON.stringify({ msg, tipo: tipoMsg || 'danger' }).replace(/</g, '\\u003c')
        : 'null';

    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login | Pontua Eco</title>
        <link rel="icon" type="image/x-icon" href="/img/ico.ico">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <script src="https://unpkg.com/@phosphor-icons/web"></script>
        <style>
            :root {
                --eco-green: #0B6B3A;
                --eco-green-light: #128f4e;
                --bs-body-font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            }
            body, button, input, select, textarea {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            }
            body { 
                background-color: #f4f6f9; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
            }
            .login-card { 
                width: 100%; 
                max-width: 380px; 
                padding: 2.5rem 2rem; 
                border-radius: 12px; 
                box-shadow: 0 4px 20px rgba(0,0,0,0.08); 
                background: #fff; 
                position: relative;
            }
            .btn-eco { background-color: var(--eco-green); color: #fff; border: none; transition: 0.2s; }
            .btn-eco:hover { background-color: var(--eco-green-light); color: #fff; }
            .btn-eco:disabled, .btn-eco.disabled { background-color: var(--eco-green); color: #fff; opacity: 0.85; cursor: not-allowed; }

            /* =========================================================
               ACTIVITY INDICATOR (APPLE-STYLE SPINNER - 12 HASTES)
            ========================================================= */
            .eco-spinner {
                position: relative;
                display: inline-block;
                width: 18px;
                height: 18px;
                vertical-align: middle;
                color: currentColor;
            }
            .eco-spinner.eco-spinner-sm { width: 16px; height: 16px; }
            .eco-spinner.eco-spinner-md { width: 26px; height: 26px; }
            .eco-spinner.eco-spinner-lg { width: 36px; height: 36px; }

            .eco-spinner span {
                position: absolute;
                left: 46%;
                top: 0;
                width: 9%;
                height: 28%;
                background-color: currentColor;
                border-radius: 50px;
                transform-origin: 50% 178%;
                opacity: 0.2;
                animation: eco-spinner-fade 0.96s linear infinite;
            }
            .eco-spinner span:nth-child(1)  { transform: rotate(0deg);   animation-delay: -0.88s; }
            .eco-spinner span:nth-child(2)  { transform: rotate(30deg);  animation-delay: -0.80s; }
            .eco-spinner span:nth-child(3)  { transform: rotate(60deg);  animation-delay: -0.72s; }
            .eco-spinner span:nth-child(4)  { transform: rotate(90deg);  animation-delay: -0.64s; }
            .eco-spinner span:nth-child(5)  { transform: rotate(120deg); animation-delay: -0.56s; }
            .eco-spinner span:nth-child(6)  { transform: rotate(150deg); animation-delay: -0.48s; }
            .eco-spinner span:nth-child(7)  { transform: rotate(180deg); animation-delay: -0.40s; }
            .eco-spinner span:nth-child(8)  { transform: rotate(210deg); animation-delay: -0.32s; }
            .eco-spinner span:nth-child(9)  { transform: rotate(240deg); animation-delay: -0.24s; }
            .eco-spinner span:nth-child(10) { transform: rotate(270deg); animation-delay: -0.16s; }
            .eco-spinner span:nth-child(11) { transform: rotate(300deg); animation-delay: -0.08s; }
            .eco-spinner span:nth-child(12) { transform: rotate(330deg); animation-delay: 0s; }

            @keyframes eco-spinner-fade {
                0%   { opacity: 1; }
                100% { opacity: 0.15; }
            }

            /* =========================================================
               TOAST COM BARRA DE CARREGAMENTO INVERTIDA
            ========================================================= */
            #ecoToastContainer {
                position: fixed;
                top: auto;
                bottom: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column-reverse;
                gap: 10px;
                max-width: 360px;
                width: calc(100vw - 40px);
                pointer-events: none;
            }
            @media (max-width: 575.98px) {
                #ecoToastContainer {
                    top: auto;
                    bottom: 12px;
                    right: 12px;
                    left: 12px;
                    max-width: none;
                    width: auto;
                }
            }
            .eco-toast {
                pointer-events: auto;
                position: relative;
                overflow: hidden;
                background: #ffffff;
                border-radius: 10px;
                box-shadow: 0 10px 28px rgba(0, 0, 0, 0.14);
                border: 1px solid rgba(0, 0, 0, 0.06);
                padding: 13px 14px 16px 14px;
                display: flex;
                align-items: flex-start;
                gap: 11px;
                transform: translateX(120%);
                opacity: 0;
                transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease;
            }
            .eco-toast.show { transform: translateX(0); opacity: 1; }
            .eco-toast.hide { transform: translateX(120%); opacity: 0; }
            .eco-toast-icon { font-size: 1.35rem; line-height: 1; flex-shrink: 0; margin-top: 1px; }
            .eco-toast-body { flex: 1; min-width: 0; text-align: left; }
            .eco-toast-title { font-weight: 700; font-size: 0.85rem; color: #212529; line-height: 1.2; margin-bottom: 2px; }
            .eco-toast-msg { font-size: 0.8rem; color: #555; line-height: 1.35; word-break: break-word; }
            .eco-toast-close { background: none; border: none; color: #999; cursor: pointer; padding: 0 2px; font-size: 1rem; line-height: 1; }
            .eco-toast-close:hover { color: #333; }

            .eco-toast-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 4px;
                width: 100%;
                transform-origin: left center;
                animation-name: eco-toast-shrink;
                animation-timing-function: linear;
                animation-fill-mode: forwards;
            }
            .eco-toast:hover .eco-toast-progress { animation-play-state: paused; }
            @keyframes eco-toast-shrink {
                from { transform: scaleX(1); }
                to   { transform: scaleX(0); }
            }

            .eco-toast-success .eco-toast-icon { color: #0B6B3A; }
            .eco-toast-success .eco-toast-progress { background-color: #0B6B3A; }

            .eco-toast-danger .eco-toast-icon,
            .eco-toast-error .eco-toast-icon { color: #dc3545; }
            .eco-toast-danger .eco-toast-progress,
            .eco-toast-error .eco-toast-progress { background-color: #dc3545; }

            .eco-toast-warning .eco-toast-icon { color: #d97706; }
            .eco-toast-warning .eco-toast-progress { background-color: #f59e0b; }

            .eco-toast-info .eco-toast-icon { color: #0d6efd; }
            .eco-toast-info .eco-toast-progress { background-color: #0d6efd; }
        </style>
    </head>
    <body>
        <!-- Container de Toasts -->
        <div id="ecoToastContainer" aria-live="polite" aria-atomic="true"></div>

        <div class="login-card text-center">
            <div class="mb-4">
                <img src="/img/logo.png" alt="Pontua Eco" style="max-height: 54px; width: auto; max-width: 100%; object-fit: contain;">
            </div>
            
            <form id="formLogin" action="/login" method="POST">
                <div class="mb-3 text-start">
                    <label class="form-label small fw-bold text-muted">E-mail</label>
                    <input type="email" name="email" class="form-control form-control-sm p-2" placeholder="seu@email.com" required autofocus>
                </div>
                <div class="mb-4 text-start">
                    <label class="form-label small fw-bold text-muted">Senha</label>
                    <input type="password" name="senha" class="form-control form-control-sm p-2" placeholder="••••••••" required>
                </div>
                <button type="submit" id="btnLogin" class="btn btn-eco w-100 py-2 fw-bold">
                    Entrar no Sistema
                </button>
            </form>
        </div>

        <script>
            // 1. Gera o Activity Indicator (12 hastes)
            window.createEcoSpinner = function(size) {
                var sizeClass = size ? ' eco-spinner-' + size : '';
                var blades = '';
                for (var i = 0; i < 12; i++) blades += '<span></span>';
                return '<span class="eco-spinner' + sizeClass + '" role="status" aria-hidden="true">' + blades + '</span>';
            };

            // 2. Toast com barra de carregamento invertida
            window.showEcoToast = function(message, type, duration) {
                type = (type === 'error') ? 'danger' : (type || 'danger');
                duration = duration || 4000;

                var container = document.getElementById('ecoToastContainer');
                if (!container || !message) return;

                var config = {
                    success: { title: 'Sucesso', icon: 'ph-fill ph-check-circle' },
                    danger:  { title: 'Erro',    icon: 'ph-fill ph-x-circle' },
                    warning: { title: 'Atenção', icon: 'ph-fill ph-warning-circle' },
                    info:    { title: 'Aviso',   icon: 'ph-fill ph-info' }
                };
                var cfg = config[type] || config.danger;

                var toastEl = document.createElement('div');
                toastEl.className = 'eco-toast eco-toast-' + type;
                toastEl.innerHTML =
                    '<i class="' + cfg.icon + ' eco-toast-icon"></i>' +
                    '<div class="eco-toast-body">' +
                        '<div class="eco-toast-title">' + cfg.title + '</div>' +
                        '<div class="eco-toast-msg"></div>' +
                    '</div>' +
                    '<button type="button" class="eco-toast-close" aria-label="Fechar"><i class="ph ph-x"></i></button>' +
                    '<div class="eco-toast-progress" style="animation-duration: ' + duration + 'ms;"></div>';

                toastEl.querySelector('.eco-toast-msg').textContent = message;
                container.appendChild(toastEl);

                requestAnimationFrame(function() {
                    toastEl.classList.add('show');
                });

                var closed = false;
                function closeToast() {
                    if (closed) return;
                    closed = true;
                    toastEl.classList.remove('show');
                    toastEl.classList.add('hide');
                    setTimeout(function() {
                        if (toastEl.parentNode) toastEl.parentNode.removeChild(toastEl);
                    }, 300);
                }

                toastEl.querySelector('.eco-toast-progress').addEventListener('animationend', closeToast);
                toastEl.querySelector('.eco-toast-close').addEventListener('click', closeToast);
            };

            document.addEventListener('DOMContentLoaded', function() {
                // Exibe Toast enviado pelo backend (ex: e-mail ou senha incorretos)
                var initialToast = ${initialToastJson};
                if (initialToast && initialToast.msg) {
                    window.showEcoToast(initialToast.msg, initialToast.tipo);
                }

                // Exibe Toast de logout caso venha via ?logout=1
                var params = new URLSearchParams(window.location.search);
                if (params.get('logout') === '1') {
                    window.showEcoToast('Você saiu do sistema com segurança.', 'success');
                    window.history.replaceState({}, document.title, '/login');
                }

                // Ativa o Activity Indicator dentro do botão de login ao enviar
                var form = document.getElementById('formLogin');
                var btn = document.getElementById('btnLogin');

                form.addEventListener('submit', function(e) {
                    if (btn.dataset.isLoading === 'true') {
                        e.preventDefault();
                        return;
                    }
                    btn.dataset.isLoading = 'true';
                    btn.dataset.originalHtml = btn.innerHTML;
                    btn.innerHTML =
                        '<span class="d-inline-flex align-items-center justify-content-center gap-2">' +
                            window.createEcoSpinner('sm') +
                            '<span>Entrando...</span>' +
                        '</span>';
                    btn.disabled = true;
                    btn.classList.add('disabled');

                    // Trava edição nos inputs sem desabilitá-los (para o POST enviar os dados)
                    form.querySelectorAll('input').forEach(function(input) {
                        input.readOnly = true;
                    });
                });
            });

            // Restaura o botão caso o usuário volte pelo histórico do navegador
            window.addEventListener('pageshow', function(event) {
                if (event.persisted) {
                    var form = document.getElementById('formLogin');
                    var btn = document.getElementById('btnLogin');
                    if (btn && btn.dataset.originalHtml) {
                        btn.innerHTML = btn.dataset.originalHtml;
                        btn.disabled = false;
                        btn.classList.remove('disabled');
                        delete btn.dataset.isLoading;
                    }
                    if (form) {
                        form.querySelectorAll('input').forEach(function(input) {
                            input.readOnly = false;
                        });
                    }
                }
            });
        </script>
    </body>
    </html>
    `;
};