package com.example.demo.controller;

import com.example.demo.dto.ReportRequest;
import com.example.demo.dto.RequestInput;
import com.example.demo.dto.RequestResponse;
import com.example.demo.entity.RequestStatus;
import com.example.demo.service.MaintenanceRequestService;
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
@RequestMapping("/api")
@Tag(name = "Maintenance requests")
public class MaintenanceRequestController {

    private final MaintenanceRequestService service;

    public MaintenanceRequestController(MaintenanceRequestService service) {
        this.service = service;
    }

    @Operation(summary = "Public: report an issue. Creates the tenant if the email is new, then a PENDING request.")
    @PostMapping("/reports")
    @ResponseStatus(HttpStatus.CREATED)
    public RequestResponse report(@Valid @RequestBody ReportRequest request) {
        return service.report(request);
    }

    @Operation(summary = "List / search requests (manager)")
    @GetMapping("/maintenance-requests")
    public List<RequestResponse> search(@RequestParam(required = false) String keyword,
                                        @RequestParam(required = false) RequestStatus status,
                                        @RequestParam(required = false) Long propertyId,
                                        @RequestParam(required = false) Long tenantId) {
        return service.search(keyword, status, propertyId, tenantId);
    }

    @Operation(summary = "Get one request (manager)")
    @GetMapping("/maintenance-requests/{id}")
    public RequestResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @Operation(summary = "Create a request (manager)")
    @PostMapping("/maintenance-requests")
    @ResponseStatus(HttpStatus.CREATED)
    public RequestResponse create(@Valid @RequestBody RequestInput request) {
        return service.create(request);
    }

    @Operation(summary = "Update a request (manager). A Done request is locked.")
    @PutMapping("/maintenance-requests/{id}")
    public RequestResponse update(@PathVariable Long id, @Valid @RequestBody RequestInput request) {
        return service.update(id, request);
    }

    @Operation(summary = "Delete a request (manager)")
    @DeleteMapping("/maintenance-requests/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
