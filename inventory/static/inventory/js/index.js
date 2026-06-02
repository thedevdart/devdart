let currentBase64 = null;
let currentMime = null;
let currentFileObj = null; 

let centerMastersDict = {};
let centerAliasesDict = {};
let currentCenterMasters = [];
let currentCenterAliases = {};
let extractionAuditLog = [];

window.pendingAliases = [];
window.currentActiveTab = 'closing'; 
window.uploadedCenterIds = [];
window.supervisorCenterIds = [];
window.supervisorSheets = {};
window.isSupervisorPreload = false;
// --- UNDO / REDO STATE ENGINE ---
window.historyStack = [];
window.historyIndex = -1;
const MAX_HISTORY = 30; // Keeps the last 30 changes

window.saveState = function() {
    const rows = document.querySelectorAll('#tableBody tr');
    const stateData = [];
    
    rows.forEach(tr => {
        stateData.push({
            uid: tr.getAttribute('data-uid'),
            name: tr.querySelector('.item-name-cell').innerText,
            original: tr.querySelector('.item-name-cell').getAttribute('data-original') || '',
            cat: tr.getAttribute('data-cat'),
            isUnresolved: tr.classList.contains('unresolved-row'),
            savedAlias: tr.getAttribute('data-save-alias') || 'false',
            cbChecked: tr.querySelector('.save-alias-cb') ? tr.querySelector('.save-alias-cb').checked : false,
            op: tr.querySelector('.val-opening').value,
            inw: tr.querySelector('.val-inward').value,
            disp: tr.querySelector('.val-dispatch').value,
            clo: tr.querySelector('.val-closing').value,
            carried: tr.querySelector('.val-carried').innerText
        });
    });

    const stateObj = { table: stateData, aliases: JSON.parse(JSON.stringify(window.pendingAliases)) };

    if (window.historyIndex < window.historyStack.length - 1) {
        window.historyStack = window.historyStack.slice(0, window.historyIndex + 1);
    }

    window.historyStack.push(stateObj);
    if (window.historyStack.length > MAX_HISTORY) window.historyStack.shift();
    else window.historyIndex++;
    
    updateUndoRedoUI();
};

window.loadState = function(index) {
    if (index < 0 || index >= window.historyStack.length) return;
    window.historyIndex = index;
    const stateObj = window.historyStack[index];
    
    window.pendingAliases = JSON.parse(JSON.stringify(stateObj.aliases));
    
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    const fragment = document.createDocumentFragment();
    stateObj.table.forEach(rData => {
        const tr = createRow(rData.name, rData.cat, rData.isUnresolved, { op: rData.op, inw: rData.inw, disp: rData.disp, clo: rData.clo });
        tr.setAttribute('data-uid', rData.uid);
        tr.querySelector('.val-carried').innerText = rData.carried;
        if (rData.original) tr.querySelector('.item-name-cell').setAttribute('data-original', rData.original);
        tr.setAttribute('data-save-alias', rData.savedAlias);
        if (tr.querySelector('.save-alias-cb')) tr.querySelector('.save-alias-cb').checked = rData.cbChecked;
        
        updateRowTheme(tr, rData.cat);
        fragment.appendChild(tr);
    });
    
    tbody.appendChild(fragment);
    window.calculateTotals();
    updateComplicationIndicator();
    updateUndoRedoUI();
};

window.undo = function() { if (window.historyIndex > 0) window.loadState(window.historyIndex - 1); };
window.redo = function() { if (window.historyIndex < window.historyStack.length - 1) window.loadState(window.historyIndex + 1); };

function updateUndoRedoUI() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    if(undoBtn) undoBtn.disabled = window.historyIndex <= 0;
    if(redoBtn) redoBtn.disabled = window.historyIndex >= window.historyStack.length - 1;
}

// Keyboard Shortcuts (Ctrl+Z / Ctrl+Y)
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') { e.preventDefault(); window.undo(); }
        if (e.key === 'y') { e.preventDefault(); window.redo(); }
    }
});
// --- END UNDO / REDO ENGINE ---

// API keys moved to backend (see inventory/utils.py and GEMINI_API_KEY env var)
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
const debouncedCalc = debounce(() => window.calculateTotals(), 150);

window.triggerSaveFlow = function() {
    const unresolvedCount = document.querySelectorAll('#tableBody tr.unresolved-row').length;
    if (unresolvedCount > 0) {
        const alpineContainer = document.getElementById('ledger-app-container');
        if (typeof Alpine !== 'undefined' && alpineContainer) {
            Alpine.$data(alpineContainer).unresolvedCount = unresolvedCount;
            Alpine.$data(alpineContainer).showSaveModal = true;
        }
    } else {
        executeSave();
    }
}

// --- MATH EVALUATION FOR INPUTS ---
window.evaluateMath = function(inputEl) {
    let val = inputEl.value;
    if (!val) return;
    
    // Check if there's any math operator (+, -, *, /) avoiding just a starting negative number
    if (/[\+\*\/]/.test(val) || (val.indexOf('-') > 0)) {
        try {
            let sanitized = val.replace(/[^-()\d/*+.]/g, ''); 
            if (sanitized) {
                let result = Function('"use strict";return (' + sanitized + ')')();
                if (!isNaN(result) && isFinite(result) && inputEl.value !== String(result)) {
                    inputEl.value = result;
                    if (typeof debouncedCalc === 'function') debouncedCalc();
                    if (typeof window.saveState === 'function') window.saveState();
                    
                    // Visual feedback animation
                    inputEl.style.transition = 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)';
                    inputEl.classList.add('scale-125', 'bg-emerald-100', 'dark:bg-emerald-900', 'text-emerald-800', 'dark:text-emerald-300', 'z-10', 'relative');
                    setTimeout(() => {
                        inputEl.style.transition = 'all 0.3s ease-in-out';
                        inputEl.classList.remove('scale-125', 'bg-emerald-100', 'dark:bg-emerald-900', 'text-emerald-800', 'dark:text-emerald-300', 'z-10', 'relative');
                        setTimeout(() => inputEl.style.transition = '', 300); // restore original Tailwind transition
                    }, 200);
                }
            }
        } catch (err) {
            // Ignore invalid math
        }
    }
};

// --- FLATPICKR CUSTOM YEAR DROPDOWN PLUGIN ---
const customYearDropdownPlugin = {
    onReady: function(selectedDates, dateStr, instance) {
        const yearInput = instance.currentYearElement;
        const yearWrapper = yearInput.parentNode;
        yearInput.style.display = 'none'; // Hide the default number input
        
        const select = document.createElement('select');
        select.className = 'cur-year-dropdown';
        
        const currentYear = new Date().getFullYear();
        // Populate +/- 10 years from current year
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

document.addEventListener("DOMContentLoaded", function() {
    try {
        const mastersEl = document.getElementById('center-masters-data');
        const aliasesEl = document.getElementById('center-aliases-data');
        if (mastersEl) centerMastersDict = JSON.parse(mastersEl.textContent);
        if (aliasesEl) centerAliasesDict = JSON.parse(aliasesEl.textContent);
    } catch(e) {
        console.error("Failed to parse masters/aliases JSON", e);
    }

    const dateInputEl = document.getElementById('dateInput');
    
    if (dateInputEl) {
        const today = new Date(); 
        const yesterday = new Date(today); 
        yesterday.setDate(yesterday.getDate() - 1);
        
        const yyyy = yesterday.getFullYear();
        const mm = String(yesterday.getMonth() + 1).padStart(2, '0');
        const dd = String(yesterday.getDate()).padStart(2, '0');
        const yesterdayStr = `${yyyy}-${mm}-${dd}`;
        
        dateInputEl.value = yesterdayStr;

        flatpickr(dateInputEl, {
            dateFormat: "Y-m-d",
            altInput: true,
            altFormat: "d M Y",
            allowInput: true,   // NEW: Allows manual typing
            clickOpens: false,  // NEW: Prevents calendar from opening when clicking the text
            defaultDate: yesterdayStr,
            onReady: customYearDropdownPlugin.onReady,
            onYearChange: customYearDropdownPlugin.onYearChange,
            onChange: function(selectedDates, dateStr) {
                checkUploadStatus();
                fetchPreviousClosing();
            }
        });
    }
    
    setTimeout(() => checkUploadStatus(), 100);

    const tbody = document.getElementById('tableBody');
    tbody.addEventListener('input', function(e) { if (e.target.classList.contains('val-input')) debouncedCalc(); });

    tbody.addEventListener('change', function(e) {
        if (e.target.classList.contains('val-input')) { window.saveState(); } 
        else if (e.target.classList.contains('cat-select')) {
            const tr = e.target.closest('tr');
            tr.setAttribute('data-cat', e.target.value);
            updateRowTheme(tr, e.target.value);
            window.calculateTotals(); window.saveState();
        }
        if (e.target.classList.contains('val-input')) {
            window.evaluateMath(e.target);
        }
    });

    tbody.addEventListener('focusout', function(e) {
        if (e.target.classList.contains('item-name-cell')) {
            const tr = e.target.closest('tr');
            const oldName = tr.getAttribute('data-item-name');
            const newName = e.target.innerText.toUpperCase();
            if (oldName !== newName) {
                tr.querySelector('.plain-name-span').innerText = newName;
                tr.setAttribute('data-item-name', newName);
                window.revalidateRow(tr); window.saveState();
            }
        }
    });

    tbody.addEventListener('keydown', function(e) {
        if (e.target.classList.contains('item-name-cell') && e.key === 'Enter') { e.preventDefault(); window.addRow(); }
        if (e.target.classList.contains('val-input') && e.key === 'Enter') {
            e.preventDefault();
            window.evaluateMath(e.target);
            e.target.blur();
        }
    });

    tbody.addEventListener('click', function(e) {
        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            deleteBtn.closest('tr').remove();
            window.calculateTotals(); updateComplicationIndicator(); window.saveState(); 
        }
    });

    tbody.addEventListener('dragstart', e => { if(e.target.classList.contains('val-input')) handleDragStart(e); });
    tbody.addEventListener('dragend', handleDragEnd);
    tbody.addEventListener('dragover', handleDragOver);
    tbody.addEventListener('dragleave', handleDragLeave);
    tbody.addEventListener('drop', handleDrop);

    // Dynamic Wheel & Trackpad Pinch Zoom Implementation
    window.currentDocScale = 1;
    const previewContainer = document.getElementById('previewContainer');
    if (previewContainer) {
        previewContainer.addEventListener('wheel', (e) => {
            // Check for Ctrl/Cmd to handle trackpad pinch & ctrl+scroll wheel zooming
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault(); // Stop browser from zooming the entire page window
                
                if (window.isZoomActive) {
                    window.toggleZoom(); // Disable fixed hover zoom if active
                }
                
                const rect = previewContainer.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                const scrollX = previewContainer.scrollLeft;
                const scrollY = previewContainer.scrollTop;
                
                const oldScale = window.currentDocScale;
                
                // Normalize zoom factor for both continuous trackpad gestures and discrete scroll wheels
                const zoomFactor = Math.exp(-e.deltaY * 0.005);
                window.currentDocScale *= zoomFactor;
                window.currentDocScale = Math.max(0.5, Math.min(window.currentDocScale, 10)); // Clamp 0.5x to 10x
                
                const docX = (mouseX + scrollX) / oldScale;
                const docY = (mouseY + scrollY) / oldScale;
                
                if (window.currentDocScale > 1) {
                    previewContainer.classList.remove('items-center', 'justify-center');
                    previewContainer.classList.add('items-start', 'justify-start');
                } else {
                    previewContainer.classList.add('items-center', 'justify-center');
                    previewContainer.classList.remove('items-start', 'justify-start');
                }

                document.querySelectorAll('#previewImg:not(.hidden), #pdfCanvasContainer:not(.hidden)').forEach(el => {
                    el.classList.remove('max-h-full', 'max-w-full', 'object-contain');
                    el.style.width = `${window.currentDocScale * 100}%`;
                    el.style.maxWidth = 'none';
                    el.style.height = 'auto';
                    el.style.transform = 'none';
                    el.style.transformOrigin = 'unset';
                });
                
                // Re-adjust scroll to zoom towards mouse position precisely after DOM paint
                requestAnimationFrame(() => {
                    previewContainer.scrollLeft = (docX * window.currentDocScale) - mouseX;
                    previewContainer.scrollTop = (docY * window.currentDocScale) - mouseY;
                });
            }
        }, { passive: false });

        // SaaS Standard Hover Zoom Implementation
        previewContainer.addEventListener('mousemove', (e) => {
            if (!window.isZoomActive) return;
            e.preventDefault();
            
            const rect = previewContainer.getBoundingClientRect();
            const mouseX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
            const mouseY = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
            
            const scale = 1.75; 
            
            document.querySelectorAll('#previewImg:not(.hidden), #pdfCanvasContainer:not(.hidden)').forEach(el => {
                const docW = el.offsetWidth;
                const docH = el.offsetHeight;
                
                const docX = (mouseX / rect.width) * docW;
                const docY = (mouseY / rect.height) * docH;
                
                const tx = mouseX - docX * scale;
                const ty = mouseY - docY * scale;
                
                el.style.transformOrigin = '0 0';
                el.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
            });
        });
    }

    // Table scroll container dragover for auto-scrolling
    const scrollContainer = document.getElementById('tableScrollContainer');
    if (scrollContainer) {
        scrollContainer.addEventListener('dragover', function(e) {
            e.preventDefault();
            const rect = scrollContainer.getBoundingClientRect();
            const threshold = 100;
            
            if (e.clientY - rect.top < threshold) {
                if (!window.dragScrollInterval) window.dragScrollInterval = setInterval(() => { scrollContainer.scrollTop -= 20; }, 20);
            } else if (rect.bottom - e.clientY < threshold) {
                if (!window.dragScrollInterval) window.dragScrollInterval = setInterval(() => { scrollContainer.scrollTop += 20; }, 20);
            } else {
                clearInterval(window.dragScrollInterval);
                window.dragScrollInterval = null;
            }
        });
        scrollContainer.addEventListener('drop', function() { clearInterval(window.dragScrollInterval); window.dragScrollInterval = null; });
        scrollContainer.addEventListener('dragleave', function(e) {
            const rect = scrollContainer.getBoundingClientRect();
            if (e.clientY <= rect.top || e.clientY >= rect.bottom || e.clientX <= rect.left || e.clientX >= rect.right) {
                clearInterval(window.dragScrollInterval);
                window.dragScrollInterval = null;
            }
        });
    }
});

function loadCenterMasters() {
    const centerId = document.getElementById('centerSelect').value;
    if(centerId) {
        let unsortedMasters = centerMastersDict[centerId] || [];
        
        currentCenterMasters = unsortedMasters.sort((a, b) => {
            if (a.category === 'Raw Material' && b.category !== 'Raw Material') return -1;
            if (a.category !== 'Raw Material' && b.category === 'Raw Material') return 1;
            return parseInt(a.order) - parseInt(b.order);
        });
        
        window.currentCenterMasters = currentCenterMasters; 
        currentCenterAliases = centerAliasesDict[centerId] || {};
        
        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = "";
        
        const fragment = document.createDocumentFragment();
        currentCenterMasters.forEach(m => {
            fragment.appendChild(createRow(m.name, m.category, false));
        });
        tbody.appendChild(fragment);
        
        document.getElementById('results').classList.remove('hidden');
        document.getElementById('results').classList.add('flex');
        
        fetchPreviousClosing();
        window.calculateTotals();
        updateComplicationIndicator();
    }
    window.saveState();
}

async function fetchPreviousClosing() {
    const centerId = document.getElementById('centerSelect').value;
    const dateVal = document.getElementById('dateInput').value;
    if(!centerId || !dateVal) return;

    try {
        const res = await fetch(`/inventory/api/get-previous-closing/?center_id=${centerId}&date=${dateVal}`);
        const data = await res.json();
        
        if(data.status === 'success') {
            // 1. ABSOLUTE RESET: Wipe all carried values to 0 before applying new ones to prevent ghosting
            document.querySelectorAll('#tableBody tr').forEach(tr => {
                const carriedSpan = tr.querySelector('.val-carried');
                if (carriedSpan) carriedSpan.innerText = '0';
            });

            // 2. Alert the user if yesterday's report is missing
            if (data.exact_match === false) {
                showToast("Missing Previous Report", data.message, "warning");
            } 
            // 3. Inject the exact values
            else if (data.balances) {
                document.querySelectorAll('#tableBody tr').forEach(tr => {
                    const name = tr.getAttribute('data-item-name');
                    if(data.balances[name] !== undefined) {
                        tr.querySelector('.val-carried').innerText = data.balances[name];
                    }
                });
            }
            
            // 4. Force a recalculation to update the tallies and top cards
            window.calculateTotals();
        }
    } catch(e) { 
        console.error("Failed to fetch previous closing", e); 
    }
}

function createRow(name, cat, isUnresolved, vals = {op:0, inw:0, disp:0, clo:0}) {
    const tr = document.createElement('tr');
    tr.setAttribute('data-item-name', name.toUpperCase());
    tr.setAttribute('data-cat', cat);
    const uid = Date.now() + Math.random().toString().slice(2, 8); 
    tr.setAttribute('data-uid', uid);
    
    let themeClass = cat === 'Raw Material' ? "group bg-orange-50/60 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/40 border-b border-slate-100 dark:border-slate-700/50" : "group bg-emerald-50/60 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 border-b border-slate-100 dark:border-slate-700/50";
    if (isUnresolved) themeClass += " unresolved-row bg-red-50/30 dark:bg-red-900/10";
    tr.className = themeClass;

    const badgeClass = cat === 'Raw Material' ? "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400";
    const badgeText = cat === 'Raw Material' ? "RM" : "FG";

    tr.innerHTML = `
        <td class="px-2 py-2 align-top text-center border-r border-slate-200 dark:border-slate-800">
            <div class="pt-1.5 non-closing-ui">
                <span class="text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest badge-span ${badgeClass}">${badgeText}</span>
            </div>
            <div class="closing-only-ui flex justify-center items-center h-full pt-1.5">
                <select class="cat-select bg-transparent text-[9px] font-black uppercase outline-none rounded px-1 py-0.5 cursor-pointer appearance-none text-center ${cat === 'Raw Material' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'}">
                    <option value="Raw Material" ${cat === 'Raw Material' ? 'selected' : ''}>RM</option>
                    <option value="Finished Goods" ${cat === 'Finished Goods' ? 'selected' : ''}>FG</option>
                </select>
            </div>
        </td>
        
        <td class="px-2 py-2 align-top border-r border-slate-200 dark:border-slate-800">
            <div class="pt-1.5 flex items-center non-closing-ui">
                <span class="font-bold text-xs uppercase text-slate-800 dark:text-slate-200 plain-name-span">${name}</span>
                <i class="fa-solid fa-triangle-exclamation text-red-500 ml-2 unresolved-warning-icon ${isUnresolved ? '' : 'hidden'}"></i>
            </div>
            <div class="name-container closing-only-ui pt-0.5">
                <div contenteditable="true" class="item-name-cell text-sm font-black uppercase tracking-wide outline-none px-1 rounded ${isUnresolved ? 'text-red-600 dark:text-red-400 border-b border-dashed border-red-400' : 'text-slate-800 dark:text-slate-200 border-b border-transparent'}" data-original="${name}">${name}</div>
            </div>
        </td>

        <td class="col-opening px-2 py-2 align-top text-center text-sm font-mono font-bold text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10 val-carried pt-3.5 border-r border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 select-none transition-colors" ondblclick="copyToScanned(this, 'op')" title="Double click to copy">0</td>
        <td class="col-opening px-2 py-2 align-top border-r border-slate-200 dark:border-slate-800">
            <input type="text" inputmode="text" id="op-${uid}" value="${vals.op}" class="val-opening val-input w-full text-center bg-transparent border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded font-mono font-bold text-sm text-slate-800 dark:text-slate-200 outline-none p-1 transition-all duration-200" draggable="true">
        </td>
        
        <td class="col-opening px-1 py-2 align-top text-center pt-3.5 val-tally-opening relative group/tally cursor-help border-r border-slate-200 dark:border-slate-800">
            <i class="fa-solid fa-circle-notch text-slate-300 dark:text-slate-600"></i>
            <div class="tooltip-text absolute bottom-full right-0 mb-2 w-max min-w-[130px] px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold rounded-lg shadow-xl opacity-0 invisible group-hover/tally:opacity-100 group-hover/tally:visible transition-all z-50 border border-slate-200 dark:border-slate-600 pointer-events-none text-center whitespace-pre-line leading-tight"></div>
        </td>

        <td class="col-inward px-2 py-2 align-top border-r border-slate-200 dark:border-slate-800">
            <input type="text" inputmode="text" id="inw-${uid}" value="${vals.inw}" class="val-inward val-input w-full text-center bg-transparent border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded font-mono font-bold text-sm text-slate-800 dark:text-slate-200 outline-none p-1 transition-all duration-200" draggable="true">
        </td>

        <td class="col-dispatch px-2 py-2 align-top border-r border-slate-200 dark:border-slate-800">
            <input type="text" inputmode="text" id="disp-${uid}" value="${vals.disp}" class="val-dispatch val-input w-full text-center bg-transparent border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded font-mono font-bold text-sm text-slate-800 dark:text-slate-200 outline-none p-1 transition-all duration-200" draggable="true">
        </td>

        <td class="col-closing px-2 py-2 align-top text-center text-sm font-mono font-bold text-orange-700 dark:text-orange-400 bg-orange-50/50 dark:bg-orange-900/10 val-calc pt-3.5 border-r border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 select-none transition-colors" ondblclick="copyToScanned(this, 'clo')" title="Double click to copy">0</td>
        <td class="col-closing px-2 py-2 align-top border-r border-slate-200 dark:border-slate-800">
            <input type="text" inputmode="text" id="clo-${uid}" value="${vals.clo}" class="val-closing val-input w-full text-center bg-transparent border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded font-mono font-bold text-sm text-slate-800 dark:text-slate-200 outline-none p-1 transition-all duration-200" draggable="true">
        </td>
        
        <td class="col-closing px-1 py-2 align-top text-center pt-3.5 val-tally-closing relative group/tally cursor-help border-r border-slate-200 dark:border-slate-800">
            <i class="fa-solid fa-circle-notch text-slate-300 dark:text-slate-600"></i>
            <div class="tooltip-text absolute bottom-full right-0 mb-2 w-max min-w-[140px] px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold rounded-lg shadow-xl opacity-0 invisible group-hover/tally:opacity-100 group-hover/tally:visible transition-all z-50 border border-slate-200 dark:border-slate-600 pointer-events-none text-center whitespace-pre-line leading-tight"></div>
        </td>

        <td class="closing-only-ui px-1 py-2 text-center align-top pt-2">
            <button class="text-slate-400 hover:text-red-500 delete-btn p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700"><i class="fa-solid fa-trash-can"></i></button>
        </td>
    `;

    return tr;
}
// NEW: Copy to Scanned Function
window.copyToScanned = function(el, type) {
    const tr = el.closest('tr');
    const valText = el.innerText;
    const val = parseFloat(valText) || 0;
    
    if (type === 'op') {
        const input = tr.querySelector('.val-opening');
        input.value = val;
        if(typeof window.syncFV === 'function') window.syncFV(input, 'op');
    } else if (type === 'clo') {
        const input = tr.querySelector('.val-closing');
        input.value = val;
        if(typeof window.syncFV === 'function') window.syncFV(input, 'clo');
    }
    
    window.calculateTotals();
    window.saveState();
    
    // Tiny visual flash to confirm click
    el.style.opacity = '0.5';
    setTimeout(() => el.style.opacity = '1', 100);
};

window.aliasDropdownLogic = function() {
    return {
        open: false, search: '',
        get filteredMasters() {
            const masters = window.currentCenterMasters || [];
            if (!this.search) return masters;
            const q = this.search.toLowerCase();
            return masters.filter(m => m.name.toLowerCase().includes(q));
        },
        selectItem(m) {
            this.open = false;
            const sourceTr = this.$root.closest('tr');
            const cb = sourceTr.querySelector('.save-alias-cb');
            const shouldSaveAlias = cb && cb.checked;
            
            const mappedName = m.name.toUpperCase();
            const originalScanned = sourceTr.querySelector('.item-name-cell').getAttribute('data-original') || sourceTr.querySelector('.item-name-cell').innerText;

            const existingMasterRow = Array.from(document.querySelectorAll('#tableBody tr:not(.unresolved-row)')).find(r => r.getAttribute('data-item-name') === mappedName);

            if (existingMasterRow) {
                const sourceOp = parseFloat(sourceTr.querySelector('.val-opening').value) || 0;
                const sourceInw = parseFloat(sourceTr.querySelector('.val-inward').value) || 0;
                const sourceDisp = parseFloat(sourceTr.querySelector('.val-dispatch').value) || 0;
                const sourceClo = parseFloat(sourceTr.querySelector('.val-closing').value) || 0;

                existingMasterRow.querySelector('.val-opening').value = sourceOp + (parseFloat(existingMasterRow.querySelector('.val-opening').value) || 0);
                existingMasterRow.querySelector('.val-inward').value = sourceInw + (parseFloat(existingMasterRow.querySelector('.val-inward').value) || 0);
                existingMasterRow.querySelector('.val-dispatch').value = sourceDisp + (parseFloat(existingMasterRow.querySelector('.val-dispatch').value) || 0);
                existingMasterRow.querySelector('.val-closing').value = sourceClo + (parseFloat(existingMasterRow.querySelector('.val-closing').value) || 0);

                // Ensure the master row flags itself to save the alias
                if (shouldSaveAlias) {
                    existingMasterRow.setAttribute('data-save-alias', 'true');
                    existingMasterRow.querySelector('.item-name-cell').setAttribute('data-original', originalScanned.trim().toUpperCase());
                }
                
                sourceTr.remove();
            } else {
                sourceTr.setAttribute('data-save-alias', shouldSaveAlias ? 'true' : 'false');
                sourceTr.setAttribute('data-item-name', mappedName);
                sourceTr.querySelector('.item-name-cell').innerText = mappedName;
                sourceTr.querySelector('.plain-name-span').innerText = mappedName;
                sourceTr.querySelector('.item-name-cell').setAttribute('data-original', originalScanned.trim().toUpperCase());
                sourceTr.querySelector('.cat-select').value = m.category;
                window.revalidateRow(sourceTr); 
            }
            
            window.calculateTotals();
            updateComplicationIndicator();
            window.saveState();
        }
    };
};

function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.value);
    e.dataTransfer.setData('source-id', e.target.id);
    e.target.style.opacity = '0.5';
}
function handleDragEnd(e) { 
    if(e.target.classList.contains('val-input')) e.target.style.opacity = '1'; 
    clearInterval(window.dragScrollInterval);
    window.dragScrollInterval = null;
}
function handleDragOver(e) { 
    e.preventDefault(); 
    if(e.target.classList.contains('val-input')) e.target.classList.add('drag-over'); 
}
function handleDragLeave(e) { 
    if(e.target.classList.contains('val-input')) e.target.classList.remove('drag-over'); 
}
function handleDrop(e) {
    e.preventDefault();
    clearInterval(window.dragScrollInterval);
    window.dragScrollInterval = null;
    
    if(e.target.classList.contains('val-input')) {
        e.target.classList.remove('drag-over');
        const val = e.dataTransfer.getData('text/plain');
        const sourceId = e.dataTransfer.getData('source-id');
        
        e.target.value = val; 
        if(sourceId && sourceId !== e.target.id) {
            const sourceEl = document.getElementById(sourceId);
            if(sourceEl) sourceEl.value = 0; 
        }
        window.calculateTotals();
        window.saveState();
    }
}
window.calculateTotals = function calculateTotals() {
    let rmC = 0, fgC = 0, rmS = 0, fgS = 0;
    let totalErrors = 0;
    
    const alpineContainer = document.getElementById('ledger-app-container');
    const rows = document.getElementById('tableBody').rows;
    let unresolvedCount = 0;

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const cat = row.getAttribute('data-cat');
        if (row.classList.contains('unresolved-row')) unresolvedCount++;

        const op = parseFloat(String(row.querySelector('.val-opening').value).replace(/,/g, '')) || 0;
        const inw = parseFloat(String(row.querySelector('.val-inward').value).replace(/,/g, '')) || 0;
        const disp = parseFloat(String(row.querySelector('.val-dispatch').value).replace(/,/g, '')) || 0;
        const clo = parseFloat(String(row.querySelector('.val-closing').value).replace(/,/g, '')) || 0;
        const carried = parseFloat(String(row.querySelector('.val-carried').innerText).replace(/,/g, '')) || 0;

        const calc = Math.round((op + inw - disp) * 1000) / 1000;
        const calcEl = row.querySelector('.val-calc');
        if (calcEl && calcEl.innerText != calc) calcEl.innerText = calc;

        // CLOSING TALLY & TOOLTIP
        const tallyCloTd = row.querySelector('.val-tally-closing');
        const tallyCloIcon = tallyCloTd ? tallyCloTd.querySelector('i') : null;
        const tooltipClo = tallyCloTd ? tallyCloTd.querySelector('.tooltip-text') : null;
        let cloHasError = false;

        if (tooltipClo) {
            tooltipClo.innerText = `Calc: ${op} + ${inw} - ${disp} = ${calc}\nScanned: ${clo}`;
        }

        if (tallyCloIcon) {
            if (Math.trunc(calc) === Math.trunc(clo) && (op>0 || inw>0 || disp>0 || clo>0)) {
                if (tallyCloIcon.className !== "fa-solid fa-circle-check text-emerald-500 text-lg drop-shadow-sm") 
                    tallyCloIcon.className = "fa-solid fa-circle-check text-emerald-500 text-lg drop-shadow-sm";
            } else if (Math.trunc(calc) !== Math.trunc(clo) && (op>0 || inw>0 || disp>0 || clo>0)) {
                if (tallyCloIcon.className !== "fa-solid fa-circle-xmark text-red-500 text-lg cursor-help") 
                    tallyCloIcon.className = "fa-solid fa-circle-xmark text-red-500 text-lg cursor-help";
                cloHasError = true;
            } else {
                if (tallyCloIcon.className !== "fa-solid fa-circle-notch text-slate-300 dark:text-slate-600") 
                    tallyCloIcon.className = "fa-solid fa-circle-notch text-slate-300 dark:text-slate-600";
            }
        }

        // OPENING TALLY & TOOLTIP
        const tallyOpTd = row.querySelector('.val-tally-opening');
        const tallyOpIcon = tallyOpTd ? tallyOpTd.querySelector('i') : null;
        const tooltipOp = tallyOpTd ? tallyOpTd.querySelector('.tooltip-text') : null;
        let opHasError = false;

        if (tooltipOp) {
            tooltipOp.innerText = `Last Closing: ${carried}\nScanned: ${op}`;
        }

        if (tallyOpIcon) {
            if (Math.trunc(op) === Math.trunc(carried) && (op>0 || carried>0)) {
                if (tallyOpIcon.className !== "fa-solid fa-circle-check text-emerald-500 text-lg drop-shadow-sm") 
                    tallyOpIcon.className = "fa-solid fa-circle-check text-emerald-500 text-lg drop-shadow-sm";
            } else if (Math.trunc(op) !== Math.trunc(carried) && (op>0 || carried>0)) {
                if (tallyOpIcon.className !== "fa-solid fa-circle-xmark text-red-500 text-lg cursor-help") 
                    tallyOpIcon.className = "fa-solid fa-circle-xmark text-red-500 text-lg cursor-help";
                opHasError = true;
            } else {
                if (tallyOpIcon.className !== "fa-solid fa-circle-notch text-slate-300 dark:text-slate-600") 
                    tallyOpIcon.className = "fa-solid fa-circle-notch text-slate-300 dark:text-slate-600";
            }
        }
        
        if (cloHasError || opHasError) totalErrors++;

        // DYNAMIC TOTALS CALCULATION
        let calcVal = 0, scanVal = 0;
        if (window.currentActiveTab === 'opening') { calcVal = carried; scanVal = op; }
        else if (window.currentActiveTab === 'inward') { calcVal = 0; scanVal = inw; }
        else if (window.currentActiveTab === 'dispatch') { calcVal = 0; scanVal = disp; }
        else { calcVal = calc; scanVal = clo; }

        if (cat === 'Raw Material') { rmC += calcVal; rmS += scanVal; } 
        else { fgC += calcVal; fgS += scanVal; }
    }

    // UPDATE DYNAMIC CARDS UI
    const rmTitle = document.getElementById('card-title-rm');
    const fgTitle = document.getElementById('card-title-fg');
    if (rmTitle) rmTitle.innerHTML = `<i class="fa-solid fa-box-open mr-1"></i> RM ${window.currentActiveTab.toUpperCase()}`;
    if (fgTitle) fgTitle.innerHTML = `<i class="fa-solid fa-boxes-stacked mr-1"></i> FG ${window.currentActiveTab.toUpperCase()}`;
    
    const calcLabelRm = document.getElementById('label-calc-rm');
    const calcLabelFg = document.getElementById('label-calc-fg');
    if (calcLabelRm && calcLabelFg) {
        if (window.currentActiveTab === 'opening') {
            calcLabelRm.innerText = "Last Closing"; calcLabelFg.innerText = "Last Closing";
        } else if (window.currentActiveTab === 'closing') {
            calcLabelRm.innerText = "Calculated"; calcLabelFg.innerText = "Calculated";
        } else {
            calcLabelRm.innerText = "-"; calcLabelFg.innerText = "-";
        }
    }

    const eRawC = document.getElementById('totalRawCalc'); 
    if(eRawC) eRawC.innerHTML = (window.currentActiveTab === 'opening' || window.currentActiveTab === 'closing') ? Math.round(rmC).toLocaleString() : '<span class="opacity-30">-</span>';
    
    const eRawS = document.getElementById('totalRaw'); 
    if(eRawS) eRawS.innerText = Math.round(rmS).toLocaleString();
    
    const eFinC = document.getElementById('totalFinishedCalc'); 
    if(eFinC) eFinC.innerHTML = (window.currentActiveTab === 'opening' || window.currentActiveTab === 'closing') ? Math.round(fgC).toLocaleString() : '<span class="opacity-30">-</span>';
    
    const eFinS = document.getElementById('totalFinished'); 
    if(eFinS) eFinS.innerText = Math.round(fgS).toLocaleString();
    
    // STATUS CARD ENGINE
    const statusContent = document.getElementById('globalStatusContent');
    const statusCard = document.getElementById('globalStatusCard');
    if (statusCard && statusContent) {
        if (totalErrors === 0 && rows.length > 0) {
            statusCard.className = "bg-emerald-900 dark:bg-emerald-950 border border-emerald-800 dark:border-emerald-900 p-5 rounded-2xl shadow-md transition-all duration-300 flex flex-col justify-center relative overflow-hidden";
            statusContent.innerHTML = `<i class="fa-solid fa-check-double text-emerald-400 text-3xl"></i><span class="text-xl font-black text-white tracking-wide">All Tallied</span>`;
        } else if (totalErrors > 0) {
            statusCard.className = "bg-red-900 dark:bg-red-950 border border-red-800 dark:border-red-900 p-5 rounded-2xl shadow-md transition-all duration-300 flex flex-col justify-center relative overflow-hidden";
            statusContent.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-red-400 text-3xl"></i><div class="flex flex-col"><span class="text-xl font-black text-white tracking-wide leading-none">${totalErrors} Errors</span><span class="text-[10px] text-red-300 uppercase tracking-widest mt-1">Please Fix Rows</span></div>`;
        } else {
            statusCard.className = "bg-slate-900 dark:bg-slate-950 border border-slate-800 dark:border-slate-900 p-5 rounded-2xl shadow-md transition-all duration-300 flex flex-col justify-center relative overflow-hidden";
            statusContent.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin text-slate-400 text-2xl"></i><span class="text-lg font-bold text-slate-300">Calculating...</span>`;
        }
    }
    
    const lt = document.getElementById('liveTotals');
    if(lt) lt.classList.remove('hidden');

    if (alpineContainer && typeof Alpine !== 'undefined') {
        if (Alpine.$data(alpineContainer).unresolvedCount !== unresolvedCount) {
            Alpine.$data(alpineContainer).unresolvedCount = unresolvedCount;
        }
    }
};

window.applyBulkCategory = function(value) {
    if (!value) return;
    document.querySelectorAll('#tableBody tr').forEach(row => { 
        row.querySelector('.cat-select').value = value;
        row.setAttribute('data-cat', value);
        updateRowTheme(row, value); 
    });
    
    document.querySelector('th select').value = "";
    window.calculateTotals();
    window.saveState();
};

function cleanEmptyRows() {
    document.querySelectorAll('#tableBody tr').forEach(row => {
        const op = parseFloat(String(row.querySelector('.val-opening').value).replace(/,/g, '')) || 0;
        const inw = parseFloat(String(row.querySelector('.val-inward').value).replace(/,/g, '')) || 0;
        const disp = parseFloat(String(row.querySelector('.val-dispatch').value).replace(/,/g, '')) || 0;
        const clo = parseFloat(String(row.querySelector('.val-closing').value).replace(/,/g, '')) || 0;
        const carried = parseFloat(String(row.querySelector('.val-carried').innerText).replace(/,/g, '')) || 0;
        
        // EXPLICITLY PROTECT ROWS THAT ARE SAVING AN ALIAS SO IT DOESN'T GET WIPED
        const savedAttr = row.getAttribute('data-save-alias');
        
        if (op === 0 && inw === 0 && disp === 0 && clo === 0 && carried === 0 && !row.classList.contains('unresolved-row') && savedAttr !== 'true') {
            row.remove();
        }
    });
    window.calculateTotals();
    window.saveState();
}
    window.syncFV = function(el, field) {
    const uid = el.getAttribute('data-uid');
    const mainInput = document.getElementById(field + '-' + uid);
    if (mainInput) {
        mainInput.value = el.value;
        window.calculateTotals();

        const table = el.closest('table');
        let tOp=0, tInw=0, tDisp=0, tClo=0;
        table.querySelectorAll('tbody tr').forEach(tr => {
            tOp += parseFloat(tr.querySelector('.fv-op').value) || 0;
            tInw += parseFloat(tr.querySelector('.fv-inw').value) || 0;
            tDisp += parseFloat(tr.querySelector('.fv-disp').value) || 0;
            tClo += parseFloat(tr.querySelector('.fv-clo').value) || 0;
        });
        table.querySelector('.fv-tot-op').innerText = tOp;
        table.querySelector('.fv-tot-inw').innerText = tInw;
        table.querySelector('.fv-tot-disp').innerText = tDisp;
        table.querySelector('.fv-tot-clo').innerText = tClo;
    }
    window.saveState();
};

function buildFullSheet() {
    const tbody = document.getElementById('tableBody');
    let rmHTML = ''; let fgHTML = '';
    let rmCount = 1; let fgCount = 1;
    
    let rmOp=0, rmInw=0, rmDisp=0, rmClo=0;
    let fgOp=0, fgInw=0, fgDisp=0, fgClo=0;

    tbody.querySelectorAll('tr').forEach(tr => {
        const cat = tr.getAttribute('data-cat');
        const name = tr.querySelector('.item-name-cell').innerText;
        const uid = tr.getAttribute('data-uid');
        
        const op = parseFloat(tr.querySelector('.val-opening').value) || 0;
        const inw = parseFloat(tr.querySelector('.val-inward').value) || 0;
        const disp = parseFloat(tr.querySelector('.val-dispatch').value) || 0;
        const clo = parseFloat(tr.querySelector('.val-closing').value) || 0;
        const carried = parseFloat(tr.querySelector('.val-carried').innerText) || 0;

        if(op === 0 && inw === 0 && disp === 0 && clo === 0 && carried === 0 && !tr.classList.contains('unresolved-row')) return;

        if(cat === 'Raw Material') { rmOp+=op; rmInw+=inw; rmDisp+=disp; rmClo+=clo; }
        else { fgOp+=op; fgInw+=inw; fgDisp+=disp; fgClo+=clo; }

        const rowHtml = `
            <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <td class="p-2 text-center text-xs font-bold border-r border-slate-200 dark:border-slate-700">${cat === 'Raw Material' ? rmCount++ : fgCount++}</td>
                <td class="p-2 font-bold text-xs uppercase border-r border-slate-200 dark:border-slate-700">${name}</td>
                <td class="p-1 border-r border-slate-200 dark:border-slate-700"><input type="number" class="w-full text-center bg-transparent outline-none font-mono text-sm fv-op focus:ring-2 focus:ring-indigo-500 rounded" data-uid="${uid}" value="${op}" oninput="syncFV(this, 'op')"></td>
                <td class="p-1 border-r border-slate-200 dark:border-slate-700"><input type="number" class="w-full text-center bg-transparent outline-none font-mono text-sm fv-inw focus:ring-2 focus:ring-indigo-500 rounded" data-uid="${uid}" value="${inw}" oninput="syncFV(this, 'inw')"></td>
                <td class="p-1 border-r border-slate-200 dark:border-slate-700"><input type="number" class="w-full text-center bg-transparent outline-none font-mono text-sm fv-disp focus:ring-2 focus:ring-indigo-500 rounded" data-uid="${uid}" value="${disp}" oninput="syncFV(this, 'disp')"></td>
                <td class="p-1 border-r border-slate-200 dark:border-slate-700"><input type="number" class="w-full text-center bg-transparent outline-none font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400 fv-clo focus:ring-2 focus:ring-indigo-500 rounded" data-uid="${uid}" value="${clo}" oninput="syncFV(this, 'clo')"></td>
            </tr>
        `;
        if(cat === 'Raw Material') rmHTML += rowHtml; else fgHTML += rowHtml;
    });

    const selectEl = document.getElementById('centerSelect');
    const centerName = selectEl.options[selectEl.selectedIndex].text;
    
    const rawDate = document.getElementById('dateInput').value;
    const dateObj = new Date(rawDate);
    const formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    document.getElementById('fullSheetContent').innerHTML = `
        <div class="flex justify-between items-end border-b-2 border-slate-800 dark:border-slate-400 pb-2 mb-6">
            <h2 class="text-2xl font-black uppercase">${centerName}</h2>
            <div class="text-lg font-bold uppercase tracking-widest">DATE: ${formattedDate}</div>
        </div>
        <div class="grid grid-cols-1 gap-8">
            ${rmHTML ? `
            <div class="border border-slate-800 dark:border-slate-400 rounded-lg overflow-hidden shadow-sm">
                <h3 class="font-black text-sm text-center uppercase bg-slate-100 dark:bg-slate-700 py-2 border-b border-slate-800 dark:border-slate-400">Raw Material</h3>
                <table class="w-full text-left">
                    <thead class="bg-slate-50 dark:bg-slate-900/50 text-[10px] uppercase font-black tracking-widest border-b border-slate-800 dark:border-slate-400">
                        <tr><th class="p-2 text-center border-r border-slate-800 dark:border-slate-400 w-10">Sr</th><th class="p-2 border-r border-slate-800 dark:border-slate-400 w-1/3">Item Name</th><th class="p-2 text-center border-r border-slate-800 dark:border-slate-400">Opening</th><th class="p-2 text-center border-r border-slate-800 dark:border-slate-400">Inward / Prod</th><th class="p-2 text-center border-r border-slate-800 dark:border-slate-400">Dispatch</th><th class="p-2 text-center border-r border-slate-800 dark:border-slate-400">Closing</th></tr>
                    </thead>
                    <tbody>${rmHTML}</tbody>
                    <tfoot>
                        <tr class="bg-slate-100 dark:bg-slate-700 text-[11px] font-black uppercase">
                            <td colspan="2" class="p-2 text-right border-r border-slate-300 dark:border-slate-600">Total</td>
                            <td class="p-2 text-center border-r border-slate-300 dark:border-slate-600 fv-tot-op">${rmOp}</td>
                            <td class="p-2 text-center border-r border-slate-300 dark:border-slate-600 fv-tot-inw">${rmInw}</td>
                            <td class="p-2 text-center border-r border-slate-300 dark:border-slate-600 fv-tot-disp">${rmDisp}</td>
                            <td class="p-2 text-center border-r border-slate-300 dark:border-slate-600 fv-tot-clo text-indigo-600 dark:text-indigo-400">${rmClo}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>` : ''}
            
            ${fgHTML ? `
            <div class="border border-slate-800 dark:border-slate-400 rounded-lg overflow-hidden shadow-sm">
                <h3 class="font-black text-sm text-center uppercase bg-slate-100 dark:bg-slate-700 py-2 border-b border-slate-800 dark:border-slate-400">Finished Goods</h3>
                <table class="w-full text-left">
                    <thead class="bg-slate-50 dark:bg-slate-900/50 text-[10px] uppercase font-black tracking-widest border-b border-slate-800 dark:border-slate-400">
                        <tr><th class="p-2 text-center border-r border-slate-800 dark:border-slate-400 w-10">Sr</th><th class="p-2 border-r border-slate-800 dark:border-slate-400 w-1/3">Item Name</th><th class="p-2 text-center border-r border-slate-800 dark:border-slate-400">Opening</th><th class="p-2 text-center border-r border-slate-800 dark:border-slate-400">Production</th><th class="p-2 text-center border-r border-slate-800 dark:border-slate-400">Dispatch</th><th class="p-2 text-center border-r border-slate-800 dark:border-slate-400">Closing</th></tr>
                    </thead>
                    <tbody>${fgHTML}</tbody>
                    <tfoot>
                        <tr class="bg-slate-100 dark:bg-slate-700 text-[11px] font-black uppercase">
                            <td colspan="2" class="p-2 text-right border-r border-slate-300 dark:border-slate-600">Total</td>
                            <td class="p-2 text-center border-r border-slate-300 dark:border-slate-600 fv-tot-op">${fgOp}</td>
                            <td class="p-2 text-center border-r border-slate-300 dark:border-slate-600 fv-tot-inw">${fgInw}</td>
                            <td class="p-2 text-center border-r border-slate-300 dark:border-slate-600 fv-tot-disp">${fgDisp}</td>
                            <td class="p-2 text-center border-r border-slate-300 dark:border-slate-600 fv-tot-clo text-indigo-600 dark:text-indigo-400">${fgClo}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>` : ''}
        </div>
    `;
}

function updateAuditLogUI() {
    const list = document.getElementById('auditLogList');
    if (!list) return;
    if (extractionAuditLog.length === 0) list.innerHTML = `<li class="italic text-slate-500">No auto-corrections made.</li>`;
    else list.innerHTML = extractionAuditLog.map(log => `<li>${log}</li>`).join('');
}
window.revalidateRow = function revalidateRow(tr) {
    const nameCell = tr.querySelector('.item-name-cell');
    const plainSpan = tr.querySelector('.plain-name-span');
    
    // SAFETY CHECK: Prevents the null innerText crash
    if (nameCell) {
        nameCell.innerText = nameCell.innerText.trim().toUpperCase();
        if (plainSpan) plainSpan.innerText = nameCell.innerText;
    }
    
    const currentName = nameCell ? nameCell.innerText.toLowerCase() : '';
    const catSelect = tr.querySelector('.cat-select');
    const originalName = nameCell ? (nameCell.getAttribute('data-original') || nameCell.innerText) : '';
    const masterNamesLower = currentCenterMasters.map(m => m.name.toLowerCase());
    
    let isUnresolved = true;
    let targetCategory = catSelect ? catSelect.value : 'Finished Goods';

    if (masterNamesLower.includes(currentName)) {
        isUnresolved = false;
        targetCategory = currentCenterMasters.find(m => m.name.toLowerCase() === currentName).category;
    } else if (currentCenterAliases[currentName]) {
        isUnresolved = false;
        let mappedName = currentCenterAliases[currentName];
        let m = currentCenterMasters.find(m => m.name === mappedName);
        if(m) targetCategory = m.category;
    }

    const existingPanel = tr.querySelector('.alias-control-panel');
    if (existingPanel) existingPanel.remove();

    if (isUnresolved) {
        tr.classList.add('unresolved-row', 'bg-red-50/30', 'dark:bg-red-900/10');
        
        if (currentCenterMasters.length > 0) {
            const dropdownHTML = `
            <div class="mt-1.5 alias-control-panel flex flex-col gap-1.5 pt-1 border-t border-red-200 dark:border-red-800 closing-only-ui"
                 x-data="aliasDropdownLogic()" @click.away="open = false">
                <div class="flex items-center gap-2 relative">
                    <i class="fa-solid fa-link text-red-400 text-[10px]"></i>
                    <div class="relative flex-1">
                        <input type="text" x-model="search" @focus="open = true" @keydown.enter.prevent="if(filteredMasters.length > 0) selectItem(filteredMasters[0])" placeholder="Search template item..." class="w-full text-[10px] text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-800 rounded px-2 py-1.5 outline-none shadow-sm focus:ring-1 focus:ring-red-400 font-bold uppercase transition-all placeholder:normal-case">
                        <div x-show="open" class="absolute z-[100] w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl max-h-48 overflow-y-auto custom-scrollbar top-full left-0" x-cloak>
                            <template x-for="(m, i) in filteredMasters" :key="m.name">
                                <div @click="selectItem(m)" class="px-3 py-2 text-[10px] cursor-pointer text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700/50 font-bold uppercase hover:bg-slate-50 dark:hover:bg-slate-700/50 flex justify-between items-center">
                                    <span x-text="m.name"></span>
                                    <span class="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider shrink-0 shadow-sm" :class="m.category === 'Raw Material' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'" x-text="m.category === 'Raw Material' ? 'RM' : 'FG'"></span>
                                </div>
                            </template>
                        </div>
                    </div>
                </div>
                <label class="flex items-center gap-1.5 text-[9px] text-slate-500 dark:text-slate-400 ml-4 cursor-pointer mt-0.5">
                    <input type="checkbox" class="save-alias-cb rounded text-indigo-500 border-slate-300" checked> 
                    Save permanent alias
                </label>
            </div>`;
            const nameContainer = tr.querySelector('.name-container');
            if (nameContainer) nameContainer.insertAdjacentHTML('beforeend', dropdownHTML);
        }
    } else {
        tr.classList.remove('unresolved-row', 'bg-red-50/30', 'dark:bg-red-900/10');
        if (catSelect) catSelect.value = targetCategory;
        tr.setAttribute('data-cat', targetCategory);
        tr.setAttribute('data-item-name', currentName.toUpperCase());
    }

    updateRowTheme(tr, targetCategory);
    updateComplicationIndicator();
}

function updateRowTheme(tr, category) {
    tr.classList.remove('bg-orange-50/60', 'hover:bg-orange-100', 'dark:bg-orange-900/20', 'dark:hover:bg-orange-900/40');
    tr.classList.remove('bg-emerald-50/60', 'hover:bg-emerald-100', 'dark:bg-emerald-900/20', 'dark:hover:bg-emerald-900/40');

    const isUnresolved = tr.classList.contains('unresolved-row');
    const nameCell = tr.querySelector('.name-container');
    const nameText = tr.querySelector('.item-name-cell');
    const select = tr.querySelector('.cat-select');
    const badgeSpan = tr.querySelector('.badge-span');
    const warningIcon = tr.querySelector('.unresolved-warning-icon');

    if (category === 'Raw Material') {
        tr.classList.add('bg-orange-50/60', 'hover:bg-orange-100', 'dark:bg-orange-900/20', 'dark:hover:bg-orange-900/40');
        if(select) select.className = "cat-select bg-transparent text-[9px] font-black uppercase outline-none rounded px-1 py-0.5 cursor-pointer appearance-none text-center bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400";
        if(badgeSpan) { badgeSpan.className = "text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest badge-span bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400"; badgeSpan.innerText = "RM"; }
    } else {
        tr.classList.add('bg-emerald-50/60', 'hover:bg-emerald-100', 'dark:bg-emerald-900/20', 'dark:hover:bg-emerald-900/40');
        if(select) select.className = "cat-select bg-transparent text-[9px] font-black uppercase outline-none rounded px-1 py-0.5 cursor-pointer appearance-none text-center bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400";
        if(badgeSpan) { badgeSpan.className = "text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest badge-span bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"; badgeSpan.innerText = "FG"; }
    }

    if (isUnresolved) {
        if(nameCell) nameCell.className = "name-container flex flex-col closing-only-ui pt-0.5";
        if(nameText) {
            nameText.className = "item-name-cell text-sm font-black uppercase tracking-wide outline-none px-1 text-red-600 dark:text-red-400 border-b border-dashed border-red-400 w-max";
            nameText.setAttribute("contenteditable", "true");
        }
        if(warningIcon) warningIcon.classList.remove('hidden');
    } else {
        if(nameCell) nameCell.className = "name-container flex flex-col text-slate-800 dark:text-slate-200 closing-only-ui pt-0.5";
        if(nameText) {
            nameText.className = "item-name-cell text-sm font-black uppercase tracking-wide outline-none px-1 text-slate-800 dark:text-slate-200 border-b border-transparent";
            nameText.setAttribute("contenteditable", "true"); 
        }
        if(warningIcon) warningIcon.classList.add('hidden');
    }
}

function updateComplicationIndicator() {
    let unresolvedCount = document.querySelectorAll('#tableBody tr.unresolved-row').length;
    let tableBody = document.getElementById('tableBody');
    let hasRows = tableBody.children.length > 0;
    const badge = document.getElementById('complicationBadge');

    const alpineContainer = document.getElementById('ledger-app-container');
    if (typeof Alpine !== 'undefined' && alpineContainer) {
        Alpine.$data(alpineContainer).unresolvedCount = unresolvedCount;
    }

    if (!hasRows) {
        badge.innerHTML = `
            <div class="bg-slate-50 dark:bg-[#05080f] border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 px-4 py-3 rounded-sm text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-inner w-full">
                <i class="fa-solid fa-circle-info text-sm"></i>
                <span>Awaiting Extraction</span>
            </div>`;
        return;
    }

    if (unresolvedCount > 0) {
        badge.innerHTML = `
            <div onclick="scrollToFirstUnresolved()" class="bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-sm font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-colors w-full">
                <i class="fa-solid fa-triangle-exclamation text-sm"></i>
                <span>${unresolvedCount} Unresolved (Click to Fix)</span>
            </div>`;
    } else {
        badge.innerHTML = `
            <div class="bg-slate-50 dark:bg-[#05080f] border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 px-4 py-3 rounded-sm font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-inner w-full">
                <i class="fa-solid fa-circle-check text-emerald-500 text-sm"></i>
                <span>All Items Mapped</span>
            </div>`;
    }
}

function scrollToFirstUnresolved() {
    const firstRedRow = document.querySelector('.unresolved-row');
    if (firstRedRow) {
        const alpineContainer = document.getElementById('ledger-app-container');
        if (alpineContainer && typeof Alpine !== 'undefined') {
            Alpine.$data(alpineContainer).activeTab = 'closing';
            window.currentActiveTab = 'closing';
            window.calculateTotals();
        }
        setTimeout(() => {
            firstRedRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const n = firstRedRow.querySelector('.name-container');
            if(n) {
                n.classList.add('ring-4', 'ring-red-500', 'rounded');
                setTimeout(() => n.classList.remove('ring-4', 'ring-red-500', 'rounded'), 1000);
            }
        }, 50);
    }
}

window.addRow = function() {
    const tbody = document.getElementById('tableBody');
    const newRow = createRow("NEW ITEM", "Raw Material", true);
    tbody.prepend(newRow);
    window.revalidateRow(newRow);
    window.calculateTotals();
    window.saveState();
};

function showToast(title, msg, type = 'info') {
    const toast = document.getElementById('toast');
    toast.firstElementChild.className = "px-5 py-4 rounded-xl shadow-2xl flex items-start gap-4 min-w-[320px] max-w-sm border-l-4 text-white ring-1 ring-white/10 " + (type==='success'?'bg-slate-900 border-emerald-500':type==='error'?'bg-slate-900 border-red-500':'bg-slate-900 border-amber-500');
    document.getElementById('toast-title').innerText = title; document.getElementById('toast-msg').innerText = msg;
    toast.classList.remove('hidden'); 
    setTimeout(() => toast.classList.remove('translate-y-full', 'opacity-0'), 10);
    setTimeout(() => { toast.classList.add('translate-y-full', 'opacity-0'); setTimeout(() => toast.classList.add('hidden'), 300); }, 6000);
}

async function checkUploadStatus() {
    const dateVal = document.getElementById('dateInput').value;
    if(!dateVal) return;
    try {
        const response = await fetch(`/inventory/api/check-uploads/?date=${dateVal}`);
        const data = await response.json();
        window.uploadedCenterIds = data.ids || [];
        window.supervisorCenterIds = data.supervisor_ids || [];
        window.supervisorSheets = data.supervisor_sheets || {};
        window.dispatchEvent(new CustomEvent('uploads-checked'));
        
        document.querySelectorAll('#centerSelect option').forEach(opt => {
            opt.style.backgroundColor = ""; opt.style.color = "";
            if (window.uploadedCenterIds.includes(parseInt(opt.value))) {
                opt.style.backgroundColor = document.documentElement.classList.contains('dark') ? "#064e3b" : "#dcfce7"; 
                opt.style.color = document.documentElement.classList.contains('dark') ? "#34d399" : "#166534"; 
            }
        });
    } catch(e) {
        console.error("Check Uploads Error: ", e);
    }
}

async function maybeLoadSupervisorSheet(centerId) {
    if (!centerId) return;
    const sheetData = window.supervisorSheets && window.supervisorSheets[centerId];
    if (sheetData && sheetData.image_url) {
        try {
            const resp = await fetch(sheetData.image_url);
            const blob = await resp.blob();
            const file = new File([blob], `supervisor_${centerId}.jpg`, { type: blob.type });
            await processFile(file);
            
            const badge = document.getElementById('supervisorBadge');
            const timeSpan = badge.querySelector('span[data-supervisor-time]');
            if(sheetData.uploaded_at) {
                const date = new Date(sheetData.uploaded_at);
                const timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                timeSpan.textContent = ` • ${timeStr}`;
            } else {
                timeSpan.textContent = '';
            }
            
            // Check for review flag
            if (sheetData.is_review) {
                badge.classList.remove('bg-amber-50', 'dark:bg-amber-900/20', 'text-amber-800', 'dark:text-amber-300', 'border-amber-200', 'dark:border-amber-800');
                badge.classList.add('bg-rose-50', 'dark:bg-rose-900/20', 'text-rose-800', 'dark:text-rose-300', 'border-rose-200', 'dark:border-rose-800');
                badge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i><span>Review Document: Supervisor Re-upload<span data-supervisor-time>${timeSpan.textContent}</span></span>`;
            } else {
                badge.classList.remove('bg-rose-50', 'dark:bg-rose-900/20', 'text-rose-800', 'dark:text-rose-300', 'border-rose-200', 'dark:border-rose-800');
                badge.classList.add('bg-amber-50', 'dark:bg-amber-900/20', 'text-amber-800', 'dark:text-amber-300', 'border-amber-200', 'dark:border-amber-800');
                badge.innerHTML = `<i class="fa-solid fa-image"></i><span>Uploaded by Supervisor<span data-supervisor-time>${timeSpan.textContent}</span></span>`;
            }

            badge.classList.remove('hidden');

            const alpineContainer = document.getElementById('ledger-app-container');
            if (alpineContainer && typeof Alpine !== 'undefined') {
                const alpineData = Alpine.$data(alpineContainer);
                alpineData.activeTab = 'closing';
                window.currentActiveTab = 'closing';
                // Trigger auto-analysis if it's not a review
                if (!sheetData.is_review) {
                    runAnalysis();
                } else {
                   // Calculate totals to display the already saved numbers
                   setTimeout(() => {
                       window.calculateTotals();
                   }, 500);
                }
            }
            showToast("Supervisor Sheet", "Loaded file from supervisor.", "info");
        } catch (e) {
            console.error("Failed to fetch supervisor sheet:", e);
        }
    } else {
        document.getElementById('supervisorBadge').classList.add('hidden');
    }
}

async function attachPreviousReport() {
    const centerId = document.getElementById('centerSelect').value;
    const dateVal = document.getElementById('dateInput').value;

    if (!centerId || !dateVal) return showToast("Missing Info", "Please select a Center and Date first.", "warning");

    const isConfirmed = await AppModal.confirm(
        "Attach Previous Report", 
        "Are you sure you want to duplicate the previous day's report for this date?",
        { confirmText: "Yes, Duplicate", confirmColor: "bg-indigo-600 hover:bg-indigo-700" }
    );
    
    if (!isConfirmed) return;

    try {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
        const res = await fetch('/inventory/api/attach-previous/', {
            method: 'POST',
            headers: { 'X-CSRFToken': csrfToken, 'Content-Type': 'application/json' },
            body: JSON.stringify({ center_id: centerId, date: dateVal })
        });
        
        const data = await res.json();
        if (data.status === 'success') {
            showToast("Carried Over!", data.message, "success");
            setTimeout(() => window.location.reload(), 1000);
        } else {
            showToast("Failed", data.message, "error");
        }
    } catch (e) {
        showToast("Network Error", e.message, "error");
    }
}

async function loadFileIntoPreview(file) {
    if (!file) return;
    currentFileObj = file;
    document.getElementById('placeholder-content').classList.add('hidden');
    document.getElementById('zoomToggleBtn').classList.remove('hidden');
    document.getElementById('zoomToggleBtn').classList.add('flex');
    const pdfC = document.getElementById('pdfCanvasContainer');
    const pImg = document.getElementById('previewImg');
    pdfC.innerHTML = '';
    pdfC.classList.add('hidden');
    pImg.classList.add('hidden');
    const fileUrl = URL.createObjectURL(file);
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = async function(event) {
            currentBase64 = event.target.result.split(',')[1];
            currentMime = file.type;
            if (file.type === 'application/pdf') {
                pdfC.classList.remove('hidden');
                pdfC.classList.add('flex');
                try {
                    const pdf = await pdfjsLib.getDocument(fileUrl).promise;
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const canvas = document.createElement('canvas');
                        canvas.className = 'mb-4 shadow-sm rounded border border-slate-200 dark:border-slate-700 max-w-full bg-white dark:bg-slate-800 block';
                        const vp = (await pdf.getPage(i)).getViewport({ scale: 1.5 });
                        canvas.height = vp.height;
                        canvas.width = vp.width;
                        pdfC.appendChild(canvas);
                        await (await pdf.getPage(i)).render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
                    }
                } catch(err) {
                    console.error("PDF Render Error:", err);
                    pdfC.innerHTML = `<div class="text-red-500 font-bold p-4 flex flex-col items-center"><i class="fa-solid fa-triangle-exclamation text-3xl mb-2"></i> Error loading PDF: ${err.message}</div>`;
                }
            } else {
                pImg.src = event.target.result;
                pImg.classList.remove('hidden');
            }
            resolve();
        };
        reader.readAsDataURL(file);
    });
}

async function handleFileSelectBase(e) {
    const file = e.target.files[0];
    if (!file) return;
    window.isSupervisorPreload = false;
    hideSupervisorBadge();
    await loadFileIntoPreview(file);
}

async function maybeLoadSupervisorSheet(centerId) {
    if (window.uploadedCenterIds && window.uploadedCenterIds.includes(parseInt(centerId))) {
        window.isSupervisorPreload = false;
        hideSupervisorBadge();
        return;
    }
    const dateVal = document.getElementById('dateInput').value;
    const sheet = (window.supervisorSheets || {})[centerId];
    if (!sheet || !sheet.image_url || !dateVal) {
        window.isSupervisorPreload = false;
        hideSupervisorBadge();
        return;
    }
    try {
        const res = await fetch(sheet.image_url);
        if (!res.ok) throw new Error("HTTP " + res.status);
        const blob = await res.blob();
        const urlPath = sheet.image_url.split('?')[0];
        const name = urlPath.substring(urlPath.lastIndexOf('/') + 1) || 'supervisor-upload';
        const file = new File([blob], name, { type: blob.type || 'image/jpeg' });
        window.isSupervisorPreload = true;
        showSupervisorBadge(sheet.uploaded_at);
        await loadFileIntoPreview(file);
    } catch(err) {
        console.error("Supervisor pre-load failed:", err);
        window.isSupervisorPreload = false;
        hideSupervisorBadge();
    }
}

function showSupervisorBadge(uploadedAtIso) {
    const badge = document.getElementById('supervisorBadge');
    if (!badge) return;
    let timeStr = '';
    if (uploadedAtIso) {
        try {
            const d = new Date(uploadedAtIso);
            timeStr = ' \u00b7 ' + d.toLocaleString();
        } catch(e) {}
    }
    const timeEl = badge.querySelector('[data-supervisor-time]');
    if (timeEl) timeEl.textContent = timeStr;
    badge.classList.remove('hidden');
}

function hideSupervisorBadge() {
    const badge = document.getElementById('supervisorBadge');
    if (badge) badge.classList.add('hidden');
}

document.getElementById('fileInput').addEventListener('change', handleFileSelectBase);
document.getElementById('fileInputLarge').addEventListener('change', handleFileSelectBase);

// --- HOVER TO ZOOM ENGINE (DEEPER ZOOM) ---
window.isZoomActive = false;
window.toggleZoom = function() {
    window.isZoomActive = !window.isZoomActive;
    const btn = document.getElementById('zoomToggleBtn');
    const container = document.getElementById('previewContainer');
    
    if (window.isZoomActive) {
        btn.innerHTML = `<i class="fa-solid fa-magnifying-glass-minus text-lg"></i>`;
        btn.classList.add('border-emerald-300', 'dark:border-emerald-600', 'text-emerald-500', 'bg-emerald-50', 'dark:bg-emerald-950');
        btn.classList.remove('text-slate-500', 'bg-white', 'dark:bg-slate-800');
        container.style.cursor = 'crosshair';
        
        container.classList.add('overflow-hidden');
        container.classList.remove('overflow-y-auto', 'overflow-x-auto');
        container.classList.remove('items-center', 'justify-center');
        container.classList.add('items-start', 'justify-start');
        
        document.querySelectorAll('#previewImg').forEach(el => {
            el.classList.remove('max-w-full', 'max-h-full', 'object-contain');
            el.classList.add('w-full');
            el.style.width = '100%';
            el.style.maxWidth = 'none';
            el.style.height = 'auto';
            el.style.transformOrigin = '0 0';
            
            const rect = container.getBoundingClientRect();
            const scale = 1.75;
            const docX = (0.5) * el.offsetWidth;
            const docY = (0.5) * el.offsetHeight;
            const tx = (rect.width/2) - docX * scale;
            const ty = (rect.height/2) - docY * scale;
            el.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
        });
        document.querySelectorAll('#pdfCanvasContainer').forEach(el => {
            el.classList.remove('w-full', 'items-center');
            el.classList.add('items-start', 'w-full');
            el.style.width = '100%';
            el.style.transformOrigin = '0 0';
            el.querySelectorAll('canvas').forEach(c => {
                c.style.width = '100%';
                c.style.maxWidth = 'none';
                c.style.height = 'auto';
            });
            
            const rect = container.getBoundingClientRect();
            const scale = 1.75;
            const docX = (0.5) * el.offsetWidth;
            const docY = (0.5) * el.offsetHeight;
            const tx = (rect.width/2) - docX * scale;
            const ty = (rect.height/2) - docY * scale;
            el.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
        });
    } else {
        window.currentDocScale = 1;
        btn.innerHTML = `<i class="fa-solid fa-magnifying-glass text-lg"></i>`;
        btn.classList.add('text-slate-500', 'bg-white', 'dark:bg-slate-800');
        btn.classList.remove('border-emerald-300', 'dark:border-emerald-600', 'text-emerald-500', 'bg-emerald-50', 'dark:bg-emerald-950');
        container.style.cursor = 'default';
        
        container.classList.remove('overflow-hidden');
        container.classList.add('overflow-y-auto', 'overflow-x-auto');
        container.classList.add('items-center', 'justify-center');
        container.classList.remove('items-start', 'justify-start');
        
        document.querySelectorAll('#previewImg').forEach(el => {
            el.classList.add('max-w-full', 'max-h-full', 'object-contain');
            el.classList.remove('w-full');
            el.style.width = '';
            el.style.maxWidth = '';
            el.style.height = '';
            el.style.transform = '';
            el.style.transformOrigin = '';
        });
        document.querySelectorAll('#pdfCanvasContainer').forEach(el => {
            el.classList.add('w-full', 'items-center');
            el.classList.remove('items-start');
            el.style.width = '';
            el.style.transform = '';
            el.style.transformOrigin = '';
            el.querySelectorAll('canvas').forEach(c => {
                c.style.width = '';
                c.style.maxWidth = '';
                c.style.height = '';
            });
        });
    }
};

const delay = ms => new Promise(res => setTimeout(res, ms));


async function runAnalysis() {
    const centerSelect = document.getElementById('centerSelect');
    const centerId = centerSelect.value;
    const centerName = centerSelect.options[centerSelect.selectedIndex]?.text || "Center";

    if (!centerId) return showToast("Missing Info", "Please select a Center.", "warning");
    if (!currentBase64) return showToast("No File", "Upload a document.", "error");
    
    const btn = document.getElementById('analyzeBtn'); const status = document.getElementById('status');
    
    btn.disabled = true; 
    btn.innerHTML = `<i class="fa-solid fa-rotate-right fa-spin text-emerald-400"></i> Extracting...`;
    status.classList.remove('hidden');

    const loadSteps = [
        "Scanning Document Layout...",
        "Reading values from sheet...",
        `Verifying item names for ${centerName}...`,
        "Comparing the opening...",
        "Calculating the closing...",
        "Finalising the values",
        "Almost there!"
    ];
    let stepIdx = 0;
    status.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin text-indigo-500"></i> ${loadSteps[stepIdx]}`;
    
    const loaderInterval = setInterval(() => {
        if(stepIdx < loadSteps.length - 1) {
            stepIdx++;
            status.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin text-indigo-500"></i> ${loadSteps[stepIdx]}`;
        }
    }, 5000); 

    const allowedNames = currentCenterMasters.map(m => m.name).join(", ");
    const promptText = `
        Analyze this inventory document as a STRICT TRANSCRIBER.
        GLOSSARY OF KNOWN ITEMS: [${allowedNames}].
        
        1. Find the DATE (DATE_FOUND: YYYY-MM-DD).
        2. Extract items row by row EXACTLY AS WRITTEN on the paper. 
           - Some sheets might have multiple rows for the same item.If the name is exactly the same, sum them up into one line.
           - If categories aren't explicitly written, assume the upper section is 'Raw Material' and the lower section is 'Finished Goods', guided primarily by the GLOSSARY.
           - Ignore completely blank lines without numbers.
           - Extract all 4 columns: Opening, Inward/Production, Dispatch, Closing. If a column is missing or blank, output 0.
        3. Return EXACTLY in this format:
        DATE_FOUND: YYYY-MM-DD
        CSV_START
        Category,Item Name,Opening,Inward,Dispatch,Closing
    `;

    let extractedText = "";

    try {
        const csrftoken = (document.cookie.match(/csrftoken=([^;]+)/) || [])[1] || (document.querySelector('[name=csrfmiddlewaretoken]') || {}).value || '';
        const response = await fetch('/inventory/api/analyze-sheet/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
            body: JSON.stringify({ mime_type: currentMime, data: currentBase64 })
        });
        const data = await response.json();
        if (!response.ok || (data && data.error)) throw new Error((data && data.error) || `Server error ${response.status}`);
        extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (!extractedText) throw new Error("Empty response from server");
        
        const dateMatch = extractedText.match(/DATE_FOUND: (\d{4}-\d{2}-\d{2})/);
        if(dateMatch && dateMatch[1] !== document.getElementById('dateInput').value) {
            showToast("Date Warning", `Sheet says ${dateMatch[1]}`, "warning");
        }
        
        extractedText = extractedText.replace(/DATE_FOUND: .*/g, "").replace(/```csv/g, "").replace(/```/g, "").trim();
        parseCSV(extractedText);

        status.innerHTML = '<i class="fa-solid fa-check text-emerald-500"></i> Done';
        
        const alpineContainer = document.getElementById('ledger-app-container');
        if (alpineContainer && typeof Alpine !== 'undefined') {
            Alpine.$data(alpineContainer).activeTab = 'closing';
            window.currentActiveTab = 'closing';
            window.calculateTotals();
        }
        
    } catch (error) {
        console.error(error);
        showToast("Extraction Failed", error.message, "error");
        status.innerHTML = '<i class="fa-solid fa-circle-xmark text-red-500"></i> Failed';
    } finally {
        clearInterval(loaderInterval);
        btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Extract Data via AI`;
    }
}

function parseCSV(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    extractionAuditLog = []; 
    const masterNamesLower = currentCenterMasters.map(m => m.name.toLowerCase());
    
    let readingCSV = false;
    let lastMatchedRow = null;

    lines.forEach(line => {
        if (line.includes("CSV_START")) { readingCSV = true; return; }
        if (!readingCSV || !line.includes(",")) return; 
        
        const cols = line.split(',');
        if (cols.length >= 5 && cols[0] !== 'Category') { 
            let rawCat = cols[0].trim(); 
            let matName = cols[1].trim().toUpperCase(); 
            let op = parseFloat(cols[2]) || 0;
            let inw = parseFloat(cols[3]) || 0;
            let disp = parseFloat(cols[4]) || 0;
            let clo = parseFloat(cols[5]) || 0;

            let isFinished = rawCat.toLowerCase().includes('finish') || rawCat.toLowerCase().includes('goods');
            let categoryStr = isFinished ? "Finished Goods" : "Raw Material";
            let lowerName = matName.toLowerCase();
            let finalName = matName;
            let isUnresolved = true;

            if (masterNamesLower.includes(lowerName)) {
                let m = currentCenterMasters.find(m => m.name.toLowerCase() === lowerName);
                finalName = m.name; categoryStr = m.category; isUnresolved = false;
            } else if (currentCenterAliases[lowerName]) {
                finalName = currentCenterAliases[lowerName];
                let m = currentCenterMasters.find(m => m.name === finalName);
                if(m) categoryStr = m.category; 
                isUnresolved = false;
                extractionAuditLog.push(`Mapped <b>"${matName}"</b> ➔ <b>${finalName}</b>`);
            }

            if (isUnresolved) categoryStr = "Finished Goods";

            let existingRow = null;
            document.querySelectorAll('#tableBody tr').forEach(tr => {
                if (tr.getAttribute('data-item-name') === finalName && !tr.classList.contains('unresolved-row')) {
                    existingRow = tr;
                }
            });

            if (existingRow && !isUnresolved) {
                existingRow.querySelector('.val-opening').value = op;
                existingRow.querySelector('.val-inward').value = inw;
                existingRow.querySelector('.val-dispatch').value = disp;
                existingRow.querySelector('.val-closing').value = clo;
                lastMatchedRow = existingRow;
            } else {
                const tbody = document.getElementById('tableBody');
                const newRow = createRow(finalName, categoryStr, isUnresolved, {op, inw, disp, clo});
                
                if (lastMatchedRow && lastMatchedRow.nextSibling) {
                    tbody.insertBefore(newRow, lastMatchedRow.nextSibling);
                } else if (lastMatchedRow) {
                    tbody.appendChild(newRow);
                } else {
                    tbody.prepend(newRow);
                }

                lastMatchedRow = newRow;
                if(isUnresolved) window.revalidateRow(newRow);
            }
        }
        window.saveState();
    });
    
    updateAuditLogUI();
    window.calculateTotals(); 
    updateComplicationIndicator();
}

async function executeSave() {
    const alpineContainer = document.getElementById('ledger-app-container');
    if (typeof Alpine !== 'undefined' && alpineContainer) {
        Alpine.$data(alpineContainer).showSaveModal = false;
    }

    const centerSelect = document.getElementById('centerSelect');
    const centerId = centerSelect.value;
    const centerName = centerSelect.options[centerSelect.selectedIndex]?.text || "Unknown Center";
    const dateVal = document.getElementById('dateInput').value;
    
    if(!centerId || !dateVal) return showToast("Missing Info", "Ensure Center and Date are selected.", "error");

    const items = [];
    let totalLogged = 0;
    let calcErrors = 0;

    document.querySelectorAll('#tableBody tr').forEach(row => {
        const cat = row.getAttribute('data-cat');
        const nameCell = row.querySelector('.item-name-cell');
        
        const op = parseFloat(String(row.querySelector('.val-opening').value).replace(/,/g, '')) || 0;
        const inw = parseFloat(String(row.querySelector('.val-inward').value).replace(/,/g, '')) || 0;
        const disp = parseFloat(String(row.querySelector('.val-dispatch').value).replace(/,/g, '')) || 0;
        const clo = parseFloat(String(row.querySelector('.val-closing').value).replace(/,/g, '')) || 0;
        const carried = parseFloat(String(row.querySelector('.val-carried').innerText).replace(/,/g, '')) || 0;

        const savedAttr = row.getAttribute('data-save-alias');
        const cb = row.querySelector('.save-alias-cb');
        let shouldSaveAlias = false;
        if (savedAttr === 'true') shouldSaveAlias = true;
        else if (cb && cb.checked) shouldSaveAlias = true;

        const isInactive = (op === 0 && inw === 0 && disp === 0 && clo === 0 && carried === 0);
        
        if(isInactive && !row.classList.contains('unresolved-row') && !shouldSaveAlias) return;
        
        if (!row.classList.contains('unresolved-row')) {
            totalLogged++;
            const calc = Math.round((op + inw - disp) * 1000) / 1000;
            if ((Math.trunc(calc) !== Math.trunc(clo)) || (Math.trunc(op) !== Math.trunc(carried))) {
                calcErrors++;
            }
        }

        items.push({
            category: cat,
            material: nameCell.innerText.trim().toUpperCase(),
            original_scanned: (nameCell.getAttribute('data-original') || nameCell.innerText.trim()).toUpperCase(),
            opening_balance: op,
            inward: inw,
            production: cat === 'Finished Goods' ? inw : 0,
            dispatch: disp,
            closing_balance: clo,
            save_alias: shouldSaveAlias 
        });
    });

    const modalMessage = `
            <div class="text-center pt-2">
                <p class="mb-5 text-slate-700 dark:text-slate-300">You are about to log <strong>${totalLogged} items</strong> for <strong class="text-primary">${centerName}</strong>.</p>
                ${calcErrors > 0 
                    ? `<div class="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-3 rounded-md mb-4 border border-red-200 dark:border-red-500/20 font-bold"><i class="fa-solid fa-triangle-exclamation mr-2"></i> Warning: There are ${calcErrors} calculation errors.</div>` 
                    : `<div class="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-3 rounded-md mb-4 border border-emerald-200 dark:border-emerald-500/20 font-bold"><i class="fa-solid fa-check-circle mr-2"></i> All calculations tallied perfectly.</div>`}
                <p class="text-[10px] uppercase tracking-widest font-bold text-slate-500">Please confirm you have verified these values.</p>
        </div>
    `;

    const isConfirmed = await AppModal.confirm(
        "Final Save Review", 
        modalMessage, 
        { 
            confirmText: "Yes, Save Report", 
                confirmColor: "bg-primary hover:bg-primary/90 transition-all text-[11px] uppercase tracking-widest font-black" 
        }
    );

    if (!isConfirmed) return;

    const formData = new FormData();
    formData.append('center_id', centerId); 
    formData.append('date', dateVal); 
    formData.append('items', JSON.stringify(items)); 
    if (currentFileObj) formData.append('stock_image', currentFileObj);

    const overlay = document.getElementById('saveSuccessOverlay');
    if (overlay) {
        overlay.innerHTML = `
            <div class="success-content text-center flex flex-col items-center gap-5">
                <img src="/media/logos/lucrologo.png" alt="Lucro" class="w-24 h-24 object-contain spin-heavy drop-shadow-2xl">
                <h2 id="saveOverlayText" class="text-3xl font-black text-white tracking-wide">Saving to Database...</h2>
            </div>
        `;
        overlay.classList.remove('hidden');
        setTimeout(() => overlay.classList.add('active'), 10);
    }

    try {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
        const response = await fetch('/inventory/save_stock/', { method: 'POST', headers: { 'X-CSRFToken': csrfToken }, body: formData });
        const res = await response.json();
        
        if(res.status === 'success') {
            if (overlay) {
                document.getElementById('saveOverlayText').innerText = "Successfully Saved!";
                setTimeout(() => {
                    overlay.classList.remove('active');
                    setTimeout(() => window.location.reload(), 400); 
                }, 1500); 
            } else {
                window.location.reload();
            }
        } else { 
            if (overlay) {
                overlay.classList.remove('active');
                setTimeout(() => overlay.classList.add('hidden'), 300);
            }
            showToast("Failed", res.message, "error"); 
        }
    } catch(e) { 
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => overlay.classList.add('hidden'), 300);
        }
        showToast("Network Error", e.message, "error"); 
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const loadSheetId = params.get('load_sheet_id');
    
    if (loadSheetId) {
        loadSheetData(loadSheetId);
        
        // Remove the parameter from the URL to keep it clean (optional, but good UX)
        const url = new URL(window.location);
        url.searchParams.delete('load_sheet_id');
        window.history.replaceState({}, document.title, url);
    }
});

async function loadSheetData(sheetId) {
    showToast("Loading", "Fetching sheet data for review...", "info");
    try {
        const response = await fetch(`/inventory/api/raw-sheet/${sheetId}/`);
        const data = await response.json();
        
        if (data.status === 'success') {
            // 1. Set Date
            const dateInput = document.getElementById('dateInput');
            if (dateInput && dateInput._flatpickr) {
                dateInput._flatpickr.setDate(data.date);
            } else if (dateInput) {
                dateInput.value = data.date;
            }

            // 2. Set Center via Alpine OR Fallback
            const centerSelect = document.getElementById('centerSelect');
            if (centerSelect) {
                centerSelect.value = data.center_id;
                // Dispatch change event to update the Alpine component visually if bound
                centerSelect.dispatchEvent(new Event('change'));
                
                // Update Alpine component text manually
                const alpineComponent = centerSelect.closest('[x-data]');
                if (alpineComponent && typeof Alpine !== 'undefined') {
                    const alpineData = Alpine.$data(alpineComponent);
                    if (alpineData && alpineData.centers) {
                        const centerData = alpineData.centers.find(c => c.id == data.center_id);
                        if (centerData) {
                            alpineData.centerSearch = centerData.name;
                        }
                    }
                }
            }
            
            // Re-trigger loadCenterMasters so currentCenterMasters is populated
            if (typeof loadCenterMasters === 'function') {
                loadCenterMasters();
            } else if (typeof window.loadCenterMasters === 'function') {
                window.loadCenterMasters();
            }

            // 3. Load Image
            if (data.image_url) {
                const previewImg = document.getElementById('previewImg');
                const placeholder = document.getElementById('placeholder-content');
                const previewContainer = document.getElementById('previewContainer');
                const resultsPanel = document.getElementById('results');
                
                if (previewImg && placeholder) {
                    try {
                        const res = await fetch(data.image_url);
                        if (!res.ok) throw new Error("HTTP " + res.status);
                        const blob = await res.blob();
                        const urlPath = data.image_url.split('?')[0];
                        const name = urlPath.substring(urlPath.lastIndexOf('/') + 1) || 'review-document';
                        let mimeType = blob.type;
                        if (!mimeType || mimeType === 'application/octet-stream') {
                            mimeType = urlPath.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
                        }
                        const file = new File([blob], name, { type: mimeType });
                        await loadFileIntoPreview(file);
                    } catch (err) {
                        console.error("Failed to load image as blob for preview:", err);
                        // Fallback
                        previewImg.src = data.image_url;
                        previewImg.classList.remove('hidden');
                        placeholder.classList.add('hidden');
                        currentBase64 = "PRELOADED"; // bypass empty check
                    }
                    
                    if (previewContainer) {
                        previewContainer.classList.add('items-center', 'justify-center');
                        previewContainer.classList.remove('overflow-y-auto', 'block');
                    }
                    if (resultsPanel) {
                        resultsPanel.classList.remove('hidden');
                    }
                }
            }

            // 4. Parse Extracted Data
            if (data.raw_extracted_data) {
                const status = document.getElementById('status');
                if (status) {
                    status.classList.remove('hidden');
                    status.innerHTML = '<i class="fa-solid fa-check text-emerald-500"></i> Loaded from Review';
                }
                
                try {
                    let extractedText = "";
                    const candidates = data.raw_extracted_data.candidates;
                    if (candidates && candidates.length > 0) {
                        extractedText = candidates[0].content.parts[0].text;
                    }
                    
                    if (extractedText) {
                        extractedText = extractedText.replace(/DATE_FOUND: .*/g, "").replace(/```csv/g, "").replace(/```/g, "").trim();
                        
                        // Parse the CSV
                        parseCSV(extractedText);
                        
                        showToast("Loaded", "Sheet data populated for review.", "success");
                        
                        // Activate Alpine tab properly
                        const alpineContainer = document.getElementById('ledger-app-container');
                        if (alpineContainer && typeof Alpine !== 'undefined') {
                            Alpine.$data(alpineContainer).activeTab = 'closing';
                            window.currentActiveTab = 'closing';
                        }
                    } else {
                        showToast("Image Loaded", "No raw extraction text found.", "warning");
                    }
                } catch (e) {
                    console.error("Error parsing raw_extracted_data", e);
                    showToast("Error", "Could not parse extracted data.", "error");
                }
            } else {
                showToast("Image Loaded", "No raw data found, please run extraction.", "warning");
            }
        } else {
            showToast("Error", data.message || "Could not fetch sheet data", "error");
        }
    } catch (error) {
        console.error("Error loading sheet:", error);
        showToast("Error", "Failed to fetch sheet data.", "error");
    }
}
