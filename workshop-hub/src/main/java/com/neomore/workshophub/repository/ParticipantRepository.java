package com.neomore.workshophub.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.neomore.workshophub.model.Participant;

public interface ParticipantRepository extends JpaRepository<Participant, String> {

    List<Participant> findAllByOrderByConnectedAtAsc();
}
