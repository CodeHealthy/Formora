package com.formora.service;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.formora.common.ApiException;
import com.formora.model.WorkspaceMembership;
import com.formora.repository.WorkspaceMembershipRepository;
import com.formora.repository.WorkspaceRepository;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

class WorkspaceServiceTest {

    @Mock
    private WorkspaceRepository workspaceRepository;

    @Mock
    private WorkspaceMembershipRepository membershipRepository;

    private WorkspaceService workspaceService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        workspaceService = new WorkspaceService(workspaceRepository, membershipRepository);
    }

    @Test
    void viewerCanReadFormsButCannotCreateThem() {
        when(membershipRepository.findByWorkspaceIdAndUserId("workspace-id", "user-id"))
                .thenReturn(Optional.of(new WorkspaceMembership(
                        "workspace-id", "user-id", "viewer", Instant.now()
                )));

        assertThatCode(() -> workspaceService.requirePermission(
                "user-id", "workspace-id", WorkspaceService.Permission.FORMS_READ
        )).doesNotThrowAnyException();
        assertThatThrownBy(() -> workspaceService.requirePermission(
                "user-id", "workspace-id", WorkspaceService.Permission.FORMS_CREATE
        )).isInstanceOf(ApiException.class)
                .extracting(exception -> ((ApiException) exception).getCode())
                .isEqualTo("FORBIDDEN");
    }
}
