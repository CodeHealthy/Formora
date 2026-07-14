package com.formora.repository;

import com.formora.model.GuestAccessToken;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface GuestAccessTokenRepository extends MongoRepository<GuestAccessToken, String> {

    Optional<GuestAccessToken> findByTokenHash(String tokenHash);

    void deleteByFormId(String formId);
}
