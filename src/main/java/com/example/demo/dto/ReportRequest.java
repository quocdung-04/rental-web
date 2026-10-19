package com.example.demo.dto;

import com.example.demo.entity.RequestCategory;
import com.example.demo.entity.RequestPriority;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Body of the public "report an issue" form: who is reporting, where, and what is wrong. */
public record ReportRequest(
        @NotBlank(message = "Full name is required")
        @Size(max = 100, message = "Full name must be at most 100 characters")
        String fullName,

        @NotBlank(message = "Email is required")
        @Email(message = "Enter a valid email address")
        @Size(max = 100, message = "Email must be at most 100 characters")
        String email,

        @NotBlank(message = "Phone is required")
        @Pattern(regexp = "^\\+?[0-9]{9,14}$", message = "Phone must be 9-14 digits, optionally starting with +")
        String phone,

        @NotNull(message = "Please choose your apartment")
        Long propertyId,

        @NotNull(message = "Please choose a category")
        RequestCategory category,

        @NotNull(message = "Please choose a priority")
        RequestPriority priority,

        @NotBlank(message = "Please describe the problem")
        @Size(min = 10, max = 2000, message = "Description must be 10-2000 characters")
        String description) {
}
