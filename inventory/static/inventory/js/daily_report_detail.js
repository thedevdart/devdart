window.DailyReportApp = {
    date: null,
    totalColumns: 0,
    csrfToken: null,
    urlTemplate: null,
    currentViewMode: 'closing',

    init() {
        const envEl = document.getElementById('env-data');
        if (envEl) {
            this.date = envEl.getAttribute('data-date');
            this.totalColumns = parseInt(envEl.getAttribute('data-total-columns')) || 0;
            this.csrfToken = envEl.getAttribute('data-csrf');
            this.urlTemplate = envEl.getAttribute('data-url-template');
        }

        this.initFlatpickr();
        this.initTableClasses();
        this.switchReportType('closing');
    },

    initFlatpickr() {
        const customYearDropdownPlugin = {
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

        const dateInput = document.getElementById("searchDateInput");
        if (dateInput) {
            flatpickr(dateInput, {
                dateFormat: "Y-m-d",
                altInput: true,
                altFormat: "d M Y",
                defaultDate: this.date,
                onReady: customYearDropdownPlugin.onReady,
                onYearChange: customYearDropdownPlugin.onYearChange,
                onChange: (selectedDates, dateStr) => {
                    if (dateStr && dateStr !== this.date) {
                        const targetUrl = this.urlTemplate.replace('9999-99-99', dateStr);
                        if (typeof navigateTo === 'function') navigateTo(targetUrl);
                        else window.location.href = targetUrl;
                    }
                }
            });
        }
    },

    initTableClasses() {
        const catDataEl = document.getElementById('center-cats-data');
        if (!catDataEl) return;
        
        const centerCats = JSON.parse(catDataEl.textContent);
        
        document.querySelectorAll('.summary-row').forEach(row => {
            row.querySelectorAll('.summary-cell').forEach((cell, i) => {
                if (centerCats[i]) cell.classList.add('col-cat-' + centerCats[i]);
            });
        });

        document.querySelectorAll('.data-row').forEach(row => {
            row.querySelectorAll('.data-cell').forEach((cell, i) => {
                if (centerCats[i]) {
                    cell.classList.add('col-cat-' + centerCats[i]);
                    cell.dataset.cat = centerCats[i];
                }
            });
        });
    },

    switchReportType(mode) {
        // 1. Turn ON the loading modal
        const alpineContainer = document.getElementById('main-alpine-wrapper');
        if (alpineContainer && typeof Alpine !== 'undefined') {
            Alpine.$data(alpineContainer).isProcessing = true;
        }

        // 2. PAUSE briefly so the browser can paint the loading modal, THEN do the heavy math
        setTimeout(() => {
            this.currentViewMode = mode;
            
            // Reset Tabs
            document.querySelectorAll('.report-tab').forEach(btn => {
                btn.className = "report-tab px-4 py-2 text-[11px] font-bold rounded-sm text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all flex-none md:flex-1 whitespace-nowrap uppercase tracking-wider border-b-2 border-transparent";
            });
            
            // Activate Tab
            const activeBtn = document.getElementById(`btn-${mode}`);
            if(activeBtn) activeBtn.className = "report-tab px-4 py-2 text-[11px] font-black rounded-sm bg-white dark:bg-[#0a0f18] text-primary border-b-2 border-primary shadow-sm flex-none md:flex-1 whitespace-nowrap transition-all uppercase tracking-wider";

            // Update Labels
            const typeInput = document.getElementById('exportTypeInput');
            if (typeInput) typeInput.value = mode;
            
            const typeLabel = document.getElementById('exportTypeLabel');
            if (typeLabel) typeLabel.innerText = mode;
            
            const headerType = document.getElementById('col-header-type');
            if (headerType) headerType.innerText = `(${mode.toUpperCase()})`;

            // Toggle Rows (RM vs FG)
            const rmHeader = document.getElementById('rm-group-header');
            const fgHeader = document.getElementById('fg-group-header');
            const rmRows = document.querySelectorAll('.rm-row');
            const fgRows = document.querySelectorAll('.fg-row');
            const rmSummary = document.getElementById('summary-rm-row');
            const fgSummary = document.getElementById('summary-fg-row');

            if (mode === 'inward') {
                if(rmHeader) rmHeader.style.display = ''; if(fgHeader) fgHeader.style.display = 'none';
                rmRows.forEach(r => r.style.display = ''); fgRows.forEach(r => r.style.display = 'none');
                if(rmSummary) rmSummary.style.display = ''; if(fgSummary) fgSummary.style.display = 'none';
            } else if (mode === 'production') {
                if(rmHeader) rmHeader.style.display = 'none'; if(fgHeader) fgHeader.style.display = '';
                rmRows.forEach(r => r.style.display = 'none'); fgRows.forEach(r => r.style.display = '');
                if(rmSummary) rmSummary.style.display = 'none'; if(fgSummary) fgSummary.style.display = '';
            } else {
                if(rmHeader) rmHeader.style.display = ''; if(fgHeader) fgHeader.style.display = '';
                rmRows.forEach(r => r.style.display = ''); fgRows.forEach(r => r.style.display = '');
                if(rmSummary) rmSummary.style.display = ''; if(fgSummary) fgSummary.style.display = '';
            }

            // Extract correct dataset attribute
            let attrKey = 'data-clo';
            if(mode === 'opening') attrKey = 'data-op';
            if(mode === 'inward' || mode === 'production') attrKey = 'data-inw';
            if(mode === 'dispatch') attrKey = 'data-disp';

            document.querySelectorAll('.data-row').forEach(row => {
                row.querySelectorAll('.data-cell').forEach(cell => {
                    const val = parseFloat(cell.getAttribute(attrKey)) || 0;
                    cell.dataset.val = val;
                    cell.innerHTML = val > 0 ? val.toLocaleString() : '<span class="text-slate-200 dark:text-slate-700">-</span>';
                });
            });

            // Update Totals based on current filter
            let currentFilter = 'ALL';
            const filterSelect = document.querySelector('select[x-model="catFilter"]');
            if (filterSelect) currentFilter = filterSelect.value;
            
            this.updateTotals(currentFilter);
            
            // 3. Turn OFF the loading modal now that math is done
            if (alpineContainer && typeof Alpine !== 'undefined') {
                Alpine.$data(alpineContainer).isProcessing = false;
            }
        }, 50); // 50 milliseconds gives the browser enough time to paint the modal overlay
    },

    updateTotals(filter = 'ALL') {
        let grandRM = 0; let grandFG = 0;
        const colSumsRM = new Array(this.totalColumns).fill(0);
        const colSumsFG = new Array(this.totalColumns).fill(0);
        
        document.querySelectorAll('.data-row').forEach(row => {
            if (row.style.display === 'none') return;

            let rowSum = 0;
            const isFG = row.classList.contains('fg-row');
            
            row.querySelectorAll('.data-cell').forEach((cell, i) => {
                if (filter === 'ALL' || cell.dataset.cat === filter) {
                    const val = parseFloat(cell.dataset.val) || 0;
                    rowSum += val;
                    if (isFG) colSumsFG[i] += val; else colSumsRM[i] += val;
                }
            });
            
            const totalEl = row.querySelector('.row-total');
            if(totalEl) totalEl.innerHTML = rowSum > 0 ? rowSum.toLocaleString() : `<span class="opacity-30">-</span>`;
            
            if (isFG) grandFG += rowSum;
            else grandRM += rowSum;
        });
        
        const gRmEl = document.getElementById('grand-rm-total');
        if(gRmEl) gRmEl.innerText = grandRM.toLocaleString();
        
        const gFgEl = document.getElementById('grand-fg-total');
        if(gFgEl) gFgEl.innerText = grandFG.toLocaleString();
        
        const gTotEl = document.getElementById('grand-total-total');
        if(gTotEl) gTotEl.innerText = (grandRM + grandFG).toLocaleString();

        const rmSummaryCells = document.querySelectorAll('.rm-summary-col');
        const fgSummaryCells = document.querySelectorAll('.fg-summary-col');
        const grandSummaryCells = document.querySelectorAll('.grand-summary-col');

        for (let i = 0; i < this.totalColumns; i++) {
            if (rmSummaryCells[i]) rmSummaryCells[i].innerHTML = colSumsRM[i] > 0 ? colSumsRM[i].toLocaleString() : '<span class="opacity-30">-</span>';
            if (fgSummaryCells[i]) fgSummaryCells[i].innerHTML = colSumsFG[i] > 0 ? colSumsFG[i].toLocaleString() : '<span class="opacity-30">-</span>';
            
            const colGrand = colSumsRM[i] + colSumsFG[i];
            if (grandSummaryCells[i]) grandSummaryCells[i].innerHTML = colGrand > 0 ? colGrand.toLocaleString() : '<span class="opacity-30">-</span>';
        }
    },

    async pushToNexus() {
        if (!this.date || !this.csrfToken) return;

        const btn = document.getElementById('nexusBtn');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Pushing...';
        btn.disabled = true; 
        btn.classList.add('opacity-80');

        const toast = document.getElementById('nexus-toast');
        const toastIcon = document.getElementById('nexus-toast-icon');
        const toastMsg = document.getElementById('nexus-toast-msg');
        
        toastIcon.className = "fa-solid fa-circle-notch fa-spin text-lg text-primary mt-0.5";
        toastMsg.innerText = "Building snapshot and connecting to Vercel/GitHub...";
        toast.classList.remove('hidden');
        
        setTimeout(() => toast.classList.remove('translate-y-full', 'opacity-0'), 10);
        
        try {
            const response = await fetch(`/inventory/api/nexus-push/${this.date}/`, {
                method: 'POST', 
                headers: { 'X-CSRFToken': this.csrfToken, 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            
            if (data.status === 'success') {
                toastIcon.className = "fa-solid fa-check text-accent text-lg mt-0.5";
                toast.firstElementChild.classList.remove('border-primary', 'border-red-500');
                toast.firstElementChild.classList.add('border-accent');
                toastMsg.innerText = "Successfully pushed! Vercel is deploying it now.";
            } else throw new Error(data.message);
        } catch (error) {
            toastIcon.className = "fa-solid fa-xmark text-red-500 text-lg mt-0.5";
            toast.firstElementChild.classList.remove('border-primary', 'border-accent');
            toast.firstElementChild.classList.add('border-red-500');
            toastMsg.innerText = "Error: " + error.message;
        } finally {
            btn.innerHTML = originalHTML; 
            btn.disabled = false; 
            btn.classList.remove('opacity-80');
            
            setTimeout(() => { 
                toast.classList.add('translate-y-full', 'opacity-0');
                setTimeout(() => {
                    toast.classList.add('hidden');
                    toast.firstElementChild.classList.remove('border-accent', 'border-red-500');
                    toast.firstElementChild.classList.add('border-primary');
                }, 300);
            }, 5000);
        }
    }
};

window.switchReportType = (mode) => window.DailyReportApp.switchReportType(mode);
window.updateTotals = (filter) => window.DailyReportApp.updateTotals(filter);
window.pushToNexus = () => window.DailyReportApp.pushToNexus();

document.addEventListener("DOMContentLoaded", () => window.DailyReportApp.init());