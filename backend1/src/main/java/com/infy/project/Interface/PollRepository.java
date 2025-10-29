package com.infy.project.Interface;


import com.infy.project.model.*;

import com.infy.project.model.Poll;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PollRepository extends JpaRepository<Poll, Long> {
    List<Poll> findByGroupId(Long groupId);
}

