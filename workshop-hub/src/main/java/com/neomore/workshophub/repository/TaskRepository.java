package com.neomore.workshophub.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.neomore.workshophub.model.Task;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findBySessionIdOrderByOrdinalAsc(String sessionId);

    boolean existsBySessionId(String sessionId);
}
