package com.formora.dto;

import com.formora.model.FormAccessMode;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.Map;

public final class FormAccessDtos {

    private FormAccessDtos() {
    }

    public record FormAccessRequest(
            @NotNull FormAccessMode accessMode,
            @Size(min = 8, max = 128) String password
    ) {
    }

    public record FormAccessSettings(FormAccessMode accessMode, boolean passwordConfigured) {
    }

    public record FormAccessData(FormAccessSettings accessSettings) {
    }

    public record FormAccessResponse(FormAccessData data, Map<String, String> meta) {
    }
}
