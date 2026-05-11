window.ProfileApp = {
    csrfToken: null,
    updateProfileUrl: null,
    requestOtpUrl: null,
    verifyOtpUrl: null,
    userEmail: '',

    init() {
        const envEl = document.getElementById('env-data');
        if (envEl) {
            this.csrfToken = envEl.getAttribute('data-csrf');
            this.updateProfileUrl = envEl.getAttribute('data-update-url');
            this.requestOtpUrl = envEl.getAttribute('data-request-otp-url');
            this.verifyOtpUrl = envEl.getAttribute('data-verify-otp-url');
            this.userEmail = envEl.getAttribute('data-user-email');
        }

        this.bindEvents();
    },

    bindEvents() {
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.saveProfile(e));
        }

        const otpForm = document.getElementById('verify-form');
        if (otpForm) {
            otpForm.addEventListener('submit', (e) => this.verifyOTP(e));
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

    async saveProfile(e) {
        e.preventDefault();
        const btn = document.getElementById('btn-save-profile');
        const originalHTML = btn.innerHTML;
        
        btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...`;
        btn.disabled = true;

        const payload = {
            first_name: document.getElementById('firstName').value.trim(),
            last_name: document.getElementById('lastName').value.trim(),
            email: document.getElementById('email').value.trim()
        };

        try {
            const response = await fetch(this.updateProfileUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': this.csrfToken },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            
            if (data.status === 'success') {
                this.userEmail = payload.email; // Update local memory
                document.getElementById('env-data').setAttribute('data-user-email', payload.email);
                this.showToast("Success", "Profile updated successfully.", "success");
            } else {
                this.showToast("Error", data.message, "error");
            }
        } catch (err) {
            this.showToast("Network Error", "Could not save profile.", "error");
        } finally {
            btn.innerHTML = originalHTML;
            btn.disabled = false;
        }
    },

    async requestOTP() {
        if (!this.userEmail) {
            this.showToast("Validation Error", "Please save an email address first.", "error");
            return;
        }

        const btn = document.getElementById('btn-request-otp');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Requesting...`;
        btn.disabled = true;

        try {
            const response = await fetch(this.requestOtpUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': this.csrfToken }
            });
            const data = await response.json();
            
            if (data.status === 'success') {
                document.getElementById('display-email').innerText = this.userEmail;
                this.openModal();
            } else {
                this.showToast("Error", data.message, "error");
            }
        } catch (err) {
            this.showToast("Network Error", "Failed to communicate with server.", "error");
        } finally {
            btn.innerHTML = originalHTML;
            btn.disabled = false;
        }
    },

    async verifyOTP(e) {
        e.preventDefault();
        const btn = document.getElementById('btn-verify-otp');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Verifying...`;
        btn.disabled = true;

        const payload = {
            otp: document.getElementById('otpCode').value.trim(),
            new_password: document.getElementById('newPassword').value
        };

        try {
            const response = await fetch(this.verifyOtpUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': this.csrfToken },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            
            if (data.status === 'success') {
                this.closeModal();
                this.showToast("Security Updated", "Password successfully changed.", "success");
                document.getElementById('otpCode').value = '';
                document.getElementById('newPassword').value = '';
            } else {
                this.showToast("Verification Failed", data.message, "error");
            }
        } catch (err) {
            this.showToast("Network Error", "An error occurred during verification.", "error");
        } finally {
            btn.innerHTML = originalHTML;
            btn.disabled = false;
        }
    },

    openModal() {
        const modal = document.getElementById('otp-modal');
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.firstElementChild.classList.remove('scale-95', 'opacity-0');
            modal.firstElementChild.classList.add('scale-100', 'opacity-100');
        }, 10);
    },

    closeModal() {
        const modal = document.getElementById('otp-modal');
        modal.firstElementChild.classList.remove('scale-100', 'opacity-100');
        modal.firstElementChild.classList.add('scale-95', 'opacity-0');
        setTimeout(() => modal.classList.add('hidden'), 200);
    }
};

window.requestOTP = () => window.ProfileApp.requestOTP();
window.closeOtpModal = () => window.ProfileApp.closeModal();

document.addEventListener("DOMContentLoaded", () => window.ProfileApp.init());