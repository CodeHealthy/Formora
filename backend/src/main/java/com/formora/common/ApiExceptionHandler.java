package com.formora.common;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger LOGGER = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    ResponseEntity<ErrorResponse> handleApiException(ApiException exception, HttpServletRequest request) {
        return ResponseEntity.status(exception.getStatus()).body(error(
                exception.getCode(), exception.getMessage(), null, request
        ));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErrorResponse> handleValidation(
            MethodArgumentNotValidException exception,
            HttpServletRequest request
    ) {
        List<Map<String, String>> details = exception.getBindingResult().getFieldErrors().stream()
                .map(field -> Map.of(
                        "field", field.getField(),
                        "message", field.getDefaultMessage() == null ? "Invalid value" : field.getDefaultMessage()
                ))
                .toList();
        return ResponseEntity.badRequest().body(error(
                "VALIDATION_ERROR", "The request contains invalid values.", details, request
        ));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ErrorResponse> handleUnreadableBody(HttpServletRequest request) {
        return ResponseEntity.badRequest().body(error(
                "VALIDATION_ERROR", "The request body is invalid.", null, request
        ));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    ResponseEntity<ErrorResponse> handleConstraintViolation(HttpServletRequest request) {
        return ResponseEntity.badRequest().body(error(
                "VALIDATION_ERROR", "The request contains invalid values.", null, request
        ));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ErrorResponse> handleUnexpected(Exception exception, HttpServletRequest request) {
        LOGGER.error("Unhandled request failure", exception);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error(
                "INTERNAL_ERROR", "An unexpected error occurred.", null, request
        ));
    }

    private ErrorResponse error(String code, String message, Object details, HttpServletRequest request) {
        return new ErrorResponse(new ErrorBody(
                code, message, details, ApiResponse.requestId(request)
        ));
    }

    public record ErrorResponse(ErrorBody error) {
    }

    public record ErrorBody(String code, String message, Object details, String requestId) {
    }
}
