package com.example.demo.service;

import com.example.demo.dto.TenantRequest;
import com.example.demo.entity.Tenant;
import com.example.demo.repository.MaintenanceRequestRepository;
import com.example.demo.repository.TenantRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class TenantService {

    private final TenantRepository repository;
    private final MaintenanceRequestRepository requestRepository;

    public TenantService(TenantRepository repository, MaintenanceRequestRepository requestRepository) {
        this.repository = repository;
        this.requestRepository = requestRepository;
    }

    /** Search by keyword (name, email or phone). The filter is optional. */
    public List<Tenant> search(String keyword) {
        Specification<Tenant> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (keyword != null && !keyword.isBlank()) {
                String like = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("fullName")), like),
                        cb.like(cb.lower(root.get("email")), like),
                        cb.like(root.get("phone"), like)));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return repository.findAll(spec, Sort.by(Sort.Direction.ASC, "tenantId"));
    }

    public Tenant getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant " + id + " was not found"));
    }

    @Transactional
    public Tenant create(TenantRequest in) {
        String email = in.email().trim().toLowerCase();
        if (repository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A tenant with this email already exists");
        }
        Tenant t = new Tenant();
        apply(t, in, email);
        return repository.save(t);
    }

    @Transactional
    public Tenant update(Long id, TenantRequest in) {
        Tenant t = getById(id);
        String email = in.email().trim().toLowerCase();
        if (repository.existsByEmailIgnoreCaseAndTenantIdNot(email, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Another tenant already uses this email");
        }
        apply(t, in, email);
        return repository.save(t);
    }

    @Transactional
    public void delete(Long id) {
        Tenant t = getById(id);
        long requests = requestRepository.countByTenant_TenantId(id);
        if (requests > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cannot delete this tenant: they still have " + requests + " maintenance request(s). Delete those first.");
        }
        repository.delete(t);
    }

    private void apply(Tenant t, TenantRequest in, String email) {
        t.setFullName(in.fullName().trim());
        t.setEmail(email);
        t.setPhone(in.phone().trim());
    }
}
