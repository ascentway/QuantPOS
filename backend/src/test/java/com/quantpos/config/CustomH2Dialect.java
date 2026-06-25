package com.quantpos.config;

import org.hibernate.boot.model.TypeContributions;
import org.hibernate.dialect.H2Dialect;
import org.hibernate.service.ServiceRegistry;
import org.hibernate.type.SqlTypes;
import org.hibernate.type.descriptor.jdbc.VarcharJdbcType;
import org.hibernate.type.descriptor.jdbc.spi.JdbcTypeRegistry;

public class CustomH2Dialect extends H2Dialect {
    @Override
    public void contributeTypes(TypeContributions typeContributions, ServiceRegistry serviceRegistry) {
        super.contributeTypes(typeContributions, serviceRegistry);
        JdbcTypeRegistry jdbcTypeRegistry = typeContributions.getTypeConfiguration().getJdbcTypeRegistry();
        
        jdbcTypeRegistry.addDescriptor(new VarcharJdbcType() {
            @Override
            public int getDdlTypeCode() {
                return SqlTypes.NAMED_ENUM;
            }

            @Override
            public int getDefaultSqlTypeCode() {
                return SqlTypes.NAMED_ENUM;
            }
        });
    }
}
