package com.example.back_end.mapper;

import com.example.back_end.dto.request.UserRegisterRequest;
import com.example.back_end.entity.UserEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface UserMapper {
    UserMapper INSTANCE = Mappers.getMapper(UserMapper.class);

    @Mapping(target = "password", ignore = true) // Password will be encoded in service layer
    UserEntity toUserEntity(UserRegisterRequest request);
}