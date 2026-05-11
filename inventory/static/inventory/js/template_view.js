window.TemplateViewApp = {
    state: {
        printTitle: '',
        rawCols: ['OPENING', 'INWARD', 'DISPATCH', 'CLOSING'],
        finCols: ['OPENING', 'PRODUCTION', 'DISPATCH', 'CLOSING']
    },

    init() {
        this.renderAll();
    },

    // --- STATE ACTIONS ---
    updateTitle(val) {
        this.state.printTitle = val.toUpperCase();
        this.syncPreview();
    },

    addColumn(type) {
        if (type === 'raw') this.state.rawCols.push('NEW COLUMN');
        else this.state.finCols.push('NEW COLUMN');
        this.renderAll();
    },

    removeColumn(type, index) {
        if (type === 'raw') this.state.rawCols.splice(index, 1);
        else this.state.finCols.splice(index, 1);
        this.renderAll();
    },

    updateColumnLabel(type, index, val) {
        if (type === 'raw') this.state.rawCols[index] = val.toUpperCase();
        else this.state.finCols[index] = val.toUpperCase();
        this.syncPreview();
    },

    // --- RENDERERS ---
    renderAll() {
        this.renderColumnList('raw');
        this.renderColumnList('fin');
        this.syncPreview();
        this.updatePayload();
    },

    renderColumnList(type) {
        const container = document.getElementById(`${type}-cols-container`);
        if (!container) return;

        const cols = type === 'raw' ? this.state.rawCols : this.state.finCols;
        let html = '';

        cols.forEach((col, idx) => {
            html += `
            <div class="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1.5 rounded-md transition-all focus-within:border-primary">
                <i class="fa-solid fa-grip-vertical text-slate-400 cursor-move px-2 text-[10px]"></i>
                <input type="text" value="${col}" 
                    oninput="window.TemplateViewApp.updateColumnLabel('${type}', ${idx}, this.value)" 
                    class="w-full bg-transparent outline-none font-black text-[11px] uppercase tracking-widest text-slate-700 dark:text-slate-300">
                <button onclick="window.TemplateViewApp.removeColumn('${type}', ${idx})" class="text-slate-400 hover:text-red-500 p-2 transition-colors">
                    <i class="fa-solid fa-xmark text-xs"></i>
                </button>
            </div>
            `;
        });
        container.innerHTML = html;
    },

    syncPreview() {
        // Sync Header
        const previewTitle = document.getElementById('preview-header-title');
        if (previewTitle) previewTitle.innerText = this.state.printTitle || 'CENTER NAME';

        // Sync Raw Table Headers
        const rawHead = document.getElementById('preview-raw-header-row');
        if (rawHead) {
            let html = '<th class="border-b border-r border-black p-2 w-12">SR</th><th class="border-b border-r border-black p-2 text-left">ITEM NAME</th>';
            this.state.rawCols.forEach(c => {
                html += `<th class="border-b border-r last:border-r-0 border-black p-2 w-20 text-[10px] uppercase font-black">${c}</th>`;
            });
            rawHead.innerHTML = html;
        }

        // Sync Raw Body Cells (placeholders)
        const rawRows = document.querySelectorAll('.preview-raw-body-row');
        rawRows.forEach(row => {
            let cells = '';
            this.state.rawCols.forEach(() => {
                cells += `<td class="border-b border-r last:border-r-0 border-black p-2 h-8"></td>`;
            });
            // First two cells are SR and Name (Django rendered), append the dynamic ones
            const sr = row.getAttribute('data-sr');
            const name = row.getAttribute('data-name');
            row.innerHTML = `<td class="border-b border-r border-black p-2 text-center text-[10px]">${sr}</td><td class="border-b border-r border-black p-2 text-[10px] font-bold uppercase">${name}</td>` + cells;
        });

        // Sync Fin Table Headers
        const finHead = document.getElementById('preview-fin-header-row');
        if (finHead) {
            let html = '<th class="border-b border-r border-black p-2 w-12">SR</th><th class="border-b border-r border-black p-2 text-left">ITEM NAME</th>';
            this.state.finCols.forEach(c => {
                html += `<th class="border-b border-r last:border-r-0 border-black p-2 w-20 text-[10px] uppercase font-black">${c}</th>`;
            });
            finHead.innerHTML = html;
        }

        // Sync Fin Body Cells
        const finRows = document.querySelectorAll('.preview-fin-body-row');
        finRows.forEach(row => {
            let cells = '';
            this.state.finCols.forEach(() => {
                cells += `<td class="border-b border-r last:border-r-0 border-black p-2 h-8"></td>`;
            });
            const sr = row.getAttribute('data-sr');
            const name = row.getAttribute('data-name');
            row.innerHTML = `<td class="border-b border-r border-black p-2 text-center text-[10px]">${sr}</td><td class="border-b border-r border-black p-2 text-[10px] font-bold uppercase">${name}</td>` + cells;
        });

        this.updatePayload();
    },

    updatePayload() {
        const payloadInput = document.getElementById('download-payload');
        if (payloadInput) {
            payloadInput.value = JSON.stringify({
                print_title: this.state.printTitle,
                raw_columns: this.state.rawCols,
                finished_columns: this.state.finCols
            });
        }
    }
};

document.addEventListener("DOMContentLoaded", () => window.TemplateViewApp.init());