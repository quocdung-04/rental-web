-- Run this in SQL Server Management Studio (SSMS) if you prefer to create everything by hand.
-- Spring Boot runs the same table definitions automatically, so this file is optional.
IF DB_ID(N'ancu_rentals') IS NULL
    CREATE DATABASE ancu_rentals;
GO

USE ancu_rentals;
GO

IF OBJECT_ID(N'dbo.tenants', N'U') IS NULL
CREATE TABLE dbo.tenants (
    tenant_id  BIGINT        IDENTITY(1,1) NOT NULL,
    full_name  NVARCHAR(100) NOT NULL,
    email      VARCHAR(100)  NOT NULL,
    phone      VARCHAR(15)   NOT NULL,
    CONSTRAINT pk_tenants PRIMARY KEY (tenant_id),
    CONSTRAINT uk_tenants_email UNIQUE (email)
);
GO

IF OBJECT_ID(N'dbo.properties', N'U') IS NULL
CREATE TABLE dbo.properties (
    property_id         BIGINT        IDENTITY(1,1) NOT NULL,
    address             NVARCHAR(255) NOT NULL,
    monthly_rent        DECIMAL(14,2) NOT NULL,
    availability_status VARCHAR(20)   NOT NULL DEFAULT 'AVAILABLE',
    -- extra fields used by the homepage cards (agree these with the team)
    title               NVARCHAR(120) NOT NULL,
    district            NVARCHAR(60)  NOT NULL,
    bedrooms            INT           NOT NULL DEFAULT 1,
    bathrooms           INT           NOT NULL DEFAULT 1,
    area_sqm            INT           NOT NULL,
    image_url           VARCHAR(255)  NULL,
    description         NVARCHAR(1000) NULL,
    CONSTRAINT pk_properties PRIMARY KEY (property_id),
    CONSTRAINT uk_properties_address UNIQUE (address),
    CONSTRAINT chk_properties_rent CHECK (monthly_rent > 0),
    CONSTRAINT chk_properties_status CHECK (availability_status IN ('AVAILABLE', 'RENTED'))
);
GO

IF OBJECT_ID(N'dbo.maintenance_requests', N'U') IS NULL
CREATE TABLE dbo.maintenance_requests (
    request_id  BIGINT        IDENTITY(1,1) NOT NULL,
    tenant_id   BIGINT        NOT NULL,
    property_id BIGINT        NOT NULL,
    description NVARCHAR(2000) NOT NULL,
    -- extra fields for the repair workflow
    status      VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    category    VARCHAR(30)   NOT NULL DEFAULT 'OTHER',
    priority    VARCHAR(10)   NOT NULL DEFAULT 'NORMAL',
    reference_code VARCHAR(20) NULL,
    created_at  DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT pk_maintenance_requests PRIMARY KEY (request_id),
    -- NO ACTION: a tenant or property that still has requests cannot be deleted
    CONSTRAINT fk_requests_tenant   FOREIGN KEY (tenant_id)   REFERENCES dbo.tenants (tenant_id),
    CONSTRAINT fk_requests_property FOREIGN KEY (property_id) REFERENCES dbo.properties (property_id),
    CONSTRAINT chk_requests_status CHECK (status IN ('PENDING', 'IN_PROGRESS', 'DONE')),
    CONSTRAINT chk_requests_category CHECK (category IN ('PLUMBING', 'ELECTRICAL', 'AIR_CONDITIONING', 'APPLIANCES', 'STRUCTURE', 'PEST_CONTROL', 'OTHER')),
    CONSTRAINT chk_requests_priority CHECK (priority IN ('LOW', 'NORMAL', 'HIGH'))
);
GO

-- Upgrade for databases created by an earlier version (no-ops on a fresh database)
IF COL_LENGTH(N'dbo.maintenance_requests', N'category') IS NULL
ALTER TABLE dbo.maintenance_requests ADD category VARCHAR(30) NOT NULL CONSTRAINT df_requests_category DEFAULT 'OTHER';
GO

IF COL_LENGTH(N'dbo.maintenance_requests', N'priority') IS NULL
ALTER TABLE dbo.maintenance_requests ADD priority VARCHAR(10) NOT NULL CONSTRAINT df_requests_priority DEFAULT 'NORMAL';
GO

IF COL_LENGTH(N'dbo.maintenance_requests', N'reference_code') IS NULL
ALTER TABLE dbo.maintenance_requests ADD reference_code VARCHAR(20) NULL;
GO

IF OBJECT_ID(N'dbo.chk_requests_category', N'C') IS NULL
ALTER TABLE dbo.maintenance_requests ADD CONSTRAINT chk_requests_category CHECK (category IN ('PLUMBING', 'ELECTRICAL', 'AIR_CONDITIONING', 'APPLIANCES', 'STRUCTURE', 'PEST_CONTROL', 'OTHER'));
GO

IF OBJECT_ID(N'dbo.chk_requests_priority', N'C') IS NULL
ALTER TABLE dbo.maintenance_requests ADD CONSTRAINT chk_requests_priority CHECK (priority IN ('LOW', 'NORMAL', 'HIGH'));
GO

IF (SELECT max_length FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.maintenance_requests') AND name = N'description') < 4000
ALTER TABLE dbo.maintenance_requests ALTER COLUMN description NVARCHAR(2000) NOT NULL;
GO

