-- Sample data. Rows are only inserted when their address is not in the table yet, so restarts never duplicate them.
INSERT INTO dbo.properties
    (title, address, district, monthly_rent, availability_status, bedrooms, bathrooms, area_sqm, image_url)
SELECT v.title, v.address, v.district, v.monthly_rent, v.availability_status, v.bedrooms, v.bathrooms, v.area_sqm, v.image_url
FROM (VALUES
    (N'Garden View 3BR',       N'118 Hoang Van Thu, Ward 9',      N'Phu Nhuan', 32000000, 'AVAILABLE', 3, 2, 112, 'images/apt-1.jpg'),
    (N'Skyline Duplex',        N'20 Ton Duc Thang, Ben Nghe',     N'District 1', 48000000, 'AVAILABLE', 4, 3, 165, 'images/apt-2.jpg'),
    (N'Rooftop Penthouse',     N'88 Nguyen Huu Canh, Ward 22',    N'Binh Thanh', 55000000, 'AVAILABLE', 3, 3, 180, 'images/apt-3.jpg'),
    (N'Riverside Loft',        N'15 Nguyen Van Huong, Thao Dien', N'District 2', 26000000, 'RENTED',    2, 2,  85, 'images/apt-4.jpg'),
    (N'Newtown Legend 2BR',    N'42 Nguyen Luong Bang, Tan Phu',  N'District 7', 21000000, 'RENTED',    2, 2,  78, 'images/apt-5.jpg'),
    (N'Garden District Villa', N'9 Cong Hoa, Ward 4',             N'Tan Binh',   38000000, 'RENTED',    4, 3, 140, 'images/apt-6.jpg'),
    (N'Parkview Residence',    N'67 Vo Van Tan, Ward 6',          N'District 3', 29000000, 'RENTED',    3, 2,  96, 'images/apt-7.jpg'),
    (N'Sunset Tower Studio',   N'101 Huynh Tan Phat, Tan Thuan',  N'District 7', 14000000, 'RENTED',    1, 1,  46, 'images/apt-8.jpg')
) AS v (title, address, district, monthly_rent, availability_status, bedrooms, bathrooms, area_sqm, image_url)
WHERE NOT EXISTS (SELECT 1 FROM dbo.properties p WHERE p.address = v.address);

-- Sample tenants (inserted only when the email is not in the table yet).
INSERT INTO dbo.tenants (full_name, email, phone)
SELECT v.full_name, v.email, v.phone
FROM (VALUES
    (N'Nguyễn Minh Anh', 'minh.anh@example.com', '0901234567'),
    (N'Trần Quốc Bảo',   'quoc.bao@example.com',  '0912345678'),
    (N'Lê Thu Hà',       'thu.ha@example.com',    '0923456789'),
    (N'Phạm Đức Khoa',   'duc.khoa@example.com',  '0934567890')
) AS v (full_name, email, phone)
WHERE NOT EXISTS (SELECT 1 FROM dbo.tenants t WHERE t.email = v.email);

-- Sample maintenance requests (tenant and apartment are looked up by email / address).
INSERT INTO dbo.maintenance_requests (tenant_id, property_id, description, status, category, priority)
SELECT t.tenant_id, p.property_id, v.description, v.status, v.category, v.priority
FROM (VALUES
    ('minh.anh@example.com', N'15 Nguyen Van Huong, Thao Dien', N'Kitchen sink leaks under the cabinet.',          'PENDING',     'PLUMBING',         'NORMAL'),
    ('quoc.bao@example.com', N'42 Nguyen Luong Bang, Tan Phu',  N'Air conditioner in the bedroom is not cooling.', 'IN_PROGRESS', 'AIR_CONDITIONING', 'NORMAL'),
    ('thu.ha@example.com',   N'9 Cong Hoa, Ward 4',             N'Front gate lock is jammed.',                     'DONE',        'STRUCTURE',        'HIGH'),
    ('duc.khoa@example.com', N'67 Vo Van Tan, Ward 6',          N'Bathroom light flickers when switched on.',      'PENDING',     'ELECTRICAL',       'LOW')
) AS v (email, address, description, status, category, priority)
JOIN dbo.tenants t ON t.email = v.email
JOIN dbo.properties p ON p.address = v.address
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.maintenance_requests r
    WHERE r.tenant_id = t.tenant_id AND r.property_id = p.property_id AND r.description = v.description);

-- Reference codes (MR-000001 ...) for any request that does not have one yet.
UPDATE dbo.maintenance_requests
SET reference_code = 'MR-' + RIGHT('000000' + CAST(request_id AS VARCHAR(10)), 6)
WHERE reference_code IS NULL;

-- Listing descriptions for the property detail page (only filled while still empty).
UPDATE p SET p.description = v.description
FROM dbo.properties p
JOIN (VALUES
    (N'118 Hoang Van Thu, Ward 9',      N'A spacious three-bedroom home on the quiet side of the block, overlooking the internal garden rather than the street. The kitchen has pale marble counters and a full-size oven, and there is a separate laundry corner off the service balcony.'),
    (N'20 Ton Duc Thang, Ben Nghe',     N'A duplex on the upper floors of a small, well-kept building in the middle of the city. Bedrooms sit on the quiet rear side; the living floor opens onto a wide terrace with an unobstructed view toward the river.'),
    (N'88 Nguyen Huu Canh, Ward 22',    N'The top floor of a 12-unit building, with a private plunge pool and a planted terrace that runs the full width of the apartment. Best viewed in the late afternoon, when the light comes across the river.'),
    (N'15 Nguyen Van Huong, Thao Dien', N'An open-plan loft with floor-to-ceiling windows facing the river, exposed concrete ceilings and warm oak floors. The sleeping area is separated from the living space by a sliding screen.'),
    (N'42 Nguyen Luong Bang, Tan Phu',  N'A two-bedroom apartment in a modern tower on a tree-lined promenade. Both bedrooms open onto a balcony, and the building has a gym, a pool and covered parking.'),
    (N'9 Cong Hoa, Ward 4',             N'A two-storey villa with a tiled pitched roof and a small front garden shaded by a frangipani tree. Four bedrooms, a family kitchen and off-street parking for two motorbikes.'),
    (N'67 Vo Van Tan, Ward 6',          N'A bright three-bedroom apartment whose living room looks straight onto a city park. Built-in bookshelves, an oak floor and good afternoon light throughout.'),
    (N'101 Huynh Tan Phat, Tan Thuan',  N'A compact, tidy studio with a sleeping nook and a small dining table by the window. Warm sunset light in the evenings and a short walk to the district''s main street.')
) AS v (address, description) ON p.address = v.address
WHERE p.description IS NULL;
