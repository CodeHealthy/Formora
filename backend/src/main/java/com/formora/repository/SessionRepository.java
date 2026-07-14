package com.formora.repository;

import com.formora.model.Session;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface SessionRepository extends MongoRepository<Session, String> {

    Optional<Session> findByTokenHash(String tokenHash);

    void deleteByTokenHash(String tokenHash);
}
