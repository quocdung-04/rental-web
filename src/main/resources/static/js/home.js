(function () {
    const AVAILABLE_LIMIT = 3;

    const grid = document.getElementById('listingGrid');
    const message = document.getElementById('message');
    const form = document.getElementById('searchForm');
    const keywordInput = document.getElementById('keyword');
    const districtSelect = document.getElementById('district');
    const btnToggle = document.getElementById('btnToggle');
    const eyebrow = document.getElementById('listEyebrow');
    const title = document.getElementById('listTitle');
    const lead = document.getElementById('listLead');

    const DEFAULT_LEAD = 'Rent is listed as a monthly figure in Vietnamese dong. Availability is updated by the property manager, not guessed from a photo.';
    const ARROW = ' <svg class="icon"><use href="#i-arrow-right"/></svg>';

    let mode = 'available'; // 'available' | 'search' | 'all'

    function icon(name) {
        return '<svg class="icon"><use href="#i-' + name + '"/></svg>';
    }

    function cardHtml(p) {
        const available = p.availabilityStatus === 'AVAILABLE';
        const img = p.imageUrl
            ? '<img src="' + esc(p.imageUrl) + '" alt="' + esc(p.title) + '" loading="lazy">'
            : '';
        return '<a class="apt-card" href="property.html?id=' + encodeURIComponent(p.propertyId) + '" aria-label="View ' + esc(p.title) + '">'
            + '<div class="apt-photo">' + img
            + '<span class="pill pill-status ' + (available ? 'is-available' : 'is-rented') + '"><i></i>' + (available ? 'Available' : 'Rented') + '</span>'
            + '<span class="pill pill-price">' + formatVnd(p.monthlyRent) + '</span>'
            + '</div>'
            + '<div class="apt-body">'
            + '<h3>' + esc(p.title) + ', ' + esc(p.district) + '</h3>'
            + '<p class="apt-address">' + icon('pin') + esc(p.address) + ' &middot; ' + esc(p.district) + '</p>'
            + '<ul class="apt-meta">'
            + '<li>' + icon('bed') + p.bedrooms + ' bed</li>'
            + '<li>' + icon('bath') + p.bathrooms + ' bath</li>'
            + '<li>' + icon('ruler') + p.areaSqm + ' m&sup2;</li>'
            + '</ul></div></a>';
    }

    function showMessage(text, type) {
        message.className = 'msg msg-' + type;
        message.textContent = text;
    }

    function clearMessage() {
        message.className = '';
        message.textContent = '';
    }

    function setHeading(kind, headline, text, buttonLabel) {
        eyebrow.textContent = kind;
        title.textContent = headline;
        lead.textContent = text;
        btnToggle.innerHTML = buttonLabel + ARROW;
    }

    async function loadList(params, limit) {
        clearMessage();
        grid.innerHTML = '<p class="loading">Loading apartments…</p>';
        try {
            const query = new URLSearchParams(params).toString();
            let list = await api.get('/properties' + (query ? '?' + query : ''));
            if (limit) {
                list = list.slice(0, limit);
            }
            if (list.length === 0) {
                grid.innerHTML = '';
                showMessage('No apartments match your search. Try a different street, district or keyword.', 'info');
                return 0;
            }
            grid.innerHTML = list.map(cardHtml).join('');
            return list.length;
        } catch (err) {
            grid.innerHTML = '';
            showMessage(err.message, 'error');
            return -1;
        }
    }

    function showAvailable() {
        mode = 'available';
        setHeading('Available now', 'Apartments you can view this week', DEFAULT_LEAD, 'Browse all listings');
        return loadList({ status: 'AVAILABLE' }, AVAILABLE_LIMIT);
    }

    async function showAll() {
        mode = 'all';
        setHeading('All listings', 'Every apartment we manage',
            'Available and already rented homes. Rented ones show their status so you know what to skip.', 'Show available only');
        const n = await loadList({}, 0);
        if (n > 0) {
            lead.textContent = n + ' apartments in total. Available and already rented homes are both shown.';
        }
    }

    async function runSearch() {
        const keyword = keywordInput.value.trim();
        const district = districtSelect.value;
        if (!keyword && !district) {
            keywordInput.focus();
            showAvailable();
            return;
        }
        mode = 'search';
        const params = {};
        if (keyword) { params.keyword = keyword; }
        if (district) { params.district = district; }
        const n = await loadList(params, 0);
        const what = [keyword ? '“' + keyword + '”' : null, district || null].filter(Boolean).join(' in ');
        setHeading('Search results', n > 0 ? n + (n === 1 ? ' apartment found' : ' apartments found') : 'No apartments found',
            'Showing results for ' + what + '.', 'Back to available now');
        document.getElementById('listings').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    async function loadStats() {
        try {
            const s = await api.get('/properties/stats');
            document.getElementById('statTotal').textContent = s.totalProperties;
            document.getElementById('statAvailable').textContent = s.availableProperties;
            document.getElementById('statDistricts').textContent = s.districts.length;
            districtSelect.innerHTML = '<option value="">Any district</option>'
                + s.districts.map(function (d) { return '<option value="' + esc(d) + '">' + esc(d) + '</option>'; }).join('');
        } catch (err) {
            // The list below already shows the connection error; leave the numbers as dashes.
        }
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        runSearch();
    });

    btnToggle.addEventListener('click', function () {
        if (mode === 'available') {
            showAll();
        } else {
            form.reset();
            showAvailable();
        }
    });

    loadStats();
    showAvailable();
})();
