window.TemplateListApp = {
    csrfToken: null,

    init() {
        const envEl = document.getElementById('env-data');
        if (envEl) {
            this.csrfToken = envEl.getAttribute('data-csrf');
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

    openDeleteConfirm(id, name) {
        const m = document.getElementById('deleteConfirmModal');
        document.getElementById('deleteTargetName').innerText = name;
        document.getElementById('deleteTargetId').value = id;
        
        m.classList.remove('hidden');
        setTimeout(() => {
            m.firstElementChild.classList.remove('opacity-0', 'scale-95');
            m.firstElementChild.classList.add('opacity-100', 'scale-100');
        }, 10);
    },

    closeDeleteConfirm() {
        const m = document.getElementById('deleteConfirmModal');
        m.firstElementChild.classList.remove('opacity-100', 'scale-100');
        m.firstElementChild.classList.add('opacity-0', 'scale-95');
        setTimeout(() => m.classList.add('hidden'), 300);
    },

    async confirmDelete() {
        const id = document.getElementById('deleteTargetId').value;
        const btn = document.getElementById('confirmDeleteBtn');
        const originalHTML = btn.innerHTML;
        
        btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Deleting...`;
        btn.disabled = true;

        try {
            const res = await fetch(`/inventory/templates/${id}/delete/`, {
                method: 'POST',
                headers: { 'X-CSRFToken': this.csrfToken, 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            
            if (data.status === 'success') {
                window.location.reload();
            } else {
                this.showToast("Error Deleting", data.message, "error");
                this.closeDeleteConfirm();
                btn.innerHTML = originalHTML;
                btn.disabled = false;
            }
        } catch(e) {
            this.showToast("Network Error", "Could not communicate with the server", "error");
            this.closeDeleteConfirm();
            btn.innerHTML = originalHTML;
            btn.disabled = false;
        }
    }
};

document.addEventListener("DOMContentLoaded", () => window.TemplateListApp.init());