package com.example.demo.dto;

import com.example.demo.entity.MaintenanceRequest;
import com.example.demo.entity.RequestCategory;
import com.example.demo.entity.RequestPriority;
import com.example.demo.entity.RequestStatus;

import java.time.LocalDateTime;

/** Flat view of a maintenance request, with the tenant and apartment names the manager table needs. */
public record RequestResponse(
        Long requestId,
        String referenceCode,
        Long tenantId,
        String tenantName,
        String tenantEmail,
        String tenantPhone,
        Long propertyId,
        String propertyTitle,
        String propertyAddress,
        String description,
        RequestStatus status,
        RequestCategory category,
        RequestPriority priority,
        LocalDateTime createdAt) {

    public static RequestResponse from(MaintenanceRequest r) {
        return new RequestResponse(
                r.getRequestId(),
                r.getReferenceCode(),
                r.getTenant().getTenantId(),
                r.getTenant().getFullName(),
                r.getTenant().getEmail(),
                r.getTenant().getPhone(),
                r.getProperty().getPropertyId(),
                r.getProperty().getTitle(),
                r.getProperty().getAddress(),
                r.getDescription(),
                r.getStatus(),
                r.getCategory(),
                r.getPriority(),
                r.getCreatedAt());
    }
}
