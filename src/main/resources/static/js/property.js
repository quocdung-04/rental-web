(function () {
    const $ = function (id) { return document.getElementById(id); };
    const message = $('message');

    function setStatus(el, available) {
        el.classList.toggle('is-available', available);
        el.classList.toggle('is-rented', !available);
        el.querySelector('span').textContent = available ? 'Available' : 'Rented';
    }

    function showError(text) {
        message.className = 'container msg msg-error';
        message.textContent = text;
        $('heroTitle').textContent = 'Apartment not found';
        $('crumbDistrict').textContent = 'Not found';
        $('heroStatus').style.display = 'none';
        document.querySelector('.hero-address').style.display = 'none';
    }

    function render(p) {
        const available = p.availabilityStatus === 'AVAILABLE';
        const title = p.title + ', ' + p.district;
        document.title = title + ' - AnCư';

        if (p.imageUrl) {
            const photo = $('photo');
            photo.onerror = function () { photo.style.display = 'none'; $('photoBtn').style.display = 'none'; };
            photo.src = p.imageUrl;
            photo.alt = title;
            photo.style.display = '';
            $('photoBtn').style.display = '';
            $('lightboxImg').src = p.imageUrl;
            $('lightboxImg').alt = title;
        }
        $('crumbDistrict').textContent = p.district;
        setStatus($('heroStatus'), available);
        $('heroTitle').textContent = title;
        $('heroAddress').textContent = p.address + ', ' + p.district;

        $('about').textContent = p.description || 'No description has been added for this apartment yet.';
        $('factBeds').textContent = p.bedrooms + ' bed';
        $('factBaths').textContent = p.bathrooms;
        $('factArea').textContent = p.areaSqm + ' m²';
        $('factDistrict').textContent = p.district;
        $('perSqm').textContent = formatVnd(Number(p.monthlyRent) / p.areaSqm)
            + ' per m² per month, based on ' + p.areaSqm + ' m² of floor area.';

        $('price').textContent = formatVnd(p.monthlyRent);
        setStatus($('sideStatus'), available);
        $('sideBeds').textContent = p.bedrooms + ' bed';
        $('sideArea').textContent = p.areaSqm + ' m²';
        $('sideDistrict').textContent = p.district;
        $('sideNote').textContent = available
            ? 'Viewings are arranged by the manager, Monday to Saturday.'
            : 'This apartment is currently rented. Browse the available listings for a similar home.';

        if (available) {
            $('helpText').textContent = 'Maintenance requests can only be filed against an occupied apartment. This one is not currently tenanted, so reporting is closed.';
        } else {
            $('helpText').textContent = 'If you live here, you can report it in a minute. The request is attached to this apartment and your tenant record.';
            const link = $('helpLink');
            link.href = 'report.html?property=' + encodeURIComponent(p.propertyId);
            link.style.display = '';
        }
        $('detail').style.display = '';
    }

    async function init() {
        const id = new URLSearchParams(window.location.search).get('id');
        if (!id || !/^\d+$/.test(id)) {
            showError('No apartment was selected. Go back to the listings and pick one.');
            return;
        }
        try {
            render(await api.get('/properties/' + id));
        } catch (err) {
            showError(err.status === 404 ? 'This apartment does not exist (it may have been removed).' : err.message);
        }
    }

    $('photoBtn').addEventListener('click', function () { $('lightbox').showModal(); });
    $('lightbox').addEventListener('click', function (e) {
        if (e.target === this) { this.close(); } // click on backdrop
    });

    init();
})();
