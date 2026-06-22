package com.neomore.workshophub.repository;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.neomore.workshophub.model.EventRecord;
import com.neomore.workshophub.model.EventType;

public interface EventRepository extends JpaRepository<EventRecord, Long> {

    List<EventRecord> findBySessionIdOrderByTimestampDescIdDesc(String sessionId, Pageable pageable);

    boolean existsBySessionIdAndParticipantIdAndTaskIdAndEventType(
            String sessionId, String participantId, String taskId, EventType eventType);
}
