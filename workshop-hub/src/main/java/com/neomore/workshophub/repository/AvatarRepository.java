package com.neomore.workshophub.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.neomore.workshophub.model.Avatar;

public interface AvatarRepository extends JpaRepository<Avatar, String> {
}
