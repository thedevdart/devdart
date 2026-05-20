window.SortingReportApp = {
    engineMode: 'individual',
    reportType: 'production',
    summaryGroup: 'ALL',
    dateRange: '',
    searchCenter: '',
    searchItem: '',
    searchDate: '',
    results: [],
    hasSearched: false,
    isZoomed: false,

    init() {
        this.initCustomSelects();
        this.initCalendars();
        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('searchCenterInput').addEventListener('input', (e) => {
            this.searchCenter = e.target.value;
            this.renderTable();
        });
        document.getElementById('searchItemInput').addEventListener('input', (e) => {
            this.searchItem = e.target.value;
            this.renderTable();
        });
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

    setEngineMode(mode) {
        this.engineMode = mode;
        const indBtn = document.getElementById('mode-individual');
        const sumBtn = document.getElementById('mode-summary');
        const indSelect = document.getElementById('wrapper-individual-select');
        const sumSelect = document.getElementById('wrapper-summary-select');
        const clearDateBtn = document.getElementById('btn-clear-date');

        if (mode === 'individual') {
            indBtn.className = "flex-1 md:flex-none py-2 px-4 text-[10px] font-black rounded transition-all uppercase tracking-widest bg-white dark:bg-slate-700 text-primary shadow";
            sumBtn.className = "flex-1 md:flex-none py-2 px-4 text-[10px] font-black rounded transition-all uppercase tracking-widest text-slate-500 hover:text-slate-800 dark:hover:text-white";
            indSelect.style.display = 'block';
            sumSelect.style.display = 'none';
            if(this.searchDate) clearDateBtn.style.display = 'block';
        } else {
            sumBtn.className = "flex-1 md:flex-none py-2 px-4 text-[10px] font-black rounded transition-all uppercase tracking-widest bg-white dark:bg-slate-700 text-primary shadow";
            indBtn.className = "flex-1 md:flex-none py-2 px-4 text-[10px] font-black rounded transition-all uppercase tracking-widest text-slate-500 hover:text-slate-800 dark:hover:text-white";
            indSelect.style.display = 'none';
            sumSelect.style.display = 'block';
            clearDateBtn.style.display = 'none';
        }
        this.results = [];
        this.hasSearched = false;
        this.renderTable();
    },

    initCustomSelects() {
        const wrappers = document.querySelectorAll('.custom-select');
        wrappers.forEach(wrapper => {
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
                this.reportType = val; // Update JS state
                
                // Update Table Header
                const qtyHeader = document.getElementById('qty-header-text');
                if (val === 'outward') qtyHeader.innerText = 'Dispatch Qty';
                else if (val === 'production') qtyHeader.innerText = 'Prod. Qty';
                else qtyHeader.innerText = 'Inward Qty';

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
        flatpickr("#dateRangePicker", {
            mode: "range",
            dateFormat: "Y-m-d",
            altInput: true,
            altFormat: "d M Y",
            onChange: (selectedDates, dateStr) => {
                this.dateRange = dateStr;
                document.getElementById('btn-run').disabled = !dateStr;
            }
        });

        flatpickr("#searchDateInput", {
            dateFormat: "Y-m-d",
            altInput: true,
            altFormat: "d M Y",
            onChange: (selectedDates, dateStr) => {
                this.searchDate = dateStr;
                document.getElementById('btn-clear-date').style.display = dateStr ? 'block' : 'none';
                this.renderTable();
            }
        });
    },

    clearSearchDate() {
        this.searchDate = '';
        document.getElementById('searchDateInput')._flatpickr.clear();
        document.getElementById('btn-clear-date').style.display = 'none';
        this.renderTable();
    },

    async fetchData() {
        if(!this.dateRange) return;
        const dates = this.dateRange.split(' to ');
        if (dates.length !== 2) {
            this.showToast("Validation Error", "Please select both a start and end date.", "error");
            return;
        }

        const btn = document.getElementById('btn-run');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Fetching...`;
        btn.disabled = true;

        this.hasSearched = true;
        
        try {
            const res = await fetch(`/inventory/api/sorting-data/?start_date=${dates[0]}&end_date=${dates[1]}&type=${this.reportType}&mode=${this.engineMode}&group=${document.getElementById('summaryHiddenInput')?.value || this.summaryGroup}`);
            const data = await res.json();
            
            if(data.status === 'success') {
                this.results = data.data;
                if (this.engineMode === 'summary') {
                    this.renderSummary();
                } else {
                    this.renderTable();
                }
            } else {
                this.showToast("Error", data.message, "error");
            }
        } catch (error) {
            this.showToast("Network Error", "Failed to connect to the server.", "error");
        } finally {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        }
    },

    renderSummary() {
        const emptyState = document.getElementById('empty-state');
        const summaryContainer = document.getElementById('summary-container');
        const tableContainer = document.getElementById('table-container');

        if (Object.keys(this.results).length === 0 && this.hasSearched) {
            emptyState.style.display = 'flex';
            summaryContainer.style.display = 'none';
            tableContainer.style.display = 'none';
            document.getElementById('btn-export').style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        tableContainer.style.display = 'none';
        summaryContainer.style.display = 'flex';
        document.getElementById('btn-export').style.display = 'flex';

        const centerList = document.getElementById('summary-center-list');
        let listHtml = '';
        
        const centers = Object.keys(this.results).sort();
        centers.forEach((cName, idx) => {
            listHtml += `<button onclick="window.SortingReportApp.selectSummaryCenter('${cName}')" id="btn-center-${idx}" class="summary-center-btn w-full text-left px-4 py-3 rounded-md text-[10px] font-black uppercase tracking-widest transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-transparent focus:outline-none">${cName}</button>`;
        });
        
        centerList.innerHTML = listHtml;

        if (centers.length > 0) {
            this.selectSummaryCenter(centers[0]);
        }
    },

    selectSummaryCenter(cName) {
        document.querySelectorAll('.summary-center-btn').forEach(btn => {
            if (btn.innerText === cName) {
                btn.classList.add('bg-primary/10', 'text-primary', 'border-primary/20');
                btn.classList.remove('text-slate-600', 'dark:text-slate-300', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
            } else {
                btn.classList.remove('bg-primary/10', 'text-primary', 'border-primary/20');
                btn.classList.add('text-slate-600', 'dark:text-slate-300', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
            }
        });

        document.getElementById('summary-report-title').innerText = `${cName} - SUMMARY REPORT`;
        
        const content = document.getElementById('summary-report-content');
        const data = this.results[cName];
        
        const dates = this.dateRange.split(' to ');
        const startStr = this.formatDateStr(dates[0]);
        const endStr = this.formatDateStr(dates[1]);

        let html = '';
        
        if (data.raw && data.raw.length > 0) {
            html += `
            <div class="mb-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm overflow-hidden">
                <h4 class="bg-slate-100 dark:bg-slate-800 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800">Raw Materials</h4>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-slate-50 dark:bg-slate-900/50 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th class="px-4 py-3 border-r border-slate-200 dark:border-slate-800">Item Name</th>
                                <th class="px-4 py-3 border-r border-slate-200 dark:border-slate-800 text-right w-24">Opening on<br/><span class="text-[9px]">${startStr}</span></th>
                                <th class="px-4 py-3 border-r border-slate-200 dark:border-slate-800 text-right w-24">Total<br/>Inward</th>
                                <th class="px-4 py-3 border-r border-slate-200 dark:border-slate-800 text-right w-36">Total dispatch/used for production</th>
                                <th class="px-4 py-3 text-right text-primary w-24">Closing on<br/><span class="text-[9px]">${endStr}</span></th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 dark:divide-slate-800/50 text-[11px] font-bold text-slate-700 dark:text-slate-300">
            `;
            data.raw.forEach(item => {
                html += `
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td class="px-4 py-2 border-r border-slate-100 dark:border-slate-800 uppercase">${item.item}</td>
                        <td class="px-4 py-2 border-r border-slate-100 dark:border-slate-800 text-right">${item.op}</td>
                        <td class="px-4 py-2 border-r border-slate-100 dark:border-slate-800 text-right">${item.inw}</td>
                        <td class="px-4 py-2 border-r border-slate-100 dark:border-slate-800 text-right">${item.disp}</td>
                        <td class="px-4 py-2 text-right text-primary font-black">${item.clo}</td>
                    </tr>
                `;
            });
            html += `</tbody></table></div></div>`;
        }

        if (data.fin && data.fin.length > 0) {
            html += `
            <div class="mb-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm overflow-hidden">
                <h4 class="bg-slate-100 dark:bg-slate-800 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800">Finished Goods</h4>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-slate-50 dark:bg-slate-900/50 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th class="px-4 py-3 border-r border-slate-200 dark:border-slate-800">Item Name</th>
                                <th class="px-4 py-3 border-r border-slate-200 dark:border-slate-800 text-right w-24">Opening on<br/><span class="text-[9px]">${startStr}</span></th>
                                <th class="px-4 py-3 border-r border-slate-200 dark:border-slate-800 text-right w-36">Total Inward/Production</th>
                                <th class="px-4 py-3 border-r border-slate-200 dark:border-slate-800 text-right w-24">Total<br/>Dispatch</th>
                                <th class="px-4 py-3 text-right text-primary w-24">Closing on<br/><span class="text-[9px]">${endStr}</span></th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 dark:divide-slate-800/50 text-[11px] font-bold text-slate-700 dark:text-slate-300">
            `;
            data.fin.forEach(item => {
                html += `
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td class="px-4 py-2 border-r border-slate-100 dark:border-slate-800 uppercase">${item.item}</td>
                        <td class="px-4 py-2 border-r border-slate-100 dark:border-slate-800 text-right">${item.op}</td>
                        <td class="px-4 py-2 border-r border-slate-100 dark:border-slate-800 text-right">${item.prod}</td>
                        <td class="px-4 py-2 border-r border-slate-100 dark:border-slate-800 text-right">${item.disp}</td>
                        <td class="px-4 py-2 text-right text-primary font-black">${item.clo}</td>
                    </tr>
                `;
            });
            html += `</tbody></table></div></div>`;
        }
        
        if (!html) {
            html = '<div class="text-center text-slate-400 mt-20 font-bold uppercase tracking-widest text-xs">No data for this center in the selected range</div>';
        }

        content.innerHTML = html;
    },

    formatDateStr(dateString) {
        const d = new Date(dateString);
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
    },

    renderTable() {
        const tbody = document.getElementById('results-tbody');
        const emptyState = document.getElementById('empty-state');
        const tableContainer = document.getElementById('table-container');
        const summaryContainer = document.getElementById('summary-container');
        const tableHeaders = document.getElementById('table-headers');

        const qtyText = this.reportType === 'outward' ? 'Dispatch Qty' : (this.reportType === 'production' ? 'Prod. Qty' : 'Inward Qty');
        tableHeaders.innerHTML = `
            <tr>
                <th class="px-6 py-4 w-2/12">Center Name</th>
                <th class="px-6 py-4 w-2/12">Date</th>
                <th class="px-6 py-4 w-3/12">Item Name</th>
                <th class="px-6 py-4 w-1/12 text-center">Category</th>
                <th class="px-6 py-4 w-2/12 text-right" id="qty-header-text">${qtyText}</th>
                <th class="px-6 py-4 w-2/12 text-center">Verification</th>
            </tr>`;

        if (this.results.length === 0 && this.hasSearched) {
            emptyState.style.display = 'flex';
            tableContainer.style.display = 'none';
            summaryContainer.style.display = 'none';
            document.getElementById('btn-export').style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        summaryContainer.style.display = 'none';
        tableContainer.style.display = 'flex';
        document.getElementById('btn-export').style.display = 'flex';

        const filtered = this.results.filter(row => {
            const matchCenter = row.center.toLowerCase().includes(this.searchCenter.toLowerCase());
            const matchItem = row.item.toLowerCase().includes(this.searchItem.toLowerCase());
            const matchDate = this.searchDate === '' || row.raw_date === this.searchDate;
            return matchCenter && matchItem && matchDate;
        });

        document.getElementById('filtered-count').innerText = filtered.length;
        document.getElementById('total-count').innerText = this.results.length;

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-12 text-center text-slate-400 dark:text-slate-600 font-black uppercase tracking-widest text-[10px]">No entries match your filters.</td></tr>`;
            return;
        }

        let html = '';
        filtered.forEach(row => {
            const isRM = row.category.includes('Raw');
            const pillClass = isRM ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30';
            const catText = isRM ? 'RM' : 'FG';

            const actionHtml = row.image_url
                ? `<button onclick="window.SortingReportApp.openPreviewModal('${row.image_url}', '${row.date}', '${row.center}')" class="text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-sm font-black uppercase tracking-widest transition-colors shadow-sm active:scale-95"><i class="fa-solid fa-image text-slate-400 mr-1.5"></i> Preview</button>`
                : `<span class="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest italic">No Image</span>`;

            html += `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800">
                <td class="px-5 py-3 font-black text-slate-800 dark:text-slate-200 text-[11px] uppercase tracking-wider">${row.center}</td>
                <td class="px-5 py-3 font-bold text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-widest">${row.date}</td>
                <td class="px-5 py-3 font-black text-brand dark:text-white uppercase tracking-wider text-[11px]">${row.item}</td>
                <td class="px-5 py-3 text-center">
                    <span class="text-[9px] px-2 py-1 rounded-sm font-black uppercase tracking-widest ${pillClass}">${catText}</span>
                </td>
                <td class="px-5 py-3 text-right font-black text-primary text-sm">${row.qty}</td>
                <td class="px-5 py-3 text-center">${actionHtml}</td>
            </tr>`;
        });
        tbody.innerHTML = html;
    },

    downloadExcel() {
        if(!this.dateRange) return;
        const dates = this.dateRange.split(' to ');
        if (dates.length !== 2) return;
        window.location.href = `/inventory/api/sorting-excel/?start_date=${dates[0]}&end_date=${dates[1]}&type=${this.reportType}&mode=${this.engineMode}&group=${document.getElementById('summaryHiddenInput')?.value || this.summaryGroup}`;
    },

    openPreviewModal(url, date, center) {
        document.getElementById('modalImage').src = url;
        document.getElementById('modalCenter').innerText = center;
        document.getElementById('modalDate').innerText = date;
        this.isZoomed = false;
        this.resetZoom();

        const m = document.getElementById('previewModal');
        m.classList.remove('hidden');
        setTimeout(() => {
            m.firstElementChild.classList.remove('opacity-0', 'scale-95');
            m.firstElementChild.classList.add('opacity-100', 'scale-100');
        }, 10);
    },

    closePreviewModal() {
        const m = document.getElementById('previewModal');
        m.firstElementChild.classList.remove('opacity-100', 'scale-100');
        m.firstElementChild.classList.add('opacity-0', 'scale-95');
        setTimeout(() => m.classList.add('hidden'), 300);
    },

    toggleZoom() {
        this.isZoomed = !this.isZoomed;
        const btn = document.getElementById('zoomBtn');
        const img = document.getElementById('modalImage');
        const container = img.parentElement;

        if (this.isZoomed) {
            btn.innerHTML = `<i class="fa-solid fa-magnifying-glass-plus text-lg"></i>`;
            btn.classList.add('border-primary', 'text-primary', 'bg-primary/10');
            btn.classList.remove('text-slate-400', 'bg-white', 'dark:bg-[#0a0f18]', 'border-slate-200', 'dark:border-slate-800');
            img.classList.add('scale-[3.5]', 'cursor-crosshair');
            img.classList.remove('scale-100');
            container.classList.add('overflow-hidden');
            container.classList.remove('overflow-y-auto');
        } else {
            btn.innerHTML = `<i class="fa-solid fa-magnifying-glass text-lg"></i>`;
            btn.classList.add('text-slate-400', 'bg-white', 'dark:bg-[#0a0f18]', 'border-slate-200', 'dark:border-slate-800');
            btn.classList.remove('border-primary', 'text-primary', 'bg-primary/10');
            img.classList.remove('scale-[3.5]', 'cursor-crosshair');
            img.classList.add('scale-100');
            container.classList.remove('overflow-hidden');
            container.classList.add('overflow-y-auto');
            this.resetZoom();
        }
    },

    handleZoom(e) {
        if (!this.isZoomed) return;
        const img = document.getElementById('modalImage');
        const rect = img.parentElement.getBoundingClientRect();
        const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
        const yPercent = ((e.clientY - rect.top + img.parentElement.scrollTop) / img.parentElement.scrollHeight) * 100;
        img.style.transformOrigin = `${xPercent}% ${yPercent}%`;
    },

    resetZoom() {
        const img = document.getElementById('modalImage');
        if (img) img.style.transformOrigin = 'center center';
    }
};

window.clearSearchDate = () => window.SortingReportApp.clearSearchDate();
window.fetchData = () => window.SortingReportApp.fetchData();
window.downloadExcel = () => window.SortingReportApp.downloadExcel();
window.closePreviewModal = () => window.SortingReportApp.closePreviewModal();
window.togglePreviewZoom = () => window.SortingReportApp.toggleZoom();
window.handlePreviewZoom = (e) => window.SortingReportApp.handleZoom(e);
window.resetPreviewZoom = () => window.SortingReportApp.resetZoom();

if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", () => window.SortingReportApp.init());
} else {
    window.SortingReportApp.init();
}
