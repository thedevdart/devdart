window.CenterAliasesApp = {
    csrfToken: '',
    centerId: '',
    masters: [],
    
    // State for delete modal
    targetMasterId: null,
    targetAliasId: null,

    init() {
        const envEl = document.getElementById('env-data');
        if (!envEl) return;
        
        this.centerId = envEl.getAttribute('data-center-id');
        this.csrfToken = envEl.getAttribute('data-csrf');

        try {
            const rawData = document.getElementById('masters-data').textContent;
            this.masters = JSON.parse(rawData);
            this.renderAllCards();
            this.attachSearch();
        } catch(e) {
            console.error("Failed to load master JSON:", e);
            document.getElementById('data-error-state').classList.remove('hidden');
        }
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

    // --- RENDER ENGINE ---
    renderAllCards() {
        const container = document.getElementById('alias-container');
        let html = '';
        this.masters.forEach(m => {
            html += this.generateCardHTML(m);
        });
        container.innerHTML = html;
    },

    generateCardHTML(master) {
        const isRaw = master.category === 'Raw Material';
        const iconColor = isRaw ? 'text-primary' : 'text-accent';
        const iconBg = isRaw ? 'bg-primary/10 border-primary/20' : 'bg-accent/10 border-accent/20';
        const iconClass = isRaw ? 'fa-layer-group' : 'fa-box-open';

        let aliasesHtml = '';
        if(master.aliases.length === 0) {
            aliasesHtml = `<div id="empty-alias-${master.id}" class="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest py-1">No aliases mapped</div>`;
        } else {
            master.aliases.forEach(a => {
                aliasesHtml += this.generateAliasPill(master.id, a.id, a.name);
            });
        }

        return `
        <div id="master-card-${master.id}" class="master-card bg-white dark:bg-slate-900 rounded-md shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-4 transition-all" data-name="${master.name.toLowerCase()}">
            <div class="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-slate-950 shrink-0">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-md flex items-center justify-center border ${iconBg} ${iconColor} shrink-0">
                        <i class="fa-solid ${iconClass} text-sm"></i>
                    </div>
                    <div>
                        <h3 class="font-black text-slate-800 dark:text-white text-[12px] uppercase tracking-widest">${master.name}</h3>
                        <p class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">${master.category}</p>
                    </div>
                </div>
                
                <form onsubmit="event.preventDefault(); window.CenterAliasesApp.addAlias(${master.id})" class="flex items-center gap-2 w-full sm:w-auto">
                    <input type="text" id="input-alias-${master.id}" placeholder="ADD MAPPING ALIAS..." class="flex-1 sm:w-64 px-4 py-2.5 text-[10px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md focus:border-primary focus:ring-1 focus:ring-primary outline-none text-slate-900 dark:text-white uppercase font-black tracking-widest placeholder:text-slate-400 transition-all shadow-inner">
                    <button type="submit" id="btn-add-${master.id}" class="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm disabled:opacity-50 active:scale-95 border border-transparent h-full">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                </form>
            </div>
            <div class="p-5 bg-white dark:bg-slate-900">
                <div id="alias-list-${master.id}" class="flex flex-wrap gap-2.5">
                    ${aliasesHtml}
                </div>
            </div>
        </div>`;
    },

    generateAliasPill(masterId, aliasId, aliasName) {
        return `
        <span id="alias-pill-${aliasId}" class="inline-flex items-center gap-2 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-sm border border-slate-200 dark:border-slate-800 text-[10px] uppercase font-black tracking-widest shadow-sm group transition-colors hover:border-red-400 dark:hover:border-red-500">
            <span>${aliasName}</span>
            <button type="button" onclick="window.CenterAliasesApp.openDeleteConfirm(${masterId}, ${aliasId}, '${aliasName}')" class="text-slate-400 hover:text-red-500 transition-colors focus:outline-none flex items-center justify-center">
                <i class="fa-solid fa-xmark text-[10px]"></i>
            </button>
        </span>`;
    },

    // --- SEARCH INTERACTION ---
    attachSearch() {
        const searchInput = document.getElementById('aliasSearch');
        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase().trim();
            const cards = document.querySelectorAll('.master-card');
            let visibleCount = 0;
            
            cards.forEach(c => {
                if (c.dataset.name.includes(q)) {
                    c.style.display = '';
                    visibleCount++;
                } else {
                    c.style.display = 'none';
                }
            });
            
            const emptyState = document.getElementById('empty-search-state');
            if (visibleCount === 0 && cards.length > 0) {
                emptyState.classList.remove('hidden');
            } else {
                emptyState.classList.add('hidden');
            }
        });
    },

    // --- API LOGIC ---
    async addAlias(masterId) {
        const inputEl = document.getElementById(`input-alias-${masterId}`);
        const btnEl = document.getElementById(`btn-add-${masterId}`);
        const aliasText = inputEl.value.trim().toUpperCase();

        if (!aliasText || !this.centerId) return;

        const originalBtnHtml = btnEl.innerHTML;
        btnEl.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i>`;
        btnEl.disabled = true;
        inputEl.disabled = true;

        try {
            const response = await fetch(`/inventory/api/center/${this.centerId}/add-alias/`, {
                method: 'POST',
                headers: { 
                    'X-CSRFToken': this.csrfToken, 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                    master_id: masterId,
                    alias_name: aliasText
                })
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                const listContainer = document.getElementById(`alias-list-${masterId}`);
                const emptyMsg = document.getElementById(`empty-alias-${masterId}`);
                if(emptyMsg) emptyMsg.remove(); // Clear empty state if it exists
                
                // Inject new pill directly into the DOM
                listContainer.insertAdjacentHTML('beforeend', this.generateAliasPill(masterId, data.alias_id, data.alias_name));
                
                inputEl.value = '';
                this.showToast("Mapped Successfully", `"${data.alias_name}" mapped instantly.`, "success");
            } else {
                this.showToast("Mapping Failed", data.message, "error");
            }
        } catch(e) {
            this.showToast("Network Error", "Failed to connect to the server.", "error");
        }
        
        btnEl.innerHTML = originalBtnHtml;
        btnEl.disabled = false;
        inputEl.disabled = false;
        inputEl.focus(); // Return focus so user can keep typing fast
    },

    // --- DELETE MODAL FLOW ---
    openDeleteConfirm(masterId, aliasId, aliasName) {
        this.targetMasterId = masterId;
        this.targetAliasId = aliasId;
        
        document.getElementById('deleteTargetName').innerText = aliasName;
        
        const modal = document.getElementById('deleteConfirmModal');
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.firstElementChild.classList.remove('opacity-0', 'scale-95');
            modal.firstElementChild.classList.add('opacity-100', 'scale-100');
        }, 10);
    },

    closeDeleteConfirm() {
        const modal = document.getElementById('deleteConfirmModal');
        modal.firstElementChild.classList.remove('opacity-100', 'scale-100');
        modal.firstElementChild.classList.add('opacity-0', 'scale-95');
        setTimeout(() => modal.classList.add('hidden'), 300);
        
        this.targetMasterId = null;
        this.targetAliasId = null;
    },

    async confirmDelete() {
        if (!this.targetAliasId) return;

        const btn = document.getElementById('confirmDeleteBtn');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Deleting...`;
        btn.disabled = true;

        try {
            const response = await fetch(`/inventory/api/alias/${this.targetAliasId}/delete/`, {
                method: 'POST', 
                headers: { 'X-CSRFToken': this.csrfToken }
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                // Surgically remove the pill from the DOM
                const pill = document.getElementById(`alias-pill-${this.targetAliasId}`);
                if (pill) pill.remove();

                // Check if we need to show the empty message again
                const listContainer = document.getElementById(`alias-list-${this.targetMasterId}`);
                if (listContainer && listContainer.children.length === 0) {
                    listContainer.innerHTML = `<div id="empty-alias-${this.targetMasterId}" class="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest py-1">No aliases mapped</div>`;
                }

                this.showToast("Alias Removed", "The mapping has been deleted.", "success");
                this.closeDeleteConfirm();
            } else {
                this.showToast("Error", data.message, "error");
                this.closeDeleteConfirm();
            }
        } catch(e) {
            this.showToast("Network Error", "Failed to delete alias.", "error");
            this.closeDeleteConfirm();
        }
        
        btn.innerHTML = originalHtml;
        btn.disabled = false;
    }
};

document.addEventListener("DOMContentLoaded", () => window.CenterAliasesApp.init());