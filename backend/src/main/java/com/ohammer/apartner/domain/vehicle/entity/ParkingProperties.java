package com.ohammer.apartner.domain.vehicle.entity;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "parking")
public class ParkingProperties {

    private int maxCapacity;
}
