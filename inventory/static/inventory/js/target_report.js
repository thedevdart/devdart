window.TargetReportApp = {
    csrfToken: null,
    saveUrl: null,
    deleteUrl: null,
    runUrl: null,
    exportBaseUrl: null,
    
    centers: [],
    centerItems: {},
    savedReports: [],
    
    state: {
        reportId: '',
        reportName: '',
        columns: []
    },
    
    activeColIndex: 0,
    isRunning: false,
    reportData: null,

    init() {
        const envEl = document.getElementById('env-data');
        if (envEl) {
            this.csrfToken = envEl.getAttribute('data-csrf');
            this.saveUrl = envEl.getAttribute('data-save-url');
            this.deleteUrl = envEl.getAttribute('data-delete-url');
            this.runUrl = envEl.getAttribute('data-run-url');
            this.exportBaseUrl = envEl.getAttribute('data-export-base');
        }

        try {
            this.centers = JSON.parse(document.getElementById('centers-data').textContent).map(c => ({...c, id: String(c.id)}));
            this.centerItems = JSON.parse(document.getElementById('center-items-data').textContent);
            this.savedReports = JSON.parse(document.getElementById('saved-reports-data').textContent);
        } catch (e) {
            console.error("Data parsing error", e);
        }

        this.renderSavedReportsDropdown();
        this.initCalendars();
        this.renderBuilder();
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

    renderSavedReportsDropdown() {
        const dropdownList = document.getElementById('saved-reports-dropdown-list');
        if (!dropdownList) return;

        let html = `
            <div class="select-option px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-700" data-value="">
                <div class="option-content"><span class="text-[11px] font-black uppercase tracking-widest text-slate-400">-- Create New Report --</span></div>
            </div>
        `;
        
        this.savedReports.forEach(rep => {
            html += `
            <div class="select-option px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors" data-value="${rep.id}">
                <div class="option-content"><span class="text-[11px] font-black uppercase tracking-widest text-brand dark:text-white">${rep.name}</span></div>
            </div>`;
        });
        
        dropdownList.innerHTML = html;
        this.initStaticDropdowns();
    },

    initStaticDropdowns() {
        const mainSelect = document.getElementById('report-selector');
        if (!mainSelect) return;

        const trigger = mainSelect.querySelector('.select-trigger');
        const dropdown = mainSelect.querySelector('.select-dropdown');
        const valueSpan = mainSelect.querySelector('.select-value .option-content span');
        const icon = mainSelect.querySelector('.fa-chevron-down');
        const options = mainSelect.querySelectorAll('.select-option');

        const newTrigger = trigger.cloneNode(true);
        trigger.parentNode.replaceChild(newTrigger, trigger);

        newTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            if (dropdown.classList.contains('hidden')) {
                mainSelect.style.zIndex = "50";
                dropdown.classList.remove('hidden');
                setTimeout(() => {
                    dropdown.classList.remove('opacity-0', 'scale-y-95');
                    dropdown.classList.add('opacity-100', 'scale-y-100');
                }, 10);
                if(icon) icon.classList.add('rotate-180');
            } else {
                mainSelect.style.zIndex = "10";
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
                const text = opt.querySelector('span').innerText;
                
                valueSpan.innerText = text;
                if(val) valueSpan.classList.replace('text-slate-400', 'text-brand');
                else valueSpan.classList.replace('text-brand', 'text-slate-400');
                
                mainSelect.style.zIndex = "10";
                dropdown.classList.remove('opacity-100', 'scale-y-100');
                dropdown.classList.add('opacity-0', 'scale-y-95');
                setTimeout(() => dropdown.classList.add('hidden'), 200);
                if(icon) icon.classList.remove('rotate-180');

                this.loadConfig(val);
            });
        });

        document.addEventListener('click', () => {
            mainSelect.style.zIndex = "10";
            if (!dropdown.classList.contains('hidden')) {
                dropdown.classList.remove('opacity-100', 'scale-y-100');
                dropdown.classList.add('opacity-0', 'scale-y-95');
                setTimeout(() => dropdown.classList.add('hidden'), 200);
                if(icon) icon.classList.remove('rotate-180');
            }
        });
    },

    initCalendars() {
        flatpickr("#reportTargetDate", { 
            dateFormat: "Y-m-d", 
            altInput: true,
            altFormat: "d-m-Y",
            defaultDate: "today",
            maxDate: "today",
            onChange: (selectedDates, dateStr) => {
                if(dateStr && this.state.reportId) {
                    this.runReport();
                }
            }
        });
    },

    loadConfig(id) {
        const delBtn = document.getElementById('deleteBtn');
        const nameInput = document.getElementById('reportNameInput');

        if (!id) {
            this.state.reportId = '';
            this.state.reportName = '';
            this.state.columns = [];
            this.reportData = null;
            nameInput.value = '';
            if(delBtn) delBtn.classList.add('hidden');
            this.renderBuilder();
            this.renderReport();
            return;
        }
        
        const rep = this.savedReports.find(r => r.id == id);
        if (rep) {
            this.state.reportId = rep.id;
            this.state.reportName = rep.name;
            this.state.columns = JSON.parse(JSON.stringify(rep.columns)).map(c => ({
                ...c,
                center_ids: (c.center_ids || []).map(id => String(id)) 
            }));
            this.activeColIndex = 0;
            this.reportData = null; 
            
            nameInput.value = this.state.reportName;
            if(delBtn) delBtn.classList.remove('hidden');

            this.renderBuilder();
            this.renderReport();
        }
    },

    updateName(val) { this.state.reportName = val; },
    updateColName(idx, val) { 
        this.state.columns[idx].name = val; 
        document.getElementById(`col-title-${idx}`).innerText = val || 'New Column';
    },
    updateColTarget(idx, val) { 
        this.state.columns[idx].target = parseFloat(val) || 0; 
        const badge = document.getElementById(`col-target-${idx}`);
        if(this.state.columns[idx].target > 0) {
            badge.innerText = 'Tgt: ' + this.state.columns[idx].target;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    },
    toggleCol(idx) {
        const wasActive = this.activeColIndex === idx;
        this.activeColIndex = wasActive ? null : idx;
        this.renderBuilder();
    },
    addCol() {
        this.state.columns.push({center_ids: [''], name: '', target: 0, items: []});
        this.activeColIndex = this.state.columns.length - 1;
        this.renderBuilder();
        setTimeout(() => {
            const el = document.getElementById('columns-container');
            if(el) el.scrollTop = el.scrollHeight;
        }, 50);
    },
    removeCol(idx) {
        if(confirm("Are you sure you want to remove this column?")) {
            this.state.columns.splice(idx, 1);
            this.renderBuilder();
        }
    },
    addCenter(cIdx) {
        this.state.columns[cIdx].center_ids.push('');
        this.renderBuilder();
    },
    removeCenter(cIdx, ctrIdx) {
        this.state.columns[cIdx].center_ids.splice(ctrIdx, 1);
        this.renderBuilder();
    },
    updateCenter(cIdx, ctrIdx, val) {
        this.state.columns[cIdx].center_ids[ctrIdx] = val;
        if(ctrIdx === 0 && !this.state.columns[cIdx].name) {
            const center = this.centers.find(c => c.id == val);
            if(center) {
                this.state.columns[cIdx].name = center.name;
                this.renderBuilder();
                return;
            }
        }
        this.renderBuilder();
    },
    toggleItem(cIdx, item) {
        const col = this.state.columns[cIdx];
        if (col.items.includes(item)) col.items = col.items.filter(i => i !== item);
        else col.items.push(item);
        this.renderBuilder();
    },
    clearItems(cIdx) {
        this.state.columns[cIdx].items = [];
        this.renderBuilder();
    },
    selectAllItems(cIdx, cid) {
        const col = this.state.columns[cIdx];
        const itemsToAdd = this.centerItems[cid] || [];
        itemsToAdd.forEach(itm => {
            if(!col.items.includes(itm)) col.items.push(itm);
        });
        this.renderBuilder();
    },

    renderBuilder() {
        const container = document.getElementById('columns-container');
        if (!container) return;

        let html = '';
        this.state.columns.forEach((col, idx) => {
            const isActive = this.activeColIndex === idx;
            const targetDisplay = col.target > 0 ? `Tgt: ${col.target}` : '';
            
            let centersHtml = '';
            col.center_ids.forEach((cid, ctrIdx) => {
                let optionsHtml = `<option value="" disabled ${!cid ? 'selected' : ''}>Select Center...</option>`;
                this.centers.forEach(c => {
                    optionsHtml += `<option value="${c.id}" ${c.id === cid ? 'selected' : ''}>${c.name}</option>`;
                });
                const minusBtn = col.center_ids.length > 1 
                    ? `<button onclick="window.TargetReportApp.removeCenter(${idx}, ${ctrIdx})" class="w-8 h-8 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20 flex items-center justify-center transition-colors shrink-0 border border-red-500/20"><i class="fa-solid fa-minus text-[10px]"></i></button>` 
                    : '';

                centersHtml += `
                <div class="flex items-center gap-2 mt-2">
                    <select onchange="window.TargetReportApp.updateCenter(${idx}, ${ctrIdx}, this.value)" class="flex-1 text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:ring-1 focus:ring-accent cursor-pointer shadow-sm">
                        ${optionsHtml}
                    </select>
                    ${minusBtn}
                </div>`;
            });

            let itemsHtml = '';
            const validCenters = col.center_ids.filter(id => id !== '');
            if (validCenters.length > 0) {
                itemsHtml += `
                <div class="border-t border-slate-200 dark:border-slate-700 pt-4 mt-2">
                    <div class="flex justify-between items-center mb-3">
                        <label class="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Tracked Materials (<span class="text-accent">${col.items.length}</span>)</label>
                        <button type="button" onclick="window.TargetReportApp.clearItems(${idx})" class="text-[8px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-sm font-black uppercase tracking-widest hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">Clear All</button>
                    </div>
                    <div class="max-h-48 overflow-y-auto custom-scrollbar border border-slate-200 dark:border-slate-700 rounded-md p-3 bg-slate-100 dark:bg-slate-900 shadow-inner space-y-4">
                `;

                validCenters.forEach(cid => {
                    const centerName = this.centers.find(c => c.id == cid)?.name || 'Unknown';
                    const cItems = this.centerItems[cid] || [];
                    
                    let pills = '';
                    if (cItems.length === 0) {
                        pills = `<div class="text-[9px] italic text-slate-400">No raw materials found.</div>`;
                    } else {
                        cItems.forEach(itm => {
                            const isChecked = col.items.includes(itm);
                            // Highly visible Accent Green for checked pills
                            const pillClasses = isChecked ? 'bg-accent border-accent text-brand shadow-md' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-accent/50';
                            
                            pills += `
                            <label class="inline-flex items-center border rounded-sm px-2.5 py-1.5 cursor-pointer transition-all ${pillClasses}">
                                <input type="checkbox" value="${itm}" onchange="window.TargetReportApp.toggleItem(${idx}, '${itm}')" ${isChecked ? 'checked' : ''} class="hidden">
                                <span class="text-[10px] font-black uppercase tracking-widest transition-colors">${itm}</span>
                            </label>`;
                        });
                    }

                    itemsHtml += `
                        <div class="space-y-2">
                            <div class="text-[9px] font-black text-brand dark:text-slate-300 uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 pb-1.5 flex justify-between items-center">
                                <span>${centerName}</span>
                                <button type="button" onclick="window.TargetReportApp.selectAllItems(${idx}, '${cid}')" class="text-accent hover:text-accent/80 transition-colors">Select All</button>
                            </div>
                            <div class="flex flex-wrap gap-2">${pills}</div>
                        </div>
                    `;
                });
                itemsHtml += `</div></div>`;
            }

            // High visibility Accent green for active column wrapper
            html += `
            <div class="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm transition-all overflow-hidden mb-3 ${isActive ? 'ring-2 ring-accent border-accent' : 'hover:border-accent/50'}">
                <div onclick="window.TargetReportApp.toggleCol(${idx})" class="p-4 flex justify-between items-center cursor-pointer transition-colors bg-slate-50 dark:bg-slate-900 ${isActive ? 'border-b border-slate-200 dark:border-slate-700 bg-accent/10 dark:bg-accent/10' : ''}">
                    <h4 class="font-black text-[11px] text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                        <i class="fa-solid fa-table-columns ${isActive ? 'text-accent' : 'text-slate-400'}"></i>
                        <span id="col-title-${idx}">${col.name || 'New Column'}</span>
                    </h4>
                    <div class="flex items-center gap-3">
                        <span id="col-target-${idx}" class="text-[9px] font-black px-2 py-1 rounded-sm bg-accent/20 text-brand dark:text-accent tracking-widest uppercase ${col.target > 0 ? '' : 'hidden'}">${targetDisplay}</span>
                        <button onclick="event.stopPropagation(); window.TargetReportApp.removeCol(${idx})" class="text-slate-400 hover:text-red-500 transition-colors w-6 h-6 rounded-sm hover:bg-red-500/10 flex items-center justify-center"><i class="fa-solid fa-trash text-[10px]"></i></button>
                        <i class="fa-solid fa-chevron-down text-[10px] text-slate-400 transition-transform ${isActive ? 'rotate-180' : ''}"></i>
                    </div>
                </div>
                
                <div class="${isActive ? 'block' : 'hidden'} p-5">
                    <div class="grid grid-cols-2 gap-5 mb-5">
                        <div class="space-y-1.5">
                            <label class="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Column Label</label>
                            <input type="text" value="${col.name}" oninput="window.TargetReportApp.updateColName(${idx}, this.value)" placeholder="e.g. Surat" class="w-full text-[11px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:ring-1 focus:ring-accent shadow-inner">
                        </div>
                        <div class="space-y-1.5">
                            <label class="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Monthly Target</label>
                            <input type="number" value="${col.target}" oninput="window.TargetReportApp.updateColTarget(${idx}, this.value)" placeholder="0" class="w-full text-sm font-black text-brand dark:text-accent p-2 bg-accent/5 border border-accent/30 rounded-md outline-none focus:ring-1 focus:ring-accent shadow-inner">
                        </div>
                    </div>

                    <div class="space-y-2 bg-slate-50 dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-700">
                        <div class="flex justify-between items-center mb-1">
                            <label class="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Source Centers (<span class="text-accent">${col.center_ids.length}</span>)</label>
                            <button type="button" onclick="window.TargetReportApp.addCenter(${idx})" class="text-[9px] font-black text-accent hover:underline flex items-center gap-1 uppercase tracking-widest"><i class="fa-solid fa-plus"></i> Add Center</button>
                        </div>
                        ${centersHtml}
                    </div>

                    ${itemsHtml}
                </div>
            </div>
            `;
        });

        container.innerHTML = html;
    },

    renderReport() {
        const wrapper = document.getElementById('report-wrapper');
        const emptyState = document.getElementById('empty-state');
        const data = this.reportData;

        if (!data) {
            wrapper.classList.add('hidden');
            emptyState.classList.remove('hidden');
            document.getElementById('exportBtn').classList.add('hidden');
            return;
        }

        wrapper.classList.remove('hidden');
        emptyState.classList.add('hidden');
        document.getElementById('exportBtn').classList.remove('hidden');

        // Massive block of Green for the Header
        let headHtml = '';
        data.col_names.forEach(col => {
            headHtml += `<th class="px-4 py-4 border-r border-brand/20 text-center">${col}</th>`;
        });
        document.getElementById('report-dynamic-headers').innerHTML = headHtml;

        const genRow = (lbl, title, total, arr, bgClass, isTitleBold=false, labelColor='') => {
            let cells = '';
            arr.forEach(val => {
                cells += `<td class="px-4 py-3 border-r border-slate-200 dark:border-slate-700 text-center font-mono font-bold ${bgClass}">${Math.round(val).toLocaleString()}</td>`;
            });
            return `
            <tr class="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <td class="px-4 py-3 border-r border-slate-200 dark:border-slate-700 text-center text-slate-400 font-black text-[10px]">${lbl}</td>
                <td class="px-4 py-3 border-r border-slate-200 dark:border-slate-700 font-bold text-[11px] uppercase tracking-wider ${isTitleBold ? labelColor : ''}">${title}</td>
                <td class="px-4 py-3 border-r border-slate-200 dark:border-slate-700 text-right font-black text-brand dark:text-white ${bgClass}">${Math.round(total).toLocaleString()}</td>
                ${cells}
            </tr>`;
        };

        let bodyHtml = '';
        bodyHtml += genRow('A', 'Monthly Purchase Target', data.total_a, data.row_a, '');
        bodyHtml += genRow('B', 'Daily Purchase Target', data.total_b, data.row_b, '');
        bodyHtml += genRow('C', 'Target till Date', data.total_c, data.row_c, 'bg-slate-50 dark:bg-slate-900', true, 'text-brand dark:text-accent');

        bodyHtml += `<tr class="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700"><td class="px-4 py-4 border-r border-slate-200 dark:border-slate-700 font-black text-center text-slate-400 text-[10px]">D</td><td class="px-4 py-4 border-r border-slate-200 dark:border-slate-700 font-black text-brand dark:text-slate-300 uppercase tracking-widest text-[11px]"><i class="fa-solid fa-calendar-days text-slate-400 mr-2"></i>Daily Inward</td><td colspan="100%" class="bg-slate-100 dark:bg-slate-900"></td></tr>`;

        data.daily_rows.forEach(r => {
            let cells = '';
            r.data.forEach(val => {
                cells += `<td class="px-4 py-2 border-r border-slate-200 dark:border-slate-700 text-center font-mono text-sm">${val === 0 ? '-' : Math.round(val).toLocaleString()}</td>`;
            });
            bodyHtml += `
            <tr class="hover:bg-accent/5 transition-colors text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                <td class="px-4 py-2 border-r border-slate-200 dark:border-slate-700"></td>
                <td class="px-4 py-2 border-r border-slate-200 dark:border-slate-700 font-mono font-bold text-xs text-slate-700 dark:text-slate-400">${r.date}</td>
                <td class="px-4 py-2 border-r border-slate-200 dark:border-slate-700 text-right font-black text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900">${r.total === 0 ? '-' : Math.round(r.total).toLocaleString()}</td>
                ${cells}
            </tr>`;
        });

        const eCells = data.row_e.map(v => `<td class="px-4 py-4 border-r border-slate-300 dark:border-slate-600 text-center font-mono font-bold">${Math.round(v).toLocaleString()}</td>`).join('');
        bodyHtml += `
        <tr class="font-black bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-600">
            <td class="px-4 py-4 border-r border-slate-300 dark:border-slate-600 text-center text-[10px]">E</td>
            <td class="px-4 py-4 border-r border-slate-300 dark:border-slate-600 uppercase tracking-widest text-[11px]">Total Inward till date</td>
            <td class="px-4 py-4 border-r border-slate-300 dark:border-slate-600 text-right text-base">${Math.round(data.total_e).toLocaleString()}</td>
            ${eCells}
        </tr>`;

        const formatColor = (val) => val < 0 ? 'text-accent' : 'text-red-400';
        const fCells = data.row_f.map(v => `<td class="px-4 py-4 border-r border-brand/20 dark:border-slate-600 text-center font-mono font-bold ${formatColor(v)}">${Math.round(v).toLocaleString()}</td>`).join('');
        bodyHtml += `
        <tr class="font-black bg-brand text-white dark:bg-slate-900">
            <td class="px-4 py-4 border-r border-brand/20 dark:border-slate-600 text-center text-[10px]">F</td>
            <td class="px-4 py-4 border-r border-brand/20 dark:border-slate-600 uppercase tracking-widest text-[11px]">Shortfall Purchase <span class="text-[8px] text-white/50 block font-bold tracking-widest mt-1">(Target - Inward)</span></td>
            <td class="px-4 py-4 border-r border-brand/20 dark:border-slate-600 text-right text-base ${formatColor(data.total_f)}">${Math.round(data.total_f).toLocaleString()}</td>
            ${fCells}
        </tr>`;

        document.getElementById('report-tbody').innerHTML = bodyHtml;
    },

    // --- API CALLS ---
    async saveConfig() {
        const btn = document.getElementById('saveConfigBtn');
        if(!this.state.reportName) return this.showToast("Validation Error", "Please enter a report name", "error");
        if(this.state.columns.length === 0) return this.showToast("Validation Error", "Add at least one column", "error");
        
        const hasEmpty = this.state.columns.some(c => c.center_ids.filter(id => id !== '').length === 0);
        if(hasEmpty) return this.showToast("Validation Error", "One or more columns has no centers selected", "error");

        const originalHTML = btn.innerHTML;
        btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...`;
        btn.disabled = true;

        const payload = { report_id: this.state.reportId, name: this.state.reportName, columns: this.state.columns };
        
        try {
            const res = await fetch(this.saveUrl, {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': this.csrfToken },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if(data.status === 'success') {
                const overlay = document.getElementById('saveSuccessOverlay');
                if(overlay) {
                    overlay.classList.remove('hidden');
                    setTimeout(() => window.location.reload(), 1500); 
                } else {
                    window.location.reload();
                }
            } else {
                this.showToast("Save Error", data.message, "error");
                btn.innerHTML = originalHTML;
                btn.disabled = false;
            }
        } catch(e) { 
            this.showToast("Network Error", "Could not communicate with the server", "error");
            btn.innerHTML = originalHTML;
            btn.disabled = false;
        }
    },

    openDeleteConfirm() {
        document.getElementById('deleteConfirmModal').classList.remove('hidden');
        setTimeout(() => document.getElementById('deleteConfirmModal').firstElementChild.classList.remove('opacity-0', 'scale-95'), 10);
    },

    closeDeleteConfirm() {
        const m = document.getElementById('deleteConfirmModal');
        m.firstElementChild.classList.add('opacity-0', 'scale-95');
        setTimeout(() => m.classList.add('hidden'), 300);
    },

    async confirmDelete() {
        const btn = document.getElementById('confirmDeleteBtn');
        btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Deleting...`;
        btn.disabled = true;

        try {
            const res = await fetch(this.deleteUrl, {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': this.csrfToken },
                body: JSON.stringify({ report_id: this.state.reportId })
            });
            const data = await res.json();
            if(data.status === 'success') {
                window.location.reload();
            } else {
                this.showToast("Error Deleting", data.message, "error");
                this.closeDeleteConfirm();
            }
        } catch(e) {
            this.showToast("Network Error", "Could not communicate with the server", "error");
            this.closeDeleteConfirm();
        }
    },

    async runReport() {
        const dateStr = document.getElementById('reportTargetDate').value;
        if(!dateStr || !this.state.reportId) return;
        
        const btn = document.getElementById('runReportBtn');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Running...`;
        btn.disabled = true;

        try {
            const res = await fetch(`${this.runUrl}?report_id=${this.state.reportId}&date=${dateStr}`);
            const data = await res.json();
            if(data.status === 'success') {
                this.reportData = data.data;
                this.renderReport();
            } else {
                this.showToast("Calculation Error", data.message, "error");
            }
        } catch(e) { 
            this.showToast("Network Error", "Could not fetch report data", "error");
        } finally { 
            btn.innerHTML = originalHTML;
            btn.disabled = false;
        }
    },

    downloadExcel() {
        const dateStr = document.getElementById('reportTargetDate').value;
        window.location.href = `${this.exportBaseUrl}${this.state.reportId}/${dateStr}/`;
    }
};

document.addEventListener("DOMContentLoaded", () => window.TargetReportApp.init());