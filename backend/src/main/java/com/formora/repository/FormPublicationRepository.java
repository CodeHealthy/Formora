package com.formora.repository;

import com.formora.model.FormPublication;
import java.util.Optional;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface FormPublicationRepository extends MongoRepository<FormPublication, String> {

    Optional<FormPublication> findByFormIdAndVersion(String formId, int version);

    List<FormPublication> findByFormIdOrderByVersionDesc(String formId);
}
