package com.formora.repository;

import com.formora.model.User;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByEmailNormalized(String emailNormalized);

    boolean existsByEmailNormalized(String emailNormalized);
}
