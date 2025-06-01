package com.ohammer.apartner.security;

import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${file.upload-dir:${user.home}/hakple-uploads}")
    private String uploadDir;

    @Value("${custom.site.frontUrl}")
    private String frontUrl;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String absoluteUploadPath;
        if (uploadDir.startsWith("./") || uploadDir.startsWith(".\\")) {
            String userHome = System.getProperty("user.home");
            absoluteUploadPath = userHome + "/hakple-uploads";
        } else {
            absoluteUploadPath = uploadDir;
        }
        String location = absoluteUploadPath.startsWith("file:") ?
                absoluteUploadPath : "file:" + absoluteUploadPath + "/";
        System.out.println("정적 리소스 매핑: /uploads/** -> " + location);
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(location)
                .setCachePeriod(3600);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns(frontUrl)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
        System.out.println("==================================");
        System.out.println("CORS 설정됨");
        System.out.println("허용 오리진: " + frontUrl);
        System.out.println("==================================");
    }

    @PersistenceContext
    private EntityManager entityManager;

    @Bean
    public JPAQueryFactory jpaQueryFactory() {
        return new JPAQueryFactory(entityManager);
    }
}

