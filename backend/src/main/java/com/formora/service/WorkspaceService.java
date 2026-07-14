package com.formora.service;

import com.formora.common.ApiException;
import com.formora.model.User;
import com.formora.model.UserRole;
import com.formora.model.Workspace;
import com.formora.model.WorkspaceMembership;
import com.formora.repository.WorkspaceMembershipRepository;
import com.formora.repository.WorkspaceRepository;
import java.time.Instant;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMembershipRepository membershipRepository;

    public WorkspaceService(
            WorkspaceRepository workspaceRepository,
            WorkspaceMembershipRepository membershipRepository
    ) {
        this.workspaceRepository = workspaceRepository;
        this.membershipRepository = membershipRepository;
    }

    public WorkspaceView create(User user, String name) {
        requireFormCreator(user);
        Instant now = Instant.now();
        Workspace workspace = workspaceRepository.save(new Workspace(name.trim(), user.getId(), now));
        membershipRepository.save(new WorkspaceMembership(workspace.getId(), user.getId(), "owner", now));
        return new WorkspaceView(workspace, "owner");
    }

    public List<WorkspaceView> list(User user) {
        requireFormCreator(user);
        if (user.getRole() == UserRole.ADMIN) {
            return workspaceRepository.findAll().stream()
                    .map(workspace -> new WorkspaceView(workspace, "admin"))
                    .sorted(Comparator.comparing((WorkspaceView view) -> view.workspace().getUpdatedAt()).reversed())
                    .toList();
        }
        List<WorkspaceMembership> memberships = membershipRepository.findByUserId(user.getId());
        Map<String, WorkspaceMembership> byWorkspace = memberships.stream().collect(Collectors.toMap(
                WorkspaceMembership::getWorkspaceId, Function.identity()
        ));
        return workspaceRepository.findAllById(byWorkspace.keySet()).stream()
                .map(workspace -> new WorkspaceView(workspace, byWorkspace.get(workspace.getId()).getRole()))
                .sorted(Comparator.comparing((WorkspaceView view) -> view.workspace().getUpdatedAt()).reversed())
                .toList();
    }

    public WorkspaceView get(User user, String workspaceId) {
        requireFormCreator(user);
        if (user.getRole() == UserRole.ADMIN) {
            Workspace workspace = workspaceRepository.findById(workspaceId).orElseThrow(() -> new ApiException(
                    "WORKSPACE_NOT_FOUND", "The requested workspace was not found.", HttpStatus.NOT_FOUND
            ));
            return new WorkspaceView(workspace, "admin");
        }
        WorkspaceMembership membership = requireMembership(user.getId(), workspaceId);
        Workspace workspace = workspaceRepository.findById(workspaceId).orElseThrow(() -> new ApiException(
                "WORKSPACE_NOT_FOUND", "The requested workspace was not found.", HttpStatus.NOT_FOUND
        ));
        return new WorkspaceView(workspace, membership.getRole());
    }

    public void requirePermission(User user, String workspaceId, Permission permission) {
        requireFormCreator(user);
        if (user.getRole() == UserRole.ADMIN) {
            return;
        }
        WorkspaceMembership membership = requireMembership(user.getId(), workspaceId);
        Role role;
        try {
            role = Role.valueOf(membership.getRole().toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw forbidden();
        }
        if (!role.permissions.contains(permission)) {
            throw forbidden();
        }
    }

    private void requireFormCreator(User user) {
        if (user.getRole() == UserRole.GUEST) {
            throw forbidden();
        }
    }

    private WorkspaceMembership requireMembership(String userId, String workspaceId) {
        return membershipRepository.findByWorkspaceIdAndUserId(workspaceId, userId)
                .orElseThrow(this::forbidden);
    }

    private ApiException forbidden() {
        return new ApiException("FORBIDDEN", "You do not have permission to access this workspace.", HttpStatus.FORBIDDEN);
    }

    public enum Permission {
        FORMS_CREATE,
        FORMS_READ,
        FORMS_UPDATE,
        FORMS_DELETE
    }

    private enum Role {
        OWNER(EnumSet.allOf(Permission.class)),
        ADMIN(EnumSet.allOf(Permission.class)),
        EDITOR(EnumSet.of(Permission.FORMS_CREATE, Permission.FORMS_READ, Permission.FORMS_UPDATE)),
        VIEWER(EnumSet.of(Permission.FORMS_READ));

        private final EnumSet<Permission> permissions;

        Role(EnumSet<Permission> permissions) {
            this.permissions = permissions;
        }
    }

    public record WorkspaceView(Workspace workspace, String role) {
    }
}
