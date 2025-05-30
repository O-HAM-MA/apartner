package com.ohammer.apartner;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class ApartnerApplication {
    public static void main(String[] args) {
        SpringApplication.run(ApartnerApplication.class, args);
    }

}
