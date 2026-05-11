/* inventory/static/inventory/js/stock_entry.js */

let currentBase64 = null;
let currentMime = null;

// --- UTILS: TOAST NOTIFICATION ---
function showToast(title, msg, type = 'info') {
    const toast = document.getElementById('toast');
    const tTitle = document.getElementById('toast-title');
    const tMsg = document.getElementById('toast-msg');
    const tIcon = document.getElementById('toast-icon');
    const container = toast.firstElementChild;

    // Reset classes
    container.className = "px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px] border-l-4 text-white";
    
    if(type === 'success') {
        container.classList.add('bg-slate-800', 'border-green-500');
        tIcon.className = "fa-solid fa-circle-check text-green-400 text-xl";
    } else if(type === 'error') {
        container.classList.add('bg-slate-800', 'border-red-500');
        tIcon.className = "fa-solid fa-circle-xmark text-red-400 text-xl";
    } else {
        container.classList.add('bg-slate-800', 'border-blue-500');
        tIcon.className = "fa-solid fa-circle-info text-blue-400 text-xl";
    }

    tTitle.innerText = title;
    tMsg.innerText = msg;
    toast.classList.remove('hidden', 'translate-x-full');
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 3000);
}

// --- LIVE TOTALS CALCULATION ---
function calculateTotals() {
    let rawTotal = 0;
    let finishTotal = 0;
    
    const rows = document.querySelectorAll('#tableBody tr');
    
    rows.forEach(row => {
        const catSelect = row.querySelector('td select');
        const balCell = row.querySelectorAll('td')[2]; // 3rd column is balance
        
        if (catSelect && balCell) {
            const category = catSelect.value;
            // Clean text (remove commas), parse float, default to 0
            const qty = parseFloat(balCell.innerText.replace(/,/g, '')) || 0;
            
            if (category === 'Raw Material') {
                rawTotal += qty;
            } else if (category === 'Finished Goods') {
                finishTotal += qty;
            }
        }
    });

    // Update DOM
    document.getElementById('totalRaw').innerText = Math.round(rawTotal);
    document.getElementById('totalFinished').innerText = Math.round(finishTotal);
    document.getElementById('totalGrand').innerText = Math.round(rawTotal + finishTotal);
    
    // Show the panel if it was hidden
    document.getElementById('liveTotals').classList.remove('hidden');
}

// --- ADD LISTENERS FOR LIVE UPDATES ---
function addInputListeners(row) {
    // 1. Balance Change
    const balCell = row.querySelectorAll('td')[2];
    balCell.addEventListener('input', calculateTotals);
    
    // 2. Category Change
    const catSelect = row.querySelector('td select');
    catSelect.addEventListener('change', calculateTotals);
}

// --- BULK UPDATE ---
function applyBulkCategory(value) {
    if (!value) return;
    const rows = document.querySelectorAll('#tableBody tr');
    let count = 0;
    rows.forEach(row => {
        const select = row.querySelector('td select');
        if (select) { 
            select.value = value; 
            count++; 
        }
    });
    // Reset dropdown visually
    const headerSelect = document.querySelector('th select');
    if(headerSelect) headerSelect.value = "";
    
    if (count > 0) showToast("Bulk Update", `Updated ${count} items to ${value}`, "success");
    
    calculateTotals(); // Recalculate after bulk change
}

// --- 1. FILE INPUT HANDLING ---
document.getElementById('fileInput').addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Date defaults are handled in page load script now, but good fallback
    if(!document.getElementById('dateInput').value) {
        document.getElementById('dateInput').valueAsDate = new Date();
    }

    const placeholder = document.getElementById('placeholder-content');
    const previewImg = document.getElementById('previewImg');
    const pdfContainer = document.getElementById('pdfCanvasContainer');
    const previewContainer = document.getElementById('previewContainer');
    
    placeholder.classList.add('hidden');
    previewImg.classList.add('hidden');
    pdfContainer.classList.add('hidden');
    pdfContainer.innerHTML = '';
    
    previewContainer.classList.add('items-center', 'justify-center');
    previewContainer.classList.remove('overflow-y-auto', 'block');

    // A. Excel Logic
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        previewContainer.innerHTML = `<div class="text-center"><i class="fa-solid fa-file-excel text-6xl text-green-600"></i><p class="mt-4 font-bold text-slate-600">${file.name}</p></div>`;
        const reader = new FileReader();
        reader.onload = function(e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, {header: 1});
            
            let extractedText = "CSV_START\n";
            jsonData.forEach(row => {
                if(row.length >= 2) {
                    let cat = row[0] || "Raw Material"; 
                    let mat = row[1] || "";
                    let bal = row[2] || row[1];
                    if(typeof row[1] === 'number') { mat = row[0]; bal = row[1]; cat = "Raw Material"; }
                    extractedText += `${cat},${mat},${bal}\n`;
                }
            });
            renderTable(extractedText);
            document.getElementById('results').classList.remove('hidden');
            document.getElementById('status').innerHTML = "✅ Excel Data Loaded";
            showToast("Excel Loaded", "Data extracted from Excel successfully.", "success");
        };
        reader.readAsArrayBuffer(file);
        return;
    }

    // B. Image/PDF Logic
    const reader = new FileReader();
    reader.onload = async function(event) {
        const rawResult = event.target.result;
        currentBase64 = rawResult.split(',')[1];
        currentMime = file.type;

        if (file.type === 'application/pdf') {
            pdfContainer.classList.remove('hidden');
            pdfContainer.classList.add('flex');
            previewContainer.classList.remove('items-center', 'justify-center');
            previewContainer.classList.add('overflow-y-auto', 'block');

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const scale = 1.0; 
                const viewport = page.getViewport({ scale: scale });
                const canvas = document.createElement('canvas');
                canvas.className = 'mb-4 shadow-md border max-w-full';
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                pdfContainer.appendChild(canvas);
                await page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;
            }
        } else {
            previewImg.src = rawResult;
            previewImg.classList.remove('hidden');
            previewContainer.classList.add('items-center', 'justify-center');
        }
    };
    reader.readAsDataURL(file);
});

// --- 2. AI EXTRACTION ---
async function runAnalysis() {
    if (!currentBase64) return showToast("No File", "Please upload a file first.", "error");
    
    const btn = document.getElementById('analyzeBtn');
    const status = document.getElementById('status');
    btn.disabled = true;
    status.classList.remove('hidden');
    status.innerHTML = '<div class="loader mr-2"></div> Sending to Secure Server...';

    try {
        const response = await fetch(window.DJANGO_CONFIG.analyzeUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': window.DJANGO_CONFIG.csrfToken
            },
            body: JSON.stringify({ 
                mime_type: currentMime, 
                data: currentBase64 
            })
        });

        const data = await response.json();
        if(data.error) throw new Error(data.error);

        let text = data.candidates[0].content.parts[0].text;
        
        const dateMatch = text.match(/DATE_FOUND: (\d{4}-\d{2}-\d{2})/);
        const warningBox = document.getElementById('date-warning');
        const manualDate = document.getElementById('dateInput').value;

        if (dateMatch) {
            const aiDate = dateMatch[1];
            if (aiDate !== manualDate) {
                warningBox.innerHTML = `⚠️ Date Mismatch! <br>Selected: ${manualDate} <br>Found: ${aiDate}`;
                warningBox.className = "mt-2 text-xs font-bold p-2 rounded border bg-yellow-100 text-yellow-800 border-yellow-200";
                showToast("Date Mismatch", `Sheet says ${aiDate}`, "error");
            } else {
                warningBox.innerHTML = `✅ Date Matches: ${aiDate}`;
                warningBox.className = "mt-2 text-xs font-bold p-2 rounded border bg-green-100 text-green-800 border-green-200";
            }
            warningBox.classList.remove('hidden');
        }

        text = text.replace(/DATE_FOUND: .*/g, "").replace(/```csv/g, "").replace(/```/g, "").trim();
        renderTable(text);

        status.innerHTML = "✅ Extraction Complete";
        document.getElementById('results').classList.remove('hidden');
        showToast("Success", "Data extracted successfully!", "success");

    } catch (e) {
        showToast("Error", e.message, "error");
        status.innerHTML = "❌ Error Occurred";
    } finally {
        btn.disabled = false;
    }
}

// --- 3. RENDER TABLE ---
function renderTable(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = "";
    
    let readingCSV = false;
    lines.forEach(line => {
        if (line.includes("CSV_START")) { readingCSV = true; return; }
        if (!readingCSV && !line.includes(",")) return; 
        
        const cols = line.split(',');
        if (cols.length >= 2 && cols[0] !== 'Category') { 
            const categoryLower = cols[0].toLowerCase();
            const isFinished = categoryLower.includes('finish') || categoryLower.includes('goods');
            
            let matName = cols[1]; 
            let balance = cols[2];
            if(cols.length === 2) { matName = cols[0]; balance = cols[1]; }

            const tr = document.createElement('tr');
            tr.className = "bg-white hover:bg-blue-50 group";
            tr.innerHTML = `
                <td class="px-2 py-3 border-b">
                    <select class="w-full bg-transparent font-bold text-xs uppercase outline-none focus:bg-yellow-50 p-2 rounded text-blue-800">
                        <option value="Raw Material" ${!isFinished ? 'selected' : ''}>Raw Material</option>
                        <option value="Finished Goods" ${isFinished ? 'selected' : ''}>Finished Goods</option>
                    </select>
                </td>
                <td contenteditable="true" class="px-4 py-3 text-gray-800 font-bold border-b outline-none focus:bg-yellow-50">${matName}</td>
                <td contenteditable="true" class="px-4 py-3 text-right font-mono text-blue-600 border-b outline-none focus:bg-yellow-50">${balance}</td>
                <td class="px-2 py-3 text-center border-b">
                    <button class="text-red-400 hover:text-red-600 delete-btn">×</button>
                </td>
            `;
            
            // Add listeners for dynamic totals
            addInputListeners(tr);
            tr.querySelector('.delete-btn').onclick = function() { 
                this.closest('tr').remove(); 
                calculateTotals(); 
            };

            tbody.appendChild(tr);
        }
    });
    
    calculateTotals(); // Initial calculation
}

// --- 4. ADD ROW ---
function addRow() {
    const tbody = document.getElementById('tableBody');
    const tr = document.createElement('tr');
    tr.className = "bg-blue-50 hover:bg-yellow-50 animate-pulse";
    tr.innerHTML = `
        <td class="px-2 py-3 border-b">
            <select class="w-full bg-transparent font-bold text-xs uppercase outline-none text-blue-800">
                <option value="Raw Material">Raw Material</option>
                <option value="Finished Goods">Finished Goods</option>
            </select>
        </td>
        <td contenteditable="true" class="px-4 py-3 text-gray-800 font-bold border-b outline-none focus:bg-white">New Item</td>
        <td contenteditable="true" class="px-4 py-3 text-right font-mono text-blue-600 border-b outline-none focus:bg-white">0</td>
        <td class="px-2 py-3 text-center border-b">
            <button class="text-red-500 hover:text-red-700 delete-btn">×</button>
        </td>
    `;
    
    // Add listeners
    addInputListeners(tr);
    tr.querySelector('.delete-btn').onclick = function() { 
        this.closest('tr').remove(); 
        calculateTotals(); 
    };

    tbody.prepend(tr);
}

// --- 5. EXPORT XLSX (Unchanged) ---
function exportTableToXLSX() {
    const centerName = document.getElementById('centerSelect').options[document.getElementById('centerSelect').selectedIndex].text;
    const dateVal = document.getElementById('dateInput').value;
    const rows = document.querySelectorAll('#tableBody tr');
    
    let data = [];
    let totalRaw = 0;
    let totalFinished = 0;

    data.push(["Center:", centerName]);
    data.push(["Date:", dateVal]);
    data.push([]); 
    data.push(["Category", "Material Name", "Balance"]);

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const select = cells[0].querySelector('select');
        const cat = select ? select.value : cells[0].innerText;
        const mat = cells[1].innerText.trim();
        const bal = parseFloat(cells[2].innerText.trim()) || 0;

        if(cat === 'Raw Material') totalRaw += bal;
        if(cat === 'Finished Goods') totalFinished += bal;

        data.push([cat, mat, bal]);
    });

    data.push([]);
    data.push(["SUMMARY REPORT"]);
    data.push(["Total Raw Material", "", totalRaw]);
    data.push(["Total Finished Goods", "", totalFinished]);
    data.push(["Grand Total", "", totalRaw + totalFinished]);

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock Sheet");
    XLSX.writeFile(wb, `${centerName}_${dateVal}.xlsx`);
}

// --- 6. SAVE TO DATABASE (Unchanged) ---
async function saveToDatabase() {
    const centerId = document.getElementById('centerSelect').value;
    const dateVal = document.getElementById('dateInput').value;
    const fileInput = document.getElementById('fileInput');

    if(!centerId || !dateVal) return showToast("Missing Info", "Please select a Center and Date!", "error");

    const rows = document.querySelectorAll('#tableBody tr');
    const items = [];
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const select = cells[0].querySelector('select');
        items.push({
            category: select.value,
            material: cells[1].innerText.trim(),
            balance: parseFloat(cells[2].innerText.trim()) || 0
        });
    });

    if(items.length === 0) return showToast("Empty", "No items to save!", "error");

    const formData = new FormData();
    formData.append('center_id', centerId);
    formData.append('date', dateVal);
    formData.append('items', JSON.stringify(items)); 
    
    if(fileInput.files[0]) {
        formData.append('stock_image', fileInput.files[0]);
    }

    try {
        const btn = document.querySelector('button[onclick="saveToDatabase()"]');
        btn.innerText = "Saving...";
        btn.disabled = true;

        const response = await fetch(window.DJANGO_CONFIG.saveUrl, {
            method: 'POST',
            headers: { 'X-CSRFToken': window.DJANGO_CONFIG.csrfToken },
            body: formData
        });

        const res = await response.json();
        
        if(res.status === 'success') {
            showToast("Saved!", "Data saved successfully. Refreshing...", "success");
            setTimeout(() => { window.location.reload(); }, 1500);
        } else {
            showToast("Save Failed", res.message, "error");
            btn.innerText = "Save to Database";
            btn.disabled = false;
        }
    } catch(e) {
        showToast("Network Error", e.message, "error");
        btn.innerText = "Save to Database";
        btn.disabled = false;
    }
}