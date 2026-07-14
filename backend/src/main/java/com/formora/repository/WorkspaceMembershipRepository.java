package com.formora.repository;

import com.formora.model.WorkspaceMembership;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface WorkspaceMembershipRepository extends MongoRepository<WorkspaceMembership, String> {

    Optional<WorkspaceMembership> findByWorkspaceIdAndUserId(String workspaceId, String userId);

    List<WorkspaceMembership> findByUserId(String userId);
}
