package com.example.demo.dto;

import java.util.Map;

/** Error body read by js/api.js: {@code message} is shown to the user, {@code errors} maps field name to message. */
public record ApiError(int status, String message, Map<String, String> errors) {

    public static ApiError of(int status, String message) {
        return new ApiError(status, message, null);
    }
}
