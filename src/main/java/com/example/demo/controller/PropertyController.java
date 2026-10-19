package com.example.demo.controller;

import com.example.demo.dto.PropertyRequest;
import com.example.demo.dto.PropertyStats;
import com.example.demo.entity.Property;
import com.example.demo.entity.PropertyStatus;
import com.example.demo.service.PropertyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/properties")
@Tag(name = "Properties")
public class PropertyController {

    private final PropertyService service;

    public PropertyController(PropertyService service) {
        this.service = service;
    }

    @Operation(summary = "List / search properties (public)")
    @GetMapping
    public List<Property> search(@RequestParam(required = false) String keyword,
                                 @RequestParam(required = false) String district,
                                 @RequestParam(required = false) PropertyStatus status) {
        return service.search(keyword, district, status);
    }

    @Operation(summary = "Homepage numbers: total, available, district list (public)")
    @GetMapping("/stats")
    public PropertyStats stats() {
        return service.stats();
    }

    @Operation(summary = "Get one property (public)")
    @GetMapping("/{id}")
    public Property getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @Operation(summary = "Create a property (manager)")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Property create(@Valid @RequestBody PropertyRequest request) {
        return service.create(request);
    }

    @Operation(summary = "Update a property (manager)")
    @PutMapping("/{id}")
    public Property update(@PathVariable Long id, @Valid @RequestBody PropertyRequest request) {
        return service.update(id, request);
    }

    @Operation(summary = "Delete a property (manager). Blocked while it still has maintenance requests.")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
