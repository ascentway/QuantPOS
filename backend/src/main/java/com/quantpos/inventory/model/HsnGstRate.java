package com.quantpos.inventory.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "hsn_gst_rates")
@Getter
@Setter
public class HsnGstRate {

    @Id
    @Column(name = "hsn_code", length = 10)
    private String hsnCode;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(name = "gst_rate", nullable = false)
    private BigDecimal gstRate;
}
