package com.ohammer.apartner.security.config;


import jakarta.servlet.http.HttpServletResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.ohammer.apartner.security.jwt.JwtAuthFilter;
import com.ohammer.apartner.security.OAuth.CustomOAuth2SuccessHandler;
import com.ohammer.apartner.security.OAuth.CustomOAuth2RequestResolver;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.core.annotation.Order;
@Configuration
@Slf4j
@RequiredArgsConstructor
public class SecurityConfig {
    private final JwtAuthFilter jwtAuthFilter;
    private final CustomOAuth2SuccessHandler customOAuth2SuccessHandler;
    private final CustomOAuth2RequestResolver customOAuth2RequestResolver;

    @Order(2)
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity security) throws Exception {
        security
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                // OAuth2 및 스웨거 API 문서 테스트용은 http://localhost:3000
                                "/oauth2/authorization/kakao?redirectUrl=https://www.apartner.site",
                                "/swagger-ui/**", "/v3/api-docs/**", "/swagger-resources/**", "/webjars/**",

                                // 인증 관련 API
                                "/api/v1/auth/login",
                                "/api/v1/auth/logout",
                                "/api/v1/auth/**", // 인증 관련 글로벌 API 경로 추가
                                "/api/v1/apartments/**",
                                // 관리자 로그인/회원가입 관련 경로는 adminSecurityFilterChain에서 처리

                                "/api/v1/users/userreg",
                                "/api/v1/users/check-username",
                                "/api/v1/users/check-nickname",
                                "/api/v1/users/check-phonenum",

                                // 추가
                                "/api/v1/usernames/**",

                                "/api/v1/sms/**", // sms 경로는 여기에 유지
                                "/api/v1/vehicles/**",
                                "/api/v1/entry-records/**",


                                //암시로 넣어야징
                                "/api/v1/inspection/**"
                
                        ).permitAll()
                        // 관리자 전용 API -> adminSecurityFilterChain에서 처리하므로 이 부분은 제거됨
                        // .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")

                        // 나머지는 모두 인증 필요
                        .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json");
                            response.getWriter().write("{\"error\": \"로그인이 필요합니다\"}");
                        })
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED) // ⭐ OAuth2 흐름에서만 세션 생성 허용
                )
                .exceptionHandling(exception ->
                        exception.authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.getWriter().write("Unauthorized: Invalid or missing token");
                        })
                )
                .httpBasic(httpBasic -> httpBasic.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .formLogin(form -> form.disable())
                .oauth2Login(oauth2LoginConfig -> oauth2LoginConfig
                        .successHandler(customOAuth2SuccessHandler)
                        .authorizationEndpoint(endpoint -> endpoint
                                .authorizationRequestResolver(customOAuth2RequestResolver)
                        )
                );

        return security.build();

    }

    @Order(1)
    @Bean
    public SecurityFilterChain adminSecurityFilterChain(HttpSecurity security) throws Exception {
        security
                .securityMatcher("/api/v1/admin/**")
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/v1/admin/login",
                                "/api/v1/admin/check"
                        ).permitAll()
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            log.warn("Admin authentication failed for {} {}: {}", request.getMethod(), request.getRequestURI(), authException.getMessage());
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("{\"error\": \"관리자 인증이 필요합니다. 유효한 토큰을 포함해주세요.\"}");
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            log.warn("Admin access denied for {} {}: {}", request.getMethod(), request.getRequestURI(), accessDeniedException.getMessage());
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("{\"error\": \"관리자 권한이 없습니다.\"}");
                        })
                )
                .httpBasic(httpBasic -> httpBasic.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .formLogin(form -> form.disable());
                
        return security.build();
    }


    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        //해당 사이트와 매핑? 매치? 한다
        config.setAllowedOrigins(List.of("http://localhost:3000", "https://www.apartner.site"));
        config.addAllowedHeader("*");
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        //그리고 외부에서 가져온 credentials를 허용시킨다
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}

