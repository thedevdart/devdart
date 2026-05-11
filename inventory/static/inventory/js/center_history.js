// PDF.js Worker Init
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

window.HistoryApp = {
    centerId: null,
    reportBaseUrl: null,
    isModalZoomActive: false,

    init() {
        const envEl = document.getElementById('env-data');
        if (envEl) {
            this.centerId = envEl.getAttribute('data-center-id');
            this.reportBaseUrl = envEl.getAttribute('data-report-base-url');
        }

        this.initFlatpickr();
        this.bindEvents();
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

        const dateInput = document.getElementById("searchDate");
        if (dateInput) {
            flatpickr(dateInput, {
                dateFormat: "Y-m-d",
                altInput: true,
                altFormat: "d M Y",
                onReady: customYearDropdownPlugin.onReady,
                onYearChange: customYearDropdownPlugin.onYearChange,
                onChange: (selectedDates, dateStr) => {
                    if (dateStr) this.jumpToDate(dateStr);
                }
            });
        }
    },

    async jumpToDate(targetDate) {
        if (!this.centerId) return;
        
        try {
            const res = await fetch(`/inventory/api/navigate/${this.centerId}/?date=${targetDate}&action=exact`);
            const data = await res.json();
            
            if (data.status === 'success') {
                window.location.href = this.reportBaseUrl.replace('999999', data.sheet_id);
            } else {
                this.openNoReportModal(targetDate);
                document.getElementById('searchDate')._flatpickr.clear();
            }
        } catch(e) {
            window.AppModal.show({ title: "Network Error", message: "Unable to check for reports", confirmText: "Close" });
        }
    },

    openNoReportModal(dateStr) {
        const m = document.getElementById('noReportModal');
        const formattedDate = new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        document.getElementById('noReportMessage').innerHTML = `No physical scan or data entry exists for <b class="text-slate-800 dark:text-slate-200">${formattedDate}</b>`;
        
        m.classList.remove('hidden');
        setTimeout(() => {
            m.classList.remove('opacity-0');
            m.firstElementChild.classList.remove('scale-95', 'opacity-0');
            m.firstElementChild.classList.add('scale-100', 'opacity-100');
        }, 10);
    },

    closeNoReportModal() {
        const m = document.getElementById('noReportModal');
        m.firstElementChild.classList.remove('scale-100', 'opacity-100');
        m.firstElementChild.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            m.classList.add('opacity-0');
            setTimeout(() => m.classList.add('hidden'), 200);
        }, 100);
    },

    // --- MODAL VIEWER ENGINE WITH ZOOM ---
    async openDocModal(url) {
        const modalOverlay = document.getElementById('docModal');
        const modalWindow = document.getElementById('modalWindow');
        const container = document.getElementById('modalContent');
        
        // Reset Zoom State
        this.isModalZoomActive = false;
        const btn = document.getElementById('modalZoomBtn');
        btn.innerHTML = `<i class="fa-solid fa-magnifying-glass text-lg"></i>`;
        btn.className = "absolute top-20 right-6 z-30 bg-white dark:bg-slate-800 text-slate-500 px-3 py-3 rounded-md shadow-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all hover:border-accent hover:text-accent cursor-pointer active:scale-95";
        container.style.cursor = 'default';
        container.classList.remove('overflow-hidden');
        container.classList.add('overflow-y-auto');
        
        // Show Modal
        modalOverlay.classList.remove('hidden');
        setTimeout(() => {
            modalOverlay.classList.remove('opacity-0');
            modalWindow.classList.remove('scale-95');
            modalWindow.classList.add('scale-100');
        }, 10);

        container.innerHTML = '<div class="text-primary mt-20 flex flex-col items-center gap-3"><i class="fa-solid fa-circle-notch fa-spin text-3xl"></i><span class="font-black text-[10px] tracking-widest uppercase">Loading Document...</span></div>';

        const isPdf = url.toLowerCase().endsWith('.pdf');

        if (isPdf) {
            try {
                const pdf = await pdfjsLib.getDocument(url).promise;
                container.innerHTML = ''; 
                
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 2.0 }); 
                    
                    const canvas = document.createElement('canvas');
                    canvas.className = 'w-full h-auto mb-6 shadow-md border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 transition-transform duration-100 ease-out block';
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    container.appendChild(canvas);

                    await page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;
                }
            } catch(e) {
                container.innerHTML = '<div class="text-red-500 mt-20 flex flex-col items-center gap-2"><i class="fa-solid fa-triangle-exclamation text-3xl"></i><span class="font-black text-[10px] uppercase tracking-widest">Error loading PDF</span></div>';
            }
        } else {
            container.innerHTML = `<img src="${url}" class="w-full h-auto shadow-md rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-transform duration-100 ease-out block">`;
        }
    },

    hideModal() {
        const modalOverlay = document.getElementById('docModal');
        const modalWindow = document.getElementById('modalWindow');
        
        modalOverlay.classList.add('opacity-0');
        modalWindow.classList.remove('scale-100');
        modalWindow.classList.add('scale-95');
        
        setTimeout(() => {
            modalOverlay.classList.add('hidden');
            document.getElementById('modalContent').innerHTML = ''; // Clear memory
        }, 200);
    },

    toggleModalZoom() {
        this.isModalZoomActive = !this.isModalZoomActive;
        const btn = document.getElementById('modalZoomBtn');
        const container = document.getElementById('modalContent');
        
        if (this.isModalZoomActive) {
            btn.innerHTML = `<i class="fa-solid fa-magnifying-glass-plus text-lg"></i>`;
            btn.className = "absolute top-20 right-6 z-30 bg-accent/10 text-accent px-3 py-3 rounded-md shadow-xl border border-accent/50 flex items-center justify-center transition-all cursor-pointer active:scale-95";
            container.style.cursor = 'crosshair';
            container.classList.add('overflow-hidden');
            container.classList.remove('overflow-y-auto');
        } else {
            btn.innerHTML = `<i class="fa-solid fa-magnifying-glass text-lg"></i>`;
            btn.className = "absolute top-20 right-6 z-30 bg-white dark:bg-slate-800 text-slate-500 px-3 py-3 rounded-md shadow-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all hover:border-accent hover:text-accent cursor-pointer active:scale-95";
            container.style.cursor = 'default';
            container.classList.remove('overflow-hidden');
            container.classList.add('overflow-y-auto');
            document.querySelectorAll('#modalContent canvas, #modalContent img').forEach(el => el.style.transform = 'scale(1)');
        }
    },

    bindEvents() {
        const container = document.getElementById('modalContent');
        if(container) {
            container.addEventListener('mousemove', (e) => {
                if (!this.isModalZoomActive) return;
                const rect = container.getBoundingClientRect();
                const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
                const yPercent = ((e.clientY - rect.top + container.scrollTop) / container.scrollHeight) * 100;

                document.querySelectorAll('#modalContent canvas, #modalContent img').forEach(el => {
                    el.style.transformOrigin = `${xPercent}% ${yPercent}%`;
                    el.style.transform = 'scale(3.5)'; 
                });
            });

            container.addEventListener('mouseleave', () => {
                if (!this.isModalZoomActive) return;
                document.querySelectorAll('#modalContent canvas, #modalContent img').forEach(el => el.style.transform = 'scale(1)');
            });
        }

        const modalOverlay = document.getElementById('docModal');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target.id === 'docModal') this.hideModal();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modalOverlay && !modalOverlay.classList.contains('hidden')) {
                this.hideModal();
            }
        });
    }
};

document.addEventListener("DOMContentLoaded", () => window.HistoryApp.init());