package com.example.demo.service;

import com.example.demo.dto.PropertyRequest;
import com.example.demo.dto.PropertyStats;
import com.example.demo.entity.Property;
import com.example.demo.entity.PropertyStatus;
import com.example.demo.entity.RequestStatus;
import com.example.demo.repository.MaintenanceRequestRepository;
import com.example.demo.repository.PropertyRepository;
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
public class PropertyService {

    private final PropertyRepository repository;
    private final MaintenanceRequestRepository requestRepository;

    public PropertyService(PropertyRepository repository, MaintenanceRequestRepository requestRepository) {
        this.repository = repository;
        this.requestRepository = requestRepository;
    }

    /** Search by keyword (title, address or district), district and availability. All filters are optional. */
    public List<Property> search(String keyword, String district, PropertyStatus status) {
        Specification<Property> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (keyword != null && !keyword.isBlank()) {
                String like = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), like),
                        cb.like(cb.lower(root.get("address")), like),
                        cb.like(cb.lower(root.get("district")), like)));
            }
            if (district != null && !district.isBlank()) {
                predicates.add(cb.equal(root.get("district"), district.trim()));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("availabilityStatus"), status));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return repository.findAll(spec, Sort.by(Sort.Direction.ASC, "propertyId"));
    }

    public Property getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Property " + id + " was not found"));
    }

    public PropertyStats stats() {
        return new PropertyStats(
                repository.count(),
                repository.countByAvailabilityStatus(PropertyStatus.AVAILABLE),
                repository.findDistinctDistricts());
    }

    @Transactional
    public Property create(PropertyRequest in) {
        String address = in.address().trim();
        if (repository.existsByAddressIgnoreCase(address)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A property with this address already exists");
        }
        Property p = new Property();
        apply(p, in, address);
        return repository.save(p);
    }

    @Transactional
    public Property update(Long id, PropertyRequest in) {
        Property p = getById(id);
        String address = in.address().trim();
        if (repository.existsByAddressIgnoreCaseAndPropertyIdNot(address, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Another property already uses this address");
        }
        // Rule: a rented apartment with unfinished maintenance requests cannot be switched to AVAILABLE.
        if (in.availabilityStatus() == PropertyStatus.AVAILABLE && p.getAvailabilityStatus() == PropertyStatus.RENTED) {
            long open = requestRepository.countByProperty_PropertyIdAndStatusNot(id, RequestStatus.DONE);
            if (open > 0) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Cannot mark this property as available: it still has " + open
                                + " unfinished maintenance request(s). Finish or delete them first.");
            }
        }
        apply(p, in, address);
        return repository.save(p);
    }

    @Transactional
    public void delete(Long id) {
        Property p = getById(id);
        long requests = requestRepository.countByProperty_PropertyId(id);
        if (requests > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cannot delete this property: it still has " + requests + " maintenance request(s). Delete those first.");
        }
        repository.delete(p);
    }

    private void apply(Property p, PropertyRequest in, String address) {
        p.setTitle(in.title().trim());
        p.setAddress(address);
        p.setDistrict(in.district().trim());
        p.setMonthlyRent(in.monthlyRent());
        p.setAvailabilityStatus(in.availabilityStatus());
        p.setBedrooms(in.bedrooms());
        p.setBathrooms(in.bathrooms());
        p.setAreaSqm(in.areaSqm());
        p.setDescription(in.description() == null || in.description().isBlank() ? null : in.description().trim());
        p.setImageUrl(in.imageUrl() == null || in.imageUrl().isBlank() ? null : in.imageUrl().trim());
    }
}
