package com.ohammer.apartner.domain.apartment.repository;

import com.ohammer.apartner.domain.apartment.entity.Apartment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApartmentRepository extends JpaRepository<Apartment, Long> {

    @Query("SELECT a FROM Apartment a WHERE " +
           "((" +
           "  (:name IS NULL OR :name = '' OR LOWER(a.name) LIKE LOWER(CONCAT('%', :name, '%'))) OR " +
           "  (:address IS NULL OR :address = '' OR LOWER(a.address) LIKE LOWER(CONCAT('%', :address, '%')))" +
           ") AND " +
           " (:zipcode IS NULL OR :zipcode = '' OR a.zipcode LIKE CONCAT('%', :zipcode, '%'))" +
           ") ORDER BY a.createdAt DESC")
    Page<Apartment> findByCriteriaWithPage(@Param("name") String name,
                                           @Param("address") String address,
                                           @Param("zipcode") String zipcode,
                                           Pageable pageable);

    @Query("SELECT a FROM Apartment a WHERE " +
           "((" +
           "  (:name IS NULL OR :name = '' OR LOWER(a.name) LIKE LOWER(CONCAT('%', :name, '%'))) OR " +
           "  (:address IS NULL OR :address = '' OR LOWER(a.address) LIKE LOWER(CONCAT('%', :address, '%')))" +
           ") AND " +
           " (:zipcode IS NULL OR :zipcode = '' OR a.zipcode LIKE CONCAT('%', :zipcode, '%'))" +
           ") ORDER BY a.createdAt DESC")
    List<Apartment> findByCriteriaAsList(@Param("name") String name,
                                         @Param("address") String address,
                                         @Param("zipcode") String zipcode);
} 