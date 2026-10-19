package com.example.demo.service;

import com.example.demo.dto.ReportRequest;
import com.example.demo.dto.RequestInput;
import com.example.demo.dto.RequestResponse;
import com.example.demo.entity.MaintenanceRequest;
import com.example.demo.entity.Property;
import com.example.demo.entity.PropertyStatus;
import com.example.demo.entity.RequestCategory;
import com.example.demo.entity.RequestPriority;
import com.example.demo.entity.RequestStatus;
import com.example.demo.entity.Tenant;
import com.example.demo.repository.MaintenanceRequestRepository;
import com.example.demo.repository.PropertyRepository;
import com.example.demo.repository.TenantRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

/**
 * Project-specific rules enforced here:
 * 1. A request can only be filed for a RENTED apartment (an available one has no tenant to report from).
 * 2. A tenant cannot file the same unfinished issue twice for the same apartment.
 * 3. A request that is DONE is locked: it can be deleted but not edited.
 * (Deleting a tenant / property that still has requests is blocked in TenantService / PropertyService.)
 */
@Service
@Transactional(readOnly = true)
public class MaintenanceRequestService {

    private final MaintenanceRequestRepository repository;
    private final TenantRepository tenantRepository;
    private final PropertyRepository propertyRepository;

    public MaintenanceRequestService(MaintenanceRequestRepository repository,
                                     TenantRepository tenantRepository,
                                     PropertyRepository propertyRepository) {
        this.repository = repository;
        this.tenantRepository = tenantRepository;
        this.propertyRepository = propertyRepository;
    }

    /** Search by keyword (description, tenant name, apartment title or address), status, apartment and tenant. */
    public List<RequestResponse> search(String keyword, RequestStatus status, Long propertyId, Long tenantId) {
        Specification<MaintenanceRequest> spec = (root, query, cb) -> {
            Join<MaintenanceRequest, Tenant> tenant = root.join("tenant");
            Join<MaintenanceRequest, Property> property = root.join("property");
            List<Predicate> predicates = new ArrayList<>();
            if (keyword != null && !keyword.isBlank()) {
                String like = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("description")), like),
                        cb.like(cb.lower(tenant.get("fullName")), like),
                        cb.like(cb.lower(property.get("title")), like),
                        cb.like(cb.lower(property.get("address")), like)));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (propertyId != null) {
                predicates.add(cb.equal(property.get("propertyId"), propertyId));
            }
            if (tenantId != null) {
                predicates.add(cb.equal(tenant.get("tenantId"), tenantId));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return repository.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(RequestResponse::from)
                .toList();
    }

    public RequestResponse getById(Long id) {
        return RequestResponse.from(find(id));
    }

    @Transactional
    public RequestResponse create(RequestInput in) {
        Tenant tenant = findTenant(in.tenantId());
        Property property = findProperty(in.propertyId());
        RequestStatus status = in.status() == null ? RequestStatus.PENDING : in.status();
        String description = in.description().trim();
        RequestCategory category = in.category() == null ? RequestCategory.OTHER : in.category();
        RequestPriority priority = in.priority() == null ? RequestPriority.NORMAL : in.priority();
        checkRules(tenant, property, description, status, -1L, true);
        return RequestResponse.from(save(tenant, property, description, status, category, priority));
    }

    @Transactional
    public RequestResponse update(Long id, RequestInput in) {
        MaintenanceRequest r = find(id);
        if (r.getStatus() == RequestStatus.DONE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This request is already Done and can no longer be edited. Delete it if it was created by mistake.");
        }
        Tenant tenant = findTenant(in.tenantId());
        Property property = findProperty(in.propertyId());
        RequestStatus status = in.status() == null ? r.getStatus() : in.status();
        String description = in.description().trim();
        boolean apartmentChanged = !property.getPropertyId().equals(r.getProperty().getPropertyId());
        checkRules(tenant, property, description, status, id, apartmentChanged);
        r.setTenant(tenant);
        r.setProperty(property);
        r.setDescription(description);
        r.setStatus(status);
        if (in.category() != null) { r.setCategory(in.category()); }
        if (in.priority() != null) { r.setPriority(in.priority()); }
        return RequestResponse.from(repository.save(r));
    }

    @Transactional
    public void delete(Long id) {
        repository.delete(find(id));
    }

    /** Public "report an issue" flow: reuse the tenant with this email, or create one, then file a PENDING request. */
    @Transactional
    public RequestResponse report(ReportRequest in) {
        Property property = findProperty(in.propertyId());
        String email = in.email().trim().toLowerCase();
        Tenant tenant = tenantRepository.findByEmailIgnoreCase(email).orElseGet(() -> {
            Tenant t = new Tenant();
            t.setFullName(in.fullName().trim());
            t.setEmail(email);
            t.setPhone(in.phone().trim());
            return tenantRepository.save(t);
        });
        String description = in.description().trim();
        checkRules(tenant, property, description, RequestStatus.PENDING, -1L, true);
        return RequestResponse.from(save(tenant, property, description, RequestStatus.PENDING,
                in.category(), in.priority()));
    }

    private MaintenanceRequest save(Tenant tenant, Property property, String description, RequestStatus status,
                                    RequestCategory category, RequestPriority priority) {
        MaintenanceRequest r = new MaintenanceRequest();
        r.setTenant(tenant);
        r.setProperty(property);
        r.setDescription(description);
        r.setStatus(status);
        r.setCategory(category);
        r.setPriority(priority);
        MaintenanceRequest saved = repository.save(r);
        // The reference code is derived from the generated id, e.g. MR-000012 (flushed with the transaction).
        saved.setReferenceCode(String.format("MR-%06d", saved.getRequestId()));
        return saved;
    }

    private void checkRules(Tenant tenant, Property property, String description, RequestStatus status,
                            Long excludeId, boolean mustBeRented) {
        if (mustBeRented && property.getAvailabilityStatus() != PropertyStatus.RENTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Maintenance requests can only be filed for rented apartments. \""
                            + property.getTitle() + "\" is currently available.");
        }
        if (status != RequestStatus.DONE && repository.existsOpenDuplicate(
                tenant.getTenantId(), property.getPropertyId(), description, RequestStatus.DONE, excludeId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This tenant already has an open request with the same description for this apartment.");
        }
    }

    private MaintenanceRequest find(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Maintenance request " + id + " was not found"));
    }

    private Tenant findTenant(Long id) {
        return tenantRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tenant " + id + " does not exist"));
    }

    private Property findProperty(Long id) {
        return propertyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Apartment " + id + " does not exist"));
    }
}
