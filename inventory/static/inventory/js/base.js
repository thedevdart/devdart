// 1. Theme Logic
function updateThemeUI(isDark) {
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');
    if (isDark) {
        if(themeIcon) themeIcon.className = 'fa-solid fa-sun text-accent';
        if(themeText) themeText.innerText = 'Light Mode';
    } else {
        if(themeIcon) themeIcon.className = 'fa-solid fa-moon text-primary';
        if(themeText) themeText.innerText = 'Dark Mode';
    }
}

updateThemeUI(document.documentElement.classList.contains('dark'));

window.toggleTheme = function() {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
        document.documentElement.classList.remove('dark');
        localStorage.theme = 'light';
        updateThemeUI(false);
    } else {
        document.documentElement.classList.add('dark');
        localStorage.theme = 'dark';
        updateThemeUI(true);
    }
};

// 2. Mobile & Desktop Sidebar Logic
document.addEventListener('click', e => {
    // A. Desktop Collapse Logic
    const toggleBtn = e.target.closest('#sidebar-toggle');
    if (toggleBtn) {
        const htmlEl = document.documentElement;
        htmlEl.classList.toggle('sidebar-collapsed');
        localStorage.setItem('sidebarCollapsed', htmlEl.classList.contains('sidebar-collapsed'));
    }

    // B. Mobile Hamburger / Overlay Logic
    const mobileBtn = e.target.closest('#mobile-menu-btn');
    const overlay = document.getElementById('mobile-overlay');
    const sidebar = document.getElementById('main-sidebar');
    
    if (mobileBtn || e.target.id === 'mobile-overlay') {
        if (!sidebar || !overlay) return;
        
        const isClosed = sidebar.classList.contains('-translate-x-full');
        if (isClosed) {
            // Open Mobile Sidebar
            sidebar.classList.remove('-translate-x-full');
            overlay.classList.remove('hidden');
            setTimeout(() => overlay.classList.remove('opacity-0'), 10);
        } else {
            // Close Mobile Sidebar
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('opacity-0');
            setTimeout(() => overlay.classList.add('hidden'), 300);
        }
    }
});

// 3. SPA Router (Seamless Transitions)
const loader = document.getElementById('top-loader');

async function navigateTo(url) {
    loader.classList.remove('finishing');
    loader.classList.add('loading');

    // CRITICAL MOBILE FIX: Auto-close the sidebar when a link is clicked on phones
    if (window.innerWidth < 768) {
        const sidebar = document.getElementById('main-sidebar');
        const overlay = document.getElementById('mobile-overlay');
        if(sidebar) sidebar.classList.add('-translate-x-full');
        if(overlay) {
            overlay.classList.add('opacity-0');
            setTimeout(() => overlay.classList.add('hidden'), 300);
        }
    }

    try {
        const response = await fetch(url);
        const html = await response.text();
        
        const parser = new DOMParser();
        const newDoc = parser.parseFromString(html, 'text/html');
        
        const currentMain = document.querySelector('main');
        const newMain = newDoc.querySelector('main');
        currentMain.innerHTML = newMain.innerHTML;
        
        document.title = newDoc.title;

        // Safely re-execute scripts in <main>
        const scripts = currentMain.querySelectorAll('script');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            newScript.appendChild(document.createTextNode(oldScript.innerHTML));
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });

        history.pushState({}, '', url);

        // Update Custom Active States (CSS handles the icon color automatically now!)
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('bg-primary/10', 'text-white', 'active-nav');
            link.classList.add('text-white/60', 'hover:bg-white/5', 'hover:text-white');
            
            if (link.getAttribute('href') === new URL(url).pathname) {
                link.classList.remove('text-white/60', 'hover:bg-white/5', 'hover:text-white');
                link.classList.add('bg-primary/10', 'text-white', 'active-nav');
            }
        });

        loader.classList.remove('loading');
        loader.classList.add('finishing');
        setTimeout(() => loader.classList.remove('finishing'), 300);
        
        document.dispatchEvent(new Event('DOMContentLoaded'));

    } catch (err) {
        console.error('Navigation failed:', err);
        window.location.href = url; // Fallback
    }
}

// Intercept sidebar navigation
document.addEventListener('click', e => {
    const link = e.target.closest('a.nav-link');
    if (!link || link.target === '_blank' || e.ctrlKey || e.metaKey || link.hasAttribute('data-no-transition')) return;
    e.preventDefault();
    navigateTo(link.href);
});

window.addEventListener('popstate', () => {
    navigateTo(window.location.href);
});

// 4. Global Application Modal
window.AppModal = {
    show({ title, message, type = 'confirm', inputPlaceholder = '', confirmText = 'Confirm', cancelText = 'Cancel', confirmColor = 'bg-primary hover:opacity-90 text-white' }) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = "fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 opacity-0 transition-opacity duration-200";
            
            const box = document.createElement('div');
            box.className = "app-modal bg-white dark:bg-slate-800 shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 dark:border-slate-700 transform scale-95 transition-transform duration-200 rounded-md";
            
            let inputHtml = type === 'prompt' ? `<input type="text" id="app-modal-input" placeholder="${inputPlaceholder}" class="w-full mt-5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-slate-800 dark:text-white font-bold outline-none focus:border-primary transition-colors rounded-md">` : '';

            box.innerHTML = `
                <div class="p-6">
                    <h3 class="text-lg font-black text-slate-900 dark:text-white mb-2 uppercase tracking-wide">${title}</h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400 font-medium">${message}</p>
                    ${inputHtml}
                    <div class="flex gap-3 mt-8">
                        <button id="app-modal-cancel" class="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-bold transition-colors rounded-md">${cancelText}</button>
                        <button id="app-modal-confirm" class="btn-confirm flex-1 px-4 py-2.5 font-bold transition-all rounded-md ${confirmColor}">${confirmText}</button>
                    </div>
                </div>
            `;

            overlay.appendChild(box);
            document.body.appendChild(overlay);

            requestAnimationFrame(() => {
                overlay.classList.remove('opacity-0');
                box.classList.remove('scale-95');
            });

            const inputEl = box.querySelector('#app-modal-input');
            if (inputEl) inputEl.focus();

            const close = (result) => {
                overlay.classList.add('opacity-0');
                box.classList.add('scale-95');
                setTimeout(() => overlay.remove(), 200);
                resolve(result);
            };

            box.querySelector('#app-modal-cancel').onclick = () => close(null);
            if (inputEl) inputEl.addEventListener('keypress', (e) => { if (e.key === 'Enter') close(inputEl.value.trim()); });
            box.querySelector('#app-modal-confirm').onclick = () => close(type === 'prompt' ? (inputEl ? inputEl.value.trim() : null) : true);
        });
    },
    async confirm(title, message, options = {}) { return await this.show({ title, message, type: 'confirm', ...options }); },
    async prompt(title, message, placeholder = "", options = {}) { return await this.show({ title, message, type: 'prompt', inputPlaceholder: placeholder, ...options }); }
};