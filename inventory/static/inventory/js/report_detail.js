window.ReportDetailApp = {
    csrfToken: null,
    updateUrl: null,
    centerId: null,
    currentReportDate: null,
    currentTab: 'closing',
    isZoomActive: false,

    init() {
        const envEl = document.getElementById('env-data');
        if (envEl) {
            this.csrfToken = envEl.getAttribute('data-csrf');
            this.updateUrl = envEl.getAttribute('data-update-url');
            this.centerId = envEl.getAttribute('data-center-id');
            this.currentReportDate = envEl.getAttribute('data-current-date');
        }

        this.initCalendars();
        this.initCustomSelects();
        this.bindEvents();
        this.calculateTotals();
        
        const initialImageUrl = envEl?.getAttribute('data-image-url');
        if (initialImageUrl) this.renderDocument(initialImageUrl);

        document.querySelectorAll('.row-item').forEach(row => this.updateRowTheme(row, row.dataset.cat));
    },

    bindEvents() {
        const editBody = document.getElementById('editBody');
        if (editBody) {
            editBody.addEventListener('input', (e) => {
                if (e.target.tagName === 'INPUT') this.calculateTotals();
            });
        }
        
        const viewer = document.getElementById('viewerContainer');
        if(viewer) {
            viewer.addEventListener('mousemove', (e) => this.handleZoomMove(e));
            viewer.addEventListener('mouseleave', () => this.resetZoom());
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
            icon.className = 'fa-solid fa-check text-accent text-lg mt-0.5';
            borderEl.className = 'bg-brand text-white px-5 py-4 rounded-md shadow-2xl flex items-start gap-4 min-w-[320px] max-w-sm border-l-4 border-accent';
        } else if (type === 'warning') {
            icon.className = 'fa-solid fa-triangle-exclamation text-amber-500 text-lg mt-0.5';
            borderEl.className = 'bg-brand text-white px-5 py-4 rounded-md shadow-2xl flex items-start gap-4 min-w-[320px] max-w-sm border-l-4 border-amber-500';
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

    initCustomSelects() {
        const selects = document.querySelectorAll('.custom-select');
        
        selects.forEach(wrapper => {
            if (wrapper.dataset.initialized) return;
            wrapper.dataset.initialized = "true";

            const trigger = wrapper.querySelector('.select-trigger');
            const dropdown = wrapper.querySelector('.select-dropdown');
            const valueSpan = wrapper.querySelector('.select-value');
            const hiddenInput = wrapper.querySelector('input[type="hidden"]');
            const icon = wrapper.querySelector('.fa-chevron-down');
            const options = wrapper.querySelectorAll('.select-option');

            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                
                document.querySelectorAll('.custom-select').forEach(otherWrapper => {
                    if (otherWrapper !== wrapper) {
                        otherWrapper.style.zIndex = "10";
                        const drop = otherWrapper.querySelector('.select-dropdown');
                        if (drop && !drop.classList.contains('hidden')) {
                            drop.classList.add('hidden', 'opacity-0', 'scale-y-95');
                            const otherIcon = otherWrapper.querySelector('.fa-chevron-down');
                            if(otherIcon) otherIcon.classList.remove('rotate-180');
                        }
                    }
                });

                if (dropdown.classList.contains('hidden')) {
                    wrapper.style.zIndex = "50";
                    dropdown.classList.remove('hidden');
                    setTimeout(() => {
                        dropdown.classList.remove('opacity-0', 'scale-y-95');
                        dropdown.classList.add('opacity-100', 'scale-y-100');
                    }, 10);
                    if(icon) icon.classList.add('rotate-180');
                } else {
                    wrapper.style.zIndex = "10";
                    dropdown.classList.remove('opacity-100', 'scale-y-100');
                    dropdown.classList.add('opacity-0', 'scale-y-95');
                    setTimeout(() => dropdown.classList.add('hidden'), 200);
                    if(icon) icon.classList.remove('rotate-180');
                }
            });

            options.forEach(opt => {
                opt.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const val = opt.dataset.value;
                    hiddenInput.value = val;
                    
                    valueSpan.innerHTML = opt.querySelector('.option-content').innerHTML;
                    
                    const tr = wrapper.closest('tr');
                    if (tr) this.updateRowTheme(tr, val);
                    if (wrapper.classList.contains('bulk-select')) this.applyBulkCategory(val);

                    wrapper.style.zIndex = "10";
                    dropdown.classList.remove('opacity-100', 'scale-y-100');
                    dropdown.classList.add('opacity-0', 'scale-y-95');
                    setTimeout(() => dropdown.classList.add('hidden'), 200);
                    if(icon) icon.classList.remove('rotate-180');
                });
            });
        });

        document.addEventListener('click', () => {
            document.querySelectorAll('.custom-select').forEach(wrapper => {
                wrapper.style.zIndex = "10";
                const dropdown = wrapper.querySelector('.select-dropdown');
                if (dropdown && !dropdown.classList.contains('hidden')) {
                    dropdown.classList.remove('opacity-100', 'scale-y-100');
                    dropdown.classList.add('opacity-0', 'scale-y-95');
                    setTimeout(() => dropdown.classList.add('hidden'), 200);
                    const icon = wrapper.querySelector('.fa-chevron-down');
                    if(icon) icon.classList.remove('rotate-180');
                }
            });
        });
    },

    initCalendars() {
        const customYearPlugin = {
            onReady: function(selectedDates, dateStr, instance) {
                const yearInput = instance.currentYearElement;
                const yearWrapper = yearInput.parentNode;
                yearInput.style.display = 'none'; 
                const select = document.createElement('select');
                select.className = 'cur-year-dropdown';
                const currentYear = new Date().getFullYear();
                for(let i = currentYear - 10; i <= currentYear + 10; i++) {
                    const opt = document.createElement('option');
                    opt.value = i; opt.text = i;
                    if(i === parseInt(yearInput.value)) opt.selected = true;
                    select.appendChild(opt);
                }
                select.addEventListener('change', function(e) { instance.changeYear(e.target.value); });
                instance.yearSelect = select;
                yearWrapper.appendChild(select);
            },
            onYearChange: function(selectedDates, dateStr, instance) {
                if(instance.yearSelect) instance.yearSelect.value = instance.currentYear;
            }
        };

        const navDate = document.getElementById("navDate");
        if (navDate) {
            flatpickr(navDate, {
                dateFormat: "Y-m-d", altInput: true, altFormat: "d M Y",
                defaultDate: this.currentReportDate,
                onReady: customYearPlugin.onReady, onYearChange: customYearPlugin.onYearChange,
                onChange: (selectedDates, dateStr) => this.navigateTime('exact')
            });
        }

        const modalDate = document.getElementById("modalDateInput");
        if (modalDate) {
            flatpickr(modalDate, {
                dateFormat: "Y-m-d", altInput: true, altFormat: "F j, Y",
                defaultDate: this.currentReportDate,
                onReady: customYearPlugin.onReady, onYearChange: customYearPlugin.onYearChange
            });
        }
    },

    // --- MODAL FIXES ---
    // Safely targeting the inner div for scaling, without leaving an invisible shield blocking clicks
    openChangeDateModal() {
        const m = document.getElementById('changeDateModal');
        document.getElementById('modalDateInput')._flatpickr.setDate(this.currentReportDate);
        m.classList.remove('hidden');
        setTimeout(() => {
            m.firstElementChild.classList.remove('opacity-0', 'scale-95');
            m.firstElementChild.classList.add('opacity-100', 'scale-100');
        }, 10);
    },
    
    closeChangeDateModal() {
        const m = document.getElementById('changeDateModal');
        m.firstElementChild.classList.remove('opacity-100', 'scale-100');
        m.firstElementChild.classList.add('opacity-0', 'scale-95');
        setTimeout(() => m.classList.add('hidden'), 300);
    },
    
    confirmChangeDate() {
        const newDateStr = document.getElementById('modalDateInput').value;
        if (!newDateStr) return;
        this.currentReportDate = newDateStr;
        document.getElementById('navDate')._flatpickr.setDate(newDateStr, false); 
        this.closeChangeDateModal();
        this.showToast("Date Changed", "Click 'Save Changes' to permanently move this report.", "warning");
    },

    openNoReportModal(dateStr, action) {
        const m = document.getElementById('noReportModal');
        const msg = action === 'exact' ? `No report exists for ${dateStr}.` : `No ${action} report found.`;
        document.getElementById('noReportMessage').innerText = msg;
        m.classList.remove('hidden');
        setTimeout(() => {
            m.firstElementChild.classList.remove('opacity-0', 'scale-95');
            m.firstElementChild.classList.add('opacity-100', 'scale-100');
        }, 10);
    },
    
    closeNoReportModal() {
        const m = document.getElementById('noReportModal');
        m.firstElementChild.classList.remove('opacity-100', 'scale-100');
        m.firstElementChild.classList.add('opacity-0', 'scale-95');
        setTimeout(() => m.classList.add('hidden'), 300);
    },

    switchTab(tabName) {
        this.currentTab = tabName;
        const tabs = ['opening', 'inward', 'dispatch', 'closing'];
        
        document.getElementById('card-title-rm').innerText = "Raw Material " + tabName;
        document.getElementById('card-title-fg').innerText = "Finished Goods " + tabName;
        document.getElementById('card-title-grand').innerText = "Grand Total " + tabName;

        tabs.forEach(t => {
            const btn = document.getElementById(`tab-${t}`);
            if (t === tabName) {
                btn.className = "tab-btn flex-1 py-1.5 text-[10px] font-black rounded-sm border transition-all bg-primary/10 text-primary border-primary/20 shadow-sm uppercase tracking-widest";
            } else {
                btn.className = "tab-btn flex-1 py-1.5 text-[10px] font-bold rounded-sm border transition-all text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 uppercase tracking-widest";
            }
            document.querySelectorAll(`.col-${t}`).forEach(el => {
                if (t === tabName) el.classList.remove('hidden');
                else el.classList.add('hidden');
            });
        });
        this.calculateTotals();
    },

    calculateTotals() {
        let rmTotal = 0, fgTotal = 0;
        const rows = document.querySelectorAll('#editBody tr');

        rows.forEach(row => {
            const cat = row.dataset.cat;
            const op = parseFloat(String(row.querySelector('.val-op').value).replace(/,/g, '')) || 0;
            const inw = parseFloat(String(row.querySelector('.val-inw').value).replace(/,/g, '')) || 0;
            const disp = parseFloat(String(row.querySelector('.val-disp').value).replace(/,/g, '')) || 0;
            const clo = parseFloat(String(row.querySelector('.val-clo').value).replace(/,/g, '')) || 0;

            const calc = Math.round((op + inw - disp) * 1000) / 1000;
            const tallyIcon = row.querySelector('.tally-cell i');
            if (Math.trunc(calc) === Math.trunc(clo) && (op > 0 || inw > 0 || disp > 0 || clo > 0)) {
                tallyIcon.className = "fa-solid fa-circle-check text-accent drop-shadow-sm";
                tallyIcon.title = "Perfectly Tallied";
            } else if (Math.trunc(calc) !== Math.trunc(clo) && (op > 0 || inw > 0 || disp > 0 || clo > 0)) {
                tallyIcon.className = "fa-solid fa-circle-xmark text-red-500 cursor-help";
                tallyIcon.title = `Expected: ${calc}`;
            } else {
                tallyIcon.className = "fa-solid fa-minus text-slate-300 dark:text-slate-700";
            }

            let valToSum = 0;
            if (this.currentTab === 'opening') valToSum = op;
            else if (this.currentTab === 'inward') valToSum = inw;
            else if (this.currentTab === 'dispatch') valToSum = disp;
            else valToSum = clo;

            if (cat === 'Raw Material') rmTotal += valToSum;
            else fgTotal += valToSum;
        });

        document.getElementById('stat-rm').innerText = Math.round(rmTotal).toLocaleString();
        document.getElementById('stat-fg').innerText = Math.round(fgTotal).toLocaleString();
        document.getElementById('stat-grand').innerText = Math.round(rmTotal + fgTotal).toLocaleString();
    },

    updateRowTheme(tr, category) {
        if (!category) return;
        tr.dataset.cat = category; 
        
        if (category === 'Raw Material') {
            tr.className = "group row-item bg-orange-50/50 hover:bg-orange-100/60 dark:bg-orange-500/5 dark:hover:bg-orange-500/10 border-b border-slate-100 dark:border-slate-800 transition-colors";
        } else if (category === 'Finished Goods') {
            tr.className = "group row-item bg-emerald-50/50 hover:bg-emerald-100/60 dark:bg-emerald-500/5 dark:hover:bg-emerald-500/10 border-b border-slate-100 dark:border-slate-800 transition-colors";
        }
        this.calculateTotals();
    },

    applyBulkCategory(value) {
        if (!value) return;
        document.querySelectorAll('#editBody tr').forEach(row => {
            const hiddenInput = row.querySelector('.custom-select input[type="hidden"]');
            const valueSpan = row.querySelector('.select-value');
            if (hiddenInput && valueSpan) { 
                hiddenInput.value = value;
                const pillClass = value === 'Raw Material' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
                const pillText = value === 'Raw Material' ? 'RM' : 'FG';
                valueSpan.innerHTML = `<div class="option-content"><span class="px-2 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest ${pillClass}">${pillText}</span></div>`;
                this.updateRowTheme(row, value); 
            }
        });
        
        const bulkSelectVal = document.querySelector('.bulk-select .select-value');
        if (bulkSelectVal) bulkSelectVal.innerHTML = `<div class="option-content"><i class="fa-solid fa-ellipsis-vertical text-slate-400"></i></div>`;
    },

    addRow() {
        const tbody = document.getElementById('editBody');
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td class="px-2 py-3 align-middle text-center border-r border-slate-100 dark:border-slate-800 tally-cell">
                <i class="fa-solid fa-minus text-slate-300 dark:text-slate-700"></i>
            </td>
            <td class="px-3 py-2.5 align-middle border-r border-slate-100 dark:border-slate-800">
                <div class="relative custom-select z-20 w-full">
                    <input type="hidden" value="Raw Material">
                    <div class="select-trigger w-full px-2 py-1.5 bg-transparent hover:bg-white dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-sm cursor-pointer transition-all flex items-center justify-between">
                        <div class="select-value flex-1 text-center">
                            <div class="option-content"><span class="px-2 py-1 bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 rounded-sm text-[10px] font-black uppercase tracking-widest">RM</span></div>
                        </div>
                        <i class="fa-solid fa-chevron-down text-[8px] text-slate-300 opacity-0 transition-all"></i>
                    </div>
                    <div class="select-dropdown absolute top-full left-1/2 -translate-x-1/2 w-32 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-xl z-50 hidden opacity-0 transition-opacity duration-200 py-1 text-center">
                        <div class="select-option px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors" data-value="Raw Material">
                            <div class="option-content"><span class="px-2 py-1 bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 rounded-sm text-[10px] font-black uppercase tracking-widest">RM</span></div>
                        </div>
                        <div class="select-option px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors" data-value="Finished Goods">
                            <div class="option-content"><span class="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-sm text-[10px] font-black uppercase tracking-widest">FG</span></div>
                        </div>
                    </div>
                </div>
            </td>
            <td class="px-3 py-2.5 align-middle border-r border-slate-100 dark:border-slate-800">
                <div contenteditable="true" class="px-2 py-1.5 text-[11px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-primary rounded-sm transition-colors w-full">NEW ITEM</div>
            </td>
            <td class="col-opening ${this.currentTab === 'opening' ? '' : 'hidden'} px-2 py-3 align-middle border-r border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#05080f]"><input type="number" class="val-op w-full text-center bg-transparent border border-transparent hover:border-slate-300 focus:border-primary rounded-sm font-mono font-bold text-sm text-slate-800 dark:text-white outline-none p-1" value="0"></td>
            <td class="col-inward ${this.currentTab === 'inward' ? '' : 'hidden'} px-2 py-3 align-middle border-r border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#05080f]"><input type="number" class="val-inw w-full text-center bg-transparent border border-transparent hover:border-slate-300 focus:border-primary rounded-sm font-mono font-bold text-sm text-slate-800 dark:text-white outline-none p-1" value="0"></td>
            <td class="col-dispatch ${this.currentTab === 'dispatch' ? '' : 'hidden'} px-2 py-3 align-middle border-r border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#05080f]"><input type="number" class="val-disp w-full text-center bg-transparent border border-transparent hover:border-slate-300 focus:border-primary rounded-sm font-mono font-bold text-sm text-slate-800 dark:text-white outline-none p-1" value="0"></td>
            <td class="col-closing ${this.currentTab === 'closing' ? '' : 'hidden'} px-2 py-3 align-middle border-r border-slate-100 dark:border-slate-800 bg-primary/5 dark:bg-primary/10"><input type="number" class="val-clo w-full text-center bg-transparent border border-transparent hover:border-primary focus:border-primary rounded-sm font-mono font-bold text-sm text-primary outline-none p-1" value="0"></td>
            <td class="px-2 py-3 text-center align-middle">
                <button onclick="this.closest('tr').remove(); window.ReportDetailApp.calculateTotals();" class="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-500 transition-colors p-1.5 rounded-sm hover:bg-red-500/10" tabindex="-1"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        `;
        
        this.updateRowTheme(tr, "Raw Material");
        tbody.prepend(tr);
        document.getElementById('tableScrollContainer').scrollTop = 0;
        
        this.initCustomSelects();

        const nameCell = tr.querySelector('div[contenteditable]');
        setTimeout(() => { nameCell.focus(); document.execCommand('selectAll', false, null); }, 50);
    },

    async navigateTime(action) {
        const targetDate = document.getElementById('navDate').value;
        try {
            const res = await fetch(`/inventory/api/navigate/${this.centerId}/?date=${targetDate}&action=${action}`);
            const data = await res.json();
            
            if (data.status === 'success') {
                const baseUrl = document.getElementById('env-data').getAttribute('data-base-url');
                window.location.href = baseUrl.replace('999999', data.sheet_id);
            } else {
                this.openNoReportModal(targetDate, action);
                document.getElementById('navDate')._flatpickr.setDate(this.currentReportDate, false); 
            }
        } catch(e) {
            this.showToast("Network Error", "Unable to check for reports.", "error");
            document.getElementById('navDate')._flatpickr.setDate(this.currentReportDate, false);
        }
    },

    async saveChanges() {
        const rows = document.querySelectorAll('#editBody tr');
        const items = [];
        
        rows.forEach(row => {
            const hiddenInput = row.querySelector('.custom-select input[type="hidden"]');
            const nameCell = row.querySelector('div[contenteditable]');
            if (hiddenInput && nameCell) {
                items.push({
                    category: hiddenInput.value,
                    material: nameCell.innerText.trim().toUpperCase(),
                    opening_balance: parseFloat(row.querySelector('.val-op').value) || 0,
                    inward: parseFloat(row.querySelector('.val-inw').value) || 0,
                    dispatch: parseFloat(row.querySelector('.val-disp').value) || 0,
                    closing_balance: parseFloat(row.querySelector('.val-clo').value) || 0
                });
            }
        });

        const formData = new FormData();
        formData.append('items', JSON.stringify(items));
        formData.append('date', this.currentReportDate); 
        
        const fileInput = document.getElementById('newImageInput');
        if(fileInput.files[0]) formData.append('stock_image', fileInput.files[0]);

        const btn = document.getElementById('saveBtn');
        const originalHTML = btn.innerHTML;
        
        try {
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...';
            btn.disabled = true; 
            
            const response = await fetch(this.updateUrl, {
                method: 'POST',
                headers: { 'X-CSRFToken': this.csrfToken },
                body: formData
            });
            
            const res = await response.json();
            
            if(res.status === 'success') {
                btn.className = "bg-accent text-brand font-black px-6 py-3 rounded-md shadow-sm flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest transition-all w-full sm:w-auto";
                btn.innerHTML = '<i class="fa-solid fa-check-double"></i> Saved!';
                setTimeout(() => window.location.reload(), 1000);
            } else {
                this.showToast("Save Error", res.message, "error");
                btn.innerHTML = originalHTML;
                btn.disabled = false; 
            }
        } catch(e) {
            this.showToast("Network Error", "Could not reach the server.", "error");
            btn.innerHTML = originalHTML;
            btn.disabled = false; 
        }
    },

    toggleZoom() {
        this.isZoomActive = !this.isZoomActive;
        const btn = document.getElementById('zoomToggleBtn');
        const container = document.getElementById('viewerContainer');
        
        if (this.isZoomActive) {
            btn.innerHTML = `<i class="fa-solid fa-magnifying-glass-plus text-lg"></i>`;
            btn.classList.add('border-primary', 'text-primary', 'bg-primary/10');
            btn.classList.remove('text-slate-400', 'bg-white', 'dark:bg-[#0a0f18]', 'border-slate-200', 'dark:border-slate-800');
            container.style.cursor = 'crosshair';
            container.classList.add('overflow-hidden');
            container.classList.remove('overflow-y-auto');
        } else {
            btn.innerHTML = `<i class="fa-solid fa-magnifying-glass text-lg"></i>`;
            btn.classList.add('text-slate-400', 'bg-white', 'dark:bg-[#0a0f18]', 'border-slate-200', 'dark:border-slate-800');
            btn.classList.remove('border-primary', 'text-primary', 'bg-primary/10');
            container.style.cursor = 'default';
            container.classList.remove('overflow-hidden');
            container.classList.add('overflow-y-auto');
            document.querySelectorAll('#viewerContainer canvas, #viewerContainer img').forEach(el => {
                el.style.transform = 'scale(1)';
            });
        }
    },

    handleZoomMove(e) {
        if (!this.isZoomActive) return;
        const container = document.getElementById('viewerContainer');
        const rect = container.getBoundingClientRect();
        const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
        const yPercent = ((e.clientY - rect.top + container.scrollTop) / container.scrollHeight) * 100;

        document.querySelectorAll('#viewerContainer canvas, #viewerContainer img').forEach(el => {
            el.style.transformOrigin = `${xPercent}% ${yPercent}%`;
            el.style.transform = 'scale(3.5)'; 
        });
    },

    resetZoom() {
        if (!this.isZoomActive) return;
        document.querySelectorAll('#viewerContainer canvas, #viewerContainer img').forEach(el => el.style.transform = 'scale(1)');
    },

    async renderDocument(urlOrBlob) {
        const container = document.getElementById('viewerContainer');
        container.innerHTML = '<div class="text-primary mt-20 flex justify-center"><i class="fa-solid fa-circle-notch fa-spin text-3xl"></i></div>'; 

        let isPdf = false;
        if (typeof urlOrBlob === 'string') isPdf = urlOrBlob.toLowerCase().endsWith('.pdf');
        else if (urlOrBlob.type) isPdf = urlOrBlob.type === 'application/pdf';

        if (isPdf) {
            try {
                let data;
                if (typeof urlOrBlob !== 'string') data = await urlOrBlob.arrayBuffer();
                else data = urlOrBlob;

                const pdf = await pdfjsLib.getDocument(data).promise;
                container.innerHTML = ''; 
                
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 2.0 }); 
                    const canvas = document.createElement('canvas');
                    
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    
                    canvas.className = 'w-full h-auto mb-6 rounded-md shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0f18] transition-transform duration-100 ease-out block';
                    container.appendChild(canvas);
                    
                    await page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;
                }
            } catch (e) {
                container.innerHTML = '<div class="text-red-500 mt-20 font-black uppercase tracking-widest text-[11px] text-center"><i class="fa-solid fa-circle-exclamation text-lg block mb-2"></i> Error loading PDF</div>';
            }
        } else {
            const src = typeof urlOrBlob === 'string' ? urlOrBlob : URL.createObjectURL(urlOrBlob);
            container.innerHTML = `<img src="${src}" class="w-full h-auto rounded-md shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0f18] transition-transform duration-100 ease-out block">`;
        }
    },
    
    previewNewFile(input) { 
        if (input.files && input.files[0]) this.renderDocument(input.files[0]); 
    }
};

window.openChangeDateModal = () => window.ReportDetailApp.openChangeDateModal();
window.closeChangeDateModal = () => window.ReportDetailApp.closeChangeDateModal();
window.confirmChangeDate = () => window.ReportDetailApp.confirmChangeDate();
window.closeNoReportModal = () => window.ReportDetailApp.closeNoReportModal();
window.switchTab = (tab) => window.ReportDetailApp.switchTab(tab);
window.navigateTime = (dir) => window.ReportDetailApp.navigateTime(dir);
window.addRow = () => window.ReportDetailApp.addRow();
window.saveChanges = () => window.ReportDetailApp.saveChanges();
window.toggleZoom = () => window.ReportDetailApp.toggleZoom();
window.previewNewFile = (el) => window.ReportDetailApp.previewNewFile(el);

document.addEventListener("DOMContentLoaded", () => window.ReportDetailApp.init());