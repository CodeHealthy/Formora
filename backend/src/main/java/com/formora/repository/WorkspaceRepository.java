package com.formora.repository;

import com.formora.model.Workspace;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface WorkspaceRepository extends MongoRepository<Workspace, String> {
}
