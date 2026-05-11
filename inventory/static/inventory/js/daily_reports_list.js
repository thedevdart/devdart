window.DailyReportsListApp = {
    urlTemplate: null,

    init() {
        const envEl = document.getElementById('env-data');
        if (envEl) {
            this.urlTemplate = envEl.getAttribute('data-url-template');
        }
        this.initFlatpickr();
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
                allowInput: true,
                clickOpens: false,
                onReady: customYearDropdownPlugin.onReady,
                onYearChange: customYearDropdownPlugin.onYearChange,
                onChange: (selectedDates, dateStr) => {
                    if (dateStr && this.urlTemplate) {
                        const targetUrl = this.urlTemplate.replace('9999-99-99', dateStr);
                        // Trigger SPA loader instead of hard redirect if available
                        if (typeof navigateTo === 'function') navigateTo(targetUrl);
                        else window.location.href = targetUrl;
                    }
                }
            });
        }
    },

    // Bulletproof search handler tied directly to the DOM
    handleSearch(val) {
        const term = val.toLowerCase().trim();
        const rows = document.querySelectorAll('.data-row');
        const noResultsRow = document.getElementById('no-search-results');
        let hasVisible = false;

        rows.forEach(row => {
            const searchableText = row.dataset.search || '';
            if (searchableText.includes(term)) {
                row.style.display = '';
                hasVisible = true;
            } else {
                row.style.display = 'none';
            }
        });

        if (noResultsRow) {
            noResultsRow.style.display = (hasVisible || term === '') ? 'none' : '';
        }
    }
};

// Initialize immediately
document.addEventListener("DOMContentLoaded", () => window.DailyReportsListApp.init());