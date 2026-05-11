window.MasterListApp = {
    csrfToken: null,
    apiUrl: null,

    init() {
        const envEl = document.getElementById('env-data');
        if (envEl) {
            this.csrfToken = envEl.getAttribute('data-csrf');
            this.apiUrl = envEl.getAttribute('data-api-url');
        }
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

    openModal(id = '', name = '', category = '') {
        const modal = document.getElementById('itemModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalIcon = document.getElementById('modalIcon');
        
        document.getElementById('itemId').value = id;
        document.getElementById('itemName').value = name;
        document.getElementById('itemCategory').value = category;

        if (id) {
            modalTitle.innerText = "Edit Master Item";
            modalIcon.className = "fa-solid fa-pen-to-square text-primary";
        } else {
            modalTitle.innerText = "Register New Item";
            modalIcon.className = "fa-solid fa-box-open text-primary";
        }
        
        modal.classList.remove('hidden');
        // Small delay for transition
        setTimeout(() => {
            modal.firstElementChild.classList.remove('scale-95', 'opacity-0');
            modal.firstElementChild.classList.add('scale-100', 'opacity-100');
        }, 10);
    },

    closeModal() {
        const modal = document.getElementById('itemModal');
        modal.firstElementChild.classList.remove('scale-100', 'opacity-100');
        modal.firstElementChild.classList.add('scale-95', 'opacity-0');
        setTimeout(() => modal.classList.add('hidden'), 200);
    },

    async saveItem(btnEvent) {
        const payload = {
            id: document.getElementById('itemId').value,
            name: document.getElementById('itemName').value.trim(),
            category: document.getElementById('itemCategory').value.trim()
        };

        if(!payload.name || !payload.category) {
            this.showToast("Validation Error", "Item Name and Category are mandatory.", "error");
            return;
        }

        let btn = null;
        let originalHTML = '';
        if (btnEvent && btnEvent.target) {
            btn = btnEvent.target.closest('button');
            originalHTML = btn.innerHTML;
            btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...`;
            btn.disabled = true;
        }

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.csrfToken
                },
                body: JSON.stringify(payload)
            });
            
            const res = await response.json();
            
            if(res.status === 'success') {
                this.closeModal();
                this.showToast("Success", "Master Database updated.", "success");
                setTimeout(() => window.location.reload(), 1000); 
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

// Global bindings for HTML onclick handlers
window.openItemModal = (id, name, cat) => window.MasterListApp.openModal(id, name, cat);
window.closeItemModal = () => window.MasterListApp.closeModal();
window.saveMasterItem = (event) => window.MasterListApp.saveItem(event);

document.addEventListener("DOMContentLoaded", () => window.MasterListApp.init());