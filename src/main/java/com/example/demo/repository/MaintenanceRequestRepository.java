package com.example.demo.repository;

import com.example.demo.entity.MaintenanceRequest;
import com.example.demo.entity.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MaintenanceRequestRepository
        extends JpaRepository<MaintenanceRequest, Long>, JpaSpecificationExecutor<MaintenanceRequest> {

    long countByTenant_TenantId(Long tenantId);

    long countByProperty_PropertyId(Long propertyId);

    /** Requests of this apartment that are not finished yet (used to block marking it AVAILABLE). */
    long countByProperty_PropertyIdAndStatusNot(Long propertyId, RequestStatus status);

    /** True when the same tenant already has an unfinished request with the same text for the same apartment. */
    @Query("""
            SELECT COUNT(r) > 0 FROM MaintenanceRequest r
            WHERE r.tenant.tenantId = :tenantId
              AND r.property.propertyId = :propertyId
              AND LOWER(r.description) = LOWER(:description)
              AND r.status <> :done
              AND r.requestId <> :excludeId
            """)
    boolean existsOpenDuplicate(@Param("tenantId") Long tenantId,
                                @Param("propertyId") Long propertyId,
                                @Param("description") String description,
                                @Param("done") RequestStatus done,
                                @Param("excludeId") Long excludeId);
}
