package com.neomore.workshophub.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.neomore.workshophub.model.Session;

public interface SessionRepository extends JpaRepository<Session, String> {
}
