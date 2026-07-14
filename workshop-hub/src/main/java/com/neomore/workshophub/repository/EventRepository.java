package com.neomore.workshophub.repository;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.neomore.workshophub.model.EventRecord;
import com.neomore.workshophub.model.EventType;

public interface EventRepository extends JpaRepository<EventRecord, Long> {

    List<EventRecord> findAllByOrderByTimestampDescIdDesc(Pageable pageable);

    boolean existsByParticipantIdAndTaskIdAndEventType(
            String participantId, String taskId, EventType eventType);
}
