(function() {
    window.initCentersList = function() {
        const searchInput = document.getElementById('centerSearch');
        const centerRows = document.querySelectorAll('.center-row');

        if (!searchInput) return;

        // Ensure we don't attach multiple listeners if re-initialized
        searchInput.removeEventListener('input', handleSearch);
        searchInput.addEventListener('input', handleSearch);

        function handleSearch(e) {
            const term = e.target.value.toLowerCase().trim();
            
            centerRows.forEach(row => {
                const centerNameEl = row.querySelector('.center-name-text');
                if (!centerNameEl) return;
                
                const centerName = centerNameEl.textContent.toLowerCase();
                if (centerName.includes(term)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        }
    };

    // Attach immediately if DOM is ready, otherwise wait for it
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', window.initCentersList);
    } else {
        window.initCentersList();
    }
})();