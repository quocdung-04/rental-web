package com.example.demo.dto;

import java.util.List;

/** Numbers shown under the homepage search bar, plus the district list for the dropdown. */
public record PropertyStats(long totalProperties, long availableProperties, List<String> districts) {
}
