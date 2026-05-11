// Expose templateBuilder directly to the global window object instantly
window.templateBuilder = function() {
    // Keep API state outside the Alpine reactive object but inside the scope
    const apiKeys = [
        "REDACTED",
        "REDACTED",
        "REDACTED",
        "REDACTED"
    ];
    let currentKeyIndex = 0;
    let b64 = null;
    let mType = null;

    return {
        items: [],
        hasFile: false,
        isExtracting: false,
        isSaving: false,
        
        toastTitle: '',
        toastMsg: '',
        toastType: 'info',

        // Django context variables
        csrfToken: null,
        saveUrl: null,

        init() {
            // 1. Grab environment data
            const envEl = document.getElementById('env-data');
            if (envEl) {
                this.csrfToken = envEl.getAttribute('data-csrf');
                this.saveUrl = envEl.getAttribute('data-save-url');
            }

            // 2. Load Initial Items
            try {
                const rawData = document.getElementById('initial-items').textContent;
                this.items = JSON.parse(rawData);
            } catch(e) {
                console.error("Failed to load initial items:", e);
                this.items = [];
            }
        },

        showToast(title, msg, type) {
            this.toastTitle = title;
            this.toastMsg = msg;
            this.toastType = type;
            
            const t = document.getElementById('toast');
            if(!t) return;

            t.classList.remove('hidden');
            setTimeout(() => t.classList.remove('translate-y-full', 'opacity-0'), 10);
            setTimeout(() => { 
                t.classList.add('translate-y-full', 'opacity-0'); 
                setTimeout(() => t.classList.add('hidden'), 300); 
            }, 3000);
        },

        // --- ROW MANAGEMENT CONTROLS ---
        addTop() {
            this.items.unshift({ temp_id: Date.now(), name: 'NEW ITEM', category: 'Raw Material' });
        },

        addBottom() {
            this.items.push({ temp_id: Date.now(), name: 'NEW ITEM', category: 'Raw Material' });
        },

        moveUp(index) {
            if (index > 0) {
                const temp = this.items[index];
                this.items[index] = this.items[index - 1];
                this.items[index - 1] = temp;
            }
        },

        moveDown(index) {
            if (index < this.items.length - 1) {
                const temp = this.items[index];
                this.items[index] = this.items[index + 1];
                this.items[index + 1] = temp;
            }
        },

        applyBulkCategory(val) {
            if (val) {
                this.items.forEach(item => { item.category = val; });
                document.querySelector('th select').value = '';
                this.showToast("Bulk Updated", `All items set to ${val}`, "success");
            }
        },

        removeItem(index) {
            this.items.splice(index, 1);
        },

        // --- FILE AND EXTRACTION LOGIC ---
        async handleFileSelect(e) {
            const file = e.target.files[0];
            if (!file) return;
            this.hasFile = true;

            const placeholder = document.getElementById('placeholder-content');
            const previewImg = document.getElementById('previewImg');
            const pdfContainer = document.getElementById('pdfCanvasContainer');
            const previewContainer = document.getElementById('previewContainer');
            
            placeholder.classList.add('hidden');
            previewImg.classList.add('hidden');
            pdfContainer.classList.add('hidden');
            pdfContainer.innerHTML = '';
            
            const reader = new FileReader();
            reader.onload = async (event) => {
                const rawResult = event.target.result;
                b64 = rawResult.split(',')[1];
                mType = file.type;

                if (file.type === 'application/pdf') {
                    pdfContainer.classList.remove('hidden');
                    pdfContainer.classList.add('flex');                
                    previewContainer.classList.remove('items-center', 'justify-center');
                    previewContainer.classList.add('overflow-y-auto', 'block', 'items-start');

                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
                    
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const viewport = page.getViewport({ scale: 1.2 });
                        const canvas = document.createElement('canvas');
                        canvas.className = 'mb-4 shadow-sm rounded-md border border-slate-200 dark:border-slate-700 max-w-full bg-white';
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;
                        pdfContainer.appendChild(canvas);
                        await page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;
                    }
                } else {
                    previewImg.src = rawResult;
                    previewImg.classList.remove('hidden');
                    previewContainer.classList.add('items-center', 'justify-center');
                    previewContainer.classList.remove('overflow-y-auto', 'block', 'items-start');
                }
            };
            reader.readAsDataURL(file);
        },

        async extractTemplate() {
            if (!b64) return;
            this.isExtracting = true;
            
            let success = false;
            let attempts = 0;

            const promptText = `
                Analyze this BLANK physical inventory template for a distribution center. 
                1. Extract the printed item names in the EXACT order they appear from top to bottom.
                2. Categorize them strictly as 'Raw Material' or 'Finished Goods' based on the visual blocks/headers in the sheet.
                3. Ignore handwritten numbers, squiggles, or empty lines. Only extract the pre-printed labels.
                
                Return EXACTLY in this CSV format:
                CSV_START
                Category,Item Name
            `;

            while (!success && attempts < apiKeys.length) {
                try {
                    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKeys[currentKeyIndex]}`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: promptText }, { inline_data: { mime_type: mType, data: b64 } }] }]
                        })
                    });

                    const data = await response.json();
                    if (data.error) throw new Error(data.error.message);

                    let text = data.candidates[0].content.parts[0].text;
                    text = text.replace(/```csv/g, "").replace(/```/g, "").trim();
                    
                    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
                    let reading = false;
                    let newItems = [];
                    
                    lines.forEach(line => {
                        if (line.includes("CSV_START")) { reading = true; return; }
                        if (!reading || !line.includes(",")) return; 
                        
                        const cols = line.split(',');
                        if (cols[0] !== 'Category') {
                            const cat = (cols[0].toLowerCase().includes('finish') || cols[0].toLowerCase().includes('goods')) ? 'Finished Goods' : 'Raw Material';
                            newItems.push({
                                temp_id: Date.now() + Math.random(),
                                category: cat,
                                name: cols[1].trim().toUpperCase() 
                            });
                        }
                    });
                    
                    this.items = [...this.items, ...newItems];
                    this.showToast("Extraction Complete", `Added ${newItems.length} items to the list.`, "success");
                    success = true;

                } catch (e) {
                    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
                    attempts++;
                }
            }
            
            if(!success) this.showToast("Error", "AI failed to extract document.", "error");
            this.isExtracting = false;
        },

        async saveTemplate() {
            if (!this.saveUrl || !this.csrfToken) return;
            this.isSaving = true;
            
            const cleanItems = this.items.map(i => ({
                id: i.id || null, 
                name: i.name,
                category: i.category
            }));

            try {
                const response = await fetch(this.saveUrl, {
                    method: 'POST',
                    headers: { 
                        'X-CSRFToken': this.csrfToken,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ items: cleanItems })
                });
                
                const data = await response.json();
                
                if (data.status === 'success') {
                    this.showToast("Saved!", "Center Master Template secured.", "success");
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    this.showToast("Save Failed", data.message, "error");
                }
            } catch(e) {
                this.showToast("Network Error", "Failed to connect to server.", "error");
            }
            this.isSaving = false;
        }
    }
};