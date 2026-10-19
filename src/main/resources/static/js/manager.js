(function () {
    // ------------------------------------------------------------------ DOM
    const $ = function (id) { return document.getElementById(id); };
    const loginPanel = $('loginPanel');
    const dashboard = $('dashboard');
    const btnSignOut = $('btnSignOut');
    const message = $('message');
    const tableHead = $('tableHead');
    const tableBody = $('tableBody');
    const filterKeyword = $('filterKeyword');
    const filterStatus = $('filterStatus');
    const filterStatusWrap = $('filterStatusWrap');
    const formDialog = $('formDialog');
    const recordForm = $('recordForm');
    const detailDialog = $('detailDialog');
    const confirmDialog = $('confirmDialog');

    // ------------------------------------------------------------------ helpers
    const LABELS = {
        PENDING: 'Pending', IN_PROGRESS: 'In progress', DONE: 'Done',
        AVAILABLE: 'Available', RENTED: 'Rented'
    };

    function badge(value) {
        return '<span class="badge badge-' + esc(String(value).toLowerCase().replace('_', '-')) + '">'
            + esc(LABELS[value] || value) + '</span>';
    }

    function truncate(text, max) {
        text = String(text == null ? '' : text);
        return text.length > max ? text.slice(0, max - 1) + '…' : text;
    }

    function fmtDate(iso) {
        return iso ? new Date(iso).toLocaleDateString('en-GB') : '';
    }

    function fmtDateTime(iso) {
        return iso ? new Date(iso).toLocaleString('en-GB') : '';
    }

    function showMessage(text, type) {
        message.className = 'msg msg-' + type;
        message.textContent = text;
    }

    function clearMessage() {
        message.className = '';
        message.textContent = '';
    }

    // ------------------------------------------------------------------ resource definitions
    // One entry per table. The list, form, detail view and delete flow are all generated from this.
    const REQUEST_STATUSES = [['PENDING', 'Pending'], ['IN_PROGRESS', 'In progress'], ['DONE', 'Done']];
    const PROPERTY_STATUSES = [['AVAILABLE', 'Available'], ['RENTED', 'Rented']];
    const CATEGORIES = [['PLUMBING', 'Plumbing'], ['ELECTRICAL', 'Electrical'], ['AIR_CONDITIONING', 'Air conditioning'],
        ['APPLIANCES', 'Appliances'], ['STRUCTURE', 'Doors, windows & walls'], ['PEST_CONTROL', 'Pest control'], ['OTHER', 'Other']];
    const PRIORITIES = [['LOW', 'Low'], ['NORMAL', 'Normal'], ['HIGH', 'High']];
    CATEGORIES.concat(PRIORITIES).forEach(function (c) { LABELS[c[0]] = c[1]; });

    const resources = {
        requests: {
            title: 'Maintenance requests',
            lead: 'Reports from tenants. Move them from Pending to In progress to Done. A Done request is locked.',
            singular: 'maintenance request',
            addLabel: 'Add request',
            path: '/maintenance-requests',
            idField: 'requestId',
            searchPlaceholder: 'Search tenant, apartment or description',
            statuses: REQUEST_STATUSES,
            columns: [
                { label: 'Ref', render: function (r) { return esc(r.referenceCode || r.requestId); } },
                { label: 'Reported', render: function (r) { return esc(fmtDate(r.createdAt)); } },
                { label: 'Tenant', render: function (r) { return esc(r.tenantName); } },
                { label: 'Apartment', render: function (r) { return esc(r.propertyTitle); } },
                { label: 'Category', render: function (r) { return esc(LABELS[r.category] || r.category); } },
                { label: 'Issue', render: function (r) { return esc(truncate(r.description, 50)); } },
                { label: 'Priority', render: function (r) { return badge(r.priority); } },
                { label: 'Status', render: function (r) { return badge(r.status); } }
            ],
            fields: [
                { name: 'tenantId', label: 'Tenant', type: 'select', numeric: true, required: true, options: tenantOptions },
                { name: 'propertyId', label: 'Apartment (rented only)', type: 'select', numeric: true, required: true, options: rentedPropertyOptions },
                { name: 'category', label: 'Category', type: 'select', required: true, options: function () { return CATEGORIES; } },
                { name: 'priority', label: 'Priority', type: 'select', required: true, options: function () { return PRIORITIES; } },
                { name: 'description', label: 'Description', type: 'textarea', required: true, minLength: 10, maxLength: 2000, wide: true },
                { name: 'status', label: 'Status', type: 'select', required: true, options: function () { return REQUEST_STATUSES; } }
            ],
            defaults: { status: 'PENDING', category: 'OTHER', priority: 'NORMAL' },
            details: function (r) {
                return [
                    ['Reference', r.referenceCode || r.requestId],
                    ['Category', LABELS[r.category] || r.category],
                    ['Priority', LABELS[r.priority] || r.priority],
                    ['Reported', fmtDateTime(r.createdAt)],
                    ['Status', LABELS[r.status] || r.status],
                    ['Tenant', r.tenantName + ' (ID ' + r.tenantId + ')'],
                    ['Tenant email', r.tenantEmail],
                    ['Tenant phone', r.tenantPhone],
                    ['Apartment', r.propertyTitle + ' (ID ' + r.propertyId + ')'],
                    ['Address', r.propertyAddress],
                    ['Description', r.description]
                ];
            },
            describe: function (r) { return 'request ' + (r.referenceCode || '#' + r.requestId) + ' from ' + r.tenantName; }
        },

        properties: {
            title: 'Properties',
            lead: 'Apartment listings shown on the homepage. A property with maintenance requests cannot be deleted.',
            singular: 'property',
            addLabel: 'Add property',
            path: '/properties',
            idField: 'propertyId',
            searchPlaceholder: 'Search title, address or district',
            statuses: PROPERTY_STATUSES,
            columns: [
                { label: 'ID', render: function (p) { return esc(p.propertyId); } },
                { label: 'Title', render: function (p) { return esc(p.title); } },
                { label: 'District', render: function (p) { return esc(p.district); } },
                { label: 'Rent / month', render: function (p) { return esc(formatVnd(p.monthlyRent)); } },
                { label: 'Size', render: function (p) { return esc(p.bedrooms + ' bed · ' + p.bathrooms + ' bath · ' + p.areaSqm + ' m²'); } },
                { label: 'Status', render: function (p) { return badge(p.availabilityStatus); } }
            ],
            fields: [
                { name: 'title', label: 'Title', type: 'text', required: true, maxLength: 120 },
                { name: 'district', label: 'District', type: 'text', required: true, maxLength: 60 },
                { name: 'address', label: 'Address', type: 'text', required: true, maxLength: 255, wide: true },
                { name: 'monthlyRent', label: 'Monthly rent (VND)', type: 'number', required: true, min: 1, step: '1000' },
                { name: 'availabilityStatus', label: 'Availability', type: 'select', required: true, options: function () { return PROPERTY_STATUSES; } },
                { name: 'bedrooms', label: 'Bedrooms', type: 'number', required: true, min: 0, max: 20, step: '1' },
                { name: 'bathrooms', label: 'Bathrooms', type: 'number', required: true, min: 0, max: 20, step: '1' },
                { name: 'areaSqm', label: 'Area (m²)', type: 'number', required: true, min: 1, max: 5000, step: '1' },
                { name: 'imageUrl', label: 'Image (images/apt-1.jpg or a link, optional)', type: 'text', maxLength: 255, wide: true },
                { name: 'description', label: 'Description (shown on the detail page, optional)', type: 'textarea', maxLength: 1000, wide: true }
            ],
            defaults: { availabilityStatus: 'AVAILABLE', bedrooms: 1, bathrooms: 1 },
            details: function (p) {
                return [
                    ['Property ID', p.propertyId],
                    ['Title', p.title],
                    ['Address', p.address],
                    ['District', p.district],
                    ['Monthly rent', formatVnd(p.monthlyRent)],
                    ['Availability', LABELS[p.availabilityStatus] || p.availabilityStatus],
                    ['Bedrooms', p.bedrooms],
                    ['Bathrooms', p.bathrooms],
                    ['Area', p.areaSqm + ' m²'],
                    ['Image', p.imageUrl || '—'],
                    ['Description', p.description || '—']
                ];
            },
            describe: function (p) { return 'property “' + p.title + '”'; }
        },

        tenants: {
            title: 'Tenants',
            lead: 'People who rent or have reported an issue. A tenant with maintenance requests cannot be deleted.',
            singular: 'tenant',
            addLabel: 'Add tenant',
            path: '/tenants',
            idField: 'tenantId',
            searchPlaceholder: 'Search name, email or phone',
            statuses: null,
            columns: [
                { label: 'ID', render: function (t) { return esc(t.tenantId); } },
                { label: 'Full name', render: function (t) { return esc(t.fullName); } },
                { label: 'Email', render: function (t) { return esc(t.email); } },
                { label: 'Phone', render: function (t) { return esc(t.phone); } }
            ],
            fields: [
                { name: 'fullName', label: 'Full name', type: 'text', required: true, maxLength: 100, wide: true },
                { name: 'email', label: 'Email', type: 'email', required: true, maxLength: 100 },
                { name: 'phone', label: 'Phone', type: 'tel', required: true, maxLength: 20 }
            ],
            defaults: {},
            details: function (t) {
                return [['Tenant ID', t.tenantId], ['Full name', t.fullName], ['Email', t.email], ['Phone', t.phone]];
            },
            describe: function (t) { return 'tenant ' + t.fullName; }
        }
    };

    // Option loaders for the request form (return [value, label] pairs)
    async function tenantOptions() {
        const list = await api.get('/tenants');
        return list.map(function (t) { return [t.tenantId, t.fullName + ' — ' + t.email]; });
    }

    async function rentedPropertyOptions(record) {
        const list = await api.get('/properties');
        return list
            .filter(function (p) {
                return p.availabilityStatus === 'RENTED' || (record && record.propertyId === p.propertyId);
            })
            .map(function (p) { return [p.propertyId, p.title + ' — ' + p.address]; });
    }

    // ------------------------------------------------------------------ state
    let current = 'requests';
    let rows = [];
    let editing = null;      // the record being edited, or null when adding
    let pendingDelete = null;
    let searchTimer = null;

    // ------------------------------------------------------------------ session
    function isSignedIn() {
        return !!sessionStorage.getItem(MANAGER_TOKEN_KEY);
    }

    function showLogin(note) {
        sessionStorage.removeItem(MANAGER_TOKEN_KEY);
        setVisible(dashboard, false);
        setVisible(btnSignOut, false);
        setVisible(loginPanel, true);
        const box = $('loginMessage');
        if (note) {
            box.className = 'msg msg-info';
            box.textContent = note;
        } else {
            box.className = '';
            box.textContent = '';
        }
    }

    function showDashboard() {
        setVisible(loginPanel, false);
        setVisible(dashboard, true);
        setVisible(btnSignOut, true);
        switchTab(current);
    }

    // Any call that comes back 401 sends the manager back to the sign-in form.
    function handleError(err) {
        if (err && err.status === 401) {
            closeAllDialogs();
            showLogin('Your session ended. Please sign in again.');
            return;
        }
        showMessage(err.message, 'error');
    }

    $('loginForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        const box = $('loginMessage');
        const username = $('username').value.trim();
        const password = $('password').value;
        if (!username || !password) {
            box.className = 'msg msg-error';
            box.textContent = 'Enter your username and password.';
            return;
        }
        try {
            const res = await api.post('/auth/login', { username: username, password: password });
            sessionStorage.setItem(MANAGER_TOKEN_KEY, res.token);
            $('password').value = '';
            box.className = '';
            box.textContent = '';
            showDashboard();
        } catch (err) {
            box.className = 'msg msg-error';
            box.textContent = err.message;
        }
    });

    btnSignOut.addEventListener('click', async function () {
        try { await api.post('/auth/logout'); } catch (err) { /* token is dropped either way */ }
        showLogin('You are signed out.');
    });

    // ------------------------------------------------------------------ tabs + list
    function switchTab(key) {
        current = key;
        const res = resources[key];
        document.querySelectorAll('.tab').forEach(function (t) {
            const on = t.getAttribute('data-tab') === key;
            t.classList.toggle('is-active', on);
            t.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        $('panelTitle').textContent = res.title;
        $('panelLead').textContent = res.lead;
        $('btnAddLabel').textContent = res.addLabel;
        filterKeyword.value = '';
        filterKeyword.placeholder = res.searchPlaceholder;
        if (res.statuses) {
            filterStatus.innerHTML = '<option value="">All statuses</option>'
                + res.statuses.map(function (s) { return '<option value="' + esc(s[0]) + '">' + esc(s[1]) + '</option>'; }).join('');
        }
        setVisible(filterStatusWrap, !!res.statuses);
        tableHead.innerHTML = '<tr>' + res.columns.map(function (c) { return '<th scope="col">' + esc(c.label) + '</th>'; }).join('')
            + '<th scope="col"><span class="sr-only">Actions</span></th></tr>';
        clearMessage();
        loadRows();
    }

    async function loadRows() {
        const res = resources[current];
        const params = new URLSearchParams();
        if (filterKeyword.value.trim()) { params.set('keyword', filterKeyword.value.trim()); }
        if (res.statuses && filterStatus.value) { params.set('status', filterStatus.value); }
        const colSpan = res.columns.length + 1;
        tableBody.innerHTML = '<tr><td colspan="' + colSpan + '" class="loading">Loading…</td></tr>';
        try {
            const query = params.toString();
            rows = await api.get(res.path + (query ? '?' + query : ''));
            $('resultCount').textContent = rows.length + (rows.length === 1 ? ' record' : ' records');
            if (rows.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="' + colSpan + '" class="empty">No ' + esc(res.singular) + 's found.</td></tr>';
                return;
            }
            tableBody.innerHTML = rows.map(function (row) {
                const id = row[res.idField];
                return '<tr>'
                    + res.columns.map(function (c) { return '<td>' + c.render(row) + '</td>'; }).join('')
                    + '<td class="row-actions">'
                    + '<button type="button" class="btn btn-outline btn-sm" data-action="view" data-id="' + esc(id) + '">View</button> '
                    + '<button type="button" class="btn btn-outline btn-sm" data-action="edit" data-id="' + esc(id) + '">Edit</button> '
                    + '<button type="button" class="btn btn-danger btn-sm" data-action="delete" data-id="' + esc(id) + '">Delete</button>'
                    + '</td></tr>';
            }).join('');
        } catch (err) {
            tableBody.innerHTML = '';
            $('resultCount').textContent = '';
            handleError(err);
        }
    }

    document.querySelectorAll('.tab').forEach(function (t) {
        t.addEventListener('click', function () { switchTab(t.getAttribute('data-tab')); });
    });

    filterKeyword.addEventListener('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(loadRows, 300);
    });
    filterStatus.addEventListener('change', loadRows);

    tableBody.addEventListener('click', function (e) {
        const btn = e.target.closest('button[data-action]');
        if (!btn) { return; }
        const res = resources[current];
        const id = btn.getAttribute('data-id');
        const row = rows.find(function (r) { return String(r[res.idField]) === id; });
        if (!row) { return; }
        const action = btn.getAttribute('data-action');
        if (action === 'view') { openDetail(id); }
        else if (action === 'edit') { openForm(row); }
        else if (action === 'delete') { openConfirm(row); }
    });

    $('btnAdd').addEventListener('click', function () { openForm(null); });

    // ------------------------------------------------------------------ view one record (GET /{id})
    async function openDetail(id) {
        const res = resources[current];
        clearMessage();
        try {
            const rec = await api.get(res.path + '/' + id);
            $('detailTitle').textContent = res.singular.charAt(0).toUpperCase() + res.singular.slice(1) + ' #' + id;
            $('detailList').innerHTML = res.details(rec).map(function (pair) {
                return '<div class="detail-row"><dt>' + esc(pair[0]) + '</dt><dd>' + esc(pair[1]) + '</dd></div>';
            }).join('');
            detailDialog.showModal();
        } catch (err) {
            handleError(err);
        }
    }

    $('btnDetailClose').addEventListener('click', function () { detailDialog.close(); });

    // ------------------------------------------------------------------ add / edit form
    function controlHtml(f) {
        const id = 'f_' + f.name;
        const common = ' id="' + id + '" name="' + f.name + '"' + (f.maxLength ? ' maxlength="' + f.maxLength + '"' : '');
        if (f.type === 'textarea') { return '<textarea' + common + ' rows="4"></textarea>'; }
        if (f.type === 'select') { return '<select' + common + '></select>'; }
        let attrs = '';
        if (f.min != null) { attrs += ' min="' + f.min + '"'; }
        if (f.max != null) { attrs += ' max="' + f.max + '"'; }
        if (f.step) { attrs += ' step="' + f.step + '"'; }
        return '<input type="' + f.type + '"' + common + attrs + '>';
    }

    async function openForm(record) {
        const res = resources[current];
        editing = record;
        $('formMessage').className = '';
        $('formMessage').textContent = '';
        $('formTitle').textContent = (record ? 'Edit ' : 'Add ') + res.singular + (record ? ' #' + record[res.idField] : '');

        $('formFields').innerHTML = res.fields.map(function (f) {
            return '<div class="form-row' + (f.wide ? ' form-row-wide' : '') + '">'
                + '<label for="f_' + f.name + '">' + esc(f.label) + (f.required ? ' <span class="req">*</span>' : '') + '</label>'
                + controlHtml(f)
                + '<p class="field-error" data-for="' + f.name + '"></p></div>';
        }).join('');

        try {
            for (const f of res.fields) {
                const el = $('f_' + f.name);
                if (f.type === 'select') {
                    const opts = await f.options(record);
                    el.innerHTML = '<option value="">Choose…</option>'
                        + opts.map(function (o) { return '<option value="' + esc(o[0]) + '">' + esc(o[1]) + '</option>'; }).join('');
                }
                const value = record ? record[f.name] : res.defaults[f.name];
                el.value = value == null ? '' : value;
            }
        } catch (err) {
            handleError(err);
            return;
        }
        formDialog.showModal();
        const first = recordForm.querySelector('input, select, textarea');
        if (first) { first.focus(); }
    }

    function readValues(res) {
        const body = {};
        res.fields.forEach(function (f) {
            let v = $('f_' + f.name).value.trim();
            if (f.type === 'tel') { v = cleanPhone(v); }
            if (v === '') {
                body[f.name] = f.required ? '' : null;
            } else if (f.type === 'number' || f.numeric) {
                body[f.name] = Number(v);
            } else {
                body[f.name] = v;
            }
        });
        return body;
    }

    // Same rules as the server for instant feedback; the server remains the final judge.
    function validate(res, body) {
        const errors = {};
        res.fields.forEach(function (f) {
            const v = body[f.name];
            const empty = v === '' || v == null;
            if (empty) {
                if (f.required) { errors[f.name] = f.label.replace(/ \(.*\)/, '') + ' is required'; }
                return;
            }
            if (typeof v === 'number' && isNaN(v)) { errors[f.name] = 'Enter a valid number'; }
            else if (f.min != null && typeof v === 'number' && v < f.min) { errors[f.name] = 'Must be at least ' + f.min; }
            else if (f.max != null && typeof v === 'number' && v > f.max) { errors[f.name] = 'Must be ' + f.max + ' or less'; }
            else if (f.minLength && String(v).length < f.minLength) { errors[f.name] = 'Must be at least ' + f.minLength + ' characters'; }
            else if (f.type === 'email' && !EMAIL_RE.test(v)) { errors[f.name] = 'Enter a valid email address'; }
            else if (f.type === 'tel' && !PHONE_RE.test(v)) { errors[f.name] = 'Phone must be 9-14 digits, optionally starting with +'; }
        });
        return errors;
    }

    recordForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const res = resources[current];
        const box = $('formMessage');
        box.className = '';
        box.textContent = '';
        const body = readValues(res);
        const errors = validate(res, body);
        showFieldErrors(recordForm, errors);
        if (Object.keys(errors).length > 0) {
            box.className = 'msg msg-error';
            box.textContent = 'Please fix the highlighted fields and try again.';
            return;
        }
        const btn = $('btnFormSave');
        btn.disabled = true;
        try {
            if (editing) {
                await api.put(res.path + '/' + editing[res.idField], body);
            } else {
                await api.post(res.path, body);
            }
            formDialog.close();
            showMessage(editing ? 'Saved: the ' + res.singular + ' was updated.' : 'Created: the ' + res.singular + ' was added.', 'success');
            await loadRows();
        } catch (err) {
            if (err.status === 401) { handleError(err); return; }
            showFieldErrors(recordForm, err.errors);
            box.className = 'msg msg-error';
            box.textContent = err.message;
        } finally {
            btn.disabled = false;
        }
    });

    $('btnFormCancel').addEventListener('click', function () { formDialog.close(); });

    // ------------------------------------------------------------------ delete with confirmation
    function openConfirm(row) {
        const res = resources[current];
        pendingDelete = { res: res, id: row[res.idField], label: res.describe(row) };
        $('confirmText').textContent = 'You are about to delete ' + pendingDelete.label + '. This cannot be undone.';
        confirmDialog.showModal();
    }

    $('btnConfirmNo').addEventListener('click', function () {
        pendingDelete = null;
        confirmDialog.close();
    });

    $('btnConfirmYes').addEventListener('click', async function () {
        if (!pendingDelete) { return; }
        const target = pendingDelete;
        pendingDelete = null;
        confirmDialog.close();
        try {
            await api.del(target.res.path + '/' + target.id);
            showMessage('Deleted ' + target.label + '.', 'success');
            await loadRows();
        } catch (err) {
            // e.g. 409 when the record is still referenced by maintenance requests
            handleError(err);
        }
    });

    function closeAllDialogs() {
        [formDialog, detailDialog, confirmDialog].forEach(function (d) { if (d.open) { d.close(); } });
    }

    // ------------------------------------------------------------------ start
    if (isSignedIn()) {
        showDashboard();
    } else {
        showLogin(null);
    }
})();
