plugins {
    java
    id("org.springframework.boot") version "3.4.5"
    id("io.spring.dependency-management") version "1.1.7"
    id("com.avast.gradle.docker-compose") version "0.16.12" // ✅ 다른 플러그인 사용 (Palantir 아님)
}

group = "site.apartner"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

configurations {
    compileOnly {
        extendsFrom(configurations.annotationProcessor.get())
    }
}

repositories {
    mavenCentral()
}

dependencies {
// Spring Boot 기본 의존성
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-security") // security
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-data-redis")
    implementation("org.springframework.boot:spring-boot-starter-oauth2-client")
    implementation("org.springframework.boot:spring-boot-starter-mail")

    // Lombok
    compileOnly("org.projectlombok:lombok")
    annotationProcessor("org.projectlombok:lombok")

    // 개발 및 실행환경 관련
    developmentOnly("org.springframework.boot:spring-boot-devtools")
    developmentOnly("org.springframework.boot:spring-boot-docker-compose")

    // DB
    runtimeOnly("com.mysql:mysql-connector-j")
    runtimeOnly("com.h2database:h2")

    // Test
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.testcontainers:mysql:1.19.3")
    testImplementation("org.testcontainers:junit-jupiter:1.19.3")
    testImplementation("org.springframework.security:spring-security-test")

    // OpenAPI
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.6")

    // JSON 처리
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("com.google.code.gson:gson")

    // JWT
    implementation("io.jsonwebtoken:jjwt-api:0.11.5")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.11.5")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.11.5")

    // QueryDSL (JPA 동적 쿼리 빌더)
    implementation("com.querydsl:querydsl-jpa:5.0.0:jakarta")
    annotationProcessor("com.querydsl:querydsl-apt:5.0.0:jakarta")
    annotationProcessor("jakarta.annotation:jakarta.annotation-api")
    annotationProcessor("jakarta.persistence:jakarta.persistence-api")

    // 외부 라이브러리
    implementation("net.nurigo:sdk:4.2.7") // 누리고 SDK
    implementation("org.jsoup:jsoup:1.17.2")
    implementation("org.springframework.cloud:spring-cloud-starter-aws:2.2.6.RELEASE")

    // Kotlin 지원
    implementation("org.jetbrains.kotlin:kotlin-reflect")
}

// Docker Compose 설정 (정상 작동되는 버전)
dockerCompose {
    useComposeFiles.set(listOf("docker-compose.yml"))
    startedServices.set(listOf("mysql"))
    isRequiredBy(tasks.named("bootRun")) // bootRun 실행 시 Docker Compose 자동 실행
    removeContainers.set(true)
    stopContainers.set(true)
    removeVolumes.set(true)
}

tasks.withType<Test> {
    useJUnitPlatform()
}

// bootRun 작업 종료 시 Docker Compose 정리
tasks.named("bootRun") {
    finalizedBy("dockerComposeDown") // bootRun 작업 종료 후 dockerComposeDown 실행
}
tasks.withType<JavaCompile> {
    options.compilerArgs.add("-parameters")
}
