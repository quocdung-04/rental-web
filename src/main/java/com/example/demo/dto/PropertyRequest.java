package com.example.demo.dto;

import com.example.demo.entity.PropertyStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record PropertyRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 120, message = "Title must be at most 120 characters")
        String title,

        @NotBlank(message = "Address is required")
        @Size(max = 255, message = "Address must be at most 255 characters")
        String address,

        @NotBlank(message = "District is required")
        @Size(max = 60, message = "District must be at most 60 characters")
        String district,

        @NotNull(message = "Monthly rent is required")
        @DecimalMin(value = "0.0", inclusive = false, message = "Monthly rent must be greater than 0")
        @Digits(integer = 12, fraction = 2, message = "Monthly rent is too large")
        BigDecimal monthlyRent,

        @NotNull(message = "Availability status is required")
        PropertyStatus availabilityStatus,

        @NotNull(message = "Bedrooms is required")
        @Min(value = 0, message = "Bedrooms cannot be negative")
        @Max(value = 20, message = "Bedrooms must be 20 or fewer")
        Integer bedrooms,

        @NotNull(message = "Bathrooms is required")
        @Min(value = 0, message = "Bathrooms cannot be negative")
        @Max(value = 20, message = "Bathrooms must be 20 or fewer")
        Integer bathrooms,

        @NotNull(message = "Area is required")
        @Min(value = 1, message = "Area must be at least 1 m²")
        @Max(value = 5000, message = "Area must be 5000 m² or less")
        Integer areaSqm,

        @Size(max = 255, message = "Image path must be at most 255 characters")
        @Pattern(regexp = "^$|^(https?://|images/).+", message = "Image must be empty, start with images/ or be an http(s) link")
        String imageUrl,

        @Size(max = 1000, message = "Description must be at most 1000 characters")
        String description) {
}
