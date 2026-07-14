package com.formora.service;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.formora.common.ApiException;
import com.formora.model.WorkspaceMembership;
import com.formora.model.User;
import com.formora.model.UserRole;
import com.formora.repository.WorkspaceMembershipRepository;
import com.formora.repository.WorkspaceRepository;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.test.util.ReflectionTestUtils;

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
        User user = user(UserRole.USER);
        when(membershipRepository.findByWorkspaceIdAndUserId("workspace-id", "user-id"))
                .thenReturn(Optional.of(new WorkspaceMembership(
                        "workspace-id", "user-id", "viewer", Instant.now()
                )));

        assertThatCode(() -> workspaceService.requirePermission(
                user, "workspace-id", WorkspaceService.Permission.FORMS_READ
        )).doesNotThrowAnyException();
        assertThatThrownBy(() -> workspaceService.requirePermission(
                user, "workspace-id", WorkspaceService.Permission.FORMS_CREATE
        )).isInstanceOf(ApiException.class)
                .extracting(exception -> ((ApiException) exception).getCode())
                .isEqualTo("FORBIDDEN");
    }

    @Test
    void platformAdministratorBypassesWorkspaceMembership() {
        User administrator = user(UserRole.ADMIN);

        assertThatCode(() -> workspaceService.requirePermission(
                administrator, "workspace-id", WorkspaceService.Permission.FORMS_DELETE
        )).doesNotThrowAnyException();
    }

    @Test
    void guestCannotManageWorkspaceForms() {
        User guest = user(UserRole.GUEST);

        assertThatThrownBy(() -> workspaceService.requirePermission(
                guest, "workspace-id", WorkspaceService.Permission.FORMS_READ
        )).isInstanceOf(ApiException.class)
                .extracting(exception -> ((ApiException) exception).getCode())
                .isEqualTo("FORBIDDEN");
    }

    private User user(UserRole role) {
        User user = new User("Ada", "ada@example.com", "hash", role, Instant.now());
        ReflectionTestUtils.setField(user, "id", "user-id");
        return user;
    }
}
