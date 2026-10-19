# ERD - AnCu Rentals

Mermaid diagram (GitHub renders it automatically). PK = primary key, FK = foreign key, UK = unique.

```mermaid
erDiagram
    TENANTS ||--o{ MAINTENANCE_REQUESTS : "submits"
    PROPERTIES ||--o{ MAINTENANCE_REQUESTS : "has"

    TENANTS {
        bigint tenant_id PK
        nvarchar full_name
        varchar email UK
        varchar phone
    }
    PROPERTIES {
        bigint property_id PK
        nvarchar address UK
        decimal monthly_rent
        varchar availability_status "AVAILABLE | RENTED"
        nvarchar title
        nvarchar district
        int bedrooms
        int bathrooms
        int area_sqm
        varchar image_url
        nvarchar description
    }
    MAINTENANCE_REQUESTS {
        bigint request_id PK
        bigint tenant_id FK
        bigint property_id FK
        nvarchar description
        varchar status "PENDING | IN_PROGRESS | DONE"
        varchar category
        varchar priority "LOW | NORMAL | HIGH"
        varchar reference_code
        datetime2 created_at
    }
```

Relationships: one tenant -> many requests; one property -> many requests; each request references exactly one tenant and one property.
Foreign keys use `NO ACTION`, so a tenant or property that still has requests cannot be deleted.

To get a PNG for the slides: paste `docs/ancu-rentals.dbml` into <https://dbdiagram.io> and export the image.
