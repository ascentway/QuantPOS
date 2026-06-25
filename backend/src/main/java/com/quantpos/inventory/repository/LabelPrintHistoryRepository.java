package com.quantpos.inventory.repository;

import com.quantpos.inventory.model.LabelPrintHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LabelPrintHistoryRepository extends JpaRepository<LabelPrintHistory, UUID> {
    List<LabelPrintHistory> findAllByOrderByPrintedAtDesc();
}
