document.addEventListener('alpine:init', () => {
    Alpine.data('reportApp', () => {
        
        // 1. Fetch raw data directly from the Window object
        const data = window.REPORT_DATA;
        
        if (!data || !data.centers) {
            return {};
        }

        // 2. Build Centers Data Array
        const centersData = data.centers.map((c, index) => {
            const summary = data.summaries[index] || { rm_total: 0, fg_total: 0, total: 0 };
            return {
                id: c.name,
                name: c.name,
                category: c.category,
                is_carried_over: c.is_carried_over,
                copied_from_date: c.copied_from_date,
                rm_total: summary.rm_total,
                fg_total: summary.fg_total,
                total: summary.total,
                raw: [],
                finish: []
            };
        });
        
        // 3. Build Raw Items Data Array from the Matrix
        const rawItems = data.detailed_rows.map((row, idx) => {
            const itemObj = {
                id: 'item-' + idx,
                name: row.name,
                category: row.category,
                total: 0,
                centers: []
            };

            row.cols.forEach((qty, colIdx) => {
                const parsedQty = parseInt(qty, 10) || 0;
                if (parsedQty > 0 && centersData[colIdx]) {
                    itemObj.centers.push({
                        name: centersData[colIdx].name,
                        category: centersData[colIdx].category,
                        qty: parsedQty
                    });
                }
            });

            return itemObj;
        });
        
        // 4. Distribute items back into centersData for the Accordion View
        rawItems.forEach(item => {
            let sum = 0;
            item.centers.forEach(c => sum += c.qty);
            item.total = sum;
            
            const isRaw = item.category.includes('RAW');
            
            item.centers.forEach(c => {
                let centerObj = centersData.find(x => x.name === c.name);
                if (centerObj) {
                    if(isRaw) {
                        centerObj.raw.push({ name: item.name, qty: c.qty });
                    } else {
                        centerObj.finish.push({ name: item.name, qty: c.qty });
                    }
                }
            });
        });

        // 5. Return Alpine Reactive Object
        return {
            viewMode: 'center', 
            activeFilter: 'ALL', 
            search: '',
            selected: null,
            
            centerList: centersData,
            itemList: rawItems,
            
            get filteredList() {
                const source = this.viewMode === 'center' ? this.centerList : this.itemList;
                const searchUpper = this.search.toUpperCase();
                
                return source.filter(i => {
                    const matchesSearch = !this.search || i.name.includes(searchUpper);
                    const matchesFilter = this.viewMode !== 'center' || this.activeFilter === 'ALL' || i.category === this.activeFilter;
                    return matchesSearch && matchesFilter;
                });
            },

            get dynamicRM() {
                if (this.viewMode === 'item') return data.grand_rm;
                return this.filteredList.reduce((sum, item) => sum + (item.rm_total || 0), 0);
            },
            get dynamicFG() {
                if (this.viewMode === 'item') return data.grand_fg;
                return this.filteredList.reduce((sum, item) => sum + (item.fg_total || 0), 0);
            },
            get dynamicTotal() {
                return this.dynamicRM + this.dynamicFG;
            },

            switchMode(mode) {
                this.viewMode = mode;
                this.selected = null;
                this.search = '';
            },

            selectItem(item) {
                this.selected = item;
            }
        };
    });
});