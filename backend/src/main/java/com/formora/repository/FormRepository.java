package com.formora.repository;

import com.formora.model.Form;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface FormRepository extends MongoRepository<Form, String> {

    Page<Form> findByWorkspaceId(String workspaceId, Pageable pageable);

    Page<Form> findByWorkspaceIdAndStatusNot(String workspaceId, String status, Pageable pageable);
}
