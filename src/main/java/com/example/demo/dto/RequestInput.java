package com.example.demo.dto;

import com.example.demo.entity.RequestCategory;
import com.example.demo.entity.RequestPriority;
import com.example.demo.entity.RequestStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Body used by the manager to create / update a maintenance request. */
public record RequestInput(
        @NotNull(message = "Tenant is required") Long tenantId,
        @NotNull(message = "Apartment is required") Long propertyId,
        @NotBlank(message = "Description is required")
        @Size(min = 10, max = 2000, message = "Description must be 10-2000 characters")
        String description,
        RequestStatus status,
        RequestCategory category,
        RequestPriority priority) {
}
