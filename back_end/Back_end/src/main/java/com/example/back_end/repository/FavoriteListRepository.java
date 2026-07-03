package com.example.back_end.repository;

import com.example.back_end.entity.FavoriteList;
import com.example.back_end.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FavoriteListRepository extends JpaRepository<FavoriteList, Long> {
    Optional<FavoriteList> findByUser(UserEntity user);

    @Query("""
            select distinct fl from FavoriteList fl
            left join fetch fl.products
            where fl.user.id = :userId
            """)
    Optional<FavoriteList> findByUserIdWithProducts(@Param("userId") Long userId);
}
