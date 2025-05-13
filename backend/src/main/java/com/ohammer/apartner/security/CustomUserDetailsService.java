package com.ohammer.apartner.security;

import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.domain.user.repository.UserRepository;
import com.ohammer.apartner.global.Status;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository; // User 엔티티 DB 접근

    @Override
    public UserDetails loadUserByUsername(String username) {
        // username으로 User + Role 조회, CustomUserDetails로 래핑
        log.debug("Attempting to load user by username: {}", username);
        User user = userRepository.findByUserNameWithRoles(username)
                .orElseThrow(() -> {
                    log.warn("User not found with username: {}", username);
                    return new UsernameNotFoundException("User not found with username: " + username);
                });
        log.info("User found: {}", user.getUserName());
        return new com.ohammer.apartner.security.CustomUserDetails(user);
    }

    
    @Getter
    public static class CustomUserDetails implements UserDetails {
        private final String username;
        private final String nickname;
        private final Status status;
        private final List<GrantedAuthority> authorities;

        public CustomUserDetails(String username, String nickname, Status status, List<GrantedAuthority> roles) {
            this.username = username;
            this.nickname = nickname;
            this.status = status;
            this.authorities = roles;
        }

        @Override
        public Collection<? extends GrantedAuthority> getAuthorities() {
            return this.authorities;
        }

        @Override
        public String getPassword() {
            return "";
        }

        @Override
        public String getUsername() {
            return this.username;
        }

        @Override
        public boolean isAccountNonExpired() {
            return true;
        }

        @Override
        public boolean isAccountNonLocked() {
            return true;
        }

        @Override
        public boolean isCredentialsNonExpired() {
            return true;
        }

        @Override
        public boolean isEnabled() {
            return true;
        }
    }
    
}
