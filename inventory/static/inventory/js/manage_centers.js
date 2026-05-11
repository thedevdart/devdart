window.ManageCentersApp = {
    csrfToken: null,
    classApiUrl: null,
    centerApiUrl: null,

    init() {
        const envEl = document.getElementById('env-data');
        if (envEl) {
            this.csrfToken = envEl.getAttribute('data-csrf');
            this.classApiUrl = envEl.getAttribute('data-class-url');
            this.centerApiUrl = envEl.getAttribute('data-center-url');
        }
        
        this.initCustomSelects();
    },

    // --- Custom Dropdown Engine (Upgraded with Z-Index Management) ---
    initCustomSelects() {
        const selects = document.querySelectorAll('.custom-select');
        
        selects.forEach(wrapper => {
            // Prevent double-binding if init is called twice
            if (wrapper.dataset.initialized) return;
            wrapper.dataset.initialized = "true";

            const trigger = wrapper.querySelector('.select-trigger');
            const dropdown = wrapper.querySelector('.select-dropdown');
            const valueSpan = wrapper.querySelector('.select-value');
            const hiddenInput = wrapper.querySelector('input[type="hidden"]');
            const icon = wrapper.querySelector('.fa-chevron-down');
            const options = wrapper.querySelectorAll('.select-option');

            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Close all other dropdowns and reset their z-index
                document.querySelectorAll('.custom-select').forEach(otherWrapper => {
                    if (otherWrapper !== wrapper) {
                        otherWrapper.style.zIndex = "10";
                        const drop = otherWrapper.querySelector('.select-dropdown');
                        if (drop && !drop.classList.contains('hidden')) {
                            drop.classList.add('hidden', 'opacity-0', 'scale-y-95');
                            const otherIcon = otherWrapper.querySelector('.fa-chevron-down');
                            if(otherIcon) otherIcon.classList.remove('rotate-180');
                        }
                    }
                });

                const isHidden = dropdown.classList.contains('hidden');
                if (isHidden) {
                    // Pop this dropdown to the absolute front
                    wrapper.style.zIndex = "50";
                    dropdown.classList.remove('hidden');
                    // Small timeout allows the browser to render the display:block before animating opacity
                    setTimeout(() => {
                        dropdown.classList.remove('opacity-0', 'scale-y-95');
                        dropdown.classList.add('opacity-100', 'scale-y-100');
                    }, 10);
                    if(icon) icon.classList.add('rotate-180');
                } else {
                    // Reset z-index and close
                    wrapper.style.zIndex = "10";
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
                    hiddenInput.value = val;
                    
                    // Update the visual span with the selected HTML
                    valueSpan.innerHTML = opt.querySelector('.option-content').innerHTML;
                    
                    // Close this dropdown and reset z-index
                    wrapper.style.zIndex = "10";
                    dropdown.classList.remove('opacity-100', 'scale-y-100');
                    dropdown.classList.add('opacity-0', 'scale-y-95');
                    setTimeout(() => dropdown.classList.add('hidden'), 200);
                    if(icon) icon.classList.remove('rotate-180');
                });
            });
        });

        // Close dropdowns if user clicks anywhere else on the page
        document.addEventListener('click', () => {
            document.querySelectorAll('.custom-select').forEach(wrapper => {
                wrapper.style.zIndex = "10";
                const dropdown = wrapper.querySelector('.select-dropdown');
                if (dropdown && !dropdown.classList.contains('hidden')) {
                    dropdown.classList.remove('opacity-100', 'scale-y-100');
                    dropdown.classList.add('opacity-0', 'scale-y-95');
                    setTimeout(() => dropdown.classList.add('hidden'), 200);
                    const icon = wrapper.querySelector('.fa-chevron-down');
                    if(icon) icon.classList.remove('rotate-180');
                }
            });
        });
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
            icon.className = 'fa-solid fa-check text-accent text-lg mt-0.5';
            borderEl.className = 'bg-brand text-white px-5 py-4 rounded-md shadow-2xl flex items-start gap-4 min-w-[320px] max-w-sm border-l-4 border-accent';
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

    async addClassification() {
        const input = document.getElementById('newClassInput');
        const name = input ? input.value.trim() : '';
        if(!name) return;
        
        try {
            const res = await fetch(this.classApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': this.csrfToken },
                body: JSON.stringify({ action: 'add', name: name })
            });
            const data = await res.json();
            if(data.status === 'success') window.location.reload();
            else this.showToast("Error", data.message, "error");
        } catch(e) { 
            this.showToast("Network Error", "Failed to connect to the server.", "error"); 
        }
    },

    async deleteClassification(id, name) {
        const confirmed = await window.AppModal.confirm(
            "Delete Group", 
            `Are you sure you want to delete the "${name}" classification? This will not delete the centers, it will just un-assign them.`, 
            { confirmColor: "bg-red-600 hover:bg-red-700", confirmText: "Delete" }
        );
        if(!confirmed) return;

        try {
            const res = await fetch(this.classApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': this.csrfToken },
                body: JSON.stringify({ action: 'delete', id: id })
            });
            const data = await res.json();
            if(data.status === 'success') window.location.reload();
            else this.showToast("Error", data.message, "error");
        } catch(e) { 
            this.showToast("Network Error", "Failed to connect to the server.", "error"); 
        }
    },

    async handleCenter(action, id = null, btnEvent = null) {
        let payload = { action: action, id: id };

        if (action === 'add') {
            payload.name = document.getElementById('newName').value.trim();
            payload.state = document.getElementById('newLoc').value.trim();
            payload.category = document.getElementById('newCat').value; 
            payload.classification_id = document.getElementById('newClass').value; 
        } else {
            payload.name = document.getElementById(`name-${id}`).value.trim();
            payload.state = document.getElementById(`loc-${id}`).value.trim();
            payload.category = document.getElementById(`cat-${id}`).value;
            payload.classification_id = document.getElementById(`class-${id}`).value;
            
            if(action === 'delete') {
                const confirmed = await window.AppModal.confirm(
                    "Delete Center", 
                    "Are you sure? This will hide all reports linked to this center.", 
                    { confirmColor: "bg-red-600 hover:bg-red-700", confirmText: "Delete" }
                );
                if(!confirmed) return;
            }
        }

        if (!payload.name || !payload.state) {
            this.showToast("Validation Error", "Both Center Name and Region/State are mandatory.", "error");
            return;
        }

        let btn = null;
        let originalHTML = '';
        
        if (btnEvent && btnEvent.target) {
            btn = btnEvent.target.closest('button');
            if (btn) {
                originalHTML = btn.innerHTML;
                btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i>`;
                btn.disabled = true;
            }
        }

        try {
            const response = await fetch(this.centerApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': this.csrfToken },
                body: JSON.stringify(payload)
            });

            const res = await response.json();
            
            if(res.status === 'success') {
                if(action === 'add' || action === 'delete') {
                    window.location.reload(); 
                } else {
                    if (btn) {
                        btn.innerHTML = `<i class="fa-solid fa-check text-accent"></i>`;
                        this.showToast("Saved", "Center updated successfully.", "success");
                        setTimeout(() => {
                            btn.innerHTML = originalHTML;
                            btn.disabled = false;
                        }, 1500);
                    }
                }
            } else {
                this.showToast("Error", res.message, "error");
                if (btn) {
                    btn.innerHTML = originalHTML;
                    btn.disabled = false;
                }
            }
        } catch(e) {
            this.showToast("Network Error", "Failed to communicate with the server.", "error");
            if (btn) {
                btn.innerHTML = originalHTML;
                btn.disabled = false;
            }
        }
    }
};

window.addClassification = () => window.ManageCentersApp.addClassification();
window.deleteClassification = (id, name) => window.ManageCentersApp.deleteClassification(id, name);
window.handleCenter = (action, id, event) => window.ManageCentersApp.handleCenter(action, id, event);