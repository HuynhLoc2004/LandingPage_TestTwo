package com.example.back_end.repository;

import com.example.back_end.entity.Cart;
import com.example.back_end.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {
    Optional<Cart> findByUser(UserEntity user);

    @Query("""
            select distinct c from Cart c
            left join fetch c.items i
            left join fetch i.product
            where c.user.id = :userId
            """)
    Optional<Cart> findByUserIdWithItems(@Param("userId") Long userId);
}
