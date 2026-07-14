package com.formora.repository;

import com.formora.model.FormSubmission;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface FormSubmissionRepository extends MongoRepository<FormSubmission, String> {
}
