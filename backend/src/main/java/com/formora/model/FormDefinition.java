package com.formora.model;

import java.util.ArrayList;
import java.util.List;

public class FormDefinition {

    private int schemaVersion = 1;
    private List<FormField> fields = new ArrayList<>();

    public FormDefinition() {
    }

    public FormDefinition(int schemaVersion, List<FormField> fields) {
        this.schemaVersion = schemaVersion;
        this.fields = new ArrayList<>(fields);
    }

    public static FormDefinition empty() {
        return new FormDefinition(1, List.of());
    }

    public int getSchemaVersion() {
        return schemaVersion;
    }

    public List<FormField> getFields() {
        return List.copyOf(fields);
    }
}
