(function () {
    const $ = function (id) { return document.getElementById(id); };
    const form = $('reportForm');
    const message = $('message');
    const select = $('propertyId');
    const categorySelect = $('category');
    const description = $('description');
    const btnSubmit = $('btnSubmit');
    const successPanel = $('successPanel');

    const CATEGORIES = [
        ['PLUMBING', 'Plumbing', 'Taps, drains, toilets, leaks'],
        ['ELECTRICAL', 'Electrical', 'Sockets, lights, wiring, power'],
        ['AIR_CONDITIONING', 'Air conditioning', 'Cooling, remote, noise, dripping'],
        ['APPLIANCES', 'Appliances', 'Water heater, fridge, washer, stove'],
        ['STRUCTURE', 'Doors, windows & walls', 'Locks, hinges, cracks, ceiling, paint'],
        ['PEST_CONTROL', 'Pest control', 'Cockroaches, ants, termites, rodents'],
        ['OTHER', 'Other', 'Anything that does not fit above']
    ];

    categorySelect.innerHTML = CATEGORIES.map(function (c) {
        return '<option value="' + c[0] + '">' + esc(c[1]) + '</option>';
    }).join('');

    function updateCategoryHint() {
        const c = CATEGORIES.find(function (x) { return x[0] === categorySelect.value; });
        $('categoryHint').textContent = c ? c[2] : '';
    }

    function showMessage(text, type) {
        message.className = 'msg msg-' + type;
        message.textContent = text;
    }

    function clearMessage() {
        message.className = '';
        message.textContent = '';
    }

    async function loadApartments() {
        const wanted = new URLSearchParams(window.location.search).get('property');
        try {
            const list = await api.get('/properties?status=RENTED');
            if (list.length === 0) {
                select.innerHTML = '<option value="">No occupied apartments yet</option>';
                showMessage('There are no occupied apartments to report on right now.', 'info');
                return;
            }
            select.innerHTML = '<option value="">Select an apartment</option>'
                + list.map(function (p) {
                    return '<option value="' + esc(p.propertyId) + '">' + esc(p.title) + ' — ' + esc(p.address) + '</option>';
                }).join('');
            if (wanted && list.some(function (p) { return String(p.propertyId) === wanted; })) {
                select.value = wanted;
            }
        } catch (err) {
            select.innerHTML = '<option value="">Could not load apartments</option>';
            showMessage(err.message, 'error');
        }
    }

    function readForm() {
        return {
            propertyId: select.value ? Number(select.value) : null,
            fullName: $('fullName').value.trim(),
            email: $('email').value.trim(),
            phone: cleanPhone($('phone').value),
            category: categorySelect.value,
            priority: $('priority').value,
            description: description.value.trim()
        };
    }

    // Same rules as the server, so people get instant feedback. The server stays the final judge.
    function validate(d) {
        const errors = {};
        if (!d.propertyId) { errors.propertyId = 'Please choose your apartment'; }
        if (!d.fullName) { errors.fullName = 'Full name is required'; }
        if (!d.email) { errors.email = 'Email is required'; }
        else if (!EMAIL_RE.test(d.email)) { errors.email = 'Enter a valid email address'; }
        if (!d.phone) { errors.phone = 'Phone is required'; }
        else if (!PHONE_RE.test(d.phone)) { errors.phone = 'Phone must be 9-14 digits, optionally starting with +'; }
        if (!d.description) { errors.description = 'Please describe the problem'; }
        else if (d.description.length < 10) { errors.description = 'Description must be at least 10 characters'; }
        return errors;
    }

    description.addEventListener('input', function () { $('descCount').textContent = description.value.length; });
    categorySelect.addEventListener('change', updateCategoryHint);

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        clearMessage();
        const data = readForm();
        const errors = validate(data);
        showFieldErrors(form, errors);
        if (Object.keys(errors).length > 0) {
            showMessage('Please fix the highlighted fields and try again.', 'error');
            return;
        }
        btnSubmit.disabled = true;
        try {
            const created = await api.post('/reports', data);
            setVisible(form, false);
            $('refCode').textContent = created.referenceCode;
            $('successText').textContent = 'Thank you, ' + created.tenantName + '. Your request for ' + created.propertyTitle
                + ' was sent to the property manager. Its status is now Pending. Keep the reference code if you need to ask about it.';
            setVisible(successPanel, true);
            successPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (err) {
            showFieldErrors(form, err.errors);
            showMessage(err.message, 'error');
        } finally {
            btnSubmit.disabled = false;
        }
    });

    $('btnAnother').addEventListener('click', function () {
        const keep = select.value;
        form.reset();
        select.value = keep;
        $('descCount').textContent = '0';
        updateCategoryHint();
        showFieldErrors(form, null);
        clearMessage();
        setVisible(successPanel, false);
        setVisible(form, true);
        $('description').focus();
    });

    updateCategoryHint();
    loadApartments();
})();
