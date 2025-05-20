package com.ohammer.apartner.global.initData;

import com.ohammer.apartner.Ut.Ut;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Profile("dev")
@Configuration
@RequiredArgsConstructor
public class DevInitData {

    @Bean
    public ApplicationRunner applicationRunner() {
        return args -> {
            Ut.file.downloadByHttp("http://localhost:8090/v3/api-docs/apiV1", ".");

            String cmd = "yes | npx --package typescript --package openapi-typescript openapi-typescript apiV1.json -o ../frontend/src/lib/backend/apiV1/schema.d.ts";
            Ut.cmd.runAsync(cmd);
        };
    }
}
