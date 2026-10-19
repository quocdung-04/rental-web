# AnCư - Apartment Rental and Maintenance Portal

Group Web Mini Project, **Option 5**. Tenants browse rental properties and report maintenance issues; property managers manage listings and requests.

**Stack:** HTML/CSS/JavaScript, Spring Boot (Java 17+), **SQL Server**, Swagger UI (springdoc), Maven.

## Status

| Page / feature | State |
|---|---|
| Homepage (`index.html`) - clicking an apartment card opens its detail page | Done |
| Property detail (`property.html?id=N`) - hero photo, description, key facts, rent per m², report link for rented units | Done |
| Report a maintenance issue (`report.html`) - public form, reference code, creates the tenant if the email is new | Done |
| Manager console (`manager.html`) - sign in, tabs for requests / properties / tenants, search, add, edit, view, delete with confirmation | Done |
| REST API: full CRUD for `tenants`, `properties`, `maintenance_requests` + `/api/reports` + `/api/auth` | Done |
| Postman collection (`docs/postman/`), ERD (`docs/ERD.md`), Dockerfile for deployment | Done |
| Deployment to a public URL, team contributions | **To do by the team** (see "Deploy" and "Team contributions") |

CSS for the new pages is in `static/css/pages.css` (loaded after `style.css`).

## Run locally

1. **SQL Server setup (once).** Use SQL Server 2019+ / Express, enable **SQL Server authentication** (mixed mode) and **TCP/IP on port 1433** (SQL Server Configuration Manager), and know the password of a login such as `sa`.
2. **Create an empty database** (SSMS or sqlcmd):

   ```sql
   CREATE DATABASE ancu_rentals;
   ```

   Tables and sample data are then created automatically on first start. (Alternatively run `db/schema.sql` and `db/sample-data.sql` in SSMS yourself.)
3. **Set credentials as environment variables** (never commit them):

   ```bash
   # macOS / Linux
   export DB_USERNAME=sa
   export DB_PASSWORD=your_password
   export MANAGER_USERNAME=manager        # optional, default: manager
   export MANAGER_PASSWORD=choose_one     # manager sign-in password

   # Windows PowerShell
   $env:DB_USERNAME="sa"; $env:DB_PASSWORD="your_password"; $env:MANAGER_PASSWORD="choose_one"
   ```

   If `MANAGER_PASSWORD` is not set, the app generates a random one and prints it in the console at startup
   (look for `Generated manager login`). Set it explicitly on the deployed site.

   `DB_PASSWORD` has no default: the app will not start until it is set.

   Optional `DB_URL` (default: `jdbc:sqlserver://localhost:1433;databaseName=ancu_rentals;encrypt=true;trustServerCertificate=true`).
4. **Start the app:**

   ```bash
   ./mvnw spring-boot:run        # Windows: mvnw.cmd spring-boot:run
   ```
5. Open:
   - Website: <http://localhost:8080>
   - Swagger UI: <http://localhost:8080/swagger-ui.html>

When building for deployment use `./mvnw clean package -DskipTests`.

## Database

ERD (PK = primary key, FK = foreign key):

```
tenants (tenant_id PK, full_name, email UNIQUE, phone)
    1 ──< maintenance_requests (request_id PK, tenant_id FK, property_id FK, description, status,
                          category, priority, reference_code, created_at)
properties (property_id PK, address UNIQUE, monthly_rent, availability_status,
            title, district, bedrooms, bathrooms, area_sqm, image_url, description)
    1 ──< maintenance_requests
```

Diagram version: `docs/ERD.md` (Mermaid) and `docs/ancu-rentals.dbml` (paste into dbdiagram.io).

Foreign keys use `NO ACTION`, so a tenant or property that still has requests cannot be deleted.

**Fields added beyond the four starter attributes** (agree these with the team before building more on top of them):

| Table | Added fields | Why |
|---|---|---|
| `properties` | `title`, `district`, `bedrooms`, `bathrooms`, `area_sqm`, `image_url`, `description` | Homepage cards, district filter, detail page |
| `maintenance_requests` | `status` (`PENDING`, `IN_PROGRESS`, `DONE`), `category`, `priority` (`LOW`, `NORMAL`, `HIGH`), `reference_code` (`MR-000012`), `created_at`; `description` allows 2000 characters | Repair workflow, report form |

Databases created by an earlier version are upgraded automatically on start (guarded `ALTER TABLE` at the end of `schema.sql`).

## API

Public = no sign-in. Everything else needs the header `X-Manager-Token` (get it from `POST /api/auth/login`;
in Swagger UI click **Authorize** and paste the token).

| Method | Endpoint | Access | Notes |
|---|---|---|---|
| POST | `/api/auth/login` | public | Body `{username, password}` -> `{token}` (valid 8 h) |
| POST | `/api/auth/logout` | manager | |
| GET | `/api/properties` | public | Optional `keyword`, `district`, `status` (`AVAILABLE` / `RENTED`) |
| GET | `/api/properties/stats` | public | `totalProperties`, `availableProperties`, `districts` |
| GET | `/api/properties/{id}` | public | 404 if not found |
| POST / PUT / DELETE | `/api/properties[/{id}]` | manager | Address must be unique; delete blocked while requests exist (409) |
| GET | `/api/tenants` | manager | Optional `keyword` (name, email, phone) |
| GET / POST / PUT / DELETE | `/api/tenants[/{id}]` | manager | Email must be unique; delete blocked while requests exist (409) |
| POST | `/api/reports` | public | `{fullName, email, phone, propertyId, category, priority, description}`; returns the request with its `referenceCode`; finds the tenant by email or creates it, then files a `PENDING` request |
| GET | `/api/maintenance-requests` | manager | Optional `keyword`, `status`, `propertyId`, `tenantId` |
| GET / POST / PUT / DELETE | `/api/maintenance-requests[/{id}]` | manager | Body `{tenantId, propertyId, description, status, category, priority}` |

Errors always look like `{"status": 400, "message": "...", "errors": {"field": "message"}}`
(400 validation, 401 not signed in, 404 not found, 409 business-rule conflict).

## Project-specific rules (enforced by the API)

1. A maintenance request can only be filed for a **RENTED** apartment.
2. A tenant cannot file the same **unfinished** issue twice for the same apartment (duplicate check ignores case).
3. A request that is **Done is locked**: it can be deleted but not edited.
4. A tenant or property that still has maintenance requests **cannot be deleted** (also enforced by the foreign keys).
5. A **RENTED** property that still has unfinished (not Done) requests **cannot be switched to AVAILABLE**.

## API testing (Postman)

Import `docs/postman/AnCu-Rentals.postman_collection.json` into Postman, set the collection variable
`managerPassword` (and `baseUrl` for the deployed site), then run the whole collection with the Collection Runner.
It covers sign-in, full CRUD on the three tables, search/filter, validation errors (400), missing token (401),
not found (404) and business-rule conflicts (409), and cleans up after itself.
`availablePropertyId` must be the id of an AVAILABLE apartment (sample data: `1`).

## Deploy

The repository has a `Dockerfile`, so it runs on Render as a **Web Service** (Runtime: Docker). Render does not host SQL Server,
so create the database on a SQL Server host that accepts internet connections (for example Azure SQL Database), create an empty
database, then set these environment variables on the web service:

| Variable | Value |
|---|---|
| `DB_URL` | `jdbc:sqlserver://<host>:1433;databaseName=<db>;encrypt=true;trustServerCertificate=false` |
| `DB_USERNAME` / `DB_PASSWORD` | database login |
| `MANAGER_USERNAME` / `MANAGER_PASSWORD` | manager sign-in for the website |

Tables and sample data are created on the first start. After deploying, put the URLs here:

- Website: _TODO_
- API base URL / Swagger UI: _TODO_ (`<site>/swagger-ui.html`)

## Images

Placeholder photos live in `src/main/resources/static/images/`. To replace them with AI-generated images, see `docs/IMAGE-PROMPTS.md` (file names, sizes and prompts).

## Project structure

```
src/main/java/com/example/demo/
    controller/  entity/  repository/  service/  dto/
src/main/resources/
    schema.sql  data.sql  application.properties
    static/   index.html  property.html  report.html  manager.html
              css/style.css  css/pages.css  js/api.js  js/home.js  js/property.js  js/report.js  js/manager.js  images/
java:         config/ (sign-in interceptor, Swagger)  exception/ (error JSON)
db/           schema.sql  sample-data.sql      (SSMS versions, optional)
docs/         ERD.md  ancu-rentals.dbml  postman/  IMAGE-PROMPTS.md
Dockerfile    (deploy on Render)
```

## Team contributions

| Member | Role | What they did |
|---|---|---|
| _Name 1_ | _e.g. backend_ | _TODO_ |
| _Name 2_ | _e.g. frontend_ | _TODO_ |
| _Name 3_ | _e.g. database + testing_ | _TODO_ |
