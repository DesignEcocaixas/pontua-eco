// Arquivo: views/layout.js
module.exports = function renderLayout(title, content, scripts = '', usuario = null, toast = null) {
    
    // Gera a foto ou a inicial do nome (evitando barra dupla)
    let userHtml = `<span class="fw-bold d-none d-sm-inline">Usuário Logado</span><div class="bg-secondary rounded-circle" style="width: 35px; height: 35px;"></div>`;
    if (usuario) {
        const fotoSrc = usuario.foto 
            ? (usuario.foto.startsWith('/') ? usuario.foto : '/' + usuario.foto) 
            : null;

        let avatar = fotoSrc 
            ? `<img src="${fotoSrc}" class="rounded-circle shadow-sm flex-shrink-0" style="width: 36px; height: 36px; object-fit: cover; border: 2px solid var(--eco-green);">`
            : `<div class="bg-secondary rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm flex-shrink-0" style="width: 36px; height: 36px;">${usuario.nome.charAt(0).toUpperCase()}</div>`;
        userHtml = `<span class="fw-bold text-dark d-none d-sm-inline text-truncate" style="max-width: 180px;">${usuario.nome}</span>${avatar}`;
    }

    // Serializa o toast inicial (caso venha do backend) de forma segura
    const initialToastJson = toast && toast.msg
        ? JSON.stringify({ msg: toast.msg, tipo: toast.tipo || 'success' }).replace(/</g, '\\u003c')
        : 'null';

    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} | Pontua Eco</title>
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
                --eco-bg: #f4f6f9;
                --eco-text: #333;
                --bs-body-font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            }
            body, button, input, select, textarea {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            }
            body { background-color: var(--eco-bg); color: var(--eco-text); font-size: 0.875rem; overflow-x: hidden; }
            .sidebar {
                background-color: #fff;
                min-height: 100vh;
                height: 100%;
                border-right: 1px solid #e0e0e0;
                width: 240px;
                position: fixed;
                top: 0;
                left: 0;
                z-index: 1045;
                transition: transform 0.25s ease-in-out;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
            }
            .sidebar .brand {
                padding: 15px;
                color: var(--eco-green);
                font-weight: 700;
                font-size: 1.2rem;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                border-bottom: 1px solid #eee;
                position: relative;
            }
            .sidebar-footer {
                margin-top: auto;
                padding: 14px 16px;
                border-top: 1px solid #eee;
                text-align: center;
                background-color: #fafafa;
            }
            .sidebar-footer .dev-credit {
                font-size: 0.72rem;
                color: #6c757d;
                margin-bottom: 8px;
            }
            .sidebar-footer .dev-links {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 10px;
            }
            .sidebar-footer .dev-link {
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 1rem;
                color: #555;
                background: #fff;
                border: 1px solid #e2e6ea;
                text-decoration: none;
                transition: all 0.2s ease;
            }
            .sidebar-footer .dev-link-wa:hover {
                color: #fff;
                background-color: #25D366;
                border-color: #25D366;
            }
            .sidebar-footer .dev-link-ig:hover {
                color: #fff;
                background-color: #E1306C;
                border-color: #E1306C;
            }
            .sidebar-close-btn {
                display: none;
                position: absolute;
                right: 12px;
                top: 50%;
                transform: translateY(-50%);
                background: #f4f6f9;
                border: none;
                border-radius: 6px;
                width: 32px;
                height: 32px;
                align-items: center;
                justify-content: center;
                color: #555;
            }
            .sidebar-backdrop {
                display: none;
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.45);
                z-index: 1040;
                backdrop-filter: blur(1px);
            }
            .sidebar-backdrop.show { display: block; }
            .nav-link { color: #555; padding: 11px 20px; display: flex; align-items: center; gap: 12px; font-weight: 500; text-decoration: none; transition: 0.2s; }
            .nav-link:hover, .nav-link.active { background-color: rgba(11, 107, 58, 0.1); color: var(--eco-green); border-right: 3px solid var(--eco-green); }
            .main-content { margin-left: 240px; padding: 20px; min-height: 100vh; width: calc(100% - 240px); }
            .btn-eco { background-color: var(--eco-green); color: #fff; border: none; }
            .btn-eco:hover { background-color: var(--eco-green-light); color: #fff; }
            .card-eco { border: none; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }

            .btn-menu-mobile {
                display: none;
                width: 38px;
                height: 38px;
                padding: 0;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
                background: #fff;
                border: 1px solid #dee2e6;
                color: var(--eco-green);
                font-size: 1.25rem;
                flex-shrink: 0;
            }

            /* =========================================================
               RESPONSIVIDADE GLOBAL (TABLET E MOBILE < 992px)
            ========================================================= */
            @media (max-width: 991.98px) {
                .sidebar {
                    transform: translateX(-100%);
                    width: 265px;
                    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.14);
                }
                .sidebar.open {
                    transform: translateX(0);
                }
                .sidebar-close-btn {
                    display: inline-flex;
                }
                .main-content {
                    margin-left: 0;
                    width: 100%;
                    padding: 14px;
                }
                .btn-menu-mobile {
                    display: inline-flex;
                }
                .eco-page-header {
                    background: #fff;
                    margin: -14px -14px 16px -14px;
                    padding: 12px 14px;
                    border-bottom: 1px solid #e9ecef;
                    position: sticky;
                    top: 0;
                    z-index: 1020;
                }
                .eco-page-title {
                    font-size: 1.1rem;
                }
            }

            @media (max-width: 575.98px) {
                /* Evita zoom automático no iOS ao focar inputs */
                input.form-control, select.form-select, textarea.form-control {
                    font-size: 16px !important;
                }
            }

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
            .eco-spinner.eco-spinner-sm { width: 15px; height: 15px; }
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

            /* Overlay para Containers, Cards e Modais */
            .eco-loadable { position: relative; }
            .eco-loading-overlay {
                position: absolute;
                inset: 0;
                background: rgba(255, 255, 255, 0.78);
                backdrop-filter: blur(2px);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 8px;
                z-index: 50;
                border-radius: inherit;
                color: var(--eco-green);
                animation: eco-fade-in 0.15s ease-out;
            }
            .eco-loading-overlay .eco-loading-text {
                font-size: 0.78rem;
                font-weight: 600;
                color: #495057;
            }
            @keyframes eco-fade-in {
                from { opacity: 0; }
                to   { opacity: 1; }
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
            .eco-toast-body { flex: 1; min-width: 0; }
            .eco-toast-title { font-weight: 700; font-size: 0.85rem; color: #212529; line-height: 1.2; margin-bottom: 2px; }
            .eco-toast-msg { font-size: 0.8rem; color: #555; line-height: 1.35; word-break: break-word; }
            .eco-toast-close {
                background: none;
                border: none;
                color: #999;
                cursor: pointer;
                padding: 0 2px;
                font-size: 1rem;
                line-height: 1;
                transition: color 0.15s;
            }
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
        <!-- Container Global de Toasts -->
        <div id="ecoToastContainer" aria-live="polite" aria-atomic="true"></div>

        <!-- Backdrop do Menu Mobile -->
        <div id="sidebarBackdrop" class="sidebar-backdrop"></div>

        <div class="d-flex">
            <!-- Sidebar -->
            <nav id="appSidebar" class="sidebar">
                <div class="brand">
                    <a href="/dashboard" class="text-decoration-none d-inline-flex align-items-center">
                        <img src="/img/logo.png" alt="Pontua Eco" style="max-height: 36px; width: auto; max-width: 165px; object-fit: contain;">
                    </a>
                    <button type="button" id="btnCloseSidebar" class="sidebar-close-btn" aria-label="Fechar menu">
                        <i class="ph ph-x"></i>
                    </button>
                </div>
                <div class="mt-3 flex-grow-1" id="mainMenu">
                    <a href="/dashboard" class="nav-link"><i class="ph ph-squares-four"></i> Dashboard</a>
                    <a href="/meses" class="nav-link"><i class="ph ph-calendar"></i> Gestão de Meses</a>
                    <a href="/ideias" class="nav-link"><i class="ph ph-lightbulb"></i> Novas Ideias</a>
                    <a href="/relatorios" class="nav-link"><i class="ph ph-file-xls"></i> Relatórios Excel</a>
                    <hr class="mx-3 my-2 text-muted">
                    <a href="/configuracoes" class="nav-link"><i class="ph ph-gear"></i> Configurações</a>
                    <a href="/logout" class="nav-link text-danger"><i class="ph ph-sign-out"></i> Sair</a>
                </div>
                <div class="sidebar-footer">
                    <div class="dev-credit">Desenvolvido por <strong>71dev</strong></div>
                    <div class="dev-links">
                        <a href="https://wa.me/5571983174920" target="_blank" rel="noopener noreferrer" class="dev-link dev-link-wa" title="WhatsApp 71dev" aria-label="WhatsApp 71dev">
                            <i class="ph-fill ph-whatsapp-logo"></i>
                        </a>
                        <a href="https://www.instagram.com/71dev_/" target="_blank" rel="noopener noreferrer" class="dev-link dev-link-ig" title="Instagram 71dev" aria-label="Instagram 71dev">
                            <i class="ph-fill ph-instagram-logo"></i>
                        </a>
                    </div>
                </div>
            </nav>

            <!-- Content -->
            <div class="main-content">
                <header class="eco-page-header d-flex justify-content-between align-items-center mb-4 gap-2">
                    <div class="d-flex align-items-center gap-2 min-w-0">
                        <button type="button" id="btnOpenSidebar" class="btn-menu-mobile" aria-label="Abrir menu">
                            <i class="ph ph-list"></i>
                        </button>
                        <h4 class="eco-page-title m-0 fw-bold text-truncate" style="color: var(--eco-green);">${title}</h4>
                    </div>
                    <div class="user-profile d-flex align-items-center gap-2 flex-shrink-0">
                        ${userHtml}
                    </div>
                </header>
                ${content}
            </div>
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
        
        <script>
            // 1. Helper: Gera o HTML do Activity Indicator (Apple-style)
            window.createEcoSpinner = function(size) {
                var sizeClass = size ? ' eco-spinner-' + size : '';
                var blades = '';
                for (var i = 0; i < 12; i++) blades += '<span></span>';
                return '<span class="eco-spinner' + sizeClass + '" role="status" aria-hidden="true">' + blades + '</span>';
            };

            // 2. Helper: Aplica loading em um botão
            window.setButtonLoading = function(btn, loadingText) {
                if (!btn || btn.dataset.isLoading === 'true') return;
                btn.dataset.isLoading = 'true';
                btn.dataset.originalHtml = btn.innerHTML;
                btn.style.minWidth = btn.offsetWidth + 'px';
                var label = loadingText ? '<span class="ms-2">' + loadingText + '</span>' : '';
                btn.innerHTML = '<span class="d-inline-flex align-items-center justify-content-center">' + window.createEcoSpinner('sm') + label + '</span>';
                btn.disabled = true;
                btn.classList.add('disabled');
            };

            // 3. Helper: Aplica overlay de loading em containers, cards ou modais
            window.setContainerLoading = function(element, text) {
                if (!element || element.querySelector(':scope > .eco-loading-overlay')) return;
                element.classList.add('eco-loadable');
                var overlay = document.createElement('div');
                overlay.className = 'eco-loading-overlay';
                overlay.innerHTML = window.createEcoSpinner('md') + (text ? '<div class="eco-loading-text">' + text + '</div>' : '');
                element.appendChild(overlay);
            };

            // 4. Helper Global: Toast com barra invertida que fecha automaticamente
            window.showEcoToast = function(message, type, duration) {
                type = (type === 'error') ? 'danger' : (type || 'success');
                duration = duration || 4000;

                var container = document.getElementById('ecoToastContainer');
                if (!container || !message) return;

                var config = {
                    success: { title: 'Sucesso', icon: 'ph-fill ph-check-circle' },
                    danger:  { title: 'Erro',    icon: 'ph-fill ph-x-circle' },
                    warning: { title: 'Atenção', icon: 'ph-fill ph-warning-circle' },
                    info:    { title: 'Aviso',   icon: 'ph-fill ph-info' }
                };
                var cfg = config[type] || config.info;

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

            // 5. Inicialização global de Menu Mobile, Menu Ativo, Toasts e Spinners
            document.addEventListener('DOMContentLoaded', function() {
                // Controle do Drawer Mobile
                var sidebar = document.getElementById('appSidebar');
                var backdrop = document.getElementById('sidebarBackdrop');
                var btnOpen = document.getElementById('btnOpenSidebar');
                var btnClose = document.getElementById('btnCloseSidebar');

                function abrirMenu() {
                    if (sidebar) sidebar.classList.add('open');
                    if (backdrop) backdrop.classList.add('show');
                    document.body.style.overflow = 'hidden';
                }
                function fecharMenu() {
                    if (sidebar) sidebar.classList.remove('open');
                    if (backdrop) backdrop.classList.remove('show');
                    document.body.style.overflow = '';
                }

                if (btnOpen) btnOpen.addEventListener('click', abrirMenu);
                if (btnClose) btnClose.addEventListener('click', fecharMenu);
                if (backdrop) backdrop.addEventListener('click', fecharMenu);
                window.addEventListener('resize', function() {
                    if (window.innerWidth >= 992) fecharMenu();
                });

                // Marca o menu lateral ativo
                var currentPath = window.location.pathname;
                document.querySelectorAll('#mainMenu .nav-link').forEach(function(link) {
                    var href = link.getAttribute('href');
                    if (href && href !== '/logout' && currentPath.startsWith(href)) {
                        link.classList.add('active');
                    }
                    link.addEventListener('click', function() {
                        if (window.innerWidth < 992) fecharMenu();
                    });
                });

                // Dispara Toast enviado pelo servidor (se existir)
                var initialToast = ${initialToastJson};
                if (initialToast && initialToast.msg) {
                    window.showEcoToast(initialToast.msg, initialToast.tipo);
                }

                // Intercepta submissões de formulários
                document.addEventListener('submit', function(e) {
                    var form = e.target;
                    if (!form || form.tagName !== 'FORM') return;

                    var confirmMsg = form.getAttribute('data-confirm');
                    if (confirmMsg && !window.confirm(confirmMsg)) {
                        e.preventDefault();
                        return;
                    }

                    var submitBtn = form.querySelector('button[type="submit"]');
                    if (submitBtn) {
                        var loadingText = submitBtn.getAttribute('data-loading-text') || '';
                        window.setButtonLoading(submitBtn, loadingText);
                    }

                    var modalContent = form.closest('.modal-content');
                    if (modalContent) {
                        var modalMsg = form.getAttribute('data-loading-text') || 'Processando...';
                        window.setContainerLoading(modalContent, modalMsg);
                    }

                    var targets = form.getAttribute('data-loading-targets');
                    if (targets) {
                        var overlayMsg = form.getAttribute('data-loading-text') || 'Atualizando...';
                        targets.split(',').forEach(function(selector) {
                            var el = document.querySelector(selector.trim());
                            if (el) window.setContainerLoading(el, overlayMsg);
                        });
                    }
                });

                // Ativa spinner em links marcados com data-loading-link
                document.querySelectorAll('a[data-loading-link]').forEach(function(link) {
                    link.addEventListener('click', function(e) {
                        if (e.ctrlKey || e.metaKey || e.shiftKey) return;
                        var text = link.getAttribute('data-loading-text') || '';
                        window.setButtonLoading(link, text);
                    });
                });
            });

            // Restaura botões/overlays no botão Voltar do navegador (bfcache)
            window.addEventListener('pageshow', function(event) {
                if (event.persisted) {
                    document.querySelectorAll('.eco-loading-overlay').forEach(function(el) { el.remove(); });
                    document.querySelectorAll('[data-is-loading="true"]').forEach(function(btn) {
                        if (btn.dataset.originalHtml) btn.innerHTML = btn.dataset.originalHtml;
                        btn.disabled = false;
                        btn.classList.remove('disabled');
                        delete btn.dataset.isLoading;
                    });
                }
            });
        </script>
        
        ${scripts}
    </body>
    </html>
    `;
};