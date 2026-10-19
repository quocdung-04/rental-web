package com.example.demo.controller;

import com.example.demo.dto.TenantRequest;
import com.example.demo.entity.Tenant;
import com.example.demo.service.TenantService;
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

/** All tenant endpoints need the manager token (they contain personal data). */
@RestController
@RequestMapping("/api/tenants")
@Tag(name = "Tenants")
public class TenantController {

    private final TenantService service;

    public TenantController(TenantService service) {
        this.service = service;
    }

    @Operation(summary = "List / search tenants by name, email or phone")
    @GetMapping
    public List<Tenant> search(@RequestParam(required = false) String keyword) {
        return service.search(keyword);
    }

    @Operation(summary = "Get one tenant")
    @GetMapping("/{id}")
    public Tenant getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @Operation(summary = "Create a tenant")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Tenant create(@Valid @RequestBody TenantRequest request) {
        return service.create(request);
    }

    @Operation(summary = "Update a tenant")
    @PutMapping("/{id}")
    public Tenant update(@PathVariable Long id, @Valid @RequestBody TenantRequest request) {
        return service.update(id, request);
    }

    @Operation(summary = "Delete a tenant. Blocked while they still have maintenance requests.")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
