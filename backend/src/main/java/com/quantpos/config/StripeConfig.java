package com.quantpos.config;

import com.stripe.Stripe;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
public class StripeConfig {

    @Value("${stripe.api-key}")
    private String apiKey;

    @Value("${stripe.webhook-secret}")
    private String webhookSecret;

    @Value("${stripe.prices.starter-monthly}")
    private String starterPriceMonthly;

    @Value("${stripe.prices.starter-yearly}")
    private String starterPriceYearly;

    @Value("${stripe.prices.growth-monthly}")
    private String growthPriceMonthly;

    @Value("${stripe.prices.growth-yearly}")
    private String growthPriceYearly;

    @Value("${stripe.prices.professional-monthly}")
    private String professionalPriceMonthly;

    @Value("${stripe.prices.professional-yearly}")
    private String professionalPriceYearly;

    @Value("${stripe.prices.enterprise-monthly}")
    private String enterprisePriceMonthly;

    @Value("${stripe.prices.enterprise-yearly}")
    private String enterprisePriceYearly;

    @PostConstruct
    public void init() {
        if (apiKey != null && !apiKey.isBlank()) {
            Stripe.apiKey = apiKey;
        }
    }
}
