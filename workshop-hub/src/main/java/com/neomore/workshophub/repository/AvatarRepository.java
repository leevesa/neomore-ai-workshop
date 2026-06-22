package com.neomore.workshophub.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.neomore.workshophub.model.Avatar;

public interface AvatarRepository extends JpaRepository<Avatar, String> {

    Optional<Avatar> findByParticipantIdAndSessionId(String participantId, String sessionId);

    boolean existsByParticipantId(String participantId);
}
