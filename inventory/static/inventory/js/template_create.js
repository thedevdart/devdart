window.TemplateCreateApp = {
    csrfToken: null,
    createUrl: null,
    
    centers: [],
    templates: [],
    
    selectedCenters: new Set(),
    selectedTemplates: new Set(),

    init() {
        const envEl = document.getElementById('env-data');
        if (envEl) {
            this.csrfToken = envEl.getAttribute('data-csrf');
            this.createUrl = envEl.getAttribute('data-create-url');
        }

        try {
            this.centers = JSON.parse(document.getElementById('centers-data').textContent);
            this.templates = JSON.parse(document.getElementById('templates-data').textContent);
        } catch (e) {
            console.error("Failed to parse data payload", e);
        }

        this.renderCenters();
        this.renderTemplates();
    },

    showToast(title, msg, type = 'error') {
        const toast = document.getElementById('toast');
        const icon = document.getElementById('toast-icon');
        const titleEl = document.getElementById('toast-title');
        const msgEl = document.getElementById('toast-msg');
        const borderEl = toast.firstElementChild;

        titleEl.innerText = title;
        msgEl.innerText = msg;

        if (type === 'success') {
            icon.className = 'fa-solid fa-check text-brand text-lg mt-0.5';
            borderEl.className = 'bg-accent text-brand px-5 py-4 rounded-md shadow-2xl flex items-start gap-4 min-w-[320px] max-w-sm border-l-4 border-brand';
        } else {
            icon.className = 'fa-solid fa-xmark text-red-500 text-lg mt-0.5';
            borderEl.className = 'bg-brand text-white px-5 py-4 rounded-md shadow-2xl flex items-start gap-4 min-w-[320px] max-w-sm border-l-4 border-red-500';
        }

        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.remove('translate-y-full', 'opacity-0'), 10);
        setTimeout(() => {
            toast.classList.add('translate-y-full', 'opacity-0');
            setTimeout(() => toast.classList.add('hidden'), 300);
        }, 4000);
    },

    // --- RENDERERS ---
    renderCenters() {
        const container = document.getElementById('centers-grid');
        if (!container) return;

        let html = '';
        this.centers.forEach(c => {
            const isSelected = this.selectedCenters.has(c.id);
            const activeClasses = isSelected 
                ? 'bg-primary/10 border-primary text-primary' 
                : 'bg-white dark:bg-[#0a0f18] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-primary/50';
            
            const checkClasses = isSelected
                ? 'bg-primary border-primary text-white'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-transparent';

            html += `
            <label class="flex items-center gap-3 p-3.5 rounded-md border cursor-pointer transition-all shadow-sm group ${activeClasses}">
                <div class="w-4 h-4 rounded-sm border flex items-center justify-center transition-colors shrink-0 ${checkClasses}">
                    <i class="fa-solid fa-check text-[10px]"></i>
                </div>
                <input type="checkbox" class="hidden" value="${c.id}" onchange="window.TemplateCreateApp.toggleCenter(${c.id})" ${isSelected ? 'checked' : ''}>
                <span class="text-[11px] font-black uppercase tracking-widest truncate flex-1">${c.name}</span>
                <span class="ml-auto text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-sm">${c.category || 'NA'}</span>
            </label>
            `;
        });
        container.innerHTML = html;
    },

    renderTemplates() {
        const container = document.getElementById('templates-grid');
        const wrapper = document.getElementById('templates-wrapper');
        
        if (!container || !wrapper) return;

        if (this.templates.length === 0) {
            wrapper.style.display = 'none';
            return;
        }

        let html = '';
        this.templates.forEach(t => {
            const isSelected = this.selectedTemplates.has(t.id);
            const activeClasses = isSelected 
                ? 'bg-accent/20 border-accent/50 text-brand dark:text-accent' 
                : 'bg-white dark:bg-[#0a0f18] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-accent/50';
            
            const checkClasses = isSelected
                ? 'bg-accent border-accent text-brand'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-transparent';

            html += `
            <label class="flex items-center gap-3 p-3.5 rounded-md border cursor-pointer transition-all shadow-sm group ${activeClasses}">
                <div class="w-4 h-4 rounded-sm border flex items-center justify-center transition-colors shrink-0 ${checkClasses}">
                    <i class="fa-solid fa-check text-[10px]"></i>
                </div>
                <input type="checkbox" class="hidden" value="${t.id}" onchange="window.TemplateCreateApp.toggleTemplate(${t.id})" ${isSelected ? 'checked' : ''}>
                <span class="text-[11px] font-black uppercase tracking-widest truncate flex-1">${t.name}</span>
            </label>
            `;
        });
        container.innerHTML = html;
    },

    // --- ACTIONS ---
    toggleCenter(id) {
        if (this.selectedCenters.has(id)) this.selectedCenters.delete(id);
        else this.selectedCenters.add(id);
        this.renderCenters();
    },

    toggleTemplate(id) {
        if (this.selectedTemplates.has(id)) this.selectedTemplates.delete(id);
        else this.selectedTemplates.add(id);
        this.renderTemplates();
    },

    selectAllCenters() {
        this.centers.forEach(c => this.selectedCenters.add(c.id));
        this.renderCenters();
    },

    selectCategory(cat) {
        this.selectedCenters.clear();
        this.centers.filter(c => c.category === cat).forEach(c => this.selectedCenters.add(c.id));
        this.renderCenters();
    },

    clearAll() {
        this.selectedCenters.clear();
        this.selectedTemplates.clear();
        this.renderCenters();
        this.renderTemplates();
    },

    async submitTemplate() {
        const nameInput = document.getElementById('templateNameInput').value.trim();
        if (!nameInput) return this.showToast("Validation Error", "Please enter a template name.", "error");
        if (this.selectedCenters.size === 0 && this.selectedTemplates.size === 0) {
            return this.showToast("Validation Error", "Select at least one source center or template.", "error");
        }

        const btn = document.getElementById('submitBtn');
        const originalHTML = btn.innerHTML;
        
        btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Merging Data...`;
        btn.disabled = true;

        const payload = {
            template_name: nameInput,
            center_ids: Array.from(this.selectedCenters),
            template_ids: Array.from(this.selectedTemplates)
        };

        try {
            const res = await fetch(this.createUrl, {
                method: 'POST',
                headers: { 'X-CSRFToken': this.csrfToken, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if (data.status === 'success') {
                btn.className = "w-full bg-accent text-brand font-black py-4 rounded-md shadow-md transition-colors flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest";
                btn.innerHTML = `<i class="fa-solid fa-check"></i> Master Template Created`;
                setTimeout(() => window.location.href = data.url, 800);
            } else {
                this.showToast("Error", data.message, "error");
                btn.innerHTML = originalHTML;
                btn.disabled = false;
            }
        } catch(e) {
            this.showToast("Network Error", "Could not connect to the server.", "error");
            btn.innerHTML = originalHTML;
            btn.disabled = false;
        }
    }
};

document.addEventListener("DOMContentLoaded", () => window.TemplateCreateApp.init());