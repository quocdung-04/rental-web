package com.example.demo.repository;

import com.example.demo.entity.Property;
import com.example.demo.entity.PropertyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PropertyRepository extends JpaRepository<Property, Long>, JpaSpecificationExecutor<Property> {

    long countByAvailabilityStatus(PropertyStatus status);

    boolean existsByAddressIgnoreCase(String address);

    boolean existsByAddressIgnoreCaseAndPropertyIdNot(String address, Long propertyId);

    @Query("SELECT DISTINCT p.district FROM Property p ORDER BY p.district")
    List<String> findDistinctDistricts();
}
