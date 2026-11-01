package dev.santiagosantofimio.breachroom;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class BreachRoomApplication {

    public static void main(String[] args) {
        SpringApplication.run(BreachRoomApplication.class, args);
    }
}
