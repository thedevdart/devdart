window.reportManager = function() {
    return {
        allCenters: [],
        date: '',
        centerOpen: false,
        centerSearch: '',
        selectedCenters: [],
        itemOpen: false,
        itemSearch: '',
        availableItems: [],
        selectedItems: [],
        isFetchingItems: false,
        isGenerating: false,
        reportColumns: [],
        reportRows: [],

        // Django Context
        csrfToken: null,

        init() {
            // 1. Grab environment data
            const envEl = document.getElementById('env-data');
            if (envEl) {
                this.csrfToken = envEl.getAttribute('data-csrf');
            }

            // 2. Load Centers
            try {
                const rawCenters = JSON.parse(document.getElementById('centers-data').textContent);
                this.allCenters = rawCenters.map(c => ({ id: String(c.id), name: c.name }));
            } catch(e) {
                console.error("Failed to parse centers data", e);
            }
        },

        get filteredCenters() {
            if (this.centerSearch === '') return this.allCenters;
            const lowerSearch = this.centerSearch.toLowerCase();
            return this.allCenters.filter(c => c.name.toLowerCase().includes(lowerSearch));
        },

        get filteredItems() {
            if (this.itemSearch === '') return this.availableItems;
            const lowerSearch = this.itemSearch.toLowerCase();
            return this.availableItems.filter(item => item.toLowerCase().includes(lowerSearch));
        },

        selectAllFilteredItems() {
            const currentlyFiltered = this.filteredItems;
            currentlyFiltered.forEach(item => {
                if (!this.selectedItems.includes(item)) this.selectedItems.push(item);
            });
        },

        async fetchItems() {
            if (!this.date) return;
            
            this.isFetchingItems = true;
            const params = new URLSearchParams();
            params.append('date', this.date);
            this.selectedCenters.forEach(cid => params.append('centers[]', cid));

            try {
                const response = await fetch(`/inventory/api/custom-report/items/?${params.toString()}`);
                const data = await response.json();
                
                if (data.status === 'success') {
                    this.availableItems = data.items;
                    this.selectedItems = this.selectedItems.filter(item => this.availableItems.includes(item));
                }
            } catch (error) {
                console.error('Error fetching items:', error);
            } finally {
                this.isFetchingItems = false;
            }
        },

        async runReport() {
            if (!this.date || !this.csrfToken) return;
            this.isGenerating = true;
            
            const payload = {
                date: this.date,
                centers: this.selectedCenters,
                items: this.selectedItems
            };

            try {
                const response = await fetch('/inventory/api/custom-report/generate/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': this.csrfToken },
                    body: JSON.stringify(payload)
                });
                
                const data = await response.json();
                if (data.status === 'success') {
                    this.reportColumns = data.columns;
                    this.reportRows = data.data;
                } else {
                    window.AppModal.show({title: "Calculation Error", message: data.message, confirmText: "Close"});
                }
            } catch (error) {
                window.AppModal.show({title: "Network Error", message: "Failed to generate report.", confirmText: "Close"});
            } finally {
                this.isGenerating = false;
            }
        },

        exportExcel() {
            if (!this.date) return;
            const params = new URLSearchParams();
            params.append('date', this.date);
            if (this.selectedCenters.length > 0) params.append('centers', this.selectedCenters.join(','));
            if (this.selectedItems.length > 0) params.append('items', this.selectedItems.join(','));
            
            window.location.href = `/inventory/api/custom-report/export/?${params.toString()}`;
        }
    };
};