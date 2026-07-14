package com.formora.model;

import java.util.ArrayList;
import java.util.List;

public class FormField {

    private String id;
    private String type;
    private String label;
    private boolean required;
    private String placeholder;
    private List<String> options = new ArrayList<>();

    public FormField() {
    }

    public FormField(
            String id,
            String type,
            String label,
            boolean required,
            String placeholder,
            List<String> options
    ) {
        this.id = id;
        this.type = type;
        this.label = label;
        this.required = required;
        this.placeholder = placeholder;
        this.options = new ArrayList<>(options);
    }

    public String getId() {
        return id;
    }

    public String getType() {
        return type;
    }

    public String getLabel() {
        return label;
    }

    public boolean isRequired() {
        return required;
    }

    public String getPlaceholder() {
        return placeholder;
    }

    public List<String> getOptions() {
        return List.copyOf(options);
    }
}
