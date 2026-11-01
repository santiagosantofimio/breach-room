package dev.santiagosantofimio.breachroom.config;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    public record HealthStatus(String status) {
    }

    @GetMapping("/api/health")
    public HealthStatus health() {
        return new HealthStatus("ok");
    }
}
