package com.neomore.workshophub.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.neomore.workshophub.model.Participant;

public interface ParticipantRepository extends JpaRepository<Participant, String> {

    List<Participant> findBySessionIdOrderByConnectedAtAsc(String sessionId);

    Optional<Participant> findByIdAndSessionId(String id, String sessionId);
}
