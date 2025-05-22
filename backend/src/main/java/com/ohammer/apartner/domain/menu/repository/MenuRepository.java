package com.ohammer.apartner.domain.menu.repository;

import com.ohammer.apartner.domain.menu.entity.Menu;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MenuRepository extends JpaRepository<Menu, Long> {
    
    Optional<Menu> findByName(String name);
    
    Optional<Menu> findByUrl(String url);
    
    boolean existsByName(String name);
    
    boolean existsByUrl(String url);
    
    Page<Menu> findAll(Pageable pageable);
    
    @Query("SELECT m FROM Menu m ORDER BY m.id DESC")
    List<Menu> findAllMenusOrderById();
} 