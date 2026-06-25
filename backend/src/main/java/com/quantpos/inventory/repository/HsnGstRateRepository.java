package com.quantpos.inventory.repository;

import com.quantpos.inventory.model.HsnGstRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HsnGstRateRepository extends JpaRepository<HsnGstRate, String> {
}
